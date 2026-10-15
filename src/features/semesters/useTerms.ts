/** The learner's semesters, newest added first (domain/calendar/semesters.ts). There is none until they add one. */
import { useMemo } from 'react';
import { useImportantDates, useSemesters, useTimetableClasses } from '@/data/queries';
import { mergeTerms } from '@/domain/calendar/semesters';

export function useTerms() {
  const semesters = useSemesters();
  const classes = useTimetableClasses();
  const dates = useImportantDates();
  return useMemo(() => {
    const referenced = [...(classes.data ?? []).map((entry) => entry.term), ...(dates.data ?? []).flatMap((entry) => (entry.term ? [entry.term] : []))];
    return {
      isLoading: semesters.isLoading || classes.isLoading || dates.isLoading,
      error: semesters.error ?? classes.error ?? dates.error,
      terms: mergeTerms(semesters.data ?? [], referenced),
    };
  }, [semesters.data, semesters.isLoading, semesters.error, classes.data, classes.isLoading, classes.error, dates.data, dates.isLoading, dates.error]);
}
