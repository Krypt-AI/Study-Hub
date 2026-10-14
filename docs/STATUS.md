# Status

Last updated 2026-10-14.

## Verified

| Check | Result |
|---|---|
| `npm run typecheck` | passes (app, workers, node scripts, tests) |
| `npm run lint` | no problems |
| `npm test` | 132 tests in 19 files pass, including the RLS and table-privilege tests on PGlite (for projects created before and after Supabase's 30 May 2026 change) |
| `npm run content:build` | 23 courses, 25,471 lesson questions, 33 certifications, 1 roadmap |
| `npm run content:verify` | 49 exercises (Python and SQL): every reference solution passes. 20 have no runnable solution (Java, which is self-marked; the Java in CMPD363 was compiled and run with JDK 25 by hand) |
| `npm run test:e2e` | 29 tests pass in Chrome: 27 in local mode, including real Python (Pyodide), JavaScript and SQL runs, and 2 against a stubbed Supabase (a guest is asked to sign in for a locked course; a signed-in learner opens it and sees the account in Settings) |
| `npm run build` | production build succeeds |

## Done

- **Lessons and practice**: lesson pages; typed answers of seven kinds with specific feedback, hints, retry, reveal and model answers; provenance on every item ("Your book · p.12", "Study Hub").
- **Learning model**: FSRS reviews, mastery per topic and skill, due reviews, weaknesses, recent mistakes, saved questions, mixed quizzes; JLPT N5–N1 mock exams with booklet, answer sheet, audio, section timers and raw-score results. An unfinished sitting is kept in the browser and can be resumed after a reload.
- **JLPT**: official-format sample tests N5–N1 (N2 and N1 with their combined language-knowledge & reading section). N1 listening plays each question's own part of the section recordings; in N2 only 問題5 does, and 問題1–4 play the whole section (see below); 新にほんご500問 N4–N5, N3, N2 and N1, all 2,000 questions, every answer either confirmed on the answer page by the importer or checked by eye against the page (55 unreadable answers filled in, 87 unconfirmed ones checked, one OCR misread corrected).
- **HSK**: HSK 1–6 (4,865 words in 146 lessons; every left-out row and every reading that disagrees with CC-CEDICT checked against the page images and corrected or confirmed; two misprints in the HSK 5 book corrected to the standard reading, with a note; phase 2 OCR of 2,842 pages complete).
- **Other content**: Python fundamentals (stage 1 of the AI roadmap), Databases & SQL (4 lessons), 33 certifications checked on 2026-10-11.
- **University** (Sem 1 2026, UNITEN; private courses, written from your materials):

  | Course | Lessons | Questions | Written from |
  |---|---|---|---|
  | CMPD103 Statistics for Computer Science | 8 | 96 | Chapter 1–6 notes and slides, and your Chapter 1–2 summary |
  | CMPD203 Web Programming | 5 | 76 | Chapter 1–4 notes |
  | CMPD2123 Machine Learning and Data Analytics | 6 | 64 | Chapter 1–3 slides, including 5 Python exercises |
  | CMPD2143 Human Computer Interaction | 7 | 81 | Chapter 1–3 slides |
  | CMPD333 Cyber Security Essentials | 12 | 169 | Topic 1–7 slides (the updated Encryption part 1–3 decks), including 10 Python exercises and one SQL-injection query |
  | CMPD363 Object-Oriented Programming | 12 | 138 | the 2025/2026 midterms and the Chapter 1–8 slides; both midterms as timed mock exams with worked answers |

  Every exercise with a runnable solution passes `content:verify`. Each course's `contentNotice` lists the slide errors its notes correct. Rendered but not yet used by a course: the CMPD2123 past paper (the CMPD383 2023/24 Semester 1 paper) and SDG 13 assignment, and the CMPD333 group assignment 2 (see "Waiting for a decision").
- **Calendar** (optional; replaced the notebook): weekly timetable per semester with teaching-week numbers and clash warnings, and important dates (quiz, test, midterm, final, assignment) in week, month and list views; the next 21 days show on Today. Notes from the old notebook stay in the browser until downloaded or deleted in Settings.
- **Playground, certifications, settings, backups** (backup format version 2 adds the calendar; version 1 files still import), light and dark themes, keyboard use, mobile layout.
- **Storage**: local (IndexedDB) by default; Supabase schema, row level security, repository and sign-in ready (see [SUPABASE.md](SUPABASE.md)).
- **Hosting** (see [DEPLOY.md](DEPLOY.md)): Netlify config and a deploy from this computer (`npm run deploy`, guarded by `npm run check:deploy`). Sign-in with Google on a `/sign-in` page (Discord, GitHub or email can be switched on with `VITE_AUTH_PROVIDERS`); guests can open the University courses, with progress kept only for the visit; signing in (any account) opens every course and saves progress, and a Netlify edge function refuses the other courses' files, page images, audio and search index to anyone not signed in. Profiles keep each user's name, picture, email and providers.

## Not done yet

- **N2 listening**: the recordings of 問題1–4 could not be cut per question reliably. 問題4's recording has 12 answer pauses for the 11 questions in the key and script, and in 問題1–3 the cut lengths do not match the script lengths. Someone listening once to find each question's start time would fix this; times can then be added like a correction.
- **Content, phase 3**: workbook exercises for HSK 1 (435), HSK 2 (585) and HSK 3 (740) are imported, graded with the teacher's book keys. Key ranges that OCR read incompletely were read from the page and recorded in `content/corrections/hsk-workbook.json`. The HSK 4–6 workbooks and teacher's books are still being OCR'd and are imported as they finish.
- **Review flags**: rows imported with low OCR confidence (their readings agree with CC-CEDICT) and 500問 questions whose option text was only partly read (they are answered on the page image) still show a review marker.
- **CMPD2123**: chapters after Chapter 3 are not written yet. The slide PDFs are not stored in the project, so lessons cannot show the original slides. pandas and Scikit-learn code is taught through explanation and prediction questions; runnable exercises use plain Python and NumPy, because the local verifier has no pandas or Scikit-learn.
- **CMPD333**: where a slide figure is wrong (the brute-force count, the steganography image sizes, the AES key size, the TLS 1.3 date), the notes give the correct value and mention the slide's figure. The slides' videos and online tools are linked from the slides only and are not reproduced.
- **CMPD363**: lessons 1–5 follow the midterm papers and were checked against the Chapter 1 to Chapter 3 (Part 1) slides on 2026-10-14; what the slides teach beyond the midterms was added (program structure, numeric types, casting, constants, Math and Random, string edge cases, arguments and parameters, visibility, overloading, packages, switch and enums). Three slide errors are corrected in the notes: the Bicycle constructor written with `void`, the Die class's `Dice` constructor, and enum case labels that need Java 21. Java exercises are self-marked against the model answer. Four printed MCQs are flawed (two have two invalid options, one does not compile as printed, one prints without a space); the explanations say so and accept every defensible answer.
- **AI engineering roadmap**: only stage 1 (Python) has a course. Stages 2–14 are outlined with their certifications and shown as "in preparation".
- **IT courses** referenced by certifications (networking, security, operating systems, cloud) are planned, not written.
- **Code**: C, Java and Bash are editor-only (Java answers in CMPD363 are compared with a model answer, not compiled). Running them safely would need a WebAssembly toolchain or a remote sandbox.
- **AI feedback**: open answers use rubric self-review only, as decided. An LLM grader would need a server-side function holding the API key.
- **Supabase and Netlify**: live at https://studyhubal.netlify.app with Supabase project `hopykmefbqrrtpasgfke` (created 2026-10-12). Checked on 2026-10-14: Google sign-in works on the dev server and the live site (both reach Google's account page with no error), two accounts have signed in with Google, their profiles were created, and answers, activity and calendar dates were saved under row level security; the content gate refuses locked files to guests; signed-out requests get no table access. The migration `20261014000000_explicit_grants.sql` is written and tested but **not yet applied** to the live project (`npx supabase db push --linked`): the live project works without it, because its tables got Supabase's old default privileges, but it removes `TRUNCATE`, `REFERENCES` and `TRIGGER` from signed-in users and makes a fresh project work. There is no offline sync between local and cloud data: moving data uses backups.
- **Mock exams**: an unfinished sitting is kept only in the browser it was started in (not synced). Scores are raw; the JLPT reports scaled scores.

## Waiting for a decision

- **CMPD103**: the past papers (Final exams TRI 2 2017/18, TRI 2 2018/19, June 2020, APR22; tests 1 and 2) and the assignment are Word files, not yet converted: mock exams or reference only?
- **CMPD203**: Chapter 5–6 notes not yet written; exercise sheets (Chapter 1–4, Chapter 3 E1/E2): practice questions or documents?
- **CMPD2123**: does the CMPD383 2023/24 paper belong to CMPD2123, and should it become a mock exam?
- **CMPD333**: group assignment 2: reference or graded practice brief?
- **JLPT**: Shin Kanzen Master N1–N4 and JLPT Workbooks 1–5 as typed-question courses, with audio for listening questions (Phase 4 plan first).

## External services

| Service | Used for | When | Cost |
|---|---|---|---|
| cdn.jsdelivr.net | Pyodide (Python runtime, about 10 MB) and its packages | first Python run in a browser | free |
| Supabase | sign-in and cloud storage | only if configured | the Free plan is enough for one learner (check current limits at supabase.com/pricing); paid plans are optional |
| Netlify | serving the app and checking the locked courses' files (edge function) | only if you deploy it | a free plan exists; check current limits at netlify.com/pricing (the site is about 420 MB, and every request passes the edge function) |
| Google | sign-in (an OAuth client you create) | only if Supabase is configured | free |

The only key in the app is Supabase's publishable key, which is meant to be public; there are no paid AI services. The HSK/JLPT content comes from copyrighted books: on the hosted site it is served only to signed-in users, and anyone with the link can sign in, so share the link only with the people you study with.
