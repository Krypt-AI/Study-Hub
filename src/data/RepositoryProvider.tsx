/**
 * Provides the active StudyRepository. Local mode is ready immediately; in Supabase mode the
 * `signIn` screen renders first and hands back a repository bound to the signed-in user.
 */
import { type ReactNode, useState } from 'react';
import { supabaseConfig } from './backend';
import { LocalRepository } from './local/LocalRepository';
import type { StudyRepository } from './repository';
import { RepositoryContext } from './useRepository';

let localRepository: LocalRepository | undefined;

export interface RepositoryProviderProps {
  children: ReactNode;
  /** Rendered in Supabase mode until the learner has signed in. */
  signIn: (onReady: (repository: StudyRepository) => void) => ReactNode;
}

export function RepositoryProvider({ children, signIn }: RepositoryProviderProps) {
  const [repository, setRepository] = useState<StudyRepository | undefined>(() => {
    if (supabaseConfig()) return undefined;
    localRepository ??= new LocalRepository();
    return localRepository;
  });

  if (!repository) return <>{signIn(setRepository)}</>;
  return <RepositoryContext.Provider value={repository}>{children}</RepositoryContext.Provider>;
}
