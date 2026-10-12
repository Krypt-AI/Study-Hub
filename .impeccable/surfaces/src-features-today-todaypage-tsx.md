---
version: 1
slug: "src-features-today-todaypage-tsx"
primary_target: "src/features/today/TodayPage.tsx"
related_targets: ["src/app/AppShell.tsx"]
---

Scope: the Study Hub app shell and its Today screen (the first viewport). Every other screen (courses, lesson player, practice, notebook, playground, certifications) inherits this world.
Mode: Operate.
Audience and job: one learner in long, often late-night laptop sessions; resume study, clear due reviews, practise weak topics, write notes and code.
Constraints: dark (low-glare) theme first with a light day theme; keyboard-first; neither busy and cramped nor sparse and airy; never a corporate SaaS card grid; standard web controls (the world lends only type, palette, density and one signature move).
Unresolved: none.

## Direction contract

THESIS: Every study session is a sitting: the material on one side, your answer sheet on the other, progress recorded as filled answer bubbles and marked like a graded paper. It refuses the category default of rounded course cards with progress rings.

OWN-WORLD: Graphite night ground (#16181c) with sheet panels (#1f2227) ruled in hairlines. The sheet's printed structure (column rules, row numbers, bubble outlines, section bands) is in dropout-ink salmon (#e07a68); the learner's marks are paper-white pencil fill (#ece6db); grading ink is a green check (#5fae7d), red cross (#e5534b) and amber slip (#d9a441). The day theme is near-white paper (#fbfaf8) with salmon ink (#c9563f) and graphite marks (#26282d). Public Sans for text, Barlow Semi Condensed for headings and numerals, tabular figures wherever data lives.

STORY: The learner opens Study Hub and reads today's sheet: what is due, where they stopped, how much of the goal is filled. They resume, answer by typing, watch each answer fill its bubble and get marked, keep notes beside the sheet, and leave with the sheet scored.

FIRST VIEWPORT: Left rail (Today, Courses, Practice, Notebook, Playground, Certifications; search at the top, settings at the bottom). Main column: the date heading with the daily goal as a row of minute bubbles filling in, then the primary action "Resume" for the last lesson with its answer strip (one bubble per question, marked). Right column: "Due today" as numbered answer-sheet rows by course with bubble counts and an overdue mark; below it, the weakest topics with four-state mastery bubbles and the week's activity as a bubble grid.

FORM: Answer Sheet (mark sheet plus test booklet), my top-ranked grounded candidate (#1 of 7), chosen by the user as the pick card; seed key 8b5d6015. Signature move: the answer strip. Every answer fills a bubble with a short pencil fill, then a check or cross mark appears; motion grammar is fill-then-mark with exponential ease-out, instant under reduced motion.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
