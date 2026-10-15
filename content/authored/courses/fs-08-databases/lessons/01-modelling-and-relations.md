---
{
  "id": "fs-08-databases.l01",
  "title": "Modelling data and relations",
  "summary": "Turning an application's nouns into tables, keys and relationships, and when to denormalise.",
  "objectives": [
    "Design tables with primary and foreign keys",
    "Model one-to-many and many-to-many relationships",
    "Apply normalisation and know when to break it"
  ],
  "estimatedMinutes": 40,
  "topics": [
    "fs-08-databases.modelling-and-relations"
  ],
  "resources": [
    {
      "title": "SQLite documentation",
      "url": "https://www.sqlite.org/docs.html",
      "free": true,
      "official": true
    },
    {
      "title": "PostgreSQL tutorial",
      "url": "https://www.postgresql.org/docs/current/tutorial.html",
      "free": true,
      "official": true
    }
  ]
}
---

## From nouns to tables

List the things your application stores (users, courses, enrolments), give each a table, and give every row a **primary key**. Relationships become **foreign keys**.

```sql
CREATE TABLE users   (id INTEGER PRIMARY KEY, email TEXT NOT NULL UNIQUE, name TEXT NOT NULL);
CREATE TABLE courses (id INTEGER PRIMARY KEY, title TEXT NOT NULL);
CREATE TABLE enrolments (
  user_id   INTEGER NOT NULL REFERENCES users(id)   ON DELETE CASCADE,
  course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  enrolled_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, course_id)
);
```

- **One-to-many**: the foreign key lives on the "many" side (`orders.customer_id`).
- **Many-to-many**: needs a **join table** (`enrolments`), whose composite key stops duplicates.
- **Constraints** (`NOT NULL`, `UNIQUE`, `CHECK`, `REFERENCES`) put your rules in the database where every client must obey them.

## Normalisation

Store each fact **once**. A table with `customer_name` repeated on every order must be updated in many places; split it so the name is stored in `customers` and referenced by id. The first three normal forms in plain words: one value per cell; every column depends on the whole key; no column depends on another non-key column.

Denormalise **deliberately** (a stored total, a counter) when you have measured a reason, and keep the copy correct in one place.

## Choosing keys

Use a surrogate key (`id`) for rows; keep natural identifiers (`email`) `UNIQUE`. Store money as integer minor units (cents) or `DECIMAL`, times in UTC, and never store passwords, only password hashes.

## Migrations

Schema changes are code: write **migrations** (numbered, reviewed, applied in order) so every environment reaches the same schema. Prefer additive, backwards-compatible steps: add a column, backfill, switch the code, then remove the old column.
