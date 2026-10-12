/**
 * Sign-in for Supabase mode (only shown when Supabase is configured). Email and password;
 * the session stays in this browser until the learner signs out in Settings.
 */
import { type FormEvent, useEffect, useState } from 'react';
import { Bubble } from '@/components/ui/Bubble';
import { Button } from '@/components/ui/Button';
import { LoadingState } from '@/components/ui/Feedback';
import { Field, Input } from '@/components/ui/Field';
import type { StudyRepository } from '@/data/repository';
import { supabaseClient } from '@/data/supabase/client';
import { SupabaseRepository } from '@/data/supabase/SupabaseRepository';

type Mode = 'sign-in' | 'sign-up';

export default function SignInScreen({ onReady }: { onReady: (repository: StudyRepository) => void }) {
  const client = supabaseClient();
  const [checking, setChecking] = useState(true);
  const [mode, setMode] = useState<Mode>('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [message, setMessage] = useState<string>();

  useEffect(() => {
    let active = true;
    void client.auth.getSession().then(({ data }) => {
      if (!active) return;
      if (data.session) onReady(new SupabaseRepository(client));
      else setChecking(false);
    });
    return () => {
      active = false;
    };
  }, [client, onReady]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(undefined);
    setMessage(undefined);
    const { data, error: authError } =
      mode === 'sign-in' ? await client.auth.signInWithPassword({ email, password }) : await client.auth.signUp({ email, password });
    setBusy(false);
    if (authError) setError(authError.message);
    else if (data.session) onReady(new SupabaseRepository(client));
    else setMessage('Check your inbox to confirm your email address, then sign in.');
  };

  if (checking) return <LoadingState label="Checking your session…" className="justify-center" />;

  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm rounded-md border border-rule bg-sheet">
        <header className="flex items-center gap-2.5 border-b border-print-line px-5 py-3">
          <Bubble state="filled" size="sm" />
          <h1 className="font-display text-xl font-semibold">Study Hub</h1>
        </header>
        <form className="flex flex-col gap-4 px-5 py-5" onSubmit={(event) => void submit(event)}>
          <p className="text-sm text-ink-muted">
            {mode === 'sign-in' ? 'Sign in to reach your progress, calendar and code.' : 'Create an account for your own Study Hub.'} Only your account can read your data.
          </p>
          <Field label="Email">{(props) => <Input {...props} type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} />}</Field>
          <Field label="Password" hint={mode === 'sign-up' ? 'At least 8 characters.' : undefined}>
            {(props) => (
              <Input
                {...props}
                type="password"
                autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'}
                required
                minLength={mode === 'sign-up' ? 8 : undefined}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            )}
          </Field>
          {error && (
            <p role="alert" className="text-sm text-wrong">
              {error}
            </p>
          )}
          {message && (
            <p role="status" className="text-sm text-correct">
              {message}
            </p>
          )}
          <Button type="submit" variant="primary" size="lg" loading={busy}>
            {mode === 'sign-in' ? 'Sign in' : 'Create account'}
          </Button>
          <button
            type="button"
            onClick={() => {
              setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in');
              setError(undefined);
              setMessage(undefined);
            }}
            className="text-sm text-print-strong hover:underline"
          >
            {mode === 'sign-in' ? 'No account yet? Create one' : 'Already have an account? Sign in'}
          </button>
        </form>
      </div>
    </main>
  );
}
