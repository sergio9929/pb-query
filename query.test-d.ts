import { assertType, test } from 'vitest'
import { pbQuery } from './src/query'
import type { RawQueryObject } from './src/types'
import { filter } from './src/utils'

interface User {
    id: string
    name: string
    age: number
    city: string
    permissions: string[]
}

interface Category {
    id: string
    name: string
    priority: number
}

interface Post {
    id: string
    title: string
    content: string
    created: Date
    update: Date
    user: User
    tags: string[]
    categories: Category[]
    numbers: number[]
    isVisible: boolean
}

test('build function types', () => {
    const { build } = pbQuery<Post>()

    assertType<string>(build(filter))
    assertType<RawQueryObject>(build())
})

test('all possible keys', () => {
    const { equal } = pbQuery<Post>()

    equal('categories', 'hola')
    equal('categories:each', 'hola').build()
    equal('categories:length', 1).build()
    equal('categories.id', 'hola').build()
    equal('categories.id:lower', 'hola').build()
    equal('categories.priority', 1).build()
    equal('title', 'hola').build()
    equal('title:lower', 'hola').build()
    equal('tags', 'hola').build()
    equal('tags:each', 'hola').build()
    equal('tags:length', 1).build()
    equal('numbers', 1).build()
    equal('numbers:each', 1).build()
    equal('numbers:length', 1).build()
    equal('created', new Date()).build()
    equal('isVisible', true).build()
    equal('user', 'hola').build()
    equal('user.age', 18).build()
})
