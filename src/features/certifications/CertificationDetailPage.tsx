/**
 * One certification: status, exam facts, cost, objectives and resources (free or paid,
 * official or not), the Study Hub courses that prepare for it, where every fact was checked,
 * and the learner's own plan: status, target and exam dates, notes.
 */
import { ExternalLink, TriangleAlert } from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { Bubble } from '@/components/ui/Bubble';
import { Button } from '@/components/ui/Button';
import { ErrorState, LoadingState, Tag } from '@/components/ui/Feedback';
import { Field, Input, Textarea } from '@/components/ui/Field';
import { PageHeader, Sheet } from '@/components/ui/Sheet';
import { useCertificationProgress } from '@/data/queries';
import type { CertificationProgressRecord } from '@/data/records';
import { useCatalog } from '@/domain/content/load';
import type { Certification, CourseSummary } from '@/domain/content/types';
import { courseUrl } from '@/domain/content/urls';
import { SaveStatusText } from '@/components/SaveStatusText';
import { useAutosave } from '@/lib/useAutosave';
import { formatDate, parseDayKey, relativeDay } from '@/lib/dates';
import { CATEGORY_LABELS, CREDENTIAL_LABELS, formatCost, LEVEL_LABELS, PROVIDER_STATUS, TRACKING, TRACKING_ORDER } from './certificationLabels';
import { useCertificationTracking } from './useCertificationTracking';

export default function CertificationDetailPage() {
  const { certificationId = '' } = useParams();
  const catalog = useCatalog();
  const progress = useCertificationProgress();

  if (catalog.error) return <ErrorState title="Certification data is not built yet" error={catalog.error} />;
  if (!catalog.data || !progress.data) return <LoadingState />;
  const certification = catalog.data.certifications.find((candidate) => candidate.id === certificationId);
  if (!certification) return <ErrorState title="Certification not found" error={`No certification "${certificationId}".`} />;
  const courses = catalog.data.courses.filter((course) => certification.relatedCourses.includes(course.id) || course.certifications.includes(certification.id));
  const plannedCourses = certification.relatedCourses.filter((id) => !catalog.data.courses.some((course) => course.id === id)).length;
  return (
    <CertificationView
      certification={certification}
      courses={courses}
      plannedCourses={plannedCourses}
      record={progress.data.find((candidate) => candidate.certId === certification.id)}
    />
  );
}

function CertificationView({
  certification,
  courses,
  plannedCourses,
  record,
}: {
  certification: Certification;
  courses: CourseSummary[];
  plannedCourses: number;
  record?: CertificationProgressRecord;
}) {
  const status = certification.status === 'active' ? undefined : PROVIDER_STATUS[certification.status];
  const { exam, cost } = certification;
  const facts: Array<[string, string | undefined]> = [
    ['Questions', exam?.questions],
    ['Duration', exam?.durationMinutes ? `${exam.durationMinutes} minutes` : undefined],
    ['Passing score', exam?.passingScore],
    ['Format', exam?.format],
    ['Delivery', exam?.delivery],
    ['Valid for', exam?.validity],
    ['Cost', `${formatCost(cost)}${cost.note ? `: ${cost.note}` : ''}`],
    ['Prerequisites', certification.prerequisites],
    ['Study time', certification.studyHours ? `${certification.studyHours.min}–${certification.studyHours.max} hours (Study Hub estimate)` : undefined],
  ];

  return (
    <div className="mx-auto max-w-6xl">
      <nav aria-label="Breadcrumb" className="mb-2 text-sm text-ink-muted">
        <Link to="/certifications" className="hover:text-ink">
          Certifications
        </Link>
      </nav>
      <PageHeader
        title={certification.name}
        lead={certification.summary}
        actions={
          <a href={certification.url} target="_blank" rel="noreferrer noopener" className="inline-flex h-9 items-center gap-2 rounded-md border border-rule-strong px-3.5 text-sm font-medium hover:border-print-line hover:bg-sheet-2">
            <ExternalLink className="size-4" aria-hidden /> Official page
          </a>
        }
      >
        <div className="mt-2 flex flex-wrap gap-1.5">
          {certification.code && <Tag>{certification.code}</Tag>}
          <Tag>{certification.provider}</Tag>
          <Tag>{LEVEL_LABELS[certification.level]}</Tag>
          <Tag>{CREDENTIAL_LABELS[certification.credentialType]}</Tag>
          <Tag>{CATEGORY_LABELS[certification.category]}</Tag>
          {status && <Tag tone={status.tone}>{status.label}</Tag>}
        </div>
      </PageHeader>

      {certification.statusNote && (
        <p className="mb-6 flex max-w-[75ch] gap-2 rounded-md border border-slip/40 bg-slip-soft px-4 py-3 text-sm">
          <TriangleAlert className="mt-0.5 size-4 shrink-0 text-slip" aria-hidden />
          {certification.statusNote}
        </p>
      )}

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-6">
          <Sheet title="The exam">
            <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-[10rem_minmax(0,1fr)]">
              {facts
                .filter((fact): fact is [string, string] => Boolean(fact[1]))
                .map(([label, value]) => (
                  <div key={label} className="contents">
                    <dt className="text-sm text-ink-muted">{label}</dt>
                    <dd className="text-sm">{value}</dd>
                  </div>
                ))}
            </dl>
          </Sheet>

          {certification.objectives.length > 0 && (
            <Sheet title="What it covers">
              <ul className="flex flex-col gap-1.5">
                {certification.objectives.map((objective) => (
                  <li key={objective} className="flex items-baseline gap-2.5 text-sm">
                    <Bubble state="empty" size="sm" />
                    {objective}
                  </li>
                ))}
              </ul>
            </Sheet>
          )}

          {certification.resources.length > 0 && (
            <Sheet title="Resources" padded={false}>
              <ul className="divide-y divide-rule">
                {certification.resources.map((resource) => (
                  <li key={resource.url} className="flex flex-wrap items-center gap-2 px-4 py-2.5">
                    <a href={resource.url} target="_blank" rel="noreferrer noopener" className="min-w-0 flex-1 text-sm text-print-strong hover:underline">
                      {resource.title}
                    </a>
                    <Tag tone={resource.free ? 'correct' : 'neutral'}>{resource.free ? 'free' : 'paid'}</Tag>
                    {resource.official && <Tag>official</Tag>}
                  </li>
                ))}
              </ul>
            </Sheet>
          )}

          <Sheet title="Where these facts come from">
            <div className="flex flex-col gap-3 text-sm">
              <p className="text-ink-muted">Checked on {formatDate(parseDayKey(certification.verifiedOn))} against:</p>
              <ul className="flex flex-col gap-1">
                {certification.verificationSources.map((source) => (
                  <li key={source} className="truncate">
                    <a href={source} target="_blank" rel="noreferrer noopener" className="text-print-strong hover:underline">
                      {source}
                    </a>
                  </li>
                ))}
              </ul>
              {certification.unverified.length > 0 && (
                <div>
                  <p className="font-medium text-slip">Not confirmed by an official source:</p>
                  <ul className="mt-1 list-disc pl-5 text-ink-muted">
                    {certification.unverified.map((fact) => (
                      <li key={fact}>{fact}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </Sheet>
        </div>

        <div className="flex min-w-0 flex-col gap-6">
          <PlanSheet certification={certification} record={record} />
          <Sheet title="Prepare in Study Hub">
            {courses.length === 0 ? (
              <p className="text-sm text-ink-muted">{plannedCourses > 0 ? 'Courses for this certification are planned but not written yet.' : 'No Study Hub course targets this certification yet.'}</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {courses.map((course) => (
                  <li key={course.id}>
                    <Link to={courseUrl(course.id)} className="text-print-strong hover:underline">
                      {course.title}
                    </Link>
                    <span className="ml-2 text-xs text-ink-faint">{course.lessonCount} lessons</span>
                  </li>
                ))}
                {plannedCourses > 0 && (
                  <li className="text-xs text-ink-faint">
                    {plannedCourses} more course{plannedCourses === 1 ? ' is' : 's are'} planned.
                  </li>
                )}
              </ul>
            )}
          </Sheet>
        </div>
      </div>
    </div>
  );
}

function PlanSheet({ certification, record }: { certification: Certification; record?: CertificationProgressRecord }) {
  const { save, remove } = useCertificationTracking();
  if (!record) {
    return (
      <Sheet title="My plan">
        <div className="flex flex-col items-start gap-3">
          <p className="text-sm text-ink-muted">Track this certification to set a target date, record your exam booking and keep notes on your preparation.</p>
          <Button
            variant="primary"
            loading={save.isPending}
            onClick={() => save.mutate({ certId: certification.id, status: 'interested', notes: '', updatedAt: new Date().toISOString() })}
          >
            Track this certification
          </Button>
        </div>
      </Sheet>
    );
  }
  return <PlanEditor key={record.certId} record={record} onSave={(value) => save.mutateAsync(value)} onStop={() => remove.mutate(record.certId)} />;
}

function PlanEditor({ record, onSave, onStop }: { record: CertificationProgressRecord; onSave: (record: CertificationProgressRecord) => Promise<unknown>; onStop: () => void }) {
  const [draft, setDraft] = useState(record);
  const autosave = useAutosave(draft, onSave);
  const update = (patch: Partial<CertificationProgressRecord>) => setDraft((current) => ({ ...current, ...patch }));

  return (
    <Sheet title="My plan" aside={<SaveStatusText status={autosave.status} savedAt={autosave.savedAt} />}>
      <div className="flex flex-col gap-4">
        <ol className="flex flex-wrap gap-x-3 gap-y-2" aria-label="Status">
          {TRACKING_ORDER.map((status) => (
            <li key={status}>
              <button
                type="button"
                aria-pressed={draft.status === status}
                onClick={() => update({ status })}
                className="flex items-center gap-1.5 rounded-md px-1.5 py-1 text-sm hover:bg-sheet-2 aria-pressed:font-medium aria-pressed:text-print-strong"
              >
                <Bubble state={draft.status === status ? TRACKING[status].bubble : 'empty'} size="sm" />
                {TRACKING[status].label}
              </button>
            </li>
          ))}
        </ol>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Target date" hint={draft.targetDate ? relativeDay(draft.targetDate) : undefined}>
            {(props) => <Input {...props} type="date" value={draft.targetDate ?? ''} onChange={(event) => update({ targetDate: event.target.value || undefined })} />}
          </Field>
          <Field label="Exam date" hint={draft.examDate ? relativeDay(draft.examDate) : undefined}>
            {(props) => <Input {...props} type="date" value={draft.examDate ?? ''} onChange={(event) => update({ examDate: event.target.value || undefined })} />}
          </Field>
        </div>
        <Field label="Notes">
          {(props) => <Textarea {...props} value={draft.notes} onChange={(event) => update({ notes: event.target.value })} rows={4} placeholder="Booking reference, weak areas, practice test scores…" />}
        </Field>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            autosave.discard();
            onStop();
          }}
          className="self-start"
        >
          Stop tracking
        </Button>
      </div>
    </Sheet>
  );
}
