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
- **Production build**: `public/` (page images, audio, built content: about 500 MB) is not emptied and recopied on each build. `scripts/vite/syncPublicDir.ts` copies only changed files into `dist/` and deletes what the build no longer produces, so `dist/` still matches a clean build.
- **Learner data** (`data/records.ts`) has one shape for both backends. Everything goes through the `StudyRepository` interface; pages never touch storage directly. Backups (format version 3; versions 1 and 2 still import) export and import one learner's records as one JSON file.
- **Learners** (`data/learners/`): several people can share a device or an account (siblings on one computer). Each learner has their own progress, calendar, settings and unfinished exam sittings. There are two separate lists, never mixed:
  - **device learners** (guests and local mode): kept in the IndexedDB database `study-hub-device`; each learner's data is its own IndexedDB database (`study-hub` for the first learner, so data saved before learners existed stays with them, `study-hub-learner-<id>` for the others). They belong to the device: signing in or out does not change them.
  - **account learners** (signed in): the Supabase table `learners`; every other table carries `learner_id`, part of its key, with a foreign key that deletes a learner's rows with the learner.

  `RepositoryProvider` opens the active learner (the one chosen last on this device, else the first) and remounts the app under that learner's repository, with an empty query cache, whenever the user or the learner changes. After the first sign-in, when the device has progress and the account has none, `BringDeviceProgress` offers once to copy every device learner into the account (a merge import per learner, safe to repeat).
- **Profile** (`domain/profile/profile.ts`): each learner's age, school level (primary, secondary or university) and, at school, their year (Standard 1–6 or Form 1–5), kept as `profile` in their settings. A learner without one, on any page, sees the Welcome page (`features/profile/WelcomePage.tsx`) instead of the app; the age suggests the level and year (Standard = age − 6, Form = age − 12) and the learner can change both. Settings › About you edits it, confirming a new level or year first. Nothing more is asked: the optional nickname is the learner's name. A backup's profile is checked on import and dropped if it is not valid, so the Welcome page asks again.
- **Visibility** (`domain/content/visibility.ts`): one rule decides which courses, certifications and roadmaps a learner sees, and every list takes them from `useVisibleCatalog()` (`features/profile/useVisibility.ts`): Courses, Today, Practice and its quiz picker, the due count and due reviews, search, Certifications, Settings' subject list and the calendar's subject picker. A learner sees their own level (University, or every year of primary or secondary school with their own year first) and the extras they chose (`visibleCategories`: Chinese, Japanese, AI engineering, IT). Guests cannot choose extras; a signed-in learner, or local mode, is asked once after the Welcome page ("What do you want to study?", pre-ticking extras where they have progress or saved questions) and can change it in Settings › Courses I want to see. Certifications follow the extras (language tests their language, AI and data AI engineering, the rest IT) and leave the rail when none is chosen. Hiding never deletes: a course opened by its link still opens, with a banner that shows its extra again. A school subject taught in both languages is two courses with the same subject and year; the learner's choice per subject (`languageBySubject`, BM until chosen) decides which is listed, and the course page switches between them.
- **Question tiers** (`domain/learning/tiers.ts`): a multiple-choice question can carry an authored `tier` (easy, medium, hard). Quizzes and weak-spot practice in a subject offer the questions of the tier the learner picked for it (`questionTiers`, medium until chosen), plus every question without a tier; the switch shows on a subject's Practice page only when the subject has tiered questions. No current question has a tier, so nothing is filtered yet. (`difficulty` is something else: imported books use it for their own grading.)
- **Marked papers** (`features/practice/exam/gradeExam.ts`): a question's score (0 to 1) times its `marks` adds up to the section and paper totals; in a `choose` section only the questions chosen count. Written answers with a `marking` scheme are marked by the learner band by band (`SchemeMarking.tsx`) and counted once confirmed. The words around a paper (marks, word limits, choosing questions, the scheme) follow the question's language through `features/practice/paperWords.ts`, so a BM paper reads "[2 markah]" and "Sahkan markah saya"; the rest of the app's interface is still English (see STATUS).
- **Foundations** (`domain/content/foundations.ts`): certifications and roadmap stages can name a course to do first (Linux Fundamentals for most IT exams) with how much it matters and which units. Certification pages, roadmap stages and the course page show them through `features/certifications/FoundationModules.tsx`, with the learner's lesson progress; nothing new is stored.
- **One write path for answers**: `domain/learning/recordAnswer.ts` stores the attempt, updates the review schedule, topic mastery, daily activity and lesson progress. Lessons, reviews, quizzes and mock exams all use it, and writes are serialised so concurrent answers cannot lose updates.

## Calendar (`domain/calendar`)

- **Weekly classes** are a Lecture or a Lab. Classes saved as tutorials or "other" before are read as lectures by one function, `normalizeTimetableClass` (`data/records.ts`), used by both repositories and by backup import; a Supabase migration and an IndexedDB upgrade (version 4) rewrite the stored values too.
- **Important dates**: quizzes, tests, midterms, finals, deadlines, extra or make-up classes, and holidays or breaks. A date can span several days (`endDate`): it shows on each of them, listed before that day's other dates, and stays upcoming ("until Fri 17 Oct") while it runs. A month cell shows one title, the multi-day event first, and the rest when the day is opened.
- **Semesters** (`semesters.ts`): only the learner's own, stored as `SemesterRecord`s with optional dates and `courseIds` (the University subjects they chose); no semester is preset, and a new learner starts with none. A term that only classes or dates name (saved before semesters were listed) still appears. Newest added first; the calendar and the catalog open on the semester whose dates contain today, else the newest. A semester's subjects are the courses its timetable classes link to (not stored) plus the `courseIds` picked on the Courses page. Any semester can be removed, with its classes and dates.

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
- **Practice by subject**: the Practice page lists subjects first (`features/practice/subjectPractice.ts` counts what each has waiting); every session URL carries `course`, and `planSession` then limits reviews, mistakes, saved questions and weak spots to it.
- **Activity**: active minutes (visible tab, recent interaction), answers and completions per day; streaks and a daily goal (minutes or questions, whichever is met first). The streak page (`/streak`, from Today's "This week") shows the current and longest streak, whether today counts yet, and the last twelve weeks as bubbles (`activityWeeks`: no study, some study, goal met).
- **Study plans** (`studyPlan.ts`): each subject has a study plan in the learner's settings (`studyPlans`, by course id), chosen on the course page, on its Practice page or in Settings. "Use the material" (the default, not stored) only records attempts and lesson progress; "Practise weak topics" also updates topic mastery; "Practise and review" also schedules spaced reviews. `recordAnswer` applies the plan, so a subject used as material creates no reviews or mastery. Today's due reviews and weakest topics, the rail's due count, the Practice hub (which lists only planned subjects) and review sessions cover only subjects whose plan includes them. Resume and "Your courses" still show every started subject. Settings saved with the former `todayCourseIds` read as "Practise and review" for those subjects (`normalizeSettings`).
- **Today's classes**: the classes of the semester in effect today and the dates falling today, from the calendar, each with a link to the course it is linked to. A class or date can be linked to any course (a Japanese class to a JLPT course), when it is added or later.

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
