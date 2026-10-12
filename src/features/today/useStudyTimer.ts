/**
 * Counts active study time: seconds while the page is visible and the learner interacted
 * within the last two minutes. Each full minute is added to today's activity.
 */
import { useEffect, useEffectEvent } from 'react';
import { useRecordActivity } from '@/data/queries';
import { dayKey } from '@/lib/dates';

const TICK_SECONDS = 15;
const IDLE_AFTER_MS = 2 * 60 * 1000;

export function useStudyTimer(): void {
  const { mutate } = useRecordActivity();
  const addMinute = useEffectEvent(() => mutate({ day: dayKey(), delta: { minutes: 1 } }));

  useEffect(() => {
    let lastInteraction = Date.now();
    let activeSeconds = 0;
    const onActivity = () => {
      lastInteraction = Date.now();
    };
    const events = ['keydown', 'pointerdown', 'pointermove', 'wheel'] as const;
    events.forEach((name) => window.addEventListener(name, onActivity, { passive: true }));

    const timer = window.setInterval(() => {
      const idle = Date.now() - lastInteraction > IDLE_AFTER_MS;
      if (document.visibilityState !== 'visible' || idle) return;
      activeSeconds += TICK_SECONDS;
      if (activeSeconds >= 60) {
        activeSeconds -= 60;
        addMinute();
      }
    }, TICK_SECONDS * 1000);

    return () => {
      window.clearInterval(timer);
      events.forEach((name) => window.removeEventListener(name, onActivity));
    };
  }, []);
}
