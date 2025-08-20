import { OPERATORS } from './constants'
import type {
    FilterFunction,
    Path,
    PathValue,
    QueryBuilder,
    QueryBuilderStart,
    QueryResult,
    RawQueryObject,
    RestrictedQueryBuilder,
} from './types'
import {
    generateExpand,
    generateFields,
    generateSort,
    isDateMacro,
    prepareFieldsForExpand,
} from './utils'

export function pbQuery<T, MaxDepth extends number = 6>(): QueryBuilderStart<
    T,
    MaxDepth
> {
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

    const builderFunctions = {} as Record<
        keyof typeof OPERATORS,
        BuilderFunction
    >
    for (const [name, operator] of Object.entries(OPERATORS)) {
        const key = name as keyof typeof OPERATORS
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
        if (typeof filter === 'function') {
            return {
                expand,
                fields,
                filter: filter(query, Object.fromEntries(valueMap)),
                sort,
            }
        }
        return {
            expand,
            fields,
            filter: { raw: query, values: Object.fromEntries(valueMap) },
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
