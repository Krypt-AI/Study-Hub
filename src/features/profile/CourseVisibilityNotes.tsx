/**
 * Shown on a course page: a banner when the course is in an extra the learner has hidden (it opened
 * from a link), and, for a school subject taught in both languages, the choice between them.
 */
import { useNavigate } from 'react-router';
import { Button } from '@/components/ui/Button';
import { Segmented } from '@/components/ui/Segmented';
import { useUpdateSettings } from '@/data/queries';
import { useCatalog } from '@/domain/content/load';
import type { CourseLanguage, CourseSummary } from '@/domain/content/types';
import { courseUrl } from '@/domain/content/urls';
import { EXTRA_CATEGORIES, isCategoryVisible, isExtraCategory, otherLanguageCourse } from '@/domain/content/visibility';
import { useVisibility } from './useVisibility';

type ShownCourse = Pick<CourseSummary, 'id' | 'category' | 'subject' | 'year' | 'language'>;

const LANGUAGE_LABELS: Record<CourseLanguage, string> = { ms: 'Bahasa Malaysia', en: 'English' };

export function CourseVisibilityNotes({ course }: { course: ShownCourse }) {
  return (
    <>
      <HiddenCourseBanner course={course} />
      <LanguageChoice course={course} />
    </>
  );
}

function HiddenCourseBanner({ course }: { course: ShownCourse }) {
  const visibility = useVisibility();
  const update = useUpdateSettings();
  const { category } = course;
  if (!visibility?.extrasAllowed || !isExtraCategory(category) || isCategoryVisible(category, visibility)) return null;
  const show = () =>
    update.mutate((current) => ({ ...current, visibleCategories: EXTRA_CATEGORIES.filter((candidate) => candidate === category || current.visibleCategories.includes(candidate)) }));
  return (
    <aside role="status" className="flex flex-wrap items-center gap-3 rounded-md border border-print-line bg-print-soft px-4 py-3 text-sm">
      <span>This course is hidden from your course list.</span>
      <Button size="sm" onClick={show} loading={update.isPending}>
        Show these courses
      </Button>
    </aside>
  );
}

function LanguageChoice({ course }: { course: ShownCourse }) {
  const catalog = useCatalog();
  const update = useUpdateSettings();
  const navigate = useNavigate();
  const other = catalog.data ? otherLanguageCourse(course, catalog.data.courses) : undefined;
  const { subject, language } = course;
  if (!other?.language || !subject || !language) return null;
  const choose = (next: CourseLanguage) => {
    if (next === language) return;
    update.mutate((current) => ({ ...current, languageBySubject: { ...current.languageBySubject, [subject]: next } }));
    void navigate(courseUrl(other.id));
  };
  return (
    <Segmented
      label="Language of this subject"
      value={language}
      options={[language, other.language].sort().map((id) => ({ id, label: LANGUAGE_LABELS[id] }))}
      onChange={choose}
    />
  );
}
