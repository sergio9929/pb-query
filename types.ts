export type FilterFunction = (raw: string, params?: {
    [key: string]: unknown
}) => string

export type RawQueryObject = { raw: string; values: Record<string, unknown> }

export type Path<T, K extends keyof T = keyof T> = K extends string
    ? T[K] extends string ? `${K}` | `${K}:lower`
    : T[K] extends readonly object[]
        ? `${K}` | `${K}:each` | `${K}:length` | `${K}.${Path<T[K][number]>}`
    : T[K] extends readonly unknown[] ? `${K}` | `${K}:each` | `${K}:length`
    : T[K] extends Date ? `${K}`
    : T[K] extends object ? `${K}` | `${K}.${Path<T[K]>}`
    : `${K}`
    : never

export type PathValue<T, P extends string> = P extends
    `${infer Key}.${infer Rest}`
    ? Key extends keyof T
        ? T[Key] extends readonly (infer E)[] ? PathValue<E, Rest> // If it's an array, continue resolving on its elements
        : PathValue<T[Key], Rest> // Otherwise, continue resolving normally
    : never
    : P extends `${infer Key}:${infer Modifier}`
        ? Key extends keyof T ? HandleModifier<T[Key], Modifier>
        : never
    : P extends keyof T ? T[P] extends object[] ? string
        : T[P] extends unknown[] ? T[P][number]
        : T[P]
    : never

export type HandleModifier<V, Modifier extends string> = Modifier extends 'each'
    ? V extends number[] ? number
    : string
    : Modifier extends 'length' ? number
    : Modifier extends 'lower' ? string
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
export interface QueryBuilder<T> {
    /**
     * Matches records where key equals value.
     * @example qb.equal('name', 'Alice'); // name='Alice'
     */
    equal<P extends Path<T>>(
        path: P,
        value: PathValue<T, P>,
    ): RestrictedQueryBuilder<T>
    /**
     * Matches records where `key` is not equal to `value`.
     * @example qb.notEqual('age', 30); // age!=30
     */
    notEqual<P extends Path<T>>(
        path: P,
        value: PathValue<T, P>,
    ): RestrictedQueryBuilder<T>

    /**
     * Matches records where `key` is greater than `value`.
     * @example qb.greaterThan('age', 21); // age>21
     */
    greaterThan<P extends Path<T>>(
        path: P,
        value: PathValue<T, P>,
    ): RestrictedQueryBuilder<T>

    /**
     * Matches records where `key` is greater than or equal to `value`.
     * @example qb.greaterThanOrEqual('age', 18); // age>=18
     */
    greaterThanOrEqual<P extends Path<T>>(
        path: P,
        value: PathValue<T, P>,
    ): RestrictedQueryBuilder<T>

    /**
     * Matches records where `key` is less than `value`.
     * @example qb.lessThan('age', 50); // age<50
     */
    lessThan<P extends Path<T>>(
        path: P,
        value: PathValue<T, P>,
    ): RestrictedQueryBuilder<T>

    /**
     * Matches records where `key` is less than or equal to `value`.
     * @example qb.lessThanOrEqual('age', 65); // age<=65
     */
    lessThanOrEqual<P extends Path<T>>(
        path: P,
        value: PathValue<T, P>,
    ): RestrictedQueryBuilder<T>

    /**
     * Performs a wildcard match.
     * @example qb.like('name', 'Joh'); // name~'Joh'
     */
    like<P extends Path<T>>(
        path: P,
        value: PathValue<T, P>,
    ): RestrictedQueryBuilder<T>

    /**
     * Negated wildcard match.
     * @example qb.notLike('name', 'Doe'); // name!~'Doe'
     */
    notLike<P extends Path<T>>(
        path: P,
        value: PathValue<T, P>,
    ): RestrictedQueryBuilder<T>

    /**
     * Matches records where at least one value equals `value`.
     * @example qb.anyEqual('tags', 'admin'); // tags?='admin'
     */
    anyEqual<P extends Path<T>>(
        path: P,
        value: PathValue<T, P>,
    ): RestrictedQueryBuilder<T>

    /**
     * Matches records where at least one value does not equal `value`.
     * @example qb.anyNotEqual('tags', 'user'); // tags?!='user'
     */
    anyNotEqual<P extends Path<T>>(
        path: P,
        value: PathValue<T, P>,
    ): RestrictedQueryBuilder<T>

    /**
     * Matches records where at least one value is greater than `value`.
     * @example qb.anyGreaterThan('age', 21); // age?>21
     */
    anyGreaterThan<P extends Path<T>>(
        path: P,
        value: PathValue<T, P>,
    ): RestrictedQueryBuilder<T>

    /**
     * Matches records where at least one value is greater than or equal to `value`.
     * @example qb.anyGreaterThanOrEqual('age', 18); // age?>=18
     */
    anyGreaterThanOrEqual<P extends Path<T>>(
        path: P,
        value: PathValue<T, P>,
    ): RestrictedQueryBuilder<T>

    /**
     * Matches records where at least one value is less than `value`.
     * @example qb.anyLessThan('age', 50); // age?<50
     */
    anyLessThan<P extends Path<T>>(
        path: P,
        value: PathValue<T, P>,
    ): RestrictedQueryBuilder<T>

    /**
     * Matches records where at least one value is less than or equal to `value`.
     * @example qb.anyLessThanOrEqual('age', 65); // age?<=65
     */
    anyLessThanOrEqual<P extends Path<T>>(
        path: P,
        value: PathValue<T, P>,
    ): RestrictedQueryBuilder<T>

    /**
     * Performs a wildcard match on at least one value.
     * @example qb.anyLike('name', 'Joh'); // name?~'Joh'
     */
    anyLike<P extends Path<T>>(
        path: P,
        value: PathValue<T, P>,
    ): RestrictedQueryBuilder<T>

    /**
     * Negated wildcard match on at least one value.
     * @example qb.anyNotLike('name', 'Doe'); // name?!~'Doe'
     */
    anyNotLike<P extends Path<T>>(
        path: P,
        value: PathValue<T, P>,
    ): RestrictedQueryBuilder<T>

    /**
     * Matches records where `key` is in `values`.
     * @example qb.search(['name', 'surname'], 'Alice'); // (name~'Alice' || surname~'Alice')
     */
    search<P extends Path<T>>(
        paths: P[],
        value: PathValue<T, P>,
    ): RestrictedQueryBuilder<T>

    /**
     * Matches records where `key` is in `values`.
     * @example qb.in('age', [18, 21, 30]); // (age=18 || age=21 || age=30)
     */
    in<P extends Path<T>>(
        path: P,
        values: PathValue<T, P>[],
    ): RestrictedQueryBuilder<T>

    /**
     * Matches records where `key` is not in `values`.
     * @example qb.notIn('age', [18, 21, 30]); // (age!=18 && age!=21 && age!=30)
     */
    notIn<P extends Path<T>>(
        path: P,
        values: PathValue<T, P>[],
    ): RestrictedQueryBuilder<T>

    /**
     * Matches records where `key` is between `from` and `to`.
     * @example
     * qb.between('age', 18, 30); // (age>=18 && age<=30)
     * qb.between('createdAt', new Date('2021-01-01'), new Date('2021-12-31')); // (createdAt>='2021-01-01' && createdAt<='2021-12-31')
     */
    between<P extends Path<T>>(
        key: P,
        from: PathValue<T, P>,
        to: PathValue<T, P>,
    ): RestrictedQueryBuilder<T>

    /**
     * Matches records where `key` is between `from` and `to`.
     * @example
     * qb.between('age', 18, 30); // (age<18 || age>30)
     * qb.between('createdAt', new Date('2021-01-01'), new Date('2021-12-31')); // (createdAt<'2021-01-01' || createdAt>'2021-12-31')
     */
    notBetween<P extends Path<T>>(
        key: P,
        from: PathValue<T, P>,
        to: PathValue<T, P>,
    ): RestrictedQueryBuilder<T>

    /**
     * Matches records where `key` is null.
     * @example qb.isNull('name'); // name=''
     */
    isNull<P extends Path<T>>(path: P): RestrictedQueryBuilder<T>

    /**
     * Matches records where `key` is not null.
     * @example qb.isNotNull('name'); // name!=''
     */
    isNotNull<P extends Path<T>>(path: P): RestrictedQueryBuilder<T>

    /**
     * Executes a custom query.
     * @example
     * qb.custom('age > 21'); // age > 21
     * // We recommend using the native `pb.filter()` function
     * qb.custom(pb.filter('age > {:age}', { age: 21 })); // age > 21
     */
    custom(raw: string): RestrictedQueryBuilder<T>

    /**
     * Opens a subquery.
     * @example qb.open().equal('status', 'active').close();
     */
    open(): QueryBuilder<T>

    /**
     * Opens a subquery group.
     * @example qb.group(qb => qb.equal('status', 'active').or().equal('status', 'inactive'));
     */
    group(
        callback: (qb: QueryBuilder<T>) => RestrictedQueryBuilder<T>,
    ): RestrictedQueryBuilder<T>

    /**
     * Returns the query string and values.
     * @example
     * // We recommend using the native `pb.filter()` function
     * const query = qb.equal('name', 'Alice').build(pb.filter);
     * console.log(query); // name='Alice'
     *
     * // You can also filter it later
     * const query = qb.equal('name', 'Alice').build();
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

export interface RestrictedQueryBuilder<T> {
    /**
     * Combines the current condition with an AND.
     * @example qb.equal('name', 'Alice').and().greaterThan('age', 21);
     */
    and(): Omit<QueryBuilder<T>, 'build'>
    /**
     * Combines the current condition with an `OR`.
     * @example qb.equal('name', 'Alice').or().equal('name', 'Bob');
     */
    or(): Omit<QueryBuilder<T>, 'build'>

    /**
     * Closes a previously opened subquery.
     * @example qb.open().equal('status', 'active').close();
     */
    close(): RestrictedQueryBuilder<T>

    /**
     * Returns the query string and values.
     * @example
     * // We recommend using the native `pb.filter()` function
     * const query = qb.equal('name', 'Alice').build(pb.filter);
     * console.log(query); // name='Alice'
     *
     * // You can also filter it later
     * const query = qb.equal('name', 'Alice').build();
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
