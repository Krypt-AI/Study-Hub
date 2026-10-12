/**
 * Access to the content pipeline's outputs: the source manifest and the per-page OCR
 * cache written by `tools/content-pipeline` (see its README).
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export const PIPELINE_CACHE_DIR = join(process.cwd(), 'tools', 'content-pipeline', 'cache');

export interface SourceInfo {
  id: string;
  title: string;
  language: 'zh' | 'ja';
  level: string;
  kind: string;
  phase: number;
  file: string;
  pageCount: number | null;
}

export interface OcrLine {
  text: string;
  score: number;
  /** x0, y0, x1, y1 relative to the page (0..1). */
  bbox: [number, number, number, number];
}

export interface OcrPage {
  source: string;
  page: number;
  method: 'ocr' | 'text-layer';
  lines: OcrLine[];
}

export function loadManifest(): SourceInfo[] {
  const path = join(PIPELINE_CACHE_DIR, 'sources.json');
  if (!existsSync(path)) throw new Error(`Missing ${path}. Run \`python -m pipeline manifest\` in tools/content-pipeline first.`);
  return JSON.parse(readFileSync(path, 'utf8')) as SourceInfo[];
}

export function loadPage(sourceId: string, page: number): OcrPage | undefined {
  const path = join(PIPELINE_CACHE_DIR, 'ocr', sourceId, `p${String(page).padStart(4, '0')}.json`);
  return existsSync(path) ? (JSON.parse(readFileSync(path, 'utf8')) as OcrPage) : undefined;
}

export function loadPages(source: SourceInfo): OcrPage[] {
  const pages: OcrPage[] = [];
  for (let page = 1; page <= (source.pageCount ?? 0); page++) {
    const loaded = loadPage(source.id, page);
    if (loaded) pages.push(loaded);
  }
  return pages;
}

export const lineHeight = (line: OcrLine) => line.bbox[3] - line.bbox[1];
export const centerY = (line: OcrLine) => (line.bbox[1] + line.bbox[3]) / 2;
export const left = (line: OcrLine) => line.bbox[0];

export const HAS_CJK = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u;
export const ONLY_HAN = /^[\p{Script=Han}…·（）()]+$/u;

/** Lines that are part of the same visual row as `anchor` (vertical centres close together). */
export function sameRow(anchor: OcrLine, candidate: OcrLine, tolerance = 0.6): boolean {
  return Math.abs(centerY(anchor) - centerY(candidate)) <= lineHeight(anchor) * tolerance;
}

export function pageText(page: OcrPage): string {
  return page.lines.map((line) => line.text).join('\n');
}
