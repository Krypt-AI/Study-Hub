/**
 * Content schema: the single source of truth for courses, lessons, questions,
 * assessments, certifications and roadmaps.
 *
 * `scripts/build-content.ts` validates every authored and generated content file
 * against these schemas and writes the parsed (defaults-filled) output to
 * `public/content`, so the app can load content without re-validating it.
 */
import { z } from 'zod';
import { CONTENT_SCHEMA_VERSION } from './version';

export { CONTENT_SCHEMA_VERSION };

/** Stable content identifier. User progress is keyed by these ids, so never rename them. */
export const contentId = z.string().regex(/^[a-z0-9][a-z0-9._-]*$/, 'ids must be lowercase letters, digits, ".", "_" or "-"');

const markdown = z.string();

// ---------------------------------------------------------------------------
// Provenance
// ---------------------------------------------------------------------------

/**
 * Where a piece of content came from. The UI shows this on every lesson and question
 * so material extracted from your own books is never confused with platform-authored
 * or third-party content.
 */
export const sourceRefSchema = z.object({
  /** user-material: extracted from your PDFs; authored: written for Study Hub; external: third-party resource. */
  origin: z.enum(['user-material', 'authored', 'external']),
  /** Content-pipeline source id, e.g. "hsk1-textbook". */
  sourceId: z.string().optional(),
  title: z.string().optional(),
  page: z.number().int().positive().optional(),
  url: z.url().optional(),
  /** OCR confidence (0..1) for extracted items. */
  confidence: z.number().min(0).max(1).optional(),
  /** Validation flags raised by the import pipeline, e.g. "low-ocr-confidence". */
  flags: z.array(z.string()).default([]),
});

export const mediaSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('page-image'),
    sourceId: z.string(),
    page: z.number().int().positive(),
    /** Relative crop box [x0, y0, x1, y1] within the page (0..1). */
    crop: z.tuple([z.number(), z.number(), z.number(), z.number()]).optional(),
    alt: z.string().optional(),
  }),
  z.object({
    kind: z.literal('audio'),
    src: z.string(),
    title: z.string().optional(),
    /** Play only this span of the file, in seconds (a question inside a whole-section recording). */
    start: z.number().nonnegative().optional(),
    end: z.number().positive().optional(),
  }),
  z.object({ kind: z.literal('image'), src: z.string(), alt: z.string() }),
]);

// ---------------------------------------------------------------------------
// Questions
// ---------------------------------------------------------------------------

/** Which kind of knowledge a question exercises. Mastery is tracked per topic and skill. */
export const skillSchema = z.enum(['recognize', 'recall', 'explain', 'apply']);
export const answerLanguageSchema = z.enum(['en', 'ms', 'zh', 'ja']);
/** The language a school course is taught in: Bahasa Malaysia or English. */
export const courseLanguageSchema = z.enum(['ms', 'en']);

/**
 * How a typed answer is compared with the accepted answers.
 *  - text:   case/punctuation-insensitive, tolerant of small typos (English answers)
 *  - meaning: like text, for the English meaning of a Chinese/Japanese word; also accepts
 *            the conversational form ("I'm sorry" for "to be sorry", "thanks" for "to thank")
 *  - pinyin: syllable-aware; tone marks and tone numbers are interchangeable
 *  - kana:   hiragana, katakana and (optionally) romaji are interchangeable
 *  - hanzi:  characters must match exactly (kanji/hanzi production)
 *  - number: numeric comparison with optional tolerance
 *  - exact:  verbatim after trimming
 */
export const matchModeSchema = z.enum(['text', 'meaning', 'pinyin', 'kana', 'hanzi', 'number', 'exact']);

export const matchOptionsSchema = z.object({
  mode: matchModeSchema.default('text'),
  caseSensitive: z.boolean().default(false),
  typoTolerance: z.enum(['none', 'low', 'medium']).default('low'),
  toneSensitive: z.boolean().default(true),
  acceptRomaji: z.boolean().default(true),
  tolerance: z.number().nonnegative().default(0),
});

const questionBase = {
  id: contentId,
  prompt: markdown,
  skill: skillSchema,
  topics: z.array(contentId).default([]),
  difficulty: z.number().int().min(1).max(5).optional(),
  hints: z.array(markdown).default([]),
  explanation: markdown.optional(),
  modelAnswer: markdown.optional(),
  media: z.array(mediaSchema).default([]),
  /** Shown with the explanation after answering, e.g. the book's own answer notes. */
  explanationMedia: z.array(mediaSchema).default([]),
  source: sourceRefSchema,
  /** Language of the expected answer: sets `lang` on the input for correct fonts and IME. */
  language: answerLanguageSchema.optional(),
  /** Short instruction shown under the input, e.g. "Pinyin with tone marks or numbers (ni3 hao3)". */
  answerHint: z.string().optional(),
  /**
   * What the question refers to ("the slides' example", "Table 2"), shown on request beside it: a heading
   * of the question's lesson, whose section the content build copies into `excerpt`, and/or a page image.
   */
  reference: z
    .object({
      heading: z.string().optional(),
      /** Button text; "See the example" by default. */
      label: z.string().optional(),
      excerpt: markdown.optional(),
      image: mediaSchema.optional(),
    })
    .refine((reference) => reference.heading || reference.image, 'A reference names a lesson heading or an image.')
    .optional(),
  /** Where the question sits on a printed answer sheet, e.g. group "文法 問題2", number "8". */
  sheet: z.object({ group: z.string(), number: z.string() }).optional(),
  tags: z.array(z.string()).default([]),
};

export const choiceQuestionSchema = z.object({
  ...questionBase,
  type: z.literal('choice'),
  options: z
    .array(z.object({ id: z.string(), text: markdown, explanation: markdown.optional() }))
    .min(2),
  correct: z.array(z.string()).min(1),
  multiple: z.boolean().default(false),
  shuffle: z.boolean().default(true),
  /** Offered when the learner picks this tier for the subject; without one, at every tier. */
  tier: z.enum(['easy', 'medium', 'hard']).optional(),
});

export const shortQuestionSchema = z.object({
  ...questionBase,
  type: z.literal('short'),
  accepted: z.array(z.string().min(1)).min(1),
  match: matchOptionsSchema.prefault({}),
});

export const clozeQuestionSchema = z.object({
  ...questionBase,
  type: z.literal('cloze'),
  /** Text with numbered gaps written as [[1]], [[2]], ... */
  text: markdown,
  blanks: z
    .array(
      z.object({
        id: z.string(),
        accepted: z.array(z.string().min(1)).min(1),
        match: matchOptionsSchema.prefault({}),
      }),
    )
    .min(1),
});

export const rubricCriterionSchema = z.object({
  id: z.string(),
  label: z.string(),
  /** Groups of synonyms: the criterion is detected when any phrase of every group appears. */
  keywords: z.array(z.array(z.string().min(1)).min(1)).default([]),
  weight: z.number().positive().default(1),
});

export const longQuestionSchema = z.object({
  ...questionBase,
  type: z.literal('long'),
  rubric: z.array(rubricCriterionSchema).min(1),
  minWords: z.number().int().positive().optional(),
  modelAnswer: markdown,
});

export const translationQuestionSchema = z.object({
  ...questionBase,
  type: z.literal('translation'),
  from: answerLanguageSchema,
  to: answerLanguageSchema,
  accepted: z.array(z.string().min(1)).min(1),
  /** Key phrases used to estimate partial credit when no accepted answer matches. */
  keywords: z.array(z.array(z.string().min(1)).min(1)).default([]),
  match: matchOptionsSchema.prefault({}),
});

export const codeLanguageSchema = z.enum(['python', 'javascript', 'typescript', 'sql', 'c', 'java', 'bash']);

export const codeTestSchema = z.discriminatedUnion('kind', [
  /** Language-native assertions executed after the learner's code, in the same scope. */
  z.object({ kind: z.literal('assert'), name: z.string(), code: z.string() }),
  /** Run the program with `stdin` and compare its trimmed output with `expected`. */
  z.object({ kind: z.literal('stdout'), name: z.string(), stdin: z.string().default(''), expected: z.string() }),
]);

export const codeQuestionSchema = z.object({
  ...questionBase,
  type: z.literal('code'),
  language: codeLanguageSchema,
  starterCode: z.string().default(''),
  tests: z.array(codeTestSchema).default([]),
  solution: z.string().optional(),
  timeoutMs: z.number().int().positive().default(8000),
  /** Pyodide packages to load before running (e.g. numpy, pandas, scikit-learn). */
  packages: z.array(z.string()).default([]),
});

export const sqlQuestionSchema = z.object({
  ...questionBase,
  type: z.literal('sql'),
  /** SQLite statements that create and seed the practice database. */
  schema: z.string(),
  solution: z.string(),
  orderMatters: z.boolean().default(false),
  starterCode: z.string().default(''),
});

export const questionSchema = z.discriminatedUnion('type', [
  choiceQuestionSchema,
  shortQuestionSchema,
  clozeQuestionSchema,
  longQuestionSchema,
  translationQuestionSchema,
  codeQuestionSchema,
  sqlQuestionSchema,
]);

// ---------------------------------------------------------------------------
// Lesson blocks
// ---------------------------------------------------------------------------

export const vocabItemSchema = z.object({
  id: contentId,
  term: z.string(),
  reading: z.string().optional(),
  partOfSpeech: z.string().optional(),
  meaning: z.string(),
  notes: z.string().optional(),
  source: sourceRefSchema.optional(),
});

const exampleSchema = z.object({
  text: z.string(),
  reading: z.string().optional(),
  translation: z.string().optional(),
});

export const blockSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('markdown'), body: markdown }),
  z.object({
    kind: z.literal('callout'),
    tone: z.enum(['info', 'tip', 'warning']).default('info'),
    title: z.string().optional(),
    body: markdown,
  }),
  z.object({
    kind: z.literal('vocab'),
    title: z.string().optional(),
    language: answerLanguageSchema,
    items: z.array(vocabItemSchema),
  }),
  z.object({
    kind: z.literal('dialogue'),
    title: z.string().optional(),
    language: answerLanguageSchema,
    lines: z.array(exampleSchema.extend({ speaker: z.string().optional() })),
    source: sourceRefSchema.optional(),
  }),
  z.object({
    kind: z.literal('grammar'),
    title: z.string(),
    language: answerLanguageSchema,
    body: markdown.default(''),
    examples: z.array(exampleSchema).default([]),
    source: sourceRefSchema.optional(),
  }),
  z.object({
    kind: z.literal('resources'),
    title: z.string().optional(),
    items: z.array(
      z.object({
        title: z.string(),
        url: z.url(),
        description: z.string().optional(),
        free: z.boolean().optional(),
        official: z.boolean().default(false),
      }),
    ),
  }),
  z.object({ kind: z.literal('code'), language: codeLanguageSchema, code: z.string(), caption: z.string().optional() }),
  z.object({
    kind: z.literal('source-pages'),
    sourceId: z.string(),
    pages: z.array(z.number().int().positive()).min(1),
    caption: z.string().optional(),
  }),
]);

// ---------------------------------------------------------------------------
// Courses
// ---------------------------------------------------------------------------

export const lessonSchema = z.object({
  id: contentId,
  title: z.string(),
  subtitle: z.string().optional(),
  summary: z.string().optional(),
  objectives: z.array(z.string()).default([]),
  estimatedMinutes: z.number().int().positive().optional(),
  topics: z.array(contentId).default([]),
  blocks: z.array(blockSchema).default([]),
  questions: z.array(questionSchema).default([]),
  source: sourceRefSchema,
});

export const unitSchema = z.object({
  id: contentId,
  title: z.string(),
  summary: z.string().optional(),
  lessons: z.array(lessonSchema),
});

export const assessmentSectionSchema = z.object({
  id: contentId,
  title: z.string(),
  instructions: markdown.optional(),
  timeLimitMinutes: z.number().positive().optional(),
  media: z.array(mediaSchema).default([]),
  questions: z.array(questionSchema).min(1),
});

/** The kind of a past paper, as its title names it. */
export const pastPaperKindSchema = z.enum(['midterm', 'test', 'final']);

export const assessmentSchema = z.object({
  id: contentId,
  title: z.string(),
  kind: z.enum(['quiz', 'mock-exam']),
  /** Set for a real past paper (not a practice set): the course lists it under Past papers, grouped by kind. */
  paper: pastPaperKindSchema.optional(),
  description: markdown.optional(),
  timeLimitMinutes: z.number().positive().optional(),
  /** Fraction of points needed to pass (0..1). */
  passMark: z.number().min(0).max(1).optional(),
  sections: z.array(assessmentSectionSchema).min(1),
  source: sourceRefSchema,
});

export const courseCategorySchema = z.enum(['chinese', 'japanese', 'ai-engineering', 'it', 'university', 'elementary', 'secondary']);
export const difficultySchema = z.enum(['beginner', 'intermediate', 'advanced']);

export const courseSchema = z.object({
  id: contentId,
  title: z.string(),
  subtitle: z.string().optional(),
  description: markdown,
  category: courseCategorySchema,
  /** Finer grouping inside a category, e.g. "networking" or "vocabulary". */
  subject: z.string().optional(),
  level: z.string().optional(),
  /** University subjects: the official course code, e.g. "CMPD2123". */
  code: z.string().optional(),
  /** University subjects: the semester it is taken in, one of the terms in content/authored/university.yaml. */
  term: z.string().optional(),
  /** School courses: Standard 1–6 (elementary) or Form 1–5 (secondary), one of the years in content/authored/school.yaml. */
  year: z.number().int().positive().optional(),
  /**
   * School courses: the language they are taught in. A subject taught in both is two courses with the
   * same subject and year; the learner picks one. Every question in the course is in this language.
   */
  language: courseLanguageSchema.optional(),
  difficulty: difficultySchema,
  tags: z.array(z.string()).default([]),
  prerequisites: z.array(contentId).default([]),
  certifications: z.array(contentId).default([]),
  estimatedHours: z.number().positive().optional(),
  topics: z.array(z.object({ id: contentId, title: z.string() })).default([]),
  units: z.array(unitSchema).min(1),
  assessments: z.array(assessmentSchema).default([]),
  source: sourceRefSchema,
  /** Shown at the top of the course, e.g. OCR accuracy notes for imported material. */
  contentNotice: markdown.optional(),
});

// ---------------------------------------------------------------------------
// Certifications and roadmaps
// ---------------------------------------------------------------------------

export const certificationSchema = z.object({
  id: contentId,
  name: z.string(),
  code: z.string().optional(),
  provider: z.string(),
  url: z.url(),
  category: z.enum(['ai-ml', 'cloud', 'data', 'networking', 'security', 'linux', 'software', 'it-fundamentals', 'japanese', 'chinese']),
  /** Proctored professional certification vs. course completion certificate vs. free badge. */
  credentialType: z.enum(['professional-certification', 'completion-certificate', 'badge']),
  level: z.enum(['foundational', 'associate', 'professional', 'specialty', 'expert']),
  status: z.enum(['active', 'beta', 'retiring', 'retired', 'announced']),
  statusNote: z.string().optional(),
  summary: z.string(),
  objectives: z.array(z.string()).default([]),
  prerequisites: z.string().optional(),
  exam: z
    .object({
      questions: z.coerce.string().optional(),
      durationMinutes: z.number().positive().optional(),
      passingScore: z.coerce.string().optional(),
      format: z.string().optional(),
      delivery: z.string().optional(),
      validity: z.string().optional(),
    })
    .optional(),
  cost: z.object({
    amount: z.number().nonnegative().optional(),
    currency: z.string().optional(),
    free: z.boolean().default(false),
    note: z.string().optional(),
  }),
  studyHours: z.object({ min: z.number().positive(), max: z.number().positive(), estimate: z.literal(true) }).optional(),
  resources: z
    .array(z.object({ title: z.string(), url: z.url(), free: z.boolean(), official: z.boolean() }))
    .default([]),
  relatedCourses: z.array(contentId).default([]),
  /** Date the facts above were last checked against the official sources (YYYY-MM-DD). */
  verifiedOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  verificationSources: z.array(z.url()).min(1),
  /** Facts that could not be verified from official sources. */
  unverified: z.array(z.string()).default([]),
});

export const roadmapSchema = z.object({
  id: contentId,
  title: z.string(),
  description: markdown,
  stages: z.array(
    z.object({
      id: contentId,
      title: z.string(),
      summary: z.string(),
      courseIds: z.array(contentId).default([]),
      certificationIds: z.array(contentId).default([]),
    }),
  ),
});

// ---------------------------------------------------------------------------
// Built catalog (output of scripts/build-content.ts)
// ---------------------------------------------------------------------------

export const courseSummarySchema = courseSchema
  .pick({
    id: true,
    title: true,
    subtitle: true,
    category: true,
    subject: true,
    level: true,
    code: true,
    term: true,
    year: true,
    language: true,
    difficulty: true,
    tags: true,
    prerequisites: true,
    certifications: true,
    estimatedHours: true,
    topics: true,
  })
  .extend({
    origin: sourceRefSchema.shape.origin,
    unitCount: z.number().int(),
    lessonCount: z.number().int(),
    questionCount: z.number().int(),
    assessmentCount: z.number().int(),
    /** The course has code or SQL exercises: learning it makes the playground useful. */
    hasCode: z.boolean().default(false),
    /** Some multiple-choice questions have a difficulty, so the learner can pick easy, medium or hard. */
    hasTiers: z.boolean().default(false),
    lessons: z.array(z.object({ id: contentId, title: z.string(), unitId: contentId })),
    assessments: z.array(z.object({ id: contentId, title: z.string(), kind: z.enum(['quiz', 'mock-exam']), paper: pastPaperKindSchema.optional() })).default([]),
  });

/** The university area: your semesters, newest first, and the one in progress. */
export const universitySchema = z
  .object({
    institution: z.string().optional(),
    terms: z.array(z.string()).min(1),
    currentTerm: z.string(),
  })
  .refine((university) => university.terms.includes(university.currentTerm), { message: 'currentTerm must be one of terms', path: ['currentTerm'] });

/** The school years that courses may name (content/authored/school.yaml). */
export const schoolSchema = z.object({
  elementary: z.array(z.number().int().min(1).max(6)),
  secondary: z.array(z.number().int().min(1).max(5)),
});

export const catalogSchema = z.object({
  schemaVersion: z.literal(CONTENT_SCHEMA_VERSION),
  generatedAt: z.string(),
  university: universitySchema.optional(),
  courses: z.array(courseSummarySchema),
  certifications: z.array(certificationSchema),
  roadmaps: z.array(roadmapSchema),
});

export const searchDocumentSchema = z.object({
  id: z.string(),
  kind: z.enum(['course', 'lesson', 'question', 'vocab', 'certification']),
  title: z.string(),
  text: z.string(),
  courseId: z.string().optional(),
  lessonId: z.string().optional(),
  url: z.string(),
});
