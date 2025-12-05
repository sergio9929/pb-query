import { OPERATORS } from './constants'
import type {
    FilterFunction,
    OperatorMethod,
    Path,
    PathValue,
    QueryBuilder,
    QueryBuilderStart,
    QueryResult,
    RawQueryObject,
    RestrictedQueryBuilder,
} from './types'
import {
    cleanQuery,
    generateExpand,
    generateFields,
    generateSort,
    isDateMacro,
    prepareFieldsForExpand,
} from './utils'

/**
 * Builds a query to help listing records in [PocketBase](https://pocketbase.io/).
 *
 * By default, we don't filter your query. Using `.build()` returns the unfiltered query and values separately. This is useful if you want to use `pb-query` inside [PocketBase Hooks](https://pocketbase.io/docs/js-overview/), you can see how in the [tutorial](https://sergio9929.github.io/pb-query/getting-started/tutorial).
 *
 * @example
 * ```ts
 * const query = pbQuery<Post>()
 *   .like('content', 'Top Secret%')
 *   .build();
 *
 * console.log(query);
 * // {
 * //   fields: '',
 * //   expand: '',
 * //   sort: '',
 * //   filter: {
 * //     raw: 'content~{:content1}',
 * //     values: { content1: 'Top Secret%' }
 * //   }
 * // }
 * ```
 *
 * If you want to use `pb-query` in your app (this is the main usecase of `pb-query`), you need to filter it. We expose a filter function, but we recommend using the native `pb.filter()` function instead.
 *
 * @example
 * ```ts
 * import PocketBase from 'pocketbase';
 *
 * // PocketBase instance
 * const pb = new PocketBase("https://example.com");
 *
 * const queryA = pbQuery<Post>()
 *   .like('content', 'Top Secret%')
 *   .build(pb.filter); // use PocketBase's filter function
 *
 * console.log(queryA.filter);
 * // "content~'Top Secret%'"
 *
 * const queryB = pbQuery<Post>(pb.filter) // use PocketBase's filter function
 *   .like('content', 'Top Secret%')
 *   .build();
 *
 * console.log(queryB.filter);
 * // "content~'Top Secret%'"
 * ```
 *
 * You can override the filter function passed to `pbQuery()` passing another one to `.build()`.
 *
 * @example
 * ```ts
 * const query = pbQuery<Post>(pb.filter)
 *   .like('content', 'Top Secret%')
 *   .build(customFilter); // This has the priority
 * ```
 *
 * Read more about how to query in PocketBase in the [official documentation](https://pocketbase.io/docs/api-records/#listsearch-records) or about how to use `pb-query` in [our documentation](https://sergio9929.github.io/pb-query/).
 *
 * @since 0.4.0
 */
export function pbQuery<
    T = Record<string, unknown>,
    MaxDepth extends number = 6,
>(): QueryBuilderStart<T, MaxDepth>
export function pbQuery<
    T = Record<string, unknown>,
    MaxDepth extends number = 6,
>(globalFilter: FilterFunction): QueryBuilderStart<T, MaxDepth, true>
export function pbQuery<
    T = Record<string, unknown>,
    MaxDepth extends number = 6,
>(globalFilter?: FilterFunction): QueryBuilderStart<T, MaxDepth, boolean> {
    let query = ''
    let fields = ''
    let expand = ''
    let sort = ''

    const keyCounter = new Map<Path<T, MaxDepth>, number>()
    const valueMap = new Map<string, unknown>()

    const incrementKeyCounter = (key: Path<T, MaxDepth>) => {
        const count = keyCounter.get(key) || 0
        const newCount = count + 1
        keyCounter.set(key, newCount)

        return newCount
    }

    const saveValue = <P extends Path<T, MaxDepth>>(
        key: P,
        value: PathValue<T, P, MaxDepth>,
    ) => {
        const count = incrementKeyCounter(key)
        const newName = `${String(key)}${count}`
        valueMap.set(newName, value)

        return newName
    }

    const expression = <P extends Path<T, MaxDepth>>(
        key: P,
        operator: string,
        value: PathValue<T, P, MaxDepth>,
    ) => {
        if (isDateMacro(value)) {
            query += `${String(key)}${operator}${value}`
        } else {
            const newName = saveValue(key, value)
            query += `${String(key)}${operator}{:${newName}}`
        }
    }

    type BuilderFunction = <P extends Path<T, MaxDepth>>(
        key: P,
        values: PathValue<T, P, MaxDepth>,
    ) => RestrictedQueryBuilder<T, MaxDepth>

    const builderFunctions = {} as Record<OperatorMethod, BuilderFunction>
    for (const [name, operator] of Object.entries(OPERATORS)) {
        const key = name as OperatorMethod
        builderFunctions[key] = <P extends Path<T, MaxDepth>>(
            key: P,
            value: PathValue<T, P, MaxDepth>,
        ) => {
            expression(key, operator, value)
            return restrictedQueryBuilder
        }
    }

    function build(): QueryResult<RawQueryObject>
    function build(filter: FilterFunction): QueryResult<string>
    function build(
        filter?: FilterFunction,
    ): QueryResult<RawQueryObject | string> {
        const cleanedQuery = cleanQuery(query)

        if (typeof filter === 'function') {
            return {
                expand,
                fields,
                filter: filter(cleanedQuery, Object.fromEntries(valueMap)),
                sort,
            }
        }

        if (typeof globalFilter === 'function') {
            return {
                expand,
                fields,
                filter: globalFilter(
                    cleanedQuery,
                    Object.fromEntries(valueMap),
                ),
                sort,
            }
        }

        return {
            expand,
            fields,
            filter: { raw: cleanedQuery, values: Object.fromEntries(valueMap) },
            sort,
        }
    }

    function applySort(keys: string | string[]) {
        if (sort) {
            console.warn('Overriding previous sort:', sort)
        }

        const normalizedKeys = Array.isArray(keys) ? keys : [keys]
        sort = generateSort(normalizedKeys)
    }

    const queryBuilder: QueryBuilder<T, MaxDepth> = {
        ...builderFunctions,
        search(keys, value) {
            query += '('
            const cleanedPaths = keys.filter((key) => key)
            cleanedPaths.forEach((key, index) => {
                expression(key, '~', value)
                query += index < cleanedPaths.length - 1 ? ' || ' : ''
            })
            query += ')'
            return restrictedQueryBuilder
        },
        in(key, values) {
            query += '('
            values.forEach((value, index) => {
                expression(key, '=', value)
                query += index < values.length - 1 ? ' || ' : ''
            })
            query += ')'
            return restrictedQueryBuilder
        },
        notIn(key, values) {
            query += '('
            values.forEach((value, index) => {
                expression(key, '!=', value)
                query += index < values.length - 1 ? ' && ' : ''
            })
            query += ')'
            return restrictedQueryBuilder
        },
        between(key, from, to) {
            query += '('
            expression(key, '>=', from)
            query += ' && '
            expression(key, '<=', to)
            query += ')'
            return restrictedQueryBuilder
        },
        notBetween(key, from, to) {
            query += '('
            expression(key, '<', from)
            query += ' || '
            expression(key, '>', to)
            query += ')'
            return restrictedQueryBuilder
        },
        isNull(key) {
            query += `${String(key)}=''`
            return restrictedQueryBuilder
        },
        isNotNull(key) {
            query += `${String(key)}!=''`
            return restrictedQueryBuilder
        },
        custom(raw) {
            query += raw
            return restrictedQueryBuilder
        },
        group(callback) {
            query += '('
            callback(queryBuilder)
            query += ')'
            return restrictedQueryBuilder
        },
        sort(keys) {
            applySort(keys)

            return queryBuilder
        },
        build,
    }

    const queryBuilderStart: QueryBuilderStart<T, MaxDepth> = {
        ...queryBuilder,
        fields(keys) {
            if (fields) {
                console.warn('Overriding previous fields:', fields)
            }

            const normalizedKeys = Array.isArray(keys) ? keys : [keys]
            fields = generateFields(normalizedKeys)
            expand ||= generateExpand(prepareFieldsForExpand(normalizedKeys))

            return queryBuilderStart
        },
        expand(keys) {
            if (expand) {
                console.warn('Overriding previous expand:', expand)
            }

            const normalizedKeys = Array.isArray(keys) ? keys : [keys]
            expand = generateExpand(normalizedKeys)

            return queryBuilderStart
        },
    }

    const restrictedQueryBuilder: RestrictedQueryBuilder<T, MaxDepth> = {
        and() {
            query += ' && '
            return queryBuilder
        },
        or() {
            query += ' || '
            return queryBuilder
        },
        sort(keys) {
            applySort(keys)

            return restrictedQueryBuilder
        },
        build,
    }

    return queryBuilderStart
}
