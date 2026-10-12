# Status

Last updated 2026-10-12.

## Verified

| Check | Result |
|---|---|
| `npm run typecheck` | passes (app, workers, node scripts, tests) |
| `npm run lint` | no problems |
| `npm test` | 100 tests in 14 files pass, including the RLS policy tests on PGlite |
| `npm run content:build` | 20 courses, 25,134 lesson questions, 33 certifications, 1 roadmap |
| `npm run content:verify` | 34 exercises (Python and SQL): every reference solution passes. The 13 Java exercises (CMPD363) are skipped; their solutions were compiled and run with JDK 25 by hand |
| `npm run test:e2e` | 26 tests pass in Chrome, including real Python (Pyodide), JavaScript and SQL runs |
| `npm run build` | production build succeeds |

## Done

- **Lessons and practice**: lesson pages; typed answers of seven kinds with specific feedback, hints, retry, reveal and model answers; provenance on every item ("Your book · p.12", "Study Hub").
- **Learning model**: FSRS reviews, mastery per topic and skill, due reviews, weaknesses, recent mistakes, saved questions, mixed quizzes; JLPT N5–N1 mock exams with booklet, answer sheet, audio, section timers and raw-score results. An unfinished sitting is kept in the browser and can be resumed after a reload.
- **JLPT**: official-format sample tests N5–N1 (N2 and N1 with their combined language-knowledge & reading section). N1 listening plays each question's own part of the section recordings; in N2 only 問題5 does, and 問題1–4 play the whole section (see below); 新にほんご500問 N4–N5, N3, N2 and N1, all 2,000 questions, every answer either confirmed on the answer page by the importer or checked by eye against the page (55 unreadable answers filled in, 87 unconfirmed ones checked, one OCR misread corrected).
- **HSK**: HSK 1–6 (4,865 words in 146 lessons; every left-out row and every reading that disagrees with CC-CEDICT checked against the page images and corrected or confirmed; two misprints in the HSK 5 book corrected to the standard reading, with a note; phase 2 OCR of 2,842 pages complete).
- **Other content**: Python fundamentals (stage 1 of the AI roadmap), Databases & SQL (4 lessons), 33 certifications checked on 2026-10-11.
- **University**: a University area with a semester selector (current: Sem 1 2026). CMPD2123 Machine Learning and Data Analytics (UNITEN): 6 lessons and 64 questions written from the Chapter 1–3 lecture slides, including 5 Python exercises verified by `content:verify`. CMPD333 Cyber Security Essentials: 12 lessons and 169 questions written from the Topic 1–7 slides (the updated Encryption part 1–3 decks rather than the older combined one), including 10 Python exercises (classical ciphers, XOR, salted hashing, HMAC, LSB steganography, a packet filter, ACLs, backup restore sets) and one SQL-injection query, all verified by `content:verify` (see [CONTENT_PIPELINE.md](CONTENT_PIPELINE.md#university-subjects)). CMPD363 Object-Oriented Programming: 5 lessons and 54 questions covering what the Semester 1 and 2 2025/2026 midterms test (OOP and UML, identifiers and expressions, String/Date/Scanner, defining classes, selection and enums), both midterms as timed mock exams with worked answers, and a lesson showing the original papers.
- **Calendar** (optional; replaced the notebook): weekly timetable per semester with teaching-week numbers and clash warnings, and important dates (quiz, test, midterm, final, assignment) in week, month and list views; the next 21 days show on Today. Notes from the old notebook stay in the browser until downloaded or deleted in Settings.
- **Playground, certifications, settings, backups** (backup format version 2 adds the calendar; version 1 files still import), light and dark themes, keyboard use, mobile layout.
- **Storage**: local (IndexedDB) by default; Supabase schema, row level security, repository and sign-in ready (see [SUPABASE.md](SUPABASE.md)).
- **Hosting** (see [DEPLOY.md](DEPLOY.md)): Netlify config and a deploy from this computer (`npm run deploy`, guarded by `npm run check:deploy`). Sign-in with Google, Discord and GitHub (email optional) on a `/sign-in` page; guests can open the University courses, with progress kept only for the visit; signed-in users' progress is saved; a members list in the database (an access-token hook adds `study_hub_member`) unlocks the other courses, and a Netlify edge function refuses their course files, page images, audio and search index to anyone else. Profiles keep each user's name, picture, email and providers.

## Not done yet

- **N2 listening**: the recordings of 問題1–4 could not be cut per question reliably. 問題4's recording has 12 answer pauses for the 11 questions in the key and script, and in 問題1–3 the cut lengths do not match the script lengths. Someone listening once to find each question's start time would fix this; times can then be added like a correction.
- **Content, phase 3**: workbook exercises for HSK 1 (435), HSK 2 (585) and HSK 3 (740) are imported, graded with the teacher's book keys. Key ranges that OCR read incompletely were read from the page and recorded in `content/corrections/hsk-workbook.json`. The HSK 4–6 workbooks and teacher's books are still being OCR'd and are imported as they finish.
- **Review flags**: rows imported with low OCR confidence (their readings agree with CC-CEDICT) and 500問 questions whose option text was only partly read (they are answered on the page image) still show a review marker.
- **CMPD2123**: chapters after Chapter 3 are not written yet. The slide PDFs are not stored in the project, so lessons cannot show the original slides. pandas and Scikit-learn code is taught through explanation and prediction questions; runnable exercises use plain Python and NumPy, because the local verifier has no pandas or Scikit-learn.
- **CMPD333**: where a slide figure is wrong (the brute-force count, the steganography image sizes, the AES key size, the TLS 1.3 date), the notes give the correct value and mention the slide's figure. The slides' videos and online tools are linked from the slides only and are not reproduced.
- **CMPD363**: no lecture slides are in the project, so the notes follow the midterm papers rather than the course's own chapters, and cover only the first half of the course. Java exercises are self-marked against the model answer. Four printed MCQs are flawed (two have two invalid options, one does not compile as printed, one prints without a space); the explanations say so and accept every defensible answer.
- **AI engineering roadmap**: only stage 1 (Python) has a course. Stages 2–14 are outlined with their certifications and shown as "in preparation".
- **IT courses** referenced by certifications (networking, security, operating systems, cloud) are planned, not written.
- **Code**: C, Java and Bash are editor-only (Java answers in CMPD363 are compared with a model answer, not compiled). Running them safely would need a WebAssembly toolchain or a remote sandbox.
- **AI feedback**: open answers use rubric self-review only, as decided. An LLM grader would need a server-side function holding the API key.
- **Supabase and Netlify**: implemented and tested locally (row level security and the members hook on PGlite; token checks and the gate in unit tests; the edge function under `netlify dev`), but not yet run against a live Supabase project or Netlify site, and the OAuth sign-in round trip has not been tried with real providers. There is no offline sync between local and cloud data: moving data uses backups.
- **Mock exams**: an unfinished sitting is kept only in the browser it was started in (not synced). Scores are raw; the JLPT reports scaled scores.

## External services

| Service | Used for | When | Cost |
|---|---|---|---|
| cdn.jsdelivr.net | Pyodide (Python runtime, about 10 MB) and its packages | first Python run in a browser | free |
| Supabase | sign-in and cloud storage | only if configured | the Free plan is enough for one learner (check current limits at supabase.com/pricing); paid plans are optional |
| Netlify | serving the app and checking members-only files (edge function) | only if you deploy it | a free plan exists; check current limits at netlify.com/pricing (the site is about 420 MB, and every request passes the edge function) |
| Google, Discord, GitHub | sign-in (OAuth apps you create) | only if enabled | free |

The only key in the app is Supabase's publishable key, which is meant to be public; there are no paid AI services. The HSK/JLPT content comes from copyrighted books: on the hosted site it is served only to members, so keep the members list to the people you study with.
