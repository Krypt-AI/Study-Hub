/**
 * Content build: validates authored content (Markdown + YAML) and generated content
 * (from the import pipeline) against the content schema and writes what the app loads:
 *
 *   public/content/catalog.json         course summaries, certifications, roadmaps, semesters
 *   public/content/courses/<id>.json    one file per course (parsed, defaults filled)
 *   public/content/search-index.json    documents for the global search: open content
 *   public/content/search-index-account.json   … and content that needs an account
 *   public/content/access.json          which courses and material sources are open
 *
 *   npm run content:build
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { parse as parseYaml } from 'yaml';
import { z } from 'zod';
import {
  catalogSchema,
  CONTENT_SCHEMA_VERSION,
  certificationSchema,
  courseSchema,
  roadmapSchema,
  schoolSchema,
  universitySchema,
} from '../src/domain/content/schema.ts';
import { buildAccessManifest, splitSearchDocuments } from '../src/domain/content/accessManifest.ts';
import type { Course, SearchDocument, University } from '../src/domain/content/types.ts';
import { lessonUrl, courseUrl, certificationUrl } from '../src/domain/content/urls.ts';
import { sectionByHeading } from '../src/domain/content/sections.ts';
import { tierOf } from '../src/domain/learning/tiers.ts';

const ROOT = process.cwd();
const AUTHORED_DIR = join(ROOT, 'content', 'authored');
const GENERATED_DIR = join(ROOT, 'content', 'generated', 'courses');
/** Courses written from your own course materials (e.g. university lecture slides): same format as authored, git-ignored. */
const PRIVATE_COURSES_DIR = join(ROOT, 'content', 'private', 'courses');
const OUTPUT_DIR = join(ROOT, 'public', 'content');

const errors: string[] = [];
const warnings: string[] = [];

/** `<<` merge keys let a file reuse a block with a few fields changed (e.g. a question repeated in two past papers). */
function readYaml(path: string): unknown {
  return parseYaml(readFileSync(path, 'utf8'), { merge: true });
}

/** Split "---\nfrontmatter\n---\nbody" into its parts. */
function parseFrontmatter(source: string): { data: Record<string, unknown>; body: string } {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/u.exec(source);
  if (!match) return { data: {}, body: source };
  return { data: (parseYaml(match[1] ?? '') as Record<string, unknown>) ?? {}, body: match[2] ?? '' };
}

function report(context: string, error: unknown): void {
  if (error instanceof z.ZodError) {
    for (const issue of error.issues) errors.push(`${context}: ${issue.path.join('.') || '(root)'}: ${issue.message}`);
  } else {
    errors.push(`${context}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// ---------------------------------------------------------------------------
// Authored courses: course.yaml + lessons/*.md (+ lessons/*.questions.yaml)
// ---------------------------------------------------------------------------

/**
 * SQL questions may name a shared practice database instead of repeating it:
 * `schemaFile: studylog.sql` reads `<course>/fixtures/studylog.sql` into `schema`.
 */
function inlineFixtures(courseDir: string, question: unknown): unknown {
  if (!question || typeof question !== 'object' || !('schemaFile' in question)) return question;
  const { schemaFile, ...rest } = question as { schemaFile: string } & Record<string, unknown>;
  return { ...rest, schema: readFileSync(join(courseDir, 'fixtures', schemaFile), 'utf8') };
}

type SourceRefInput = Record<string, unknown>;

/**
 * Lessons inherit the course's provenance, and questions their lesson's, unless they name their own.
 * `sourcePages: { sourceId, pages, caption? }` (or a list of them) in the frontmatter shows original pages (e.g. a past
 * paper rendered by the pipeline's `course-pages` command) after the lesson text.
 */
function loadAuthoredLesson(courseDir: string, name: string, courseSource: SourceRefInput): unknown {
  const markdownPath = join(courseDir, 'lessons', `${name}.md`);
  const questionsPath = join(courseDir, 'lessons', `${name}.questions.yaml`);
  const { data, body } = parseFrontmatter(readFileSync(markdownPath, 'utf8'));
  const { resources, sourcePages, ...meta } = data as { resources?: unknown[]; sourcePages?: Record<string, unknown> | Array<Record<string, unknown>> } & Record<string, unknown>;
  const questions = existsSync(questionsPath) ? ((readYaml(questionsPath) as unknown[]) ?? []).map((question) => inlineFixtures(courseDir, question)) : [];
  const lessonSource = (meta.source as SourceRefInput | undefined) ?? courseSource;
  return {
    ...meta,
    source: lessonSource,
    blocks: [
      ...(body.trim() ? [{ kind: 'markdown', body: body.trim() }] : []),
      ...[sourcePages ?? []].flat().map((pages) => ({ kind: 'source-pages', ...pages })),
      ...(resources?.length ? [{ kind: 'resources', title: 'Official resources', items: resources }] : []),
    ],
    questions: questions.map((question) => withReferenceExcerpt({ source: lessonSource, ...(question as object) }, body, name)),
  };
}

/** Copies the lesson section a question refers to into the question, so the app can show it beside it. */
function withReferenceExcerpt(question: { id?: unknown; reference?: { heading?: string } & Record<string, unknown> } & Record<string, unknown>, lessonBody: string, lessonName: string): object {
  const heading = question.reference?.heading;
  if (!heading) return question;
  const excerpt = sectionByHeading(lessonBody, heading);
  if (!excerpt) throw new Error(`lesson ${lessonName}: question ${String(question.id)} refers to the heading "${heading}", which the lesson does not have`);
  return { ...question, reference: { ...question.reference, excerpt } };
}

type AuthoredAssessment = { source?: SourceRefInput; sections?: Array<{ questions?: object[] } & Record<string, unknown>> } & Record<string, unknown>;

/** Assessments inherit the course's provenance, and their questions the assessment's, as lessons do. */
function inheritAssessmentSource(assessment: AuthoredAssessment, courseSource: SourceRefInput): unknown {
  const source = assessment.source ?? courseSource;
  return {
    ...assessment,
    source,
    sections: (assessment.sections ?? []).map((section) => ({
      ...section,
      questions: (section.questions ?? []).map((question) => ({ source, ...question })),
    })),
  };
}

function loadAuthoredCourse(courseDir: string): unknown {
  const raw = readYaml(join(courseDir, 'course.yaml')) as {
    units?: Array<{ lessons?: string[] } & Record<string, unknown>>;
    assessments?: AuthoredAssessment[];
    source?: SourceRefInput;
  } & Record<string, unknown>;
  const source = raw.source ?? { origin: 'authored' };
  return {
    ...raw,
    source,
    units: (raw.units ?? []).map((unit) => ({
      ...unit,
      lessons: (unit.lessons ?? []).map((name) => loadAuthoredLesson(courseDir, name, source)),
    })),
    assessments: (raw.assessments ?? []).map((assessment) => inheritAssessmentSource(assessment, source)),
  };
}

function loadCourses(): Course[] {
  const courses: Course[] = [];
  for (const [label, dir] of [
    ['authored', join(AUTHORED_DIR, 'courses')],
    ['private', PRIVATE_COURSES_DIR],
  ] as const) {
    if (!existsSync(dir)) continue;
    for (const entry of readdirSync(dir, { withFileTypes: true }).filter((item) => item.isDirectory())) {
      try {
        courses.push(courseSchema.parse(loadAuthoredCourse(join(dir, entry.name))));
      } catch (error) {
        report(`${label} course "${entry.name}"`, error);
      }
    }
  }
  if (existsSync(GENERATED_DIR)) {
    for (const file of readdirSync(GENERATED_DIR).filter((name) => name.endsWith('.json'))) {
      try {
        courses.push(courseSchema.parse(JSON.parse(readFileSync(join(GENERATED_DIR, file), 'utf8'))));
      } catch (error) {
        report(`generated course "${file}"`, error);
      }
    }
  } else {
    warnings.push('No generated courses (content/generated/courses): the HSK and JLPT courses appear after running the import pipeline.');
  }
  return courses;
}

// ---------------------------------------------------------------------------
// Integrity checks across files
// ---------------------------------------------------------------------------

const courseQuestions = (course: Course) => [
  ...course.units.flatMap((unit) => unit.lessons.flatMap((lesson) => lesson.questions)),
  ...course.assessments.flatMap((assessment) => assessment.sections.flatMap((section) => section.questions)),
];

function checkIntegrity(courses: Course[], certificationIds: Set<string>): Set<string> {
  const courseIds = new Set<string>();
  const questionIds = new Map<string, string>();
  for (const course of courses) {
    if (courseIds.has(course.id)) errors.push(`duplicate course id ${course.id}`);
    courseIds.add(course.id);
    const topicIds = new Set(course.topics.map((topic) => topic.id));
    const questions = courseQuestions(course);
    for (const question of questions) {
      const owner = questionIds.get(question.id);
      if (owner) errors.push(`question id ${question.id} used in ${owner} and ${course.id}`);
      questionIds.set(question.id, course.id);
      for (const topic of question.topics) if (!topicIds.has(topic)) warnings.push(`${course.id}: question ${question.id} uses undeclared topic ${topic}`);
      if (question.type === 'choice') {
        const optionIds = new Set(question.options.map((option) => option.id));
        for (const correct of question.correct) if (!optionIds.has(correct)) errors.push(`${question.id}: correct option ${correct} does not exist`);
      }
    }
    for (const certification of course.certifications) {
      if (!certificationIds.has(certification)) errors.push(`${course.id}: unknown certification ${certification}`);
    }
  }
  for (const course of courses) {
    for (const prerequisite of course.prerequisites) {
      if (!courseIds.has(prerequisite)) warnings.push(`${course.id}: prerequisite ${prerequisite} is not available (not imported yet?)`);
    }
  }
  return courseIds;
}

function checkCertificationLinks(certifications: z.output<typeof certificationSchema>[], courseIds: Set<string>): void {
  for (const certification of certifications) {
    for (const courseId of certification.relatedCourses) {
      if (!courseIds.has(courseId)) warnings.push(`certification ${certification.id}: related course ${courseId} does not exist`);
    }
  }
}

// ---------------------------------------------------------------------------
// Search index
// ---------------------------------------------------------------------------

const stripMarkdown = (text: string) =>
  text
    .replace(/```[\s\S]*?```/gu, ' ')
    .replace(/[#>*_`[\]()|-]+/gu, ' ')
    .replace(/\s+/gu, ' ')
    .trim();

function searchDocuments(courses: Course[], certifications: z.output<typeof certificationSchema>[]): SearchDocument[] {
  const documents: SearchDocument[] = [];
  for (const course of courses) {
    documents.push({ id: `course:${course.id}`, kind: 'course', title: course.title, text: stripMarkdown(`${course.subtitle ?? ''} ${course.description}`), courseId: course.id, url: courseUrl(course.id) });
    for (const lesson of course.units.flatMap((unit) => unit.lessons)) {
      const body = lesson.blocks.map((block) => (block.kind === 'markdown' || block.kind === 'callout' ? block.body : block.kind === 'grammar' ? `${block.title} ${block.body}` : '')).join(' ');
      documents.push({
        id: `lesson:${lesson.id}`,
        kind: 'lesson',
        title: lesson.title,
        text: stripMarkdown(`${lesson.subtitle ?? ''} ${lesson.summary ?? ''} ${body}`).slice(0, 4000),
        courseId: course.id,
        lessonId: lesson.id,
        url: lessonUrl(course.id, lesson.id),
      });
      for (const block of lesson.blocks) {
        if (block.kind !== 'vocab') continue;
        for (const item of block.items) {
          documents.push({
            id: `vocab:${item.id}`,
            kind: 'vocab',
            title: item.term,
            text: [item.reading, item.partOfSpeech, item.meaning].filter(Boolean).join(' '),
            courseId: course.id,
            lessonId: lesson.id,
            url: lessonUrl(course.id, lesson.id),
          });
        }
      }
      for (const question of lesson.questions) {
        if (question.type === 'choice' && question.options.every((option) => /^\d$/u.test(option.text))) continue; // image-based
        documents.push({
          id: `question:${question.id}`,
          kind: 'question',
          title: stripMarkdown(question.prompt).slice(0, 140),
          text: stripMarkdown(question.explanation ?? ''),
          courseId: course.id,
          lessonId: lesson.id,
          url: `${lessonUrl(course.id, lesson.id)}?question=${encodeURIComponent(question.id)}`,
        });
      }
    }
  }
  for (const certification of certifications) {
    documents.push({
      id: `certification:${certification.id}`,
      kind: 'certification',
      title: `${certification.name}${certification.code ? ` (${certification.code})` : ''}`,
      text: `${certification.provider} ${certification.summary} ${certification.objectives.join(' ')}`,
      url: certificationUrl(certification.id),
    });
  }
  return documents;
}

// ---------------------------------------------------------------------------

function loadList<T>(path: string, schema: z.ZodType<T>, context: string): T[] {
  if (!existsSync(path)) return [];
  try {
    return z.array(schema).parse(readYaml(path));
  } catch (error) {
    report(context, error);
    return [];
  }
}

/** Semesters of the university area; every university course must name one of them. */
function loadUniversity(courses: Course[]): University | undefined {
  const path = join(AUTHORED_DIR, 'university.yaml');
  if (!existsSync(path)) return undefined;
  try {
    const university = universitySchema.parse(readYaml(path));
    for (const course of courses.filter((candidate) => candidate.category === 'university')) {
      if (!course.term) errors.push(`university course ${course.id}: missing term`);
      else if (!university.terms.includes(course.term)) errors.push(`university course ${course.id}: term "${course.term}" is not listed in university.yaml`);
    }
    return university;
  } catch (error) {
    report('university.yaml', error);
    return undefined;
  }
}

const SCHOOL_LEVELS = ['elementary', 'secondary'] as const;
const isSchoolCourse = (course: Course): course is Course & { category: (typeof SCHOOL_LEVELS)[number] } => (SCHOOL_LEVELS as readonly string[]).includes(course.category);

/**
 * School courses name a year listed in school.yaml and the language they are taught in, and every
 * question in them is in that language (filled in where a question does not say). Other courses have
 * neither a year nor a language.
 */
function checkSchoolCourses(courses: Course[]): void {
  const school = courses.filter(isSchoolCourse);
  for (const course of courses.filter((candidate) => !isSchoolCourse(candidate))) {
    if (course.year !== undefined || course.language !== undefined) errors.push(`${course.id}: only primary and secondary school courses have a year and a language`);
  }
  if (!school.length) return;
  const path = join(AUTHORED_DIR, 'school.yaml');
  let years: { elementary: number[]; secondary: number[] } | undefined;
  try {
    years = schoolSchema.parse(readYaml(path));
  } catch (error) {
    report('school.yaml', error);
    return;
  }
  for (const course of school) {
    if (course.year === undefined) errors.push(`school course ${course.id}: missing year`);
    else if (!years[course.category].includes(course.year)) errors.push(`school course ${course.id}: year ${course.year} is not listed for ${course.category} in school.yaml`);
    if (!course.language) {
      errors.push(`school course ${course.id}: missing language (ms or en)`);
      continue;
    }
    for (const question of courseQuestions(course)) {
      question.language ??= course.language;
      if (question.language !== course.language) errors.push(`${course.id}: question ${question.id} is in ${question.language}, but the course is taught in ${course.language}`);
    }
  }
}

function main(): void {
  const certifications = loadList(join(AUTHORED_DIR, 'certifications.yaml'), certificationSchema, 'certifications.yaml');
  const roadmapsDir = join(AUTHORED_DIR, 'roadmaps');
  const roadmaps = existsSync(roadmapsDir)
    ? readdirSync(roadmapsDir)
        .filter((file) => file.endsWith('.yaml'))
        .flatMap((file) => {
          try {
            return [roadmapSchema.parse(readYaml(join(roadmapsDir, file)))];
          } catch (error) {
            report(`roadmap ${basename(file)}`, error);
            return [];
          }
        })
    : [];
  const courses = loadCourses();
  const courseIds = checkIntegrity(courses, new Set(certifications.map((certification) => certification.id)));
  const university = loadUniversity(courses);
  checkSchoolCourses(courses);
  checkCertificationLinks(certifications, courseIds);

  for (const warning of warnings) console.warn(`warning: ${warning}`);
  if (errors.length) {
    for (const error of errors) console.error(`error: ${error}`);
    console.error(`\nContent build failed with ${errors.length} error(s).`);
    process.exit(1);
  }

  const catalog = catalogSchema.parse({
    schemaVersion: CONTENT_SCHEMA_VERSION,
    generatedAt: new Date().toISOString(),
    university,
    courses: courses.map((course) => {
      const lessons = course.units.flatMap((unit) => unit.lessons.map((lesson) => ({ id: lesson.id, title: lesson.title, unitId: unit.id })));
      return {
        id: course.id,
        title: course.title,
        subtitle: course.subtitle,
        category: course.category,
        subject: course.subject,
        level: course.level,
        code: course.code,
        term: course.term,
        year: course.year,
        language: course.language,
        difficulty: course.difficulty,
        tags: course.tags,
        prerequisites: course.prerequisites,
        certifications: course.certifications,
        estimatedHours: course.estimatedHours,
        topics: course.topics,
        origin: course.source.origin,
        unitCount: course.units.length,
        lessonCount: lessons.length,
        questionCount: course.units.flatMap((unit) => unit.lessons).reduce((sum, lesson) => sum + lesson.questions.length, 0),
        assessmentCount: course.assessments.length,
        hasCode: courseQuestions(course).some((question) => question.type === 'code' || question.type === 'sql'),
        hasTiers: courseQuestions(course).some((question) => tierOf(question) !== undefined),
        lessons,
        assessments: course.assessments.map((assessment) => ({ id: assessment.id, title: assessment.title, kind: assessment.kind, paper: assessment.paper })),
      };
    }),
    certifications,
    roadmaps,
  });

  rmSync(join(OUTPUT_DIR, 'courses'), { recursive: true, force: true });
  mkdirSync(join(OUTPUT_DIR, 'courses'), { recursive: true });
  for (const course of courses) writeFileSync(join(OUTPUT_DIR, 'courses', `${course.id}.json`), JSON.stringify(course));
  writeFileSync(join(OUTPUT_DIR, 'catalog.json'), JSON.stringify(catalog));
  // Open content and content that needs an account are written apart so the host can lock the latter (src/domain/content/accessRules.ts).
  const access = buildAccessManifest(courses);
  const search = splitSearchDocuments(searchDocuments(courses, certifications), access);
  writeFileSync(join(OUTPUT_DIR, 'access.json'), JSON.stringify(access));
  writeFileSync(join(OUTPUT_DIR, 'search-index.json'), JSON.stringify(search.open));
  writeFileSync(join(OUTPUT_DIR, 'search-index-account.json'), JSON.stringify(search.account));

  const questionTotal = catalog.courses.reduce((sum, course) => sum + course.questionCount, 0);
  console.log(`Built ${courses.length} course(s), ${questionTotal} lesson question(s), ${certifications.length} certification(s), ${roadmaps.length} roadmap(s).`);
}

main();
