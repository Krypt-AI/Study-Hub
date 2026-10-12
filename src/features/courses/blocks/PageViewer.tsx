/** A dialog that pages through original pages of a book, one at a time. */
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { PageImage } from '@/components/media/PageImage';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';

export interface PageViewerProps {
  sourceId: string;
  title: string;
  pages: number[];
  startPage: number;
  open: boolean;
  onClose: () => void;
}

export function PageViewer({ sourceId, title, pages, startPage, open, onClose }: PageViewerProps) {
  return (
    <Dialog open={open} onClose={onClose} title={title} className="w-[min(60rem,calc(100vw-1rem))]">
      <Pager sourceId={sourceId} pages={pages} startPage={startPage} />
    </Dialog>
  );
}

/** Mounted each time the viewer opens, so it always starts on the page that was clicked. */
function Pager({ sourceId, pages, startPage }: Pick<PageViewerProps, 'sourceId' | 'pages' | 'startPage'>) {
  const [position, setPosition] = useState(() => Math.max(0, pages.indexOf(startPage)));
  const page = pages[position] ?? startPage;
  const move = (delta: number) => setPosition((current) => Math.min(pages.length - 1, Math.max(0, current + delta)));

  return (
    <div
      className="flex flex-col"
      onKeyDown={(event) => {
        if (event.key === 'ArrowRight') move(1);
        if (event.key === 'ArrowLeft') move(-1);
      }}
    >
      <div className="p-3">
        <PageImage sourceId={sourceId} page={page} />
      </div>
      <div className="sticky bottom-0 flex items-center justify-between gap-2 border-t border-rule bg-sheet px-4 py-3">
        <Button icon={<ChevronLeft className="size-4" />} onClick={() => move(-1)} disabled={position === 0}>
          Previous
        </Button>
        <span className="tabular text-sm text-ink-muted">
          Page {page} · {position + 1} of {pages.length}
        </span>
        <Button onClick={() => move(1)} disabled={position === pages.length - 1}>
          Next <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
