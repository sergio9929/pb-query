import { OPERATORS } from './constants.ts'
import {
    FilterFunction,
    Path,
    PathValue,
    QueryBuilder,
    RawQueryObject,
    RestrictedQueryBuilder,
} from './types.ts'

export function pbQuery<T>(): QueryBuilder<T> {
    let query = ''
    let depth = 0

    const keyCounter = new Map<Path<T>, number>()
    const valueMap = new Map<string, unknown>()

    const incrementKeyCounter = (key: Path<T>) => {
        const count = keyCounter.get(key) || 0
        const newCount = count + 1
        keyCounter.set(key, newCount)

        return newCount
    }

    const saveValue = <P extends Path<T>>(key: P, value: PathValue<T, P>) => {
        const count = incrementKeyCounter(key)
        const newName = `${String(key)}${count}`
        valueMap.set(newName, value)

        return newName
    }

    const expression = <P extends Path<T>>(
        key: P,
        operator: string,
        value: PathValue<T, P>,
    ) => {
        const newName = saveValue(key, value)
        query += `${String(key)}${operator}{:${newName}}`
    }

    type BuilderFunction = <P extends Path<T>>(
        key: P,
        values: PathValue<T, P>,
    ) => RestrictedQueryBuilder<T>

    const builderFunctions = {} as Record<
        keyof typeof OPERATORS,
        BuilderFunction
    >
    for (const [name, operator] of Object.entries(OPERATORS)) {
        const key = name as keyof typeof OPERATORS
        builderFunctions[key] = <P extends Path<T>>(
            key: P,
            value: PathValue<T, P>,
        ) => {
            expression(key, operator, value)
            return restrictedQueryBuilder
        }
    }

    function build(): RawQueryObject
    function build(filter: FilterFunction): string
    function build(filter?: FilterFunction): RawQueryObject | string {
        if (depth !== 0) {
            throw new Error('Unclosed groups')
        }

        if (typeof filter === 'function') {
            return filter(query, Object.fromEntries(valueMap))
        }
        return { raw: query, values: Object.fromEntries(valueMap) }
    }

    const queryBuilder: QueryBuilder<T> = {
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
        open() {
            depth++
            query += `(`
            return queryBuilder
        },
        group(callback) {
            depth++
            query += `(`
            callback(queryBuilder)
            depth--
            query += `)`
            return restrictedQueryBuilder
        },
        build,
    }

    const restrictedQueryBuilder: RestrictedQueryBuilder<T> = {
        and() {
            query += ` && `
            return queryBuilder
        },
        or() {
            query += ` || `
            return queryBuilder
        },
        close() {
            depth--
            query += `)`
            return restrictedQueryBuilder
        },
        build,
    }

    return queryBuilder
}
