/**
 * Provides the active learner and their StudyRepository:
 *  - local mode (no Supabase) and guests (Supabase configured, signed out): the learners of this
 *    device, each with their own IndexedDB database that survives reloads; guests get no cloud sync;
 *  - signed in: the account's learners, in Supabase.
 * The device's learners and the account's learners are separate lists (learnerSides.ts): signing in
 * or out switches between them and never copies one into the other, except through the one-time
 * offer in bringDeviceProgress.ts. Switching user or learner clears every cached query and remounts
 * the app under the new repository, so nothing of the previous learner stays in memory.
 */
import { useQueryClient } from '@tanstack/react-query';
import Dexie from 'dexie';
import { type ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { ErrorState, LoadingState } from '@/components/ui/Feedback';
import { type AuthState, useAuth } from '@/features/auth/useAuth';
import type { LearnerSide } from './learners/bringDeviceProgress';
import { accountLearnerSide, closeDeviceRepository, deviceLearnerSide } from './learners/learnerSides';
import { checkLearnerName, MAIN_LEARNER_ID, newLearner, pickActiveLearner, sortLearners } from './learners/learners';
import { type Learners, LearnersContext } from './learners/useLearners';
import type { LearnerRecord } from './records';
import type { StudyRepository } from './repository';
import { RepositoryContext } from './useRepository';

/** Guests' data used to live in a scratch database emptied on every load; it is no longer used. */
const OLD_GUEST_DATABASE = 'study-hub-guest';

function learnerSideFor(status: AuthState['status'], accountId: string | undefined): LearnerSide | undefined {
  if (status === 'local' || status === 'guest') return deviceLearnerSide();
  if (status === 'signed-in' && accountId) return accountLearnerSide(accountId);
  return undefined;
}

interface Active {
  /** The user (or local/guest) this state belongs to. */
  userKey: string;
  side: LearnerSide;
  learners: LearnerRecord[];
  learner: LearnerRecord;
  repository: StudyRepository;
}

export function RepositoryProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const queryClient = useQueryClient();
  const [active, setActive] = useState<Active>();
  const [error, setError] = useState<Error>();
  const [attempt, setAttempt] = useState(0);
  const accountId = auth.status === 'signed-in' ? auth.account.id : undefined;
  const userKey = accountId ? `user:${accountId}` : auth.status;

  /** Opens a learner: a fresh query cache, then the app remounts under their repository. */
  const open = useCallback(
    (state: Omit<Active, 'repository'>) => {
      state.side.store.setActiveId(state.learner.id);
      queryClient.clear();
      setActive({ ...state, repository: state.side.repositoryFor(state.learner.id) });
    },
    [queryClient],
  );

  useEffect(() => {
    const side = learnerSideFor(auth.status, accountId);
    if (!side) return;
    let current = true;
    if (auth.status === 'guest') void Dexie.delete(OLD_GUEST_DATABASE).catch(() => undefined);
    side.store
      .list()
      .then((learners) => {
        if (current) open({ userKey, side, learners, learner: pickActiveLearner(learners, side.store.activeId()) });
      })
      .catch((failure: unknown) => {
        if (current) setError(failure instanceof Error ? failure : new Error(String(failure)));
      });
    return () => {
      current = false;
    };
  }, [auth.status, accountId, userKey, open, attempt]);

  const learners = useMemo<Learners | undefined>(() => {
    if (!active) return undefined;
    const { side, learners: list, learner } = active;
    const { store } = side;
    const replaceList = (next: LearnerRecord[]) =>
      setActive((state) => state && { ...state, learners: sortLearners(next), learner: next.find((entry) => entry.id === state.learner.id) ?? state.learner });
    return {
      kind: store.kind,
      list,
      active: learner,
      switchTo(id) {
        const next = list.find((entry) => entry.id === id);
        if (next && next.id !== learner.id) open({ ...active, learner: next });
      },
      async add(name) {
        const checked = checkLearnerName(name, list);
        if ('error' in checked) throw new Error(checked.error);
        const created = newLearner(checked.name);
        await store.save(created);
        open({ ...active, learners: sortLearners([...list, created]), learner: created });
        return created;
      },
      async rename(id, name) {
        const checked = checkLearnerName(name, list, id);
        if ('error' in checked) throw new Error(checked.error);
        const target = list.find((entry) => entry.id === id);
        if (!target) return;
        const renamed = { ...target, name: checked.name, updatedAt: new Date().toISOString() };
        await store.save(renamed);
        replaceList(list.map((entry) => (entry.id === id ? renamed : entry)));
      },
      async remove(id) {
        const remaining = list.filter((entry) => entry.id !== id);
        if (id === learner.id) {
          const main = remaining.find((entry) => entry.id === MAIN_LEARNER_ID) ?? remaining[0];
          if (main) open({ ...active, learners: remaining, learner: main });
        }
        if (store.kind === 'device') closeDeviceRepository(id);
        await store.remove(id);
        replaceList(remaining);
      },
      async refresh() {
        replaceList(await store.list());
      },
    };
  }, [active, open]);

  if (error)
    return (
      <ErrorState
        title="Your learners could not be loaded"
        error={error}
        onRetry={() => {
          setError(undefined);
          setAttempt((count) => count + 1);
        }}
      />
    );
  if (!active || !learners || active.userKey !== userKey) return <LoadingState label="Opening your Study Hub…" className="min-h-dvh justify-center" />;
  return (
    <LearnersContext.Provider value={learners}>
      <RepositoryContext.Provider key={`${active.userKey}/${active.learner.id}`} value={active.repository}>
        {children}
      </RepositoryContext.Provider>
    </LearnersContext.Provider>
  );
}
