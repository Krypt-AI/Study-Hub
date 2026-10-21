/**
 * /sign-in: continue with the configured providers (Google by default; see signInOptions.ts). Providers return
 * here with `?next=` naming the page to go back to; a provider's refusal comes back as
 * `error_description`. Signing in is optional: guests can open the University and school courses.
 */
import { type FormEvent, useState } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router';
import { Bubble } from '@/components/ui/Bubble';
import { Button } from '@/components/ui/Button';
import { LoadingState } from '@/components/ui/Feedback';
import { Field, Input } from '@/components/ui/Field';
import { ProviderMark } from './providers';
import { PROVIDER_LABELS, safeNext, signInMethods } from './signInOptions';
import { type OAuthProviderId, useAuth } from './useAuth';

export default function SignInPage() {
  const auth = useAuth();
  const [params] = useSearchParams();
  const next = safeNext(params.get('next'));
  const methods = signInMethods();
  const [pending, setPending] = useState<OAuthProviderId>();
  const [error, setError] = useState<string | undefined>(params.get('error_description') ?? undefined);

  if (auth.status === 'local' || auth.status === 'signed-in') return <Navigate to={next} replace />;
  if (auth.status === 'loading') return <LoadingState label="Checking your session…" className="min-h-dvh justify-center" />;

  const continueWith = async (provider: OAuthProviderId) => {
    setPending(provider);
    setError(undefined);
    try {
      await auth.signInWithProvider(provider, next);
      // The browser is now leaving for the provider; keep the button busy until it does.
    } catch (failure) {
      setPending(undefined);
      setError(failure instanceof Error ? failure.message : String(failure));
    }
  };

  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm rounded-md border border-rule bg-sheet">
        <header className="flex items-center gap-2.5 border-b border-rule px-5 py-3">
          <Bubble state="filled" size="sm" />
          <h1 className="font-display text-xl font-semibold">Sign in to Study Hub</h1>
        </header>
        <div className="flex flex-col gap-4 px-5 py-5">
          <p className="text-sm text-ink-muted">Open every course, including the language and IT ones, and save your progress, reviews and code to your account on any device.</p>
          <div className="flex flex-col gap-2">
            {methods
              .filter((method): method is OAuthProviderId => method !== 'email')
              .map((provider) => (
                <Button
                  key={provider}
                  size="lg"
                  icon={<ProviderMark provider={provider} />}
                  loading={pending === provider}
                  disabled={pending !== undefined}
                  onClick={() => void continueWith(provider)}
                  className="justify-center"
                >
                  Continue with {PROVIDER_LABELS[provider]}
                </Button>
              ))}
          </div>
          {error && (
            <p role="alert" className="text-sm text-wrong">
              {error}
            </p>
          )}
          {methods.includes('email') && <EmailSignIn onError={setError} />}
          <p className="border-t border-rule pt-4 text-sm text-ink-muted">
            <Link to={next} className="text-print-strong hover:underline">
              Continue as a guest
            </Link>{' '}
            to open the University and school courses. A guest’s progress is saved on this device only.
          </p>
        </div>
      </div>
    </main>
  );
}

function EmailSignIn({ onError }: { onError: (message: string | undefined) => void }) {
  const auth = useAuth();
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string>();

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    onError(undefined);
    setMessage(undefined);
    try {
      if (mode === 'sign-in') await auth.signInWithEmail(email, password);
      else if (await auth.signUpWithEmail(email, password)) setMessage('Check your inbox to confirm your email address, then sign in.');
    } catch (failure) {
      onError(failure instanceof Error ? failure.message : String(failure));
    } finally {
      setBusy(false);
    }
  };

  return (
    <details className="group border-t border-rule pt-4">
      <summary className="cursor-pointer text-sm text-ink-muted hover:text-ink">Use email and password instead</summary>
      <form className="mt-4 flex flex-col gap-4" onSubmit={(event) => void submit(event)}>
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
        {message && (
          <p role="status" className="text-sm text-correct">
            {message}
          </p>
        )}
        <Button type="submit" variant="primary" loading={busy}>
          {mode === 'sign-in' ? 'Sign in' : 'Create account'}
        </Button>
        <button type="button" onClick={() => setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in')} className="text-sm text-print-strong hover:underline">
          {mode === 'sign-in' ? 'No account yet? Create one' : 'Already have an account? Sign in'}
        </button>
      </form>
    </details>
  );
}
