/**
 * Builds an HSK course from a textbook's lesson outline and vocabulary index.
 * Vocabulary and lesson titles come from the book; lesson texts, grammar notes and
 * exercises are shown as the original page images until they are extracted too.
 */
import type { SourceInfo } from '../ocr.ts';
import { chunk, codePointSlug, type CourseInput, pad2, pickDistinct, type QuestionInput, seededRandom } from '../shared.ts';
import { checkReading, type CedictIndex } from '../validation/cedict.ts';
import type { LessonOutline } from './lessons.ts';
import { isBlocking, readingsOf, type VocabularyRow } from './vocabularyIndex.ts';
import type { WorkbookLesson } from './workbook.ts';

export interface HskVolume {
  source: SourceInfo;
  lessons: LessonOutline[];
  rows: VocabularyRow[];
}

export interface HskBuildResult {
  course: CourseInput;
  stats: {
    lessons: number;
    words: number;
    questions: number;
    excluded: Array<{ sourceId: string; word: string; page: number; flags: string[] }>;
    reviewFlags: Array<{ sourceId: string; word: string; page: number; flags: string[] }>;
    cedict: 'checked' | 'skipped';
  };
}

const SECTION_NOTES: Partial<Record<VocabularyRow['section'], string>> = {
  'proper-nouns': 'Proper noun',
  'beyond-syllabus': 'Not in the HSK syllabus for this level (marked * in the book)',
  'built-from-known': 'New word made of characters learned earlier (旧字新词)',
};

interface WordEntry {
  row: VocabularyRow;
  source: SourceInfo;
  id: string;
  /** Validation warnings that remain after review, shown to the learner. */
  warnings: string[];
}

function wordNotes(row: VocabularyRow): string | undefined {
  const notes = [SECTION_NOTES[row.section], row.fromNotes ? 'Introduced in the lesson notes' : undefined].filter(Boolean);
  return notes.length ? notes.join(' · ') : undefined;
}

function sourceRef(entry: WordEntry) {
  return {
    origin: 'user-material' as const,
    sourceId: entry.source.id,
    title: entry.source.title,
    page: entry.row.page,
    confidence: entry.row.confidence,
    flags: entry.warnings,
  };
}

function vocabularyQuestions(entry: WordEntry, lessonTopic: string, meaningPool: string[]): QuestionInput[] {
  const { row } = entry;
  const reference = `**${row.word}** (${row.pinyin})${row.partOfSpeech ? ` *${row.partOfSpeech}*` : ''}: ${row.meaning}`;
  const common = { topics: [lessonTopic], source: sourceRef(entry), explanation: reference, tags: ['vocabulary'] };
  const questions: QuestionInput[] = [];

  const distractors = pickDistinct(
    meaningPool.filter((meaning) => meaning !== row.meaning),
    3,
    seededRandom(`${entry.id}.choose`),
  );
  if (distractors.length === 3 && row.section !== 'proper-nouns') {
    const options = [row.meaning, ...distractors].map((text, index) => ({ id: String.fromCharCode(97 + index), text }));
    questions.push({
      ...common,
      id: `${entry.id}.choose`,
      type: 'choice',
      skill: 'recognize',
      difficulty: 1,
      prompt: `What does **${row.word}** mean?`,
      options,
      correct: ['a'],
    });
  }

  questions.push(
    {
      ...common,
      id: `${entry.id}.meaning`,
      type: 'short',
      skill: 'recall',
      difficulty: 2,
      prompt: `Type the English meaning of **${row.word}**.`,
      answerHint: 'Any meaning listed in the book, or how you would say it in conversation ("I\'m sorry" for "to be sorry").',
      hints: [`Pinyin: ${row.pinyin}`, ...(row.partOfSpeech ? [`Part of speech: ${row.partOfSpeech}`] : [])],
      accepted: [row.meaning],
      match: { mode: 'meaning' },
      language: 'en',
    },
    {
      ...common,
      id: `${entry.id}.pinyin`,
      type: 'short',
      skill: 'recall',
      difficulty: 3,
      prompt: `Type the pinyin of **${row.word}** (${row.meaning}).`,
      answerHint: 'Tone marks (hǎo) or tone numbers (hao3) both work; write ü as v or ü.',
      hints: [`It has ${Array.from(row.word).filter((character) => /\p{Script=Han}/u.test(character)).length} syllable(s).`],
      accepted: readingsOf(row.pinyin),
      match: { mode: 'pinyin', toneSensitive: true },
    },
  );

  if (row.section !== 'proper-nouns') {
    questions.push({
      ...common,
      id: `${entry.id}.hanzi`,
      type: 'short',
      skill: 'apply',
      difficulty: 4,
      prompt: `Write **${row.meaning}** (${row.pinyin}) in Chinese characters.`,
      answerHint: 'Use a Chinese input method (e.g. Microsoft Pinyin): type the pinyin, then pick the characters.',
      hints: [`It has ${Array.from(row.word).length} character(s).`],
      accepted: [row.word],
      match: { mode: 'hanzi' },
      language: 'zh',
    });
  }
  return questions;
}

export function buildHskCourse(level: number, volumes: HskVolume[], cedict: CedictIndex | undefined, workbookLessons: WorkbookLesson[] = []): HskBuildResult {
  const courseId = `hsk-${level}`;
  const excluded: HskBuildResult['stats']['excluded'] = [];
  const reviewFlags: HskBuildResult['stats']['reviewFlags'] = [];

  const entries: WordEntry[] = [];
  const seenIds = new Set<string>();
  for (const volume of volumes) {
    for (const row of volume.rows) {
      const flags = [...row.flags];
      if (cedict && row.pinyin && !flags.includes('verified-against-page') && !flags.includes('corrected-after-review')) {
        const checks = readingsOf(row.pinyin).map((reading) => checkReading(cedict, row.word, reading));
        const differs = checks.find((check) => check.status === 'differs');
        if (differs?.status === 'differs' && checks.every((check) => check.status === 'differs')) {
          flags.push(`pinyin-differs-from-cc-cedict:${differs.dictionary.join('|')}`);
        }
      }
      if (flags.some(isBlocking) || row.lesson === 0) {
        excluded.push({ sourceId: volume.source.id, word: row.word, page: row.page, flags });
        continue;
      }
      let id = `${courseId}.w.${codePointSlug(row.word)}`;
      if (seenIds.has(id)) id = `${id}.${row.section}`;
      seenIds.add(id);
      const warnings = flags.filter((flag) => !['verified-against-page', 'corrected-after-review', 'no-part-of-speech'].includes(flag));
      if (warnings.length) reviewFlags.push({ sourceId: volume.source.id, word: row.word, page: row.page, flags: warnings });
      entries.push({ row: { ...row, flags }, source: volume.source, id, warnings });
    }
  }

  const meaningPool = [...new Set(entries.filter((entry) => entry.row.section !== 'proper-nouns').map((entry) => entry.row.meaning))];
  const outlines = volumes.flatMap((volume) => volume.lessons.map((lesson) => ({ lesson, source: volume.source })));

  const lessons = outlines.map(({ lesson, source }) => {
    const lessonId = `${courseId}.l${pad2(lesson.number)}`;
    const words = entries.filter((entry) => entry.row.lesson === lesson.number);
    const questions = words.flatMap((entry) => vocabularyQuestions(entry, lessonId, meaningPool));
    const byDifficulty = [...questions].sort((a, b) => (a.difficulty ?? 0) - (b.difficulty ?? 0));
    const pages = Array.from({ length: lesson.lastPage - lesson.firstPage + 1 }, (_, index) => lesson.firstPage + index);
    return {
      id: lessonId,
      title: `Lesson ${lesson.number} · ${lesson.titleZh}`,
      subtitle: `${lesson.titlePinyin} · ${lesson.titleEn}`,
      summary: `${words.length} vocabulary items from the book's word list, then the full lesson as printed (texts, notes, exercises).`,
      objectives: [
        `Recognise and recall the ${words.length} words introduced in this lesson`,
        'Write their pinyin with correct tones',
        'Write them in Chinese characters',
      ],
      estimatedMinutes: Math.max(15, Math.round(words.length * 2.5)),
      topics: [lessonId],
      blocks: [
        {
          kind: 'vocab' as const,
          title: 'New words',
          language: 'zh' as const,
          items: words.map((entry) => ({
            id: entry.id,
            term: entry.row.word,
            reading: entry.row.pinyin,
            partOfSpeech: entry.row.partOfSpeech,
            meaning: entry.row.meaning,
            notes: wordNotes(entry.row),
            source: sourceRef(entry),
          })),
        },
        {
          kind: 'source-pages' as const,
          sourceId: source.id,
          pages,
          caption: `${source.title}, lesson ${lesson.number} (PDF pages ${lesson.firstPage}–${lesson.lastPage}): texts, notes, exercises.`,
        },
      ],
      questions: byDifficulty,
      source: { origin: 'user-material' as const, sourceId: source.id, title: source.title, page: lesson.firstPage, flags: lesson.flags },
    };
  });

  const units = [
    ...chunk(lessons, 5).map((group, index) => ({
      id: `${courseId}.u${index + 1}`,
      title: `Lessons ${index * 5 + 1}–${index * 5 + group.length}`,
      lessons: group,
    })),
    ...(workbookLessons.length ? [{ id: `${courseId}.workbook`, title: 'Workbook exercises', lessons: workbookLessons }] : []),
  ];

  const corrected = entries.filter((entry) => entry.row.flags.includes('corrected-after-review')).length;
  const titles = volumes.map((volume) => volume.source.title).join(' and ');
  const course: CourseInput = {
    id: courseId,
    title: `HSK ${level}`,
    subtitle: titles,
    description:
      `Vocabulary and lessons from your copy of **${titles}**. Each lesson lists its new words with pinyin and meanings ` +
      'from the book, links to the original pages for the texts, grammar notes and exercises, and gives typed practice: ' +
      'recognising meanings, recalling meanings and pinyin, and writing the characters.',
    category: 'chinese',
    subject: 'hsk',
    level: `HSK ${level}`,
    difficulty: level <= 2 ? 'beginner' : level <= 4 ? 'intermediate' : 'advanced',
    tags: ['HSK', 'Chinese', 'vocabulary', 'pinyin', 'characters'],
    prerequisites: level > 1 ? [`hsk-${level - 1}`] : [],
    estimatedHours: lessons.length * 2,
    topics: [
      ...lessons.map((lesson) => ({ id: lesson.id, title: lesson.title })),
      ...(workbookLessons.length ? [{ id: `${courseId}.workbook`, title: 'Workbook exercises' }] : []),
    ],
    units,
    source: { origin: 'user-material', sourceId: volumes[0]?.source.id, title: titles },
    contentNotice:
      `Imported by OCR from your PDF. All ${entries.length + excluded.length} vocabulary entries were validated automatically ` +
      `(pinyin syllables and tones, syllable count${cedict ? ', CC-CEDICT readings' : ''}); ${corrected} OCR error(s) were corrected after ` +
      `checking the page images${excluded.length ? `, and ${excluded.length} entr${excluded.length === 1 ? 'y' : 'ies'} could not be read reliably and ${excluded.length === 1 ? 'is' : 'are'} left out` : ''}. ` +
      'Every item links to its page so you can check it against the book.',
  };

  return {
    course,
    stats: {
      lessons: lessons.length,
      words: entries.length,
      questions: lessons.reduce((sum, lesson) => sum + lesson.questions.length, 0),
      excluded,
      reviewFlags,
      cedict: cedict ? 'checked' : 'skipped',
    },
  };
}
