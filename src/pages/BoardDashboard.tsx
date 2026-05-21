import { useMemo, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Landmark,
  Shield,
  FileDown,
  Building2,
  ArrowUpRight,
  Wallet,
  Info,
  Gavel,
  TrendingUp,
  TrendingDown,
  Minus,
  ActivitySquare,
  ScrollText,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useComplianceRequirements } from "@/hooks/useComplianceRequirements";
import { FrameworkCountryTag } from "@/components/regulations/FrameworkCountryTag";
import { toast } from "sonner";

/* ---------- helpers ---------- */

const maturityTone = (score: number) => {
  // Neutral tones – no "act now" framing for the board snapshot
  if (score >= 75)
    return { dot: "bg-emerald-500/80", text: "text-emerald-600 dark:text-emerald-400", bar: "bg-emerald-500/70" };
  if (score >= 50)
    return { dot: "bg-slate-400", text: "text-slate-600 dark:text-slate-300", bar: "bg-slate-400/70" };
  return { dot: "bg-slate-500", text: "text-slate-600 dark:text-slate-300", bar: "bg-slate-500/70" };
};

const exposureFor = (criticalCount: number, totalOpen: number) => {
  if (criticalCount >= 2 || totalOpen >= 10) return { label: "Forhøyet", dot: "bg-amber-400" };
  if (criticalCount >= 1 || totalOpen >= 4) return { label: "Moderat", dot: "bg-cyan-400" };
  return { label: "Lav", dot: "bg-emerald-400" };
};

const fmtNOK = (n: number) =>
  new Intl.NumberFormat("nb-NO", { style: "currency", currency: "NOK", maximumFractionDigits: 0 }).format(n);

const currentPeriod = () => {
  const d = new Date();
  return `Q${Math.floor(d.getMonth() / 3) + 1} ${d.getFullYear()}`;
};

/* ---------- demo data ---------- */

const DEMO_VENDOR_COSTS = [
  { name: "Microsoft 365", category: "Produktivitet", monthly: 48500, trend: "+3%", dir: "up" as const },
  { name: "AWS", category: "Infrastruktur", monthly: 92300, trend: "+8%", dir: "up" as const },
  { name: "Salesforce", category: "CRM", monthly: 31200, trend: "0%", dir: "flat" as const },
  { name: "Visma", category: "Økonomi", monthly: 14800, trend: "+2%", dir: "up" as const },
  { name: "Slack", category: "Kommunikasjon", monthly: 8900, trend: "-1%", dir: "down" as const },
];

type DecisionCategory = "Risikoaksept" | "Policygodkjenning" | "Investering" | "Regulatorisk vedtak";

interface BoardDecision {
  id: string;
  title: string;
  category: DecisionCategory;
  context: string;
  recommendation: string;
  meeting: string;
}

const SEED_DECISIONS: BoardDecision[] = [
  {
    id: "d1",
    title: "Risikoaksept – fortsatt bruk av leverandør uten ISO 27001",
    category: "Risikoaksept",
    context:
      "En leverandør i kategorien lønn mangler ISO 27001-sertifisering. Avtalen er forretningskritisk og bytte vil ta 9–12 måneder.",
    recommendation:
      "Administrasjonen innstiller på å akseptere restrisikoen i 12 måneder mot kompenserende kontroller (DPA, revisjonsrett, årlig egenerklæring).",
    meeting: "Styremøte 12. juni 2026",
  },
  {
    id: "d2",
    title: "Godkjenning av oppdatert informasjonssikkerhetspolicy",
    category: "Policygodkjenning",
    context:
      "Policyen er revidert for å reflektere NIS2 og nye krav til hendelseshåndtering. Endringene er gjennomgått av CISO og juridisk.",
    recommendation:
      "Administrasjonen innstiller på godkjenning slik at policyen kan tre i kraft 1. juli 2026.",
    meeting: "Styremøte 12. juni 2026",
  },
  {
    id: "d3",
    title: "Vedtak om terskel for DPIA på AI-systemer",
    category: "Regulatorisk vedtak",
    context:
      "AI Act trer i kraft i etapper. Det må fastsettes en intern terskel for når personvernkonsekvensvurdering (DPIA) er obligatorisk for nye AI-systemer.",
    recommendation:
      "Administrasjonen innstiller på terskel: alle systemer i AI Act-kategori «høy risiko» + alle systemer som behandler kundedata.",
    meeting: "Styremøte 12. juni 2026",
  },
];

const NEXT_MEETING = "12. juni 2026";

/* ---------- types ---------- */

interface FrameworkRow {
  framework_id: string;
  framework_name: string;
  score: number;
  trend: number; // demo delta last quarter
}

interface IncidentRow {
  id: string;
  title: string;
  criticality: string | null;
  status: string | null;
  created_at: string | null;
}

/* ---------- small components ---------- */

const TrendChip = ({ dir, value }: { dir: "up" | "down" | "flat"; value: string }) => {
  const Icon = dir === "up" ? TrendingUp : dir === "down" ? TrendingDown : Minus;
  const tone =
    dir === "up"
      ? "text-emerald-600 dark:text-emerald-400"
      : dir === "down"
      ? "text-rose-500"
      : "text-muted-foreground";
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${tone}`}>
      <Icon className="h-3 w-3" />
      {value}
    </span>
  );
};

/* ---------- main ---------- */

const BoardDashboard = () => {
  const { stats } = useComplianceRequirements();
  const [drawer, setDrawer] = useState<null | "compliance" | "risk" | "costs">(null);
  const [decisions, setDecisions] = useState<BoardDecision[]>(SEED_DECISIONS);
  const [processedToday, setProcessedToday] = useState<Array<{ id: string; title: string; verdict: string }>>([]);
  const [activeDecision, setActiveDecision] = useState<BoardDecision | null>(null);
  const [verdict, setVerdict] = useState<"approve" | "postpone" | "delegate" | "noted" | null>(null);
  const [protocolNote, setProtocolNote] = useState("");

  const { data: frameworks = [] } = useQuery({
    queryKey: ["board-frameworks"],
    queryFn: async () => {
      const { data } = await supabase
        .from("selected_frameworks")
        .select("framework_id, framework_name")
        .eq("is_selected", true)
        .order("framework_name");
      return (data ?? []) as Array<{ framework_id: string; framework_name: string }>;
    },
  });

  const { data: incidents = [] } = useQuery({
    queryKey: ["board-incidents"],
    queryFn: async () => {
      const { data } = await supabase
        .from("system_incidents")
        .select("id, title, criticality, status, created_at")
        .neq("status", "closed")
        .order("created_at", { ascending: false });
      return (data ?? []) as IncidentRow[];
    },
  });

  const frameworksWithScore: FrameworkRow[] = useMemo(() => {
    return frameworks.map((f, i) => ({
      framework_id: f.framework_id,
      framework_name: f.framework_name,
      score: stats.byFramework?.[f.framework_id]?.score ?? 0,
      // Demo quarterly trend, deterministic per framework so it doesn't jitter
      trend: [4, 2, 6, 1, 3, -1, 5][i % 7],
    }));
  }, [frameworks, stats]);

  const overallScore = stats.overallScore?.score ?? 0;
  const criticalIncidents = incidents.filter(
    (d) => d.criticality === "critical" || d.criticality === "high"
  );
  const exposure = exposureFor(criticalIncidents.length, incidents.length);
  const totalMonthlyCost = DEMO_VENDOR_COSTS.reduce((s, v) => s + v.monthly, 0);
  const inControl = frameworksWithScore.filter((f) => f.score >= 75).length;
  const lastIncident = incidents[0];

  const openDecision = (d: BoardDecision, v: "approve" | "postpone" | "delegate" | "noted") => {
    setActiveDecision(d);
    setVerdict(v);
    setProtocolNote("");
  };

  const confirmDecision = () => {
    if (!activeDecision || !verdict) return;
    const verdictLabel =
      verdict === "approve"
        ? "Godkjent"
        : verdict === "postpone"
        ? "Utsatt"
        : verdict === "delegate"
        ? "Delegert"
        : "Tatt til orientering";
    setDecisions((prev) => prev.filter((x) => x.id !== activeDecision.id));
    setProcessedToday((prev) => [
      { id: activeDecision.id, title: activeDecision.title, verdict: verdictLabel },
      ...prev,
    ]);
    toast.success(`${verdictLabel}: ${activeDecision.title}`);
    setActiveDecision(null);
    setVerdict(null);
    setProtocolNote("");
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 pt-16 px-6 pb-16 max-w-5xl mx-auto w-full">
        {/* Header */}
        <header className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 border border-cyan-500/20">
              <Landmark className="h-4 w-4 text-cyan-500" />
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight">Styrerom</h1>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider">{currentPeriod()}</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="border-cyan-500/30 hover:border-cyan-500/60 hover:bg-cyan-500/5"
            onClick={() => toast.success("Styrerapport generert (demo)")}
          >
            <FileDown className="h-4 w-4 mr-2" /> Rapport
          </Button>
        </header>

        {/* Hero – big numbers, minimal words */}
        <section className="mb-4">
          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950 text-white shadow-xl">
            <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-emerald-500/20 blur-3xl" />
            <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-cyan-500/20 blur-3xl" />
            <CardContent className="relative p-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-cyan-300/80 mb-2 font-medium">Modenhet</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-7xl font-bold bg-gradient-to-r from-emerald-300 to-cyan-300 bg-clip-text text-transparent tabular-nums leading-none">
                      {overallScore}
                    </span>
                    <span className="text-2xl text-slate-400 font-light">%</span>
                  </div>
                  <div className="mt-3 h-1 w-full rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-400 to-cyan-400"
                      style={{ width: `${overallScore}%` }}
                    />
                  </div>
                </div>
                <div className="border-l border-white/10 pl-6">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-cyan-300/80 mb-2 font-medium">Risiko</p>
                  <div className="flex items-center gap-3">
                    <span className={`h-3 w-3 rounded-full ${exposure.dot}`} />
                    <span className="text-5xl font-bold leading-none">{exposure.label}</span>
                  </div>
                  <p className="mt-3 text-[11px] text-slate-400 uppercase tracking-wider">
                    {incidents.length} åpne · {criticalIncidents.length} kritiske
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* KPI snapshot – BIG numbers, tiny labels */}
        <section className="grid grid-cols-3 gap-3 mb-5">
          <button onClick={() => setDrawer("compliance")} className="text-left group">
            <Card className="h-full border-border/60 hover:border-emerald-500/40 hover:shadow-md transition-all">
              <CardContent className="p-4">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-2">Etterlevelse</p>
                <p className="text-3xl font-bold tabular-nums leading-none">
                  {inControl}<span className="text-lg text-muted-foreground font-normal">/{frameworksWithScore.length}</span>
                </p>
              </CardContent>
            </Card>
          </button>

          <button onClick={() => setDrawer("risk")} className="text-left group">
            <Card className="h-full border-border/60 hover:border-cyan-500/40 hover:shadow-md transition-all">
              <CardContent className="p-4">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-2">Hendelser</p>
                <p className="text-3xl font-bold tabular-nums leading-none">{incidents.length}</p>
              </CardContent>
            </Card>
          </button>

          <button onClick={() => setDrawer("costs")} className="text-left group">
            <Card className="h-full border-border/60 hover:border-cyan-500/40 hover:shadow-md transition-all">
              <CardContent className="p-4">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-2">Kost/mnd</p>
                <p className="text-3xl font-bold tabular-nums leading-none">
                  {(totalMonthlyCost / 1000).toFixed(0)}<span className="text-lg text-muted-foreground font-normal">k</span>
                </p>
              </CardContent>
            </Card>
          </button>
        </section>

        {/* Beslutningskø – slim rows */}
        <section className="mb-5">
          <div className="flex items-baseline justify-between mb-2">
            <h2 className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
              Beslutninger · {decisions.length}
            </h2>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{NEXT_MEETING}</span>
          </div>
          <Card className="border-border/60">
            <CardContent className="p-0 divide-y divide-border/50">
              {decisions.length === 0 && (
                <div className="p-6 text-center">
                  <CheckCircle2 className="h-6 w-6 mx-auto mb-1.5 text-emerald-500/70" />
                  <p className="text-xs text-muted-foreground">Ingen åpne saker</p>
                </div>
              )}
              {decisions.map((d) => (
                <div key={d.id} className="px-4 py-3 flex items-center gap-3">
                  <Badge variant="outline" className="text-[9px] uppercase tracking-wider shrink-0">
                    {d.category}
                  </Badge>
                  <p className="font-medium text-sm flex-1 min-w-0 truncate">{d.title}</p>
                  <div className="flex gap-1 shrink-0">
                    <Button size="sm" className="h-7 px-2.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => openDecision(d, "approve")}>
                      Godkjenn
                    </Button>
                    <Button size="sm" variant="outline" className="h-7 px-2.5 text-xs" onClick={() => openDecision(d, "postpone")}>
                      Utsett
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
          {processedToday.length > 0 && (
            <div className="mt-2 text-[11px] text-muted-foreground">
              {processedToday.map((p) => (
                <span key={p.id} className="inline-flex items-center gap-1 mr-3">
                  <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                  <span className="truncate max-w-[200px]">{p.title}</span>
                  <span className="opacity-70">· {p.verdict}</span>
                </span>
              ))}
            </div>
          )}
        </section>

        {/* Regelverk snapshot – slim rows */}
        <section className="mb-5">
          <div className="flex items-baseline justify-between mb-2">
            <h2 className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">Regelverk</h2>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{frameworksWithScore.length} aktive</span>
          </div>
          <Card className="border-border/60">
            <CardContent className="p-0 divide-y divide-border/50">
              {frameworksWithScore.length === 0 && (
                <div className="p-4 text-xs text-muted-foreground text-center">Ingen aktive</div>
              )}
              {frameworksWithScore.map((fw) => {
                const t = maturityTone(fw.score);
                return (
                  <div key={fw.framework_id} className="flex items-center gap-3 px-4 py-2.5">
                    <span className={`h-2 w-2 rounded-full ${t.dot}`} />
                    <p className="font-medium text-sm flex-1 min-w-0 truncate">{fw.framework_name}</p>
                    <div className="w-24 hidden sm:block h-1 rounded-full bg-muted overflow-hidden">
                      <div className={`h-full ${t.bar}`} style={{ width: `${fw.score}%` }} />
                    </div>
                    <span className={`text-base font-bold w-14 text-right tabular-nums ${t.text}`}>
                      {fw.score}<span className="text-[10px] font-normal">%</span>
                    </span>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </section>
      </main>


      {/* Drill-down drawers (context only, no actions) */}
      <Sheet open={!!drawer} onOpenChange={(o) => !o && setDrawer(null)}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          {drawer === "compliance" && (
            <>
              <SheetHeader>
                <SheetTitle>Etterlevelse – kontekst</SheetTitle>
                <SheetDescription>Modenhet per regelverk med trend siste kvartal.</SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-3">
                {frameworksWithScore.map((fw) => {
                  const t = maturityTone(fw.score);
                  const dir = fw.trend > 0 ? "up" : fw.trend < 0 ? "down" : "flat";
                  return (
                    <Card key={fw.framework_id} className="border-border/60">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2.5">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm">{fw.framework_name}</p>
                            <FrameworkCountryTag frameworkId={fw.framework_id} />
                          </div>
                          <TrendChip dir={dir as "up" | "down" | "flat"} value={fw.trend > 0 ? `+${fw.trend}` : `${fw.trend}`} />
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                          <div className={`h-full ${t.bar}`} style={{ width: `${fw.score}%` }} />
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          Modenhet: <span className="tabular-nums font-medium text-foreground">{fw.score}%</span>
                        </p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </>
          )}

          {drawer === "risk" && (
            <>
              <SheetHeader>
                <SheetTitle>Risikobilde – kontekst</SheetTitle>
                <SheetDescription>Snapshot av åpne hendelser og beredskap. Operativ oppfølging skjer utenfor styrerommet.</SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-2">
                {incidents.length === 0 && (
                  <div className="text-sm text-muted-foreground text-center py-8">
                    <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-emerald-500" />
                    Ingen åpne hendelser
                  </div>
                )}
                {incidents.slice(0, 10).map((d) => (
                  <Card key={d.id} className="border-border/60">
                    <CardContent className="p-4 flex items-start gap-3">
                      <ActivitySquare className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{d.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs capitalize">{d.criticality ?? "medium"}</Badge>
                          {d.created_at && (
                            <span className="text-xs text-muted-foreground">
                              {new Date(d.created_at).toLocaleDateString("nb-NO")}
                            </span>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}

          {drawer === "costs" && (
            <>
              <SheetHeader>
                <SheetTitle>Kostnadsbase – leverandører</SheetTitle>
                <SheetDescription>Månedlige kostnader for aktive leverandører.</SheetDescription>
              </SheetHeader>
              <div className="mt-4 p-3 rounded-lg bg-cyan-500/5 border border-cyan-500/20 flex gap-2 items-start">
                <Info className="h-4 w-4 text-cyan-500 mt-0.5 shrink-0" />
                <p className="text-xs text-muted-foreground">
                  Demo-tall. Live integrasjon mot regnskap og innkjøpssystemer kommer i neste fase.
                </p>
              </div>
              <div className="mt-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Leverandør</TableHead>
                      <TableHead className="text-right">Pr. mnd</TableHead>
                      <TableHead className="text-right">Trend</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {DEMO_VENDOR_COSTS.map((v) => (
                      <TableRow key={v.name}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                            <div>
                              <p className="font-medium text-sm">{v.name}</p>
                              <p className="text-xs text-muted-foreground">{v.category}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-sm">{fmtNOK(v.monthly)}</TableCell>
                        <TableCell className="text-right text-xs text-muted-foreground tabular-nums">
                          <TrendChip dir={v.dir} value={v.trend} />
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="font-semibold border-t-2">
                      <TableCell>Totalt</TableCell>
                      <TableCell className="text-right tabular-nums">{fmtNOK(totalMonthlyCost)}</TableCell>
                      <TableCell />
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Decision confirmation dialog */}
      <Dialog open={!!activeDecision} onOpenChange={(o) => { if (!o) { setActiveDecision(null); setVerdict(null); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {verdict === "approve" && "Godkjenn sak"}
              {verdict === "postpone" && "Utsett sak"}
              {verdict === "delegate" && "Deleger sak"}
              {verdict === "noted" && "Tatt til orientering"}
            </DialogTitle>
            <DialogDescription>{activeDecision?.title}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Protokollnotat (valgfritt)</label>
            <Textarea
              value={protocolNote}
              onChange={(e) => setProtocolNote(e.target.value)}
              placeholder="Begrunnelse, vilkår eller hvem saken delegeres til…"
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setActiveDecision(null); setVerdict(null); }}>Avbryt</Button>
            <Button onClick={confirmDecision} className="bg-emerald-600 hover:bg-emerald-700 text-white">Bekreft vedtak</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BoardDashboard;
