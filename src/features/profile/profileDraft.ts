/** The profile form's state, and the profile it describes once complete. */
import { hasYears, isValidAge, type LearnerProfile, type SchoolLevel, suggestedYear } from '@/domain/profile/profile';

export interface ProfileDraft {
  age: string;
  level?: SchoolLevel;
  year?: number;
  /** True until the learner chooses a level or year themselves. */
  followAge: boolean;
}

export const draftFrom = (profile?: LearnerProfile): ProfileDraft =>
  profile ? { age: String(profile.age), level: profile.level, year: profile.year, followAge: false } : { age: '', followAge: true };

/** The profile the draft describes, or undefined while the age or level is missing. */
export function profileFrom(draft: ProfileDraft): LearnerProfile | undefined {
  const age = Number(draft.age);
  if (!draft.age || !isValidAge(age) || !draft.level) return undefined;
  if (!hasYears(draft.level)) return { age, level: draft.level };
  return { age, level: draft.level, year: draft.year ?? suggestedYear(draft.level, age) };
}
