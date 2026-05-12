import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown, RotateCcw, Trash2, Clock, X, Diamond } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLaraSuggestionStates, type LaraSuggestionState } from "@/hooks/useLaraSuggestionStates";
import { toast } from "sonner";

export function LaraSuggestionsArchiveSection() {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb" || i18n.language === "no";
  const locale = isNb ? "nb-NO" : "en-US";
  const { states, isLoading, restore } = useLaraSuggestionStates();
  const [open, setOpen] = useState(false);

  const now = Date.now();
  const snoozedActive = states.filter(
    s => s.state === "snoozed" && s.snoozed_until && new Date(s.snoozed_until).getTime() > now
  );
  const snoozedDue = states.filter(
    s => s.state === "snoozed" && (!s.snoozed_until || new Date(s.snoozed_until).getTime() <= now)
  );
  const dismissed = states.filter(s => s.state === "dismissed");

  const total = states.length;

  const handleRestore = (key: string) => {
    restore(key);
    toast.success(isNb ? "Hentet tilbake — vises i banneret igjen." : "Restored — will appear in the banner again.");
  };

  if (isLoading || total === 0) return null;

  const renderRow = (s: LaraSuggestionState, kind: "snoozed-active" | "snoozed-due" | "dismissed") => {
    const ctx = s.context_snapshot || ({} as any);
    const sevColor =
      ctx.severity === "critical" ? "bg-destructive" :
      ctx.severity === "high" ? "bg-warning" :
      "bg-muted-foreground";
    const statusLabel =
      kind === "snoozed-active"
        ? `${isNb ? "Utsatt til" : "Snoozed until"} ${s.snoozed_until ? new Date(s.snoozed_until).toLocaleDateString(locale) : "—"}`
        : kind === "snoozed-due"
        ? (isNb ? "Forfalt — kommer tilbake automatisk" : "Due — will reappear automatically")
        : `${isNb ? "Avvist" : "Dismissed"} ${new Date(s.updated_at).toLocaleDateString(locale)}`;
    const StatusIcon = kind === "dismissed" ? X : Clock;

    return (
      <li key={s.id} className="group py-3 flex items-start gap-3">
        <span className={`mt-1.5 h-2 w-2 rounded-full ${sevColor} shrink-0`} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground truncate">{ctx.title || s.suggestion_key}</p>
          {ctx.insight && <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{ctx.insight}</p>}
          <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1.5">
            <StatusIcon className="h-3 w-3" />
            {statusLabel}
            {ctx.category && <><span className="mx-1">·</span>{ctx.category}</>}
          </p>
        </div>
        <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity shrink-0">
          <Button
            size="sm"
            variant="ghost"
            className="h-8 px-2 text-xs"
            onClick={() => handleRestore(s.suggestion_key)}
            title={isNb ? "Hent tilbake" : "Restore"}
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1" />
            {isNb ? "Hent tilbake" : "Restore"}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
            onClick={() => restore(s.suggestion_key)}
            title={isNb ? "Slett permanent" : "Delete permanently"}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </li>
    );
  };

  return (
    <section className="pt-2">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "" : "-rotate-90"}`} />
        <Diamond className="h-3 w-3 text-primary" />
        {isNb ? "Utsatt / Avvist" : "Snoozed / Dismissed"} ({total})
      </button>

      {open && (
        <div className="mt-3 space-y-5">
          {snoozedDue.length > 0 && (
            <div>
              <p className="text-[11px] font-bold tracking-wider text-muted-foreground mb-1">
                {isNb ? "FORFALT — KOMMER TILBAKE" : "DUE — WILL REAPPEAR"}
              </p>
              <ul className="divide-y divide-border/40">{snoozedDue.map(s => renderRow(s, "snoozed-due"))}</ul>
            </div>
          )}
          {snoozedActive.length > 0 && (
            <div>
              <p className="text-[11px] font-bold tracking-wider text-muted-foreground mb-1">
                {isNb ? "UTSATT" : "SNOOZED"}
              </p>
              <ul className="divide-y divide-border/40">{snoozedActive.map(s => renderRow(s, "snoozed-active"))}</ul>
            </div>
          )}
          {dismissed.length > 0 && (
            <div>
              <p className="text-[11px] font-bold tracking-wider text-muted-foreground mb-1">
                {isNb ? "AVVIST" : "DISMISSED"}
              </p>
              <ul className="divide-y divide-border/40">{dismissed.map(s => renderRow(s, "dismissed"))}</ul>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
