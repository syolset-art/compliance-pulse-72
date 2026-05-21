import { useMemo, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
  AlertTriangle,
  CheckCircle2,
  FileDown,
  Building2,
  Clock,
  ArrowUpRight,
  Wallet,
  Info,
  Gavel,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useComplianceRequirements } from "@/hooks/useComplianceRequirements";
import { FrameworkCountryTag } from "@/components/regulations/FrameworkCountryTag";
import { toast } from "sonner";

const statusFor = (score: number) => {
  if (score >= 75)
    return {
      label: "I kontroll",
      text: "text-emerald-500",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/30",
      dot: "bg-emerald-500",
      ring: "ring-emerald-500/20",
      bar: "bg-gradient-to-r from-emerald-500 to-cyan-500",
    };
  if (score >= 50)
    return {
      label: "Under utvikling",
      text: "text-amber-500",
      bg: "bg-amber-500/10",
      border: "border-amber-500/30",
      dot: "bg-amber-500",
      ring: "ring-amber-500/20",
      bar: "bg-gradient-to-r from-amber-500 to-orange-500",
    };
  return {
    label: "Krever handling",
    text: "text-rose-500",
    bg: "bg-rose-500/10",
    border: "border-rose-500/30",
    dot: "bg-rose-500",
    ring: "ring-rose-500/20",
    bar: "bg-gradient-to-r from-rose-500 to-pink-500",
  };
};

const fmtNOK = (n: number) =>
  new Intl.NumberFormat("nb-NO", { style: "currency", currency: "NOK", maximumFractionDigits: 0 }).format(n);

const DEMO_VENDOR_COSTS = [
  { name: "Microsoft 365", category: "Produktivitet", monthly: 48500, trend: "+3%", dir: "up" as const },
  { name: "AWS", category: "Infrastruktur", monthly: 92300, trend: "+8%", dir: "up" as const },
  { name: "Salesforce", category: "CRM", monthly: 31200, trend: "0%", dir: "flat" as const },
  { name: "Visma", category: "Økonomi", monthly: 14800, trend: "+2%", dir: "up" as const },
  { name: "Slack", category: "Kommunikasjon", monthly: 8900, trend: "-1%", dir: "down" as const },
];

interface FrameworkRow {
  framework_id: string;
  framework_name: string;
  score: number;
}

interface IncidentRow {
  id: string;
  title: string;
  criticality: string | null;
  status: string | null;
  created_at: string | null;
}

const TrendIcon = ({ dir }: { dir: "up" | "down" | "flat" }) => {
  if (dir === "up") return <TrendingUp className="h-3 w-3 text-amber-500" />;
  if (dir === "down") return <TrendingDown className="h-3 w-3 text-emerald-500" />;
  return <Minus className="h-3 w-3 text-muted-foreground" />;
};

const BoardDashboard = () => {
  const { stats } = useComplianceRequirements();
  const [drawer, setDrawer] = useState<null | "compliance" | "deviations" | "costs">(null);

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
    return frameworks.map((f) => ({
      framework_id: f.framework_id,
      framework_name: f.framework_name,
      score: stats.byFramework?.[f.framework_id]?.score ?? 0,
    }));
  }, [frameworks, stats]);

  const overallScore = stats.overallScore?.score ?? 0;
  const overall = statusFor(overallScore);

  const criticalIncidents = incidents.filter(
    (d) => d.criticality === "critical" || d.criticality === "high"
  );
  const totalMonthlyCost = DEMO_VENDOR_COSTS.reduce((s, v) => s + v.monthly, 0);
  const inControl = frameworksWithScore.filter((f) => f.score >= 75).length;

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
              <p className="text-xs text-muted-foreground">Overordnet status for styrets ansvarsområder</p>
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

        {/* Hero */}
        <section className="mb-6">
          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950 dark:from-slate-900 dark:via-slate-900 dark:to-emerald-950 text-white shadow-xl">
            {/* Decorative blobs */}
            <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-emerald-500/20 blur-3xl" />
            <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-cyan-500/20 blur-3xl" />
            <CardContent className="relative p-7">
              <div className="flex items-start justify-between gap-6">
                <div className="flex-1">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-cyan-300/80 mb-3 font-medium">
                    Lovpålagt etterlevelse
                  </p>
                  <div className="flex items-baseline gap-4 mb-3">
                    <span className="text-6xl font-semibold bg-gradient-to-r from-emerald-300 to-cyan-300 bg-clip-text text-transparent tabular-nums">
                      {overallScore}%
                    </span>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-white/10 border border-white/20 backdrop-blur`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${overall.dot}`} />
                      {overall.label}
                    </span>
                  </div>
                  <p className="text-sm text-slate-300 max-w-xl">
                    Aggregert modenhet på tvers av {frameworks.length} aktive regelverk styret hefter for.
                  </p>
                  <div className="mt-5 h-1.5 w-full max-w-md rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-400 to-cyan-400 transition-all duration-700"
                      style={{ width: `${overallScore}%` }}
                    />
                  </div>
                </div>
                <Shield className="h-16 w-16 text-white/10 hidden md:block" />
              </div>
            </CardContent>
          </Card>
        </section>

        {/* KPI cards */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
          <button onClick={() => setDrawer("compliance")} className="text-left group">
            <Card className="h-full border-border/60 hover:border-emerald-500/40 hover:shadow-lg hover:shadow-emerald-500/5 transition-all">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-1.5 rounded-lg bg-emerald-500/10 ring-1 ring-emerald-500/20">
                    <Gavel className="h-3.5 w-3.5 text-emerald-500" />
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-emerald-500 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all" />
                </div>
                <p className="text-xs text-muted-foreground mb-1.5 font-medium">Regelverk i kontroll</p>
                <p className="text-2xl font-semibold tabular-nums">
                  {inControl}
                  <span className="text-base text-muted-foreground font-normal">
                    {" "}/ {frameworksWithScore.length}
                  </span>
                </p>
              </CardContent>
            </Card>
          </button>

          <button onClick={() => setDrawer("deviations")} className="text-left group">
            <Card className="h-full border-border/60 hover:border-rose-500/40 hover:shadow-lg hover:shadow-rose-500/5 transition-all">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-1.5 rounded-lg bg-rose-500/10 ring-1 ring-rose-500/20">
                    <AlertTriangle className="h-3.5 w-3.5 text-rose-500" />
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-rose-500 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all" />
                </div>
                <p className="text-xs text-muted-foreground mb-1.5 font-medium">Åpne avvik</p>
                <p className="text-2xl font-semibold tabular-nums">
                  {incidents.length}
                  {criticalIncidents.length > 0 && (
                    <span className="text-xs text-rose-500 font-medium ml-2">
                      {criticalIncidents.length} kritiske
                    </span>
                  )}
                </p>
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
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-cyan-500 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all" />
                </div>
                <p className="text-xs text-muted-foreground mb-1.5 font-medium">Leverandørkostnader / mnd</p>
                <p className="text-2xl font-semibold tabular-nums">{fmtNOK(totalMonthlyCost)}</p>
              </CardContent>
            </Card>
          </button>
        </section>

        {/* Frameworks list */}
        <section className="mb-6">
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Status per regelverk</h2>
            <span className="text-xs text-muted-foreground">{frameworksWithScore.length} aktive</span>
          </div>
          <Card className="border-border/60">
            <CardContent className="p-0 divide-y divide-border/50">
              {frameworksWithScore.length === 0 && (
                <div className="p-6 text-sm text-muted-foreground text-center">
                  Ingen aktive regelverk
                </div>
              )}
              {frameworksWithScore.map((fw) => {
                const s = statusFor(fw.score);
                return (
                  <div key={fw.framework_id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/30 transition-colors">
                    <span className={`h-2 w-2 rounded-full ${s.dot} ring-4 ${s.ring}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm truncate">{fw.framework_name}</p>
                        <FrameworkCountryTag frameworkId={fw.framework_id} />
                      </div>
                    </div>
                    <div className="w-32 hidden sm:block h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full ${s.bar} transition-all duration-500`}
                        style={{ width: `${fw.score}%` }}
                      />
                    </div>
                    <span className={`text-sm font-semibold w-12 text-right tabular-nums ${s.text}`}>{fw.score}%</span>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </section>

        <p className="text-[11px] text-muted-foreground/80 text-center max-w-2xl mx-auto">
          <Info className="h-3 w-3 inline mr-1" />
          Styrerommet viser kun det styret er rettslig ansvarlig for. Operativ oppfølging håndteres av compliance-ansvarlig.
        </p>
      </main>

      <Sheet open={!!drawer} onOpenChange={(o) => !o && setDrawer(null)}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          {drawer === "compliance" && (
            <>
              <SheetHeader>
                <SheetTitle>Lovpålagt etterlevelse</SheetTitle>
                <SheetDescription>
                  Aggregert status på regelverk styret hefter for.
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-3">
                {frameworksWithScore.map((fw) => {
                  const s = statusFor(fw.score);
                  return (
                    <Card key={fw.framework_id} className="border-border/60">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2.5">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm">{fw.framework_name}</p>
                            <FrameworkCountryTag frameworkId={fw.framework_id} />
                          </div>
                          <span className={`text-xs font-semibold ${s.text}`}>{s.label}</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                          <div className={`h-full ${s.bar}`} style={{ width: `${fw.score}%` }} />
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          Modenhet: <span className="tabular-nums font-medium text-foreground">{fw.score}%</span> — detaljert oppfølging hos compliance-ansvarlig.
                        </p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </>
          )}

          {drawer === "deviations" && (
            <>
              <SheetHeader>
                <SheetTitle>Åpne avvik</SheetTitle>
                <SheetDescription>
                  Styret informeres om kritiske og høye avvik som påvirker etterlevelse.
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-2">
                {incidents.length === 0 && (
                  <div className="text-sm text-muted-foreground text-center py-8">
                    <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-emerald-500" />
                    Ingen åpne avvik
                  </div>
                )}
                {incidents.map((d) => {
                  const isCritical = d.criticality === "critical" || d.criticality === "high";
                  return (
                    <Card key={d.id} className="border-border/60">
                      <CardContent className="p-4 flex items-start gap-3">
                        <AlertTriangle className={`h-4 w-4 mt-0.5 ${isCritical ? "text-rose-500" : "text-amber-500"}`} />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{d.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs capitalize">
                              {d.criticality ?? "medium"}
                            </Badge>
                            {d.created_at && (
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {new Date(d.created_at).toLocaleDateString("nb-NO")}
                              </span>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </>
          )}

          {drawer === "costs" && (
            <>
              <SheetHeader>
                <SheetTitle>Leverandørkostnader</SheetTitle>
                <SheetDescription>
                  Månedlige kostnader for aktive leverandører.
                </SheetDescription>
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
                          <span className="inline-flex items-center gap-1 justify-end">
                            <TrendIcon dir={v.dir} />
                            {v.trend}
                          </span>
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
    </div>
  );
};

export default BoardDashboard;
