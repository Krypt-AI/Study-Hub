/** Which lessons of each course the learner has started or completed. */
import { useMemo } from 'react';
import { useLessonProgress } from '@/data/queries';

export type LessonStatuses = Map<string, 'completed' | 'in-progress'>;

/** Each course's lessons the learner has started or completed. */
export function useLessonStatuses(): Map<string, LessonStatuses> {
  const progress = useLessonProgress();
  return useMemo(() => {
    const map = new Map<string, LessonStatuses>();
    for (const record of progress.data ?? []) {
      const lessons = map.get(record.courseId) ?? new Map();
      lessons.set(record.lessonId, record.status);
      map.set(record.courseId, lessons);
    }
    return map;
  }, [progress.data]);
}
