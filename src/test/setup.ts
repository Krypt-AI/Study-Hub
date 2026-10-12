// Global test setup: DOM matchers for component tests and an in-memory IndexedDB
// so the local repository can be tested without a browser.
import '@testing-library/jest-dom/vitest';
import 'fake-indexeddb/auto';
