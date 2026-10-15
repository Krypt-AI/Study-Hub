---
{
  "id": "fs-08-databases.l03",
  "title": "ORMs, query builders and document databases",
  "summary": "Using a database from application code safely, and when a document store fits better than tables.",
  "objectives": [
    "Use parameterised queries and understand what an ORM does",
    "Compare relational and document databases",
    "Pick a database for a project with reasons"
  ],
  "estimatedMinutes": 35,
  "topics": [
    "fs-08-databases.orms-and-documents"
  ],
  "resources": [
    {
      "title": "Prisma documentation",
      "url": "https://www.prisma.io/docs",
      "free": true,
      "official": true
    },
    {
      "title": "MongoDB data modelling",
      "url": "https://www.mongodb.com/docs/manual/data-modeling/",
      "free": true,
      "official": true
    }
  ]
}
---

## Talking to a database from code

**Never build SQL by concatenating user input.** Pass values as **parameters**; the driver sends them separately from the SQL text, so they can never change its meaning:

```ts
// vulnerable: title = "x'; DROP TABLE notes; --"
db.query(`SELECT * FROM notes WHERE title = '${title}'`);

// safe
db.query("SELECT * FROM notes WHERE title = $1", [title]);
```

## ORMs and query builders

| Tool kind | Example | You write |
|---|---|---|
| Driver | `pg`, `better-sqlite3` | SQL strings |
| Query builder | Knex, Kysely, Drizzle | typed SQL-like code |
| ORM | Prisma, TypeORM, Sequelize | model objects and relations |

An ORM maps rows to objects, generates SQL, manages migrations and gives you types. The cost is hidden queries (watch for N+1) and complex reports that are clearer in SQL, which every ORM lets you drop down to.

```ts
const notes = await prisma.note.findMany({
  where: { userId, done: false },
  include: { tags: true },
  orderBy: { createdAt: "desc" },
  take: 20,
});
```

## Document databases

A document store (MongoDB, Firestore) saves **JSON-like documents** in collections, with flexible fields and no joins by default. Embed data that is read together; reference data that is shared or large.

| Relational | Document |
|---|---|
| Fixed schema, enforced | Flexible schema, enforced by your code |
| Joins, constraints, transactions across tables | Related data embedded in one document |
| Best for structured, connected data and reporting | Best for varied or nested data read as a unit |

## Choosing

Start with a **relational database** (PostgreSQL or SQLite) unless you have a clear reason: most applications have connected data and benefit from constraints and transactions. Add a **cache** (Redis) for hot reads, **object storage** for files and **search** only when a need is measured.
