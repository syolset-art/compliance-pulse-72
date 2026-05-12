import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Shield, Lock, Brain, Server, FileCheck, Scale,
  Download, FileText, ChevronDown, ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export interface FrameworkGap {
  framework_id: string;
  framework_name: string;
  score: number;
  total: number;
  fulfilled: number;
  gaps: GapItem[];
}

export interface GapItem {
  id: string;
  title: string;
  domain: string;
  reference?: string;
  severity: "critical" | "high" | "medium" | "low";
}

const FRAMEWORK_ICONS: Record<string, React.ReactNode> = {
  iso27001: <Shield className="h-4 w-4 text-primary" />,
  gdpr: <Lock className="h-4 w-4 text-primary" />,
  aiact: <Brain className="h-4 w-4 text-primary" />,
  nis2: <Server className="h-4 w-4 text-primary" />,
  cra: <Shield className="h-4 w-4 text-primary" />,
  nsm: <FileCheck className="h-4 w-4 text-primary" />,
  popplyl: <Scale className="h-4 w-4 text-primary" />,
};

const DEMO_GAPS: FrameworkGap[] = [
  {
    framework_id: "nis2",
    framework_name: "NIS2",
    score: 18,
    total: 24,
    fulfilled: 4,
    gaps: [
      { id: "n1", title: "Mangler dokumentert hendelsesrapporteringsrutine til myndigheter", domain: "Hendelseshåndtering", reference: "Artikkel 23", severity: "critical" },
      { id: "n2", title: "Ingen formell risikoanalyse av nettverk og informasjonssystemer", domain: "Risiko", reference: "Artikkel 21(2)(a)", severity: "critical" },
      { id: "n3", title: "Ledelsen ikke involvert i cybersikkerhetsbeslutninger", domain: "Styring", reference: "Artikkel 20", severity: "critical" },
      { id: "n4", title: "Leverandørstyring ikke dokumentert", domain: "Tredjepart", reference: "Artikkel 21(2)(d)", severity: "high" },
      { id: "n5", title: "Tilgangskontroll og autentisering uten MFA-policy", domain: "Tilgang", reference: "Artikkel 21(2)(j)", severity: "high" },
      { id: "n6", title: "Kontinuitetsplan og backup-strategi mangler", domain: "Drift", reference: "Artikkel 21(2)(c)", severity: "high" },
      { id: "n7", title: "Sårbarhetshåndteringsprosess ikke etablert", domain: "Drift", reference: "Artikkel 21(2)(e)", severity: "high" },
      { id: "n8", title: "Kryptering av data ikke implementert systematisk", domain: "Drift", reference: "Artikkel 21(2)(h)", severity: "medium" },
      { id: "n9", title: "Awareness-trening ikke gjennomført", domain: "HR", reference: "Artikkel 21(2)(g)", severity: "medium" },
    ],
  },
  {
    framework_id: "gdpr",
    framework_name: "GDPR",
    score: 42,
    total: 18,
    fulfilled: 8,
    gaps: [
      { id: "g1", title: "Behandlingsprotokoll ikke ferdigstilt", domain: "Dokumentasjon", reference: "Artikkel 30", severity: "critical" },
      { id: "g2", title: "Databehandleravtaler mangler for 3 leverandører", domain: "Tredjepart", reference: "Artikkel 28", severity: "high" },
      { id: "g3", title: "Rutine for innsynsbegjæringer", domain: "Rettigheter", reference: "Artikkel 15", severity: "medium" },
      { id: "g4", title: "DPIA mangler for HR-system", domain: "Risiko", reference: "Artikkel 35", severity: "high" },
      { id: "g5", title: "Slettingsrutiner ikke implementert", domain: "Drift", reference: "Artikkel 17", severity: "medium" },
    ],
  },
  {
    framework_id: "iso27001",
    framework_name: "ISO 27001",
    score: 53,
    total: 93,
    fulfilled: 49,
    gaps: [
      { id: "i1", title: "Ledelsens gjennomgang ikke utført siste 12 mnd", domain: "Styring", reference: "Krav 9.3", severity: "high" },
      { id: "i2", title: "Risikobehandlingsplan mangler", domain: "Risiko", reference: "Krav 6.1.3", severity: "high" },
      { id: "i3", title: "Awareness-trening ikke dokumentert", domain: "HR", reference: "Vedlegg A.7.2", severity: "medium" },
      { id: "i4", title: "Penetrasjonstest mangler", domain: "Drift", reference: "Vedlegg A.8.8", severity: "high" },
      { id: "i5", title: "Klassifisering av informasjon", domain: "Eiendeler", reference: "Vedlegg A.5.12", severity: "medium" },
      { id: "i6", title: "Beredskapsøvelse ikke gjennomført", domain: "Kontinuitet", reference: "Vedlegg A.5.30", severity: "medium" },
    ],
  },
  {
    framework_id: "aiact",
    framework_name: "EU AI Act",
    score: 0,
    total: 12,
    fulfilled: 0,
    gaps: [
      { id: "a1", title: "AI-systemregister ikke etablert", domain: "Styring", reference: "Artikkel 49", severity: "critical" },
      { id: "a2", title: "Risikoklassifisering av AI-systemer mangler", domain: "Risiko", reference: "Artikkel 6", severity: "critical" },
      { id: "a3", title: "Menneskelig tilsyn ikke definert", domain: "Drift", reference: "Artikkel 14", severity: "high" },
      { id: "a4", title: "Transparens overfor brukere", domain: "Dokumentasjon", reference: "Artikkel 13", severity: "high" },
    ],
  },
];

const SEVERITY_LABEL: Record<GapItem["severity"], string> = {
  critical: "Kritisk",
  high: "Vesentlig",
  medium: "Mindre",
  low: "Mindre",
};

function severityDot(s: GapItem["severity"]) {
  if (s === "critical") return "bg-destructive";
  if (s === "high") return "bg-warning";
  return "bg-muted-foreground/40";
}

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

  // Open/closed state per framework — første åpen, resten lukket (multi-mode)
  const [openIds, setOpenIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!open) return;
    const init: Record<string, boolean> = {};
    visibleFrameworks.forEach((f, i) => { init[f.framework_id] = singleMode || i === 0; });
    setOpenIds(init);
    setExpandedIds({});
  }, [open, initialFrameworkId]); // eslint-disable-line react-hooks/exhaustive-deps

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 gap-0 max-h-[88vh] overflow-hidden flex flex-col">
        <DialogHeader className="px-6 pt-5 pb-4 border-b border-border space-y-1">
          <p className="text-[11px] text-muted-foreground">{customerName} · Gap-analyse</p>
          <DialogTitle className="text-lg font-semibold">
            Manglende kontroller per regelverk
          </DialogTitle>
          <DialogDescription className="text-[13px] text-muted-foreground">
            Basert på kundens vurderinger. Kan legges ved tilbud som dokumentasjon.
          </DialogDescription>
        </DialogHeader>

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

        <DialogFooter className="p-4 border-t border-border bg-muted/20 sm:justify-between gap-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Lukk
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleDownload} className="gap-1.5">
              <Download className="h-3.5 w-3.5" /> Last ned PDF
            </Button>
            <Button size="sm" onClick={handleCreateOffer} className="gap-1.5">
              Opprett tilbud <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function StatCard({ label, value, valueClass }: { label: string; value: number; valueClass?: string }) {
  return (
    <div className="rounded-md border border-border bg-background px-3 py-2.5">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className={cn("text-xl font-semibold tabular-nums text-foreground", valueClass)}>{value}</p>
    </div>
  );
}
