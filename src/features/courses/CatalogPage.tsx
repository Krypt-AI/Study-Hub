/**
 * Courses, in two steps: first the areas (University, Japanese, Chinese, and the roadmaps), then,
 * once one is chosen, only that area's courses. AI engineering lives under its roadmap and the IT
 * courses under Certifications.
 */
import { FolderPlus } from 'lucide-react';
import { useState } from 'react';
import { useSearchParams } from 'react-router';
import { type AreaEntry, AreaBack, AreaIndex } from '@/components/ui/AreaIndex';
import { Button } from '@/components/ui/Button';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/Feedback';
import { Select } from '@/components/ui/Field';
import { PageHeader, Sheet } from '@/components/ui/Sheet';
import { defaultTerm, type Term } from '@/domain/calendar/semesters';
import { COURSE_CATEGORY_LABELS } from '@/domain/content/categories';
import { useCatalog } from '@/domain/content/load';
import type { Catalog, CourseCategory, CourseSummary } from '@/domain/content/types';
import { AddSemesterDialog } from '@/features/semesters/AddSemesterDialog';
import { useTerms } from '@/features/semesters/useTerms';
import { dayKey } from '@/lib/dates';
import { CourseRow } from './CourseRow';
import { type LessonStatuses, useLessonStatuses } from './useLessonStatuses';

/** The areas browsed here; AI engineering and IT are reached through the roadmap and Certifications. */
const AREAS = ['university', 'japanese', 'chinese'] as const satisfies readonly CourseCategory[];
type Area = (typeof AREAS)[number];
const isArea = (value: string | null): value is Area => AREAS.includes(value as Area);

const AREA_DESCRIPTIONS: Record<Area, string> = {
  university: 'Your semester subjects, written from your own notes and slides, with past papers.',
  japanese: 'JLPT N5 to N1 practice tests and 新にほんご500問, from your own books.',
  chinese: 'HSK 1 to 6 vocabulary and workbook exercises, from your own books.',
};

const ALL_TERMS = 'all';

export default function CatalogPage() {
  const catalog = useCatalog();
  const statuses = useLessonStatuses();
  const [params] = useSearchParams();
  const area = params.get('area');

  if (catalog.error) return <ErrorState title="Course content is not built yet" error={catalog.error} />;
  if (!catalog.data) return <LoadingState />;
  if (isArea(area)) return <AreaCourses area={area} catalog={catalog.data} statuses={statuses} />;
  return <AreaChoice catalog={catalog.data} statuses={statuses} />;
}

function AreaChoice({ catalog, statuses }: { catalog: Catalog; statuses: Map<string, LessonStatuses> }) {
  const inArea = (area: CourseCategory) => catalog.courses.filter((course) => course.category === area);
  const startedNote = (courses: CourseSummary[]) => {
    const started = courses.filter((course) => statuses.has(course.id)).length;
    return started ? `${started} started` : undefined;
  };
  const entries: AreaEntry[] = AREAS.map((area) => {
    const courses = inArea(area);
    return {
      id: area,
      title: COURSE_CATEGORY_LABELS[area],
      description: AREA_DESCRIPTIONS[area],
      count: `${courses.length} ${area === 'university' ? 'subject' : 'course'}${courses.length === 1 ? '' : 's'}`,
      note: startedNote(courses),
      to: `/courses?area=${area}`,
    };
  });
  for (const roadmap of catalog.roadmaps) {
    entries.push({
      id: `roadmap-${roadmap.id}`,
      title: roadmap.title.replace(/ Roadmap$/u, ''),
      description: `A roadmap of ${roadmap.stages.length} stages, from first steps to certification.`,
      count: 'Roadmap',
      note: startedNote(inArea('ai-engineering')),
      to: `/roadmaps/${roadmap.id}`,
    });
  }

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="Courses" lead="Choose what you are studying." />
      <AreaIndex label="Course areas" entries={entries} />
    </div>
  );
}

function AreaCourses({ area, catalog, statuses }: { area: Area; catalog: Catalog; statuses: Map<string, LessonStatuses> }) {
  const courses = catalog.courses.filter((course) => course.category === area);
  return (
    <div className="mx-auto max-w-5xl">
      <AreaBack to="/courses" label="All areas" />
      <PageHeader title={COURSE_CATEGORY_LABELS[area]} lead={AREA_DESCRIPTIONS[area]} />
      {area === 'university' ? (
        <UniversityCourses courses={courses} statuses={statuses} />
      ) : (
        <Sheet padded={false} aria-label={`${COURSE_CATEGORY_LABELS[area]} courses`}>
          <ul className="divide-y divide-rule">
            {courses.map((course) => (
              <CourseRow key={course.id} course={course} lessons={statuses.get(course.id)} />
            ))}
          </ul>
        </Sheet>
      )}
    </div>
  );
}

/** University subjects one semester at a time (the one in effect first); semesters can be added here. */
function UniversityCourses({ courses, statuses }: { courses: CourseSummary[]; statuses: Map<string, LessonStatuses> }) {
  const terms = useTerms();
  const [chosen, setChosen] = useState<string>();
  const [adding, setAdding] = useState(false);
  const term = chosen ?? defaultTerm(terms.terms, terms.currentTerm, dayKey()) ?? ALL_TERMS;
  const shown = courses.filter((course) => term === ALL_TERMS || course.term === term);

  return (
    <Sheet
      padded={shown.length === 0}
      title="Subjects"
      aside={
        <>
          <SemesterSelect terms={terms.terms} currentTerm={terms.currentTerm} value={term} onChange={setChosen} />
          <Button size="sm" variant="ghost" icon={<FolderPlus className="size-4" />} onClick={() => setAdding(true)}>
            Add semester
          </Button>
          {adding && <AddSemesterDialog terms={terms.terms} onAdded={setChosen} onClose={() => setAdding(false)} />}
        </>
      }
    >
      {shown.length === 0 ? (
        <EmptyState title={term === ALL_TERMS ? 'No subjects yet' : 'No materials for this semester yet'}>
          Each subject becomes a course built from your own lecture notes, slides and past papers. You can already keep this semester’s timetable and dates in the Calendar.
        </EmptyState>
      ) : (
        <ul className="divide-y divide-rule">
          {shown.map((course) => (
            <CourseRow key={course.id} course={course} lessons={statuses.get(course.id)} />
          ))}
        </ul>
      )}
    </Sheet>
  );
}

function SemesterSelect({ terms, currentTerm, value, onChange }: { terms: Term[]; currentTerm?: string; value: string; onChange: (term: string) => void }) {
  return (
    <Select value={value} onChange={(event) => onChange(event.target.value)} aria-label="Semester" className="h-8 w-auto py-0 text-sm">
      {terms.map((candidate) => (
        <option key={candidate.name} value={candidate.name}>
          {candidate.name === currentTerm ? `${candidate.name} (current)` : candidate.name}
        </option>
      ))}
      <option value={ALL_TERMS}>All semesters</option>
    </Select>
  );
}
