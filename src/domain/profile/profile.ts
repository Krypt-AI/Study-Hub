/**
 * A learner's profile: their age and school level, set on the Welcome page. Malaysian primary
 * school (KSSR) runs from Standard 1 to 6 and secondary school (KSSM) from Form 1 to 5; the age
 * only suggests a year, which the learner can change.
 */

export type SchoolLevel = 'elementary' | 'secondary' | 'university';

export interface LearnerProfile {
  /** Whole years, MIN_AGE to MAX_AGE. Nothing more precise (no birth date) is asked for. */
  age: number;
  level: SchoolLevel;
  /** Standard 1–6 for elementary, Form 1–5 for secondary; absent for university. */
  year?: number;
}

export const MIN_AGE = 5;
export const MAX_AGE = 99;

export const SCHOOL_LEVELS: SchoolLevel[] = ['elementary', 'secondary', 'university'];

export const SCHOOL_LEVEL_LABELS: Record<SchoolLevel, string> = {
  elementary: 'Primary school',
  secondary: 'Secondary school',
  university: 'University',
};

/** Years in each school level; university has none. */
export const YEARS_IN_LEVEL: Record<Exclude<SchoolLevel, 'university'>, number> = { elementary: 6, secondary: 5 };

/** Age at which each level's first year starts: Standard 1 at 7, Form 1 at 13. */
const FIRST_YEAR_AGE = { elementary: 7, secondary: 13 } as const;

export const hasYears = (level: SchoolLevel): level is Exclude<SchoolLevel, 'university'> => level !== 'university';

/** The level an age suggests: primary to 12, secondary to 17, then university. */
export function suggestedLevel(age: number): SchoolLevel {
  if (age < FIRST_YEAR_AGE.secondary) return 'elementary';
  if (age < FIRST_YEAR_AGE.secondary + YEARS_IN_LEVEL.secondary) return 'secondary';
  return 'university';
}

/** Standard = age − 6 and Form = age − 12, kept within the level's years. */
export function suggestedYear(level: Exclude<SchoolLevel, 'university'>, age: number): number {
  return Math.min(Math.max(age - FIRST_YEAR_AGE[level] + 1, 1), YEARS_IN_LEVEL[level]);
}

/** "Standard 3", "Form 2" or "University". */
export function yearLabel(profile: Pick<LearnerProfile, 'level' | 'year'>): string {
  if (!hasYears(profile.level) || !profile.year) return SCHOOL_LEVEL_LABELS[profile.level];
  return `${profile.level === 'elementary' ? 'Standard' : 'Form'} ${profile.year}`;
}

export const isValidAge = (age: number) => Number.isInteger(age) && age >= MIN_AGE && age <= MAX_AGE;

/** A profile as stored or imported, or undefined when it is missing or malformed (the Welcome page then asks again). */
export function parseProfile(value: unknown): LearnerProfile | undefined {
  if (typeof value !== 'object' || value === null) return undefined;
  const { age, level, year } = value as Record<string, unknown>;
  if (typeof age !== 'number' || !isValidAge(age)) return undefined;
  if (typeof level !== 'string' || !SCHOOL_LEVELS.includes(level as SchoolLevel)) return undefined;
  const schoolLevel = level as SchoolLevel;
  if (!hasYears(schoolLevel)) return { age, level: schoolLevel };
  const validYear = typeof year === 'number' && Number.isInteger(year) && year >= 1 && year <= YEARS_IN_LEVEL[schoolLevel];
  return { age, level: schoolLevel, year: validYear ? year : suggestedYear(schoolLevel, age) };
}
