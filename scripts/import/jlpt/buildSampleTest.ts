/**
 * Builds a JLPT level course from the official-format sample test in your materials:
 * practice lessons per part (one question at a time, instant feedback) and a timed mock
 * exam that mirrors the paper test (question booklet pages + answer sheet + audio).
 *
 * N5–N3 have three timed parts (vocabulary / grammar & reading / listening); N2 and N1
 * combine the first two into one language-knowledge & reading part. Each question is
 * shown from the booklet that prints its 問題 header.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { OcrLine, OcrPage, SourceInfo } from '../ocr.ts';
import { type CourseInput, type QuestionInput } from '../shared.ts';
import type { AnswerKeyItem, TestPart } from './answerKey.ts';
import { agreesWithScript, type Segment, segmentSection } from './audioSegments.ts';
import type { Transcript } from './script.ts';

export type JlptLevel = 'N5' | 'N4' | 'N3' | 'N2' | 'N1';
type BookletKey = 'vocab' | 'grammar' | 'reading' | 'listening';
type Booklet = { source: SourceInfo; pages: OcrPage[] };

export interface SampleTestInput {
  level: JlptLevel;
  answers: AnswerKeyItem[];
  transcripts: Transcript[];
  booklets: Record<BookletKey, Booklet>;
  answerSource: SourceInfo;
  /** Section time limits printed on the booklet covers, in minutes, for the parts this level has. */
  minutes: Partial<Record<TestPart, number>>;
}

interface AudioClip {
  file: string;
  section?: number;
  /** Absent when the clip is the recording of a whole section (N2, N1). */
  question?: number;
  /** Whole-section recordings: length and pauses ([start, length] in seconds), measured by the pipeline. */
  duration?: number;
  silences?: Array<[number, number]>;
}

const PART_TITLES: Record<TestPart, string> = {
  vocab: '言語知識（文字・語彙） Vocabulary',
  'grammar-reading': '言語知識（文法）・読解 Grammar & Reading',
  language: '言語知識（文字・語彙・文法）・読解 Language Knowledge & Reading',
  listening: '聴解 Listening',
};

const PART_NAMES: Record<TestPart, string> = {
  vocab: 'vocabulary',
  'grammar-reading': 'grammar & reading',
  language: 'language knowledge & reading',
  listening: 'listening',
};

/** Booklets that can hold the questions of each part. */
const PART_BOOKLETS: Record<TestPart, BookletKey[]> = {
  vocab: ['vocab'],
  'grammar-reading': ['grammar', 'reading'],
  language: ['vocab', 'grammar', 'reading'],
  listening: ['listening'],
};

const BOOKLET_LABELS: Record<BookletKey, string> = { vocab: '文字・語彙', grammar: '文法', reading: '読解', listening: '聴解' };

const OPTIONS = ['1', '2', '3', '4'].map((id) => ({ id, text: id }));

/**
 * Current official section times (minutes, in the order of the level's parts).
 * Sources (checked 2026-10-11): https://www.jlpt.jp/e/topics/202009091599642827.html (N5, N4 since December 2020)
 * and https://www.jlpt.jp/e/guideline/testsections.html (N3–N1; N1 listening 55 min since December 2022).
 */
const CURRENT_OFFICIAL_MINUTES: Record<JlptLevel, number[]> = {
  N5: [20, 40, 30],
  N4: [25, 55, 35],
  N3: [30, 70, 40],
  N2: [105, 50],
  N1: [110, 55],
};

/** Question-number boxes sit in the left margin of a booklet page. */
const NUMBER_COLUMN: [number, number] = [0.09, 0.125];
/** Text-layer booklets draw the number boxes with an embedded font whose glyphs carry no digits. */
const GLYPH_NUMBER_COLUMN: [number, number] = [0.1, 0.16];
const UNDECODABLE_GLYPHS = /^[\p{Cc}\p{Co}]+$/u;
const PAGE_BODY_BOTTOM = 0.94;

const toHalfWidth = (text: string) => text.replace(/[０-９]/gu, (digit) => String.fromCharCode(digit.charCodeAt(0) - 0xfee0));
/** "3-1" (sub-question 1 of question 3) -> 3. */
const questionNumber = (item: AnswerKeyItem) => Number.parseInt(item.number, 10);
const isExample = (item: AnswerKeyItem) => item.number === '0';

function loadAudioManifest(level: string): AudioClip[] {
  try {
    return JSON.parse(readFileSync(join(process.cwd(), 'public', 'materials', 'audio', level.toLowerCase(), 'manifest.json'), 'utf8')) as AudioClip[];
  } catch {
    return [];
  }
}

interface MondaiIndex {
  /** Pages of each もんだい / 問題 section, from the page that starts it. */
  pages: Map<number, number[]>;
  /** Sections whose questions are blanks in one passage (文章), so they need the whole page. */
  passages: Set<number>;
}

const INSTRUCTION_ROW_HEIGHT = 0.04;

function indexMondai(pages: OcrPage[]): MondaiIndex {
  const index: MondaiIndex = { pages: new Map(), passages: new Set() };
  let current = 0;
  for (const page of pages) {
    const header = page.lines
      .map((line) => ({ line, match: /^(?:もんだい|問題)\s*(\d{1,2})/u.exec(toHalfWidth(line.text.trim())) }))
      .find(({ line, match }) => match && line.bbox[0] < 0.3);
    if (header?.match) {
      current = Number(header.match[1]);
      const instruction = page.lines.filter((line) => Math.abs(line.bbox[1] - header.line.bbox[1]) < INSTRUCTION_ROW_HEIGHT);
      if (instruction.some((line) => /文章|ぶんしょう/u.test(line.text))) index.passages.add(current);
    }
    if (current > 0) index.pages.set(current, [...(index.pages.get(current) ?? []), page.page]);
  }
  return index;
}

const inColumn = (line: OcrLine, [from, to]: [number, number]) => line.bbox[0] > from && line.bbox[0] < to && line.bbox[1] < PAGE_BODY_BOTTOM;

/**
 * Position of each printed question number in a booklet. OCR'd pages read the digits;
 * text-layer pages only mark where a number box is, so those anchors are numbered in
 * reading order, and only when there is exactly one per expected question.
 */
function questionPositions(pages: OcrPage[], expected: number[]): Map<number, { page: number; y: number }> {
  const positions = new Map<number, { page: number; y: number }>();
  const anchors: Array<{ page: number; y: number }> = [];
  for (const page of pages) {
    for (const line of [...page.lines].sort((a, b) => a.bbox[1] - b.bbox[1])) {
      const text = line.text.trim();
      if (/^\d{1,2}$/u.test(text) && inColumn(line, NUMBER_COLUMN) && !positions.has(Number(text))) {
        positions.set(Number(text), { page: page.page, y: line.bbox[1] });
      } else if (page.method === 'text-layer' && UNDECODABLE_GLYPHS.test(line.text) && inColumn(line, GLYPH_NUMBER_COLUMN)) {
        anchors.push({ page: page.page, y: line.bbox[1] });
      }
    }
  }
  if (positions.size === 0 && anchors.length === expected.length) {
    expected.forEach((number, index) => positions.set(number, anchors[index]!));
  }
  return positions;
}

function questionCrop(number: number, positions: Map<number, { page: number; y: number }>) {
  const here = positions.get(number);
  if (!here) return undefined;
  const next = positions.get(number + 1);
  const bottom = next && next.page === here.page ? next.y - 0.01 : PAGE_BODY_BOTTOM;
  return { page: here.page, crop: [0.04, Math.max(0, here.y - 0.012), 0.96, bottom] as [number, number, number, number] };
}

/**
 * Booklets leave the backs of section openings blank, printed with a grey pattern and at
 * most a running header, page number and side tab. Such pages carry nothing to read.
 */
function isFillerPage(page: OcrPage): boolean {
  return !page.lines.some((line) => line.bbox[1] >= 0.06 && line.bbox[1] <= 0.92 && line.bbox[0] < 0.88);
}

function withoutFillerPages(booklets: Record<BookletKey, Booklet>): Record<BookletKey, Booklet> {
  return Object.fromEntries(
    Object.entries(booklets).map(([key, booklet]) => [key, { ...booklet, pages: booklet.pages.filter((page) => !isFillerPage(page)) }]),
  ) as Record<BookletKey, Booklet>;
}

export function buildSampleTestCourse(input: SampleTestInput): CourseInput {
  const booklets = withoutFillerPages(input.booklets);
  const level = input.level.toLowerCase();
  const courseId = `jlpt-${level}`;
  const parts = (['vocab', 'grammar-reading', 'language', 'listening'] as const).filter((part) => input.answers.some((item) => item.part === part));
  const clips = loadAudioManifest(input.level);
  const transcriptFor = (mondai: number, question: number) => input.transcripts.find((t) => t.mondai === mondai && t.question === question);
  const mondai = Object.fromEntries(
    (Object.keys(booklets) as BookletKey[]).map((key) => [key, indexMondai(booklets[key].pages)]),
  ) as Record<BookletKey, MondaiIndex>;
  const answerSourceRef = { origin: 'user-material' as const, sourceId: input.answerSource.id, title: input.answerSource.title };

  /** The booklet of a written question: the one of its part that prints the question's 問題 header. */
  const bookletOf = (item: AnswerKeyItem): BookletKey => {
    const candidates = PART_BOOKLETS[item.part];
    return candidates.find((key) => mondai[key].pages.has(item.mondai)) ?? candidates[0]!;
  };
  // Single questions are cropped from the vocabulary and grammar booklets; reading and
  // passage-cloze questions need their passage, so they show whole pages.
  const croppable: BookletKey[] = ['vocab', 'grammar'];
  const positions = Object.fromEntries(
    croppable.map((key) => {
      const expected = input.answers
        .filter((item) => item.part !== 'listening' && !isExample(item) && bookletOf(item) === key)
        .map(questionNumber);
      return [key, questionPositions(booklets[key].pages, expected)];
    }),
  ) as Record<'vocab' | 'grammar', Map<number, { page: number; y: number }>>;

  /**
   * Each question's span in a whole-section recording, when the pauses give a cut that also
   * agrees with the script lengths; otherwise undefined and the question plays the whole section.
   */
  const sectionSegments = new Map<number, Map<number, Segment> | undefined>();
  const segmentsOf = (section: number) => {
    if (sectionSegments.has(section)) return sectionSegments.get(section);
    const recording = clips.find((candidate) => candidate.section === section && candidate.question === undefined);
    const items = input.answers.filter((item) => item.part === 'listening' && item.mondai === section);
    const questions = [...new Set(items.filter((item) => !isExample(item)).map(questionNumber))];
    const scriptLengths = new Map(input.transcripts.filter((t) => t.mondai === section).map((t) => [t.question, t.lines.join('').length]));
    const segments =
      recording?.duration !== undefined && recording.silences
        ? segmentSection({ duration: recording.duration, silences: recording.silences }, questions, items.some(isExample))
        : undefined;
    const trusted = segments && agreesWithScript(segments, scriptLengths) ? segments : undefined;
    sectionSegments.set(section, trusted);
    return trusted;
  };

  function listeningMedia(item: AnswerKeyItem, label: string) {
    const question = questionNumber(item);
    const clip =
      clips.find((candidate) => candidate.section === item.mondai && candidate.question === question) ??
      clips.find((candidate) => candidate.section === item.mondai && candidate.question === undefined);
    const pages = mondai.listening.pages.get(item.mondai) ?? [];
    const span = clip?.question === undefined ? segmentsOf(item.mondai)?.get(question) : undefined;
    const title =
      clip?.question === undefined && !span ? `問題${item.mondai} (whole section; find ${label} in the recording)` : `問題${item.mondai} ${label}`;
    return {
      clip,
      media: [
        ...(clip ? [{ kind: 'audio' as const, src: `/materials/audio/${level}/${clip.file}`, title, ...(span && { start: span.start, end: span.end }) }] : []),
        ...pages.map((page) => ({ kind: 'page-image' as const, sourceId: booklets.listening.source.id, page })),
      ],
    };
  }

  function practiceQuestion(item: AnswerKeyItem, idPrefix: string): QuestionInput {
    const example = isExample(item);
    const label = example ? '例 (example)' : item.number;
    const topic = `${courseId}.${item.part}`;
    const booklet = item.part === 'listening' ? 'listening' : bookletOf(item);
    const group = `${BOOKLET_LABELS[booklet]} 問題${item.mondai}`;
    const base = {
      id: `${idPrefix}.m${item.mondai}.q${example ? 'ex' : item.number}`,
      type: 'choice' as const,
      skill: 'recognize' as const,
      topics: [topic],
      options: OPTIONS,
      correct: [String(item.answer)],
      shuffle: false,
      tags: ['jlpt', input.level, item.part],
      answerHint: 'Choose the number of the answer as printed in the question booklet.',
      sheet: { group, number: example ? '例' : item.number },
    };

    if (item.part === 'listening') {
      const { clip, media } = listeningMedia(item, label);
      const transcript = transcriptFor(item.mondai, questionNumber(item));
      return {
        ...base,
        prompt: `**${group}** · Question ${label}: listen, then choose the answer.`,
        media,
        explanation: transcript ? `**Script (聴解スクリプト)**\n\n${transcript.lines.join('  \n')}` : undefined,
        source: { ...answerSourceRef, flags: clip ? [] : ['audio-missing'] },
      };
    }

    const source = booklets[booklet].source;
    const standalone = (booklet === 'vocab' || booklet === 'grammar') && !mondai[booklet].passages.has(item.mondai);
    const crop = standalone ? questionCrop(questionNumber(item), positions[booklet]) : undefined;
    const pages = mondai[booklet].pages.get(item.mondai) ?? [];
    return {
      ...base,
      prompt: `**${group}** · Question ${label}`,
      media: crop
        ? [{ kind: 'page-image' as const, sourceId: source.id, page: crop.page, crop: crop.crop }]
        : pages.map((page) => ({ kind: 'page-image' as const, sourceId: source.id, page })),
      source: { origin: 'user-material' as const, sourceId: source.id, title: source.title, page: crop?.page ?? pages[0] },
    };
  }

  const minutesOf = (part: TestPart) => input.minutes[part] ?? 0;
  const bookletPages = (part: TestPart) => PART_BOOKLETS[part].map((key) => booklets[key]);
  const usesSectionRecordings = clips.length > 0 && clips.every((clip) => clip.question === undefined);
  const wholeSections = usesSectionRecordings
    ? [...new Set(input.answers.filter((item) => item.part === 'listening').map((item) => item.mondai))].filter((section) => !segmentsOf(section))
    : [];
  const recordingNote = !usesSectionRecordings
    ? ''
    : ' Your materials have one recording per 問題 section; each question plays only its own part of it' +
      (wholeSections.length ? `, except in ${wholeSections.map((section) => `問題${section}`).join(', ')}, where the questions could not be located reliably and the whole section plays.` : '.');

  const lessons = parts.map((part) => {
    const items = input.answers.filter((item) => item.part === part);
    return {
      id: `${courseId}.${part}`,
      title: PART_TITLES[part],
      summary: `${items.filter((item) => !isExample(item)).length} questions from the official-format sample test, one at a time with the answer key.`,
      estimatedMinutes: minutesOf(part),
      topics: [`${courseId}.${part}`],
      blocks: [
        {
          kind: 'callout' as const,
          tone: 'info' as const,
          body:
            'Practice mode: each question shows its part of the test booklet; pick the answer number and get instant feedback. ' +
            'For exam conditions, take the timed **mock exam** from the course page instead.' +
            (part === 'listening' ? recordingNote : ''),
        },
        ...bookletPages(part).map((booklet) => ({
          kind: 'source-pages' as const,
          sourceId: booklet.source.id,
          pages: booklet.pages.map((page) => page.page),
          caption: booklet.source.title,
        })),
      ],
      questions: items.map((item) => practiceQuestion(item, `${courseId}.${part}`)),
      source: answerSourceRef,
    };
  });

  const mockSections = parts.map((part) => ({
    id: `${courseId}.mock.${part}`,
    title: PART_TITLES[part],
    timeLimitMinutes: minutesOf(part),
    instructions:
      part === 'listening'
        ? 'Play each clip once, as in the real test, and mark your answers. The scripts are shown when you finish.'
        : 'Read the question booklet on the left and mark one answer per question on the answer sheet.',
    media: bookletPages(part).flatMap((booklet) =>
      booklet.pages.slice(1).map((page) => ({ kind: 'page-image' as const, sourceId: booklet.source.id, page: page.page })),
    ),
    // Questions keep their own media so they still make sense when they come back in reviews;
    // while the exam is sat, the page shows the section booklet and plays only the audio.
    questions: input.answers.filter((item) => item.part === part && !isExample(item)).map((item) => practiceQuestion(item, `${courseId}.mock.${part}`)),
  }));

  const printedMinutes = parts.map(minutesOf);
  const officialMinutes = CURRENT_OFFICIAL_MINUTES[input.level];
  const timingNote =
    officialMinutes.join() === printedMinutes.join()
      ? `These match the current official JLPT ${input.level} times (jlpt.jp).`
      : `The current official JLPT ${input.level} times are ${officialMinutes.join(' / ')} min (jlpt.jp), so the real exam is paced a little differently from this older sample.`;

  return {
    id: courseId,
    title: `JLPT ${input.level}`,
    subtitle: 'Official-format sample test from your JLPT Workbook',
    description:
      `The JLPT ${input.level} sample test from your materials (${parts.map((part) => PART_NAMES[part]).join(', ')} with audio). ` +
      'Practise each part question by question with the official answer key, then take the timed mock exam.',
    category: 'japanese',
    subject: 'jlpt',
    level: input.level,
    difficulty: input.level === 'N5' || input.level === 'N4' ? 'beginner' : input.level === 'N3' ? 'intermediate' : 'advanced',
    tags: ['JLPT', 'Japanese', 'mock exam', 'listening'],
    prerequisites: input.level === 'N5' ? [] : [`jlpt-n${Number(input.level[1]) + 1}`],
    estimatedHours: 4,
    topics: parts.map((part) => ({ id: `${courseId}.${part}`, title: PART_TITLES[part] })),
    units: [{ id: `${courseId}.practice`, title: 'Practice by part', lessons }],
    assessments: [
      {
        id: `${courseId}.mock`,
        title: `JLPT ${input.level} mock exam`,
        kind: 'mock-exam',
        description: `Timed as printed on the booklets (${printedMinutes.map((minutes) => `${minutes} min`).join(' / ')}). ${timingNote}`,
        timeLimitMinutes: printedMinutes.reduce((sum, minutes) => sum + minutes, 0),
        sections: mockSections,
        source: answerSourceRef,
      },
    ],
    source: answerSourceRef,
    contentNotice:
      'Questions are shown as the original booklet pages; answers come from the official answer key in your materials ' +
      '(parsed from its text layer and validated: every answer is 1–4 and the numbering has no gaps).',
  };
}
