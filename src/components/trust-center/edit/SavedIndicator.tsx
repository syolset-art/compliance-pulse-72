import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, CloudCheck } from "lucide-react";

type Props = {
  lastEditedAt?: string | null;
};

function formatRelative(iso: string | null | undefined, isNb: boolean): string {
  if (!iso) return isNb ? "ikke lagret enda" : "not saved yet";
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 5) return isNb ? "nå nettopp" : "just now";
  if (s < 60) return isNb ? `for ${s} s siden` : `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return isNb ? `for ${m} min siden` : `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return isNb ? `for ${h} t siden` : `${h}h ago`;
  const d = Math.floor(h / 24);
  return isNb ? `for ${d} d siden` : `${d}d ago`;
}

export function SavedIndicator({ lastEditedAt }: Props) {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";
  const [pulsedAt, setPulsedAt] = useState<string | null>(null);
  const [, force] = useState(0);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail || {};
      setPulsedAt(detail.at || new Date().toISOString());
      window.setTimeout(() => setPulsedAt(null), 1800);
    };
    window.addEventListener("trust-profile-saved", handler);
    return () => window.removeEventListener("trust-profile-saved", handler);
  }, []);

  // Re-render every 30s so relative time stays fresh
  useEffect(() => {
    const id = window.setInterval(() => force((n) => n + 1), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const isPulsing = !!pulsedAt;
  const display = pulsedAt || lastEditedAt;

  return (
    <div
      className={`inline-flex items-center gap-1.5 text-[11px] transition-colors ${
        isPulsing ? "text-success" : "text-muted-foreground"
      }`}
      aria-live="polite"
    >
      <span
        className={`inline-flex h-4 w-4 items-center justify-center rounded-full transition-all ${
          isPulsing ? "bg-success/15 scale-110" : "bg-muted"
        }`}
      >
        <Check className={`h-2.5 w-2.5 ${isPulsing ? "text-success" : "text-muted-foreground"}`} />
      </span>
      <span className="tabular-nums">
        {isPulsing
          ? isNb ? "Lagret" : "Saved"
          : `${isNb ? "Sist lagret" : "Last saved"} ${formatRelative(display, isNb)}`}
      </span>
    </div>
  );
}
