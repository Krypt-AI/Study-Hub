/** The active StudyRepository, provided by RepositoryProvider. */
import { createContext, useContext } from 'react';
import type { StudyRepository } from './repository';

export const RepositoryContext = createContext<StudyRepository | undefined>(undefined);

export function useRepository(): StudyRepository {
  const repository = useContext(RepositoryContext);
  if (!repository) throw new Error('useRepository must be used inside RepositoryProvider');
  return repository;
}
