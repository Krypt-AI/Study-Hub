/** The semesters to choose from: the catalog's terms plus those the learner added (domain/calendar/semesters.ts). */
import { useMemo } from 'react';
import { useSemesters } from '@/data/queries';
import type { SemesterRecord } from '@/data/records';
import { mergeTerms, type Term } from '@/domain/calendar/semesters';
import { useCatalog } from '@/domain/content/load';

/** Used when there is no University area and no semester added: the calendar still works for one semester. */
const FALLBACK_TERM = 'This semester';

const fallbackTerm = (semesters: SemesterRecord[]): Term => ({ name: FALLBACK_TERM, fromCatalog: true, semester: semesters.find((semester) => semester.term === FALLBACK_TERM) });

export function useTerms() {
  const catalog = useCatalog();
  const semesters = useSemesters();
  return useMemo(() => {
    const university = catalog.data?.university;
    const terms = mergeTerms(university?.terms ?? [], semesters.data ?? []);
    return {
      isLoading: catalog.isLoading || semesters.isLoading,
      error: catalog.error ?? semesters.error,
      terms: terms.length ? terms : [fallbackTerm(semesters.data ?? [])],
      currentTerm: university?.currentTerm,
    };
  }, [catalog.data, catalog.isLoading, catalog.error, semesters.data, semesters.isLoading, semesters.error]);
}
