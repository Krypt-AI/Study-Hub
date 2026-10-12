---
id: it-sql.l03
title: Grouping and aggregation
summary: Summarising rows with COUNT, SUM and AVG, per group with GROUP BY, and filtering groups with HAVING.
objectives:
  - Summarise a table with COUNT, SUM, AVG, MIN and MAX
  - Group rows with GROUP BY, including across joined tables
  - Filter groups with HAVING and know why WHERE cannot do it
estimatedMinutes: 40
topics: [sql.aggregate]
resources:
  - { title: "SQLite: aggregate functions", url: "https://www.sqlite.org/lang_aggfunc.html", free: true, official: true }
---

## Aggregate functions

An aggregate turns many rows into one value:

```sql
SELECT COUNT(*)        AS sessions,
       SUM(minutes)    AS total_minutes,
       AVG(minutes)    AS average_minutes,
       MIN(day)        AS first_day,
       MAX(day)        AS last_day
FROM sessions;
```

`COUNT(*)` counts rows. `COUNT(column)` counts only the rows where that column is **not NULL**, so `COUNT(country)` on `learners` skips the learner whose country is unknown. `SUM`, `AVG`, `MIN` and `MAX` ignore NULLs too.

## GROUP BY

`GROUP BY` splits the rows into groups and computes the aggregates once per group:

```sql
SELECT course_id, COUNT(*) AS sessions, SUM(minutes) AS total_minutes
FROM sessions
GROUP BY course_id;
```

Every column in the `SELECT` list must either be in `GROUP BY` or be inside an aggregate. (SQLite tolerates other columns, but their values come from an arbitrary row of the group, so do not rely on them.) Grouping works the same after a join, which is how you get names instead of ids:

```sql
SELECT l.name, SUM(s.minutes) AS total_minutes
FROM sessions s
JOIN learners l ON l.id = s.learner_id
GROUP BY l.id, l.name;
```

Grouping by `l.id` as well as `l.name` keeps two learners who share a name apart.

## WHERE filters rows, HAVING filters groups

```sql
SELECT course_id, SUM(minutes) AS total_minutes
FROM sessions
WHERE day >= '2026-10-02'        -- rows, before grouping
GROUP BY course_id
HAVING SUM(minutes) > 60;        -- groups, after aggregation
```

`WHERE` runs first, on individual rows, before any group or total exists, so it cannot refer to `SUM(minutes)`. `HAVING` runs after grouping and can.

## Rounding ratios

Ratios of totals are a common report. Remember integer division from lesson 1, and round for display:

```sql
SELECT ROUND(SUM(correct) * 1.0 / SUM(answered), 2) AS accuracy FROM sessions;
```
