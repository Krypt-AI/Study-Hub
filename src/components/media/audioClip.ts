/**
 * An audio clip is a file, or a span of one (a question inside a recording of a whole test
 * section). The span is written as a media fragment, `file.mp3#t=12.5,40`, which browsers
 * understand in `<audio src>` and which doubles as the clip's identity.
 */
import type { Media } from '@/domain/content/types';

type AudioMedia = Extract<Media, { kind: 'audio' }>;

export function audioClipUrl({ src, start, end }: Pick<AudioMedia, 'src' | 'start' | 'end'>): string {
  if (start === undefined && end === undefined) return src;
  return `${src}#t=${start ?? 0}${end !== undefined ? `,${end}` : ''}`;
}

/** The file and span of a clip URL made by audioClipUrl. */
export function parseAudioClipUrl(url: string): { src: string; start: number; end?: number } {
  const match = /^(.*)#t=([\d.]+)(?:,([\d.]+))?$/u.exec(url);
  if (!match) return { src: url, start: 0 };
  return { src: match[1] ?? url, start: Number(match[2]), end: match[3] !== undefined ? Number(match[3]) : undefined };
}
