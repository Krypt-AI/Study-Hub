/**
 * Provides the active StudyRepository for the current user:
 *  - local mode (no Supabase): IndexedDB in this browser;
 *  - guest (Supabase configured, signed out): a scratch IndexedDB emptied on every page load,
 *    so a guest can practise but nothing is kept;
 *  - signed in: Supabase, bound to the account.
 * Switching user clears every cached query and remounts the app under the new repository.
 */
import { useQueryClient } from '@tanstack/react-query';
import Dexie from 'dexie';
import { type ReactNode, useEffect, useState } from 'react';
import { LoadingState } from '@/components/ui/Feedback';
import { useAuth } from '@/features/auth/useAuth';
import { LocalRepository } from './local/LocalRepository';
import type { StudyRepository } from './repository';
import { supabaseClient } from './supabase/client';
import { SupabaseRepository } from './supabase/SupabaseRepository';
import { RepositoryContext } from './useRepository';

const GUEST_DATABASE = 'study-hub-guest';

let localRepository: LocalRepository | undefined;
let guestRepository: Promise<LocalRepository> | undefined;

/** The guest's scratch database, emptied once per page load. */
function openGuestRepository(): Promise<LocalRepository> {
  guestRepository ??= Dexie.delete(GUEST_DATABASE)
    .catch(() => undefined)
    .then(() => new LocalRepository(GUEST_DATABASE));
  return guestRepository;
}

interface Active {
  key: string;
  repository: StudyRepository;
}

export function RepositoryProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const queryClient = useQueryClient();
  const [active, setActive] = useState<Active>();
  const userKey = auth.status === 'signed-in' ? `user:${auth.account.id}` : auth.status;

  useEffect(() => {
    let current = true;
    const activate = (repository: StudyRepository) => {
      if (!current) return;
      queryClient.clear();
      setActive({ key: userKey, repository });
    };
    if (userKey === 'local') activate((localRepository ??= new LocalRepository()));
    else if (userKey === 'guest') void openGuestRepository().then(activate);
    else if (userKey.startsWith('user:')) activate(new SupabaseRepository(supabaseClient()));
    return () => {
      current = false;
    };
  }, [userKey, queryClient]);

  if (!active || active.key !== userKey) return <LoadingState label="Opening your Study Hub…" className="min-h-dvh justify-center" />;
  return (
    <RepositoryContext.Provider key={active.key} value={active.repository}>
      {children}
    </RepositoryContext.Provider>
  );
}
