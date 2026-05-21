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
      <main className="flex-1 pt-16 px-6 pb-16 max-w-6xl mx-auto w-full">
        {/* Header */}
        <header className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative p-2 rounded-xl bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 border border-cyan-500/20">
              <Landmark className="h-5 w-5 text-cyan-500" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Styrerom</h1>
              <p className="text-xs text-muted-foreground">Snapshot for styret · {currentPeriod()}</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="border-cyan-500/30 hover:border-cyan-500/60 hover:bg-cyan-500/5"
            onClick={() => toast.success("Styrerapport generert (demo)")}
          >
            <FileDown className="h-4 w-4 mr-2" /> Styrerapport
          </Button>
        </header>

        {/* Hero – snapshot only */}
        <section className="mb-6">
          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950 text-white shadow-xl">
            <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-emerald-500/20 blur-3xl" />
            <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-cyan-500/20 blur-3xl" />
            <CardContent className="relative p-7">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.2em] text-cyan-300/80 mb-3 font-medium">
                    Aggregert modenhet
                  </p>
                  <div className="flex items-baseline gap-3 mb-3">
                    <span className="text-6xl font-semibold bg-gradient-to-r from-emerald-300 to-cyan-300 bg-clip-text text-transparent tabular-nums">
                      {overallScore}%
                    </span>
                    <TrendChip dir="up" value="+3 siste kvartal" />
                  </div>
                  <p className="text-sm text-slate-300">
                    På tvers av {frameworks.length} aktive regelverk styret hefter for.
                  </p>
                  <div className="mt-5 h-1.5 w-full max-w-md rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-400 to-cyan-400 transition-all duration-700"
                      style={{ width: `${overallScore}%` }}
                    />
                  </div>
                </div>
                <div className="md:border-l md:border-white/10 md:pl-8">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-cyan-300/80 mb-3 font-medium">
                    Risikobilde
                  </p>
                  <div className="flex items-center gap-3 mb-3">
                    <span className={`h-2.5 w-2.5 rounded-full ${exposure.dot}`} />
                    <span className="text-3xl font-semibold">{exposure.label}</span>
                  </div>
                  <p className="text-sm text-slate-300">
                    Basert på åpne hendelser, leverandøreksponering og kontrollmodenhet.
                  </p>
                  <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
                    <Shield className="h-3.5 w-3.5" />
                    Beredskapsplan sist øvet februar 2026
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* KPI snapshot row */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
          <button onClick={() => setDrawer("compliance")} className="text-left group">
            <Card className="h-full border-border/60 hover:border-emerald-500/40 hover:shadow-lg hover:shadow-emerald-500/5 transition-all">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-1.5 rounded-lg bg-emerald-500/10 ring-1 ring-emerald-500/20">
                    <Gavel className="h-3.5 w-3.5 text-emerald-500" />
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-emerald-500 transition-all" />
                </div>
                <p className="text-xs text-muted-foreground mb-1.5 font-medium">Etterlevelse</p>
                <p className="text-2xl font-semibold tabular-nums">
                  {inControl}
                  <span className="text-base text-muted-foreground font-normal"> / {frameworksWithScore.length}</span>
                </p>
                <div className="mt-2"><TrendChip dir="up" value="+1 siste kvartal" /></div>
              </CardContent>
            </Card>
          </button>

          <button onClick={() => setDrawer("risk")} className="text-left group">
            <Card className="h-full border-border/60 hover:border-cyan-500/40 hover:shadow-lg hover:shadow-cyan-500/5 transition-all">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-1.5 rounded-lg bg-cyan-500/10 ring-1 ring-cyan-500/20">
                    <ActivitySquare className="h-3.5 w-3.5 text-cyan-500" />
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-cyan-500 transition-all" />
                </div>
                <p className="text-xs text-muted-foreground mb-1.5 font-medium">Risikobilde</p>
                <p className="text-2xl font-semibold">{exposure.label}</p>
                <div className="mt-2"><TrendChip dir="flat" value="Stabilt" /></div>
              </CardContent>
            </Card>
          </button>

          <button onClick={() => setDrawer("costs")} className="text-left group">
            <Card className="h-full border-border/60 hover:border-cyan-500/40 hover:shadow-lg hover:shadow-cyan-500/5 transition-all">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-1.5 rounded-lg bg-cyan-500/10 ring-1 ring-cyan-500/20">
                    <Wallet className="h-3.5 w-3.5 text-cyan-500" />
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-cyan-500 transition-all" />
                </div>
                <p className="text-xs text-muted-foreground mb-1.5 font-medium">Kostnadsbase / mnd</p>
                <p className="text-2xl font-semibold tabular-nums">{fmtNOK(totalMonthlyCost)}</p>
                <div className="mt-2"><TrendChip dir="up" value="+4% siste kvartal" /></div>
              </CardContent>
            </Card>
          </button>
        </section>

        {/* Beslutningskø */}
        <section className="mb-6">
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <ScrollText className="h-3.5 w-3.5" /> Beslutningskø
            </h2>
            <span className="text-xs text-muted-foreground">Neste styremøte: {NEXT_MEETING}</span>
          </div>
          <Card className="border-border/60">
            <CardContent className="p-0 divide-y divide-border/50">
              {decisions.length === 0 && (
                <div className="p-8 text-center">
                  <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-emerald-500/70" />
                  <p className="text-sm text-muted-foreground">
                    Ingen saker venter på styret. Neste styremøte: {NEXT_MEETING}.
                  </p>
                </div>
              )}
              {decisions.map((d) => (
                <div key={d.id} className="p-5">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <Badge variant="outline" className="text-[10px] uppercase tracking-wider">
                          {d.category}
                        </Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {d.meeting}
                        </span>
                      </div>
                      <p className="font-medium text-sm leading-snug">{d.title}</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-2">{d.context}</p>
                  <div className="rounded-md bg-muted/40 border border-border/40 p-3 text-xs mb-3">
                    <span className="font-medium text-foreground">Innstilling: </span>
                    <span className="text-muted-foreground">{d.recommendation}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => openDecision(d, "approve")}>
                      Godkjenn
                    </Button>
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => openDecision(d, "postpone")}>
                      Utsett
                    </Button>
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => openDecision(d, "delegate")}>
                      Deleger
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => openDecision(d, "noted")}>
                      Til orientering
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {processedToday.length > 0 && (
            <div className="mt-3 text-xs text-muted-foreground">
              <p className="font-medium mb-1">Behandlet i dag</p>
              <ul className="space-y-1">
                {processedToday.map((p) => (
                  <li key={p.id} className="flex items-center gap-2">
                    <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                    <span className="truncate">{p.title}</span>
                    <Badge variant="outline" className="text-[10px]">{p.verdict}</Badge>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        {/* Regelverk snapshot */}
        <section className="mb-6">
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Regelverk – snapshot</h2>
            <span className="text-xs text-muted-foreground">{frameworksWithScore.length} aktive</span>
          </div>
          <Card className="border-border/60">
            <CardContent className="p-0 divide-y divide-border/50">
              {frameworksWithScore.length === 0 && (
                <div className="p-6 text-sm text-muted-foreground text-center">Ingen aktive regelverk</div>
              )}
              {frameworksWithScore.map((fw) => {
                const t = maturityTone(fw.score);
                const trendDir = fw.trend > 0 ? "up" : fw.trend < 0 ? "down" : "flat";
                const trendStr = fw.trend > 0 ? `+${fw.trend}` : `${fw.trend}`;
                return (
                  <div key={fw.framework_id} className="flex items-center gap-4 px-5 py-3.5">
                    <span className={`h-2 w-2 rounded-full ${t.dot}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm truncate">{fw.framework_name}</p>
                        <FrameworkCountryTag frameworkId={fw.framework_id} />
                      </div>
                    </div>
                    <div className="w-32 hidden sm:block h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className={`h-full ${t.bar} transition-all duration-500`} style={{ width: `${fw.score}%` }} />
                    </div>
                    <span className={`text-sm font-semibold w-12 text-right tabular-nums ${t.text}`}>{fw.score}%</span>
                    <span className="hidden md:inline-flex w-20 justify-end">
                      <TrendChip dir={trendDir as "up" | "down" | "flat"} value={trendStr} />
                    </span>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </section>

        {/* Risiko & beredskap snapshot */}
        <section className="mb-6">
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Risiko & beredskap</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-3">
            <Card className="border-border/60">
              <CardContent className="p-5">
                <p className="text-xs text-muted-foreground mb-1.5">Åpne hendelser</p>
                <p className="text-2xl font-semibold tabular-nums">{incidents.length}</p>
                <p className="text-xs text-muted-foreground mt-1">Til orientering – håndteres operativt.</p>
              </CardContent>
            </Card>
            <Card className="border-border/60">
              <CardContent className="p-5">
                <p className="text-xs text-muted-foreground mb-1.5">Siste alvorlige hendelse</p>
                <p className="text-sm font-medium truncate">{lastIncident?.title ?? "Ingen registrert"}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {lastIncident?.created_at ? new Date(lastIncident.created_at).toLocaleDateString("nb-NO") : "—"}
                </p>
              </CardContent>
            </Card>
            <Card className="border-border/60">
              <CardContent className="p-5">
                <p className="text-xs text-muted-foreground mb-1.5">Beredskap</p>
                <p className="text-sm font-medium">Plan testet feb. 2026</p>
                <p className="text-xs text-muted-foreground mt-1">Neste øvelse planlagt Q3.</p>
              </CardContent>
            </Card>
          </div>
        </section>

        <p className="text-[11px] text-muted-foreground/80 text-center max-w-2xl mx-auto">
          <Info className="h-3 w-3 inline mr-1" />
          Snapshot for styret. Tall hentes fra etterlevelsesplattformen og oppdateres løpende.
        </p>
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
