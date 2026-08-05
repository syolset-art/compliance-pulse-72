import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

const STORAGE_KEY = "mynder:msp:post-activation-prompt";

/** Leser preferansen: skal partneren spørres om å jobbe videre hos kunden etter aktivering? */
export function getPostActivationPromptEnabled(): boolean {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem(STORAGE_KEY) !== "off";
}

export function setPostActivationPromptEnabled(enabled: boolean) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, enabled ? "on" : "off");
  window.dispatchEvent(new Event("post-activation-prompt-changed"));
}

/**
 * Felles håndtering av «vil du jobbe videre hos kunden nå?» etter en aktivering.
 * Er prompten skrudd av, vises kun en bekreftelse med snarvei i stedet.
 */
export function usePostActivationPrompt() {
  const [enabled, setEnabled] = useState<boolean>(getPostActivationPromptEnabled);

  useEffect(() => {
    const sync = () => setEnabled(getPostActivationPromptEnabled());
    window.addEventListener("post-activation-prompt-changed", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("post-activation-prompt-changed", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const setPreference = useCallback((next: boolean) => {
    setPostActivationPromptEnabled(next);
    setEnabled(next);
  }, []);

  /**
   * Kall etter fullført aktivering. Returnerer true hvis dialogen skal åpnes,
   * ellers vises en toast med snarvei til kunden.
   */
  const promptOrToast = useCallback(
    (opts: { customerName: string; onEnter: () => void; description?: string }) => {
      if (enabled) return true;
      toast.success(`Aktivert hos ${opts.customerName}`, {
        description: opts.description ?? "Aktiveringen er fullført og faktureres på neste faktura.",
        action: { label: "Gå til kunden", onClick: opts.onEnter },
      });
      return false;
    },
    [enabled],
  );

  return { enabled, setPreference, promptOrToast };
}
