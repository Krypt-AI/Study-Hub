---
id: it-sql.l01
title: SELECT, WHERE and ORDER BY
summary: Reading rows from one table, filtering them and sorting the result.
objectives:
  - Write SELECT queries with column lists, aliases and expressions
  - Filter rows with WHERE, comparison operators, IN, BETWEEN, LIKE and IS NULL
  - Sort and limit results
estimatedMinutes: 35
topics: [sql.select]
resources:
  - { title: "SQLite: SELECT", url: "https://www.sqlite.org/lang_select.html", free: true, official: true }
---

## The practice database

The exercises in this course use a small study-log database:

```sql
CREATE TABLE learners (id INTEGER PRIMARY KEY, name TEXT NOT NULL, country TEXT);
CREATE TABLE courses  (id INTEGER PRIMARY KEY, title TEXT NOT NULL, category TEXT NOT NULL);
CREATE TABLE sessions (
  id INTEGER PRIMARY KEY,
  learner_id INTEGER NOT NULL REFERENCES learners(id),
  course_id  INTEGER NOT NULL REFERENCES courses(id),
  day TEXT NOT NULL,          -- 'YYYY-MM-DD'
  minutes INTEGER NOT NULL,
  correct INTEGER NOT NULL,   -- questions answered correctly
  answered INTEGER NOT NULL
);
```

## Selecting columns

```sql
SELECT name, country FROM learners;
SELECT title AS course, category FROM courses;          -- AS renames a column
SELECT day, correct * 1.0 / answered AS accuracy FROM sessions;
```

`SELECT *` returns every column; fine for exploring, but name the columns in real queries so they keep working when the table changes. Note `correct * 1.0 / answered`: dividing two integers in SQLite performs **integer division**, so multiply by `1.0` first.

## Filtering with WHERE

```sql
SELECT * FROM sessions WHERE minutes >= 30;
SELECT * FROM courses  WHERE category IN ('chinese', 'japanese');
SELECT * FROM sessions WHERE day BETWEEN '2026-10-01' AND '2026-10-07';
SELECT * FROM learners WHERE name LIKE 'A%';       -- % matches any run of characters
SELECT * FROM learners WHERE country IS NULL;      -- never "= NULL"
```

`NULL` means "unknown". Any comparison with `NULL` (even `NULL = NULL`) is unknown, not true, which is why you must use `IS NULL` / `IS NOT NULL`.

## Sorting and limiting

```sql
SELECT day, minutes FROM sessions
ORDER BY minutes DESC, day ASC
LIMIT 3;
```

Without `ORDER BY`, the database may return rows in **any** order. Whenever the order matters, say so explicitly.
