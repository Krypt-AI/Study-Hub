/**
 * A course's modules (its units) in one sheet: each a collapsible row with its lesson progress,
 * opening onto its lessons. The module holding the next lesson starts open, as does one linked to
 * by "#<unit id>" (certifications and roadmaps link to modules this way). A course with several
 * modules can open or close them all at once, to scan the whole outline or to tidy it away.
 */
import { ChevronsDownUp, ChevronsUpDown } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router';
import { Bubble, BubbleStrip, type BubbleState } from '@/components/ui/Bubble';
import { Button } from '@/components/ui/Button';
import { Sheet } from '@/components/ui/Sheet';
import type { LessonProgressRecord } from '@/data/records';
import { contentLanguage } from '@/domain/content/language';
import type { Course } from '@/domain/content/types';
import { lessonUrl } from '@/domain/content/urls';
import { ResetChapterButton } from './ResetChapterButton';

interface CourseModulesProps {
  course: Course;
  /** Every lesson id of the course in reading order, for the running lesson numbers. */
  lessonOrder: string[];
  records: Map<string, LessonProgressRecord>;
  nextLessonId?: string;
}

export function CourseModules({ course, lessonOrder, records, nextLessonId }: CourseModulesProps) {
  const linkedUnitId = decodeURIComponent(useLocation().hash.slice(1));
  // undefined: each module opens by its own rule; true or false: the learner opened or closed them all.
  const [allOpen, setAllOpen] = useState<boolean>();

  // The page renders after its data loads, so the browser's own jump to "#id" found nothing yet.
  useEffect(() => {
    if (linkedUnitId) document.getElementById(linkedUnitId)?.scrollIntoView({ block: 'start' });
  }, [linkedUnitId]);

  if (course.units.length === 0) return null;
  return (
    <Sheet
      title="Modules"
      aside={
        <>
          {course.units.length > 2 && (
            <Button
              size="sm"
              variant="ghost"
              icon={allOpen ? <ChevronsDownUp className="size-4" /> : <ChevronsUpDown className="size-4" />}
              onClick={() => setAllOpen(!allOpen)}
              aria-label={allOpen ? 'Collapse all modules' : 'Expand all modules'}
            >
              {allOpen ? 'Collapse all' : 'Expand all'}
            </Button>
          )}
          <span className="tabular">{course.units.length}</span>
        </>
      }
      padded={false}
    >
      <div className="divide-y divide-rule">
        {course.units.map((unit) => {
          const states = unit.lessons.map((lesson) => lessonState(records.get(lesson.id)));
          const completed = states.filter((state) => state === 'filled').length;
          const open = allOpen ?? (unit.id === linkedUnitId || unit.lessons.some((lesson) => lesson.id === nextLessonId));
          return (
            <details key={unit.id} id={unit.id} open={open} className="group scroll-mt-4">
              <summary className="flex cursor-pointer flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 hover:bg-sheet-2">
                <span className="min-w-0 flex-1 font-medium group-open:text-print-strong">{unit.title}</span>
                <BubbleStrip states={states} label={`${unit.title} lessons`} />
                <span className="tabular text-xs text-ink-faint">
                  {completed}/{unit.lessons.length}
                </span>
              </summary>
              <ol className="divide-y divide-rule border-t border-rule">
                {unit.lessons.map((lesson) => {
                  const record = records.get(lesson.id);
                  const answered = record?.answeredQuestionIds.length ?? 0;
                  return (
                    <li key={lesson.id}>
                      <Link to={lessonUrl(course.id, lesson.id)} className="grid grid-cols-[1.75rem_1.5rem_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 hover:bg-sheet-2">
                        <span className="display-numerals text-right text-print">{lessonOrder.indexOf(lesson.id) + 1}</span>
                        <Bubble state={lessonState(record)} />
                        <span className="min-w-0">
                          <span className="block truncate font-medium" lang={contentLanguage(course)}>
                            {lesson.title}
                          </span>
                          {lesson.subtitle && <span className="block truncate text-sm text-ink-muted">{lesson.subtitle}</span>}
                        </span>
                        <span className="tabular text-right text-xs text-ink-faint">{lesson.questions.length > 0 ? `${answered}/${lesson.questions.length}` : ''}</span>
                      </Link>
                    </li>
                  );
                })}
              </ol>
              {unit.lessons.some((lesson) => records.has(lesson.id)) && (
                <div className="flex justify-end border-t border-rule px-4 py-2">
                  <ResetChapterButton title={unit.title} lessons={unit.lessons} />
                </div>
              )}
            </details>
          );
        })}
      </div>
    </Sheet>
  );
}

function lessonState(record?: LessonProgressRecord): BubbleState {
  return record?.status === 'completed' ? 'filled' : record ? 'learning' : 'empty';
}
