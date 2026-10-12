/** Display names for certification facts and the learner's tracking statuses. */
import type { BubbleState } from '@/components/ui/Bubble';
import type { CertificationStatus } from '@/data/records';
import type { Certification } from '@/domain/content/types';

export type CertificationCategory = Certification['category'];

export const CATEGORY_LABELS: Record<CertificationCategory, string> = {
  'ai-ml': 'AI and machine learning',
  cloud: 'Cloud',
  data: 'Data',
  networking: 'Networking',
  security: 'Security',
  linux: 'Linux and Kubernetes',
  software: 'Software',
  'it-fundamentals': 'IT fundamentals',
};

export const CATEGORY_ORDER: CertificationCategory[] = ['ai-ml', 'cloud', 'data', 'security', 'networking', 'linux', 'software', 'it-fundamentals'];

export const LEVEL_LABELS: Record<Certification['level'], string> = {
  foundational: 'Foundational',
  associate: 'Associate',
  professional: 'Professional',
  specialty: 'Specialty',
  expert: 'Expert',
};

export const CREDENTIAL_LABELS: Record<Certification['credentialType'], string> = {
  'professional-certification': 'Proctored exam',
  'completion-certificate': 'Course certificate',
  badge: 'Badge',
};

/** Provider status worth flagging; "active" needs no tag. */
export const PROVIDER_STATUS: Record<Exclude<Certification['status'], 'active'>, { label: string; tone: 'slip' | 'wrong' }> = {
  beta: { label: 'beta', tone: 'slip' },
  announced: { label: 'announced', tone: 'slip' },
  retiring: { label: 'retiring', tone: 'slip' },
  retired: { label: 'retired', tone: 'wrong' },
};

/** The learner's path from interest to a pass, each step with its bubble. */
export const TRACKING_ORDER: CertificationStatus[] = ['interested', 'planning', 'studying', 'booked', 'passed'];

export const TRACKING: Record<CertificationStatus, { label: string; bubble: BubbleState }> = {
  interested: { label: 'Interested', bubble: 'new' },
  planning: { label: 'Planning', bubble: 'empty' },
  studying: { label: 'Studying', bubble: 'learning' },
  booked: { label: 'Exam booked', bubble: 'review' },
  passed: { label: 'Passed', bubble: 'mastered' },
};

export function formatCost(cost: Certification['cost']): string {
  if (cost.free) return 'Free';
  if (cost.amount === undefined) return 'See provider';
  return new Intl.NumberFormat('en', { style: 'currency', currency: cost.currency ?? 'USD', maximumFractionDigits: 0 }).format(cost.amount);
}
