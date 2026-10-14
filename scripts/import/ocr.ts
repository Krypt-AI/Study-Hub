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

/** Full-width digits as ASCII digits ("１２" -> "12"). */
export const toHalfWidth = (text: string) => text.replace(/[０-９]/gu, (digit) => String.fromCharCode(digit.charCodeAt(0) - 0xfee0));

export interface Row {
  y: number;
  lines: OcrLine[];
}

/** Lines grouped into printed rows by their vertical centre, each row left to right, rows top to bottom. */
export function rowsOf(lines: OcrLine[], tolerance = 0.009): Row[] {
  const rows: Row[] = [];
  for (const line of [...lines].sort((a, b) => a.bbox[1] - b.bbox[1])) {
    const row = rows.find((candidate) => Math.abs(candidate.y - centerY(line)) < tolerance);
    if (row) row.lines.push(line);
    else rows.push({ y: centerY(line), lines: [line] });
  }
  for (const row of rows) row.lines.sort((a, b) => a.bbox[0] - b.bbox[0]);
  return rows;
}

export const HAS_CJK = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u;
export const ONLY_HAN = /^[\p{Script=Han}…·（）()]+$/u;

/** Lines that are part of the same visual row as `anchor` (vertical centres close together). */
export function sameRow(anchor: OcrLine, candidate: OcrLine, tolerance = 0.6): boolean {
  return Math.abs(centerY(anchor) - centerY(candidate)) <= lineHeight(anchor) * tolerance;
}

export function pageText(page: OcrPage): string {
  return page.lines.map((line) => line.text).join('\n');
}
