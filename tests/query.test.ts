import PocketBase from 'pocketbase'
import { expect, test } from 'vitest'
import { pbQuery } from '../src/query'
import { filter } from '../src/utils'

interface User {
    id: string
    name: string
    age: number
    city: string
    permissions: string[]
    created: Date
    updated: Date
}

interface SpecialPost {
    id: string
    title: string
    content: string
    created: Date
    updated: Date
}

interface Post {
    id: string
    title: string
    content: string
    author: User
    isVisible: boolean
    tags: string[]
    related: SpecialPost[]
    created: Date
    updated: Date
}

const pb = new PocketBase()

test('filter discrepancy', () => {
    const query1 = pbQuery<Post>()
        .equal('author.name', 'John')
        .and()
        .in('author.age', [20, 30, 40])
        .and()
        .notIn('author.city', ['Chicago', 'Miami'])
        .and()
        .between('created', new Date('2021-01-01'), new Date('2021-12-31'))
        .and()
        .notBetween('author.age', 20, 30)
        .and()
        .search(['title', 'content', 'tags'], 'alice')
        .and()
        .isNull('content')
        .and()
        .custom(filter('content~{:content}', { content: 'test' }))
        .build(filter)

    const query2 = pbQuery<Post>()
        .equal('author.name', 'John')
        .and()
        .in('author.age', [20, 30, 40])
        .and()
        .notIn('author.city', ['Chicago', 'Miami'])
        .and()
        .between('created', new Date('2021-01-01'), new Date('2021-12-31'))
        .and()
        .notBetween('author.age', 20, 30)
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
    const postQuery = pbQuery<Post>

    expect(postQuery().equal('author.name', 'John').build(filter)).toBe(
        "author.name='John'",
    )
    expect(
        postQuery()
            .equal('author.name', 'John')
            .and()
            .equal('author.age', 20)
            .build(filter),
    ).toBe("author.name='John' && author.age=20")
})

test('multiple queries', () => {
    const query = pbQuery<User>()
        .equal('name', 'John')
        .and()
        .group((q) => q.notEqual('age', 20).or().notEqual('age', 30))
        .and()
        .equal('city', 'New York')
        .build(filter)

    expect(query).toBe("name='John' && (age!=20 || age!=30) && city='New York'")

    const query1 = pbQuery<Post>()
        .equal('author.name', 'John')
        .and()
        .group((q) => q.anyNotLike('title', 'foo').or().anyLike('title', 'bar'))
        .and()
        .in('author.age', [20, 30, 40])
        .and()
        .between('created', new Date('2021-01-01'), new Date('2021-12-31'))
        .and()
        .notBetween('author.age', 20, 30)
        .and()
        .in('author.city', ['New York', 'Los Angeles'])
        .and()
        .notIn('author.city', ['Chicago', 'Miami'])
        .and()
        .custom(filter('content~{:content}', { content: 'test' }))
        .build()

    expect(filter(query1.raw, query1.values)).toBe(
        "author.name='John' && (title?!~'foo' || title?~'bar') && (author.age=20 || author.age=30 || author.age=40) && (created>='2021-01-01 00:00:00.000Z' && created<='2021-12-31 00:00:00.000Z') && (author.age<20 || author.age>30) && (author.city='New York' || author.city='Los Angeles') && (author.city!='Chicago' && author.city!='Miami') && content~'test'",
    )

    const groupTest = pbQuery<User>()
        .equal('name', 'Alice')
        .or()
        .equal('name', 'Bob')
        .and()
        .group((q) => q.equal('name', 'Alice').or().equal('name', 'Bob'))
        .build(filter)

    expect(groupTest).toBe(
        "name='Alice' || name='Bob' && (name='Alice' || name='Bob')",
    )
})

test('nested groups', () => {
    const groupTest = pbQuery<User>()
        .equal('name', 'Alice')
        .or()
        .equal('name', 'Bob')
        .and()
        .group((q) => q.equal('name', 'Alice').or().equal('name', 'Bob'))
        .and()
        .group((q) =>
            q
                .isNotNull('name')
                .and()
                .group((q) =>
                    q.equal('name', 'Alice').or().equal('name', 'Bob'),
                ),
        )
        .build(filter)

    expect(groupTest).toBe(
        "name='Alice' || name='Bob' && (name='Alice' || name='Bob') && (name!='' && (name='Alice' || name='Bob'))",
    )
})

test('back-relations', () => {
    const groupTest = pbQuery<Post>()
        .equal('anything_via_author', new Date('2021-12-31'))
        .and()
        .equal('anything_via_author.anything', new Date('2021-12-31'))
        .build(filter)

    expect(groupTest).toBe(
        "anything_via_author='2021-12-31 00:00:00.000Z' && anything_via_author.anything='2021-12-31 00:00:00.000Z'",
    )
})

test('cloned query', () => {
    const querySportsPosts = () =>
        pbQuery<Post>().anyLike('tags', 'sports').and()

    const searchQuery1 = querySportsPosts()
        .search(['title', 'content', 'tags', 'author'], 'basketba')
        .build(pb.filter)
    expect(searchQuery1).toBe(
        "tags?~'sports' && (title~'basketba' || content~'basketba' || tags~'basketba' || author~'basketba')",
    )

    const searchQuery2 = querySportsPosts()
        .search(['title', 'content', 'tags', 'author'], 'footba')
        .build(pb.filter)
    expect(searchQuery2).toBe(
        "tags?~'sports' && (title~'footba' || content~'footba' || tags~'footba' || author~'footba')",
    )
})
