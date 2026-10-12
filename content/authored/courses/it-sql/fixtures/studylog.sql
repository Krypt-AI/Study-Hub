-- The study-log practice database used by the SQL course's exercises.
-- Each exercise starts from a fresh copy of it.
CREATE TABLE learners (id INTEGER PRIMARY KEY, name TEXT NOT NULL, country TEXT);
CREATE TABLE courses (id INTEGER PRIMARY KEY, title TEXT NOT NULL, category TEXT NOT NULL);
CREATE TABLE sessions (
  id INTEGER PRIMARY KEY,
  learner_id INTEGER NOT NULL REFERENCES learners(id),
  course_id INTEGER NOT NULL REFERENCES courses(id),
  day TEXT NOT NULL,
  minutes INTEGER NOT NULL,
  correct INTEGER NOT NULL,
  answered INTEGER NOT NULL
);
INSERT INTO learners VALUES (1, 'Aiko', 'Japan'), (2, 'Ben', 'Malaysia'), (3, 'Chen', 'China'), (4, 'Dana', NULL), (5, 'Eva', 'Germany');
INSERT INTO courses VALUES (1, 'HSK 1', 'chinese'), (2, 'JLPT N5', 'japanese'), (3, 'Python Fundamentals', 'ai-engineering'), (4, 'Networking', 'it'), (5, 'Linux Basics', 'it');
INSERT INTO sessions VALUES
  (1, 1, 2, '2026-10-01', 30, 18, 20), (2, 1, 2, '2026-10-02', 45, 25, 30), (3, 2, 1, '2026-10-01', 60, 40, 50),
  (4, 2, 3, '2026-10-03', 25, 9, 12), (5, 3, 1, '2026-10-02', 50, 35, 40), (6, 3, 4, '2026-10-04', 40, 14, 20),
  (7, 1, 3, '2026-10-05', 55, 20, 25), (8, 2, 1, '2026-10-06', 35, 22, 30), (9, 4, 2, '2026-10-06', 20, 6, 10),
  (10, 3, 1, '2026-10-07', 45, 30, 32);
