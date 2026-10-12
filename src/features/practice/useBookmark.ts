import { useMutation, useQueryClient } from '@tanstack/react-query';
import { learnerKeys, useBookmarks } from '@/data/queries';
import { type BookmarkRecord, linkKey } from '@/data/records';
import { useRepository } from '@/data/useRepository';

export type BookmarkTarget = Omit<BookmarkRecord, 'key' | 'createdAt'>;

/** Whether a target is bookmarked, and a toggle that saves or removes it. */
export function useBookmark(target: BookmarkTarget | undefined) {
  const repository = useRepository();
  const client = useQueryClient();
  const { data: bookmarks = [] } = useBookmarks();
  const key = target ? linkKey(target) : '';
  const isBookmarked = bookmarks.some((bookmark) => bookmark.key === key);

  const toggle = useMutation({
    mutationFn: async () => {
      if (!target) return;
      if (isBookmarked) await repository.deleteBookmark(key);
      else await repository.saveBookmark({ ...target, key, createdAt: new Date().toISOString() });
    },
    onSuccess: () => client.invalidateQueries({ queryKey: learnerKeys.bookmarks }),
  });

  return { isBookmarked, toggle: () => toggle.mutate(), pending: toggle.isPending };
}
