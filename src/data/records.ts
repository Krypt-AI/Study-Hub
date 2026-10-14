/**
 * Records persisted per learner. Both storage backends (IndexedDB and Supabase) store
 * exactly these shapes; content is referenced by its stable content ids.
 */
import type { CodeLanguage, CodeTest, CourseLanguage, QuestionType, Skill } from '@/domain/content/types';
import type { ExtraCategory } from '@/domain/content/visibility';
import type { QuestionTier } from '@/domain/learning/tiers';
import type { Response, Verdict } from '@/domain/evaluation/types';
import type { LearnerProfile } from '@/domain/profile/profile';

/** ISO-8601 timestamp, e.g. "2026-10-11T09:30:00.000Z". */
export type Timestamp = string;
/** Local calendar day, "YYYY-MM-DD". */
export type DayKey = string;

export type PracticeMode = 'lesson' | 'review' | 'weakness' | 'quiz' | 'mock-exam' | 'exercise';

export interface AttemptRecord {
  id: string;
  questionId: string;
  courseId?: string;
  lessonId?: string;
  assessmentId?: string;
  questionType: QuestionType;
  skill: Skill;
  topics: string[];
  mode: PracticeMode;
  response: Response;
  verdict: Verdict;
  score: number;
  hintsUsed: number;
  /** The answer was revealed before a correct attempt. */
  revealed: boolean;
  /** The learner confirmed the result of a rubric/self-review question. */
  selfAssessed: boolean;
  /** Only the first attempt in a session moves the review schedule; retries are free practice. */
  countsForScheduling: boolean;
  durationMs?: number;
  createdAt: Timestamp;
}

export type LessonStatus = 'in-progress' | 'completed';

export interface LessonProgressRecord {
  lessonId: string;
  courseId: string;
  status: LessonStatus;
  /** Questions answered at least once / answered correctly at least once. */
  answeredQuestionIds: string[];
  correctQuestionIds: string[];
  /** Index of the last block the learner reached, used to resume. */
  lastBlockIndex: number;
  startedAt: Timestamp;
  updatedAt: Timestamp;
  completedAt?: Timestamp;
}

/** FSRS card with dates serialised as ISO strings. */
export interface SchedulerCard {
  due: Timestamp;
  stability: number;
  difficulty: number;
  elapsed_days: number;
  scheduled_days: number;
  learning_steps: number;
  reps: number;
  lapses: number;
  state: number;
  last_review?: Timestamp;
}

export interface ReviewStateRecord {
  /** The question id being scheduled. */
  itemId: string;
  courseId?: string;
  lessonId?: string;
  topics: string[];
  card: SchedulerCard;
  /** Copy of card.due for indexing. */
  due: Timestamp;
  lastRating?: 1 | 2 | 3 | 4;
  updatedAt: Timestamp;
}

export interface TopicMasteryRecord {
  /** `${topicId}|${skill}` */
  key: string;
  topicId: string;
  skill: Skill;
  courseId?: string;
  /** Exponential moving average of scores (0..1). */
  ema: number;
  attempts: number;
  correct: number;
  lastAttemptAt: Timestamp;
}

export type LinkType = 'course' | 'lesson' | 'question' | 'certification' | 'project' | 'exercise';

export interface ContentLink {
  type: LinkType;
  id: string;
  label?: string;
  /** For lessons and questions, the course needed to build a URL. */
  courseId?: string;
  lessonId?: string;
}

export const linkKey = (link: Pick<ContentLink, 'type' | 'id'>) => `${link.type}:${link.id}`;

/** A note from the notebook that was removed: kept read-only so it can still be downloaded. */
export interface LegacyNote {
  id: string;
  title: string;
  /** Markdown. */
  body: string;
  updatedAt: Timestamp;
}

export interface CodeProjectRecord {
  id: string;
  title: string;
  language: CodeLanguage;
  code: string;
  stdin: string;
  description: string;
  tags: string[];
  links: ContentLink[];
  linkKeys: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface CodeVersionRecord {
  id: string;
  projectId: string;
  code: string;
  label?: string;
  createdAt: Timestamp;
}

/** An exercise the learner wrote for themselves in the playground. */
export interface CustomExerciseRecord {
  id: string;
  title: string;
  language: CodeLanguage;
  /** Markdown problem statement. */
  prompt: string;
  starterCode: string;
  solution: string;
  tests: CodeTest[];
  hints: string[];
  tags: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface SubmissionRecord {
  id: string;
  /** A built-in code question id or a custom exercise id. */
  exerciseId: string;
  code: string;
  passed: boolean;
  testsPassed: number;
  testsTotal: number;
  createdAt: Timestamp;
}

export type BookmarkType = 'course' | 'lesson' | 'question' | 'certification';

export interface BookmarkRecord {
  /** linkKey() of the target. */
  key: string;
  type: BookmarkType;
  id: string;
  label: string;
  courseId?: string;
  lessonId?: string;
  createdAt: Timestamp;
}

export type CertificationStatus = 'interested' | 'planning' | 'studying' | 'booked' | 'passed';

export interface CertificationProgressRecord {
  certId: string;
  status: CertificationStatus;
  targetDate?: DayKey;
  examDate?: DayKey;
  notes: string;
  updatedAt: Timestamp;
}

export interface ActivityDayRecord {
  day: DayKey;
  minutes: number;
  attempts: number;
  correct: number;
  lessonsCompleted: number;
  codeRuns: number;
  updatedAt: Timestamp;
}

export type ActivityDelta = Partial<Omit<ActivityDayRecord, 'day' | 'updatedAt'>>;

export interface Settings {
  dailyGoalMinutes: number;
  dailyGoalQuestions: number;
  /** Maximum number of due reviews offered per session. */
  reviewSessionSize: number;
  /** Target probability of recalling an item when it comes due (FSRS). */
  desiredRetention: number;
  /** Subjects switched to "Show on Today": Today and due reviews show only these (all subjects when empty). */
  todayCourseIds: string[];
  /** Age and school level from the Welcome page; absent until it is answered. */
  profile?: LearnerProfile;
  /** Extras the learner shows in their lists (signed in or local mode; guests see none). */
  visibleCategories: ExtraCategory[];
  /** Set once "What do you want to study?" has been answered or skipped. */
  extrasChosen?: boolean;
  /** For school subjects taught in both languages, keyed by subject: absent means BM. */
  languageBySubject: Record<string, CourseLanguage>;
  /** Which multiple-choice questions practice sessions offer, per course: absent means medium. */
  questionTiers: Record<string, QuestionTier>;
}

export const DEFAULT_SETTINGS: Settings = {
  dailyGoalMinutes: 30,
  dailyGoalQuestions: 20,
  reviewSessionSize: 30,
  desiredRetention: 0.9,
  todayCourseIds: [],
  visibleCategories: [],
  languageBySubject: {},
  questionTiers: {},
};

// Calendar ------------------------------------------------------------------------------

/** Clock time in 24-hour form, "HH:MM". */
export type ClockTime = string;

/**
 * A semester the learner keeps a calendar for: a term from the University catalog (e.g. "Sem 1 2026"),
 * whose dates they saved, or one they added themselves, with or without dates.
 */
export interface SemesterRecord {
  term: string;
  /** First and last day; both set or both absent. */
  startsOn?: DayKey;
  endsOn?: DayKey;
  /** Added by the learner rather than listed in the catalog; only these can be removed in the app. */
  addedByLearner?: boolean;
  createdAt?: Timestamp;
  updatedAt: Timestamp;
}

/** A semester whose first and last day are known. */
export type DatedSemester = SemesterRecord & { startsOn: DayKey; endsOn: DayKey };

export type ClassKind = 'lecture' | 'lab';

/** Classes saved when tutorials and "other" classes existed read as lectures. */
export const normalizeClassKind = (kind: string): ClassKind => (kind === 'lab' ? 'lab' : 'lecture');

/** The one place stored or imported timetable classes are brought up to the current kinds. */
export const normalizeTimetableClass = (record: TimetableClassRecord): TimetableClassRecord =>
  record.kind === normalizeClassKind(record.kind) ? record : { ...record, kind: normalizeClassKind(record.kind) };

/** A class that repeats every week of a semester. */
export interface TimetableClassRecord {
  id: string;
  term: string;
  /** The University subject, when the class belongs to one. */
  courseId?: string;
  title: string;
  kind: ClassKind;
  /** ISO weekday: 1 = Monday … 7 = Sunday. */
  weekday: number;
  start: ClockTime;
  end: ClockTime;
  location?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type ImportantDateKind = 'quiz' | 'test' | 'midterm' | 'final' | 'assignment' | 'extra-class' | 'holiday' | 'other';

/** A date worth knowing: a quiz, test, exam, deadline, extra or make-up class, or a holiday or break that can span several days. */
export interface ImportantDateRecord {
  id: string;
  term?: string;
  courseId?: string;
  title: string;
  kind: ImportantDateKind;
  /** The (first) day. */
  date: DayKey;
  /** The last day of an event that spans several days, such as a holiday week; absent for one day. */
  endDate?: DayKey;
  start?: ClockTime;
  end?: ClockTime;
  location?: string;
  details?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Learners and exam sittings ------------------------------------------------------------

/**
 * One person studying: a device or an account can hold several (siblings sharing a computer).
 * Every other record belongs to exactly one learner.
 */
export interface LearnerRecord {
  id: string;
  /** First name or nickname, shown in greetings and the learner switcher. */
  name: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/** An unfinished mock-exam sitting, so it can be resumed after a reload or on another device. */
export interface ExamDraftRecord {
  /** `${courseId}/${assessmentId}`: one sitting per exam. */
  id: string;
  courseId: string;
  assessmentId: string;
  sectionIndex: number;
  /** Section clock, in epoch milliseconds: it keeps running while you are away, as in the real test. */
  startedAt: number;
  endsAt?: number;
  /** Time spent in each finished section. */
  timesMs: number[];
  timed: boolean;
  answers: Record<string, Response>;
  updatedAt: Timestamp;
}

export const examDraftId = (courseId: string, assessmentId: string) => `${courseId}/${assessmentId}`;

/** Everything a learner owns, used for export/import and moving between backends. */
export interface BackupFile {
  format: 'study-hub-backup';
  version: 3;
  exportedAt: Timestamp;
  attempts: AttemptRecord[];
  lessonProgress: LessonProgressRecord[];
  reviewStates: ReviewStateRecord[];
  topicMastery: TopicMasteryRecord[];
  codeProjects: CodeProjectRecord[];
  codeVersions: CodeVersionRecord[];
  customExercises: CustomExerciseRecord[];
  submissions: SubmissionRecord[];
  bookmarks: BookmarkRecord[];
  certificationProgress: CertificationProgressRecord[];
  activityDays: ActivityDayRecord[];
  semesters: SemesterRecord[];
  timetableClasses: TimetableClassRecord[];
  importantDates: ImportantDateRecord[];
  examDrafts: ExamDraftRecord[];
  settings: Settings;
}
