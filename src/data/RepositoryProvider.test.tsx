// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { type Auth, AuthContext } from '@/features/auth/useAuth';
import { type Learners, useLearners } from './learners/useLearners';
import { RepositoryProvider } from './RepositoryProvider';

const LOCAL_AUTH: Auth = {
  status: 'local',
  signInWithProvider: () => Promise.resolve(),
  signInWithEmail: () => Promise.resolve(),
  signUpWithEmail: () => Promise.resolve(false),
  signOut: () => Promise.resolve(),
  refreshSession: () => Promise.resolve(),
};

describe('RepositoryProvider', () => {
  it('opens a learner with an empty query cache, and remembers the choice', async () => {
    const client = new QueryClient();
    let learners: Learners | undefined;
    function Probe() {
      learners = useLearners();
      return <p>Studying: {learners.active.name}</p>;
    }
    render(
      <QueryClientProvider client={client}>
        <AuthContext.Provider value={LOCAL_AUTH}>
          <RepositoryProvider>
            <Probe />
          </RepositoryProvider>
        </AuthContext.Provider>
      </QueryClientProvider>,
    );
    expect(await screen.findByText('Studying: Learner 1')).toBeInTheDocument();

    // Something the first learner had cached.
    client.setQueryData(['learner', 'settings'], { dailyGoalMinutes: 99 });
    await act(() => learners!.add('Adam'));

    expect(await screen.findByText('Studying: Adam')).toBeInTheDocument();
    expect(client.getQueryData(['learner', 'settings'])).toBeUndefined();
    expect(localStorage.getItem('study-hub:active-learner:device')).toBe(learners!.active.id);
  });
});
