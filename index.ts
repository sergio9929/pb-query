export {};

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

// native pb.filter() function for testing purposes
function filter(raw: string, params?: { [key: string]: any }): string {
    if (!params) {
        return raw;
    }

    for (let key in params) {
        let val = params[key];
        switch (typeof val) {
            case "boolean":
            case "number":
                val = "" + val;
                break;
            case "string":
                val = "'" + val.replace(/'/g, "\\'") + "'";
                break;
            default:
                if (val === null) {
                    val = "null";
                } else if (val instanceof Date) {
                    val = "'" + val.toISOString().replace("T", " ") + "'";
                } else {
                    val = "'" + JSON.stringify(val).replace(/'/g, "\\'") + "'";
                }
        }
        raw = raw.replaceAll("{:" + key + "}", val);
    }

    return raw;
}

type Path<T, K extends keyof T = keyof T> = K extends string | number
    ? T[K] extends readonly any[] ? `${K}` | `${K}.${number}`
    : T[K] extends object ? `${K}` | `${K}.${Path<T[K]>}`
    : `${K}`
    : never;

type PathValue<T, P extends string> = P extends `${infer K}.${infer Rest}`
    ? K extends keyof T ? PathValue<T[K], Rest>
    : T extends readonly any[] ? PathValue<T[number], Rest>
    : never
    : P extends keyof T ? T[P]
    : T extends readonly any[] ? T[number]
    : never;

interface QueryBuilder<T> {
    /**
     * Matches records where key equals value.
     * @example qb.equal('name', 'Alice'); // name='Alice'
     */
    equal<P extends Path<T>>(
        path: P,
        value: PathValue<T, P>,
    ): RestrictedQueryBuilder<T>;
    /**
     * Matches records where `key` is not equal to `value`.
     * @example qb.notEqual('age', 30); // age!=30
     */
    notEqual<P extends Path<T>>(
        path: P,
        value: PathValue<T, P>,
    ): RestrictedQueryBuilder<T>;

    /**
     * Matches records where `key` is greater than `value`.
     * @example qb.greaterThan('age', 21); // age>21
     */
    greaterThan<P extends Path<T>>(
        path: P,
        value: PathValue<T, P>,
    ): RestrictedQueryBuilder<T>;

    /**
     * Matches records where `key` is greater than or equal to `value`.
     * @example qb.greaterThanOrEqual('age', 18); // age>=18
     */
    greaterThanOrEqual<P extends Path<T>>(
        path: P,
        value: PathValue<T, P>,
    ): RestrictedQueryBuilder<T>;

    /**
     * Matches records where `key` is less than `value`.
     * @example qb.lessThan('age', 50); // age<50
     */
    lessThan<P extends Path<T>>(
        path: P,
        value: PathValue<T, P>,
    ): RestrictedQueryBuilder<T>;

    /**
     * Matches records where `key` is less than or equal to `value`.
     * @example qb.lessThanOrEqual('age', 65); // age<=65
     */
    lessThanOrEqual<P extends Path<T>>(
        path: P,
        value: PathValue<T, P>,
    ): RestrictedQueryBuilder<T>;

    /**
     * Performs a wildcard match.
     * @example qb.like('name', 'Joh'); // name~'Joh'
     */
    like<P extends Path<T>>(
        path: P,
        value: PathValue<T, P>,
    ): RestrictedQueryBuilder<T>;

    /**
     * Negated wildcard match.
     * @example qb.notLike('name', 'Doe'); // name!~'Doe'
     */
    notLike<P extends Path<T>>(
        path: P,
        value: PathValue<T, P>,
    ): RestrictedQueryBuilder<T>;

    /**
     * Matches records where at least one value equals `value`.
     * @example qb.anyEqual('tags', 'admin'); // tags?='admin'
     */
    anyEqual<P extends Path<T>>(
        path: P,
        value: PathValue<T, P>,
    ): RestrictedQueryBuilder<T>;

    /**
     * Matches records where at least one value does not equal `value`.
     * @example qb.anyNotEqual('tags', 'user'); // tags?!='user'
     */
    anyNotEqual<P extends Path<T>>(
        path: P,
        value: PathValue<T, P>,
    ): RestrictedQueryBuilder<T>;

    /**
     * Matches records where at least one value is greater than `value`.
     * @example qb.anyGreaterThan('age', 21); // age?>21
     */
    anyGreaterThan<P extends Path<T>>(
        path: P,
        value: PathValue<T, P>,
    ): RestrictedQueryBuilder<T>;

    /**
     * Matches records where at least one value is greater than or equal to `value`.
     * @example qb.anyGreaterThanOrEqual('age', 18); // age?>=18
     */
    anyGreaterThanOrEqual<P extends Path<T>>(
        path: P,
        value: PathValue<T, P>,
    ): RestrictedQueryBuilder<T>;

    /**
     * Matches records where at least one value is less than `value`.
     * @example qb.anyLessThan('age', 50); // age?<50
     */
    anyLessThan<P extends Path<T>>(
        path: P,
        value: PathValue<T, P>,
    ): RestrictedQueryBuilder<T>;

    /**
     * Matches records where at least one value is less than or equal to `value`.
     * @example qb.anyLessThanOrEqual('age', 65); // age?<=65
     */
    anyLessThanOrEqual<P extends Path<T>>(
        path: P,
        value: PathValue<T, P>,
    ): RestrictedQueryBuilder<T>;

    /**
     * Performs a wildcard match on at least one value.
     * @example qb.anyLike('name', 'Joh'); // name?~'Joh'
     */
    anyLike<P extends Path<T>>(
        path: P,
        value: PathValue<T, P>,
    ): RestrictedQueryBuilder<T>;

    /**
     * Negated wildcard match on at least one value.
     * @example qb.anyNotLike('name', 'Doe'); // name?!~'Doe'
     */
    anyNotLike<P extends Path<T>>(
        path: P,
        value: PathValue<T, P>,
    ): RestrictedQueryBuilder<T>;

    /**
     * Matches records where `key` is in `values`.
     * @example qb.in('age', [18, 21, 30]); // (age=18 || age=21 || age=30)
     */
    in<P extends Path<T>>(
        path: P,
        values: PathValue<T, P>[],
    ): RestrictedQueryBuilder<T>;

    /**
     * Matches records where `key` is between `from` and `to`.
     * @example
     * qb.between('age', 18, 30); // (age>=18 && age<=30)
     * qb.between('createdAt', new Date('2021-01-01'), new Date('2021-12-31')); // (createdAt>='2021-01-01' && createdAt<='2021-12-31')
     */
    between<P extends Path<T>>(
        path: P,
        from: PathValue<T, P>,
        to: PathValue<T, P>,
    ): RestrictedQueryBuilder<T>;

    /**
     * Matches records where `key` is null.
     * @example qb.isNull('name'); // name=''
     */
    isNull<P extends Path<T>>(path: P): RestrictedQueryBuilder<T>;

    /**
     * Matches records where `key` is not null.
     * @example qb.isNotNull('name'); // name!=''
     */
    isNotNull<P extends Path<T>>(path: P): RestrictedQueryBuilder<T>;

    /**
     * Executes a custom query.
     * @example
     * qb.custom('age > 21'); // age > 21
     * // We recommend using the native `pb.filter()` function
     * qb.custom(pb.filter('age > {:age}', { age: 21 })); // age > 21
     */
    custom(raw: string): RestrictedQueryBuilder<T>;

    /**
     * Opens a subquery.
     * @example qb.open().equal('status', 'active').close();
     */
    open(): QueryBuilder<T>;

    /**
     * Returns the query string and values.
     * @example
     * const query = qb.equal('name', 'Alice').build();
     * console.log(query.raw); // name='Alice'
     * console.log(query.values); // { name: 'Alice' }
     */
    build(): { raw: string; values: Record<string, any> };

    readonly raw: string;
    readonly values: Record<string, any>;
}

interface RestrictedQueryBuilder<T> {
    /**
     * Combines the current condition with an AND.
     * @example qb.equal('name', 'Alice').and().greaterThan('age', 21);
     */
    and(): QueryBuilder<T>;
    /**
     * Combines the current condition with an `OR`.
     * @example qb.equal('name', 'Alice').or().equal('name', 'Bob');
     */
    or(): QueryBuilder<T>;

    /**
     * Closes a previously opened subquery.
     * @example qb.open().equal('status', 'active').close();
     */
    close(): RestrictedQueryBuilder<T>;

    /**
     * Returns the query string and values.
     * @example
     * const query = qb.equal('name', 'Alice').build();
     * console.log(query.raw); // name='Alice'
     * console.log(query.values); // { name: 'Alice' }
     */
    build(): { raw: string; values: Record<string, any> };

    readonly raw: string;
    readonly values: Record<string, any>;
}

const builderFunctionsObject = [
    { name: "equal", operator: "=" },
    { name: "notEqual", operator: "!=" },
    { name: "greaterThan", operator: ">" },
    { name: "greaterThanOrEqual", operator: ">=" },
    { name: "lessThan", operator: "<" },
    { name: "lessThanOrEqual", operator: "<=" },
    { name: "like", operator: "~" },
    { name: "notLike", operator: "!~" },
    { name: "anyEqual", operator: "?=" },
    { name: "anyNotEqual", operator: "?!=" },
    { name: "anyGreaterThan", operator: "?>" },
    { name: "anyGreaterThanOrEqual", operator: "?>=" },
    { name: "anyLessThan", operator: "?<" },
    { name: "anyLessThanOrEqual", operator: "?<=" },
    { name: "anyLike", operator: "?~" },
    { name: "anyNotLike", operator: "?!~" },
] as const;

function prepareQuery<T>(): QueryBuilder<T> {
    let query = "";

    const keyCounter = new Map<Path<T>, number>();
    const valueMap = new Map<string, any>();

    const incrementKeyCounter = (key: Path<T>) => {
        const count = keyCounter.get(key) || 0;
        const newCount = count + 1;
        keyCounter.set(key, newCount);

        return newCount;
    };

    const saveValue = <P extends Path<T>>(key: P, value: PathValue<T, P>) => {
        const count = incrementKeyCounter(key);
        const newName = `${String(key)}${count}`;
        valueMap.set(newName, value);

        return newName;
    };

    const expression = <P extends Path<T>>(
        key: P,
        operator: string,
        value: PathValue<T, P>,
    ) => {
        const newName = saveValue(key, value);
        query += `${String(key)}${operator}{:${newName}}`;
    };

    const builderFunctions = {} as QueryBuilder<T>;
    for (const { name, operator } of builderFunctionsObject) {
        builderFunctions[name] = <P extends Path<T>>(
            path: P,
            value: PathValue<T, P>,
        ) => {
            expression(path, operator, value);
            return restrictedQueryBuilder;
        };
    }

    const queryBuilder: QueryBuilder<T> = {
        ...builderFunctions,
        in<P extends Path<T>>(path: P, values: PathValue<T, P>[]) {
            query += "(";
            values.forEach((value, index) => {
                expression(path, "=", value);
                query += index < values.length - 1 ? " || " : "";
            });
            query += ")";
            return restrictedQueryBuilder;
        },
        between<P extends Path<T>>(
            path: P,
            from: PathValue<T, P>,
            to: PathValue<T, P>,
        ) {
            query += "(";
            expression(path, ">=", from);
            query += " && ";
            expression(path, "<=", to);
            query += ")";
            return restrictedQueryBuilder;
        },
        isNull(path) {
            query += `${String(path)}=''`;
            return restrictedQueryBuilder;
        },
        isNotNull(path) {
            query += `${String(path)}!=''`;
            return restrictedQueryBuilder;
        },
        custom(raw: string) {
            query += raw;
            return restrictedQueryBuilder;
        },
        open() {
            query += `(`;
            return queryBuilder;
        },
        build() {
            return { raw: query, values: Object.fromEntries(valueMap) };
        },
        get raw() {
            return query;
        },
        get values() {
            return Object.fromEntries(valueMap);
        },
    };

    const restrictedQueryBuilder: RestrictedQueryBuilder<T> = {
        and() {
            query += ` && `;
            return queryBuilder;
        },
        or() {
            query += ` || `;
            return queryBuilder;
        },
        close() {
            query += `)`;
            return restrictedQueryBuilder;
        },
        build() {
            return { raw: query, values: Object.fromEntries(valueMap) };
        },
        get raw() {
            return query;
        },
        get values() {
            return Object.fromEntries(valueMap);
        },
    };

    return queryBuilder;
}

interface User {
    id: string;
    name: string;
    age: number;
    city: string;
}

interface Post {
    id: string;
    title: string;
    content: string;
    createdAt: Date;
    updatedAt: Date;
    user: User;
}

const query1 = prepareQuery<User>()
    .equal("name", "John")
    .and()
    .open()
    .notEqual("age", 20)
    .or()
    .notEqual("age", 30)
    .close()
    .and()
    .equal("city", "New York")
    .build();

console.log(query1);
console.log(filter(query1.raw, query1.values));

const query2 = prepareQuery<Post>()
    .equal("user.name", "John")
    .and()
    .open()
    .anyNotLike("title", "foo")
    .or()
    .anyLike("title", "bar")
    .close()
    .and()
    .in("user.age", [20, 30, 40])
    .and()
    .between("user.age", 20, 30)
    .and()
    .between("createdAt", new Date("2021-01-01"), new Date("2021-12-31"))
    .and()
    .custom(filter("content~{:content}", { content: "test" }))
    .and()
    .in("user.city", ["New York", "Los Angeles"])
    .build();

console.log(query2);
console.log(filter(query2.raw, query2.values));

const { raw, values } = prepareQuery<User>()
    .equal("name", "John")
    .and()
    .open()
    .notEqual("age", 20)
    .or()
    .notEqual("age", 30)
    .close()
    .and()
    .equal("city", "New York");

console.log(filter(raw, values));
