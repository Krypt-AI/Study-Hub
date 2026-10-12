import { describe, expect, it } from 'vitest';
import { audioClipUrl, parseAudioClipUrl } from './audioClip';

describe('audio clip URLs', () => {
  it('leaves a whole file as it is', () => {
    expect(audioClipUrl({ src: '/a/01.mp3' })).toBe('/a/01.mp3');
    expect(parseAudioClipUrl('/a/01.mp3')).toEqual({ src: '/a/01.mp3', start: 0 });
  });

  it('round-trips a span as a media fragment', () => {
    const url = audioClipUrl({ src: '/a/01.mp3', start: 159.7, end: 251.4 });
    expect(url).toBe('/a/01.mp3#t=159.7,251.4');
    expect(parseAudioClipUrl(url)).toEqual({ src: '/a/01.mp3', start: 159.7, end: 251.4 });
  });

  it('supports an open end', () => {
    expect(parseAudioClipUrl(audioClipUrl({ src: '/a/01.mp3', start: 5 }))).toEqual({ src: '/a/01.mp3', start: 5, end: undefined });
  });
});
