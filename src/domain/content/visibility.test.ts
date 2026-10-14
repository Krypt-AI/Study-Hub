import { describe, expect, it } from 'vitest';
import type { LearnerProfile } from '@/domain/profile/profile';
import type { CourseCategory, CourseLanguage } from './types';
import { extrasOf, learnerYearFirst, otherLanguageCourse, type Visibility, visibleCertifications, visibleCourses } from './visibility';

const course = (id: string, category: CourseCategory, school?: { year: number; subject: string; language: CourseLanguage }) => ({ id, category, ...school });

const COURSES = [
  course('cmpd2123', 'university'),
  course('sains-t3-ms', 'elementary', { year: 3, subject: 'science', language: 'ms' }),
  course('science-y3-en', 'elementary', { year: 3, subject: 'science', language: 'en' }),
  course('bm-t3', 'elementary', { year: 3, subject: 'bahasa-melayu', language: 'ms' }),
  course('maths-t1', 'elementary', { year: 1, subject: 'mathematics', language: 'ms' }),
  course('sejarah-f2', 'secondary', { year: 2, subject: 'history', language: 'ms' }),
  course('hsk-1', 'chinese'),
  course('jlpt-n5', 'japanese'),
  course('ai-01-python', 'ai-engineering'),
  course('it-networking', 'it'),
];

const PRIMARY: LearnerProfile = { age: 9, level: 'elementary', year: 3 };
const SECONDARY: LearnerProfile = { age: 14, level: 'secondary', year: 2 };
const UNIVERSITY: LearnerProfile = { age: 20, level: 'university' };

const visibility = (profile: LearnerProfile, extras: Partial<Visibility> = {}): Visibility => ({ profile, extrasAllowed: false, visibleCategories: [], languageBySubject: {}, ...extras });
const ids = (shown: { id: string }[]) => shown.map((entry) => entry.id);

describe('which courses a learner sees', () => {
  it('shows a guest their own level only, every year of it, in BM where a subject has both', () => {
    expect(ids(visibleCourses(COURSES, visibility(PRIMARY)))).toEqual(['sains-t3-ms', 'bm-t3', 'maths-t1']);
    expect(ids(visibleCourses(COURSES, visibility(SECONDARY)))).toEqual(['sejarah-f2']);
    expect(ids(visibleCourses(COURSES, visibility(UNIVERSITY)))).toEqual(['cmpd2123']);
  });

  it('keeps a guest from extras even if some were chosen on another visit', () => {
    expect(ids(visibleCourses(COURSES, visibility(UNIVERSITY, { visibleCategories: ['japanese'] })))).toEqual(['cmpd2123']);
  });

  it('shows a signed-in learner their level and no extras until they choose some', () => {
    expect(ids(visibleCourses(COURSES, visibility(PRIMARY, { extrasAllowed: true })))).toEqual(['sains-t3-ms', 'bm-t3', 'maths-t1']);
    expect(ids(visibleCourses(COURSES, visibility(PRIMARY, { extrasAllowed: true, visibleCategories: ['chinese', 'it'] })))).toEqual(['sains-t3-ms', 'bm-t3', 'maths-t1', 'hsk-1', 'it-networking']);
  });

  it('shows the language the learner picked for a subject, and only for that subject', () => {
    const english = visibility(PRIMARY, { languageBySubject: { science: 'en' } });
    expect(ids(visibleCourses(COURSES, english))).toEqual(['science-y3-en', 'bm-t3', 'maths-t1']);
    expect(otherLanguageCourse(COURSES[2]!, COURSES)?.id).toBe('sains-t3-ms');
    expect(otherLanguageCourse(COURSES[3]!, COURSES)).toBeUndefined();
  });

  it('keeps a subject taught in one language whatever language was picked', () => {
    expect(ids(visibleCourses(COURSES, visibility(PRIMARY, { languageBySubject: { 'bahasa-melayu': 'en' } })))).toContain('bm-t3');
  });

  it('lists the learner’s year first, then the other years in order', () => {
    expect(ids(learnerYearFirst(visibleCourses(COURSES, visibility(PRIMARY)), { ...PRIMARY, year: 1 }))).toEqual(['maths-t1', 'sains-t3-ms', 'bm-t3']);
    expect(ids(learnerYearFirst(visibleCourses(COURSES, visibility(PRIMARY)), PRIMARY))).toEqual(['sains-t3-ms', 'bm-t3', 'maths-t1']);
  });
});

describe('which certifications a learner sees', () => {
  const certifications = [
    { id: 'jlpt-n5', category: 'japanese' as const },
    { id: 'aws-ml', category: 'ai-ml' as const },
    { id: 'ccna', category: 'networking' as const },
  ];

  it('follows the extras: languages to their tests, AI to AI and data, the rest to IT', () => {
    expect(ids(visibleCertifications(certifications, visibility(UNIVERSITY, { extrasAllowed: true, visibleCategories: ['japanese', 'it'] })))).toEqual(['jlpt-n5', 'ccna']);
    expect(ids(visibleCertifications(certifications, visibility(UNIVERSITY, { extrasAllowed: true, visibleCategories: ['ai-engineering'] })))).toEqual(['aws-ml']);
    expect(visibleCertifications(certifications, visibility(UNIVERSITY))).toEqual([]);
  });
});

describe('the extras ticked before a learner chooses', () => {
  it('are the extras where they already have progress or saved questions, in the usual order', () => {
    expect(extrasOf(['it-networking', 'cmpd2123', 'hsk-1', 'hsk-1'], COURSES)).toEqual(['chinese', 'it']);
    expect(extrasOf([], COURSES)).toEqual([]);
  });
});
