/** A subject's study plan (domain/learning/studyPlan.ts): what Study Hub does with the learner's work in it. */
import { Check } from 'lucide-react';
import { Select } from '@/components/ui/Field';
import { useSettings, useUpdateSettings } from '@/data/queries';
import { setStudyPlan, STUDY_PLAN_INFO, STUDY_PLAN_LEVELS, studyPlanIncludes, type StudyPlanLevel, planOf } from '@/domain/learning/studyPlan';
import { cn } from '@/lib/cn';

function useStudyPlan(courseId: string) {
  const settings = useSettings();
  const update = useUpdateSettings();
  return {
    level: settings.data ? planOf(settings.data.studyPlans, courseId) : undefined,
    disabled: !settings.data || update.isPending,
    choose: (level: StudyPlanLevel) => update.mutate((current) => ({ ...current, studyPlans: setStudyPlan(current.studyPlans, courseId, level) })),
  };
}

/** The three levels side by side, each with the checklist of what it includes. */
export function StudyPlanPicker({ courseId, className }: { courseId: string; className?: string }) {
  const { level, disabled, choose } = useStudyPlan(courseId);
  return (
    <fieldset className={cn('flex flex-col gap-2', className)} disabled={disabled}>
      <legend className="mb-2 text-sm font-medium text-ink">
        Study plan <span className="font-normal text-ink-muted">· only subjects you practise or review appear on Today</span>
      </legend>
      <div className="grid gap-2 sm:grid-cols-3">
        {STUDY_PLAN_LEVELS.map((option) => {
          const chosen = option === level;
          return (
            <label
              key={option}
              className={cn(
                'flex cursor-pointer flex-col gap-2 rounded-md border px-3 py-2.5 transition-colors duration-150',
                chosen ? 'border-print bg-print-soft' : 'border-rule-strong hover:border-print-line',
              )}
            >
              <span className="flex items-center gap-2">
                <input type="radio" name={`study-plan-${courseId}`} className="size-4 accent-print" checked={chosen} onChange={() => choose(option)} />
                <span className={cn('text-sm font-medium', chosen ? 'text-print-strong' : 'text-ink')}>{STUDY_PLAN_INFO[option].title}</span>
              </span>
              <ul className="flex flex-col gap-1 text-xs text-ink-muted">
                {studyPlanIncludes(option).map((item) => (
                  <li key={item} className="flex gap-1.5">
                    <Check className="mt-px size-3.5 shrink-0 text-print" aria-hidden />
                    {item}
                  </li>
                ))}
              </ul>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

/** One subject's level as a dropdown, for a list that already names the subject. */
export function StudyPlanSelect({ courseId, label }: { courseId: string; label: string }) {
  const { level, disabled, choose } = useStudyPlan(courseId);
  return (
    <Select aria-label={label} value={level ?? 'material'} disabled={disabled} onChange={(event) => choose(event.target.value as StudyPlanLevel)} className="h-8 w-auto py-0 text-sm">
      {STUDY_PLAN_LEVELS.map((option) => (
        <option key={option} value={option}>
          {STUDY_PLAN_INFO[option].title}
        </option>
      ))}
    </Select>
  );
}
