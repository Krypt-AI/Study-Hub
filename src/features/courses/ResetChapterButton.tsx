/** Start a chapter again, after a confirmation that says what is kept. */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { RotateCcw } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { learnerKeys } from '@/data/queries';
import { useRepository } from '@/data/useRepository';
import type { Lesson } from '@/domain/content/types';
import { resetLessons } from '@/domain/learning/resetProgress';

export function ResetChapterButton({ title, lessons }: { title: string; lessons: Lesson[] }) {
  const repository = useRepository();
  const client = useQueryClient();
  const [confirming, setConfirming] = useState(false);
  const reset = useMutation({
    mutationFn: () => resetLessons(repository, lessons.map((lesson) => ({ lessonId: lesson.id, questionIds: lesson.questions.map((question) => question.id) }))),
    onSuccess: () => setConfirming(false),
    onSettled: () => Promise.all([learnerKeys.lessonProgress, learnerKeys.reviewStates].map((queryKey) => client.invalidateQueries({ queryKey }))),
  });

  if (!confirming)
    return (
      <Button size="sm" variant="ghost" icon={<RotateCcw className="size-3.5" />} onClick={() => setConfirming(true)}>
        Reset
      </Button>
    );
  return (
    <span role="group" aria-label={`Reset ${title}?`} className="flex flex-wrap items-center gap-2">
      <span className="text-xs text-ink-muted">Start this chapter again? Your answer history stays.</span>
      <Button size="sm" variant="danger" loading={reset.isPending} onClick={() => reset.mutate()} autoFocus>
        Reset chapter
      </Button>
      <Button size="sm" variant="ghost" onClick={() => setConfirming(false)}>
        Keep
      </Button>
    </span>
  );
}
