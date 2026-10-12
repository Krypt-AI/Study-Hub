/** Offer text as a file download (backups as JSON, old notes as Markdown). */
export function downloadText(filename: string, text: string, type = 'text/plain'): void {
  const url = URL.createObjectURL(new Blob([text], { type: `${type};charset=utf-8` }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

/** A file name from a title: letters in any script and digits kept, path and control characters dropped. */
export function fileSlug(title: string, fallback = 'untitled'): string {
  const slug = title
    .normalize('NFKC')
    .replace(/[\\/:*?"<>|\p{Cc}]+/gu, '')
    .trim()
    .replace(/\s+/gu, '-')
    .slice(0, 80);
  return slug || fallback;
}
