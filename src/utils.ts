import { DATETIME_MACROS } from './constants'
import type { DatetimeMacro } from './types'

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

export function generateFields(keys: string[]) {
    const uniqueKeys = [...new Set(keys)]

    return uniqueKeys.join(',')
}

export function prepareFieldsForExpand(keys: string[]) {
    const uniqueKeys = [...new Set(keys)]

    const preparedKeys = uniqueKeys.map((key) => {
        const words = key.split('expand.')
        if (words.length > 1) {
            return words
                .map((word) => {
                    const dotIndex = word.indexOf('.')
                    return word.slice(0, dotIndex < 0 ? word.length : dotIndex)
                })
                .filter(Boolean)
                .join('.')
        }

        return ''
    })

    return [...new Set(preparedKeys)]
}

export function generateExpand(keys: string[]) {
    const uniqueKeys = [...new Set(keys)]

    return uniqueKeys
        .reduce((acc, word, wordIndex, arr) => {
            const canBeIgnored = arr.some((x, xIndex) => {
                if (wordIndex === xIndex) {
                    return false
                }

                if (x?.startsWith(word)) {
                    return true
                }

                return false
            })

            if (!canBeIgnored) {
                acc.push(word)
            }

            return acc
        }, [] as string[])
        .join(',')
}

export function generateSort(keys: string[]) {
    const uniqueKeys = [...new Set(keys)]

    return uniqueKeys.join(',')
}

export function cleanQuery(query: string): string {
    if (!query?.trim()) return query || ''

    const steps = [
        removeOperatorsAfterOpeningParenthesis,
        removeOperatorsBeforeClosingParenthesis,
        removeStackedOperators,
        removeTrailingOperators,
        normalize,
    ]

    return steps.reduce((result, step) => step(result), query)
}

const AND = '&&'
const OR = '\\|\\|' // escaped because of regex
const OP = `(?:${AND}|${OR})` // matches && or ||
const OP_SEQ = `${OP}(?:\\s*${OP})*` // matches sequences like "|| && && ||"

function normalize(str: string): string {
    return str.replace(/\s+/g, ' ').trim()
}

function removeOperatorsAfterOpeningParenthesis(str: string): string {
    // Remove ANY sequence of operators right after "("
    return str.replace(new RegExp(`\\(\\s*${OP_SEQ}\\s*`, 'g'), '(')
}

function removeOperatorsBeforeClosingParenthesis(str: string): string {
    // Remove ANY sequence of operators right before ")"
    return str.replace(new RegExp(`\\s*${OP_SEQ}\\s*\\)`, 'g'), ')')
}

function removeStackedOperators(str: string): string {
    // "&& &&", "|| ||", "&& ||", etc.
    return str.replace(new RegExp(`${OP}\\s+${OP}`, 'g'), '')
}

function removeTrailingOperators(str: string): string {
    return str.replace(new RegExp(`${OP}\\s*$`, 'g'), '')
}
