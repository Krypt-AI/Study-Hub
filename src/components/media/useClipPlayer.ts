/**
 * One audio element for a list of clips: starting a clip stops the one playing. A clip is a
 * URL from audioClipUrl, so a span of a longer recording plays from its start and stops at its end.
 */
import { useEffect, useRef, useState } from 'react';
import { parseAudioClipUrl } from './audioClip';

export interface ClipPlayer {
  playing?: string;
  /** Clips played at least once. */
  played: ReadonlySet<string>;
  error?: string;
  toggle: (clip: string) => void;
}

export function useClipPlayer(): ClipPlayer {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  /** End of the span being played, in seconds (undefined: play to the end of the file). */
  const endRef = useRef<number | undefined>(undefined);
  const [playing, setPlaying] = useState<string>();
  const [played, setPlayed] = useState<ReadonlySet<string>>(() => new Set());
  const [error, setError] = useState<string>();

  const toggle = (clip: string) => {
    let audio = audioRef.current;
    if (!audio) {
      const element = new Audio();
      element.addEventListener('ended', () => setPlaying(undefined));
      element.addEventListener('timeupdate', () => {
        if (endRef.current !== undefined && element.currentTime >= endRef.current) {
          element.pause();
          setPlaying(undefined);
        }
      });
      audioRef.current = element;
      audio = element;
    }
    if (playing === clip) {
      audio.pause();
      setPlaying(undefined);
      return;
    }
    const { src, start, end } = parseAudioClipUrl(clip);
    endRef.current = end;
    const absolute = new URL(src, window.location.href).href;
    if (audio.src !== absolute) audio.src = src;
    audio.currentTime = start;
    setError(undefined);
    audio
      .play()
      .then(() => {
        setPlaying(clip);
        setPlayed((current) => new Set(current).add(clip));
      })
      .catch(() => {
        setPlaying(undefined);
        setError('The audio clip could not be played. Run the content pipeline’s audio step if the clips are missing.');
      });
  };

  // Stop playback when the player goes away (e.g. the exam section closes).
  useEffect(() => () => audioRef.current?.pause(), []);

  return { playing, played, error, toggle };
}
