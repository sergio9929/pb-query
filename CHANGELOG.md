# @sergio9929/pb-query

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
