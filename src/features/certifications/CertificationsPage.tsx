/**
 * Certifications in two steps: the learner's plan and the areas first (AI, cloud, security, …, JLPT and
 * HSK, and the IT courses that prepare for them), then one area's certifications. Every fact is
 * checked against the provider's official pages.
 */
import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { type AreaEntry, AreaBack, AreaIndex } from '@/components/ui/AreaIndex';
import { Bubble } from '@/components/ui/Bubble';
import { EmptyState, ErrorState, LoadingState, Tag } from '@/components/ui/Feedback';
import { PageHeader, Sheet } from '@/components/ui/Sheet';
import { useCertificationProgress } from '@/data/queries';
import type { CertificationProgressRecord } from '@/data/records';
import { useCatalog } from '@/domain/content/load';
import type { Catalog, Certification } from '@/domain/content/types';
import { certificationUrl } from '@/domain/content/urls';
import { CourseRow } from '@/features/courses/CourseRow';
import { useLessonStatuses } from '@/features/courses/useLessonStatuses';
import { formatDate, parseDayKey, relativeDay } from '@/lib/dates';
import {
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  type CertificationCategory,
  CREDENTIAL_LABELS,
  formatCost,
  LEVEL_LABELS,
  PROVIDER_STATUS,
  TRACKING,
  TRACKING_ORDER,
} from './certificationLabels';

/** The index entry that opens the IT courses rather than a certification area. */
const IT_COURSES = 'it-courses';

const CATEGORY_DESCRIPTIONS: Record<CertificationCategory, string> = {
  'ai-ml': 'AWS, Google, Microsoft, NVIDIA, Databricks and more.',
  cloud: 'AWS, Microsoft Azure and Google Cloud.',
  data: 'Data engineering and analytics.',
  security: 'CompTIA Security+, ISC2 and others.',
  networking: 'CompTIA Network+ and Cisco CCNA.',
  linux: 'Linux administration and Kubernetes.',
  software: 'Software development.',
  'it-fundamentals': 'CompTIA A+ and other first certifications.',
  japanese: 'The Japanese-Language Proficiency Test, N5 to N1.',
  chinese: 'The Chinese proficiency test, HSK 1 to 6.',
};

export default function CertificationsPage() {
  const catalog = useCatalog();
  const progress = useCertificationProgress();
  const [params] = useSearchParams();
  const area = params.get('area');
  const tracking = useMemo(() => new Map((progress.data ?? []).map((record) => [record.certId, record])), [progress.data]);

  if (catalog.error) return <ErrorState title="Certification data is not built yet" error={catalog.error} />;
  if (!catalog.data) return <LoadingState />;
  if (area === IT_COURSES) return <ItCourses catalog={catalog.data} />;
  if (area && (CATEGORY_ORDER as string[]).includes(area)) return <AreaCertifications category={area as CertificationCategory} catalog={catalog.data} tracking={tracking} />;

  const certifications = catalog.data.certifications;
  const checkedOn = certifications.map((certification) => certification.verifiedOn).sort().at(-1);
  const entries: AreaEntry[] = CATEGORY_ORDER.flatMap((category) => {
    const inArea = certifications.filter((certification) => certification.category === category);
    if (inArea.length === 0) return [];
    const planned = inArea.filter((certification) => tracking.has(certification.id)).length;
    return [
      {
        id: category,
        title: CATEGORY_LABELS[category],
        description: CATEGORY_DESCRIPTIONS[category],
        count: `${inArea.length} certification${inArea.length === 1 ? '' : 's'}`,
        note: planned ? `${planned} in your plan` : undefined,
        to: `/certifications?area=${category}`,
      },
    ];
  });
  const itCourses = catalog.data.courses.filter((course) => course.category === 'it');
  if (itCourses.length > 0) {
    entries.push({ id: IT_COURSES, title: 'IT courses', description: 'Study Hub courses for the IT foundations these exams test.', count: `${itCourses.length} course${itCourses.length === 1 ? '' : 's'}`, to: `/certifications?area=${IT_COURSES}` });
  }

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Certifications"
        lead={`Checked against each provider's official pages${checkedOn ? ` on ${formatDate(parseDayKey(checkedOn))}` : ''}. Prices and formats change, so confirm before you book.`}
      />
      <MyPlan certifications={certifications} tracking={progress.data ?? []} />
      <AreaIndex label="Certification areas" entries={entries} twoColumns />
    </div>
  );
}

function AreaCertifications({ category, catalog, tracking }: { category: CertificationCategory; catalog: Catalog; tracking: Map<string, CertificationProgressRecord> }) {
  const [includeRetired, setIncludeRetired] = useState(false);
  const inArea = catalog.certifications.filter((certification) => certification.category === category);
  const retiredCount = inArea.filter((certification) => certification.status === 'retired').length;
  const rows = inArea.filter((certification) => includeRetired || certification.status !== 'retired' || tracking.has(certification.id));
  return (
    <div className="mx-auto max-w-5xl">
      <AreaBack to="/certifications" label="All areas" />
      <PageHeader title={CATEGORY_LABELS[category]} lead={CATEGORY_DESCRIPTIONS[category]} />
      {retiredCount > 0 && (
        <label className="mb-4 flex items-center gap-2 text-sm text-ink-muted">
          <input type="checkbox" checked={includeRetired} onChange={(event) => setIncludeRetired(event.target.checked)} className="size-4 accent-[var(--print)]" />
          Show retired ({retiredCount})
        </label>
      )}
      {rows.length === 0 ? (
        <EmptyState title="No certifications to show" />
      ) : (
        <Sheet padded={false} aria-label={`${CATEGORY_LABELS[category]} certifications`}>
          <ul className="divide-y divide-rule">
            {rows.map((certification) => (
              <CertificationRow key={certification.id} certification={certification} record={tracking.get(certification.id)} />
            ))}
          </ul>
        </Sheet>
      )}
    </div>
  );
}

function ItCourses({ catalog }: { catalog: Catalog }) {
  const statuses = useLessonStatuses();
  return (
    <div className="mx-auto max-w-5xl">
      <AreaBack to="/certifications" label="All areas" />
      <PageHeader title="IT courses" lead="Study Hub courses for the IT foundations that certifications test." />
      <Sheet padded={false} aria-label="IT courses">
        <ul className="divide-y divide-rule">
          {catalog.courses
            .filter((course) => course.category === 'it')
            .map((course) => (
              <CourseRow key={course.id} course={course} lessons={statuses.get(course.id)} />
            ))}
        </ul>
      </Sheet>
    </div>
  );
}

function CertificationRow({ certification, record }: { certification: Certification; record?: CertificationProgressRecord }) {
  const status = certification.status === 'active' ? undefined : PROVIDER_STATUS[certification.status];
  return (
    <li>
      <Link to={certificationUrl(certification.id)} className="flex items-center gap-x-3 px-5 py-3.5 hover:bg-sheet-2">
        {record && <Bubble state={TRACKING[record.status].bubble} title={TRACKING[record.status].label} />}
        <span className="min-w-0 flex-1">
          <span className="line-clamp-2 block font-medium">
            {certification.name}
            {certification.code && <span className="ml-2 text-sm font-normal text-ink-muted">{certification.code}</span>}
          </span>
          <span className="mt-0.5 block text-sm text-ink-muted">
            {certification.provider}, {LEVEL_LABELS[certification.level].toLowerCase()}, {CREDENTIAL_LABELS[certification.credentialType].toLowerCase()}
          </span>
        </span>
        <span className="flex shrink-0 flex-col items-end gap-1 sm:flex-row sm:items-center sm:gap-2">
          {status && <Tag tone={status.tone}>{status.label}</Tag>}
          <span className="tabular text-right text-sm">{formatCost(certification.cost)}</span>
        </span>
      </Link>
    </li>
  );
}

function MyPlan({ certifications, tracking }: { certifications: Certification[]; tracking: CertificationProgressRecord[] }) {
  const byId = new Map(certifications.map((certification) => [certification.id, certification]));
  const rows = tracking
    .flatMap((record) => {
      const certification = byId.get(record.certId);
      return certification ? [{ record, certification }] : [];
    })
    .sort((a, b) => TRACKING_ORDER.indexOf(b.record.status) - TRACKING_ORDER.indexOf(a.record.status) || (a.record.examDate ?? '9999').localeCompare(b.record.examDate ?? '9999'));
  if (rows.length === 0) return null;
  return (
    <Sheet title="My plan" className="mb-6" padded={false}>
      <ul className="divide-y divide-rule">
        {rows.map(({ record, certification }) => {
          const date = record.examDate ? `exam ${relativeDay(record.examDate)}` : record.targetDate ? `target ${formatDate(parseDayKey(record.targetDate))}` : undefined;
          return (
            <li key={record.certId}>
              <Link to={certificationUrl(certification.id)} className="grid grid-cols-[1.5rem_minmax(0,1fr)_auto] items-center gap-3 px-4 py-2.5 hover:bg-sheet-2">
                <Bubble state={TRACKING[record.status].bubble} />
                <span className="min-w-0 truncate font-medium">{certification.name}</span>
                <span className="flex items-center gap-3 text-sm text-ink-muted">
                  {date && <span className="tabular hidden sm:inline">{date}</span>}
                  <Tag tone={record.status === 'passed' ? 'correct' : 'neutral'}>{TRACKING[record.status].label}</Tag>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </Sheet>
  );
}
