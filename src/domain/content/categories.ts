/** How each course area is named and ordered wherever courses are grouped. */
import type { CourseCategory } from './types';

export const COURSE_CATEGORY_LABELS: Record<CourseCategory, string> = {
  university: 'UNITEN',
  elementary: 'Primary school',
  secondary: 'Secondary school',
  japanese: 'Japanese (JLPT)',
  chinese: 'Chinese (HSK)',
  'ai-engineering': 'AI engineering',
  it: 'IT and certifications',
};

export const COURSE_CATEGORY_ORDER: CourseCategory[] = ['elementary', 'secondary', 'university', 'japanese', 'chinese', 'ai-engineering', 'it'];
