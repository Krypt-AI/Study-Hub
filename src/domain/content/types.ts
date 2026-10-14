import type { z } from 'zod';
import type {
  answerLanguageSchema,
  assessmentSchema,
  pastPaperKindSchema,
  assessmentSectionSchema,
  blockSchema,
  catalogSchema,
  certificationSchema,
  choiceQuestionSchema,
  clozeQuestionSchema,
  codeLanguageSchema,
  codeQuestionSchema,
  codeTestSchema,
  courseCategorySchema,
  courseLanguageSchema,
  courseSchema,
  courseSummarySchema,
  lessonSchema,
  longQuestionSchema,
  matchOptionsSchema,
  mediaSchema,
  questionSchema,
  roadmapSchema,
  rubricCriterionSchema,
  searchDocumentSchema,
  shortQuestionSchema,
  skillSchema,
  sourceRefSchema,
  sqlQuestionSchema,
  translationQuestionSchema,
  unitSchema,
  universitySchema,
  vocabItemSchema,
} from './schema';

export type SourceRef = z.output<typeof sourceRefSchema>;
export type Media = z.output<typeof mediaSchema>;
export type Skill = z.output<typeof skillSchema>;
export type MatchOptions = z.output<typeof matchOptionsSchema>;

export type Question = z.output<typeof questionSchema>;
export type QuestionType = Question['type'];
export type ChoiceQuestion = z.output<typeof choiceQuestionSchema>;
export type ShortQuestion = z.output<typeof shortQuestionSchema>;
export type ClozeQuestion = z.output<typeof clozeQuestionSchema>;
export type LongQuestion = z.output<typeof longQuestionSchema>;
export type RubricCriterion = z.output<typeof rubricCriterionSchema>;
export type TranslationQuestion = z.output<typeof translationQuestionSchema>;
export type CodeQuestion = z.output<typeof codeQuestionSchema>;
export type CodeTest = z.output<typeof codeTestSchema>;
export type CodeLanguage = z.output<typeof codeLanguageSchema>;
export type SqlQuestion = z.output<typeof sqlQuestionSchema>;

export type Block = z.output<typeof blockSchema>;
export type VocabItem = z.output<typeof vocabItemSchema>;
export type Lesson = z.output<typeof lessonSchema>;
export type Unit = z.output<typeof unitSchema>;
export type Assessment = z.output<typeof assessmentSchema>;
export type PastPaperKind = z.output<typeof pastPaperKindSchema>;
export type AssessmentSection = z.output<typeof assessmentSectionSchema>;
export type Course = z.output<typeof courseSchema>;
export type CourseCategory = z.output<typeof courseCategorySchema>;
export type CourseLanguage = z.output<typeof courseLanguageSchema>;
export type AnswerLanguage = z.output<typeof answerLanguageSchema>;
export type CourseSummary = z.output<typeof courseSummarySchema>;

export type Certification = z.output<typeof certificationSchema>;
export type Roadmap = z.output<typeof roadmapSchema>;
export type Catalog = z.output<typeof catalogSchema>;
export type University = z.output<typeof universitySchema>;
export type SearchDocument = z.output<typeof searchDocumentSchema>;
