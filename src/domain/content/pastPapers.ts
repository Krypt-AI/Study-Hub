/** A course's past papers, grouped by kind for the course page: midterms, then tests, then finals and school UASA papers. */
import type { Assessment, PastPaperKind } from './types';

export const PAST_PAPER_GROUPS: Array<{ kind: PastPaperKind; title: string }> = [
  { kind: 'midterm', title: 'Midterms' },
  { kind: 'test', title: 'Tests' },
  { kind: 'final', title: 'Final exams' },
  { kind: 'uasa', title: 'UASA (Ujian Akhir Sesi Akademik)' },
];

export interface PastPaperGroup {
  kind: PastPaperKind;
  title: string;
  papers: Assessment[];
}

/** Past papers in non-empty groups, each in the course's authored order; the rest are practice sets. */
export function groupAssessments(assessments: Assessment[]): { pastPapers: PastPaperGroup[]; practice: Assessment[] } {
  const pastPapers = PAST_PAPER_GROUPS.map((group) => ({ ...group, papers: assessments.filter((assessment) => assessment.paper === group.kind) })).filter((group) => group.papers.length > 0);
  return { pastPapers, practice: assessments.filter((assessment) => !assessment.paper) };
}
