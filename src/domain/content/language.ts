import type { CourseCategory } from './types';

/** BCP 47 language of a course's content, for `lang` attributes (correct CJK glyphs and IME). */
export function contentLanguage(course: { category: CourseCategory } | undefined): 'zh-CN' | 'ja' | undefined {
  if (course?.category === 'chinese') return 'zh-CN';
  if (course?.category === 'japanese') return 'ja';
  return undefined;
}
