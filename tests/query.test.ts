import PocketBase from 'pocketbase'
import { expect, test } from 'vitest'
import { pbQuery } from '../src/query'
import type { FilterFunction, GeoPoint } from '../src/types'
import { cleanQuery } from '../src/utils'

interface User {
    id: string
    name: string
    age: number
    city: string
    permissions: string[]
    location: GeoPoint
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

test('global filter function', () => {
    const customFilter: FilterFunction = (raw, params) => {
        if (!params) {
            return raw
        }

        let sanitizedQuery = raw

        for (const key in params) {
            let val = params[key]
            switch (typeof val) {
                case 'number':
                    val = `'test${val}'`
                    break
                default:
                    val = `'${val}'`
            }
            sanitizedQuery = sanitizedQuery.replaceAll(
                `{:${key}}`,
                val as string,
            )
        }

        return sanitizedQuery
    }

    const query1 = pbQuery<User>()
        .fields([])
        .expand([])
        .sort([])
        .equal('age', 10)
        .and()
        .equal('city', 'hola')
        .build()

    expect(query1.filter).toMatchObject({
        raw: 'age={:age1} && city={:city1}',
        values: {
            age1: 10,
            city1: 'hola',
        },
    })

    const query2 = pbQuery<User>(pb.filter)
        .fields([])
        .expand([])
        .sort([])
        .equal('age', 10)
        .and()
        .equal('city', 'hola')
        .build()

    expect(query2.filter).toBe("age=10 && city='hola'")

    const query3 = pbQuery<User>()
        .fields([])
        .expand([])
        .sort([])
        .equal('age', 10)
        .and()
        .equal('city', 'hola')
        .build(pb.filter)

    expect(query3.filter).toBe("age=10 && city='hola'")

    const query4 = pbQuery<User>(pb.filter)
        .fields([])
        .expand([])
        .sort([])
        .equal('age', 10)
        .and()
        .equal('city', 'hola')
        .build(customFilter)

    expect(query4.filter).toBe("age='test10' && city='hola'")
})

test('post query', () => {
    const postQuery = pbQuery<Post>

    expect(
        postQuery().equal('author.name', 'John').build(pb.filter).filter,
    ).toBe("author.name='John'")
    expect(
        postQuery()
            .equal('author.name', 'John')
            .and()
            .equal('author.age', 20)
            .build(pb.filter).filter,
    ).toBe("author.name='John' && author.age=20")
})

test('multiple queries', () => {
    const query = pbQuery<User>()
        .equal('name', 'John')
        .and()
        .group((q) => q.notEqual('age', 20).or().notEqual('age', 30))
        .and()
        .equal('city', 'New York')
        .build(pb.filter)

    expect(query.filter).toBe(
        "name='John' && (age!=20 || age!=30) && city='New York'",
    )

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
        .custom(pb.filter('content~{:content}', { content: 'test' }))
        .build()

    expect(pb.filter(query1.filter.raw, query1.filter.values)).toBe(
        "author.name='John' && (title?!~'foo' || title?~'bar') && (author.age=20 || author.age=30 || author.age=40) && (created>='2021-01-01 00:00:00.000Z' && created<='2021-12-31 00:00:00.000Z') && (author.age<20 || author.age>30) && (author.city='New York' || author.city='Los Angeles') && (author.city!='Chicago' && author.city!='Miami') && content~'test'",
    )

    const groupTest = pbQuery<User>()
        .equal('name', 'Alice')
        .or()
        .equal('name', 'Bob')
        .and()
        .group((q) => q.equal('name', 'Alice').or().equal('name', 'Bob'))
        .build(pb.filter)

    expect(groupTest.filter).toBe(
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
        .build(pb.filter)

    expect(groupTest.filter).toBe(
        "name='Alice' || name='Bob' && (name='Alice' || name='Bob') && (name!='' && (name='Alice' || name='Bob'))",
    )
})

test('back-relations', () => {
    const query1 = pbQuery<Post>()
        .equal('anything_via_author.anything', new Date('2021-12-31'))
        .build(pb.filter)

    expect(query1.filter).toBe(
        "anything_via_author.anything='2021-12-31 00:00:00.000Z'",
    )

    const query2 = pbQuery<SpecialPost>()
        .equal('anything_via_author.anything', new Date('2021-12-31'))
        .build(pb.filter)

    expect(query2.filter).toBe(
        "anything_via_author.anything='2021-12-31 00:00:00.000Z'",
    )
})

test('cloned query', () => {
    const querySportsPosts = () =>
        pbQuery<Post>().anyLike('tags', 'sports').and()

    const searchQuery1 = querySportsPosts()
        .search(['title', 'content', 'tags', 'author'], 'basketba')
        .build(pb.filter)
    expect(searchQuery1.filter).toBe(
        "tags?~'sports' && (title~'basketba' || content~'basketba' || tags~'basketba' || author~'basketba')",
    )

    const searchQuery2 = querySportsPosts()
        .search(['title', 'content', 'tags', 'author'], 'footba')
        .build(pb.filter)
    expect(searchQuery2.filter).toBe(
        "tags?~'sports' && (title~'footba' || content~'footba' || tags~'footba' || author~'footba')",
    )
})

test('date macros', () => {
    const query1 = pbQuery<Post>()
        .greaterThan('created', '@now')
        .build(pb.filter)
    expect(query1.filter).toBe('created>@now')

    const query2 = pbQuery<Post>()
        .between('created', '@now', '@yesterday')
        .build(pb.filter)
    expect(query2.filter).toBe('(created>=@now && created<=@yesterday)')

    const query3 = pbQuery<Post>()
        .greaterThan('created', '@test' as '@now')
        .build(pb.filter)
    expect(query3.filter).toBe("created>'@test'")
})

test('fields', () => {
    const query1 = pbQuery<Post>()
        .fields([
            '*',
            'title',
            'tags',
            'content:excerpt(100,true)',
            'author',
            'expand.author.location.lon',
            'expand.author.location.lat',
            'expand.author.city',
            'expand.author.age',
            'expand.author.expand.a_via_b',
            'expand.author.expand.a_via_b.expand.record.expand.b_via_c',
            'related',
            'expand.related.*',
        ])
        .build(pb.filter)
    expect(query1.fields).toBe(
        [
            '*',
            'title',
            'tags',
            'content:excerpt(100,true)',
            'author',
            'expand.author.location.lon',
            'expand.author.location.lat',
            'expand.author.city',
            'expand.author.age',
            'expand.author.expand.a_via_b',
            'expand.author.expand.a_via_b.expand.record.expand.b_via_c',
            'related',
            'expand.related.*',
        ].join(','),
    )
    expect(query1.expand).toBe(
        ['author.a_via_b.record.b_via_c', 'related'].join(','),
    )

    const query2 = pbQuery<Post>().build(pb.filter)
    expect(query2.fields).toBe('')
    expect(query2.expand).toBe('')

    const query3 = pbQuery<Post>().fields('*').build(pb.filter)
    expect(query3.fields).toBe('*')
    expect(query3.expand).toBe('')
})

test('expand', () => {
    const query1 = pbQuery<Post>()
        .expand([
            'author',
            'author.a_via_b',
            'author.a_via_b.record.b_via_c',
            'related',
        ])
        .fields(['related'])
        .build(pb.filter)
    expect(query1.expand).toBe(
        ['author.a_via_b.record.b_via_c', 'related'].join(','),
    )

    const query2 = pbQuery<Post>()
        .fields(['related'])
        .expand([
            'author',
            'author.a_via_b',
            'author.a_via_b.record.b_via_c',
            'related',
        ])
        .build(pb.filter)
    expect(query2.expand).toBe(
        ['author.a_via_b.record.b_via_c', 'related'].join(','),
    )

    const query3 = pbQuery<Post>().expand('author').build(pb.filter)
    expect(query3.expand).toBe(['author'].join(','))
})

test('sort', () => {
    const query1 = pbQuery<Post>()
        .sort([
            '@random',
            '@rowid',
            'related.updated',
            'related.updated',
            'author',
            '+author',
            '-created',
        ])
        .equal('author', 'a')
        .or()
        .equal('author', 'a')
        .build(pb.filter)
    expect(query1.sort).toBe(
        [
            '@random',
            '@rowid',
            'related.updated',
            'author',
            '+author',
            '-created',
        ].join(','),
    )

    const query2 = pbQuery<Post>()
        .equal('author', 'a')
        .sort(['-created'])
        .or()
        .equal('author', 'a')
        .build(pb.filter)
    expect(query2.sort).toBe(['-created'].join(','))

    const query3 = pbQuery<Post>()
        .equal('author', 'a')
        .or()
        .sort(['-created'])
        .equal('author', 'a')
        .build(pb.filter)
    expect(query3.sort).toBe(['-created'].join(','))

    const query4 = pbQuery<Post>().sort('-created').build(pb.filter)
    expect(query4.sort).toBe(['-created'].join(','))
})

test('query cleanup', () => {
    const rawQuery =
        "&& || name='test1' && (|| &&name='test2'    ||   && ) && id='test3' && || "

    const cleanedQuery = cleanQuery(rawQuery)
    expect(cleanedQuery).toBe("name='test1' && (name='test2') && id='test3'")

    const condition1 = true
    const candition2 = false

    const query = pbQuery<User>()
        .custom(rawQuery)
        .and()
        .group((q) => {
            if (condition1) {
                q.equal('city', 'New York').or()
            }

            if (candition2) {
                q.equal('age', 30).or()
            }

            return q
        })

    query.and()

    expect(query.build(pb.filter).filter).toBe(
        "name='test1' && (name='test2') && id='test3' && (city='New York')",
    )
})
