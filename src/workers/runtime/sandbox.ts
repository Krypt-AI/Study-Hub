/**
 * Sandbox hardening for code-execution workers.
 *
 * Learner code already runs in a dedicated Web Worker: a separate thread with no DOM,
 * terminated by the app when it exceeds its time limit. These functions additionally
 * remove the worker's network and storage capabilities before any learner code runs.
 * Only the given URL prefixes (the Pyodide package CDN) remain reachable via fetch.
 */

const BLOCKED_GLOBALS = [
  'XMLHttpRequest',
  'WebSocket',
  'WebTransport',
  'EventSource',
  'Worker',
  'SharedWorker',
  'BroadcastChannel',
  'indexedDB',
  'caches',
  'cookieStore',
  'importScripts',
] as const;

const NETWORK_DISABLED = 'Network access is disabled in the Study Hub sandbox.';

function requestUrl(input: RequestInfo | URL): string {
  if (typeof input === 'string') return input;
  if (input instanceof URL) return input.href;
  return input.url;
}

export function hardenWorkerGlobals(allowedUrlPrefixes: readonly string[] = []): void {
  const scope = self as unknown as Record<string, unknown>;
  const originalFetch = self.fetch.bind(self);
  const guardedFetch = (input: RequestInfo | URL, init?: RequestInit) => {
    const url = requestUrl(input);
    return allowedUrlPrefixes.some((prefix) => url.startsWith(prefix))
      ? originalFetch(input, init)
      : Promise.reject(new TypeError(NETWORK_DISABLED));
  };
  Object.defineProperty(scope, 'fetch', { value: guardedFetch, writable: false, configurable: false });

  for (const name of BLOCKED_GLOBALS) {
    try {
      Object.defineProperty(scope, name, { value: undefined, writable: false, configurable: false });
    } catch {
      // Some engines expose a few of these as non-configurable; they are unreachable from Python anyway.
    }
  }
}

/** Globals exposed to Python's `js` module: computation helpers only, no I/O. */
export function pythonJsGlobals(): Record<string, unknown> {
  const allowed = [
    'Object', 'Array', 'Promise', 'Math', 'Date', 'JSON', 'Number', 'String', 'Boolean', 'Error', 'TypeError',
    'Map', 'Set', 'Symbol', 'Reflect', 'BigInt', 'ArrayBuffer', 'DataView', 'Uint8Array', 'Int32Array',
    'Float32Array', 'Float64Array', 'TextEncoder', 'TextDecoder', 'setTimeout', 'clearTimeout',
    'setInterval', 'clearInterval', 'queueMicrotask', 'performance', 'console',
  ];
  const scope = self as unknown as Record<string, unknown>;
  return Object.fromEntries(allowed.filter((name) => name in scope).map((name) => [name, scope[name]]));
}
