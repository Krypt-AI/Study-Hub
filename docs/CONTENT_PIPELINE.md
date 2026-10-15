# Content pipeline

Two kinds of content feed the app:

- **Authored** content in `content/authored/` (written for Study Hub, safe to commit).
- **Generated** courses in `content/generated/`, built from your own HSK and JLPT PDFs. These are copyrighted books for personal study: the folder, the page images and the audio clips are git-ignored and must not be published.

`npm run content:build` combines both, validates everything and writes `public/content/`.

## From your books to courses

### 1. OCR and assets (Python)

```bash
cd tools/content-pipeline
python -m venv .venv
.venv\Scripts\activate            # macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
set STUDY_MATERIALS_DIR=C:\path\to\your\materials   # where the PDFs are (see pipeline/sources.py)
python -X utf8 -m pipeline phase 1
```

`phase N` runs every stage for the sources of import phase N (1: HSK 1–2 and JLPT N5–N4; 2: HSK 3–6, 新にほんご500問 N3–N1 and JLPT N3–N1; 3: workbooks and teacher's books). Individual stages:

| Command | Output |
|---|---|
| `sources` | list registered PDFs and cache status |
| `ocr [--phase N] [--source ID] [--threads N]` | `cache/ocr/<source>/pNNNN.json`: lines, boxes (relative) and confidence. Resumable. Pages with a usable text layer skip OCR. |
| `manifest` | `cache/sources.json` for the importers |
| `pages` | `public/materials/pages/<source>/pNNNN.webp` for "view the original page" |
| `audio [--level N5]` | `public/materials/audio/<level>/NN.mp3` plus a manifest mapping clips to questions (N2 and N1 come as one recording per 問題 section: these are mapped to the section, and their pauses are measured so the importer can find each question in them) |

OCR uses RapidOCR (PP-OCRv6) on OpenVINO, on the CPU. Use `-X utf8` on Windows.

### 2. Import (TypeScript)

```bash
npm run content:import
```

Reads the OCR cache and writes `content/generated/courses/*.json` and `content/generated/import-report.md`. The report lists, per book, how many items were imported, left out (unreadable) or flagged for review, with the source id and page of each so it can be checked and corrected.

- **HSK**: lessons are found in the textbook; vocabulary comes from the index. Levels 4–6 come in two volumes: volume B continues A's lesson numbers. Paired constructions printed on two lines (不但……而且……) become one entry, and words printed with two readings (zhǔyi / zhúyi) accept either. Every reading is cross-checked against CC-CEDICT (a check only, never a replacement). Each word yields four questions: recognise the meaning, recall the meaning, type the pinyin, type the characters.
- **HSK workbooks**: the exercises are in the workbook, their answer key and listening scripts in the teacher's book (练习册听力文本及参考答案). Each lesson's listening and reading exercises become a *Workbook exercises* lesson that shows the workbook page and grades against the key; the model test at the back of the workbook becomes its own lesson. There are no HSK recordings in the materials, so listening exercises show their script. Pronunciation and character writing are left out. A key range is used only when it has exactly one answer per question; the others are listed in the report and read from the page into `content/corrections/hsk-workbook.json` (`answers` per question, `"F/G"` when the key accepts either).
- **JLPT sample tests**: answer keys and listening scripts are parsed. N5–N3 have three timed parts (vocabulary, grammar & reading, listening); N2 and N1 have two (language knowledge & reading, listening), and a listening item with two sub-questions (質問1, 質問2) is marked as two answers. Single questions keep a crop of the booklet page; reading and passage-cloze (文章) questions show their whole pages. Blank pattern pages are left out. The mock exam shows the booklet and an answer sheet, with the audio per question. For whole-section recordings (N2, N1) each question plays only its span: its end is the fixed-length answer pause that follows every question, and the cut is used only if the segment lengths also agree with the script lengths (correlation ≥ 0.5); otherwise the question plays the whole section and says so.
- **新にほんご500問** (N4–N5, N3, N2, N1): questions, options and answers are read from the page layout. Question numbers follow the book's fixed structure and are re-anchored on the printed numbers, so a missed day tab cannot shift them. Where the answer was confirmed on the answer page and the options are clean, a typed variant is added. Flagged items are shown with their page image only, and unreadable answers are left out.

### 3. Corrections

OCR errors found by checking the page images go into `content/corrections/*.json` (`set` replaces a field, `verified` marks an item as checked). Corrections are applied on every import, so they survive re-running OCR. Every corrected or verified item is labelled in the app.

## University subjects

The catalog's **UNITEN** area (category `university`) lists your subjects one semester at a time. A learner adds their own semester and chooses its subjects from all the University courses; no semester is preset from the catalog. `content/authored/university.yaml` still records the institution and the terms a course's `term` may name:

```yaml
institution: Universiti Tenaga Nasional (UNITEN)
terms: [Sem 1 2026]        # newest first
currentTerm: Sem 1 2026    # not shown to learners
```

Each subject is a course with `category: university`, its course `code` and the `term` it belongs to (the build fails if the term is not listed). Learners add their semesters in the app (Calendar or the catalog's University area) and pick which subjects belong to each there, so a new semester needs no change here.

Notes written from your own course materials (lecture slides, lab sheets) go in **`content/private/courses/<id>/`**. They use the same format as authored courses (below), are git-ignored, and must not be published. A course-level `source` (e.g. `{ origin: user-material, title: CMPD2123 lecture slides }`) is inherited by its lessons, and a lesson-level `source` by that lesson's questions, so every item shows where it came from.

**Documents** (past papers, lecture notes) go in `content/private/courses/<id>/documents/*.pdf`, for a private course of any category. Name a past paper after its title: `midterm-sem1-2526.pdf`, `test1-sem1-2526.pdf`, `final-sem2-1718.pdf`. Word files are converted to PDF first (Word: Save As PDF, or Word through COM on Windows). `python -m pipeline course-pages` renders them to `public/materials/pages/<id>-<file name>/` (e.g. `cmpd363-midterm-sem1-2526`). Page images are served to everyone only when an open (University) course uses them; otherwise the content gate locks them like the rest of that course. A course uses them in two ways:

- as a past paper under `assessments:` in `course.yaml`, with `paper: midterm`, `test` or `final` (as the paper's title says) and the assessment's `source` naming the paper; its questions inherit that source. The course page lists past papers under **Past papers**, grouped into midterms, tests and final exams; assessments without `paper` are practice sets, listed under "Mock exams and quizzes". Transcribe every question so it can be answered; when the paper has no answer key, say in the description that the answers are worked by Study Hub, and where a question is ambiguous, accept each defensible answer and explain why. Figures are cropped in with `media: [{ kind: page-image, sourceId, page, crop }]`. When two papers repeat the same questions, anchor each once (`- &a01`) and reuse it with a new id (`- { <<: *a01, id: ... }`); YAML merge keys are enabled.
- as original pages after a lesson's text, with `sourcePages` in the lesson frontmatter (one `{ sourceId, pages, caption }` or a list of them).

## Authoring a course

```
content/authored/courses/<course-id>/
  course.yaml                 title, category (chinese, japanese, ai-engineering, it, university, elementary, secondary), code and term (university), subject, year and language (school), topics, units (lists of lesson file names)
  lessons/01-name.md          frontmatter (id, title, objectives, topics, resources) + Markdown body
  lessons/01-name.questions.yaml
  fixtures/*.sql              optional shared SQL databases (`schemaFile: name.sql` in a question)
```

Question types: `choice`, `short`, `cloze`, `long` (rubric), `translation`, `code` (tests: `assert` or `stdout`), `sql` (reference query). The schema is `src/domain/content/schema.ts`; the build reports any field that does not match it. After writing exercises, run `npm run content:verify` to prove every reference solution passes.

A question that points at something in its lesson ("In Example 2...") can carry `reference: { heading: "Example 2", label: "See Example 2" }`. The build copies that lesson section into the question, and the learner opens it with the button under the prompt. `image` (an asset) can be given instead of or as well as `heading`; a heading that is not in the lesson fails the build.

**School courses** (`category: elementary` for Standard 1–6, `secondary` for Form 1–5) name a `year` listed in `content/authored/school.yaml` and the `language` they are taught in (`ms` or `en`); a subject taught in both is two courses with the same `subject` and `year`. Every question in a school course is in its language: the build fills `language` in where a question leaves it out and fails where a question says otherwise, as it does for a missing or unlisted year. A multiple-choice question can have a `tier` (easy, medium or hard) for the learner's difficulty choice; without one it is offered at every tier.

**Marked exam papers** (school UASA papers, or any paper with printed marks) are assessments with `paper: uasa` (or `midterm`, `test`, `final`). A school subject may have past papers and no lessons yet (`units: []`). On a paper:

- `marks` on a question is what it carries ("[2 markah]"); the score is out of the paper's total.
- `labels: letters` prints a multiple-choice question's options A, B, C, D instead of 1, 2, 3, 4.
- `distinct: true` on a fill-in question stops one answer counting twice when several gaps share their accepted answers ("name two of the three spelling errors").
- A written answer (`long`) can have a `marking` scheme instead of a keyword `rubric`: parts (content, language, ...) each with the bands the scheme prints (`name`, `min`, `max`, `description`); the parts' highest marks add up to the question's `marks`. The learner reads the scheme's points (`modelAnswer`) and gives one mark per part. `minWords` and `maxWords` show as a live word count.
- `choose: 1` on a section means "answer one of these questions": the first one answered counts.

Schemes shared by several questions can be written once as YAML anchors under a key the schema does not know (such as `x-schemes:`), which the build ignores. `content/private/courses/bm-f1/course.yaml` is the worked example.

Certifications are in `content/authored/certifications.yaml`: every entry records `verifiedOn`, its official `verificationSources` and the facts that could not be verified. Re-check them before relying on prices or exam formats.
