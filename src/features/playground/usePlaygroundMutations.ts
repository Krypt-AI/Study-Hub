/** Writes for code projects, saved versions, custom exercises and their submissions. */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { learnerKeys } from '@/data/queries';
import type { CodeProjectRecord, CustomExerciseRecord, SubmissionRecord } from '@/data/records';
import { useRepository } from '@/data/useRepository';
import type { CodeLanguage } from '@/domain/content/types';
import { dayKey } from '@/lib/dates';
import { newId } from '@/lib/ids';
import { languageInfo } from './languages';

export function newProject(language: CodeLanguage, now = new Date()): CodeProjectRecord {
  const at = now.toISOString();
  const info = languageInfo(language);
  return {
    id: newId(),
    title: `Untitled ${info.name.split(' ')[0]} project`,
    language,
    code: info.starter,
    stdin: info.starterStdin ?? '',
    description: '',
    tags: [],
    links: [],
    linkKeys: [],
    createdAt: at,
    updatedAt: at,
  };
}

export function newExercise(now = new Date()): CustomExerciseRecord {
  const at = now.toISOString();
  return {
    id: newId(),
    title: 'Untitled exercise',
    language: 'python',
    prompt: 'Write a function `add(a, b)` that returns the sum of two numbers.',
    starterCode: 'def add(a, b):\n    pass\n',
    solution: 'def add(a, b):\n    return a + b\n',
    tests: [{ kind: 'assert', name: 'adds two numbers', code: 'assert add(2, 3) == 5' }],
    hints: [],
    tags: [],
    createdAt: at,
    updatedAt: at,
  };
}

export function useProjectMutations() {
  const repository = useRepository();
  const client = useQueryClient();
  const refresh = () => client.invalidateQueries({ queryKey: learnerKeys.projects });

  const save = useMutation({
    mutationFn: async (project: CodeProjectRecord) => {
      const saved = { ...project, updatedAt: new Date().toISOString() };
      await repository.saveCodeProject(saved);
      return saved;
    },
    onSuccess: (saved) => {
      client.setQueryData<CodeProjectRecord[]>(learnerKeys.projects, (current) =>
        current ? (current.some((project) => project.id === saved.id) ? current.map((project) => (project.id === saved.id ? saved : project)) : [...current, saved]) : current,
      );
    },
  });

  const remove = useMutation({ mutationFn: (id: string) => repository.deleteCodeProject(id), onSuccess: refresh });

  const saveVersion = useMutation({
    mutationFn: ({ projectId, code, label }: { projectId: string; code: string; label?: string }) =>
      repository.saveCodeVersion({ id: newId(), projectId, code, label, createdAt: new Date().toISOString() }),
    onSuccess: () => client.invalidateQueries({ queryKey: learnerKeys.versions }),
  });

  /** Counts toward today's activity. */
  const recordRun = useMutation({
    mutationFn: () => repository.recordActivity(dayKey(), { codeRuns: 1 }),
    onSuccess: () => client.invalidateQueries({ queryKey: learnerKeys.activity }),
  });

  return { save, remove, saveVersion, recordRun };
}

export function useExerciseMutations() {
  const repository = useRepository();
  const client = useQueryClient();

  const save = useMutation({
    mutationFn: async (exercise: CustomExerciseRecord) => {
      const saved = { ...exercise, updatedAt: new Date().toISOString() };
      await repository.saveCustomExercise(saved);
      return saved;
    },
    // Update the list at once, so a new exercise is found as soon as its page opens.
    onSuccess: (saved) =>
      client.setQueryData<CustomExerciseRecord[]>(learnerKeys.exercises, (current) =>
        current ? (current.some((exercise) => exercise.id === saved.id) ? current.map((exercise) => (exercise.id === saved.id ? saved : exercise)) : [...current, saved]) : current,
      ),
  });

  const remove = useMutation({
    mutationFn: (id: string) => repository.deleteCustomExercise(id),
    onSuccess: () => client.invalidateQueries({ queryKey: learnerKeys.exercises }),
  });

  const submit = useMutation({
    mutationFn: async (submission: Omit<SubmissionRecord, 'id' | 'createdAt'>) => {
      await repository.addSubmission({ ...submission, id: newId(), createdAt: new Date().toISOString() });
      await repository.recordActivity(dayKey(), { codeRuns: 1 });
    },
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: learnerKeys.submissions });
      void client.invalidateQueries({ queryKey: learnerKeys.activity });
    },
  });

  return { save, remove, submit };
}
