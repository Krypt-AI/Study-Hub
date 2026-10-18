/**
 * Incremental replacement for Vite's "empty the out dir, then copy public/ into it".
 *
 * public/ holds hundreds of megabytes of page images, audio and built content, so deleting and recopying it made
 * every production build spend most of its time in `vite:prepare-out-dir`. Instead the plugin leaves the out dir in
 * place and, after the bundle is written, mirrors public/ into it (copying only files whose size or modification time
 * differ) and deletes whatever this build did not produce: files older than the build that public/ no longer has,
 * such as last build's hashed assets. The result matches a clean build.
 */
import { copyFileSync, existsSync, mkdirSync, readdirSync, rmdirSync, statSync, unlinkSync, utimesSync } from 'node:fs';
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

/**
 * Mirrors `publicDir` into `outDir`, then deletes files in `outDir` last modified before `buildStartedAt` that
 * `publicDir` does not have. Copies keep the source's modification time, which is how unchanged files are recognised.
 */
export function syncPublicDir(publicDir: string, outDir: string, buildStartedAt: number): SyncResult {
  const publicFiles = new Set(listFiles(publicDir));
  let copied = 0;
  for (const file of publicFiles) {
    const source = join(publicDir, file);
    const target = join(outDir, file);
    const from = statSync(source);
    const to = existsSync(target) ? statSync(target) : undefined;
    if (to && to.size === from.size && Math.trunc(to.mtimeMs) === Math.trunc(from.mtimeMs)) continue;
    mkdirSync(dirname(target), { recursive: true });
    copyFileSync(source, target);
    utimesSync(target, from.atime, from.mtime);
    copied++;
  }

  let removed = 0;
  for (const file of listFiles(outDir)) {
    if (publicFiles.has(file)) continue;
    const path = join(outDir, file);
    if (statSync(path).mtimeMs < buildStartedAt) {
      unlinkSync(path);
      removed++;
    }
  }
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
    closeBundle() {
      const outDir = resolve(config.root, config.build.outDir);
      if (!outDir.startsWith(resolve(config.root) + sep)) throw new Error(`sync-public-dir: out dir ${outDir} is outside the project`);
      const { copied, removed } = syncPublicDir(config.publicDir, outDir, buildStartedAt);
      config.logger.info(`public/ synced: ${copied} file(s) copied, ${removed} stale file(s) removed`);
    },
  };
}
