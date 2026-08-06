import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Diamond, ChevronLeft, ChevronRight, Clock, X, LayoutList, Table as TableIcon, Sparkles, AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { useLaraSuggestionStates, type LaraSuggestionContext } from "@/hooks/useLaraSuggestionStates";
import { toast } from "sonner";
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
  /** Trykk på "Les mer" — får tasken som argument. Vises kun for tasks med readMoreCtaLabelNb/En. */
  onReadMore?: (task: LaraPlanTask) => void;
  /** Trykk på "La Lara gjøre det" — vises kun for tasks med canAutoRun. */
  onLaraAutoRun?: (task: LaraPlanTask) => void;
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
  onReadMore,
  onLaraAutoRun,
  hideDismiss = false,
}: Props) {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const isNb = i18n.language === "nb" || i18n.language === "no";
  const [showPlan, setShowPlan] = useState(false);
  const [step, setStep] = useState(0);
  const [viewMode, setViewMode] = useState<"single" | "table">("single");
  const { hiddenKeys, snooze, dismiss } = useLaraSuggestionStates();

  const visibleTasks = useMemo(
    () => tasks.filter(t => !hiddenKeys.has(t.id)),
    [tasks, hiddenKeys]
  );

  if (visibleTasks.length === 0) return null;

  const total = visibleTasks.length;
  const current = visibleTasks[Math.min(step, total - 1)];

  const snapshotFor = (task: LaraPlanTask): LaraSuggestionContext => ({
    title: task.title,
    severity: (task.severity as any) || "medium",
    insight: task.insight,
    category: task.category || null,
    source: "lara_recommendation_banner",
  });

  const handleSnooze = () => {
    const until = new Date(Date.now() + 7 * 86400000);
    const untilLabel = until.toLocaleDateString(isNb ? "nb-NO" : "en-US", { day: "numeric", month: "long" });
    snooze({ key: current.id, snapshot: snapshotFor(current) });
    toast.success(isNb ? "Forslaget er utsatt" : "Suggestion snoozed", {
      description: isNb
        ? `Lara minner deg på «${current.title}» igjen ${untilLabel}. Du finner det i Lara-innboksen til da.`
        : `Lara will remind you about "${current.title}" on ${untilLabel}. You can find it in the Lara inbox until then.`,
      icon: <Clock className="h-4 w-4" />,
      duration: 5000,
    });
  };

  const handleDismiss = () => {
    dismiss({ key: current.id, snapshot: snapshotFor(current) });
    toast.success(isNb ? "Forslaget er avvist" : "Suggestion dismissed", {
      description: isNb
        ? `«${current.title}» er flyttet til arkivet i Lara-innboksen og kan hentes tilbake derfra.`
        : `"${current.title}" has been moved to the archive in the Lara inbox and can be restored from there.`,
      icon: <X className="h-4 w-4" />,
      duration: 5000,
    });
  };


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
            <>
              <button
                onClick={handleSnooze}
                className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-2"
                title={isNb ? "Utsett 7 dager" : "Snooze 7 days"}
              >
                <Clock className="h-3.5 w-3.5" />
                {isNb ? "Utsett" : "Snooze"}
              </button>
              <button
                onClick={handleDismiss}
                className="inline-flex items-center justify-center h-9 w-9 rounded-full text-muted-foreground hover:text-destructive transition-colors"
                title={isNb ? "Avvis" : "Dismiss"}
                aria-label={isNb ? "Avvis" : "Dismiss"}
              >
                <X className="h-4 w-4" />
              </button>
            </>
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
      <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
        <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 hidden sm:flex">
          <Diamond className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-3 sm:hidden">
            <div className="h-9 w-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0">
              <Diamond className="h-4 w-4" />
            </div>
            <p className="text-sm font-semibold text-foreground">
              {isNb ? "Lara har lagt en plan" : "Lara has prepared a plan"}
            </p>
          </div>
          <p className="hidden sm:block text-sm font-semibold text-foreground">
            {isNb ? "Lara har lagt en plan" : "Lara has prepared a plan"}
          </p>
          <p className="text-sm text-foreground/80 mt-0.5">
            {isNb
              ? `${totalCount} oppgave${totalCount === 1 ? "" : "r"} totalt — starter med de ${total} mest kritiske · ca. ${total * 3} min`
              : `${totalCount} task${totalCount === 1 ? "" : "s"} total — starting with the ${total} most critical · ~${total * 3} min`}
          </p>
        </div>
        <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-1 sm:shrink-0">
          <div className="inline-flex items-center rounded-full border border-border bg-card p-0.5">
            <button
              onClick={() => setViewMode("single")}
              className={cn(
                "inline-flex items-center gap-1 h-7 px-2.5 rounded-full text-xs transition-colors",
                viewMode === "single" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              )}
              title={isNb ? "Én og én" : "One by one"}
            >
              <LayoutList className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{isNb ? "Én og én" : "One by one"}</span>
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={cn(
                "inline-flex items-center gap-1 h-7 px-2.5 rounded-full text-xs transition-colors",
                viewMode === "table" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              )}
              title={isNb ? "Tabell" : "Table"}
            >
              <TableIcon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{isNb ? "Tabell" : "Table"}</span>
            </button>
          </div>
          <button
            onClick={() => setShowPlan(false)}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors px-2"
          >
            {isNb ? "Lukk" : "Close"}
          </button>
        </div>
      </div>

      {viewMode === "table" ? (
        <div className="rounded-xl border border-border bg-card overflow-x-auto -mx-3 sm:mx-0">
          <Table className="min-w-[640px]">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">{isNb ? "Alvorlighet" : "Severity"}</TableHead>
                <TableHead>{isNb ? "Anbefaling" : "Recommendation"}</TableHead>
                <TableHead className="w-[160px]">{isNb ? "Kategori" : "Category"}</TableHead>
                <TableHead className="w-[220px] text-right">{isNb ? "Handlinger" : "Actions"}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleTasks.map((t) => {
                const s = severityChip(t.severity);
                return (
                  <TableRow key={t.id}>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <span className={cn("h-2 w-2 rounded-full", s.dot)} />
                        <span className={cn("text-[12px] font-bold tracking-wider", s.text)}>{s.label}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium text-foreground">{t.title}</div>
                      <div className="text-[12px] text-muted-foreground mt-0.5 line-clamp-2">{t.insight}</div>
                    </TableCell>
                    <TableCell className="text-[12px] text-muted-foreground">{t.category ?? "—"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                        {t.canAutoRun && onLaraAutoRun && (
                          <Button size="sm" className="h-7 rounded-full text-xs gap-1" onClick={() => onLaraAutoRun(t)}>
                            <Sparkles className="h-3 w-3" />
                            {isNb ? (t.autoRunLabelNb ?? "La Lara gjøre det") : (t.autoRunLabelEn ?? "Let Lara do it")}
                          </Button>
                        )}
                        <Button size="sm" variant={t.canAutoRun ? "outline" : "default"} className="h-7 rounded-full text-xs" onClick={() => onPrimaryAction(t)}>
                          {isNb ? (t.primaryCtaLabelNb ?? "Be Lara håndtere") : (t.primaryCtaLabelEn ?? "Ask Lara")}
                        </Button>
                        {onSecondaryAction && (
                          <Button size="sm" variant="outline" className="h-7 rounded-full text-xs" onClick={() => onSecondaryAction(t)}>
                            {isNb ? (t.secondaryCtaLabelNb ?? "Åpne") : (t.secondaryCtaLabelEn ?? "Open")}
                          </Button>
                        )}
                        {onReadMore && (t.readMoreCtaLabelNb || t.readMoreCtaLabelEn) && (
                          <Button size="sm" variant="ghost" className="h-7 rounded-full text-xs" onClick={() => onReadMore(t)}>
                            {isNb ? (t.readMoreCtaLabelNb ?? "Les mer") : (t.readMoreCtaLabelEn ?? "Read more")}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      ) : (<>


      {/* Step dots */}
      <div className="flex items-center justify-center gap-1.5">
        {visibleTasks.map((_, i) => (
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

        <p className="text-sm text-foreground leading-relaxed">{current.insight}</p>

        {/* Info-gap: Lara mangler data eller foreslår å gjøre noe annet først */}
        {(current.infoGapNb || current.infoGapEn) && (
          <div className="rounded-lg border border-warning/40 bg-warning/10 p-3 sm:p-3.5 flex items-start gap-2.5">
            <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" aria-hidden="true" />
            <div className="space-y-0.5 min-w-0">
              <p className="text-xs font-semibold text-foreground">
                {isNb ? "Lara trenger mer å gå på" : "Lara needs more to work with"}
              </p>
              <p className="text-xs text-foreground/80 leading-relaxed">
                {isNb ? current.infoGapNb : (current.infoGapEn ?? current.infoGapNb)}
              </p>
              {(current.prerequisiteHintNb || current.prerequisiteHintEn) && (
                <p className="text-xs text-foreground/70 leading-relaxed pt-0.5">
                  <span className="font-semibold">{isNb ? "Forslag: " : "Suggestion: "}</span>
                  {isNb ? current.prerequisiteHintNb : (current.prerequisiteHintEn ?? current.prerequisiteHintNb)}
                </p>
              )}
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 pt-1">
          {current.canAutoRun && onLaraAutoRun && (
            <Button
              className="rounded-full px-5 w-full sm:w-auto gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => onLaraAutoRun(current)}
            >
              <Sparkles className="h-4 w-4" />
              {isNb
                ? (current.autoRunLabelNb ?? "La Lara gjøre det")
                : (current.autoRunLabelEn ?? "Let Lara do it")}
            </Button>
          )}
          <Button
            variant={current.canAutoRun ? "outline" : "default"}
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
          {onReadMore && (current.readMoreCtaLabelNb || current.readMoreCtaLabelEn) && (
            <Button
              variant="ghost"
              className="rounded-full px-5 w-full sm:w-auto text-primary hover:text-primary"
              onClick={() => onReadMore(current)}
            >
              {isNb
                ? (current.readMoreCtaLabelNb ?? "Les mer")
                : (current.readMoreCtaLabelEn ?? "Read more")}
            </Button>
          )}
          <div className="hidden sm:block sm:flex-1" />
          <Button
            variant="ghost"
            size="sm"
            className="rounded-full text-muted-foreground"
            onClick={handleSnooze}
            title={isNb ? "Utsett 7 dager" : "Snooze 7 days"}
          >
            <Clock className="h-3.5 w-3.5 mr-1" />
            {isNb ? "Utsett" : "Snooze"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="rounded-full text-muted-foreground hover:text-destructive h-9 w-9 p-0"
            onClick={handleDismiss}
            title={isNb ? "Avvis" : "Dismiss"}
            aria-label={isNb ? "Avvis" : "Dismiss"}
          >
            <X className="h-4 w-4" />
          </Button>
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
      </>)}
    </div>

  );
}
