/**
 * The words around a marked paper (marks, word limits, choosing questions, marking by a scheme), in
 * the language of the question: a BM paper is surrounded by BM, as Hard Rule 9 asks.
 */
export interface PaperWords {
  marks: (count: number) => string;
  /** "12 words", with the limit when there is one. */
  wordCount: (count: number, limit: { min?: number; max?: number }) => string;
  overLimit: string;
  chooseQuestions: (count: number) => string;
  notChosen: string;
  markWithScheme: string;
  confirmMark: string;
  total: string;
  answerPlaceholder: string;
  /** The one-line answer box. */
  shortPlaceholder: string;
  submitHint: string;
  /** The heading over a marking scheme's points. */
  scheme: string;
  sections: (count: number) => string;
  questions: (count: number) => string;
  minutes: (count: number) => string;
}

const english: PaperWords = {
  marks: (count) => `${count} ${count === 1 ? 'mark' : 'marks'}`,
  wordCount: (count, { min, max }) =>
    `${count} ${count === 1 ? 'word' : 'words'}${min && max ? ` (${min} to ${max})` : max ? ` (at most ${max})` : min ? ` (at least ${min})` : ''}`,
  overLimit: 'Over the word limit',
  chooseQuestions: (count) => `Answer ${count} ${count === 1 ? 'question' : 'questions'} only.`,
  notChosen: 'Not chosen',
  markWithScheme: 'Mark your answer with the marking scheme',
  confirmMark: 'Confirm my mark',
  total: 'Total',
  answerPlaceholder: 'Explain in your own words…',
  shortPlaceholder: 'Type your answer',
  submitHint: 'Ctrl + Enter to check',
  scheme: 'Marking scheme',
  sections: (count) => `${count} ${count === 1 ? 'section' : 'sections'}`,
  questions: (count) => `${count} ${count === 1 ? 'question' : 'questions'}`,
  minutes: (count) => `${count} min`,
};

const malay: PaperWords = {
  marks: (count) => `${count} markah`,
  wordCount: (count, { min, max }) =>
    `${count} patah perkataan${min && max ? ` (${min} hingga ${max})` : max ? ` (tidak melebihi ${max})` : min ? ` (tidak kurang daripada ${min})` : ''}`,
  overLimit: 'Melebihi had perkataan',
  chooseQuestions: (count) => `Jawab ${count} soalan sahaja.`,
  notChosen: 'Tidak dipilih',
  markWithScheme: 'Tanda jawapan anda berdasarkan panduan penskoran',
  confirmMark: 'Sahkan markah saya',
  total: 'Jumlah',
  answerPlaceholder: 'Tulis jawapan anda di sini…',
  shortPlaceholder: 'Taip jawapan anda',
  submitHint: 'Ctrl + Enter untuk menyemak',
  scheme: 'Panduan penskoran',
  sections: (count) => `${count} bahagian`,
  questions: (count) => `${count} soalan`,
  minutes: (count) => `${count} minit`,
};

/** By an answer language or a content `lang` tag: BM for 'ms', English otherwise. */
export const paperWords = (language: string | undefined): PaperWords => (language === 'ms' ? malay : english);
