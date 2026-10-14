/**
 * Age, school level and year: the Welcome page and Settings › About you both use these fields. Until
 * the learner picks a level or year themselves, both follow the age typed in.
 */
import { Field, Input, Select } from '@/components/ui/Field';
import {
  hasYears,
  isValidAge,
  MAX_AGE,
  MIN_AGE,
  SCHOOL_LEVEL_LABELS,
  SCHOOL_LEVELS,
  type SchoolLevel,
  suggestedLevel,
  suggestedYear,
  yearLabel,
  YEARS_IN_LEVEL,
} from '@/domain/profile/profile';
import { cn } from '@/lib/cn';
import type { ProfileDraft } from './profileDraft';

const LEVEL_HINTS: Record<SchoolLevel, string> = {
  elementary: 'Standard 1 to 6 (KSSR)',
  secondary: 'Form 1 to 5 (KSSM)',
  university: 'Your university subjects',
};

export function ProfileFields({ draft, onChange }: { draft: ProfileDraft; onChange: (draft: ProfileDraft) => void }) {
  const age = Number(draft.age);
  const schoolLevel = draft.level && hasYears(draft.level) ? draft.level : undefined;
  const ageError = draft.age && !isValidAge(age) ? `Type a whole number from ${MIN_AGE} to ${MAX_AGE}.` : undefined;

  const changeAge = (text: string) => {
    const next = { ...draft, age: text };
    const typed = Number(text);
    if (draft.followAge && text && isValidAge(typed)) {
      const level = suggestedLevel(typed);
      onChange({ ...next, level, year: hasYears(level) ? suggestedYear(level, typed) : undefined });
    } else onChange(next);
  };
  const changeLevel = (level: SchoolLevel) => {
    const year = hasYears(level) ? (isValidAge(age) ? suggestedYear(level, age) : 1) : undefined;
    onChange({ ...draft, level, year, followAge: false });
  };

  return (
    <div className="flex flex-col gap-5">
      <Field label="How old are you?" error={ageError}>
        {(props) => <Input {...props} type="number" inputMode="numeric" min={MIN_AGE} max={MAX_AGE} step={1} value={draft.age} onChange={(event) => changeAge(event.target.value)} className="max-w-28" />}
      </Field>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1.5 text-[0.8125rem] font-medium text-ink-muted">Where do you study?</legend>
        <div className="divide-y divide-rule rounded-md border border-rule">
          {SCHOOL_LEVELS.map((level) => (
            <label key={level} className={cn('flex cursor-pointer items-center gap-3 px-3 py-2.5 transition-colors hover:bg-sheet-2', draft.level === level && 'bg-print-soft/60')}>
              <input type="radio" name="level" value={level} checked={draft.level === level} onChange={() => changeLevel(level)} className="size-4 accent-[var(--print)]" />
              <span className="flex flex-col">
                <span className="font-medium">{SCHOOL_LEVEL_LABELS[level]}</span>
                <span className="text-xs text-ink-muted">{LEVEL_HINTS[level]}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {schoolLevel && (
        <Field label="Which year are you in?">
          {(props) => (
            <Select {...props} value={draft.year ?? 1} onChange={(event) => onChange({ ...draft, year: Number(event.target.value), followAge: false })} className="max-w-40">
              {Array.from({ length: YEARS_IN_LEVEL[schoolLevel] }, (_, index) => index + 1).map((year) => (
                <option key={year} value={year}>
                  {yearLabel({ level: schoolLevel, year })}
                </option>
              ))}
            </Select>
          )}
        </Field>
      )}
    </div>
  );
}
