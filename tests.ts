import { assertEquals } from '@std/assert'
import { pbQuery } from './query.ts'
import { filter } from './utils.ts'

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

Deno.test('multiple queries', () => {
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

    assertEquals(
        query,
        "name='John' && (age!=20 || age!=30) && city='New York'",
    )

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

    assertEquals(
        filter(query1.raw, query1.values),
        "user.name='John' && (title?!~'foo' || title?~'bar') && (user.age=20 || user.age=30 || user.age=40) && (createdAt>='2021-01-01 00:00:00.000Z' && createdAt<='2021-12-31 00:00:00.000Z') && (user.age<20 || user.age>30) && (user.city='New York' || user.city='Los Angeles') && (user.city!='Chicago' && user.city!='Miami') && content~'test'",
    )

    const postQuery = pbQuery<Post>()

    assertEquals(
        postQuery.equal('user.name', 'John').build(filter),
        "user.name='John'",
    )
    assertEquals(
        postQuery.equal('user.name', 'John').and().equal('user.age', 20).build(
            filter,
        ),
        "user.name='John'user.name='John' && user.age=20",
    )

    const groupTest = pbQuery<User>().equal('name', 'Alice').or().equal(
        'name',
        'Bob',
    ).and()
        .group((qb) =>
            qb.equal('name', 'Alice')
                .or()
                .equal('name', 'Bob')
        ).build(filter)

    assertEquals(
        groupTest,
        "name='Alice' || name='Bob' && (name='Alice' || name='Bob')",
    )
})

Deno.test('all possible keys', () => {
    pbQuery<Post>().equal('categories', 'hola').build()
    pbQuery<Post>().equal('categories:each', 'hola').build()
    pbQuery<Post>().equal('categories:length', 1).build()
    pbQuery<Post>().equal('categories.id', 'hola').build()
    pbQuery<Post>().equal('categories.id:lower', 'hola').build()
    pbQuery<Post>().equal('categories.priority', 1).build()
    pbQuery<Post>().equal('title', 'hola').build()
    pbQuery<Post>().equal('title:lower', 'hola').build()
    pbQuery<Post>().equal('tags', 'hola').build()
    pbQuery<Post>().equal('tags:each', 'hola').build()
    pbQuery<Post>().equal('tags:length', 1).build()
    pbQuery<Post>().equal('numbers', 1).build()
    pbQuery<Post>().equal('numbers:each', 1).build()
    pbQuery<Post>().equal('numbers:length', 1).build()
    pbQuery<Post>().equal('createdAt', new Date()).build()
    pbQuery<Post>().equal('isVisible', true).build()
    pbQuery<Post>().equal('user.age', 18).build()
})
