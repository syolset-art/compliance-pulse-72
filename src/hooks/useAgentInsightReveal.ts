import { useCallback, useEffect, useState } from "react";

/**
 * Per-workspace toggle for whether the AI Agent recommendations
 * are revealed on the process list. Persisted in localStorage so
 * the user's choice sticks across sessions.
 */
const KEY_PREFIX = "agent-insight-revealed:";

export function useAgentInsightReveal(workAreaId: string | undefined) {
  const storageKey = workAreaId ? `${KEY_PREFIX}${workAreaId}` : null;
  const [revealed, setRevealed] = useState<boolean>(false);

  useEffect(() => {
    if (!storageKey) return;
    try {
      setRevealed(localStorage.getItem(storageKey) === "1");
    } catch {
      setRevealed(false);
    }
  }, [storageKey]);

  const reveal = useCallback(() => {
    if (!storageKey) return;
    try {
      localStorage.setItem(storageKey, "1");
    } catch {
      /* ignore */
    }
    setRevealed(true);
  }, [storageKey]);

  const hide = useCallback(() => {
    if (!storageKey) return;
    try {
      localStorage.removeItem(storageKey);
    } catch {
      /* ignore */
    }
    setRevealed(false);
  }, [storageKey]);

  return { revealed, reveal, hide };
}
