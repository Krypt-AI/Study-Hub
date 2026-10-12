/** Renders a question's or section's media: original page images, audio clips and images. */
import { Volume2 } from 'lucide-react';
import type { Media } from '@/domain/content/types';
import { cn } from '@/lib/cn';
import { audioClipUrl } from './audioClip';
import { PageImage } from './PageImage';

export function MediaList({ media, className }: { media: Media[]; className?: string }) {
  if (media.length === 0) return null;
  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {media.map((item, index) => {
        switch (item.kind) {
          case 'page-image':
            return <PageImage key={index} sourceId={item.sourceId} page={item.page} crop={item.crop} alt={item.alt} />;
          case 'audio':
            return (
              <figure key={index} className="flex flex-col gap-1.5 rounded-md border border-rule bg-sheet-2 p-3">
                <figcaption className="flex items-center gap-2 text-sm text-ink-muted">
                  <Volume2 className="size-4 text-print" aria-hidden /> {item.title ?? 'Listening'}
                </figcaption>
                <audio controls preload="none" src={audioClipUrl(item)} className="w-full">
                  Your browser cannot play this audio.
                </audio>
              </figure>
            );
          case 'image':
            return <img key={index} src={item.src} alt={item.alt} className="max-w-full rounded-md border border-rule" />;
        }
      })}
    </div>
  );
}
