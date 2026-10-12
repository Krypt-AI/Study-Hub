/** Value formatting and structural equality for the JavaScript runner. */

/** console.log-style rendering: strings as-is at top level, everything else inspected. */
export function formatLogArguments(values: unknown[]): string {
  return values.map((value) => (typeof value === 'string' ? value : inspect(value))).join(' ');
}

export function inspect(value: unknown, depth = 0, seen: WeakSet<object> = new WeakSet()): string {
  if (typeof value === 'string') return depth === 0 ? JSON.stringify(value) : `'${value.replace(/'/gu, "\\'")}'`;
  if (typeof value === 'bigint') return `${value}n`;
  if (typeof value === 'symbol') return value.toString();
  if (typeof value === 'function') return `[Function: ${value.name || 'anonymous'}]`;
  if (value === null || typeof value !== 'object') return String(value);
  if (seen.has(value)) return '[Circular]';
  if (depth > 4) return Array.isArray(value) ? '[Array]' : '[Object]';
  seen.add(value);
  try {
    if (value instanceof Date) return Number.isNaN(value.getTime()) ? 'Invalid Date' : value.toISOString();
    if (value instanceof Error) return `${value.name}: ${value.message}`;
    if (value instanceof RegExp) return value.toString();
    if (Array.isArray(value)) return `[ ${value.map((item) => inspect(item, depth + 1, seen)).join(', ')} ]`.replace('[  ]', '[]');
    if (value instanceof Map) {
      const entries = [...value.entries()].map(([key, item]) => `${inspect(key, depth + 1, seen)} => ${inspect(item, depth + 1, seen)}`);
      return `Map(${value.size}) { ${entries.join(', ')} }`;
    }
    if (value instanceof Set) return `Set(${value.size}) { ${[...value].map((item) => inspect(item, depth + 1, seen)).join(', ')} }`;
    const entries = Object.entries(value).map(([key, item]) => `${/^[A-Za-z_$][\w$]*$/u.test(key) ? key : JSON.stringify(key)}: ${inspect(item, depth + 1, seen)}`);
    return entries.length ? `{ ${entries.join(', ')} }` : '{}';
  } finally {
    seen.delete(value);
  }
}

export function deepEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false;
  if (Object.getPrototypeOf(a) !== Object.getPrototypeOf(b)) return false;
  if (a instanceof Date && b instanceof Date) return a.getTime() === b.getTime();
  if (a instanceof Map && b instanceof Map) {
    return a.size === b.size && [...a].every(([key, value]) => b.has(key) && deepEqual(value, b.get(key)));
  }
  if (a instanceof Set && b instanceof Set) return a.size === b.size && [...a].every((value) => b.has(value));
  if (Array.isArray(a) && Array.isArray(b)) return a.length === b.length && a.every((item, index) => deepEqual(item, b[index]));
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  return (
    keysA.length === keysB.length &&
    keysA.every((key) => Object.prototype.hasOwnProperty.call(b, key) && deepEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key]))
  );
}
