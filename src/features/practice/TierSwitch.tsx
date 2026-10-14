/** Easy, medium or hard multiple-choice questions for one subject's practice sessions. */
import { Segmented } from '@/components/ui/Segmented';
import { useSettings, useUpdateSettings } from '@/data/queries';
import { QUESTION_TIER_LABELS, QUESTION_TIERS, tierFor } from '@/domain/learning/tiers';

export function TierSwitch({ courseId }: { courseId: string }) {
  const settings = useSettings();
  const update = useUpdateSettings();
  if (!settings.data) return null;
  return (
    <div className="flex flex-wrap items-center gap-3 text-sm text-ink-muted">
      <span aria-hidden>Multiple-choice questions</span>
      <Segmented
        label="Multiple-choice questions"
        value={tierFor(settings.data.questionTiers, courseId)}
        options={QUESTION_TIERS.map((tier) => ({ id: tier, label: QUESTION_TIER_LABELS[tier] }))}
        onChange={(tier) => update.mutate((current) => ({ ...current, questionTiers: { ...current.questionTiers, [courseId]: tier } }))}
      />
    </div>
  );
}
