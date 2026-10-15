/**
 * Courses, in two steps: first the learner's areas (their school level or University, the languages
 * they chose, and the roadmaps), then, once one is chosen, only that area's courses. With one area
 * there is nothing to choose, so it opens directly. AI engineering lives under its roadmap and the IT
 * courses under Certifications.
 */
import { FolderPlus } from 'lucide-react';
import { useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { type AreaEntry, AreaBack, AreaIndex } from '@/components/ui/AreaIndex';
import { Button } from '@/components/ui/Button';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/Feedback';
import { Select } from '@/components/ui/Field';
import { PageHeader, Sheet } from '@/components/ui/Sheet';
import { useTimetableClasses } from '@/data/queries';
import { defaultTerm, semesterCourseIds, type Term } from '@/domain/calendar/semesters';
import { COURSE_CATEGORY_LABELS } from '@/domain/content/categories';
import type { CourseCategory, CourseSummary } from '@/domain/content/types';
import { isCategoryVisible } from '@/domain/content/visibility';
import { type LearnerProfile, yearLabel, YEARS_IN_LEVEL } from '@/domain/profile/profile';
import { useVisibleCatalog, type VisibleCatalog } from '@/features/profile/useVisibility';
import { useCalendarMutations } from '@/features/calendar/useCalendarMutations';
import { AddSemesterDialog } from '@/features/semesters/AddSemesterDialog';
import { useTerms } from '@/features/semesters/useTerms';
import { dayKey, nowIso } from '@/lib/dates';
import { CourseRow } from './CourseRow';
import { type LessonStatuses, useLessonStatuses } from './useLessonStatuses';

/** The areas browsed here; AI engineering and IT are reached through the roadmap and Certifications. */
const AREAS = ['elementary', 'secondary', 'university', 'japanese', 'chinese'] as const satisfies readonly CourseCategory[];
type Area = (typeof AREAS)[number];
type SchoolArea = Extract<Area, 'elementary' | 'secondary'>;
const isArea = (value: string | null): value is Area => AREAS.includes(value as Area);
const isSchoolArea = (area: Area): area is SchoolArea => area === 'elementary' || area === 'secondary';

const AREA_DESCRIPTIONS: Record<Area, string> = {
  elementary: 'Your primary school subjects, Standard 1 to 6, with your own year first.',
  secondary: 'Your secondary school subjects, Form 1 to 5, with your own year first.',
  university: 'Your UNITEN semester subjects, written from your own notes and slides, with past papers.',
  japanese: 'JLPT N5 to N1 practice tests and 新にほんご500問, from your own books.',
  chinese: 'HSK 1 to 6 vocabulary and workbook exercises, from your own books.',
};

type Statuses = Map<string, LessonStatuses>;

export default function CatalogPage() {
  const catalog = useVisibleCatalog();
  const statuses = useLessonStatuses();
  const [params] = useSearchParams();
  const area = params.get('area');

  if (catalog.error) return <ErrorState title="Course content is not built yet" error={catalog.error} />;
  const visible = catalog.data;
  if (!visible) return <LoadingState />;
  const areas = AREAS.filter((candidate) => isCategoryVisible(candidate, visible.visibility));
  const onlyArea = areas.length === 1 && visible.roadmaps.length === 0 ? areas[0] : undefined;
  if (onlyArea) return <AreaCourses area={onlyArea} catalog={visible} statuses={statuses} />;
  if (isArea(area) && areas.includes(area)) return <AreaCourses area={area} catalog={visible} statuses={statuses} back />;
  return <AreaChoice areas={areas} catalog={visible} statuses={statuses} />;
}

/** Guests see their own level only; this says where the other courses are. */
function SignInNote({ catalog }: { catalog: VisibleCatalog }) {
  if (catalog.visibility.extrasAllowed) return null;
  return (
    <p className="mt-6 text-sm text-ink-muted">
      <Link to="/sign-in?next=%2Fcourses" className="text-print-strong hover:underline">
        Sign in
      </Link>{' '}
      to add Chinese, Japanese, AI and IT courses.
    </p>
  );
}

function AreaChoice({ areas, catalog, statuses }: { areas: Area[]; catalog: VisibleCatalog; statuses: Statuses }) {
  const inArea = (area: CourseCategory) => catalog.courses.filter((course) => course.category === area);
  const startedNote = (courses: CourseSummary[]) => {
    const started = courses.filter((course) => statuses.has(course.id)).length;
    return started ? `${started} started` : undefined;
  };
  const entries: AreaEntry[] = areas.map((area) => {
    const courses = inArea(area);
    const noun = area === 'japanese' || area === 'chinese' ? 'course' : 'subject';
    return {
      id: area,
      title: COURSE_CATEGORY_LABELS[area],
      description: AREA_DESCRIPTIONS[area],
      count: `${courses.length} ${noun}${courses.length === 1 ? '' : 's'}`,
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
      <SignInNote catalog={catalog} />
    </div>
  );
}

/** One area's courses; `back` when it was chosen from the areas. */
function AreaCourses({ area, catalog, statuses, back = false }: { area: Area; catalog: VisibleCatalog; statuses: Statuses; back?: boolean }) {
  const courses = catalog.courses.filter((course) => course.category === area);
  return (
    <div className="mx-auto max-w-5xl">
      {back && <AreaBack to="/courses" label="All areas" />}
      <PageHeader title={back ? COURSE_CATEGORY_LABELS[area] : 'Courses'} lead={AREA_DESCRIPTIONS[area]} />
      {area === 'university' ? (
        <UniversityCourses courses={courses} statuses={statuses} />
      ) : isSchoolArea(area) ? (
        <SchoolCourses area={area} courses={courses} profile={catalog.visibility.profile} statuses={statuses} />
      ) : (
        <Sheet padded={false} aria-label={`${COURSE_CATEGORY_LABELS[area]} courses`}>
          <CourseRows courses={courses} statuses={statuses} />
        </Sheet>
      )}
      <SignInNote catalog={catalog} />
    </div>
  );
}

function CourseRows({ courses, statuses }: { courses: CourseSummary[]; statuses: Statuses }) {
  return (
    <ul className="divide-y divide-rule">
      {courses.map((course) => (
        <CourseRow key={course.id} course={course} lessons={statuses.get(course.id)} />
      ))}
    </ul>
  );
}

/** A school level's subjects by year: the learner's year open first, the other years closed below it. */
function SchoolCourses({ area, courses, profile, statuses }: { area: SchoolArea; courses: CourseSummary[]; profile?: LearnerProfile; statuses: Statuses }) {
  const ownYear = profile?.level === area ? profile.year : undefined;
  const inYear = (year: number) => courses.filter((course) => course.year === year);
  const label = (year: number) => yearLabel({ level: area, year });
  const others = Array.from({ length: YEARS_IN_LEVEL[area] }, (_, index) => index + 1).filter((year) => year !== ownYear && inYear(year).length > 0);

  return (
    <div className="flex flex-col gap-6">
      {ownYear !== undefined && (
        <Sheet title={`${label(ownYear)}: your year`} padded={inYear(ownYear).length === 0}>
          {inYear(ownYear).length ? (
            <CourseRows courses={inYear(ownYear)} statuses={statuses} />
          ) : (
            <EmptyState title={`Courses for ${label(ownYear)} are not ready yet`}>They appear here as soon as they are added.</EmptyState>
          )}
        </Sheet>
      )}
      {others.length > 0 && (
        <Sheet title="Other years" padded={false}>
          <div className="divide-y divide-rule">
            {others.map((year) => (
              <details key={year}>
                <summary className="cursor-pointer px-5 py-3 text-ink-muted hover:text-ink">
                  {label(year)} ({inYear(year).length} {inYear(year).length === 1 ? 'subject' : 'subjects'})
                </summary>
                <CourseRows courses={inYear(year)} statuses={statuses} />
              </details>
            ))}
          </div>
        </Sheet>
      )}
    </div>
  );
}

/**
 * University subjects one semester at a time: the subjects of the learner's semester, then every
 * subject to choose from. A subject the learner linked a class to in the timetable is already chosen.
 */
function UniversityCourses({ courses, statuses }: { courses: CourseSummary[]; statuses: Statuses }) {
  const terms = useTerms();
  const classes = useTimetableClasses();
  const { saveSemester } = useCalendarMutations();
  const [chosen, setChosen] = useState<string>();
  const [adding, setAdding] = useState(false);

  if (terms.error ?? classes.error) return <ErrorState title="Your semesters could not be loaded" error={terms.error ?? classes.error} />;
  if (terms.isLoading || !classes.data) return <LoadingState />;

  const term = terms.terms.find((candidate) => candidate.name === chosen) ?? terms.terms.find((candidate) => candidate.name === defaultTerm(terms.terms, dayKey()));
  const addDialog = adding && <AddSemesterDialog terms={terms.terms} onAdded={setChosen} onClose={() => setAdding(false)} />;

  if (!term) {
    return (
      <Sheet padded aria-label="Subjects">
        <EmptyState
          title="Add your semester first"
          action={
            <Button variant="primary" icon={<FolderPlus className="size-4" />} onClick={() => setAdding(true)}>
              Add semester
            </Button>
          }
        >
          Name the semester you are in, for example "Sem 1 2026". Then choose the subjects you take in it.
        </EmptyState>
        {addDialog}
      </Sheet>
    );
  }

  const { linked, all } = semesterCourseIds(term.name, term.semester, classes.data);
  const mine = courses.filter((course) => all.includes(course.id));
  const toggle = (course: CourseSummary) => {
    const at = nowIso();
    const picked = term.semester?.courseIds ?? [];
    const courseIds = picked.includes(course.id) ? picked.filter((id) => id !== course.id) : [...picked, course.id];
    void saveSemester.mutateAsync({ createdAt: at, ...term.semester, term: term.name, courseIds, updatedAt: at });
  };

  return (
    <div className="flex flex-col gap-6">
      <Sheet
        padded={mine.length === 0}
        title="Subjects"
        aside={
          <>
            <SemesterSelect terms={terms.terms} value={term.name} onChange={setChosen} />
            <Button size="sm" variant="ghost" icon={<FolderPlus className="size-4" />} onClick={() => setAdding(true)}>
              Add semester
            </Button>
            {addDialog}
          </>
        }
      >
        {mine.length === 0 ? (
          <EmptyState title={`No subjects chosen for ${term.name} yet`}>Tick the subjects you take below, or link a class to its subject in the Calendar.</EmptyState>
        ) : (
          <CourseRows courses={mine} statuses={statuses} />
        )}
      </Sheet>
      <Sheet title={`Choose your subjects for ${term.name}`} padded={false}>
        {courses.length === 0 ? (
          <EmptyState title="No subjects yet" className="m-5">
            Each subject becomes a course built from your own lecture notes, slides and past papers.
          </EmptyState>
        ) : (
          <ul className="divide-y divide-rule">
            {courses.map((course) => {
              const fromTimetable = linked.includes(course.id);
              return (
                <li key={course.id}>
                  <label className="flex cursor-pointer items-center gap-3 px-5 py-3">
                    <input
                      type="checkbox"
                      className="size-4 accent-print"
                      checked={all.includes(course.id)}
                      disabled={fromTimetable || saveSemester.isPending}
                      onChange={() => toggle(course)}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="font-medium text-ink">{course.title}</span>
                      {course.code && <span className="ml-2 text-sm text-ink-faint">{course.code}</span>}
                    </span>
                    {fromTimetable && <span className="text-xs text-ink-faint">In your timetable</span>}
                  </label>
                </li>
              );
            })}
          </ul>
        )}
      </Sheet>
    </div>
  );
}

function SemesterSelect({ terms, value, onChange }: { terms: Term[]; value: string; onChange: (term: string) => void }) {
  return (
    <Select value={value} onChange={(event) => onChange(event.target.value)} aria-label="Semester" className="h-8 w-auto py-0 text-sm">
      {terms.map((candidate) => (
        <option key={candidate.name} value={candidate.name}>
          {candidate.name}
        </option>
      ))}
    </Select>
  );
}
