# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

One learner, the owner, using Study Hub as a personal study platform for IT fundamentals, AI engineering, professional certifications, Japanese (JLPT N5 to N1) and Chinese (HSK 1 to 6). Most study happens in long sessions on a laptop or desktop with a keyboard: reading lessons, typing answers, writing notes and code. The phone is for quick reviews. Sessions often run late at night.

## Product Purpose

Turn the learner's own study materials and a verified IT / AI-engineering curriculum into active practice: read a lesson, answer by typing, get meaningful feedback, plan around the semester timetable and exam dates, practise code in a sandbox, and have weak points return through spaced repetition. Success means the learner always knows what they know, what they don't, and what to do next.

## Positioning

Built on the learner's own books (HSK Standard Course 1–6, 新にほんご500問, the official-format JLPT sample tests), imported page by page and always linked back to the original page. Answer checking understands pinyin tones, kana/romaji and real code execution. Everything stays private to the learner.

## Operating Context

- Source materials are scanned PDFs, imported by an OCR pipeline; the original page image is always one click away from extracted content.
- Study rituals: daily goal and streak, due reviews, "practise my weaknesses", timed JLPT-format mock exams with listening audio.
- Input: Chinese/Japanese IMEs for characters, tone marks or tone numbers for pinyin, kana or romaji for Japanese readings, a code editor for programming.
- Data is local-first (browser storage) with optional Supabase sign-in and sync.

## Capabilities and Constraints

- Question types: multiple choice, short typed answers, cloze, long answers with rubric self-review, translation, code (Python, JavaScript, TypeScript in a browser sandbox; SQL on SQLite). C and Bash are editor-only until a sandbox exists.
- Provenance is always visible: material extracted from the learner's books vs content written for Study Hub vs third-party resources.
- No LLM grading yet; open answers use rubric checks plus self-review.
- Extracted book content is for personal use only and is never published.
- Terminology: HSK levels 1–6 (HSK 2.0, Standard Course), JLPT N5–N1 with 文字・語彙 / 文法 / 読解 / 聴解 sections.

## Brand Commitments

Name: Study Hub. No logo or other brand assets exist.

## Evidence on Hand

- Imported courses: HSK 1, HSK 2, JLPT N5 and N4 sample tests, 新にほんご500問 N4–N5 (`content/generated`), with page images and listening audio in `public/materials`.
- It is a personal tool: there are no customers, testimonials or metrics, and none may be invented.

## Product Principles

1. Active over passive: every lesson leads to typed answers, code or a decision, not only reading.
2. Faithful to the source: extracted content is traceable to its page, and uncertainty is shown, never hidden.
3. One obvious next step: resume, review what is due, or practise a weakness.
4. Calm for long sessions: low cognitive load, low glare, keyboard-first.
5. Honest feedback: say what was checked and how; never claim a check that did not run.

## Accessibility & Inclusion

- A genuinely low-glare dark theme for late-night study (explicit request).
- Keyboard-first operation on desktop; touch-friendly for quick reviews on a phone.
- Chinese and Japanese text renders with language-appropriate fonts (Han glyph forms differ) at comfortable sizes.
- WCAG AA contrast, visible focus, and reduced-motion support.
