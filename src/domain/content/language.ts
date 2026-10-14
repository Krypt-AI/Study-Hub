import type { AnswerLanguage, CourseCategory, CourseLanguage } from './types';

/** The `lang` attribute for text in a question's language: correct fonts, and the right IME. */
export const LANGUAGE_TAGS: Record<AnswerLanguage, string> = { en: 'en', ms: 'ms', zh: 'zh-CN', ja: 'ja' };

/** The `lang` tag of a course's content: CJK for correct glyphs and IME, and a school course's BM or English. */
export type ContentLang = 'zh-CN' | 'ja' | CourseLanguage;

export function contentLanguage(course: { category: CourseCategory; language?: CourseLanguage } | undefined): ContentLang | undefined {
  if (course?.category === 'chinese') return 'zh-CN';
  if (course?.category === 'japanese') return 'ja';
  return course?.language;
}
