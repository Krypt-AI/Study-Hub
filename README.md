# Study Hub

A personal learning platform for university subjects, IT, AI engineering, professional certifications, JLPT Japanese and HSK Chinese. Lessons end in typed practice with specific feedback; answers drive spaced-repetition reviews and per-topic mastery; your calendar, code and progress stay private to you.

- **Courses**: HSK 1–2 and JLPT N5–N4 built from your own books (OCR, checked against the page images), Python fundamentals (AI engineering stage 1) and Databases & SQL.
- **Practice**: typed answers (pinyin with tone marks or numbers, kana/romaji, text, cloze, translation, explanations with a rubric), due reviews (FSRS), "practise my weaknesses", recent mistakes, saved questions, mixed quizzes, and timed JLPT mock exams with a booklet and an answer sheet.
- **Calendar** (optional): your weekly timetable for each semester and the dates of quizzes, tests, midterms, finals and deadlines, in week, month and list views; the next dates show on Today with a countdown.
- **Playground**: Python (Pyodide), JavaScript, TypeScript and SQL (SQLite) run in sandboxed Web Workers in the browser; C, Java and Bash are clearly labelled editor-only. Projects keep versions; you can write your own exercises with tests.
- **Certifications**: 33 AI, cloud, security, networking and Linux certifications checked against official sources, with your own plan (status, target and exam dates), and a 14-stage AI engineering roadmap.

## Quick start

Requirements: Node.js 22+ (developed on 24), and Python 3.12+ only if you rebuild content from your books.

```bash
npm install
npm run content:build   # validates course content and writes public/content
npm run dev             # http://localhost:5173
```

Without Supabase settings, everything is stored in this browser (IndexedDB). To sync across devices, see [docs/SUPABASE.md](docs/SUPABASE.md).

The HSK and JLPT courses come from your own PDFs and are **not** in the repository (they are personal-use only). To build them, follow [docs/CONTENT_PIPELINE.md](docs/CONTENT_PIPELINE.md); the other courses work without them.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Content build, type check, production build into `dist/` |
| `npm run preview` | Serve the production build |
| `npm run typecheck` / `npm run lint` | TypeScript (all projects) / ESLint |
| `npm test` | Unit tests and row-level-security tests (Vitest, PGlite) |
| `npm run test:e2e` | End-to-end tests in your installed Chrome (Playwright) |
| `npm run content:build` | Validate content and build `public/content` |
| `npm run content:import` | Rebuild HSK/JLPT courses from the OCR cache |
| `npm run content:verify` | Run every code and SQL exercise's reference solution |

## Project layout

```
src/
  app/           shell, routes, theme
  components/    UI primitives (the answer-sheet bubble, sheets, dialogs, editor, media)
  data/          learner records, the repository interface, IndexedDB and Supabase backends
  domain/        content schema and loading, answer evaluation, spaced repetition, mastery
  features/      today, courses, practice (sessions, exams), calendar, playground, certifications, settings
  workers/       sandboxed code runners (Python, JavaScript/TypeScript, SQL)
content/
  authored/      courses, certifications and roadmaps written for Study Hub (YAML + Markdown)
  corrections/   human-reviewed fixes for OCR output
  generated/     courses built from your books (git-ignored)
scripts/         content build, importers, exercise verification
supabase/        database migration and its row-level-security tests
tools/content-pipeline/   Python OCR and asset extraction
e2e/             Playwright tests
```

## Documentation

- [Architecture](docs/ARCHITECTURE.md): how the pieces fit, data model, evaluation, security
- [Content pipeline](docs/CONTENT_PIPELINE.md): turning your books into courses, and authoring content
- [Supabase](docs/SUPABASE.md): optional cloud storage and sign-in
- [Status](docs/STATUS.md): what is done, what is not, external services and costs
- [Design system](DESIGN.md): the "answer sheet" visual language
