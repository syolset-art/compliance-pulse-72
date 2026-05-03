import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Diamond, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { LaraPlanTask } from "./types";

interface Props {
  totalCount: number;
  criticalCount: number;
  tasks: LaraPlanTask[];
  /** Brukes i header-tekst — "Vis alle oppgaver", default = "Vis alle oppgaver" */
  showAllLabelNb?: string;
  showAllLabelEn?: string;
  onShowAll?: () => void;
  /** Trykk på "Be Lara håndtere det" — får tasken som argument */
  onPrimaryAction: (task: LaraPlanTask) => void;
  /** Trykk på "Åpne ..." — får tasken som argument */
  onSecondaryAction?: (task: LaraPlanTask) => void;
  /** Skjul "Ikke nå"-dismiss-knappen (f.eks. på vendor-profil hvor banneret er fast) */
  hideDismiss?: boolean;
}

/**
 * Kompakt → ekspanderbar Lara-anbefalingsbanner.
 * Brukes på dashbord og inni Trust Profile / Veiledning fra Mynder.
 */
export function LaraRecommendationBanner({
  totalCount,
  criticalCount,
  tasks,
  showAllLabelNb = "Vis alle oppgaver",
  showAllLabelEn = "Show all tasks",
  onShowAll,
  onPrimaryAction,
  onSecondaryAction,
  hideDismiss = false,
}: Props) {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb" || i18n.language === "no";
  const [dismissed, setDismissed] = useState(false);
  const [showPlan, setShowPlan] = useState(false);
  const [step, setStep] = useState(0);

  if (dismissed || tasks.length === 0) return null;

  const total = tasks.length;
  const current = tasks[Math.min(step, total - 1)];

  const severityChip = (sev: LaraPlanTask["severity"]) => {
    if (sev === "critical")
      return { dot: "bg-destructive", label: isNb ? "KRITISK" : "CRITICAL", text: "text-destructive" };
    if (sev === "high")
      return { dot: "bg-warning", label: isNb ? "HØY" : "HIGH", text: "text-warning" };
    return { dot: "bg-muted-foreground", label: isNb ? "MEDIUM" : "MEDIUM", text: "text-muted-foreground" };
  };

  // ---- Kompakt banner ----
  if (!showPlan) {
    const title = isNb ? "Lara har en anbefaling til deg" : "Lara has a recommendation for you";
    const message = isNb
      ? `Du har ${totalCount} oppgave${totalCount === 1 ? "" : "r"} som krever oppmerksomhet${criticalCount > 0 ? `, hvorav ${criticalCount} er kritisk${criticalCount === 1 ? "" : "e"}` : ""}. Vil du starte en gjennomgang?`
      : `You have ${totalCount} task${totalCount === 1 ? "" : "s"} that need attention${criticalCount > 0 ? `, ${criticalCount} of them critical` : ""}. Would you like to start a review?`;

    return (
      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
        <div className="flex items-start gap-3 sm:contents">
          <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0">
            <Diamond className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">{title}</p>
            <p className="text-sm text-muted-foreground mt-0.5">{message}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:shrink-0">
          <Button
            size="sm"
            className="rounded-full px-4 flex-1 sm:flex-none"
            onClick={() => { setShowPlan(true); setStep(0); }}
          >
            {isNb ? "Vis plan" : "Show plan"}
          </Button>
          {!hideDismiss && (
            <button
              onClick={() => setDismissed(true)}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-2"
            >
              {isNb ? "Ikke nå" : "Not now"}
            </button>
          )}
        </div>
      </div>
    );
  }

  // ---- Ekspandert plan ----
  const sev = severityChip(current.severity);

  return (
    <div className="rounded-2xl border border-primary/20 bg-primary/5 p-3 sm:p-5 space-y-4">
      {/* Header */}
      <div className="flex items-start gap-3 sm:gap-4">
        <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0">
          <Diamond className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">
            {isNb ? "Lara har lagt en plan" : "Lara has prepared a plan"}
          </p>
          <p className="text-sm text-foreground/80 mt-0.5">
            {isNb
              ? `${totalCount} oppgave${totalCount === 1 ? "" : "r"} totalt — starter med de ${total} mest kritiske · ca. ${total * 3} min`
              : `${totalCount} task${totalCount === 1 ? "" : "s"} total — starting with the ${total} most critical · ~${total * 3} min`}
          </p>
        </div>
        <button
          onClick={() => setShowPlan(false)}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors shrink-0"
        >
          {isNb ? "Lukk" : "Close"}
        </button>
      </div>

      {/* Step dots */}
      <div className="flex items-center justify-center gap-1.5">
        {tasks.map((_, i) => (
          <span
            key={i}
            className={cn("h-1 rounded-full transition-all", i === step ? "w-8 bg-primary" : "w-5 bg-muted")}
          />
        ))}
      </div>

      {/* Task card */}
      <div className="rounded-xl bg-card border border-border p-4 sm:p-5 space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className={cn("h-2 w-2 rounded-full", sev.dot)} />
            <span className={cn("text-xs font-bold tracking-wider", sev.text)}>{sev.label}</span>
          </div>
          <h4 className="text-lg sm:text-xl font-bold text-foreground break-words">{current.title}</h4>
          {current.category && <p className="text-sm text-foreground/70">{current.category}</p>}
        </div>

        <div className="rounded-lg bg-muted/60 p-3 sm:p-4 space-y-1.5 border border-border/50">
          <p className="text-xs font-bold text-foreground/60 tracking-wider">
            {isNb ? "LARA SER" : "LARA SEES"}
          </p>
          <p className="text-sm text-foreground leading-relaxed">{current.insight}</p>
        </div>

        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 pt-1">
          <Button
            className="rounded-full px-5 w-full sm:w-auto"
            onClick={() => onPrimaryAction(current)}
          >
            {isNb
              ? (current.primaryCtaLabelNb ?? "Be Lara håndtere det")
              : (current.primaryCtaLabelEn ?? "Ask Lara to handle it")}
          </Button>
          {onSecondaryAction && (
            <Button
              variant="outline"
              className="rounded-full px-5 w-full sm:w-auto"
              onClick={() => onSecondaryAction(current)}
            >
              {isNb
                ? (current.secondaryCtaLabelNb ?? "Åpne leverandøren")
                : (current.secondaryCtaLabelEn ?? "Open vendor")}
            </Button>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between gap-3 flex-wrap pt-1">
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => setStep(Math.max(0, step - 1))}
            disabled={step === 0}
            className="h-9 w-9 rounded-full border border-border bg-card flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label={isNb ? "Forrige" : "Previous"}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm text-muted-foreground tabular-nums">
            {step + 1} {isNb ? "av" : "of"} {total}
          </span>
          <button
            onClick={() => setStep(Math.min(total - 1, step + 1))}
            disabled={step === total - 1}
            className="h-9 w-9 rounded-full border border-primary/30 bg-primary/10 flex items-center justify-center text-primary hover:bg-primary/15 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label={isNb ? "Neste" : "Next"}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {onShowAll && (
          <button
            onClick={onShowAll}
            className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
          >
            <span className="hidden sm:inline">{isNb ? showAllLabelNb : showAllLabelEn}</span>
            <span className="sm:hidden">{isNb ? "Alle" : "All"}</span>
            <span className="inline-flex items-center justify-center min-w-[28px] h-6 px-2 rounded-full bg-primary text-primary-foreground text-xs font-bold tabular-nums">
              {totalCount}
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
