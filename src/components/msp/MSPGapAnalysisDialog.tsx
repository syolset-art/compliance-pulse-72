import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Shield, Lock, Brain, Server, FileCheck, Scale,
  AlertTriangle, AlertCircle, Search, Download, FileText, CheckCircle2,
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
  severity: "critical" | "high" | "medium" | "low";
  recommendation?: string;
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

// Demo data — i produksjon kommer dette fra gap-analyse-engine
const DEMO_GAPS: FrameworkGap[] = [
  {
    framework_id: "nis2",
    framework_name: "NIS2",
    score: 18,
    total: 24,
    fulfilled: 4,
    gaps: [
      { id: "n1", title: "Hendelsesrapportering til myndighet innen 24 timer", domain: "Hendelseshåndtering", severity: "critical", recommendation: "Etabler rapporteringsrutine og kontaktpunkt mot myndighet." },
      { id: "n2", title: "Risikohåndteringspolicy for cybersikkerhet", domain: "Styring", severity: "critical", recommendation: "Lara kan generere et utkast basert på bransje." },
      { id: "n3", title: "Leverandørkjede-risikovurdering", domain: "Tredjepart", severity: "high" },
      { id: "n4", title: "Kontinuitetsplan og backup-strategi", domain: "Drift", severity: "high" },
      { id: "n5", title: "Ledelsens godkjenning av sikkerhetstiltak", domain: "Styring", severity: "medium" },
      { id: "n6", title: "Sårbarhetshåndteringsprosess", domain: "Drift", severity: "high" },
      { id: "n7", title: "Multifaktorautentisering for kritiske systemer", domain: "Tilgang", severity: "critical" },
    ],
  },
  {
    framework_id: "gdpr",
    framework_name: "GDPR",
    score: 42,
    total: 18,
    fulfilled: 8,
    gaps: [
      { id: "g1", title: "Behandlingsprotokoll (Art. 30) ikke ferdigstilt", domain: "Dokumentasjon", severity: "critical" },
      { id: "g2", title: "Databehandleravtaler mangler for 3 leverandører", domain: "Tredjepart", severity: "high" },
      { id: "g3", title: "Rutine for innsynsbegjæringer", domain: "Rettigheter", severity: "medium" },
      { id: "g4", title: "DPIA mangler for HR-system", domain: "Risiko", severity: "high" },
      { id: "g5", title: "Slettingsrutiner ikke implementert", domain: "Drift", severity: "medium" },
    ],
  },
  {
    framework_id: "iso27001",
    framework_name: "ISO 27001",
    score: 53,
    total: 93,
    fulfilled: 49,
    gaps: [
      { id: "i1", title: "Ledelsens gjennomgang ikke utført siste 12 mnd", domain: "Styring", severity: "high" },
      { id: "i2", title: "Risikobehandlingsplan mangler", domain: "Risiko", severity: "high" },
      { id: "i3", title: "Awareness-trening ikke dokumentert", domain: "HR", severity: "medium" },
      { id: "i4", title: "Penetrasjonstest mangler", domain: "Drift", severity: "high" },
      { id: "i5", title: "Klassifisering av informasjon", domain: "Eiendeler", severity: "medium" },
      { id: "i6", title: "Beredskapsøvelse ikke gjennomført", domain: "Kontinuitet", severity: "medium" },
    ],
  },
  {
    framework_id: "aiact",
    framework_name: "EU AI Act",
    score: 0,
    total: 12,
    fulfilled: 0,
    gaps: [
      { id: "a1", title: "AI-systemregister ikke etablert", domain: "Styring", severity: "critical" },
      { id: "a2", title: "Risikoklassifisering av AI-systemer mangler", domain: "Risiko", severity: "critical" },
      { id: "a3", title: "Menneskelig tilsyn ikke definert", domain: "Drift", severity: "high" },
      { id: "a4", title: "Transparens overfor brukere", domain: "Dokumentasjon", severity: "high" },
    ],
  },
];

const SEVERITY_STYLES: Record<GapItem["severity"], { bg: string; text: string; label: string; icon: React.ReactNode }> = {
  critical: { bg: "bg-destructive/10 border-destructive/30", text: "text-destructive", label: "Kritisk", icon: <AlertTriangle className="h-3 w-3" /> },
  high: { bg: "bg-warning/10 border-warning/30", text: "text-warning", label: "Høy", icon: <AlertCircle className="h-3 w-3" /> },
  medium: { bg: "bg-muted border-border", text: "text-muted-foreground", label: "Medium", icon: <AlertCircle className="h-3 w-3" /> },
  low: { bg: "bg-muted border-border", text: "text-muted-foreground", label: "Lav", icon: <AlertCircle className="h-3 w-3" /> },
};

function scoreColor(s: number) {
  if (s >= 75) return "bg-success";
  if (s >= 50) return "bg-warning";
  return "bg-destructive";
}

export interface MSPGapAnalysisDialogProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  customerName?: string;
  /** Optional: prefilter to a single framework */
  initialFrameworkId?: string;
  /** Show "Bruk i tilbud" CTA instead of just download */
  attachMode?: boolean;
  onAttach?: (frameworkId: string | "all") => void;
}

export function MSPGapAnalysisDialog({
  open,
  onOpenChange,
  customerName = "Kunden",
  initialFrameworkId,
  attachMode = false,
  onAttach,
}: MSPGapAnalysisDialogProps) {
  const [active, setActive] = useState<string>(initialFrameworkId || "all");
  const [search, setSearch] = useState("");

  const totalGaps = DEMO_GAPS.reduce((a, f) => a + f.gaps.length, 0);
  const criticalGaps = DEMO_GAPS.reduce((a, f) => a + f.gaps.filter(g => g.severity === "critical").length, 0);
  const avgScore = Math.round(DEMO_GAPS.reduce((a, f) => a + f.score, 0) / DEMO_GAPS.length);

  const filteredFrameworks = useMemo(() => {
    return DEMO_GAPS.map(f => ({
      ...f,
      gaps: f.gaps.filter(g =>
        !search.trim() ||
        g.title.toLowerCase().includes(search.toLowerCase()) ||
        g.domain.toLowerCase().includes(search.toLowerCase())
      ),
    })).filter(f => active === "all" || f.framework_id === active);
  }, [search, active]);

  const handleDownload = () => {
    toast.success("Gap-analyse lastes ned", {
      description: `Rapport for ${customerName} (PDF) genereres.`,
    });
  };

  const handleAttach = () => {
    onAttach?.(active);
    toast.success("Gap-analyse lagt ved", {
      description: active === "all"
        ? "Hele rapporten legges ved tilbudet som PDF."
        : `${DEMO_GAPS.find(f => f.framework_id === active)?.framework_name}-utdraget legges ved tilbudet.`,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0 gap-0 max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="p-5 pb-3 border-b border-border space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 text-[10px]">
              Gap-analyse
            </Badge>
            <span className="text-xs text-muted-foreground">{customerName}</span>
          </div>
          <DialogTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Alle gap mot regelverk
          </DialogTitle>
          <DialogDescription className="text-[13px]">
            Oversikt over åpne krav kunden ikke oppfyller per regelverk. Bruk dette til å forme tilbud og prioritere tiltak.
          </DialogDescription>
        </DialogHeader>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 p-4 border-b border-border bg-muted/20">
          <Card className="p-3 bg-background">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Snitt modenhet</p>
            <p className="text-2xl font-bold text-foreground mt-1">{avgScore}%</p>
          </Card>
          <Card className="p-3 bg-background">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Åpne gap</p>
            <p className="text-2xl font-bold text-foreground mt-1">{totalGaps}</p>
          </Card>
          <Card className="p-3 bg-background">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Kritiske</p>
            <p className="text-2xl font-bold text-destructive mt-1">{criticalGaps}</p>
          </Card>
        </div>

        <div className="p-4 border-b border-border">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Søk i gap (krav eller område)…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-8 h-8 text-[13px]"
            />
          </div>
        </div>

        <Tabs value={active} onValueChange={setActive} className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="mx-4 mt-3 inline-flex h-auto w-fit flex-wrap gap-1 bg-muted/40 p-1">
            <TabsTrigger value="all" className="text-xs gap-1.5">
              Alle
              <Badge variant="secondary" className="h-4 px-1 text-[10px]">{totalGaps}</Badge>
            </TabsTrigger>
            {DEMO_GAPS.map(f => (
              <TabsTrigger key={f.framework_id} value={f.framework_id} className="text-xs gap-1.5">
                {FRAMEWORK_ICONS[f.framework_id]}
                {f.framework_name}
                <Badge variant="secondary" className="h-4 px-1 text-[10px]">{f.gaps.length}</Badge>
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={active} className="flex-1 overflow-y-auto p-4 space-y-4 mt-3">
            {filteredFrameworks.map(f => (
              <Card key={f.framework_id} className="p-4 space-y-3">
                {/* Framework header */}
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    {FRAMEWORK_ICONS[f.framework_id]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-foreground">{f.framework_name}</h4>
                      <span className="text-[12px] text-muted-foreground">
                        {f.fulfilled}/{f.total} krav oppfylt
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Progress value={f.score} className="h-1.5 flex-1" />
                      <span className={cn("text-xs font-semibold tabular-nums", f.score >= 75 ? "text-success" : f.score >= 50 ? "text-warning" : "text-destructive")}>
                        {f.score}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Gaps list */}
                {f.gaps.length === 0 ? (
                  <div className="flex items-center gap-2 text-[13px] text-muted-foreground py-3 px-3 rounded-md bg-muted/30">
                    <CheckCircle2 className="h-4 w-4 text-success" />
                    Ingen gap matcher søket
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {f.gaps.map(g => {
                      const sev = SEVERITY_STYLES[g.severity];
                      return (
                        <div key={g.id} className={cn("rounded-md border p-3 space-y-1", sev.bg)}>
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-[13px] font-medium text-foreground">{g.title}</p>
                              <p className="text-[11px] text-muted-foreground mt-0.5">{g.domain}</p>
                            </div>
                            <Badge variant="outline" className={cn("text-[10px] gap-1 shrink-0", sev.text, sev.bg)}>
                              {sev.icon}
                              {sev.label}
                            </Badge>
                          </div>
                          {g.recommendation && (
                            <p className="text-[12px] text-muted-foreground leading-snug pt-1 border-t border-border/40">
                              💡 {g.recommendation}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            ))}
          </TabsContent>
        </Tabs>

        <DialogFooter className="p-4 border-t border-border bg-muted/20 sm:justify-between gap-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Lukk
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleDownload} className="gap-1.5">
              <Download className="h-3.5 w-3.5" /> Last ned PDF
            </Button>
            {attachMode && (
              <Button size="sm" onClick={handleAttach} className="gap-1.5">
                <FileText className="h-3.5 w-3.5" /> Legg ved i tilbud
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
