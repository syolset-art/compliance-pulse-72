import { useMemo } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
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
  Gavel,
  TrendingUp,
  TrendingDown,
  Activity,
  Building2,
  Users,
  Clock,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useComplianceRequirements } from "@/hooks/useComplianceRequirements";
import { FrameworkCountryTag } from "@/components/regulations/FrameworkCountryTag";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import { toast } from "sonner";

// ---------- Helpers ----------
const statusFor = (score: number) => {
  if (score >= 75) return { tone: "success", label: "I kontroll", className: "bg-success/15 text-success border-success/30" };
  if (score >= 50) return { tone: "warning", label: "Under utvikling", className: "bg-warning/15 text-warning border-warning/30" };
  return { tone: "destructive", label: "Krever handling", className: "bg-destructive/15 text-destructive border-destructive/30" };
};

const fmtDate = (d?: string | null) => {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("nb-NO", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return "—";
  }
};

// ---------- Hero: Compliance status per active framework ----------
function LegalComplianceHero() {
  const { stats } = useComplianceRequirements();
  const byFramework = stats.byFramework || {};

  const entries = Object.entries(byFramework).map(([id, v]: [string, any]) => ({
    id,
    score: Math.round(v?.score || 0),
    assessed: v?.assessed || 0,
    total: v?.total || 0,
  }));

  // Sort by lowest score first (most pressing)
  entries.sort((a, b) => a.score - b.score);

  const overall = Math.round(stats.overallScore?.score || 0);
  const overallStatus = statusFor(overall);

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-card to-card overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground mb-1">
              <Gavel className="h-3.5 w-3.5" />
              Lovpålagt etterlevelse
            </div>
            <CardTitle className="text-3xl font-semibold tracking-tight">
              Styret leverer på {overall}% av lovpålagte krav
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
              Aggregert modenhet på tvers av aktive regelverk. Styret hefter for at virksomheten har dokumenterbar kontroll på disse områdene (aksjeloven §6-12, NIS2 art. 20, GDPR art. 24).
            </p>
          </div>
          <Badge className={`${overallStatus.className} border text-sm px-3 py-1`}>
            {overallStatus.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">Ingen aktive regelverk registrert.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {entries.map((e) => {
              const s = statusFor(e.score);
              return (
                <div
                  key={e.id}
                  className="bg-card border rounded-lg p-4 hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <FrameworkCountryTag frameworkId={e.id} />
                      <span className="font-medium truncate uppercase text-sm">{e.id}</span>
                    </div>
                    <span className={`text-2xl font-bold ${s.tone === "success" ? "text-success" : s.tone === "warning" ? "text-warning" : "text-destructive"}`}>
                      {e.score}%
                    </span>
                  </div>
                  <Progress value={e.score} className="h-1.5 mb-2" />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{e.assessed} av {e.total} krav vurdert</span>
                    <span>{s.label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ---------- Board decisions ----------
function BoardDecisionsWidget() {
  const { data: decisions = [] } = useQuery({
    queryKey: ["board-decisions"],
    queryFn: async () => {
      const aiRes = await supabase
        .from("ai_system_registry")
        .select("id, name, risk_category, status")
        .in("risk_category", ["high", "unacceptable"]);

      const items: Array<{ id: string; type: string; title: string; meta: string; tone: "warning" | "destructive" }> = [];

      (aiRes.data || []).forEach((s: any) => {
        items.push({
          id: `ai-${s.id}`,
          type: "AI-system",
          title: s.name,
          meta: `Risikokategori: ${s.risk_category} — krever styregodkjenning under AI Act art. 26`,
          tone: s.risk_category === "unacceptable" ? "destructive" : "warning",
        });
      });

      // Demo-supplement: kritiske avvik og leverandører (kommer fra rapporteringsmoduler)
      items.push({
        id: "demo-dev-1",
        type: "Kritisk avvik",
        title: "Dataeksponering hos databehandler — uavklart varslingsplikt",
        meta: "Åpent i 42 dager",
        tone: "destructive",
      });
      items.push({
        id: "demo-vendor-1",
        type: "Kritisk leverandør",
        title: "Microsoft Azure — fornyelse uten oppdatert DPIA",
        meta: "Forretningskritisk — krever styrets risikoaksept",
        tone: "warning",
      });

      return items;
    },
  });


  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Gavel className="h-5 w-5 text-primary" />
              Styrets beslutningspunkter
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Saker som eksplisitt krever styrets behandling
            </p>
          </div>
          <Badge variant="outline" className="text-base px-3 py-1">
            {decisions.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {decisions.length === 0 ? (
          <div className="flex items-center gap-3 p-4 rounded-lg bg-success/10 border border-success/20">
            <CheckCircle2 className="h-5 w-5 text-success" />
            <div>
              <p className="font-medium text-sm">Ingen åpne saker for styret</p>
              <p className="text-xs text-muted-foreground">Administrasjonen håndterer alle pågående saker innenfor mandat.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {decisions.slice(0, 8).map((d) => (
              <div
                key={d.id}
                className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/30 transition-colors"
              >
                <div className={`mt-0.5 h-2 w-2 rounded-full ${d.tone === "destructive" ? "bg-destructive" : "bg-warning"}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                      {d.type}
                    </Badge>
                  </div>
                  <p className="font-medium text-sm truncate">{d.title}</p>
                  <p className="text-xs text-muted-foreground">{d.meta}</p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-xs"
                  onClick={() => toast.success("Markert som behandlet i styremøte")}
                >
                  Marker behandlet
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ---------- Risk triad ----------
function RiskExposureTriad() {
  const { data } = useQuery({
    queryKey: ["board-risk-triad"],
    queryFn: async () => {
      const [systemsRes, incidentsRes, vendorsRes] = await Promise.all([
        supabase.from("assets").select("id, risk_level, criticality"),
        supabase.from("system_incidents").select("id, status, risk_level, created_at").eq("status", "open"),
        supabase.from("vendors").select("id, criticality"),
      ]);

      const criticalSystems = systemsRes.data?.filter((s: any) => s.criticality === "critical").length || 0;
      const openIncidents = incidentsRes.data?.length || 0;
      const criticalVendors = vendorsRes.data?.filter((v: any) => v.criticality === "critical").length || 0;

      return { criticalSystems, openIncidents, criticalVendors };
    },
  });

  const cards = [
    {
      title: "Operasjonell risiko",
      icon: Activity,
      value: data?.criticalSystems ?? 0,
      label: "kritiske systemer",
      sub: "Krever dokumentert beredskapsplan",
      tone: (data?.criticalSystems ?? 0) > 0 ? "warning" : "success",
    },
    {
      title: "Cyberrisiko",
      icon: Shield,
      value: data?.openIncidents ?? 0,
      label: "åpne hendelser",
      sub: "NIS2 rapporteringsplikt 24t/72t/30d",
      tone: (data?.openIncidents ?? 0) > 2 ? "destructive" : (data?.openIncidents ?? 0) > 0 ? "warning" : "success",
    },
    {
      title: "Tredjepartsrisiko",
      icon: Building2,
      value: data?.criticalVendors ?? 0,
      label: "kritiske leverandører",
      sub: "Krever DPA + sikkerhetsvurdering",
      tone: (data?.criticalVendors ?? 0) > 5 ? "warning" : "success",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {cards.map((c) => {
        const Icon = c.icon;
        const toneClass =
          c.tone === "destructive" ? "text-destructive" :
          c.tone === "warning" ? "text-warning" : "text-success";
        return (
          <Card key={c.title}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs uppercase tracking-wider text-muted-foreground">{c.title}</div>
                <Icon className={`h-5 w-5 ${toneClass}`} />
              </div>
              <div className="flex items-baseline gap-2">
                <span className={`text-4xl font-bold ${toneClass}`}>{c.value}</span>
                <span className="text-sm text-muted-foreground">{c.label}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">{c.sub}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// ---------- Preparedness ----------
function PreparednessWidget() {
  // Use simple derived/mocked values for v1
  const items = [
    { label: "Beredskapsplan sist oppdatert", value: "12. mars 2026", status: "success" as const },
    { label: "Beredskapsøvelse sist gjennomført", value: "8. februar 2026", status: "success" as const },
    { label: "Antall øvelser siste 12 mnd", value: "3 av 4 planlagt", status: "warning" as const },
    { label: "NIS2 rapporteringsfrister overholdt", value: "100% (12 av 12)", status: "success" as const },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Shield className="h-5 w-5 text-primary" />
          Beredskap og kontinuitet
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {items.map((i) => {
            const tone = i.status === "success" ? "text-success" : i.status === "warning" ? "text-warning" : "text-destructive";
            return (
              <div key={i.label} className="border rounded-lg p-3">
                <div className="text-xs text-muted-foreground mb-1">{i.label}</div>
                <div className={`text-base font-semibold ${tone}`}>{i.value}</div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// ---------- Maturity trend ----------
function MaturityTrendChart({ currentScore }: { currentScore: number }) {
  // Quarterly baseline + interpolation to current
  const data = useMemo(() => {
    const quarters = ["Q2-25", "Q3-25", "Q4-25", "Q1-26", "Q2-26"];
    const start = Math.max(15, currentScore - 28);
    return quarters.map((q, idx) => {
      const t = idx / (quarters.length - 1);
      const total = Math.round(start + (currentScore - start) * t);
      return {
        quarter: q,
        Total: total,
        Styring: Math.min(100, Math.round(total * 1.05)),
        Drift: Math.round(total * 0.95),
        Personvern: Math.round(total * 0.92),
        Tredjepart: Math.round(total * 0.88),
      };
    });
  }, [currentScore]);

  const delta = data[data.length - 1].Total - data[0].Total;
  const TrendIcon = delta >= 0 ? TrendingUp : TrendingDown;
  const trendTone = delta >= 0 ? "text-success" : "text-destructive";

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Activity className="h-5 w-5 text-primary" />
              Modenhets-trend siste 12 måneder
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">Aggregert score per domene</p>
          </div>
          <div className={`flex items-center gap-1 text-sm font-medium ${trendTone}`}>
            <TrendIcon className="h-4 w-4" />
            {delta >= 0 ? "+" : ""}{delta} poeng
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="quarter" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} domain={[0, 100]} />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "12px" }} />
              <Line type="monotone" dataKey="Total" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="Styring" stroke="hsl(var(--success))" strokeWidth={1.5} dot={false} />
              <Line type="monotone" dataKey="Drift" stroke="hsl(var(--warning))" strokeWidth={1.5} dot={false} />
              <Line type="monotone" dataKey="Personvern" stroke="hsl(var(--destructive))" strokeWidth={1.5} dot={false} />
              <Line type="monotone" dataKey="Tredjepart" stroke="hsl(var(--muted-foreground))" strokeWidth={1.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------- Role coverage ----------
function RoleCoverageTable() {
  const { data: roles = [] } = useQuery({
    queryKey: ["board-key-personnel"],
    queryFn: async () => {
      const { data } = await supabase
        .from("key_personnel")
        .select("id, role, name, email, updated_at")
        .limit(20);
      return data || [];
    },
  });

  const requiredRoles = [
    { key: "ceo", label: "Daglig leder" },
    { key: "chair", label: "Styreleder" },
    { key: "dpo", label: "Personvernombud (DPO)" },
    { key: "ciso", label: "Sikkerhetsansvarlig (CISO)" },
    { key: "compliance_lead", label: "Compliance Lead" },
    { key: "bcp_coordinator", label: "Beredskapskoordinator" },
  ];

  const rows = requiredRoles.map((r) => {
    const match = (roles as any[]).find((p) =>
      (p.role || "").toLowerCase().includes(r.key) ||
      (p.role || "").toLowerCase().includes(r.label.toLowerCase().split(" ")[0])
    );
    return {
      ...r,
      name: match?.name || null,
      confirmed: match?.updated_at || null,
      deputy: null,
    };
  });

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Users className="h-5 w-5 text-primary" />
          Ansvar og rolledekning
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          Nøkkelroller styret må sikre er bekreftet
        </p>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Rolle</TableHead>
              <TableHead>Navn</TableHead>
              <TableHead>Sist bekreftet</TableHead>
              <TableHead>Stedfortreder</TableHead>
              <TableHead className="text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => {
              const missing = !r.name;
              const noDeputy = !r.deputy;
              const tone = missing ? "destructive" : noDeputy ? "warning" : "success";
              return (
                <TableRow key={r.key}>
                  <TableCell className="font-medium">{r.label}</TableCell>
                  <TableCell>{r.name || <span className="text-muted-foreground italic">Ikke registrert</span>}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{fmtDate(r.confirmed)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {r.deputy || <span className="italic">Mangler</span>}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge
                      variant="outline"
                      className={
                        tone === "destructive" ? "border-destructive/40 text-destructive" :
                        tone === "warning" ? "border-warning/40 text-warning" :
                        "border-success/40 text-success"
                      }
                    >
                      {tone === "destructive" ? "Mangler" : tone === "warning" ? "Delvis" : "OK"}
                    </Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// ---------- Next board meeting ----------
function NextBoardMeetingCard({ decisionCount }: { decisionCount: number }) {
  return (
    <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="h-5 w-5 text-primary" />
          Forberedelse til neste styremøte
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="text-sm">
            <p className="font-medium mb-2">Lara foreslår følgende saker på agenda:</p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <ArrowRight className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                Godkjenning av {decisionCount} åpne beslutningspunkter (se sone over)
              </li>
              <li className="flex items-start gap-2">
                <ArrowRight className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                Gjennomgang av modenhetstrend og prioriteringer neste kvartal
              </li>
              <li className="flex items-start gap-2">
                <ArrowRight className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                Bekreftelse av nøkkelroller og stedfortredere
              </li>
              <li className="flex items-start gap-2">
                <ArrowRight className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                Status på NIS2-beredskap og neste beredskapsøvelse
              </li>
            </ul>
          </div>
          <Separator />
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => toast.success("Styrerapport genereres som PDF…")}>
              <FileDown className="h-4 w-4 mr-2" />
              Generer styrerapport (PDF)
            </Button>
            <Button variant="outline" onClick={() => toast.success("Agenda lagt til kalenderen")}>
              <Clock className="h-4 w-4 mr-2" />
              Legg agenda i kalenderen
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------- Page ----------
export default function BoardDashboard() {
  const { stats } = useComplianceRequirements();
  const overall = Math.round(stats.overallScore?.score || 0);

  const { data: decisionCount = 0 } = useQuery({
    queryKey: ["board-decisions-count"],
    queryFn: async () => {
      const [ai, dev, vendors] = await Promise.all([
        supabase.from("ai_system_registry").select("id", { count: "exact", head: true }).in("risk_category", ["high", "unacceptable"]),
        supabase.from("deviations").select("id", { count: "exact", head: true }).eq("severity", "critical").neq("status", "closed"),
        supabase.from("vendors").select("id", { count: "exact", head: true }).eq("criticality", "critical"),
      ]);
      return (ai.count || 0) + (dev.count || 0) + (vendors.count || 0);
    },
  });

  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-10">
        <div className="container max-w-6xl mx-auto space-y-8">
          {/* Page header */}
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground mb-1">
                <Landmark className="h-3.5 w-3.5" />
                Styrerom
              </div>
              <h1 className="text-3xl font-bold tracking-tight">Styre-dashbord</h1>
              <p className="text-muted-foreground mt-1">
                Strategisk overblikk for styre og styreleder — beslutninger, lovpålagt etterlevelse og beredskap.
              </p>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Sist oppdatert</div>
              <div className="text-sm font-medium">{new Date().toLocaleDateString("nb-NO", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</div>
            </div>
          </div>

          {/* Sone 1 */}
          <LegalComplianceHero />

          {/* Sone 2 */}
          <BoardDecisionsWidget />

          {/* Sone 3 */}
          <div>
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              Risikoeksponering
            </h2>
            <RiskExposureTriad />
          </div>

          {/* Sone 4 */}
          <PreparednessWidget />

          {/* Sone 5 */}
          <MaturityTrendChart currentScore={overall} />

          {/* Sone 6 */}
          <RoleCoverageTable />

          {/* Sone 7 */}
          <NextBoardMeetingCard decisionCount={decisionCount} />
        </div>
      </main>
    </div>
  );
}
