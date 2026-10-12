/** File names given to learner code and test code so tracebacks can be filtered to them. */
export const USER_FILENAME = '<your code>';
export const TEST_FILENAME = '<test>';

/**
 * Reduce a Pyodide traceback to the frames from the learner's code and the tests,
 * dropping Pyodide's internal frames, and keep the final exception line.
 */
export function formatPythonTraceback(message: string): string {
  const kept: string[] = [];
  let keepingFrame = true;
  for (const line of message.split('\n')) {
    const frame = /^ {2}File "([^"]+)"/u.exec(line);
    if (frame) {
      keepingFrame = frame[1] === USER_FILENAME || frame[1] === TEST_FILENAME;
      if (keepingFrame) kept.push(line);
    } else if (line.startsWith('    ')) {
      if (keepingFrame) kept.push(line);
    } else {
      keepingFrame = true;
      kept.push(line);
    }
  }
  const result = kept.join('\n').trim();
  // A traceback header with no remaining frames is noise.
  return result.replace(/^Traceback \(most recent call last\):\n(?! {2}File)/u, '');
}
