/**
 * Incremental replacement for Vite's "empty the out dir, then copy public/ into it".
 *
 * public/ holds hundreds of megabytes of page images, audio and built content, so deleting and recopying it made
 * every production build spend most of its time in `vite:prepare-out-dir`. Instead the plugin leaves the out dir in
 * place and, after the bundle is written, mirrors public/ into it (copying only files whose size or modification time
 * differ) and deletes whatever this build did not produce: files older than the build that public/ no longer has,
 * such as last build's hashed assets. The result matches a clean build.
 */
import { existsSync, readdirSync, rmdirSync } from 'node:fs';
import { copyFile, mkdir, stat, unlink, utimes } from 'node:fs/promises';
import { dirname, join, relative, resolve, sep } from 'node:path';
import type { Plugin, ResolvedConfig } from 'vite';

export interface SyncResult {
  copied: number;
  removed: number;
}

/** Relative paths (with `/`) of every file below `root`; `.git` is skipped, as Vite's emptyOutDir does. */
function listFiles(root: string, dir = root, files: string[] = []): string[] {
  if (!existsSync(dir)) return files;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === '.git') continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) listFiles(root, path, files);
    else files.push(relative(root, path).split(sep).join('/'));
  }
  return files;
}

/** Removes empty directories below `dir` (not `dir` itself); returns whether `dir` ended up empty. */
function pruneEmptyDirectories(dir: string): boolean {
  let empty = true;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== '.git' && pruneEmptyDirectories(path)) rmdirSync(path);
    else empty = false;
  }
  return empty;
}

/** Filesystems store modification times at different precisions; differences under this many ms are the same file. */
const MTIME_TOLERANCE_MS = 2;
/** Stat and copy this many files at once: sequential stat calls dominate the step on Windows. */
const CONCURRENCY = 64;

async function mapInChunks<T>(items: readonly T[], work: (item: T) => Promise<void>): Promise<void> {
  for (let start = 0; start < items.length; start += CONCURRENCY) {
    await Promise.all(items.slice(start, start + CONCURRENCY).map(work));
  }
}

async function syncFile(source: string, target: string): Promise<boolean> {
  const from = await stat(source);
  const to = await stat(target).catch(() => undefined);
  if (to && to.size === from.size && Math.abs(to.mtimeMs - from.mtimeMs) < MTIME_TOLERANCE_MS) return false;
  await mkdir(dirname(target), { recursive: true });
  await copyFile(source, target);
  await utimes(target, from.atime, from.mtime);
  return true;
}

/**
 * Mirrors `publicDir` into `outDir`, then deletes files in `outDir` last modified before `buildStartedAt` that
 * `publicDir` does not have. Copies keep the source's modification time, which is how unchanged files are recognised.
 */
export async function syncPublicDir(publicDir: string, outDir: string, buildStartedAt: number): Promise<SyncResult> {
  const publicFiles = listFiles(publicDir);
  const copies = new Array<boolean>(publicFiles.length);
  await mapInChunks(publicFiles.map((file, index) => ({ file, index })), async ({ file, index }) => {
    copies[index] = await syncFile(join(publicDir, file), join(outDir, file));
  });
  const copied = copies.filter(Boolean).length;

  const publicSet = new Set(publicFiles);
  const stale = listFiles(outDir).filter((file) => !publicSet.has(file));
  let removed = 0;
  await mapInChunks(stale, async (file) => {
    const path = join(outDir, file);
    if ((await stat(path)).mtimeMs < buildStartedAt) {
      await unlink(path);
      removed++;
    }
  });
  if (existsSync(outDir)) pruneEmptyDirectories(outDir);
  return { copied, removed };
}

/** Use with `build.emptyOutDir: false` and `build.copyPublicDir: false`, which this plugin sets. */
export function syncPublicDirPlugin(): Plugin {
  let config: ResolvedConfig;
  let buildStartedAt = 0;
  return {
    name: 'study-hub:sync-public-dir',
    apply: 'build',
    config: () => ({ build: { emptyOutDir: false, copyPublicDir: false } }),
    configResolved(resolved) {
      config = resolved;
    },
    buildStart() {
      // A second earlier than now, so coarse filesystem timestamps of files written by this build still count as new.
      buildStartedAt = Date.now() - 1000;
    },
    async closeBundle() {
      const outDir = resolve(config.root, config.build.outDir);
      if (!outDir.startsWith(resolve(config.root) + sep)) throw new Error(`sync-public-dir: out dir ${outDir} is outside the project`);
      const { copied, removed } = await syncPublicDir(config.publicDir, outDir, buildStartedAt);
      config.logger.info(`public/ synced: ${copied} file(s) copied, ${removed} stale file(s) removed`);
    },
  };
}
