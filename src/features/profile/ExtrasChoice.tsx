/**
 * The extras a learner can add to their lists (Chinese, Japanese, AI engineering, IT), as checkboxes
 * with what each holds. Used by "What do you want to study?" and Settings › Courses I want to see.
 */
import { COURSE_CATEGORY_LABELS } from '@/domain/content/categories';
import { useCatalog } from '@/domain/content/load';
import { certificationExtra, EXTRA_CATEGORIES, type ExtraCategory } from '@/domain/content/visibility';
import { cn } from '@/lib/cn';

const EXTRA_DESCRIPTIONS: Record<ExtraCategory, string> = {
  chinese: 'HSK 1 to 6 vocabulary and workbook exercises.',
  japanese: 'JLPT practice tests and 新にほんご500問.',
  'ai-engineering': 'Learning paths: AI engineering, full-stack development and cybersecurity.',
  it: 'Certification guides: cloud, security, networking, Linux and more.',
};

const plural = (n: number, noun: string) => `${n} ${noun}${n === 1 ? '' : 's'}`;

/** What each extra is called in the choice; roadmaps and certifications are not course areas. */
const EXTRA_LABELS: Record<ExtraCategory, string> = {
  chinese: COURSE_CATEGORY_LABELS.chinese,
  japanese: COURSE_CATEGORY_LABELS.japanese,
  'ai-engineering': 'Roadmaps',
  it: 'Certifications',
};

export function ExtrasChoice({ value, onChange, disabled = false }: { value: readonly ExtraCategory[]; onChange: (next: ExtraCategory[]) => void; disabled?: boolean }) {
  const catalog = useCatalog();
  const count = (category: ExtraCategory): string => {
    if (!catalog.data) return '';
    if (category === 'ai-engineering') return plural(catalog.data.roadmaps.length, 'roadmap');
    if (category === 'it') return plural(catalog.data.certifications.filter((certification) => certificationExtra(certification.category) === 'it').length, 'certification');
    return plural(catalog.data.courses.filter((course) => course.category === category).length, 'course');
  };
  const toggle = (category: ExtraCategory, on: boolean) => onChange(EXTRA_CATEGORIES.filter((candidate) => (candidate === category ? on : value.includes(candidate))));

  return (
    <fieldset disabled={disabled} className="divide-y divide-rule rounded-md border border-rule">
      <legend className="sr-only">Extra courses</legend>
      {EXTRA_CATEGORIES.map((category) => {
        const checked = value.includes(category);
        return (
          <label key={category} className={cn('flex cursor-pointer items-start gap-3 px-3 py-2.5 transition-colors hover:bg-sheet-2', checked && 'bg-print-soft/60')}>
            <input type="checkbox" checked={checked} onChange={(event) => toggle(category, event.target.checked)} className="mt-1 size-4 accent-[var(--print)]" />
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="font-medium">{EXTRA_LABELS[category]}</span>
              <span className="text-xs text-ink-muted">{EXTRA_DESCRIPTIONS[category]}</span>
            </span>
            <span className="tabular text-xs text-ink-faint">
              {count(category)}
            </span>
          </label>
        );
      })}
    </fieldset>
  );
}
