(Due to technical issues, the search service is temporarily unavailable.)

# pb-query 🔍✨

**Build type-safe PocketBase queries with the power of TypeScript.**  
*Stop wrestling with filter strings. Start composing queries like code.*

[![npm](https://img.shields.io/npm/v/pb-query)](https://www.npmjs.com/package/pb-query)
[![jsr](https://img.shields.io/badge/jsr-pb--query-blue)](https://jsr.io/@pb-query/core)
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
npm install pb-query

# pnpm
pnpm add pb-query

# yarn
yarn add pb-query
```

Or via JSR:
```bash
npx jsr add @pb/core
```

## Quick Start

```typescript
import { pbQuery } from 'pb-query';
import type { Post } from './types';

// Build a type-safe query for posts
const query = pbQuery<Post>()
  .search(['title', 'content'], 'important')
  .and()
  .between('createdAt', new Date('2023-01-01'), new Date('2023-12-31'))
  .or()
  .group(qb => 
    qb.anyLike('tags', '%urgent%')
      .and()
      .greaterThan('priority', 5)
  )
  .build(pb.filter);

console.log(query);
// (title~'important' || content~'important') 
// && (createdAt>='2023-01-01' && createdAt<='2023-12-31') 
// || ((tags?~'%urgent%' && priority>5))
```

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
   😱 Easy to make syntax errors, hard to maintain

2. **Type Safety Issues**  
   `'user.age > "twenty"'`  
   😬 No type checking for field names or values

3. **Security Risks**  
   `title ~ '${userInput}'`  
   😨 Manual string interpolation risks injection attacks

**pb-query solves all this:**  
```typescript
pbQuery<Post>()
  .greaterThan('user.age', 25) // Type-checked age
  .and()
  .like('title', `%${safeUserInput}%`) // Automatic escaping
  .build(pb.filter)
```

## Core Concepts

### Path Modifiers

Access nested fields and special properties using PocketBase's path syntax:

```typescript
pbQuery<Post>()
  .equal('user.name', 'Alice')         // Direct property
  .equal('tags:length', 5)            // Array length
  .equal('categories:each.name', 'Tech') // Array elements
  .equal('title:lower', 'hello world') // Case-insensitive
```

### Parameter Safety

All values are automatically parameterized:

```typescript
const { raw, values } = pbQuery<Post>()
  .like('content', 'Top Secret%')
  .build();

console.log(raw);    // "content~{:content1}"
console.log(values); // { content1: "Top Secret%" }
```

## Basic Operators

### Equality Checks

#### `.equal(path, value)`
```typescript
pbQuery<User>().equal('age', 25)
// age=25
```

#### `.notEqual(path, value)`
```typescript
pbQuery<User>().notEqual('status', 'banned')
// status!='banned'
```

### Comparisons

#### `.greaterThan(path, value)`
```typescript
pbQuery<Post>().greaterThan('views', 1000)
// views>1000
```

#### `.lessThanOrEqual(path, value)`
```typescript
pbQuery<Post>().lessThanOrEqual('priority', 3)
// priority<=3
```

### Text Search

#### `.like(path, value)`
```typescript
pbQuery<User>().like('email', '%@gmail.com')
// email~'%@gmail.com'
```

#### `.notLike(path, value)`
```typescript
pbQuery<User>().notLike('phone', '+1%')
// phone!~'+1%'
```

## Combination Methods

### Logical Operators

#### `.and()`
```typescript
pbQuery<User>()
  .equal('role', 'admin')
  .and()
  .greaterThan('loginCount', 10)
// role='admin' && loginCount>10
```

#### `.or()`
```typescript
pbQuery<User>()
  .equal('status', 'active')
  .or()
  .equal('status', 'pending')
// status='active' || status='pending'
```

### Grouping

#### `.group(callback)`
```typescript
pbQuery<Post>()
  .group(qb => 
    qb.like('title', '%important%')
      .or()
      .like('content', '%important%')
  )
// (title~'%important%' || content~'%important%')
```

#### `.open()`/`.close()`
```typescript
pbQuery<User>()
  .open()
    .equal('age', 20)
    .or()
    .equal('age', 30)
  .close()
  .and()
  .equal('verified', true)
// (age=20 || age=30) && verified=true
```

## Collection Operations

### Array Matching

#### `.anyEqual(path, value)`
```typescript
pbQuery<Post>().anyEqual('tags', 'urgent')
// tags?='urgent'
```

#### `.anyLike(path, value)`
```typescript
pbQuery<User>().anyLike('emails', '%@compromised.com')
// emails?~'%@compromised.com'
```

### Multi-Value Filters

#### `.in(path, values)`
```typescript
pbQuery<User>().in('role', ['admin', 'moderator'])
// (role='admin' || role='moderator')
```

#### `.notBetween(path, from, to)`
```typescript
pbQuery<Post>()
  .notBetween('createdAt', startDate, endDate)
// (createdAt<'2023-01-01' || createdAt>'2023-12-31')
```

## Advanced Features

### Multi-Field Search

```typescript
pbQuery<Post>()
  .search(['title', 'content', 'author.name'], 'NFT')
// (title~'NFT' || content~'NFT' || author.name~'NFT')
```

### Nested Object Filtering

```typescript
pbQuery<Post>()
  .equal('user.profile.age', 30)
  .and()
  .like('user.email', '%@example.com')
// user.profile.age=30 && user.email~'%@example.com'
```

### Dynamic Query Building

```typescript
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
```typescript
// ❌ Risky
.custom(`content LIKE '%${userInput}%'`)

// ✅ Safe alternative
.like('content', userInput)
```

If you must use `.custom()`, always parameterize:
```typescript
.custom(pb.filter('createdAt > {:date}', { date: safeDate }))
```

### 🔧 `.build()` Best Practice

**Always** use PocketBase's native filter handling:
```typescript
// ✅ Recommended
const filterString = qb.build(pb.filter);

// ❌ Avoid manual handling
const raw = qb.build().raw;
```

## Real-World Recipes

### Paginated Admin Dashboard

```typescript
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

```typescript
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
```typescript
// ❌ Fails
.equal('categories.name', 'Tech')

// ✅ Works
.equal('categories:each.name', 'Tech')
```

**Problem:** Date comparisons not working  
**Fix:** Always use Date objects:
```typescript
.between('createdAt', new Date('2023-01-01'), new Date())
```

### Performance Tips

1. **Batch array filters**  
   Use `.anyEqual` instead of multiple `.or()` conditions

2. **Leverage search indexes**  
   Combine `.search()` with PocketBase column indexes

3. **Parameter reuse**  
   The builder automatically reuses parameters:
   ```typescript
   pbQuery<User>()
     .equal('city', 'London')
     .or()
     .equal('city', 'London') // Reuses same parameter
   ```

---

**pb-query** is maintained by [Your Company] with ❤️  
Found a bug? [Open an issue](https://github.com/your/repo/issues)  
Want to contribute? [Read our guide](CONTRIBUTING.md)  

*Empowering developers to build safer, better typed applications since 2023*