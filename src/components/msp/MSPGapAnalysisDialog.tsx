import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Shield, Lock, Brain, Server, FileCheck, Scale,
  Download, ChevronDown, ArrowRight,
  Sparkles, Loader2, Check, BookOpen, Database, GitCompare, AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { DEMO_GAPS, severityDotClass, type FrameworkGap, type GapItem } from "@/lib/gapData";

export type { FrameworkGap, GapItem };

const FRAMEWORK_ICONS: Record<string, React.ReactNode> = {
  iso27001: <Shield className="h-4 w-4 text-primary" />,
  gdpr: <Lock className="h-4 w-4 text-primary" />,
  aiact: <Brain className="h-4 w-4 text-primary" />,
  nis2: <Server className="h-4 w-4 text-primary" />,
  cra: <Shield className="h-4 w-4 text-primary" />,
  nsm: <FileCheck className="h-4 w-4 text-primary" />,
  popplyl: <Scale className="h-4 w-4 text-primary" />,
};

const severityDot = severityDotClass;

const INITIAL_VISIBLE = 5;

export interface MSPGapAnalysisDialogProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  customerName?: string;
  initialFrameworkId?: string;
  /** Called when user clicks "Opprett tilbud →". Receives framework id (or undefined for all). */
  onCreateOffer?: (frameworkId?: string) => void;
}

export function MSPGapAnalysisDialog({
  open,
  onOpenChange,
  customerName = "Kunden",
  initialFrameworkId,
  onCreateOffer,
}: MSPGapAnalysisDialogProps) {
  const singleMode = !!initialFrameworkId;

  // Bestem hvilke regelverk som vises
  const visibleFrameworks = singleMode
    ? DEMO_GAPS.filter(f => f.framework_id === initialFrameworkId)
    : DEMO_GAPS;

  const frameworkLabel = visibleFrameworks[0]?.framework_name ?? "regelverket";

  // Agentic prosess: idle → running → done → results
  type Phase = "running" | "done" | "results";
  const [phase, setPhase] = useState<Phase>("running");
  const [stepIndex, setStepIndex] = useState(0);

  const PROCESS_STEPS: { icon: React.ReactNode; label: string; detail: string }[] = [
    { icon: <Shield className="h-4 w-4" />, label: `Leser ${customerName}s Trust Profile`, detail: "Henter modenhet, kontroller og bevis fra profilen" },
    { icon: <BookOpen className="h-4 w-4" />, label: `Laster kravsett for ${frameworkLabel}`, detail: `Henter aktive kontroller fra ${frameworkLabel}-rammeverket` },
    { icon: <Database className="h-4 w-4" />, label: "Samler bevis fra aktiverte regelverk", detail: "Gjenbruker dokumentasjon fra GDPR, ISO 27001 og andre aktive regelverk" },
    { icon: <GitCompare className="h-4 w-4" />, label: `Sammenligner Trust Profile mot ${frameworkLabel}`, detail: `Lara matcher kundens kontroller mot ${frameworkLabel}-krav` },
    { icon: <AlertTriangle className="h-4 w-4" />, label: "Identifiserer gap og kritikalitet", detail: "Klassifiserer mangler etter alvorlighet" },
    { icon: <Sparkles className="h-4 w-4" />, label: "Foreslår tjenester som lukker gap", detail: "Kobler gap til tjenestekatalogen din" },
  ];

  // Open/closed state per framework — første åpen, resten lukket (multi-mode)
  const [openIds, setOpenIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!open) return;
    const init: Record<string, boolean> = {};
    visibleFrameworks.forEach((f, i) => { init[f.framework_id] = singleMode || i === 0; });
    setOpenIds(init);
    setExpandedIds({});
    // Start prosessen på nytt hver gang dialogen åpnes
    setPhase("running");
    setStepIndex(0);
  }, [open, initialFrameworkId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Driv prosess-stegene
  useEffect(() => {
    if (!open || phase !== "running") return;
    if (stepIndex >= PROCESS_STEPS.length) {
      const t = setTimeout(() => setPhase("done"), 350);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setStepIndex(i => i + 1), 650);
    return () => clearTimeout(t);
  }, [open, phase, stepIndex, PROCESS_STEPS.length]);

  // Auto-gå til resultater etter "fullført"-bekreftelse
  useEffect(() => {
    if (phase !== "done") return;
    const t = setTimeout(() => setPhase("results"), 900);
    return () => clearTimeout(t);
  }, [phase]);

  // Per-framework "Vis flere" expansion
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

  // Stats
  const allGaps = visibleFrameworks.flatMap(f => f.gaps);
  const total = allGaps.length;
  const critical = allGaps.filter(g => g.severity === "critical").length;
  const major = allGaps.filter(g => g.severity === "high").length;
  const minor = allGaps.filter(g => g.severity === "medium" || g.severity === "low").length;

  const handleDownload = () => {
    toast.success("Gap-analyse lastes ned", {
      description: `Rapport for ${customerName} (PDF) genereres.`,
    });
  };

  const handleCreateOffer = () => {
    onOpenChange(false);
    onCreateOffer?.(initialFrameworkId);
  };

  const isProcessing = phase === "running" || phase === "done";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 gap-0 max-h-[88vh] overflow-hidden flex flex-col">
        <DialogHeader className="px-6 pt-5 pb-4 border-b border-border space-y-1">
          <p className="text-xs text-muted-foreground">{customerName} · Gap-analyse</p>
          <DialogTitle className="text-lg font-semibold">
            {isProcessing
              ? `Lara analyserer ${frameworkLabel}`
              : "Manglende kontroller per regelverk"}
          </DialogTitle>
          <DialogDescription className="text-[13px] text-muted-foreground">
            {isProcessing
              ? "Tar normalt 10–20 sekunder. Du kan trygt lukke — analysen kjører videre i bakgrunnen."
              : "Basert på kundens vurderinger. Kan legges ved tilbud som dokumentasjon."}
          </DialogDescription>
        </DialogHeader>

        {isProcessing ? (
          <div className="flex-1 overflow-y-auto px-6 py-6">
            <ol className="space-y-2">
              {PROCESS_STEPS.map((s, i) => {
                const status: "done" | "active" | "pending" =
                  phase === "done" || i < stepIndex ? "done" : i === stepIndex ? "active" : "pending";
                return (
                  <li
                    key={s.label}
                    className={cn(
                      "flex items-start gap-3 rounded-lg border p-3 transition-all",
                      status === "active" && "border-primary/40 bg-primary/5",
                      status === "done" && "border-border bg-card",
                      status === "pending" && "border-border/60 bg-muted/20 opacity-60",
                    )}
                  >
                    <div
                      className={cn(
                        "h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
                        status === "active" && "bg-primary/15 text-primary",
                        status === "done" && "bg-success/15 text-success",
                        status === "pending" && "bg-muted text-muted-foreground",
                      )}
                    >
                      {status === "active" ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : status === "done" ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        s.icon
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "text-sm font-medium",
                        status === "pending" ? "text-muted-foreground" : "text-foreground",
                      )}>
                        {s.label}
                      </p>
                      <p className="text-[12px] text-muted-foreground mt-0.5">{s.detail}</p>
                    </div>
                  </li>
                );
              })}
            </ol>

            {phase === "done" && (
              <div className="mt-5 flex items-center gap-3 rounded-lg border border-success/30 bg-success/10 p-3">
                <div className="h-8 w-8 rounded-lg bg-success/20 flex items-center justify-center shrink-0">
                  <Check className="h-4 w-4 text-success" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">Analyse fullført</p>
                  <p className="text-[12px] text-muted-foreground">Viser resultatet …</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* 4 stat-kort */}
            <div className="grid grid-cols-4 gap-2 px-6 py-4 border-b border-border">
              <StatCard label="Totalt" value={total} />
              <StatCard label="Kritiske" value={critical} valueClass="text-destructive" />
              <StatCard label="Vesentlige" value={major} valueClass="text-warning" />
              <StatCard label="Mindre" value={minor} />
            </div>

            {/* Per-regelverk blokker */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2.5">
              {visibleFrameworks.map(f => {
                const isOpen = openIds[f.framework_id];
                const expanded = expandedIds[f.framework_id];
                const criticalCount = f.gaps.filter(g => g.severity === "critical").length;
                const visibleGaps = expanded ? f.gaps : f.gaps.slice(0, INITIAL_VISIBLE);
                const hidden = f.gaps.length - visibleGaps.length;

                return (
                  <div key={f.framework_id} className="rounded-lg border border-border overflow-hidden">
                    <button
                      type="button"
                      onClick={() => !singleMode && setOpenIds(p => ({ ...p, [f.framework_id]: !p[f.framework_id] }))}
                      disabled={singleMode}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-3 text-left",
                        !singleMode && "hover:bg-muted/40 transition-colors",
                      )}
                    >
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        {FRAMEWORK_ICONS[f.framework_id]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground">{f.framework_name}</p>
                        <p className="text-[12px] text-muted-foreground">
                          {f.gaps.length} gap{criticalCount > 0 && <> · {criticalCount} kritiske</>}
                        </p>
                      </div>
                      {!singleMode && (
                        <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", isOpen && "rotate-180")} />
                      )}
                    </button>

                    {isOpen && (
                      <div className="px-3 pb-3 space-y-1">
                        {visibleGaps.map(g => (
                          <div key={g.id} className="flex items-center gap-2.5 rounded-md px-3 py-1.5 bg-muted/30">
                            <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", severityDot(g.severity))} />
                            <p className="text-[13px] text-foreground truncate flex-1">{g.title}</p>
                          </div>
                        ))}
                        {f.gaps.length > INITIAL_VISIBLE && (
                          <button
                            type="button"
                            onClick={() => setExpandedIds(p => ({ ...p, [f.framework_id]: !expanded }))}
                            className="w-full text-center text-[12px] text-primary hover:underline py-2"
                          >
                            {expanded ? "Vis færre ↑" : `Vis ${hidden} til ↓`}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        <DialogFooter className="p-4 border-t border-border bg-muted/20 sm:justify-between gap-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            {isProcessing ? "Lukk (kjører videre)" : "Lukk"}
          </Button>
          {!isProcessing && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleDownload} className="gap-1.5">
                <Download className="h-3.5 w-3.5" /> Last ned PDF
              </Button>
              <Button size="sm" onClick={handleCreateOffer} className="gap-1.5">
                Opprett tilbud <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function StatCard({ label, value, valueClass }: { label: string; value: number; valueClass?: string }) {
  return (
    <div className="rounded-md border border-border bg-background px-3 py-2.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn("text-xl font-semibold tabular-nums text-foreground", valueClass)}>{value}</p>
    </div>
  );
}
