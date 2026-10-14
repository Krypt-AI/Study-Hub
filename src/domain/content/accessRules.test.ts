import { describe, expect, it } from 'vitest';
import { buildAccessManifest, splitSearchDocuments } from './accessManifest';
import { type AccessManifest, accessFor } from './accessRules';
import type { Course, SearchDocument } from './types';

const manifest: AccessManifest = { openCourses: ['cmpd363'], openSources: ['cmpd363-midterm-sem1-2526'] };

describe('accessFor', () => {
  it('opens university courses and their pages, and the app itself', () => {
    expect(accessFor('/content/courses/cmpd363.json', manifest)).toBe('open');
    expect(accessFor('/materials/pages/cmpd363-midterm-sem1-2526/p0001.webp', manifest)).toBe('open');
    expect(accessFor('/content/catalog.json', manifest)).toBe('open');
    expect(accessFor('/content/search-index.json', manifest)).toBe('open');
    expect(accessFor('/courses/hsk-1', manifest)).toBe('open');
  });

  it('keeps every other course, its materials and their search index for signed-in users', () => {
    expect(accessFor('/content/courses/hsk-1.json', manifest)).toBe('account');
    expect(accessFor('/materials/pages/hsk1-textbook/p0001.webp', manifest)).toBe('account');
    expect(accessFor('/materials/audio/n5/03.mp3', manifest)).toBe('account');
    expect(accessFor('/content/search-index-account.json', manifest)).toBe('account');
  });

  it('cannot be bypassed by case, escapes or odd paths', () => {
    expect(accessFor('/Content/Courses/HSK-1.json', manifest)).toBe('account');
    expect(accessFor('/MATERIALS/pages/hsk1-textbook/p0001.webp', manifest)).toBe('account');
    expect(accessFor('/content/courses/hsk%2D1.json', manifest)).toBe('account');
    expect(accessFor('/content/courses/cmpd363%2f..%2fhsk-1.json', manifest)).toBe('account');
    expect(accessFor('/content/courses/%E0%A4%A.json', manifest)).toBe('account');
    expect(accessFor('/materials/hsk1-textbook', manifest)).toBe('account');
    expect(accessFor('/content/search-index-account.json'.toUpperCase(), manifest)).toBe('account');
  });

  it('locks everything when the manifest could not be loaded', () => {
    const empty = { openCourses: [], openSources: [] };
    expect(accessFor('/content/courses/cmpd363.json', empty)).toBe('account');
    expect(accessFor('/materials/pages/cmpd363-midterm-sem1-2526/p0001.webp', empty)).toBe('account');
  });
});

const course = (id: string, category: Course['category'], body: unknown): Course => ({ id, category, units: [body] }) as unknown as Course;

describe('buildAccessManifest', () => {
  it('opens university courses and only the sources no locked course uses', () => {
    const courses = [
      course('CMPD363', 'university', {
        lessons: [{ blocks: [{ kind: 'source-pages', sourceId: 'cmpd363-paper', pages: [1] }], questions: [{ media: [{ kind: 'page-image', sourceId: 'shared-book', page: 2 }] }] }],
      }),
      course('hsk-1', 'chinese', { lessons: [{ questions: [{ media: [{ kind: 'page-image', sourceId: 'shared-book', page: 3 }, { kind: 'audio', src: '/materials/audio/hsk1/01.mp3' }] }] }] }),
    ];
    expect(buildAccessManifest(courses)).toEqual({ openCourses: ['cmpd363'], openSources: ['cmpd363-paper'] });
  });

  it('opens primary and secondary school courses to guests, like University', () => {
    const lesson = { lessons: [{ questions: [] }] };
    const courses = [course('sains-t3', 'elementary', lesson), course('sejarah-f2', 'secondary', lesson), course('jlpt-n5', 'japanese', lesson)];
    expect(buildAccessManifest(courses).openCourses).toEqual(['sains-t3', 'sejarah-f2']);
  });
});

describe('splitSearchDocuments', () => {
  it('puts open courses, certifications and roadmaps in the open index', () => {
    const document = (id: string, courseId?: string) => ({ id, courseId }) as SearchDocument;
    const { open, account } = splitSearchDocuments([document('a', 'cmpd363'), document('b', 'hsk-1'), document('c')], manifest);
    expect(open.map((item) => item.id)).toEqual(['a', 'c']);
    expect(account.map((item) => item.id)).toEqual(['b']);
  });
});
