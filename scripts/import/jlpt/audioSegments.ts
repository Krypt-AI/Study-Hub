/**
 * Finds each question inside a listening recording that covers a whole test section
 * (JLPT N2 and N1 come this way), from the pauses measured by the content pipeline.
 *
 * The official recordings leave a fixed-length answer pause after every question (not
 * after the example), so the section's answer pauses are the group of equally long
 * silences that occurs once per question, or once fewer when the recording stops right
 * after the last question. Question k then runs from the end of the previous answer pause
 * to the end of its own. Question 1 starts at the silence that gives it the section's
 * typical question length, and the example (with the section instructions) plays from
 * the start. Results that do not hang together are rejected: the caller then plays the
 * whole recording.
 */

export interface SectionRecording {
  duration: number;
  /** [start, length] in seconds. */
  silences: Array<[number, number]>;
}

export interface Segment {
  start: number;
  end: number;
}

const MIN_PAUSE_SECONDS = 5;
const SAME_PAUSE_TOLERANCE = 1;
/** Every question must last between these fractions of the section's median question. */
const LENGTH_RANGE: [number, number] = [0.6, 1.6];

const median = (values: number[]) => {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? (sorted[middle] ?? 0) : ((sorted[middle - 1] ?? 0) + (sorted[middle] ?? 0)) / 2;
};

/** Long silences grouped by length: pauses of the same kind last (almost) exactly as long. */
function pauseGroups(silences: Array<[number, number]>): Array<Array<[number, number]>> {
  const groups: Array<Array<[number, number]>> = [];
  for (const silence of [...silences].filter(([, length]) => length >= MIN_PAUSE_SECONDS).sort((a, b) => a[1] - b[1])) {
    const group = groups.find((candidate) => Math.abs((candidate[0]?.[1] ?? 0) - silence[1]) <= SAME_PAUSE_TOLERANCE);
    if (group) group.push(silence);
    else groups.push([silence]);
  }
  return groups.map((group) => group.sort((a, b) => a[0] - b[0]));
}

/**
 * Time ranges for the section's items, keyed by question number (0 for the example).
 * @param questions the section's question numbers in order, without the example
 */
export function segmentSection(recording: SectionRecording, questions: number[], hasExample: boolean): Map<number, Segment> | undefined {
  const count = questions.length;
  if (count < 2) return undefined;
  const candidates = pauseGroups(recording.silences).filter((group) => group.length === count || group.length === count - 1);
  if (candidates.length !== 1) return undefined;
  const pauses = candidates[0]!;

  // Ends: each answer pause closes its question; without a pause the last question runs to the end.
  const ends = questions.map((_, index) => {
    const pause = pauses[index];
    return pause ? pause[0] + pause[1] : recording.duration;
  });
  const starts: number[] = questions.map((_, index) => (index === 0 ? Number.NaN : (ends[index - 1] ?? Number.NaN)));

  const typical = median(questions.slice(1).map((_, offset) => (ends[offset + 1] ?? 0) - (starts[offset + 1] ?? 0)));
  const firstPause = pauses[0]![0];
  const target = (ends[0] ?? 0) - typical;
  const firstStart = [0, ...recording.silences.map(([start, length]) => start + length)]
    .filter((candidate) => candidate < firstPause - 1)
    .reduce((best, candidate) => (Math.abs(candidate - target) < Math.abs(best - target) ? candidate : best), 0);
  starts[0] = firstStart;

  const segments = new Map<number, Segment>();
  const round = (seconds: number) => Math.round(seconds * 100) / 100;
  questions.forEach((question, index) => segments.set(question, { start: round(starts[index] ?? 0), end: round(ends[index] ?? 0) }));
  const lengths = [...segments.values()].map((segment) => segment.end - segment.start);
  if (lengths.some((length) => length < typical * LENGTH_RANGE[0] || length > typical * LENGTH_RANGE[1])) return undefined;
  if (hasExample) {
    if (firstStart <= 0) return undefined;
    segments.set(0, { start: 0, end: round(firstStart) });
  }
  return segments;
}

/** Pearson correlation of two equal-length series (0 when either is constant). */
function correlation(a: number[], b: number[]): number {
  const mean = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length;
  const [meanA, meanB] = [mean(a), mean(b)];
  let covariance = 0;
  let varianceA = 0;
  let varianceB = 0;
  a.forEach((value, index) => {
    covariance += (value - meanA) * ((b[index] ?? 0) - meanB);
    varianceA += (value - meanA) ** 2;
    varianceB += ((b[index] ?? 0) - meanB) ** 2;
  });
  return varianceA && varianceB ? covariance / Math.sqrt(varianceA * varianceB) : 0;
}

/** Minimum agreement between segment lengths and script lengths for the cut to be trusted. */
export const MIN_SCRIPT_AGREEMENT = 0.5;

/**
 * Independent check of a segmentation: longer scripts take longer to read, so the questions'
 * audio lengths should rise and fall with their script lengths.
 */
export function agreesWithScript(segments: Map<number, Segment>, scriptLengths: Map<number, number>): boolean {
  const questions = [...segments.keys()].filter((question) => question !== 0 && scriptLengths.has(question));
  if (questions.length < 3) return false;
  const durations = questions.map((question) => segments.get(question)!.end - segments.get(question)!.start);
  return correlation(durations, questions.map((question) => scriptLengths.get(question)!)) >= MIN_SCRIPT_AGREEMENT;
}
