/**
 * Optimal-string-alignment (restricted Damerau-Levenshtein) distance, measured in
 * Unicode code points: insertions, deletions, substitutions and adjacent swaps cost 1.
 */
export function editDistance(a: string, b: string): number {
  const left = Array.from(a);
  const right = Array.from(b);
  if (left.length === 0) return right.length;
  if (right.length === 0) return left.length;

  const rows = left.length + 1;
  const cols = right.length + 1;
  const table: number[] = new Array<number>(rows * cols).fill(0);
  const at = (i: number, j: number) => table[i * cols + j] ?? 0;

  for (let i = 0; i < rows; i++) table[i * cols] = i;
  for (let j = 0; j < cols; j++) table[j] = j;

  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      const cost = left[i - 1] === right[j - 1] ? 0 : 1;
      let best = Math.min(at(i - 1, j) + 1, at(i, j - 1) + 1, at(i - 1, j - 1) + cost);
      if (i > 1 && j > 1 && left[i - 1] === right[j - 2] && left[i - 2] === right[j - 1]) {
        best = Math.min(best, at(i - 2, j - 2) + 1);
      }
      table[i * cols + j] = best;
    }
  }
  return at(rows - 1, cols - 1);
}

export type TypoTolerance = 'none' | 'low' | 'medium';

/** Largest number of edits still treated as a typo for an answer of this length. */
export function allowedTypos(expected: string, tolerance: TypoTolerance): number {
  const length = Array.from(expected).length;
  if (tolerance === 'none') return 0;
  if (tolerance === 'low') return length <= 4 ? 0 : length <= 9 ? 1 : 2;
  return length <= 3 ? 0 : length <= 6 ? 1 : length <= 12 ? 2 : 3;
}
