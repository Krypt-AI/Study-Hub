# Architecture

Study Hub is a static single-page app (React 19, TypeScript, Vite, Tailwind 4). There is no application server: content is prebuilt JSON, learner data lives in IndexedDB or in Supabase behind row level security, and code runs in Web Workers in the browser.

## Layers

```
features/  (pages and their components)
   │  React Query hooks (data/queries.ts)
   ▼
data/  StudyRepository ── LocalRepository (IndexedDB, Dexie)
   │                   └─ SupabaseRepository (Postgres + RLS)
domain/  pure logic: content schema, evaluation, SRS, mastery, selection
workers/ sandboxed runtimes, spoken to through features/playground/execution/codeRunner.ts
```

- **Content** (`domain/content`) is defined once with zod (`schema.ts`). `scripts/build-content.ts` validates every authored and generated file, fills defaults, checks cross-references and writes `public/content/{catalog.json, courses/*.json, search-index.json}`. The app loads these without re-validating, checking only the format version.
- **Learner data** (`data/records.ts`) has one shape for both backends. Everything goes through the `StudyRepository` interface; pages never touch storage directly. Backups (format version 3; versions 1 and 2 still import) export and import one learner's records as one JSON file.
- **Learners** (`data/learners/`): several people can share a device or an account (siblings on one computer). Each learner has their own progress, calendar, settings and unfinished exam sittings. There are two separate lists, never mixed:
  - **device learners** (guests and local mode): kept in the IndexedDB database `study-hub-device`; each learner's data is its own IndexedDB database (`study-hub` for the first learner, so data saved before learners existed stays with them, `study-hub-learner-<id>` for the others). They belong to the device: signing in or out does not change them.
  - **account learners** (signed in): the Supabase table `learners`; every other table carries `learner_id`, part of its key, with a foreign key that deletes a learner's rows with the learner.

  `RepositoryProvider` opens the active learner (the one chosen last on this device, else the first) and remounts the app under that learner's repository, with an empty query cache, whenever the user or the learner changes. After the first sign-in, when the device has progress and the account has none, `BringDeviceProgress` offers once to copy every device learner into the account (a merge import per learner, safe to repeat).
- **One write path for answers**: `domain/learning/recordAnswer.ts` stores the attempt, updates the review schedule, topic mastery, daily activity and lesson progress. Lessons, reviews, quizzes and mock exams all use it, and writes are serialised so concurrent answers cannot lose updates.

## Calendar (`domain/calendar`)

- **Weekly classes** are a Lecture or a Lab. Classes saved as tutorials or "other" before are read as lectures by one function, `normalizeTimetableClass` (`data/records.ts`), used by both repositories and by backup import; a Supabase migration and an IndexedDB upgrade (version 4) rewrite the stored values too.
- **Important dates** are one-off: quizzes, tests, midterms, finals, deadlines, and extra or make-up classes.
- **Semesters** (`semesters.ts`): the catalog's terms (`content/authored/university.yaml`) plus those the learner adds, stored as `SemesterRecord`s with `addedByLearner` and optional dates. A name in both is one semester. The list is newest first: the learner's own (most recently added first), then the catalog's in their authored order. The calendar and the catalog open on the semester whose dates contain today, else the catalog's current term, else the newest. Only learner-added semesters can be removed, with their classes and dates.

## Evaluation (`domain/evaluation`)

Each question type has a rule-based judge that returns a verdict (`correct`, `almost`, `partial`, `incorrect`, `self-review`), a score, specific feedback points, the expected answers and, for approximate judgements, how it judged.

- **Text**: case, punctuation and small typos (Damerau–Levenshtein) are tolerated per question.
- **Pinyin**: answers are parsed into syllables (412-syllable inventory, checked against CC-CEDICT). Tone marks and tone numbers are interchangeable; a single wrong tone in a multi-syllable word is "almost", and the feedback names the syllable.
- **Kana**: hiragana, katakana and romaji are compared on a canonical form; long vowels, small っ/ゃゅょ and dakuten slips are named.
- **Open answers and free translations** are self-review: keyword groups from a rubric are detected and pre-ticked, and the learner confirms the mark. No AI grading is used.
- **Code** is judged by its tests in the sandbox; **SQL** by comparing the result set with the reference query's on a fresh copy of the database. Editor-only languages (C, Bash) are never reported as run.

## Learning model (`domain/learning`)

- **Spaced repetition**: FSRS (ts-fsrs) with configurable target recall. Only the first attempt at a question in a session moves its schedule; retries are free practice. Hints and revealed answers lower the rating.
- **Mastery**: an exponential moving average per topic and skill (recognise, recall, explain, apply), with levels new, learning, weak and mastered. "Practise my weaknesses" picks the weakest topic-skill pairs and orders their questions: weak skill first, then recently failed, unanswered, and longest since answered.
- **Activity**: active minutes (visible tab, recent interaction), answers and completions per day; streaks and a daily goal (minutes or questions, whichever is met first).
- **Starred courses** (`focus.ts`): the learner stars the courses they are taking now (`starredCourseIds` in their settings). Once any course is starred, Today (resume, your courses, due reviews, weakest topics), the rail's due count, the Practice hub's due counts and the due-review session cover only starred courses, so other courses add no pressure; their lessons still work when opened. With nothing starred, every course counts, and Today suggests starring.

## Code execution (`workers/`)

Each runtime is a dedicated module Web Worker: Pyodide (Python), a hardened `AsyncFunction` with sucrase type-stripping (JavaScript/TypeScript), and sql.js (SQLite). Before any learner code runs, the worker removes XHR, WebSocket, IndexedDB, caches, nested workers and similar globals, and replaces `fetch` with a guard that only reaches the Pyodide CDN. Python's `js` module is limited to computation helpers. Output is capped, and the time limit is enforced by terminating the worker, which also stops infinite loops.

## Security and privacy

- Personal data never leaves the browser in local mode. In Supabase mode, every table has row level security that limits rows to their owner; the anon role has no privileges; the browser only ever holds the public anon key. The policies are tested against a real Postgres (PGlite) in `supabase/tests/rls.test.ts`.
- Accounts and access (hosted mode, [DEPLOY.md](DEPLOY.md)): `features/auth` tracks the Supabase session (Google by default; Discord, GitHub or email via `VITE_AUTH_PROVIDERS`) and mirrors the access token into a cookie. Guests use the device learners (above): their progress survives reloads but never leaves the device. Signing out reloads the app, so nothing of the account stays in memory, and account data is never written to IndexedDB. The build writes `content/access.json` (open courses and material sources, from `domain/content/accessManifest.ts`), and the Netlify edge function `netlify/edge-functions/content-gate` applies `domain/content/accessRules.ts` to every request: the files of courses outside the University area need a valid, non-anonymous access token signed by the project.
- Content from your books is generated locally, git-ignored and not published.
- Markdown is rendered without raw HTML; external links open with `noopener`.

## Testing

- Vitest: evaluation (pinyin, kana, matching, rubric), SRS and mastery, practice selection, exam marking, the calendar (weeks, semesters, clashes, upcoming dates), backups, worker runtime helpers, and RLS policies and table privileges (on a database set up like a Supabase project from before and after 30 May 2026, when Supabase stopped granting them by default).
- `npm run content:verify`: every exercise's reference solution passes its own tests.
- Playwright (`e2e/`), two projects on their own dev servers. **local** (Supabase switched off): every page renders without console errors; the lesson → answer → feedback → saved-progress loop survives a reload; a timetable class and an exam date are saved and the exam shows on Today; a full mock exam; JavaScript, SQL and Python actually run; network access from learner code is blocked; C is labelled editor-only. **signed-in** (`e2e/signed-in/`): the app is built against a stub Supabase origin that the tests answer in the browser, with the content gate applying the real `accessRules.ts`; a guest is asked to sign in for a locked course, and a stubbed session opens it and shows the account in Settings.
