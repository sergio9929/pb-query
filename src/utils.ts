import { DATETIME_MACROS } from './constants'
import type { DatetimeMacro } from './types'

/**
 * We expose a filter function, but we recommend using the native `pb.filter()` function instead.
 * @deprecated Use native `pb.filter()`, not this.
 */
export function filter(
    raw: string,
    params?: { [key: string]: unknown },
): string {
    if (!params) {
        return raw
    }

    let sanitizedQuery = raw

    for (const key in params) {
        let val = params[key]
        switch (typeof val) {
            case 'boolean':
            case 'number':
                val = `${val}`
                break
            case 'string':
                val = `'${val.replace(/'/g, "\\'")}'`
                break
            default:
                if (val === null) {
                    val = 'null'
                } else if (val instanceof Date) {
                    val = `'${val.toISOString().replace('T', ' ')}'`
                } else {
                    val = `'${JSON.stringify(val).replace(/'/g, "\\'")}'`
                }
        }
        sanitizedQuery = sanitizedQuery.replaceAll(`{:${key}}`, val as string)
    }

    return sanitizedQuery
}

export function isDateMacro(value: unknown): value is DatetimeMacro {
    if (!isMacro(value)) {
        return false
    }

    return DATETIME_MACROS.includes(value as DatetimeMacro)
}

function isMacro(value: unknown): value is string {
    if (typeof value !== 'string') {
        return false
    }

    return value.length > 1 && value.startsWith('@')
}
