/**
 * An original page from the learner's book (rendered by the content pipeline), whole or
 * cropped to a region. Cropping is done in CSS: the image is scaled so the crop box fills
 * the frame and shifted so the box's corner sits at the frame's corner.
 */
import { ImageOff } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/cn';

const pageImageUrl = (sourceId: string, page: number) => `/materials/pages/${sourceId}/p${String(page).padStart(4, '0')}.webp`;

/** Page images are exported at this width in pixels (PAGE_IMAGE_WIDTH in the pipeline's assets.py). */
const PAGE_IMAGE_WIDTH = 1100;
/** Height / width of an A4 page, used until the image has loaded. */
const DEFAULT_ASPECT = 1.414;

export interface PageImageProps {
  sourceId: string;
  page: number;
  crop?: [number, number, number, number];
  alt?: string;
  className?: string;
  /** Called with the page's natural aspect (height / width) once loaded. */
  onLoadAspect?: (aspect: number) => void;
}

export function PageImage({ sourceId, page, crop, alt, className, onLoadAspect }: PageImageProps) {
  const [failed, setFailed] = useState(false);
  const [aspect, setAspect] = useState(DEFAULT_ASPECT);
  const label = alt ?? `Page ${page} of your book`;

  if (failed) {
    return (
      <div className={cn('flex items-center gap-2 rounded-md border border-dashed border-rule-strong p-4 text-sm text-ink-muted', className)}>
        <ImageOff className="size-4 shrink-0" aria-hidden />
        <span className="min-w-0">
          Page {page} image is not available. Run the content pipeline&apos;s <code>pages</code> step.
        </span>
      </div>
    );
  }

  const image = (
    <img
      src={pageImageUrl(sourceId, page)}
      alt={label}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      onLoad={(event) => {
        const element = event.currentTarget;
        if (element.naturalWidth) {
          const natural = element.naturalHeight / element.naturalWidth;
          setAspect(natural);
          onLoadAspect?.(natural);
        }
      }}
      className={crop ? 'absolute max-w-none select-none' : 'block h-auto w-full select-none'}
      style={
        crop
          ? {
              width: `${100 / (crop[2] - crop[0])}%`,
              left: `${(-crop[0] / (crop[2] - crop[0])) * 100}%`,
              top: `${(-crop[1] / (crop[3] - crop[1])) * 100}%`,
            }
          : undefined
      }
    />
  );

  if (!crop) {
    return <div className={cn('overflow-hidden rounded-md border border-rule bg-white', className)}>{image}</div>;
  }

  // Frame height in proportion to the crop box: (crop height * page aspect) / crop width. The frame is never
  // wider than the crop's own pixels, so a small figure is not blown up into a blurry one.
  const frameAspect = ((crop[3] - crop[1]) * aspect) / (crop[2] - crop[0]);
  const naturalWidth = (crop[2] - crop[0]) * PAGE_IMAGE_WIDTH;
  return (
    <div
      className={cn('relative w-full overflow-hidden rounded-md border border-rule bg-white', className)}
      style={{ aspectRatio: `1 / ${frameAspect}`, maxWidth: `${naturalWidth}px` }}
    >
      {image}
    </div>
  );
}
