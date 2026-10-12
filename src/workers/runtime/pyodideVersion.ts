/**
 * Pyodide runtime version loaded from the CDN. Must equal the installed `pyodide`
 * npm package (used only for types); `pyodideVersion.test.ts` enforces this.
 */
export const PYODIDE_VERSION = '314.0.7';
export const PYODIDE_INDEX_URL = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;
