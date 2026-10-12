/**
 * Builds the 新にほんご500問 course: one unit per week, one lesson per day.
 * Multiple-choice questions show the original question box (so underlines, blanks and
 * options are exactly as printed) with numbered answers from the book's answer pages.
 * Typed-answer variants are generated only where the correct option's text was
 * independently confirmed on the answer page.
 */
import { REASSURING_FLAGS } from '../../../src/domain/content/flags.ts';
import { canonicalKana } from '../../../src/domain/evaluation/kana.ts';
import type { SourceInfo } from '../ocr.ts';
import type { CourseInput, QuestionInput } from '../shared.ts';
import type { Shin500Category, Shin500Item } from './shin500.ts';

const CATEGORY_LABELS: Record<Shin500Category, string> = {
  moji: '文字 Kanji & kana',
  goi: '語彙 Vocabulary',
  bunpou: '文法 Grammar',
};

const INSTRUCTIONS: Record<Shin500Category, string> = {
  moji: 'Choose the correct reading or writing of the underlined word.',
  goi: 'Choose the best word for the blank.',
  bunpou: 'Choose the best expression for the blank.',
};

const KANA_ONLY = /^[\p{Script=Hiragana}\p{Script=Katakana}ー]+$/u;
const QUESTION_X: [number, number] = [0.1, 0.9];

interface Edition {
  /** Level range as written in the title, e.g. "N4–N5". */
  title: string;
  /** Course level, easiest first, e.g. "N5–N4". */
  level: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  prerequisites: string[];
}

/** The four books of the series, keyed by pipeline source id (= course id). */
const EDITIONS: Record<string, Edition> = {
  'shin500-n4n5': { title: 'N4–N5', level: 'N5–N4', difficulty: 'beginner', prerequisites: [] },
  'shin500-n3': { title: 'N3', level: 'N3', difficulty: 'intermediate', prerequisites: ['shin500-n4n5'] },
  'shin500-n2': { title: 'N2', level: 'N2', difficulty: 'advanced', prerequisites: ['shin500-n3'] },
  'shin500-n1': { title: 'N1', level: 'N1', difficulty: 'advanced', prerequisites: ['shin500-n2'] },
};

/** Flags that mean the item cannot be graded reliably until it is reviewed against the page. */
const BLOCKING = ['answer-missing'];

export interface Shin500BuildStats {
  total: number;
  withTypedVariant: number;
  excluded: Array<{ number: number; flags: string[] }>;
  needsReview: Array<{ number: number; flags: string[] }>;
}

function typedVariant(courseId: string, item: Shin500Item, base: Omit<QuestionInput, 'id' | 'type' | 'prompt'>, topic: string): QuestionInput | undefined {
  const correct = item.options[item.answer - 1];
  const clean = item.flags.every((flag) => flag === 'option-number-inferred');
  const unique = new Set(item.options.map((option) => canonicalKana(option))).size === item.options.length;
  if (!correct || !clean || !unique || item.day === 7) return undefined;

  const kana = KANA_ONLY.test(correct);
  const prompt =
    item.category === 'moji'
      ? kana
        ? 'Type the reading of the underlined word in hiragana.'
        : 'Type the underlined word in kanji (use a Japanese input method).'
      : 'Type the word that fills the blank.';
  return {
    ...base,
    id: `${courseId}.q${item.number}.typed`,
    type: 'short',
    skill: 'recall',
    difficulty: 3,
    prompt: `**Question ${item.number}** · ${prompt}`,
    topics: [topic],
    accepted: [correct],
    match: kana ? { mode: 'kana', acceptRomaji: true } : { mode: 'hanzi' },
    language: 'ja',
    answerHint: kana ? 'Hiragana, katakana or romaji (e.g. jinkou).' : 'Write it exactly as printed.',
  };
}

export function buildShin500Course(source: SourceInfo, items: Shin500Item[]): { course: CourseInput; stats: Shin500BuildStats } {
  const courseId = source.id;
  const edition = EDITIONS[courseId];
  if (!edition) throw new Error(`No 新にほんご500問 edition is registered for source ${courseId}.`);
  const topicOf = (category: Shin500Category) => `${courseId}.${category}`;
  const stats: Shin500BuildStats = { total: 0, withTypedVariant: 0, excluded: [], needsReview: [] };

  function questionsFor(item: Shin500Item): QuestionInput[] {
    if (item.flags.some((flag) => BLOCKING.includes(flag)) || item.answer < 1) {
      stats.excluded.push({ number: item.number, flags: item.flags });
      return [];
    }
    const reviewFlags = item.flags.filter((flag) => !REASSURING_FLAGS.has(flag));
    if (reviewFlags.length) stats.needsReview.push({ number: item.number, flags: reviewFlags });

    const crop: [number, number, number, number] = [QUESTION_X[0], item.questionBand[0], QUESTION_X[1], item.questionBand[1]];
    const explanationLines = [
      item.sentence ? `**${item.sentence}**` : undefined,
      item.translation ? `*${item.translation}*` : undefined,
      item.reviewOf ? `This reviews question ${item.reviewOf}.` : undefined,
    ].filter(Boolean);
    const base = {
      skill: 'recognize' as const,
      topics: [topicOf(item.category)],
      media: [{ kind: 'page-image' as const, sourceId: source.id, page: item.questionPage, crop, alt: item.stem }],
      explanationMedia:
        item.answerPage && item.answerBand
          ? [{ kind: 'page-image' as const, sourceId: source.id, page: item.answerPage, crop: [QUESTION_X[0], item.answerBand[0], QUESTION_X[1], item.answerBand[1]] as [number, number, number, number] }]
          : [],
      explanation: explanationLines.length ? explanationLines.join('\n\n') : undefined,
      source: { origin: 'user-material' as const, sourceId: source.id, title: source.title, page: item.questionPage, flags: item.flags.filter((flag) => flag !== 'option-number-inferred') },
      tags: ['jlpt', item.category, `week-${item.week}`],
    };
    const optionCount = item.day === 7 ? 2 : 4;
    const multipleChoice: QuestionInput = {
      ...base,
      id: `${courseId}.q${item.number}`,
      type: 'choice',
      difficulty: item.day === 7 ? 1 : 2,
      prompt: `**Question ${item.number}** · ${INSTRUCTIONS[item.category]}`,
      options: Array.from({ length: optionCount }, (_, index) => ({ id: String(index + 1), text: String(index + 1) })),
      correct: [String(item.answer)],
      shuffle: false,
      answerHint: 'Choose the number of the answer as printed.',
    };
    stats.total++;
    const typed = typedVariant(courseId, item, base, topicOf(item.category));
    if (typed) stats.withTypedVariant++;
    return typed ? [multipleChoice, typed] : [multipleChoice];
  }

  const weeks = [1, 2, 3, 4];
  const units = weeks.map((week) => {
    const lessons = [1, 2, 3, 4, 5, 6, 7].flatMap((day) => {
      const dayItems = items.filter((item) => item.week === week && item.day === day).sort((a, b) => a.number - b.number);
      if (dayItems.length === 0) return [];
      const pages = [...new Set(dayItems.flatMap((item) => [item.questionPage, ...(item.answerPage ? [item.answerPage] : [])]))].sort((a, b) => a - b);
      const first = dayItems[0]!.number;
      const last = dayItems.at(-1)!.number;
      return [
        {
          id: `${courseId}.w${week}.d${day}`,
          title: day === 7 ? `Week ${week} · Day 7 review` : `Week ${week} · Day ${day}`,
          subtitle: `${day === 7 ? '7日目 (復習)' : `${day}日目`} · questions ${first}–${last}`,
          summary:
            day === 7
              ? 'Review questions on days 1–6; each one points back to the question it revisits.'
              : '15 questions: kanji & kana, vocabulary and grammar, then typed versions of the ones you can recall.',
          estimatedMinutes: 20,
          topics: [topicOf('moji'), topicOf('goi'), topicOf('bunpou')],
          blocks: [{ kind: 'source-pages' as const, sourceId: source.id, pages, caption: `${source.title}, week ${week} day ${day} (PDF pages ${pages[0]}–${pages.at(-1)})` }],
          questions: dayItems.flatMap(questionsFor),
          source: { origin: 'user-material' as const, sourceId: source.id, title: source.title, page: pages[0] },
        },
      ];
    });
    return { id: `${courseId}.w${week}`, title: `Week ${week} (第${week}週)`, lessons };
  });

  const course: CourseInput = {
    id: courseId,
    title: `新にほんご500問 ${edition.title}`,
    subtitle: 'Kanji, vocabulary and grammar drills from your book (ASK Publishing)',
    description:
      `All 500 questions of your 新にほんご500問 ${edition.title}, organised as in the book: four weeks, six study days and a review day each week. ` +
      'Each question shows its original box from the page; after answering you see the full sentence, its English translation and the ' +
      "book's own explanation. Questions whose answer text could be confirmed also come as typed-answer practice.",
    category: 'japanese',
    subject: 'jlpt',
    level: edition.level,
    difficulty: edition.difficulty,
    tags: ['JLPT', 'Japanese', 'kanji', 'vocabulary', 'grammar'],
    prerequisites: edition.prerequisites,
    estimatedHours: 28,
    topics: (['moji', 'goi', 'bunpou'] as const).map((category) => ({ id: topicOf(category), title: CATEGORY_LABELS[category] })),
    units,
    source: { origin: 'user-material', sourceId: source.id, title: source.title },
    contentNotice:
      'Imported by OCR from your PDF. Question boxes are shown as images of the original pages, so underlines, blanks and options appear ' +
      'exactly as printed. Answers come from the answer pages (days 1–6) and the answer footers (day 7); each answer was cross-checked ' +
      'against the full sentence on the answer page where possible, and unconfirmed items are marked.',
  };
  return { course, stats };
}
