/** Choose the course a class or date belongs to, grouped by area. */
import type { SelectHTMLAttributes } from 'react';
import { Select } from '@/components/ui/Field';
import { COURSE_CATEGORY_LABELS, COURSE_CATEGORY_ORDER } from '@/domain/content/categories';
import { type Subject, subjectLabel } from './useSubjects';

export function SubjectSelect({ subjects, ...rest }: SelectHTMLAttributes<HTMLSelectElement> & { subjects: Subject[] }) {
  return (
    <Select {...rest}>
      <option value="">None</option>
      {COURSE_CATEGORY_ORDER.map((category) => {
        const inArea = subjects.filter((subject) => subject.category === category);
        return (
          inArea.length > 0 && (
            <optgroup key={category} label={COURSE_CATEGORY_LABELS[category]}>
              {inArea.map((subject) => (
                <option key={subject.courseId} value={subject.courseId}>
                  {subjectLabel(subject)}
                </option>
              ))}
            </optgroup>
          )
        );
      })}
    </Select>
  );
}
