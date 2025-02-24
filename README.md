(Due to technical issues, the search service is temporarily unavailable.)

# pb-query 🔍✨

**Build type-safe PocketBase queries with the power of TypeScript.**  
*Stop wrestling with filter strings. Start composing queries like code.*

[![npm](https://img.shields.io/npm/v/@sergio9929/pb-query)](https://www.npmjs.com/package/@sergio9929/pb-query)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?logo=typescript&logoColor=white)

## Features

- **🚀 Full TypeScript Integration** - Autocomplete paths and validate values against your schema
- **🔗 Chainable API** - Build complex queries with `.and()`/`.or()` logic
- **🛡️ Injection Protection** - Automatic parameter escaping
- **🧩 Nested Grouping** - Create complex logic with `.group()` and `open()`/`close()`
- **📅 Date & Array Support** - First-class handling of dates and array operations
- **🔍 Advanced Search** - Multi-field search with single method call

## Installation

```bash
# npm
npm install @sergio9929/pb-query

# pnpm
pnpm add @sergio9929/pb-query

# yarn
yarn add @sergio9929/pb-query
```

## Quick Start

```ts
import { pbQuery } from '@sergio9929/pb-query';
import PocketBase from 'pocketbase';
import type { Post } from './types';

// PocketBase instance
const pb = new PocketBase("https://example.com")

// Build a type-safe query for posts
const query = pbQuery<Post>()
  .search(['title', 'content', 'tags', 'author'], 'footba')
  .and()
  .between('createdAt', new Date('2023-01-01'), new Date('2023-12-31'))
  .or()
  .group(q => 
    q.anyLike('tags', 'sports')
      .and()
      .greaterThan('priority', 5)
  )
  .build(pb.filter);

console.log(query);
// (title~'footba' || content~'footba' || tags~'footba' || author~'footba') 
// && (createdAt>='2023-01-01' && createdAt<='2023-12-31') 
// || ((tags?~'sports' && priority>5))

// Use your query
const records = await pb.collection("posts").getList(1, 20, {
  filter: query
})
```

> [!IMPORTANT]
> You can use this package without typescript, but you would miss out on many of the advantages we offer.

## Table of Contents

- [Why pb-query?](#why-pb-query)
- [Core Concepts](#core-concepts)
- [Basic Operators](#basic-operators)
- [Combination Methods](#combination-methods)
- [Collection Operations](#collection-operations)
- [Advanced Features](#advanced-features)
- [Security Notes](#security-notes)
- [Real-World Recipes](#real-world-recipes)
- [Troubleshooting](#troubleshooting)

## Why pb-query?

Building complex filters in PocketBase often leads to:

1. **String Concatenation Hell**  
   `'createdAt >= "2023-01-01" && (tags ~ "%urgent%" || priority > 5)'`  
   😱 Prone to syntax errors and difficult to maintain

2. **Type Safety Issues**  
   `'user.age > "twenty"'`  
   😬 Incorrect value types can cause runtime errors

3. **Typos**  
   `'user.ege > "twenty"'`  
   😬 No type checking for field names, leading to hard-to-find bugs

4. **Security Risks**  
   `title ~ '${userInput}'`  
   😨 Manual string interpolation can lead to injection attacks

**pb-query solves all this:**  
```ts
pbQuery<Post>()
  .greaterThan('user.age', 25) // Type-checked age
  .and()
  .like('title', `${safeUserInput}`) // Automatic escaping
  .build(pb.filter)
```

### Code Suggestions and JSDoc

Documentation directly in your IDE.

![JSDoc](docs/jsdoc.png)

Leveraging the power of typescript we can give you suggestions based on your schema.

![Field name suggestions](docs/field%20name%20suggestions.png)


## Core Concepts

### Path Modifiers

Access nested fields and special properties using PocketBase's path syntax:

```ts
pbQuery<Post>()
  .equal('user.name', 'Alice') // Access nested properties
  .equal('title:lower', 'hello world') // Case-insensitive (not needed for .like() operators)
  .equal('tags:length', 5) // If array length equals to 5
  .equal('tags:each', 'Tech') // If every array element equals to 'Tech'
```

### Parameter Safety

We don't filter your query by default, so by just using `.build()` you will get the unfiltered query and the values separatelly.

```ts
// ❌ Unfiltered query
const { raw, values } = pbQuery<Post>()
  .like('content', 'Top Secret%')
  .build();

console.log(raw);    // "content~{:content1}"
console.log(values); // { content1: "Top Secret%" }
```

We expose a filter function, but we recommend using the native `pb.filter()` function instead.

```ts
import PocketBase from 'pocketbase';

// PocketBase instance
const pb = new PocketBase("https://example.com")

// ✅ Filtered query
const query = pbQuery<Post>()
  .like('content', 'Top Secret%')
  .build(pb.filter); // use PocketBase's filter function

console.log(query);  // "content~'Top Secret%'"
```

## Basic Operators

### Equality Checks

#### `.equal(path, value)`
```ts
pbQuery<User>().equal('age', 25)
// age=25
```

#### `.notEqual(path, value)`
```ts
pbQuery<User>().notEqual('status', 'banned')
// status!='banned'
```

### Comparisons

#### `.greaterThan(path, value)`
```ts
pbQuery<Post>().greaterThan('views', 1000)
// views>1000
```

#### `.lessThanOrEqual(path, value)`
```ts
pbQuery<Post>().lessThanOrEqual('priority', 3)
// priority<=3
```

### Text Search

#### `.like(path, value)`
```ts
pbQuery<User>().like('email', '%@gmail.com')
// email~'%@gmail.com'
```

#### `.notLike(path, value)`
```ts
pbQuery<User>().notLike('phone', '+1%')
// phone!~'+1%'
```

## Combination Methods

### Logical Operators

#### `.and()`
```ts
pbQuery<User>()
  .equal('role', 'admin')
  .and()
  .greaterThan('loginCount', 10)
// role='admin' && loginCount>10
```

#### `.or()`
```ts
pbQuery<User>()
  .equal('status', 'active')
  .or()
  .equal('status', 'pending')
// status='active' || status='pending'
```

### Grouping

#### `.group(callback)`
```ts
pbQuery<Post>()
  .group(q => 
    q.like('title', '%important%')
      .or()
      .like('content', '%important%')
  )
// (title~'%important%' || content~'%important%')
```


## Collection Operations

### Array Matching

#### `.anyEqual(path, value)`
```ts
pbQuery<Post>().anyEqual('tags', 'urgent')
// tags?='urgent'
```

#### `.anyLike(path, value)`
```ts
pbQuery<User>().anyLike('emails', '%@compromised.com')
// emails?~'%@compromised.com'
```

### Multi-Value Filters

#### `.in(path, values)`
```ts
pbQuery<User>().in('role', ['admin', 'moderator'])
// (role='admin' || role='moderator')
```

#### `.notBetween(path, from, to)`
```ts
pbQuery<Post>()
  .notBetween('createdAt', startDate, endDate)
// (createdAt<'2023-01-01' || createdAt>'2023-12-31')
```

### Any Queries (Any/At least one of)

Useful for queries that involve [back relations](https://pocketbase.io/docs/working-with-relations/#back-relations), [multiple relation](https://pocketbase.io/docs/collections/#relationfield), [multiple select](https://pocketbase.io/docs/collections/#selectfield) or [multiple file](https://pocketbase.io/docs/collections/#filefield).

Return all authors who have published at least one book about "Harry Potter":

```ts
pbQuery<Book>.anyLike('books_via_author.title', 'Harry Potter'); // post_via_author.name?~'Harry Potter'
```

Return all authors who have only published books about "Harry Potter":

```ts
pbQuery<Book>.like('books_via_author.title', 'Harry Potter'); // post_via_author.name~'Harry Potter'
```

Returns all the authors who have published 

> [!NOTE]
> Back-relations by default are resolved as multiple relation field (see the note with the caveats), meaning that similar to all other multi-valued fields (multiple `relation`, `select`, `file`) by default a "match-all" constraint is applied and if you want "any/at-least-one" type of condition then you'll have to prefix the operator with `?`.
>
> @ganigeorgiev in [#6080](https://github.com/pocketbase/pocketbase/discussions/6080#discussioncomment-11526411)

## Advanced Features

### Multi-Field Search

```ts
pbQuery<Post>()
  .search(['title', 'content', 'author.name'], 'NFT')
// (title~'NFT' || content~'NFT' || author.name~'NFT')
```

### Nested Object Filtering

```ts
pbQuery<Post>()
  .equal('user.profile.age', 30)
  .and()
  .like('user.email', '%@example.com')
// user.profile.age=30 && user.email~'%@example.com'
```

### Dynamic Query Building

```ts
function buildSearchQuery(term: string, filters: FilterOptions) {
  return pbQuery<Post>()
    .search(['title', 'content'], term)
    .group(qb => {
      if (filters.urgent) {
        qb.anyGreaterThan('priority', 7)
      }
      if (filters.recent) {
        qb.between('createdAt', subMonths(new Date(), 1), new Date())
      }
      return qb
    })
}
```

## Security Notes

### ⚠️ `.custom()` Warning

Avoid raw SQL-like operations where possible:
```ts
// ❌ Risky
.custom(`content LIKE '%${userInput}%'`)

// ✅ Safe alternative
.like('content', userInput)
```

If you must use `.custom()`, always parameterize:
```ts
.custom(pb.filter('createdAt > {:date}', { date: safeDate }))
```

or in JSVM:

```ts
.custom($dbx.exp('createdAt > {:date}', { date: safeDate }))
```

### 🔧 `.build()` Best Practice

**Always** use PocketBase's native filter handling:
```ts
// ✅ Recommended
const filterString = qb.build(pb.filter);

// ❌ Avoid manual handling
const raw = qb.build().raw;
```

## Real-World Recipes

### Paginated Admin Dashboard

```ts
const buildAdminQuery = (
  searchTerm: string,
  options: {
    minLogins: number
    roles: string[]
    statuses: string[]
  }
) => pbQuery<User>()
  .search(['name', 'email', 'department'], searchTerm)
  .and()
  .greaterThanOrEqual('loginCount', options.minLogins)
  .and()
  .in('role', options.roles)
  .and()
  .group(qb => 
    qb.in('status', options.statuses)
      .or()
      .isNull('status')
  )
```

### E-Commerce Product Filter

```ts
const productQuery = pbQuery<Product>()
  .between('price', minPrice, maxPrice)
  .and()
  .anyLike('tags', `%${category}%`)
  .and()
  .notBetween('stock', 0, 5) // Exclude low stock
  .and()
  .group(qb => 
    qb.equal('color', selectedColor)
      .or()
      .isNotNull('customizationOptions')
  )
```

## Troubleshooting

### Common Issues

**Problem:** "Unclosed groups" error  
**Solution:** Ensure every `.open()`/`.group()` has a matching `.close()`

**Problem:** Type errors on nested paths  
**Fix:** Use correct path modifiers:
```ts
// ❌ Fails
.equal('categories.name', 'Tech')

// ✅ Works
.equal('categories:each.name', 'Tech')
```

**Problem:** Date comparisons not working  
**Fix:** Always use Date objects:
```ts
.between('createdAt', new Date('2023-01-01'), new Date())
```

### Performance Tips

1. **Batch array filters**  
   Use `.anyEqual` instead of multiple `.or()` conditions

2. **Leverage search indexes**  
   Combine `.search()` with PocketBase column indexes

3. **Parameter reuse**  
   The builder automatically reuses parameters:
   ```ts
   pbQuery<User>()
     .equal('city', 'London')
     .or()
     .equal('city', 'London') // Reuses same parameter
   ```

---

**pb-query** is maintained by [@sergio9929](https://github.com/sergio9929) with ❤️  
Found a bug? [Open an issue](https://github.com/your/repo/issues)  
Want to contribute? [Read our guide](CONTRIBUTING.md)  
