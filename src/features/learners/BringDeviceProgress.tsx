/**
 * Shown once after signing in, when this device has progress and the account has none: copy the
 * device's learners into the account. Either answer is remembered, so it is never asked again for
 * this account on this device.
 */
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Upload } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Sheet } from '@/components/ui/Sheet';
import { useToast } from '@/components/ui/useToast';
import { bringDeviceProgress, checkDeviceProgressOffer, markOffered, wasOffered } from '@/data/learners/bringDeviceProgress';
import { accountLearnerSide, deviceLearnerSide } from '@/data/learners/learnerSides';
import { useLearners } from '@/data/learners/useLearners';
import { learnerKeys } from '@/data/queries';
import { useAuth } from '@/features/auth/useAuth';

export function BringDeviceProgress() {
  const auth = useAuth();
  const accountId = auth.status === 'signed-in' ? auth.account.id : undefined;
  const [answered, setAnswered] = useState(false);
  const offer = useQuery({
    queryKey: ['device-progress-offer', accountId],
    enabled: !!accountId && !wasOffered(accountId),
    queryFn: async () => {
      const result = await checkDeviceProgressOffer(deviceLearnerSide(), accountLearnerSide(accountId!));
      // An account with progress never needs the offer: stop checking.
      if (result === 'account-has-progress') markOffered(accountId!);
      return result;
    },
    staleTime: Infinity,
    retry: false,
  });
  if (!accountId || answered || offer.data !== 'offer') return null;
  return <Offer accountId={accountId} onAnswered={() => setAnswered(true)} />;
}

function Offer({ accountId, onAnswered }: { accountId: string; onAnswered: () => void }) {
  const learners = useLearners();
  const client = useQueryClient();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  const answer = () => {
    markOffered(accountId);
    onAnswered();
  };

  const bring = async () => {
    setBusy(true);
    setError(undefined);
    try {
      const count = await bringDeviceProgress(deviceLearnerSide(), accountLearnerSide(accountId));
      await learners.refresh();
      await client.invalidateQueries({ queryKey: learnerKeys.all });
      toast.show(count === 1 ? 'This device’s progress is now in your account.' : `${count} profiles’ progress is now in your account.`);
      answer();
    } catch (failure) {
      setError(`Copying stopped: ${failure instanceof Error ? failure.message : String(failure)}. Try again: nothing is copied twice.`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet title="Bring this device’s progress into your account" className="mx-auto mb-6 max-w-6xl">
      <div className="flex flex-col gap-3 text-sm">
        <p>
          This device has progress saved before you signed in. Copy it into your account, so it is kept for you on every device. Every profile on this device comes along, each with their own progress. Nothing already in
          your account is replaced.
        </p>
        {error && (
          <p role="alert" className="text-wrong">
            {error}
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          <Button variant="primary" icon={<Upload className="size-4" />} loading={busy} onClick={() => void bring()}>
            Bring it in
          </Button>
          <Button variant="ghost" disabled={busy} onClick={answer}>
            No thanks
          </Button>
        </div>
      </div>
    </Sheet>
  );
}
