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
  ChevronRight,
  Wallet,
  Info,
  Gavel,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useComplianceRequirements } from "@/hooks/useComplianceRequirements";
import { FrameworkCountryTag } from "@/components/regulations/FrameworkCountryTag";
import { toast } from "sonner";

const statusFor = (score: number) => {
  if (score >= 75) return { label: "I kontroll", className: "bg-success/15 text-success border-success/30", dot: "bg-success" };
  if (score >= 50) return { label: "Under utvikling", className: "bg-warning/15 text-warning border-warning/30", dot: "bg-warning" };
  return { label: "Krever handling", className: "bg-destructive/15 text-destructive border-destructive/30", dot: "bg-destructive" };
};

const fmtNOK = (n: number) =>
  new Intl.NumberFormat("nb-NO", { style: "currency", currency: "NOK", maximumFractionDigits: 0 }).format(n);

const DEMO_VENDOR_COSTS = [
  { name: "Microsoft 365", category: "Produktivitet", monthly: 48500, trend: "+3%" },
  { name: "AWS", category: "Infrastruktur", monthly: 92300, trend: "+8%" },
  { name: "Salesforce", category: "CRM", monthly: 31200, trend: "0%" },
  { name: "Visma", category: "Økonomi", monthly: 14800, trend: "+2%" },
  { name: "Slack", category: "Kommunikasjon", monthly: 8900, trend: "-1%" },
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

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 pt-16 px-8 pb-16 max-w-6xl mx-auto w-full">
        <header className="mb-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20">
                <Landmark className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-semibold tracking-tight">Styrerom</h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Overordnet status for styrets ansvarsområder
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => toast.success("Styrerapport generert (demo)")}>
              <FileDown className="h-4 w-4 mr-2" /> Styrerapport
            </Button>
          </div>
        </header>

        <section className="mb-10">
          <Card className="border-primary/20">
            <CardContent className="p-8">
              <div className="flex items-start justify-between gap-8">
                <div className="flex-1">
                  <p className="text-sm uppercase tracking-wider text-muted-foreground mb-2">
                    Lovpålagt etterlevelse
                  </p>
                  <div className="flex items-baseline gap-3 mb-3">
                    <span className="text-5xl font-semibold">{overallScore}%</span>
                    <Badge variant="outline" className={overall.className}>
                      <span className={`h-1.5 w-1.5 rounded-full mr-1.5 ${overall.dot}`} />
                      {overall.label}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground max-w-xl">
                    Aggregert modenhet på tvers av {frameworks.length} aktive regelverk styret hefter for.
                  </p>
                </div>
                <Shield className="h-12 w-12 text-primary/30 hidden md:block" />
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          <button onClick={() => setDrawer("compliance")} className="text-left">
            <Card className="hover:border-primary/40 transition-colors h-full">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Gavel className="h-4 w-4 text-primary" />
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground mb-1">Regelverk i kontroll</p>
                <p className="text-3xl font-semibold">
                  {frameworksWithScore.filter((f) => f.score >= 75).length}
                  <span className="text-lg text-muted-foreground font-normal">
                    {" "}/ {frameworksWithScore.length}
                  </span>
                </p>
              </CardContent>
            </Card>
          </button>

          <button onClick={() => setDrawer("deviations")} className="text-left">
            <Card className="hover:border-primary/40 transition-colors h-full">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 rounded-lg bg-destructive/10">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground mb-1">Åpne avvik</p>
                <p className="text-3xl font-semibold">
                  {incidents.length}
                  {criticalIncidents.length > 0 && (
                    <span className="text-base text-destructive font-normal ml-2">
                      ({criticalIncidents.length} kritiske)
                    </span>
                  )}
                </p>
              </CardContent>
            </Card>
          </button>

          <button onClick={() => setDrawer("costs")} className="text-left">
            <Card className="hover:border-primary/40 transition-colors h-full">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Wallet className="h-4 w-4 text-primary" />
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground mb-1">Leverandørkostnader / mnd</p>
                <p className="text-3xl font-semibold">{fmtNOK(totalMonthlyCost)}</p>
              </CardContent>
            </Card>
          </button>
        </section>

        <section className="mb-10">
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="text-lg font-semibold">Lovpålagt etterlevelse</h2>
            <span className="text-xs text-muted-foreground">Status per regelverk</span>
          </div>
          <Card>
            <CardContent className="p-0 divide-y">
              {frameworksWithScore.length === 0 && (
                <div className="p-6 text-sm text-muted-foreground text-center">
                  Ingen aktive regelverk
                </div>
              )}
              {frameworksWithScore.map((fw) => {
                const s = statusFor(fw.score);
                return (
                  <div key={fw.framework_id} className="flex items-center gap-4 p-4">
                    <span className={`h-2 w-2 rounded-full ${s.dot}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">{fw.framework_name}</p>
                        <FrameworkCountryTag frameworkId={fw.framework_id} />
                      </div>
                    </div>
                    <div className="w-40 hidden sm:block">
                      <Progress value={fw.score} className="h-1.5" />
                    </div>
                    <span className="text-sm font-medium w-12 text-right tabular-nums">{fw.score}%</span>
                    <Badge variant="outline" className={`${s.className} hidden md:inline-flex`}>
                      {s.label}
                    </Badge>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </section>

        <p className="text-xs text-muted-foreground text-center max-w-2xl mx-auto">
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
                    <Card key={fw.framework_id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{fw.framework_name}</p>
                            <FrameworkCountryTag frameworkId={fw.framework_id} />
                          </div>
                          <Badge variant="outline" className={s.className}>{s.label}</Badge>
                        </div>
                        <Progress value={fw.score} className="h-1.5" />
                        <p className="text-xs text-muted-foreground mt-2">
                          Modenhet: {fw.score}% — detaljert oppfølging hos compliance-ansvarlig.
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
                    <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-success" />
                    Ingen åpne avvik
                  </div>
                )}
                {incidents.map((d) => (
                  <Card key={d.id}>
                    <CardContent className="p-4 flex items-start gap-3">
                      <AlertTriangle
                        className={`h-4 w-4 mt-0.5 ${
                          d.criticality === "critical" || d.criticality === "high"
                            ? "text-destructive"
                            : "text-warning"
                        }`}
                      />
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
                ))}
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
              <div className="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/20 flex gap-2 items-start">
                <Info className="h-4 w-4 text-primary mt-0.5 shrink-0" />
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
                        <TableCell className="text-right tabular-nums text-sm">
                          {fmtNOK(v.monthly)}
                        </TableCell>
                        <TableCell className="text-right text-xs text-muted-foreground tabular-nums">
                          {v.trend}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="font-semibold">
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
