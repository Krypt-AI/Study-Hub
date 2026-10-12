/** Writes for the calendar: semester dates, timetable classes and important dates. */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { learnerKeys } from '@/data/queries';
import type { ImportantDateRecord, SemesterRecord, TimetableClassRecord } from '@/data/records';
import { useRepository } from '@/data/useRepository';

export function useCalendarMutations() {
  const repository = useRepository();
  const client = useQueryClient();
  const refresh = (key: readonly string[]) => () => client.invalidateQueries({ queryKey: key });

  const saveSemester = useMutation({
    mutationFn: (record: SemesterRecord) => repository.saveSemester(record),
    onSuccess: refresh(learnerKeys.semesters),
  });
  const saveClass = useMutation({
    mutationFn: (record: TimetableClassRecord) => repository.saveTimetableClass(record),
    onSuccess: refresh(learnerKeys.timetable),
  });
  const deleteClass = useMutation({
    mutationFn: (id: string) => repository.deleteTimetableClass(id),
    onSuccess: refresh(learnerKeys.timetable),
  });
  const saveDate = useMutation({
    mutationFn: (record: ImportantDateRecord) => repository.saveImportantDate(record),
    onSuccess: refresh(learnerKeys.importantDates),
  });
  const deleteDate = useMutation({
    mutationFn: (id: string) => repository.deleteImportantDate(id),
    onSuccess: refresh(learnerKeys.importantDates),
  });

  return { saveSemester, saveClass, deleteClass, saveDate, deleteDate };
}
