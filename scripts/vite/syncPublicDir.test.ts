import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, utimesSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { syncPublicDir } from './syncPublicDir';

let root: string;
const publicDir = () => join(root, 'public');
const outDir = () => join(root, 'dist');

function write(path: string, text: string, ageMs = 0): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, text);
  if (ageMs) {
    const time = new Date(Date.now() - ageMs);
    utimesSync(path, time, time);
  }
}

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'sync-public-'));
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

describe('syncPublicDir', () => {
  it('copies public files into an empty out dir, keeping their modification times', () => {
    write(join(publicDir(), 'content/catalog.json'), '{}', 60_000);
    write(join(publicDir(), 'materials/pages/p1.webp'), 'image', 60_000);

    expect(syncPublicDir(publicDir(), outDir(), Date.now())).toEqual({ copied: 2, removed: 0 });
    expect(readFileSync(join(outDir(), 'materials/pages/p1.webp'), 'utf8')).toBe('image');
    expect(Math.trunc(statSync(join(outDir(), 'content/catalog.json')).mtimeMs)).toBe(Math.trunc(statSync(join(publicDir(), 'content/catalog.json')).mtimeMs));
  });

  it('copies only changed files on the next build', () => {
    write(join(publicDir(), 'a.txt'), 'same', 60_000);
    write(join(publicDir(), 'b.txt'), 'old', 60_000);
    syncPublicDir(publicDir(), outDir(), Date.now());

    write(join(publicDir(), 'b.txt'), 'changed');
    expect(syncPublicDir(publicDir(), outDir(), Date.now()).copied).toBe(1);
    expect(readFileSync(join(outDir(), 'b.txt'), 'utf8')).toBe('changed');
  });

  it('removes stale files and empty directories, but keeps what this build wrote', () => {
    write(join(publicDir(), 'kept.txt'), 'kept', 60_000);
    write(join(outDir(), 'assets/index-old.js'), 'old bundle', 60_000);
    write(join(outDir(), 'materials/removed/p1.webp'), 'removed from public', 60_000);
    const buildStartedAt = Date.now() - 1000;
    write(join(outDir(), 'assets/index-new.js'), 'this build');
    write(join(outDir(), '.git/HEAD'), 'ref', 60_000);

    expect(syncPublicDir(publicDir(), outDir(), buildStartedAt)).toEqual({ copied: 1, removed: 2 });
    expect(existsSync(join(outDir(), 'assets/index-new.js'))).toBe(true);
    expect(existsSync(join(outDir(), 'assets/index-old.js'))).toBe(false);
    expect(existsSync(join(outDir(), 'materials'))).toBe(false);
    expect(existsSync(join(outDir(), '.git/HEAD'))).toBe(true);
  });
});
