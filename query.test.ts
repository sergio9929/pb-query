import PocketBase from 'pocketbase'
import { expect, test } from 'vitest'
import { pbQuery } from './src/query'
import { filter } from './src/utils'

interface User {
    id: string
    name: string
    age: number
    city: string
    roles: string[]
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
    createdAt: Date
    updatedAt: Date
    user: User
    tags: string[]
    categories: Category[]
    numbers: number[]
    isVisible: boolean
}

const pb = new PocketBase()

test('dilter discrepancy', () => {
    const query1 = pbQuery<Post>()
        .equal('user.name', 'John')
        .and()
        .in('user.age', [20, 30, 40])
        .and()
        .notIn('user.city', ['Chicago', 'Miami'])
        .and()
        .between('createdAt', new Date('2021-01-01'), new Date('2021-12-31'))
        .and()
        .notBetween('user.age', 20, 30)
        .and()
        .search(['title', 'content', 'tags'], 'alice')
        .and()
        .isNull('content')
        .and()
        .custom(filter('content~{:content}', { content: 'test' }))
        .build(filter)

    const query2 = pbQuery<Post>()
        .equal('user.name', 'John')
        .and()
        .in('user.age', [20, 30, 40])
        .and()
        .notIn('user.city', ['Chicago', 'Miami'])
        .and()
        .between('createdAt', new Date('2021-01-01'), new Date('2021-12-31'))
        .and()
        .notBetween('user.age', 20, 30)
        .and()
        .search(['title', 'content', 'tags'], 'alice')
        .and()
        .isNull('content')
        .and()
        .custom(pb.filter('content~{:content}', { content: 'test' }))
        .build(pb.filter)

    expect(query1).toBe(query2)
})

test('post query', () => {
    const postQuery = pbQuery<Post>()

    expect(postQuery.equal('user.name', 'John').build(filter)).toBe(
        "user.name='John'",
    )
    expect(
        postQuery
            .equal('user.name', 'John')
            .and()
            .equal('user.age', 20)
            .build(filter),
    ).toBe("user.name='John'user.name='John' && user.age=20")
})

test('multiple queries', () => {
    const query = pbQuery<User>()
        .equal('name', 'John')
        .and()
        .open()
        .notEqual('age', 20)
        .or()
        .notEqual('age', 30)
        .close()
        .and()
        .equal('city', 'New York')
        .build(filter)

    expect(query).toBe("name='John' && (age!=20 || age!=30) && city='New York'")

    const query1 = pbQuery<Post>()
        .equal('user.name', 'John')
        .and()
        .open()
        .anyNotLike('title', 'foo')
        .or()
        .anyLike('title', 'bar')
        .close()
        .and()
        .in('user.age', [20, 30, 40])
        .and()
        .between('createdAt', new Date('2021-01-01'), new Date('2021-12-31'))
        .and()
        .notBetween('user.age', 20, 30)
        .and()
        .in('user.city', ['New York', 'Los Angeles'])
        .and()
        .notIn('user.city', ['Chicago', 'Miami'])
        .and()
        .custom(filter('content~{:content}', { content: 'test' }))
        .build()

    expect(filter(query1.raw, query1.values)).toBe(
        "user.name='John' && (title?!~'foo' || title?~'bar') && (user.age=20 || user.age=30 || user.age=40) && (createdAt>='2021-01-01 00:00:00.000Z' && createdAt<='2021-12-31 00:00:00.000Z') && (user.age<20 || user.age>30) && (user.city='New York' || user.city='Los Angeles') && (user.city!='Chicago' && user.city!='Miami') && content~'test'",
    )

    const groupTest = pbQuery<User>()
        .equal('name', 'Alice')
        .or()
        .equal('name', 'Bob')
        .and()
        .group((qb) => qb.equal('name', 'Alice').or().equal('name', 'Bob'))
        .build(filter)

    expect(groupTest).toBe(
        "name='Alice' || name='Bob' && (name='Alice' || name='Bob')",
    )
})
