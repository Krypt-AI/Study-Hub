---
id: it-sql.l02
title: Joining tables
summary: Combining rows from related tables with INNER and LEFT joins, and finding rows without a match.
objectives:
  - Join two or three tables on their key columns
  - Choose between INNER JOIN and LEFT JOIN
  - Find rows that have no match in another table
estimatedMinutes: 40
topics: [sql.joins]
resources:
  - { title: "SQLite: SELECT (the FROM clause and joins)", url: "https://www.sqlite.org/lang_select.html", free: true, official: true }
---

## Why tables are split

The study log keeps each fact once: a learner's name lives in `learners`, a course title in `courses`, and each study session in `sessions`, which points to both through `learner_id` and `course_id`. To answer "who studied what", you **join** the tables back together on those key columns.

## INNER JOIN

```sql
SELECT s.day, l.name, s.minutes
FROM sessions AS s
JOIN learners AS l ON l.id = s.learner_id
ORDER BY s.day;
```

`JOIN` (short for `INNER JOIN`) pairs each session with the learner whose `id` matches its `learner_id`. Rows **without** a match on either side are left out. The short names `s` and `l` are table aliases: they keep queries readable and are required when two tables have a column with the same name, such as `id`.

Joins chain, one `ON` condition per table:

```sql
SELECT l.name, c.title, s.minutes
FROM sessions s
JOIN learners l ON l.id = s.learner_id
JOIN courses  c ON c.id = s.course_id;
```

## LEFT JOIN: keep rows without a match

```sql
SELECT l.name, s.day
FROM learners l
LEFT JOIN sessions s ON s.learner_id = l.id;
```

A `LEFT JOIN` keeps **every** row of the table on its left. When a learner has no sessions, the session columns come back as `NULL`. That makes it the tool for "which rows have no match?":

```sql
SELECT c.title
FROM courses c
LEFT JOIN sessions s ON s.course_id = c.id
WHERE s.id IS NULL;          -- courses nobody has studied yet
```

Be careful with conditions on the right-hand table. `WHERE s.minutes > 30` removes the `NULL` rows again and quietly turns the `LEFT JOIN` back into an inner join. If you want to keep unmatched rows, put such conditions in the `ON` clause instead.

## The missing ON condition

Join two tables without a condition and every row of one is paired with every row of the other: a **cartesian product**. Joining a 5-row table to a 10-row table that way gives 50 rows. If a join returns far more rows than you expect, check the `ON` clauses first.
