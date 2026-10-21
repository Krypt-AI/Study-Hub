/** Whether the desktop navigation rail is collapsed to icons, remembered per browser. */
import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'study-hub:rail';

function readCollapsed(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'collapsed';
  } catch {
    return false;
  }
}

/** True when the key press happens while the learner is typing, where Ctrl+B belongs to the editor. */
function isTyping(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || target.closest('input, textarea, select, [contenteditable], .cm-editor') !== null;
}

export function useRailCollapsed(): [collapsed: boolean, toggle: () => void] {
  const [collapsed, setCollapsed] = useState(readCollapsed);

  const toggle = useCallback(() => {
    setCollapsed((current) => {
      const next = !current;
      try {
        if (next) localStorage.setItem(STORAGE_KEY, 'collapsed');
        else localStorage.removeItem(STORAGE_KEY);
      } catch {
        // Storage can be unavailable (private windows); the choice then lasts for this visit only.
      }
      return next;
    });
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && !event.altKey && event.key.toLowerCase() === 'b' && !isTyping(event.target)) {
        event.preventDefault();
        toggle();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [toggle]);

  return [collapsed, toggle];
}
