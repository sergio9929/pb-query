import { assertType, expectTypeOf, test } from 'vitest'
import { pbQuery } from '../src/query'
import type {
    GeoPoint,
    Path,
    PathExpand,
    PathFields,
    RawQueryObject,
} from '../src/types'
import { filter } from '../src/utils'

interface User {
    id: string
    name: string
    age: number
    city: string
    permissions: string[]
    location: GeoPoint
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

    assertType<string>(build(filter).filter)
    assertType<RawQueryObject>(build().filter)
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
    equal('created', '@now').build()
    equal('isVisible', true).build()
    equal('user', 'hola').build()
    equal('user.age', 18).build()

    expectTypeOf<'user'>().toMatchTypeOf<PathExpand<Post, 6>>()
    expectTypeOf<'user.location'>().not.toMatchTypeOf<PathExpand<Post, 6>>()
    expectTypeOf<'created'>().not.toMatchTypeOf<PathExpand<Post, 6>>()

    expectTypeOf<'*'>().toMatchTypeOf<PathFields<Post, 6>>()
    expectTypeOf<'user'>().toMatchTypeOf<PathFields<Post, 6>>()
    expectTypeOf<'expand.user'>().toMatchTypeOf<PathFields<Post, 6>>()
    expectTypeOf<'expand.user.*'>().toMatchTypeOf<PathFields<Post, 6>>()
    expectTypeOf<'expand.user.name'>().toMatchTypeOf<PathFields<Post, 6>>()
    expectTypeOf<'content:excerpt(100,true)'>().toMatchTypeOf<
        PathFields<Post, 6>
    >()
    expectTypeOf<'expand.location'>().not.toMatchTypeOf<PathFields<User, 6>>()
    expectTypeOf<'location'>().toMatchTypeOf<PathFields<User, 6>>()
    expectTypeOf<'location.lon'>().toMatchTypeOf<PathFields<User, 6>>()

    expectTypeOf<'anything_via_user'>().not.toMatchTypeOf<Path<Post, 6>>()
    equal('anything_via_user.anything', new Date()).build()

    expectTypeOf<'user'>().toMatchTypeOf<Path<Post, 1>>()
    expectTypeOf<'user.name'>().not.toMatchTypeOf<Path<Post, 1>>()
    expectTypeOf<'user.name'>().toMatchTypeOf<Path<Post, 2>>()

    const test1 = pbQuery<Post>().equal('id', 'test')
    expectTypeOf<'sort'>().toMatchTypeOf<keyof typeof test1>()

    const test2 = pbQuery<Post>().sort(['-created']).equal('id', 'test')
    expectTypeOf<'and'>().toMatchTypeOf<keyof typeof test2>()
    expectTypeOf<'sort'>().not.toMatchTypeOf<keyof typeof test2>()

    const test3 = pbQuery<Post>().sort(['-created']).equal('id', 'test').and()
    expectTypeOf<'equal'>().toMatchTypeOf<keyof typeof test3>()
    expectTypeOf<'sort'>().not.toMatchTypeOf<keyof typeof test3>()
})
