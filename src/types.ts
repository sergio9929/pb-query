export type FilterFunction = (
    raw: string,
    params?: {
        [key: string]: unknown
    },
) => string

export type RawQueryObject = { raw: string; values: Record<string, unknown> }

type DepthCounter = [1, 2, 3, 4, 5, 6, never]

export type Path<
    T,
    MaxDepth extends number = 6,
    K extends keyof T = keyof T,
    D extends number = 0,
> = D extends MaxDepth
    ? never
    : K extends string
      ? T[K] extends string
          ? `${K}` | `${K}:lower`
          : T[K] extends readonly object[]
            ?
                  | `${K}`
                  | `${K}:each`
                  | `${K}:length`
                  | `${K}.${Path<T[K][number], MaxDepth, keyof T[K][number], DepthCounter[D]>}`
            : T[K] extends readonly unknown[]
              ? `${K}` | `${K}:each` | `${K}:length`
              : T[K] extends Date
                ? `${K}`
                : T[K] extends object
                  ?
                        | `${K}`
                        | `${K}.${Path<T[K], MaxDepth, keyof T[K], DepthCounter[D]>}`
                        | `${string}_via_${K}`
                        | `${string}_via_${K}.${string}`
                  : `${K}`
      : never

export type PathValue<
    T,
    P extends string,
    MaxDepth extends number = 6,
    D extends number = 0,
> = D extends MaxDepth
    ? never
    : P extends `${infer _Prefix}_via_${infer _Suffix}`
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
                    ? T[P]
                    : T[P] extends object
                      ? string
                      : T[P]
            : never

export type HandleModifier<V, Modifier extends string> = Modifier extends 'each'
    ? V extends number[]
        ? number
        : string
    : Modifier extends 'length'
      ? number
      : Modifier extends 'lower'
        ? string
        : never

// TODO: Implement a query builder that can build a query string with the following methods
// = Equal
// != NOT equal
// > Greater than
// >= Greater than or equal
// < Less than
// <= Less than or equal
// ~ Like/Contains (if not specified auto wraps the right string OPERAND in a "%" for wildcard match)
// !~ NOT Like/Contains (if not specified auto wraps the right string OPERAND in a "%" for wildcard match)
// ?= Any/At least one of Equal
// ?!= Any/At least one of NOT equal
// ?> Any/At least one of Greater than
// ?>= Any/At least one of Greater than or equal
// ?< Any/At least one of Less than
// ?<= Any/At least one of Less than or equal
// ?~ Any/At least one of Like/Contains (if not specified auto wraps the right string OPERAND in a "%" for wildcard match)
// ?!~ Any/At least one of NOT Like/Contains (if not specified auto wraps the right string OPERAND in a "%" for wildcard match)
export interface QueryBuilder<T, MaxDepth extends number = 6> {
    /**
     * Matches records where `key` equals `value`.
     * @example
     * pbQuery<Post>().equal('author.name', 'Alice'); // name='Alice'
     * // This is case-sensitive. Use the `:lower` modifier for case-insensitive matching.
     * pbQuery<Post>().equal('author.name:lower', 'alice'); // name:lower='alice'
     */
    equal<P extends Path<T, MaxDepth>>(
        key: P,
        value: PathValue<T, P, MaxDepth>,
    ): RestrictedQueryBuilder<T, MaxDepth>

    /**
     * Matches records where `key` is not equal to `value`.
     * @example
     * pbQuery<Post>().notEqual('author.name', 'Alice'); // name!='Alice'
     * // This is case-sensitive. Use the `:lower` modifier for case-insensitive matching.
     * pbQuery<Post>().notEqual('author.name:lower', 'alice'); // name:lower!='alice'
     */
    notEqual<P extends Path<T, MaxDepth>>(
        key: P,
        value: PathValue<T, P, MaxDepth>,
    ): RestrictedQueryBuilder<T, MaxDepth>

    /**
     * Matches records where `key` is greater than `value`.
     * @example pbQuery<User>().greaterThan('age', 21); // age>21
     */
    greaterThan<P extends Path<T, MaxDepth>>(
        key: P,
        value: PathValue<T, P, MaxDepth>,
    ): RestrictedQueryBuilder<T, MaxDepth>

    /**
     * Matches records where `key` is greater than or equal to `value`.
     * @example pbQuery<User>().greaterThanOrEqual('age', 18); // age>=18
     */
    greaterThanOrEqual<P extends Path<T, MaxDepth>>(
        key: P,
        value: PathValue<T, P, MaxDepth>,
    ): RestrictedQueryBuilder<T, MaxDepth>

    /**
     * Matches records where `key` is less than `value`.
     * @example pbQuery<User>().lessThan('age', 50); // age<50
     */
    lessThan<P extends Path<T, MaxDepth>>(
        key: P,
        value: PathValue<T, P, MaxDepth>,
    ): RestrictedQueryBuilder<T, MaxDepth>

    /**
     * Matches records where `key` is less than or equal to `value`.
     * @example pbQuery<User>().lessThanOrEqual('age', 65); // age<=65
     */
    lessThanOrEqual<P extends Path<T, MaxDepth>>(
        key: P,
        value: PathValue<T, P, MaxDepth>,
    ): RestrictedQueryBuilder<T, MaxDepth>

    /**
     * Matches records where `key` contains `value`.
     *
     * It is case-insensitive, so the `:lower` modifier is unnecessary.
     *
     * @example
     * // Contains
     * pbQuery<Post>().like('author.name', 'Joh'); // name~'Joh' / name~'%Joh%'
     * // If not specified, auto-wraps the value in `%` for wildcard matching.
     *
     * @example
     * // Starts with
     * pbQuery<Post>().like('author.name', 'Joh%'); // name~'Joh%'
     *
     * @example
     * // Ends with
     * pbQuery<Post>().like('author.name', '%Doe'); // name~'%Doe'
     */
    like<P extends Path<T, MaxDepth>>(
        key: P,
        value: PathValue<T, P, MaxDepth>,
    ): RestrictedQueryBuilder<T, MaxDepth>

    /**
     * Matches records where `key` doesn't contain `value`.
     *
     * It is case-insensitive, so the `:lower` modifier is unnecessary.
     *
     * @example
     * // Doesn't contain
     * pbQuery<Post>().notLike('author.name', 'Joh'); // name!~'Joh' / name!~'%Joh%'
     * // If not specified, auto-wraps the value in `%` for wildcard matching.
     *
     * @example
     * // Doesn't start with
     * pbQuery<Post>().notLike('author.name', 'Joh%'); // name!~'Joh%'
     *
     * @example
     * // Doesn't end with
     * pbQuery<Post>().notLike('author.name', '%Doe'); // name!~'%Doe'
     */
    notLike<P extends Path<T, MaxDepth>>(
        key: P,
        value: PathValue<T, P, MaxDepth>,
    ): RestrictedQueryBuilder<T, MaxDepth>

    /**
     * Useful for queries involving [back-relations](https://pocketbase.io/docs/working-with-relations/#back-relations), [multiple relation](https://pocketbase.io/docs/collections/#relationfield), [multiple select](https://pocketbase.io/docs/collections/#selectfield), or [multiple file](https://pocketbase.io/docs/collections/#filefield).
     *
     * Matches records where at least one of the values in the given `key` equals `value`.
     * @example
     * pbQuery<Book>().anyEqual('books_via_author.title', 'The Island'); // post_via_author.name?='The Island'
     *
     * // This is case-sensitive. Use the `:lower` modifier for case-insensitive matching.
     * pbQuery<Book>().anyEqual('books_via_author.title:lower', 'the island'); // post_via_author.name:lower?='the island'
     */
    anyEqual<P extends Path<T, MaxDepth>>(
        key: P,
        value: PathValue<T, P, MaxDepth>,
    ): RestrictedQueryBuilder<T, MaxDepth>

    /**
     * Useful for queries involving [back-relations](https://pocketbase.io/docs/working-with-relations/#back-relations), [multiple relation](https://pocketbase.io/docs/collections/#relationfield), [multiple select](https://pocketbase.io/docs/collections/#selectfield), or [multiple file](https://pocketbase.io/docs/collections/#filefield).
     *
     * Matches records where at least one of the values in the given `key` is not equal to `value`.
     * @example
     * pbQuery<Book>().anyNotEqual('books_via_author.title', 'The Island'); // post_via_author.name?!='The Island'
     *
     * // This is case-sensitive. Use the `:lower` modifier for case-insensitive matching.
     * pbQuery<Book>().anyNotEqual('books_via_author.title:lower', 'the island'); // post_via_author.name:lower?!='the island'
     */
    anyNotEqual<P extends Path<T, MaxDepth>>(
        key: P,
        value: PathValue<T, P, MaxDepth>,
    ): RestrictedQueryBuilder<T, MaxDepth>

    /**
     * Useful for queries involving [back-relations](https://pocketbase.io/docs/working-with-relations/#back-relations), [multiple relation](https://pocketbase.io/docs/collections/#relationfield), [multiple select](https://pocketbase.io/docs/collections/#selectfield), or [multiple file](https://pocketbase.io/docs/collections/#filefield).
     *
     * Matches records where at least one of the values in the given `key` is greater than `value`.
     * @example pbQuery<User>().anyGreaterThan('age', 21); // age?>21
     */
    anyGreaterThan<P extends Path<T, MaxDepth>>(
        key: P,
        value: PathValue<T, P, MaxDepth>,
    ): RestrictedQueryBuilder<T, MaxDepth>

    /**
     * Useful for queries involving [back-relations](https://pocketbase.io/docs/working-with-relations/#back-relations), [multiple relation](https://pocketbase.io/docs/collections/#relationfield), [multiple select](https://pocketbase.io/docs/collections/#selectfield), or [multiple file](https://pocketbase.io/docs/collections/#filefield).
     *
     * Matches records where at least one of the values in the given `key` is greater than or equal to `value`.
     * @example pbQuery<User>().anyGreaterThanOrEqual('age', 18); // age?>=18
     */
    anyGreaterThanOrEqual<P extends Path<T, MaxDepth>>(
        key: P,
        value: PathValue<T, P, MaxDepth>,
    ): RestrictedQueryBuilder<T, MaxDepth>

    /**
     * Useful for queries involving [back-relations](https://pocketbase.io/docs/working-with-relations/#back-relations), [multiple relation](https://pocketbase.io/docs/collections/#relationfield), [multiple select](https://pocketbase.io/docs/collections/#selectfield), or [multiple file](https://pocketbase.io/docs/collections/#filefield).
     *
     * Matches records where at least one of the values in the given `key` is less than `value`.
     * @example pbQuery<User>().anyLessThan('age', 50); // age?<50
     */
    anyLessThan<P extends Path<T, MaxDepth>>(
        key: P,
        value: PathValue<T, P, MaxDepth>,
    ): RestrictedQueryBuilder<T, MaxDepth>

    /**
     * Useful for queries involving [back-relations](https://pocketbase.io/docs/working-with-relations/#back-relations), [multiple relation](https://pocketbase.io/docs/collections/#relationfield), [multiple select](https://pocketbase.io/docs/collections/#selectfield), or [multiple file](https://pocketbase.io/docs/collections/#filefield).
     *
     * Matches records where at least one of the values in the given `key` is less than or equal to `value`.
     * @example pbQuery<User>().anyLessThanOrEqual('age', 65); // age?<=65
     */
    anyLessThanOrEqual<P extends Path<T, MaxDepth>>(
        key: P,
        value: PathValue<T, P, MaxDepth>,
    ): RestrictedQueryBuilder<T, MaxDepth>

    /**
     * Useful for queries involving [back-relations](https://pocketbase.io/docs/working-with-relations/#back-relations), [multiple relation](https://pocketbase.io/docs/collections/#relationfield), [multiple select](https://pocketbase.io/docs/collections/#selectfield), or [multiple file](https://pocketbase.io/docs/collections/#filefield).
     *
     * Matches records where at least one of the values in the given `key` contains `value`.
     *
     * It is case-insensitive, so the `:lower` modifier is unnecessary.
     *
     * @example
     * // Contains
     * pbQuery<Post>().anyLike('author.name', 'Joh'); // name?~'Joh' / name?~'%Joh%'
     * // If not specified, auto-wraps the value in `%` for wildcard matching.
     *
     * @example
     * // Starts with
     * pbQuery<Post>().anyLike('author.name', 'Joh%'); // name?~'Joh%'
     *
     * @example
     * // Ends with
     * pbQuery<Post>().anyLike('author.name', '%Doe'); // name?~'%Doe'
     */
    anyLike<P extends Path<T, MaxDepth>>(
        key: P,
        value: PathValue<T, P, MaxDepth>,
    ): RestrictedQueryBuilder<T, MaxDepth>

    /**
     * Useful for queries involving [back-relations](https://pocketbase.io/docs/working-with-relations/#back-relations), [multiple relation](https://pocketbase.io/docs/collections/#relationfield), [multiple select](https://pocketbase.io/docs/collections/#selectfield), or [multiple file](https://pocketbase.io/docs/collections/#filefield).
     *
     * Matches records where at least one of the values in the given `key` doesn't contain `value`.
     *
     * It is case-insensitive, so the `:lower` modifier is unnecessary.
     *
     * @example
     * // Doesn't contain
     * pbQuery<Post>().anyNotLike('author.name', 'Joh'); // name?!~'Joh' / name?!~'%Joh%'
     * // If not specified, auto-wraps the value in `%` for wildcard matching.
     *
     * @example
     * // Doesn't start with
     * pbQuery<Post>().anyNotLike('author.name', 'Joh%'); // name?!~'Joh%'
     *
     * @example
     * // Doesn't end with
     * pbQuery<Post>().anyNotLike('author.name', '%Doe'); // name?!~'%Doe'
     */
    anyNotLike<P extends Path<T, MaxDepth>>(
        key: P,
        value: PathValue<T, P, MaxDepth>,
    ): RestrictedQueryBuilder<T, MaxDepth>

    /**
     * **_Helper_**
     *
     * Matches records where any of the `keys` contain `value`.
     *
     * It can be used to perform a full-text search (FTS).
     *
     * It is case-insensitive, so the `:lower` modifier is unnecessary.
     *
     * @example
     * // Full text search
     * pbQuery<Post>().search(['title', 'content', 'tags', 'author.name', 'author.surname'], 'Football'); // (title~'Football' || content~'Football' || tags~'Football' || author.name~'Football' || author.surname~'Football')
     *
     * @example
     * // Contains
     * pbQuery<User>().search(['name', 'surname'], 'Joh'); // (name~'Joh' || surname~'Joh') / (name~'%Joh%' || surname~'%Joh%')
     * // If not specified, auto-wraps the value in `%` for wildcard matching.
     *
     * @example
     * // Starts with
     * pbQuery<User>().search(['name', 'surname'], 'Joh%'); // (name~'Joh%' || surname~'Joh%')
     *
     * @example
     * // Ends with
     * pbQuery<User>().search(['name', 'surname'], '%Doe'); // (name~'%Doe' || surname~'%Doe')
     */
    search<P extends Path<T, MaxDepth>>(
        keys: P[],
        value: PathValue<T, P, MaxDepth>,
    ): RestrictedQueryBuilder<T, MaxDepth>

    /**
     * **_Helper_**
     *
     * Matches records where `key` is in `values`.
     * @example pbQuery<Post>().in('id', ['id_1', 'id_2', 'id_3']); // (id='id_1' || id='id_2' || id='id_3')
     */
    in<P extends Path<T, MaxDepth>>(
        key: P,
        values: PathValue<T, P, MaxDepth>[],
    ): RestrictedQueryBuilder<T, MaxDepth>

    /**
     * **_Helper_**
     *
     * Matches records where `key` is not in `values`.
     * @example pbQuery<User>().notIn('age', [18, 21, 30]); // (age!=18 && age!=21 && age!=30)
     */
    notIn<P extends Path<T, MaxDepth>>(
        key: P,
        values: PathValue<T, P, MaxDepth>[],
    ): RestrictedQueryBuilder<T, MaxDepth>

    /**
     * **_Helper_**
     *
     * Matches records where `key` is between `from` and `to`.
     * @example
     * pbQuery<User>().between('age', 18, 30); // (age>=18 && age<=30)
     * pbQuery<User>().between('created', new Date('2021-01-01'), new Date('2021-12-31')); // (created>='2021-01-01 00:00:00.000Z' && created<='2021-12-31 00:00:00.000Z')
     */
    between<P extends Path<T, MaxDepth>>(
        key: P,
        from: PathValue<T, P, MaxDepth>,
        to: PathValue<T, P, MaxDepth>,
    ): RestrictedQueryBuilder<T, MaxDepth>

    /**
     * **_Helper_**
     *
     * Matches records where `key` is not between `from` and `to`.
     * @example
     * pbQuery<User>().notBetween('age', 18, 30); // (age<18 || age>30)
     * pbQuery<User>().notBetween('created', new Date('2021-01-01'), new Date('2021-12-31')); // (created<'2021-01-01 00:00:00.000Z' || created>'2021-12-31 00:00:00.000Z')
     */
    notBetween<P extends Path<T, MaxDepth>>(
        key: P,
        from: PathValue<T, P, MaxDepth>,
        to: PathValue<T, P, MaxDepth>,
    ): RestrictedQueryBuilder<T, MaxDepth>

    /**
     * **_Helper_**
     *
     * Matches records where `key` is null.
     * @example pbQuery<User>().isNull('name'); // name=''
     */
    isNull<P extends Path<T, MaxDepth>>(
        key: P,
    ): RestrictedQueryBuilder<T, MaxDepth>

    /**
     * **_Helper_**
     *
     * Matches records where `key` is not null.
     * @example pbQuery<User>().isNotNull('name'); // name!=''
     */
    isNotNull<P extends Path<T, MaxDepth>>(
        key: P,
    ): RestrictedQueryBuilder<T, MaxDepth>

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
     * pbQuery<User>().custom('age > 21'); // age > 21
     *
     * // We recommend using Pocketbase's native `pb.filter()` function
     * pbQuery<User>().custom(pb.filter('age > {:age}', { age: 21 })); // age > 21
     */
    custom(raw: string): RestrictedQueryBuilder<T, MaxDepth>

    /**
     * Creates a logical group.
     * @example pbQuery<Post>().group((q) => q.equal('status', 'active').or().equal('status', 'inactive')); // (status~'active' || status~'inactive')
     */
    group(
        callback: (
            q: QueryBuilder<T, MaxDepth>,
        ) => RestrictedQueryBuilder<T, MaxDepth>,
    ): RestrictedQueryBuilder<T, MaxDepth>

    /**
     * Returns the query string and values.
     * @example
     * // We recommend using Pocketbase's native `pb.filter()` function
     * const query = pbQuery<User>().equal('name', 'Alice').build(pb.filter);
     *
     * // You can also filter it later
     * const query = pbQuery<User>().equal('name', 'Alice').build();
     * console.log(query.raw); // name={:name1}
     * console.log(query.values); // { name: 'Alice' }
     * console.log(pb.filter(query.raw, query.values)); // name='Alice'
     */
    build(): { raw: string; values: Record<string, unknown> }
    build(filter: FilterFunction): string
    build(
        filter?: FilterFunction,
    ): { raw: string; values: Record<string, unknown> } | string
}

export interface RestrictedQueryBuilder<T, MaxDepth extends number = 6> {
    /**
     * Combines the previous and the next conditions with an `and` logical operator.
     * @example pbQuery<User>().equal('name', 'Alice').and().equal('role', 'admin'); // name='Alice' && role='admin'
     */
    and(): Omit<QueryBuilder<T, MaxDepth>, 'build'>
    /**
     * Combines the previous and the next conditions with an `or` logical operator.
     * @example pbQuery<User>().equal('name', 'Alice').or().equal('name', 'Bob'); // name='Alice' || name='Bob'
     */
    or(): Omit<QueryBuilder<T, MaxDepth>, 'build'>

    /**
     * Returns the query string and values.
     * @example
     * // We recommend using Pocketbase's native `pb.filter()` function
     * const query = pbQuery<User>().equal('name', 'Alice').build(pb.filter);
     *
     * // You can also filter it later
     * const query = pbQuery<User>().equal('name', 'Alice').build();
     * console.log(query.raw); // name={:name1}
     * console.log(query.values); // { name: 'Alice' }
     * console.log(pb.filter(query.raw, query.values)); // name='Alice'
     */
    build(): { raw: string; values: Record<string, unknown> }
    build(filter: FilterFunction): string
    build(
        filter?: FilterFunction,
    ): { raw: string; values: Record<string, unknown> } | string
}
