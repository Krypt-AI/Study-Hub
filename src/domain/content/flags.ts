/** Plain-language descriptions of the review flags the import pipeline puts on extracted content. */
const FLAG_TEXT: Record<string, string> = {
  'corrected-after-review': 'OCR error corrected after checking the page',
  'verified-against-page': 'Checked against the page image',
  'low-ocr-confidence': 'Low OCR confidence: compare with the page',
  'pinyin-without-tones': 'Pinyin printed without tone marks',
  'answer-not-confirmed-on-answer-page': 'Answer not cross-checked on the answer page',
  'options-incomplete': 'Some options could not be read: use the page image',
};

/** Flags that record a completed check rather than a warning. */
export const REASSURING_FLAGS: ReadonlySet<string> = new Set(['verified-against-page', 'corrected-after-review', 'option-number-inferred']);

export function describeFlag(flag: string): string {
  const [name] = flag.split(':');
  return FLAG_TEXT[flag] ?? FLAG_TEXT[name ?? ''] ?? flag.replace(/-/gu, ' ');
}
