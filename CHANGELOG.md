# @sergio9929/pb-query

## 0.3.1

### Patch Changes

- Fix unexpected type errors with back-relations

  Back-relations caused type errors when the provided type had no relation fields.

  Example of the error before the fix:

  ```ts
  interface SpecialPost {
    id: string;
    title: string;
    content: string;
    created: Date;
    updated: Date;
    // Note that this has no relation fields
  }

  const queryTTT = pbQuery<SpecialPost>()
    .expand(["author.a_via_b.record.b_via_c"])
    .build(filter);
  // TS Error: Argument of type '"anything_via_author.anything"' is not assignable to parameter of type 'Path<SpecialPost, 6>'.
  ```

  This works perfectly fine now.

## 0.3.0

### Minor Changes

- 🚨 Breaking Change: `.build()` Return Type

  The `.build()` method now returns a complete query object instead of just the filter. This is the only breaking change.

  **Before (v0.2.9):**

  ```ts
  // PocketBase instance
  const pb = new PocketBase("https://example.com");

  // Without filter function:
  const rawQuery = pbQuery<Post>().equal("author.name", "John").build();
  console.log(rawQuery);
  // Output:
  // {
  //     raw: 'author.name={:author.name1}',
  //     values: { 'author.name1': 'John' }
  // }

  // With filter function:
  const stringQuery = pbQuery<Post>()
    .equal("author.name", "John")
    .build(pb.filter);
  console.log(stringQuery); // Output: "author.name='John'"

  // Usage
  const records = await pb.collection("posts").getList(1, 20, {
    filter: stringQuery,
  });
  ```

  **After (v0.3.0):**

  ```ts
  // PocketBase instance
  const pb = new PocketBase("https://example.com");

  // Now always returns { filter, fields, expand, sort }
  const query = pbQuery<Post>().build(pb.filter);

  console.log(query);
  // Output:
  // {
  //     filter: "author.name='John'", // or { raw, values } without the filter function
  //     fields: '',
  //     expand: '',
  //     sort: ''
  // }

  // Usage
  const records = await pb.collection("posts").getList(1, 20, query);
  ```

- New Methods:

  #### `.fields(keys)`

  **_Starter_**, **_Once_** - This can only be used once, at the start.

  Accepts a single key or an array of keys.

  Selects which fields to return from PocketBase. `expand()` is not needed if `fields()` is used, we automatically include what to [expand](https://pocketbase.io/docs/working-with-relations/#expanding-relations).

  ```ts
  const { fields, expand } = pbQuery<Post>()
    .fields([
      "title", // Basic field
      "content:excerpt(100,true)", // Field with excerpt modifier
      "author", // Relation ID field
      "expand.author", // Expanded relation field
      "expand.comments_via_post", // Back-relation expansion
    ])
    .build(pb.filter);

  console.log(fields); // Output: 'title,content:excerpt(100,true),author,expand.author,expand.comments_via_post'
  console.log(expand); // Output: 'author,comments_via_post'
  ```

  [Read more](https://github.com/sergio9929/pb-query/tree/a30da9b086ea00e47df1564564059a934ff0a08d?tab=readme-ov-file#fields-and-expand)

  #### `.expand(keys)`

  **_Starter_**, **_Once_** - This can only be used once, at the start.

  Accepts a single key or an array of keys.

  Expands information from related collections. `expand()` is not needed if `fields()` is used, we automatically include what to [expand](https://pocketbase.io/docs/working-with-relations/#expanding-relations). If used together with `fields()`, it overrides the automatic expansion.

  ```ts
  const { fields, expand } = pbQuery<Post>()
    .expand(["author", "comments_via_post"])
    .build(pb.filter);

  console.log(fields); // Output: ''
  console.log(expand); // Output: 'author,comments_via_post'
  ```

  [Read more](https://github.com/sergio9929/pb-query/tree/a30da9b086ea00e47df1564564059a934ff0a08d?tab=readme-ov-file#fields-and-expand)

  #### `.sort(keys)`

  **_Once_** - This can only be used once.

  Accepts a single key or an array of keys.

  Sorts the results by the specified keys.

  ```ts
  const { sort } = pbQuery<Post>().sort(["title", "-created"]).build(pb.filter);

  console.log(sort); // Output: 'title,-created'
  ```

  [Read more](https://github.com/sergio9929/pb-query/tree/a30da9b086ea00e47df1564564059a934ff0a08d?tab=readme-ov-file#sorting)

- Minor improvements:
  - `pbQuery()` can be used without passing a generic.
  - We now expose more types, including a `GeoPoint` type.

## 0.2.9

### Patch Changes

- Added support for datetime macros

  You can now use [PocketBase's datetime macros](https://pocketbase.io/docs/api-rules-and-filters/#-macros) in your queries.

  - `@now`: Current datetime.
  - `@yesterday`: 24 hours before `@now`.
  - `@tomorrow`: 24 hours after`@now`.
  - `@todayStart`: Current date (00:00:00.000Z).
  - `@todayEnd`: Current date (23:59:59.999Z).
  - `@monthStart`: Current month (00:00:00.000Z).
  - `@monthEnd`: Current month (23:59:59.999Z).
  - `@yearStart`: Current year (00:00:00.000Z).
  - `@yearEnd`: Current year (23:59:59.999Z).
  - And [more...](https://pocketbase.io/docs/api-rules-and-filters/#-macros)

  Example:

  ```ts
  pbQuery<Post>()
    .between("created", new Date("2021-01-01"), "@now")
    .build(pb.filter); // (created>='2021-01-01 00:00:00.000Z' && created<=@now)
  ```

## 0.2.8

### Patch Changes

- add keywords for npm

## 0.2.7

### Patch Changes

- replace MIT license with UNLICENSE

## 0.2.6

### Patch Changes

- Greatly improve type hints

  VS Code was previously displaying extremely long and unreadable type hints, for example, when hitting **Ctrl+Space** on `pbQuery().equal|`. This was caused by TypeScript fully expanding deeply recursive types.

  Before:

  ```
  (method) QueryBuilder<Post, 6>.equal<P>(key: P, value: P extends `${infer _Prefix}_via_${infer _Suffix}` ? unknown : P extends `${infer Key}.${infer Rest}` ? Key extends keyof Post ? Post[Key] extends readonly (infer E)[] ? Rest extends `${infer _Prefix}_via_${infer _Suffix}` ? unknown : Rest extends `${infer Key}.${infer Rest}` ? Key extends keyof E ? E[Key] extends readonly (infer E)[] ? Rest extends `${infer _Prefix}_via_${infer _Suffix}` ? unknown : Rest extends `${infer Key}.${infer Rest}` ? Key extends keyof E ? E[Key] extends readonly (infer E)[] ? Rest extends `${infer _Prefix}_via_${infer _Suffix}` ? unknown : Rest extends `${infer Key}.${infer Rest}` ? Key extends keyof E ? E[Key] extends readonly (infer E)[] ? Rest extends `${infer _Prefix}_via_${infer _Suffix}` ? unknown : Rest extends `${infer Key}.${infer Rest}` ? Key extends keyof E ? E[Key] extends readonly (infer E)[] ? Rest extends `${infer _Prefix}_via_${infer _Suffix}` ? unknown : Rest extends `${infer Key}.${infer Rest}` ? Key extends keyof E ? E[Key] extends readonly (infer E)[] ? never : never : never : Rest extends `${infer Key}:${infer Modifier}` ? Key extends keyof E ? HandleModifier<...> : never : Rest extends keyof E ? E[Rest] extends object[] ? string : E[Rest] extends unknown[] ? E[Rest][number] : E[Rest] extends Date ? E[Rest] : E[Rest] extends object ? string : E[Rest] : never : Rest extends `${infer _Prefix}_via_${infer _Suffix}` ? unknown : Rest extends `${infer Key}.${infer Rest}` ? Key extends keyof E[Key] ? E[Key][Key] extends readonly (infer E)[] ? never : never : never : Rest extends `${infer Key}:${infer Modifier}` ? Key ...
  ---
  Matches records where key equals value.

  @example

  pbQuery<Post>().equal('author.name', 'Alice'); // name='Alice'
  // This is case-sensitive. Use the `:lower` modifier for case-insensitive matching.
  pbQuery<Post>().equal('author.name:lower', 'alice'); // name:lower='alice'
  ```

  After:

  ```
  (method) QueryBuilder<Post, 6>.equal<P>(key: P, value: PathValueHelper<Post, P, 6, 0>): RestrictedQueryBuilder<Post, 6>
  ---
  Matches records where key equals value.

  @example

  pbQuery<Post>().equal('author.name', 'Alice'); // name='Alice'
  // This is case-sensitive. Use the `:lower` modifier for case-insensitive matching.
  pbQuery<Post>().equal('author.name:lower', 'alice'); // name:lower='alice'
  ```

## 0.2.5

### Patch Changes

- include MIT license

## 0.2.4

### Patch Changes

- fix date output format in the docs

## 0.2.3

### Patch Changes

- Update README

## 0.2.2

### Patch Changes

- Add documentation for PocketBase Hooks

## 0.2.1

### Patch Changes

- fix typos in the docs

## 0.2.0

### Minor Changes

- 02be476: Add support for back relations and improve docs

  - Add support for back relations.
  - improve docks.

  - Rename `createdAt` to `created`.
  - Rename `updatedAt` to `updated`.
  - Fix relation field types.

## 0.1.1

### Patch Changes

- remove chatgpt crap from readme

## 0.1.0

### Minor Changes

- 9f2ca18: fix JSDoc and create README

## 0.0.4

### Patch Changes

- 5331920: minify release build

## 0.0.3

### Patch Changes

- 17fb3a4: DO NOT PUBLISH THE WHOLE REPO WTF!

## 0.0.2

### Patch Changes

- eeae67c: fix MaxDepth and improve JSDoc

  - Remove `.open()` and `.close()`, use `.group()` insetead.
