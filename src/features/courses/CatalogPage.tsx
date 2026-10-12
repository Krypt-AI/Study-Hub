/** All courses as ruled rows, grouped by area, with lesson-progress bubbles. */
import { ArrowRight, Lock, Map as MapIcon } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { BubbleStrip, type BubbleState } from '@/components/ui/Bubble';
import { ButtonLink } from '@/components/ui/Button';
import { EmptyState, ErrorState, LoadingState, Tag } from '@/components/ui/Feedback';
import { Input, Select } from '@/components/ui/Field';
import { PageHeader, Sheet } from '@/components/ui/Sheet';
import { Tabs } from '@/components/ui/Tabs';
import { useLessonProgress } from '@/data/queries';
import { isOpenCategory } from '@/domain/content/accessManifest';
import { useCatalog } from '@/domain/content/load';
import type { CourseCategory, CourseSummary, University } from '@/domain/content/types';
import { courseUrl } from '@/domain/content/urls';
import { providerNames } from '@/features/auth/signInOptions';
import { canOpenLockedContent, useAuth } from '@/features/auth/useAuth';

const CATEGORY_LABELS: Record<CourseCategory, string> = {
  chinese: 'Chinese (HSK)',
  japanese: 'Japanese (JLPT)',
  'ai-engineering': 'AI engineering',
  it: 'IT and certifications',
  university: 'University',
};

const CATEGORY_ORDER: CourseCategory[] = ['university', 'ai-engineering', 'it', 'japanese', 'chinese'];

type Filter = 'all' | CourseCategory;
type LessonStatuses = Map<string, 'completed' | 'in-progress'>;
const ALL_TERMS = 'all';

export default function CatalogPage() {
  const catalog = useCatalog();
  const progress = useLessonProgress();
  const [category, setCategory] = useState<Filter>('all');
  const [difficulty, setDifficulty] = useState('all');
  const [query, setQuery] = useState('');
  /** Semester shown in the University area; undefined until chosen, meaning the current one. */
  const [term, setTerm] = useState<string>();

  const progressByCourse = useMemo(() => {
    const map = new Map<string, LessonStatuses>();
    for (const record of progress.data ?? []) {
      const lessons = map.get(record.courseId) ?? new Map();
      lessons.set(record.lessonId, record.status);
      map.set(record.courseId, lessons);
    }
    return map;
  }, [progress.data]);

  if (catalog.error) return <ErrorState title="Course content is not built yet" error={catalog.error} />;
  if (!catalog.data) return <LoadingState />;

  const needle = query.trim().toLowerCase();
  const visible = catalog.data.courses.filter(
    (course) =>
      (category === 'all' || course.category === category) &&
      (difficulty === 'all' || course.difficulty === difficulty) &&
      (!needle || `${course.title} ${course.subtitle ?? ''} ${course.code ?? ''} ${course.tags.join(' ')} ${course.subject ?? ''}`.toLowerCase().includes(needle)),
  );
  const counts = Object.fromEntries(CATEGORY_ORDER.map((key) => [key, catalog.data.courses.filter((course) => course.category === key).length]));
  const aiRoadmap = catalog.data.roadmaps.find((roadmap) => roadmap.id === 'ai-engineering');
  const university = catalog.data.university;
  const selectedTerm = term ?? university?.currentTerm ?? ALL_TERMS;
  const unfiltered = !needle && difficulty === 'all';
  const universityCourses = visible.filter((course) => course.category === 'university' && (selectedTerm === ALL_TERMS || course.term === selectedTerm));
  // The university area stays visible while it is empty, so it is clear where subjects go and the semester can be changed.
  const showUniversity = (category === 'all' || category === 'university') && (universityCourses.length > 0 || unfiltered);

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Courses"
        lead="Your university subjects, HSK and JLPT books, the AI engineering roadmap and IT foundations. Every lesson ends in typed practice."
        actions={aiRoadmap && <ButtonLink to={`/roadmaps/${aiRoadmap.id}`} icon={<MapIcon className="size-4" />}>AI engineering roadmap</ButtonLink>}
      />
      <div className="mb-5 flex flex-col gap-3">
        <Tabs<Filter>
          label="Course area"
          value={category}
          onChange={setCategory}
          items={[{ id: 'all', label: 'All', count: catalog.data.courses.length }, ...CATEGORY_ORDER.map((key) => ({ id: key, label: CATEGORY_LABELS[key], count: counts[key] }))]}
        />
        <div className="flex flex-wrap gap-2">
          <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Filter by title or tag" aria-label="Filter courses" className="max-w-xs" />
          <Select value={difficulty} onChange={(event) => setDifficulty(event.target.value)} aria-label="Difficulty" className="w-40">
            <option value="all">Any difficulty</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </Select>
        </div>
      </div>

      {visible.length === 0 && !showUniversity && <EmptyState title="No courses match these filters" />}
      <div className="flex flex-col gap-6">
        {CATEGORY_ORDER.map((key) => {
          if (key === 'university') {
            return (
              showUniversity && (
                <UniversitySheet
                  key={key}
                  university={university}
                  term={selectedTerm}
                  onTermChange={setTerm}
                  courses={universityCourses}
                  progressByCourse={progressByCourse}
                />
              )
            );
          }
          const courses = visible.filter((course) => course.category === key);
          if (courses.length === 0) return null;
          return (
            <Sheet key={key} title={CATEGORY_LABELS[key]} aside={<span className="tabular">{courses.length}</span>} padded={false}>
              <ol className="divide-y divide-rule">
                {courses.map((course, index) => (
                  <CourseRow key={course.id} course={course} number={index + 1} lessons={progressByCourse.get(course.id)} />
                ))}
              </ol>
            </Sheet>
          );
        })}
      </div>
    </div>
  );
}

interface UniversitySheetProps {
  university?: University;
  term: string;
  onTermChange: (term: string) => void;
  courses: CourseSummary[];
  progressByCourse: Map<string, LessonStatuses>;
}

/** Your university subjects, one semester at a time (the current one first). */
function UniversitySheet({ university, term, onTermChange, courses, progressByCourse }: UniversitySheetProps) {
  const termLabel = term === ALL_TERMS ? 'any semester' : term;
  return (
    <Sheet
      title={CATEGORY_LABELS.university}
      aside={
        <>
          {university && (
            <Select value={term} onChange={(event) => onTermChange(event.target.value)} aria-label="Semester" className="h-8 w-auto py-0 text-sm">
              {university.terms.map((candidate) => (
                <option key={candidate} value={candidate}>
                  {candidate === university.currentTerm ? `${candidate} (current)` : candidate}
                </option>
              ))}
              <option value={ALL_TERMS}>All semesters</option>
            </Select>
          )}
          <span className="tabular">{courses.length}</span>
        </>
      }
      padded={courses.length === 0}
    >
      {courses.length === 0 ? (
        <EmptyState title={`No subjects for ${termLabel} yet`}>
          Each subject becomes a course built from your own lecture notes, slides and past papers, with lessons, typed practice and
          reviews like the other courses. Your materials stay private: they are imported locally and never published.
        </EmptyState>
      ) : (
        <ol className="divide-y divide-rule">
          {courses.map((course, index) => (
            <CourseRow key={course.id} course={course} number={index + 1} lessons={progressByCourse.get(course.id)} />
          ))}
        </ol>
      )}
    </Sheet>
  );
}

function CourseRow({ course, number, lessons }: { course: CourseSummary; number: number; lessons?: LessonStatuses }) {
  const states: BubbleState[] = course.lessons.map((lesson) => {
    const status = lessons?.get(lesson.id);
    return status === 'completed' ? 'filled' : status === 'in-progress' ? 'learning' : 'empty';
  });
  const started = Boolean(lessons?.size);
  const signedIn = canOpenLockedContent(useAuth());
  const locked = !signedIn && !isOpenCategory(course.category);
  return (
    <li className="grid grid-cols-[1.75rem_minmax(0,1fr)] gap-x-3 gap-y-2 px-4 py-3.5 md:grid-cols-[1.75rem_minmax(0,1.4fr)_minmax(0,1fr)_auto] md:items-center">
      <span className="display-numerals pt-0.5 text-right text-print">{number}</span>
      <div className="min-w-0">
        <Link to={courseUrl(course.id)} className="font-medium text-ink hover:text-print-strong">
          {course.title}
        </Link>
        {course.subtitle && <p className="truncate text-sm text-ink-muted">{course.subtitle}</p>}
        <div className="mt-1 flex flex-wrap gap-1.5">
          {locked && (
            <Tag tone="print" title={`Sign in with ${providerNames()} to open it`}>
              <Lock className="mr-1 inline size-3" aria-hidden />
              Sign in
            </Tag>
          )}
          {course.origin === 'user-material' ? <Tag tone="print">{course.category === 'university' ? 'Your materials' : 'Your book'}</Tag> : <Tag>Study Hub</Tag>}
          {course.code && <Tag>{course.code}</Tag>}
          {course.level && <Tag>{course.level}</Tag>}
          <Tag>{course.difficulty}</Tag>
        </div>
      </div>
      <div className="col-start-2 flex flex-col gap-1 md:col-start-auto">
        {states.length <= 30 ? <BubbleStrip states={states} label={`${course.title} lesson progress`} /> : null}
        <span className="tabular text-xs text-ink-faint">
          {course.lessonCount} lessons · {course.questionCount} questions
          {course.assessmentCount ? ` · ${course.assessmentCount} mock exam${course.assessmentCount > 1 ? 's' : ''}` : ''}
        </span>
      </div>
      <div className="col-start-2 md:col-start-auto">
        <ButtonLink to={courseUrl(course.id)} size="sm" variant={started ? 'primary' : 'secondary'} icon={<ArrowRight className="size-3.5" />}>
          {started ? 'Continue' : 'Open'}
        </ButtonLink>
      </div>
    </li>
  );
}
