/** Writes for the calendar: semesters, timetable classes and important dates. */
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

  /** A semester the learner added, with the classes and dates that belong to it. */
  const removeSemester = useMutation({
    mutationFn: async ({ term, classes, dates }: { term: string; classes: TimetableClassRecord[]; dates: ImportantDateRecord[] }) => {
      for (const entry of classes) await repository.deleteTimetableClass(entry.id);
      for (const entry of dates) await repository.deleteImportantDate(entry.id);
      await repository.deleteSemester(term);
    },
    onSettled: () => Promise.all([learnerKeys.semesters, learnerKeys.timetable, learnerKeys.importantDates].map((queryKey) => client.invalidateQueries({ queryKey }))),
  });

  return { saveSemester, removeSemester, saveClass, deleteClass, saveDate, deleteDate };
}
