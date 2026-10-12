/**
 * Certifications: the learner's plan first, then every certification by area with its
 * provider status, credential type and cost, all checked against official sources.
 */
import { Map as MapIcon } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { Bubble } from '@/components/ui/Bubble';
import { ButtonLink } from '@/components/ui/Button';
import { EmptyState, ErrorState, LoadingState, Tag } from '@/components/ui/Feedback';
import { Input } from '@/components/ui/Field';
import { PageHeader, Sheet } from '@/components/ui/Sheet';
import { Tabs } from '@/components/ui/Tabs';
import { useCertificationProgress } from '@/data/queries';
import type { CertificationProgressRecord } from '@/data/records';
import { useCatalog } from '@/domain/content/load';
import type { Certification } from '@/domain/content/types';
import { certificationUrl } from '@/domain/content/urls';
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

type Filter = 'all' | CertificationCategory;

export default function CertificationsPage() {
  const catalog = useCatalog();
  const progress = useCertificationProgress();
  const [category, setCategory] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const [includeRetired, setIncludeRetired] = useState(false);

  const tracking = useMemo(() => new Map((progress.data ?? []).map((record) => [record.certId, record])), [progress.data]);

  if (catalog.error) return <ErrorState title="Certification data is not built yet" error={catalog.error} />;
  if (!catalog.data) return <LoadingState />;
  const certifications = catalog.data.certifications;
  const retiredCount = certifications.filter((certification) => certification.status === 'retired').length;
  const needle = query.trim().toLowerCase();
  const visible = certifications.filter(
    (certification) =>
      (category === 'all' || certification.category === category) &&
      (includeRetired || certification.status !== 'retired' || tracking.has(certification.id)) &&
      (!needle || `${certification.name} ${certification.code ?? ''} ${certification.provider}`.toLowerCase().includes(needle)),
  );
  const checkedOn = certifications.map((certification) => certification.verifiedOn).sort().at(-1);
  const categories = CATEGORY_ORDER.filter((key) => certifications.some((certification) => certification.category === key));

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Certifications"
        lead={`AI engineering and IT certifications${checkedOn ? `, checked against each provider's official pages on ${formatDate(parseDayKey(checkedOn))}` : ''}. Prices and exam formats change, so confirm on the provider's site before you book.`}
        actions={<ButtonLink to="/roadmaps/ai-engineering" icon={<MapIcon className="size-4" />}>AI engineering roadmap</ButtonLink>}
      />

      <MyPlan certifications={certifications} tracking={progress.data ?? []} />

      <div className="mb-5 flex flex-col gap-3">
        <Tabs<Filter>
          label="Area"
          value={category}
          onChange={setCategory}
          items={[
            { id: 'all', label: 'All', count: certifications.length },
            ...categories.map((key) => ({ id: key, label: CATEGORY_LABELS[key], count: certifications.filter((certification) => certification.category === key).length })),
          ]}
        />
        <div className="flex flex-wrap items-center gap-4">
          <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Filter by name, code or provider" aria-label="Filter certifications" className="max-w-xs" />
          {retiredCount > 0 && (
            <label className="flex items-center gap-2 text-sm text-ink-muted">
              <input type="checkbox" checked={includeRetired} onChange={(event) => setIncludeRetired(event.target.checked)} className="size-4 accent-[var(--print)]" />
              Show retired ({retiredCount})
            </label>
          )}
        </div>
      </div>

      {visible.length === 0 && <EmptyState title="No certifications match these filters" />}
      <div className="flex flex-col gap-6">
        {categories.map((key) => {
          const rows = visible.filter((certification) => certification.category === key);
          if (rows.length === 0) return null;
          return (
            <Sheet key={key} title={CATEGORY_LABELS[key]} aside={<span className="tabular">{rows.length}</span>} padded={false}>
              <ul className="divide-y divide-rule">
                {rows.map((certification) => (
                  <CertificationRow key={certification.id} certification={certification} record={tracking.get(certification.id)} />
                ))}
              </ul>
            </Sheet>
          );
        })}
      </div>
    </div>
  );
}

function CertificationRow({ certification, record }: { certification: Certification; record?: CertificationProgressRecord }) {
  const status = certification.status === 'active' ? undefined : PROVIDER_STATUS[certification.status];
  return (
    <li>
      <Link to={certificationUrl(certification.id)} className="grid grid-cols-[1.5rem_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 px-4 py-3 hover:bg-sheet-2">
        <Bubble state={record ? TRACKING[record.status].bubble : 'empty'} title={record ? TRACKING[record.status].label : 'Not tracking'} />
        <span className="min-w-0">
          <span className="block truncate font-medium">
            {certification.name}
            {certification.code && <span className="ml-2 text-sm font-normal text-ink-muted">{certification.code}</span>}
          </span>
          <span className="block truncate text-sm text-ink-muted">
            {certification.provider} · {LEVEL_LABELS[certification.level]} · {CREDENTIAL_LABELS[certification.credentialType]}
          </span>
        </span>
        <span className="flex items-center gap-2">
          {status && <Tag tone={status.tone}>{status.label}</Tag>}
          <span className="tabular w-20 text-right text-sm">{formatCost(certification.cost)}</span>
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
