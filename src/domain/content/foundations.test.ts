import { describe, expect, it } from 'vitest';
import { certificationsBuiltOn, foundationModules } from './foundations';
import type { Certification, CertificationFoundation } from './types';

const course = {
  units: [
    { id: 'linux.m00', title: 'Module 0' },
    { id: 'linux.m01', title: 'Module 1' },
    { id: 'linux.m02', title: 'Module 2' },
  ],
  lessons: [
    { id: 'l0', title: 'Intro', unitId: 'linux.m00' },
    { id: 'l1a', title: 'Commands', unitId: 'linux.m01' },
    { id: 'l1b', title: 'Paths', unitId: 'linux.m01' },
    { id: 'l2', title: 'Files', unitId: 'linux.m02' },
  ],
};

const foundation = (relevance: CertificationFoundation['relevance']): CertificationFoundation => ({
  courseId: 'linux-fundamentals',
  relevance,
  unitIds: [],
  reason: '',
  officialRequirement: 'None.',
  concepts: [],
  beyond: [],
  timing: '',
  next: '',
  sources: [{ title: 'Official page', url: 'https://example.org/', checkedOn: '2026-10-18' }],
});

const certification = (id: string, foundations: CertificationFoundation[]) => ({ id, foundations }) as unknown as Certification;

describe('foundationModules', () => {
  it('lists the named units in the foundation’s order, with their lessons', () => {
    const modules = foundationModules(course, { unitIds: ['linux.m02', 'linux.m01'] });
    expect(modules.map((module) => module.id)).toEqual(['linux.m02', 'linux.m01']);
    expect(modules[1]?.lessons.map((lesson) => lesson.id)).toEqual(['l1a', 'l1b']);
  });

  it('lists every unit when the foundation names none', () => {
    expect(foundationModules(course, { unitIds: [] }).map((module) => module.id)).toEqual(['linux.m00', 'linux.m01', 'linux.m02']);
  });
});

describe('certificationsBuiltOn', () => {
  it('orders the certifications that build on a course from essential to optional', () => {
    const certifications = [
      certification('cloud', [foundation('optional')]),
      certification('other', []),
      certification('lfcs', [foundation('essential')]),
      certification('security', [foundation('strongly-recommended')]),
    ];
    expect(certificationsBuiltOn(certifications, 'linux-fundamentals').map((use) => use.certification.id)).toEqual(['lfcs', 'security', 'cloud']);
    expect(certificationsBuiltOn(certifications, 'another-course')).toEqual([]);
  });
});
