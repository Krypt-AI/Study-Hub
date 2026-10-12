---
id: it-sql.l04
title: Keys, constraints and normalisation
summary: Designing tables that keep data correct, with keys and constraints, and splitting repeated data into related tables.
objectives:
  - Choose primary keys and declare foreign keys
  - Protect data with NOT NULL, UNIQUE and CHECK constraints
  - Recognise repeated data and split it into related tables, including many-to-many links
estimatedMinutes: 45
topics: [sql.design]
resources:
  - { title: "SQLite: CREATE TABLE", url: "https://www.sqlite.org/lang_createtable.html", free: true, official: true }
  - { title: "SQLite: foreign key support", url: "https://www.sqlite.org/foreignkeys.html", free: true, official: true }
---

## Keys

A **primary key** identifies each row. In SQLite, `id INTEGER PRIMARY KEY` gives every row a unique number automatically. A **foreign key** says that a column must match a key in another table:

```sql
CREATE TABLE sessions (
  id INTEGER PRIMARY KEY,
  learner_id INTEGER NOT NULL REFERENCES learners(id),
  course_id  INTEGER NOT NULL REFERENCES courses(id)
);
```

SQLite checks foreign keys only on connections that run `PRAGMA foreign_keys = ON;`. It is off by default for backwards compatibility, so a session pointing at a learner who does not exist can slip in unless you switch it on.

## Constraints

Constraints make the database refuse bad data, whichever program writes it:

```sql
CREATE TABLE courses (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL UNIQUE,                                         -- required, no duplicates
  category TEXT NOT NULL CHECK (category IN ('chinese', 'japanese', 'ai-engineering', 'it')),
  hours REAL CHECK (hours > 0)
);
```

A row that breaks a constraint is rejected with an error. `INSERT OR IGNORE` skips such rows instead, which is handy when loading data that may contain duplicates.

## Normalisation: store each fact once

Compare a spreadsheet-style table with the study log:

| learner_name | learner_country | course_title | day | minutes |
|---|---|---|---|---|
| Aiko | Japan | JLPT N5 | 2026-10-01 | 30 |
| Aiko | Japan | JLPT N5 | 2026-10-02 | 45 |

Aiko's country is repeated on every row. If it changes, every row must be updated; miss one and the data contradicts itself (an **update anomaly**). Normalising moves each fact to the table it describes (learners, courses, sessions) and links them with keys.

## Many-to-many relationships

A learner can enrol in many courses and a course has many learners. Neither table can hold the other's id, so the link gets its own **junction table**:

```sql
CREATE TABLE enrolments (
  learner_id INTEGER NOT NULL REFERENCES learners(id),
  course_id  INTEGER NOT NULL REFERENCES courses(id),
  PRIMARY KEY (learner_id, course_id)          -- each pair at most once
);
```

The composite primary key makes each learner-course pair unique.
