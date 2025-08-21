import type { DATETIME_MACROS } from './constants'

export type FilterFunction = (
    raw: string,
    params?: {
        [key: string]: unknown
    },
) => string

export type DatetimeMacro = (typeof DATETIME_MACROS)[number]

export type RawQueryObject = { raw: string; values: Record<string, unknown> }
export type QueryResult<T = string> = {
    filter: T
    fields: string
    expand: string
    sort: string
}

export type GeoPoint = { lon: string; lat: string }

type SortKey<K extends string> = `${K}` | `-${K}` | `+${K}`

type Exact<T, U, Y = unknown, N = never> = (<G>() => G extends T
    ? 1
    : 2) extends <G>() => G extends U ? 1 : 2
    ? Y
    : N

type DepthCounter = [1, 2, 3, 4, 5, 6, never]

/**
 * Forces the IDE to display the type alias instead of the full type union.
 */
type ForceAlias<T> = T & {}

/**
 * A lazy way of doing `T[keyof T][number]`.
 */
type Elem<T> = T extends readonly (infer U)[] ? U : never

type PathHelper<
    T,
    K extends keyof T & string,
    TextField,
    DateField,
    GeoPointField,
    MultipleField,
    RelationField,
    MultipleRelationField,
    Other,
> = T[K] extends string
    ? TextField
    : T[K] extends readonly object[]
      ? MultipleRelationField
      : T[K] extends readonly unknown[]
        ? MultipleField
        : T[K] extends Date
          ? DateField
          : Exact<T[K], GeoPoint, 1, 2> extends 1
            ? GeoPointField
            : T[K] extends object
              ? RelationField
              : Other

export type Path<T, MaxDepth extends number> = ForceAlias<FullPath<T, MaxDepth>>
type FullPath<
    T,
    MaxDepth extends number,
    K extends keyof T = keyof T,
    D extends number = 0,
> = D extends MaxDepth
    ? never
    : K extends string // This filters out symbol keys, now K is guaranteed to be string key
      ? PathHelper<
            T,
            K,
            // Text
            `${K}` | `${K}:lower`,
            // Date
            `${K}`,
            // GeoPoint
            `${K}.${FullPath<T[K], MaxDepth, keyof T[K], DepthCounter[D]>}`,
            // Multiple
            `${K}` | `${K}:each` | `${K}:length`,
            // Relation
            | `${K}`
            | `${K}.${FullPath<T[K], MaxDepth, keyof T[K], DepthCounter[D]>}`
            | `${string}_via_${string}.${string}`,
            // Multiple Relation
            | `${K}`
            | `${K}:each`
            | `${K}:length`
            | `${K}.${FullPath<Elem<T[K]>, MaxDepth, keyof Elem<T[K]>, DepthCounter[D]>}`
            | `${string}_via_${string}.${string}`,
            // Other
            `${K}`
        >
      : never

export type PathExpand<T, MaxDepth extends number> = ForceAlias<
    FullPathExpand<T, MaxDepth>
>
type FullPathExpand<
    T,
    MaxDepth extends number,
    K extends keyof T = keyof T,
    D extends number = 0,
> = D extends MaxDepth
    ? never
    : K extends string // This filters out symbol keys, now K is guaranteed to be string key
      ? PathHelper<
            T,
            K,
            // Text
            never,
            // Date
            never,
            // GeoPoint
            never,
            // Multiple
            never,
            // Relation
            | `${K}`
            | `${K}.${FullPathExpand<T[K], MaxDepth, keyof T[K], DepthCounter[D]>}`
            | `${string}_via_${string}`
            | `${string}_via_${string}.${string}`,
            // Multiple Relation
            | `${K}`
            | `${K}.${FullPathExpand<Elem<T[K]>, MaxDepth, keyof Elem<T[K]>, DepthCounter[D]>}`
            | `${string}_via_${string}`
            | `${string}_via_${string}.${string}`,
            // Other
            never
        >
      : never

export type PathFields<T, MaxDepth extends number> = ForceAlias<
    FullPathFields<T, MaxDepth>
>
type FullPathFields<
    T,
    MaxDepth extends number,
    K extends keyof T = keyof T,
    D extends number = 0,
> = D extends MaxDepth
    ? never
    : K extends string // This filters out symbol keys, now K is guaranteed to be string key
      ?
            | PathHelper<
                  T,
                  K,
                  // Text
                  | `${K}`
                  | `${K}:excerpt(${number},${boolean})`
                  | `${K}:excerpt(${number}, ${boolean})`,
                  // Date
                  `${K}`,
                  // GeoPoint
                  | `${K}`
                  | `${K}.${FullPathFields<T[K], MaxDepth, keyof T[K], DepthCounter[D]>}`,
                  // Multiple
                  `${K}`,
                  // Relation
                  | `${K}`
                  | `expand.${K}`
                  | `expand.${K}.*`
                  | `expand.${K}.${FullPathFields<T[K], MaxDepth, keyof T[K], DepthCounter[D]>}`
                  | `${string}_via_${string}`
                  | `expand.${string}_via_${string}`
                  | `expand.${string}_via_${string}.${string}`,
                  // Multiple Relation
                  | `${K}`
                  | `expand.${K}`
                  | `expand.${K}.*`
                  | `expand.${K}.${FullPathFields<Elem<T[K]>, MaxDepth, keyof Elem<T[K]>, DepthCounter[D]>}`
                  | `${string}_via_${string}`
                  | `expand.${string}_via_${string}`
                  | `expand.${string}_via_${string}.${string}`,
                  // Other
                  `${K}`
              >
            | '*'
      : never

export type PathSort<T, MaxDepth extends number> = ForceAlias<
    FullPathSort<T, MaxDepth>
>
type FullPathSort<
    T,
    MaxDepth extends number,
    K extends keyof T = keyof T,
    D extends number = 0,
> = D extends MaxDepth
    ? never
    : K extends string // This filters out symbol keys, now K is guaranteed to be string key
      ? '@random' | '@rowid' | SortKey<PathSortLoop<T, MaxDepth, K, D>>
      : never

type PathSortLoop<
    T,
    MaxDepth extends number,
    K extends keyof T = keyof T,
    D extends number = 0,
> = D extends MaxDepth
    ? never
    : K extends string // This filters out symbol keys, now K is guaranteed to be string key
      ? PathHelper<
            T,
            K,
            // Text
            `${K}`,
            // Date
            `${K}`,
            // GeoPoint
            `${K}.${PathSortLoop<T[K], MaxDepth, keyof T[K], DepthCounter[D]>}`,
            // Multiple
            `${K}`,
            // Relation
            | `${K}`
            | `${K}.${PathSortLoop<T[K], MaxDepth, keyof T[K], DepthCounter[D]>}`
            | `${string}_via_${string}.${string}`,
            // Multiple Relation
            | `${K}`
            | `${K}.${PathSortLoop<Elem<T[K]>, MaxDepth, keyof Elem<T[K]>, DepthCounter[D]>}`
            | `${string}_via_${string}.${string}`,
            // Other
            `${K}`
        >
      : never

type PathValueHelper<
    T,
    P extends string,
    MaxDepth extends number,
    D extends number,
> = P extends `${infer _Prefix}_via_${infer _Suffix}`
    ? unknown
    : P extends `${infer Key}.${infer Rest}`
      ? Key extends keyof T
          ? T[Key] extends readonly (infer E)[]
              ? PathValue<E, Rest, MaxDepth, DepthCounter[D]> // If it's an array, continue resolving on its elements
              : PathValue<T[Key], Rest, MaxDepth, DepthCounter[D]> // Otherwise, continue resolving normally
          : never
      : P extends `${infer Key}:${infer Modifier}`
        ? Key extends keyof T
            ? HandleModifier<T[Key], Modifier>
            : never
        : P extends keyof T
          ? T[P] extends object[]
              ? string
              : T[P] extends unknown[]
                ? T[P][number]
                : T[P] extends Date
                  ? T[P] | DatetimeMacro
                  : T[P] extends object
                    ? string
                    : T[P]
          : never

export type PathValue<
    T,
    P extends string,
    MaxDepth extends number,
    D extends number = 0,
> = D extends MaxDepth ? never : PathValueHelper<T, P, MaxDepth, D>

export type HandleModifier<V, Modifier extends string> = Modifier extends 'each'
    ? V extends number[]
        ? number
        : string
    : Modifier extends 'length'
      ? number
      : Modifier extends 'lower'
        ? string
        : never

export interface QueryBuilderStart<
    T,
    MaxDepth extends number = 6,
    Once extends keyof QueryBuilderStart<T, MaxDepth> | '' = '',
> extends QueryBuilder<T, MaxDepth> {
    /**
     * **_Starter_**, **_Once_** - This can only be used once, at the start.
     *
     * Select which fields to return from PocketBase. `expand()` is not needed if `fields()` is used, we automatically include what to [expand](https://pocketbase.io/docs/working-with-relations/#expanding-relations).
     *
     * Modifiers:
     * - `*` targets all keys from the specific depth level.
     * - `:excerpt(maxLength, withEllipsis?)` returns a short plain text version of the field string value.
     *
     * @example
     * ```ts
     * const query = pbQuery<Post>()
     *     .fields([
     *         'title',                     // Basic field
     *         'content:excerpt(100,true)', // Field with excerpt modifier
     *         'author',                    // Relation ID field
     *         'expand.author',             // Expanded relation field
     *         'expand.comments_via_post',  // Back-relation expansion
     *     ])
     *     .sort(['title', 'author'])
     *     .build(pb.filter);
     *
     * console.log(query.expand); // Output: 'author,comments_via_post'
     * console.log(query.sort);   // Output: 'title,author'
     *
     * const records = await pb.collection('posts').getList(1, 20, query);
     *
     * console.log(records);
     * // Output:
     * // [
     * //     {
     * //         author: 'authorId',
     * //         title: 'Football match this Saturday',
     * //         content: 'Lorem ipsum dolor sit amet.',
     * //         expand: {
     * //             author: {
     * //                 name: 'John',
     * //             },
     * //             comments_via_post: [
     * //                 { ... },
     * //             ],
     * //         },
     * //     },
     * // ]
     * ```
     *
     * @example
     * With the key `expand.*` we can't automatically include what to [expand](https://pocketbase.io/docs/working-with-relations/#expanding-relations), so it must be specified manually.
     *
     * ```ts
     * const query = pbQuery<Post>()
     *   .fields(['title', 'expand.*'])
     *   .expand(['author', 'comments_via_post'])
     *   .build(pb.filter);
     *
     * console.log(query.fields); // Output: 'title,expand.*'
     * console.log(query.expand); // Output: 'author,comments_via_post'
     * ```
     *
     * @since 0.3.0
     */
    fields<P extends PathFields<T, MaxDepth>>(
        keys: P | P[],
    ): Omit<QueryBuilderStart<T, MaxDepth, Once | 'fields'>, Once | 'fields'>

    /**
     * **_Starter_**, **_Once_** - This can only be used once, at the start.
     *
     * `expand()` is not needed if `fields()` is used, we automatically include what to [expand](https://pocketbase.io/docs/working-with-relations/#expanding-relations). If used together with `fields()`, it overrides the automatic expansion.
     *
     * Notes:
     * - Supports up to 6-levels depth nested relations expansion.
     * - The expanded relations will be appended to the record under the [`expand`](https://pocketbase.io/docs/working-with-relations/#expanding-relations) property (e.g. `"expand": { "relField1": { ... }, ... }`).
     * - Only the relations to which the request user has permissions to view will be expanded.
     *
     * Read more about [expand](https://pocketbase.io/docs/working-with-relations/#expanding-relations) in the [official documentation](https://pocketbase.io/docs/working-with-relations/#expanding-relations).
     *
     * @example
     * ```ts
     * const query = pbQuery<Post>()
     *     .expand([
     *         'author',
     *         'comments_via_post',
     *     ])
     *     .build(pb.filter);
     *
     * console.log(query.fields); // Output: ''
     * console.log(query.expand); // Output: 'author,comments_via_post'
     *
     * const records = await pb.collection('posts').getList(1, 20, query);
     *
     * console.log(records);
     * // Output:
     * // [
     * //     {
     * //         expand: {
     * //             author: { ... },
     * //             comments_via_post: [
     * //                 { ... },
     * //             ],
     * //         },
     * //         ...,
     * //     },
     * // ]
     * ```
     *
     * @since 0.3.0
     */
    expand<P extends PathExpand<T, MaxDepth>>(
        keys: P | P[],
    ): Omit<QueryBuilderStart<T, MaxDepth, Once | 'expand'>, Once | 'expand'>
}

export interface QueryBuilder<
    T,
    MaxDepth extends number = 6,
    Once extends keyof QueryBuilder<T, MaxDepth> | '' = '',
> extends QueryBuilderEnd,
        SortMethod<
            T,
            MaxDepth,
            QueryBuilder<T, MaxDepth, Once | 'sort'>,
            Once | 'sort'
        > {
    /**
     * Matches records where `key` equals `value`.
     *
     * @example
     * ```ts
     * pbQuery<Post>().equal('author.name', 'Alice'); // name='Alice'
     * // This is case-sensitive. Use the `:lower` modifier for case-insensitive matching.
     * pbQuery<Post>().equal('author.name:lower', 'alice'); // name:lower='alice'
     * ```
     */
    equal<P extends Path<T, MaxDepth>>(
        key: P,
        value: PathValue<T, P, MaxDepth>,
    ): Omit<RestrictedQueryBuilder<T, MaxDepth, Once>, Once>

    /**
     * Matches records where `key` is not equal to `value`.
     *
     * @example
     * ```ts
     * pbQuery<Post>().notEqual('author.name', 'Alice'); // name!='Alice'
     * // This is case-sensitive. Use the `:lower` modifier for case-insensitive matching.
     * pbQuery<Post>().notEqual('author.name:lower', 'alice'); // name:lower!='alice'
     * ```
     */
    notEqual<P extends Path<T, MaxDepth>>(
        key: P,
        value: PathValue<T, P, MaxDepth>,
    ): Omit<RestrictedQueryBuilder<T, MaxDepth, Once>, Once>

    /**
     * Matches records where `key` is greater than `value`.
     *
     * [PocketBase's datetime macros](https://pocketbase.io/docs/api-rules-and-filters/#-macros) could be helpful when comparing dates: `@now`, `@yesterday`, `@tomorrow`, `@todayStart`, `@todayEnd`, `@monthStart`, `@monthEnd`, `@yearStart`, `@yearEnd`, [more...](https://pocketbase.io/docs/api-rules-and-filters/#-macros)
     *
     * @example
     * ```ts
     * pbQuery<User>().greaterThan('age', 21); // age>21
     * pbQuery<User>().greaterThan('created', new Date('2021-01-01')); // created>'2021-01-01 00:00:00.000Z'
     * ```
     */
    greaterThan<P extends Path<T, MaxDepth>>(
        key: P,
        value: PathValue<T, P, MaxDepth>,
    ): Omit<RestrictedQueryBuilder<T, MaxDepth, Once>, Once>

    /**
     * Matches records where `key` is greater than or equal to `value`.
     *
     * [PocketBase's datetime macros](https://pocketbase.io/docs/api-rules-and-filters/#-macros) could be helpful when comparing dates: `@now`, `@yesterday`, `@tomorrow`, `@todayStart`, `@todayEnd`, `@monthStart`, `@monthEnd`, `@yearStart`, `@yearEnd`, [more...](https://pocketbase.io/docs/api-rules-and-filters/#-macros)
     *
     * @example
     * ```ts
     * pbQuery<User>().greaterThanOrEqual('age', 18); // age>=18
     * pbQuery<User>().greaterThanOrEqual('created', new Date('2021-01-01')); // created>='2021-01-01 00:00:00.000Z'
     * ```
     */
    greaterThanOrEqual<P extends Path<T, MaxDepth>>(
        key: P,
        value: PathValue<T, P, MaxDepth>,
    ): Omit<RestrictedQueryBuilder<T, MaxDepth, Once>, Once>

    /**
     * Matches records where `key` is less than `value`.
     *
     * [PocketBase's datetime macros](https://pocketbase.io/docs/api-rules-and-filters/#-macros) could be helpful when comparing dates: `@now`, `@yesterday`, `@tomorrow`, `@todayStart`, `@todayEnd`, `@monthStart`, `@monthEnd`, `@yearStart`, `@yearEnd`, [more...](https://pocketbase.io/docs/api-rules-and-filters/#-macros)
     *
     * @example
     * ```ts
     * pbQuery<User>().lessThan('age', 50); // age<50
     * pbQuery<User>().lessThan('created', new Date('2021-01-01')); // created<'2021-01-01 00:00:00.000Z'
     * ```
     */
    lessThan<P extends Path<T, MaxDepth>>(
        key: P,
        value: PathValue<T, P, MaxDepth>,
    ): Omit<RestrictedQueryBuilder<T, MaxDepth, Once>, Once>

    /**
     * Matches records where `key` is less than or equal to `value`.
     *
     * [PocketBase's datetime macros](https://pocketbase.io/docs/api-rules-and-filters/#-macros) could be helpful when comparing dates: `@now`, `@yesterday`, `@tomorrow`, `@todayStart`, `@todayEnd`, `@monthStart`, `@monthEnd`, `@yearStart`, `@yearEnd`, [more...](https://pocketbase.io/docs/api-rules-and-filters/#-macros)
     *
     * @example
     * ```ts
     * pbQuery<User>().lessThanOrEqual('age', 65); // age<=65
     * pbQuery<User>().lessThanOrEqual('created', new Date('2021-01-01')); // created<='2021-01-01 00:00:00.000Z'
     * ```
     */
    lessThanOrEqual<P extends Path<T, MaxDepth>>(
        key: P,
        value: PathValue<T, P, MaxDepth>,
    ): Omit<RestrictedQueryBuilder<T, MaxDepth, Once>, Once>

    /**
     * Matches records where `key` contains `value`.
     *
     * It is case-insensitive, so the `:lower` [modifier](https://pocketbase.io/docs/api-rules-and-filters/#special-identifiers-and-modifiers) is unnecessary.
     *
     * @example Contains
     * ```ts
     * pbQuery<Post>().like('author.name', 'Joh'); // name~'Joh' / name~'%Joh%'
     * // If not specified, auto-wraps the value in `%` for wildcard matching.
     * ```
     *
     * @example Starts with
     * ```ts
     * pbQuery<Post>().like('author.name', 'Joh%'); // name~'Joh%'
     * ```
     *
     * @example Ends with
     * ```ts
     * pbQuery<Post>().like('author.name', '%Doe'); // name~'%Doe'
     * ```
     */
    like<P extends Path<T, MaxDepth>>(
        key: P,
        value: PathValue<T, P, MaxDepth>,
    ): Omit<RestrictedQueryBuilder<T, MaxDepth, Once>, Once>

    /**
     * Matches records where `key` doesn't contain `value`.
     *
     * It is case-insensitive, so the `:lower` [modifier](https://pocketbase.io/docs/api-rules-and-filters/#special-identifiers-and-modifiers) is unnecessary.
     *
     * @example Doesn't contain
     * ```ts
     * pbQuery<Post>().notLike('author.name', 'Joh'); // name!~'Joh' / name!~'%Joh%'
     * // If not specified, auto-wraps the value in `%` for wildcard matching.
     * ```
     *
     * @example Doesn't start with
     * ```ts
     * pbQuery<Post>().notLike('author.name', 'Joh%'); // name!~'Joh%'
     * ```
     *
     * @example Doesn't end with
     * ```ts
     * pbQuery<Post>().notLike('author.name', '%Doe'); // name!~'%Doe'
     * ```
     */
    notLike<P extends Path<T, MaxDepth>>(
        key: P,
        value: PathValue<T, P, MaxDepth>,
    ): Omit<RestrictedQueryBuilder<T, MaxDepth, Once>, Once>

    /**
     * Useful for queries involving [back-relations](https://pocketbase.io/docs/working-with-relations/#back-relations), [multiple relation](https://pocketbase.io/docs/collections/#relationfield), [multiple select](https://pocketbase.io/docs/collections/#selectfield), or [multiple file](https://pocketbase.io/docs/collections/#filefield).
     *
     * Matches records where at least one of the values in the given `key` equals `value`.
     *
     * @example
     * ```ts
     * pbQuery<Book>().anyEqual('books_via_author.title', 'The Island'); // post_via_author.name?='The Island'
     *
     * // This is case-sensitive. Use the `:lower` modifier for case-insensitive matching.
     * pbQuery<Book>().anyEqual('books_via_author.title:lower', 'the island'); // post_via_author.name:lower?='the island'
     * ```
     */
    anyEqual<P extends Path<T, MaxDepth>>(
        key: P,
        value: PathValue<T, P, MaxDepth>,
    ): Omit<RestrictedQueryBuilder<T, MaxDepth, Once>, Once>

    /**
     * Useful for queries involving [back-relations](https://pocketbase.io/docs/working-with-relations/#back-relations), [multiple relation](https://pocketbase.io/docs/collections/#relationfield), [multiple select](https://pocketbase.io/docs/collections/#selectfield), or [multiple file](https://pocketbase.io/docs/collections/#filefield).
     *
     * Matches records where at least one of the values in the given `key` is not equal to `value`.
     *
     * @example
     * ```ts
     * pbQuery<Book>().anyNotEqual('books_via_author.title', 'The Island'); // post_via_author.name?!='The Island'
     *
     * // This is case-sensitive. Use the `:lower` modifier for case-insensitive matching.
     * pbQuery<Book>().anyNotEqual('books_via_author.title:lower', 'the island'); // post_via_author.name:lower?!='the island'
     * ```
     */
    anyNotEqual<P extends Path<T, MaxDepth>>(
        key: P,
        value: PathValue<T, P, MaxDepth>,
    ): Omit<RestrictedQueryBuilder<T, MaxDepth, Once>, Once>

    /**
     * Useful for queries involving [back-relations](https://pocketbase.io/docs/working-with-relations/#back-relations), [multiple relation](https://pocketbase.io/docs/collections/#relationfield), [multiple select](https://pocketbase.io/docs/collections/#selectfield), or [multiple file](https://pocketbase.io/docs/collections/#filefield).
     *
     * Matches records where at least one of the values in the given `key` is greater than `value`.
     *
     * @example
     * ```ts
     * pbQuery<User>().anyGreaterThan('age', 21); // age?>21
     * ```
     */
    anyGreaterThan<P extends Path<T, MaxDepth>>(
        key: P,
        value: PathValue<T, P, MaxDepth>,
    ): Omit<RestrictedQueryBuilder<T, MaxDepth, Once>, Once>

    /**
     * Useful for queries involving [back-relations](https://pocketbase.io/docs/working-with-relations/#back-relations), [multiple relation](https://pocketbase.io/docs/collections/#relationfield), [multiple select](https://pocketbase.io/docs/collections/#selectfield), or [multiple file](https://pocketbase.io/docs/collections/#filefield).
     *
     * Matches records where at least one of the values in the given `key` is greater than or equal to `value`.
     *
     * @example
     * ```ts
     * pbQuery<User>().anyGreaterThanOrEqual('age', 18); // age?>=18
     * ```
     */
    anyGreaterThanOrEqual<P extends Path<T, MaxDepth>>(
        key: P,
        value: PathValue<T, P, MaxDepth>,
    ): Omit<RestrictedQueryBuilder<T, MaxDepth, Once>, Once>

    /**
     * Useful for queries involving [back-relations](https://pocketbase.io/docs/working-with-relations/#back-relations), [multiple relation](https://pocketbase.io/docs/collections/#relationfield), [multiple select](https://pocketbase.io/docs/collections/#selectfield), or [multiple file](https://pocketbase.io/docs/collections/#filefield).
     *
     * Matches records where at least one of the values in the given `key` is less than `value`.
     *
     * @example
     * ```ts
     * pbQuery<User>().anyLessThan('age', 50); // age?<50
     * ```
     */
    anyLessThan<P extends Path<T, MaxDepth>>(
        key: P,
        value: PathValue<T, P, MaxDepth>,
    ): Omit<RestrictedQueryBuilder<T, MaxDepth, Once>, Once>

    /**
     * Useful for queries involving [back-relations](https://pocketbase.io/docs/working-with-relations/#back-relations), [multiple relation](https://pocketbase.io/docs/collections/#relationfield), [multiple select](https://pocketbase.io/docs/collections/#selectfield), or [multiple file](https://pocketbase.io/docs/collections/#filefield).
     *
     * Matches records where at least one of the values in the given `key` is less than or equal to `value`.
     *
     * @example
     * ```ts
     * pbQuery<User>().anyLessThanOrEqual('age', 65); // age?<=65
     * ```
     */
    anyLessThanOrEqual<P extends Path<T, MaxDepth>>(
        key: P,
        value: PathValue<T, P, MaxDepth>,
    ): Omit<RestrictedQueryBuilder<T, MaxDepth, Once>, Once>

    /**
     * Useful for queries involving [back-relations](https://pocketbase.io/docs/working-with-relations/#back-relations), [multiple relation](https://pocketbase.io/docs/collections/#relationfield), [multiple select](https://pocketbase.io/docs/collections/#selectfield), or [multiple file](https://pocketbase.io/docs/collections/#filefield).
     *
     * Matches records where at least one of the values in the given `key` contains `value`.
     *
     * It is case-insensitive, so the `:lower` [modifier](https://pocketbase.io/docs/api-rules-and-filters/#special-identifiers-and-modifiers) is unnecessary.
     *
     * @example Contains
     * ```ts
     * pbQuery<Post>().anyLike('author.name', 'Joh'); // name?~'Joh' / name?~'%Joh%'
     * // If not specified, auto-wraps the value in `%` for wildcard matching.
     * ```
     *
     * @example Starts with
     * ```ts
     * pbQuery<Post>().anyLike('author.name', 'Joh%'); // name?~'Joh%'
     * ```
     *
     * @example Ends with
     * ```ts
     * pbQuery<Post>().anyLike('author.name', '%Doe'); // name?~'%Doe'
     * ```
     */
    anyLike<P extends Path<T, MaxDepth>>(
        key: P,
        value: PathValue<T, P, MaxDepth>,
    ): Omit<RestrictedQueryBuilder<T, MaxDepth, Once>, Once>

    /**
     * Useful for queries involving [back-relations](https://pocketbase.io/docs/working-with-relations/#back-relations), [multiple relation](https://pocketbase.io/docs/collections/#relationfield), [multiple select](https://pocketbase.io/docs/collections/#selectfield), or [multiple file](https://pocketbase.io/docs/collections/#filefield).
     *
     * Matches records where at least one of the values in the given `key` doesn't contain `value`.
     *
     * It is case-insensitive, so the `:lower` [modifier](https://pocketbase.io/docs/api-rules-and-filters/#special-identifiers-and-modifiers) is unnecessary.
     *
     * @example Doesn't contain
     * ```ts
     * pbQuery<Post>().anyNotLike('author.name', 'Joh'); // name?!~'Joh' / name?!~'%Joh%'
     * // If not specified, auto-wraps the value in `%` for wildcard matching.
     * ```
     *
     * @example Doesn't start with
     * ```ts
     * pbQuery<Post>().anyNotLike('author.name', 'Joh%'); // name?!~'Joh%'
     * ```
     *
     * @example Doesn't end with
     * ```ts
     * pbQuery<Post>().anyNotLike('author.name', '%Doe'); // name?!~'%Doe'
     * ```
     */
    anyNotLike<P extends Path<T, MaxDepth>>(
        key: P,
        value: PathValue<T, P, MaxDepth>,
    ): Omit<RestrictedQueryBuilder<T, MaxDepth, Once>, Once>

    /**
     * **_Helper_**
     *
     * Matches records where any of the `keys` contain `value`.
     *
     * It can be used to perform a full-text search (FTS).
     *
     * It is case-insensitive, so the `:lower` [modifier](https://pocketbase.io/docs/api-rules-and-filters/#special-identifiers-and-modifiers) is unnecessary.
     *
     * @example Full text search
     * ```ts
     * pbQuery<Post>().search(['title', 'content', 'tags', 'author.name'], 'Football'); // (title~'Football' || content~'Football' || tags~'Football' || author.name~'Football')
     * ```
     *
     * @example Contains
     * ```ts
     * pbQuery<User>().search(['name', 'surname'], 'Joh'); // (name~'Joh' || surname~'Joh') / (name~'%Joh%' || surname~'%Joh%') If not specified, auto-wraps the value in `%` for wildcard matching.
     * ```
     *
     * @example Starts with
     * ```ts
     * pbQuery<User>().search(['name', 'surname'], 'Joh%'); // (name~'Joh%' || surname~'Joh%')
     * ```
     *
     * @example Ends with
     * ```ts
     * pbQuery<User>().search(['name', 'surname'], '%Doe'); // (name~'%Doe' || surname~'%Doe')
     * ```
     */
    search<P extends Path<T, MaxDepth>>(
        keys: P[],
        value: PathValue<T, P, MaxDepth>,
    ): Omit<RestrictedQueryBuilder<T, MaxDepth, Once>, Once>

    /**
     * **_Helper_**
     *
     * Matches records where `key` is in `values`.
     *
     * @example
     * ```ts
     * pbQuery<Post>().in('id', ['id_1', 'id_2', 'id_3']); // (id='id_1' || id='id_2' || id='id_3')
     * ```
     */
    in<P extends Path<T, MaxDepth>>(
        key: P,
        values: PathValue<T, P, MaxDepth>[],
    ): Omit<RestrictedQueryBuilder<T, MaxDepth, Once>, Once>

    /**
     * **_Helper_**
     *
     * Matches records where `key` is not in `values`.
     *
     * @example
     * ```ts
     * pbQuery<User>().notIn('age', [18, 21, 30]); // (age!=18 && age!=21 && age!=30)
     * ```
     */
    notIn<P extends Path<T, MaxDepth>>(
        key: P,
        values: PathValue<T, P, MaxDepth>[],
    ): Omit<RestrictedQueryBuilder<T, MaxDepth, Once>, Once>

    /**
     * **_Helper_**
     *
     * Matches records where `key` is between `from` and `to`.
     *
     * [PocketBase's datetime macros](https://pocketbase.io/docs/api-rules-and-filters/#-macros) could be helpful when comparing dates: `@now`, `@yesterday`, `@tomorrow`, `@todayStart`, `@todayEnd`, `@monthStart`, `@monthEnd`, `@yearStart`, `@yearEnd`, [more...](https://pocketbase.io/docs/api-rules-and-filters/#-macros)
     *
     * @example
     * ```ts
     * pbQuery<User>().between('age', 18, 30); // (age>=18 && age<=30)
     * pbQuery<User>().between('created', new Date('2021-01-01'), '@now'); // (created>='2021-01-01 00:00:00.000Z' && created<=@now)
     * ```
     */
    between<P extends Path<T, MaxDepth>>(
        key: P,
        from: PathValue<T, P, MaxDepth>,
        to: PathValue<T, P, MaxDepth>,
    ): Omit<RestrictedQueryBuilder<T, MaxDepth, Once>, Once>

    /**
     * **_Helper_**
     *
     * Matches records where `key` is not between `from` and `to`.
     *
     * [PocketBase's datetime macros](https://pocketbase.io/docs/api-rules-and-filters/#-macros) could be helpful when comparing dates: `@now`, `@yesterday`, `@tomorrow`, `@todayStart`, `@todayEnd`, `@monthStart`, `@monthEnd`, `@yearStart`, `@yearEnd`, [more...](https://pocketbase.io/docs/api-rules-and-filters/#-macros)
     *
     * @example
     * ```ts
     * pbQuery<User>().notBetween('age', 18, 30); // (age<18 || age>30)
     * pbQuery<User>().notBetween('created', new Date('2021-01-01'), '@yesterday'); // (created<'2021-01-01 00:00:00.000Z' || created>@yesterday)
     * ```
     */
    notBetween<P extends Path<T, MaxDepth>>(
        key: P,
        from: PathValue<T, P, MaxDepth>,
        to: PathValue<T, P, MaxDepth>,
    ): Omit<RestrictedQueryBuilder<T, MaxDepth, Once>, Once>

    /**
     * **_Helper_**
     *
     * Matches records where `key` is null.
     *
     * @example
     * ```ts
     * pbQuery<User>().isNull('name'); // name=''
     * ```
     */
    isNull<P extends Path<T, MaxDepth>>(
        key: P,
    ): Omit<RestrictedQueryBuilder<T, MaxDepth, Once>, Once>

    /**
     * **_Helper_**
     *
     * Matches records where `key` is not null.
     *
     * @example
     * ```ts
     * pbQuery<User>().isNotNull('name'); // name!=''
     * ```
     */
    isNotNull<P extends Path<T, MaxDepth>>(
        key: P,
    ): Omit<RestrictedQueryBuilder<T, MaxDepth, Once>, Once>

    /**
     * **_Helper_**
     *
     * Executes a custom query.
     *
     * This helper is safe to use with `pb.filter()`, but we recommend using it as a last resort.
     *
     * If you have a special use case that might be useful to other developers, consider [opening an issue](https://github.com/sergio9929/pb-query/issues), and we may implement it as a new _helper_ in the future.
     *
     * @example
     * ```ts
     * pbQuery<User>().custom('geoDistance(address.lon, address.lat, 23.32, 42.69) < 25'); // geoDistance(address.lon, address.lat, 23.32, 42.69) < 25
     *
     * // We recommend using Pocketbase's native `pb.filter()` function
     * pbQuery<User>().custom(pb.filter('geoDistance(address.lon, address.lat, {:lon}, {:lat}) < {:distance}', { lon: 23.32, lat: 42.69, distance: 25 })); // geoDistance(address.lon, address.lat, 23.32, 42.69) < 25
     * ```
     */
    custom(raw: string): Omit<RestrictedQueryBuilder<T, MaxDepth, Once>, Once>

    /**
     * Creates a logical group.
     *
     * @example
     * ```ts
     * pbQuery<Post>().group((q) => q.equal('status', 'active').or().equal('status', 'inactive')); // (status~'active' || status~'inactive')
     * ```
     */
    group(
        callback: (
            q: QueryBuilder<T, MaxDepth>,
        ) => Omit<RestrictedQueryBuilder<T, MaxDepth, Once>, Once>,
    ): Omit<RestrictedQueryBuilder<T, MaxDepth, Once>, Once>
}

export interface RestrictedQueryBuilder<
    T,
    MaxDepth extends number = 6,
    Once extends keyof QueryBuilder<T, MaxDepth> | '' = '',
> extends QueryBuilderEnd,
        SortMethod<
            T,
            MaxDepth,
            RestrictedQueryBuilder<T, MaxDepth, Once | 'sort'>,
            Once | 'sort'
        > {
    /**
     * Combines the previous and the next conditions with an `and` logical operator.
     *
     * @example
     * ```ts
     * pbQuery<User>().equal('name', 'Alice').and().equal('role', 'admin'); // name='Alice' && role='admin'
     * ```
     */
    and(): Omit<QueryBuilder<T, MaxDepth, Once>, Once | 'build'>
    /**
     * Combines the previous and the next conditions with an `or` logical operator.
     *
     * @example
     * ```ts
     * pbQuery<User>().equal('name', 'Alice').or().equal('name', 'Bob'); // name='Alice' || name='Bob'
     * ```
     */
    or(): Omit<QueryBuilder<T, MaxDepth, Once>, Once | 'build'>
}

export interface QueryBuilderEnd {
    /**
     * Returns an object with `filter`, `fields` and `expand`. Read more in the [official documentation](https://pocketbase.io/docs/api-records/#listsearch-records).
     *
     * If a filter function is not provided (e.g. PocketBase's native `pb.filter`) as a parameter we return an object with the query string and values inside `filter`.
     *
     * @example
     * ```ts
     * const query = pbQuery<User>().equal('name', 'Alice').build(pb.filter);
     *
     * // You can also filter it later
     * const { filter } = pbQuery<User>().equal('name', 'Alice').build();
     * console.log(filter); // { raw: 'name={:name1}', values: { name1: 'Alice' } }
     * console.log(pb.filter(filter.raw, filter.values)); // name='Alice'
     * ```
     *
     * @example
     * ```ts
     * const query = pbQuery<Post>()
     *     .fields([
     *         'title',
     *         'content:excerpt(100,true)',
     *         'author',
     *         'expand.author.name',
     *         'expand.comments_via_post',
     *     ]) // Optional
     *     .search(['title', 'content', 'tags', 'author.name'], 'Football')
     *     .sort(['title', '-created'])
     *     .build(pb.filter);
     *
     * console.log(query.filter); // Output: "(title~'Football' || content~'Football' || tags~'Football' || author.name~'Football')"
     * console.log(query.fields); // Output: 'title,content:excerpt(100,true),author,expand.author,expand.comments_via_post'
     * console.log(query.expand); // Output: 'author,comments_via_post'
     * console.log(query.sort);   // Output: 'title,-created'
     *
     * const records = await pb.collection('posts').getList(1, 20, query);
     *
     * console.log(records);
     * // Output:
     * // [
     * //     {
     * //         author: 'authorId',
     * //         title: 'Football match this Saturday',
     * //         content: 'Lorem ipsum dolor sit amet.',
     * //         expand: {
     * //             author: {
     * //                 name: 'John',
     * //             },
     * //             comments_via_post: [
     * //                 { ... },
     * //             ],
     * //         },
     * //     },
     * // ]
     * ```
     *
     * @since 0.3.0
     */
    build(): QueryResult<RawQueryObject>
    build(filter: FilterFunction): QueryResult<string>
    build(filter?: FilterFunction): QueryResult<RawQueryObject | string>
}

interface SortMethod<
    T,
    MaxDepth extends number,
    Builder,
    Once extends PropertyKey,
> {
    /**
     * **_Once_** - This can only be used once.
     *
     * Sorts the results by the specified keys.
     *
     * Prefixes:
     * - `-`: Descending order.
     * - `+` (default): Ascending order.
     *
     * Macros:
     * - `@random`: Orders by [sqlite's random() function](https://sqlite.org/lang_corefunc.html#random). Useful for shuffling results.
     * - `@rowid`: **NOT THE SAME AS `id`**. Orders by [sqlite's internal `rowid`](https://www.sqlite.org/lang_createtable.html#rowid). [Can't](https://www.sqlite.org/rowidtable.html) be used with [View Collections](https://pocketbase.io/docs/collections/#view-collection).
     *
     * @example
     * ```ts
     * const query = pbQuery<Post>()
     *    .sort(['title', '-created'])
     *    .build(pb.filter);
     *
     * console.log(query.sort) // Output: 'title,-created'
     * ```
     *
     * @since 0.3.0
     */
    sort<P extends PathSort<T, MaxDepth>>(keys: P | P[]): Omit<Builder, Once>
}
