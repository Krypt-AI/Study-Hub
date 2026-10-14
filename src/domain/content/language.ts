import type { AnswerLanguage, CourseCategory } from './types';

/** The `lang` attribute for text in a question's language: correct fonts, and the right IME. */
export const LANGUAGE_TAGS: Record<AnswerLanguage, string> = { en: 'en', ms: 'ms', zh: 'zh-CN', ja: 'ja' };

/** BCP 47 language of a course's content, for `lang` attributes (correct CJK glyphs and IME). */
export function contentLanguage(course: { category: CourseCategory } | undefined): 'zh-CN' | 'ja' | undefined {
  if (course?.category === 'chinese') return 'zh-CN';
  if (course?.category === 'japanese') return 'ja';
  return undefined;
}
