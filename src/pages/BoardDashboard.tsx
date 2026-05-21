import { useMemo, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
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
  Gavel,
  TrendingUp,
  TrendingDown,
  Activity,
  Building2,
  Users,
  Clock,
  Sparkles,
  ArrowRight,
  DollarSign,
  GraduationCap,
  FileText,
  Calendar,
  AlertCircle,
  ChevronRight,
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
  BarChart,
  Bar,
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

// ---------- Shared detail drawer ----------
type DetailPayload = {
  title: string;
  subtitle?: string;
  tone?: "success" | "warning" | "destructive" | "primary";
  body: React.ReactNode;
  actions?: React.ReactNode;
};

function DetailDrawer({
  payload,
  onClose,
}: {
  payload: DetailPayload | null;
  onClose: () => void;
}) {
  return (
    <Sheet open={!!payload} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        {payload && (
          <>
            <SheetHeader>
              <SheetTitle className="text-xl">{payload.title}</SheetTitle>
              {payload.subtitle && (
                <SheetDescription>{payload.subtitle}</SheetDescription>
              )}
            </SheetHeader>
            <div className="py-5 space-y-4">{payload.body}</div>
            {payload.actions && (
              <SheetFooter className="flex-col sm:flex-row gap-2">
                {payload.actions}
              </SheetFooter>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

// Convenience for action rows
function MetaRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 py-2 border-b last:border-0 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}

function DecisionBox({ onDecide }: { onDecide: (note: string) => void }) {
  const [note, setNote] = useState("");
  return (
    <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
      <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Styrets beslutning / protokollnotat
      </label>
      <Textarea
        placeholder="F.eks. 'Styret tar saken til etterretning og ber administrasjonen følge opp innen Q3-26.'"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={3}
      />
      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={() => onDecide(note || "Godkjent")}>
          <CheckCircle2 className="h-4 w-4 mr-1.5" />
          Godkjenn
        </Button>
        <Button size="sm" variant="outline" onClick={() => onDecide(note || "Utsatt")}>
          Utsett til neste møte
        </Button>
        <Button size="sm" variant="ghost" onClick={() => onDecide(note || "Delegert")}>
          Deleger til administrasjonen
        </Button>
      </div>
    </div>
  );
}

// ---------- Hero: Compliance status per active framework ----------
function LegalComplianceHero({ openDetail }: { openDetail: (p: DetailPayload) => void }) {
  const { stats } = useComplianceRequirements();
  const byFramework = stats.byFramework || {};

  const entries = Object.entries(byFramework).map(([id, v]: [string, any]) => ({
    id,
    score: Math.round(v?.score || 0),
    assessed: v?.assessed || 0,
    total: v?.total || 0,
  }));
  entries.sort((a, b) => a.score - b.score);

  const overall = Math.round(stats.overallScore?.score || 0);
  const overallStatus = statusFor(overall);

  const openFrameworkDetail = (e: typeof entries[0]) => {
    const s = statusFor(e.score);
    openDetail({
      title: `${e.id.toUpperCase()} — etterlevelse`,
      subtitle: `${e.assessed} av ${e.total} krav vurdert · ${s.label}`,
      tone: s.tone as any,
      body: (
        <>
          <div className="text-center py-4">
            <div className={`text-6xl font-bold ${s.tone === "success" ? "text-success" : s.tone === "warning" ? "text-warning" : "text-destructive"}`}>
              {e.score}%
            </div>
            <Progress value={e.score} className="h-2 mt-3" />
          </div>
          <div className="space-y-1">
            <MetaRow label="Ansvarlig" value="Lise Holm (DPO)" />
            <MetaRow label="Sist revidert" value="14. mars 2026" />
            <MetaRow label="Neste frist" value="Q3 2026 — selvdeklarasjon" />
            <MetaRow label="Antall åpne avvik" value={Math.max(0, e.total - e.assessed)} />
            <MetaRow label="Risikoeier" value="Styret v/ styreleder" />
          </div>
          <div className="rounded-lg bg-muted/40 p-3 text-sm">
            <p className="font-medium mb-1 flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-primary" />
              Lara sin vurdering
            </p>
            <p className="text-muted-foreground">
              {e.score >= 75
                ? `Virksomheten har dokumenterbar kontroll på ${e.id.toUpperCase()}. Styret kan trygt bekrefte etterlevelse i årsberetningen.`
                : e.score >= 50
                ? `${e.id.toUpperCase()} har akseptabelt nivå, men 2-3 nøkkelkontroller bør prioriteres før Q3 2026. Risikoen er håndterbar.`
                : `Kritisk gap på ${e.id.toUpperCase()}. Styret bør be administrasjonen levere handlingsplan med konkrete milepæler innen 30 dager.`}
            </p>
          </div>
          <DecisionBox onDecide={(n) => { toast.success(`Protokollført: ${n.slice(0, 60)}…`); }} />
        </>
      ),
      actions: (
        <>
          <Button variant="outline" onClick={() => toast.success("Åpner detaljert kravoversikt…")}>
            <FileText className="h-4 w-4 mr-1.5" />
            Se alle krav
          </Button>
          <Button variant="outline" onClick={() => toast.success("Eksporterer revisjonsrapport…")}>
            <FileDown className="h-4 w-4 mr-1.5" />
            Last ned dokumentasjon
          </Button>
        </>
      ),
    });
  };

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
                <button
                  key={e.id}
                  onClick={() => openFrameworkDetail(e)}
                  className="text-left bg-card border rounded-lg p-4 hover:shadow-md hover:border-primary/40 transition-all group"
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
                    <span>{e.assessed} av {e.total} krav</span>
                    <span className="flex items-center gap-0.5 group-hover:text-primary transition-colors">
                      Detaljer <ChevronRight className="h-3 w-3" />
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ---------- Board decisions ----------
type Decision = {
  id: string;
  type: string;
  title: string;
  meta: string;
  tone: "warning" | "destructive";
  owner: string;
  ageDays: number;
  financialExposure: string;
  recommendation: string;
  legalBasis: string;
};

function BoardDecisionsWidget({ openDetail }: { openDetail: (p: DetailPayload) => void }) {
  const { data: decisions = [] } = useQuery<Decision[]>({
    queryKey: ["board-decisions-rich"],
    queryFn: async () => {
      const aiRes = await supabase
        .from("ai_system_registry")
        .select("id, name, risk_category, status")
        .in("risk_category", ["high", "unacceptable"]);

      const items: Decision[] = [];

      (aiRes.data || []).forEach((s: any) => {
        items.push({
          id: `ai-${s.id}`,
          type: "AI-system",
          title: s.name,
          meta: `Risikokategori: ${s.risk_category} — krever styregodkjenning under AI Act art. 26`,
          tone: s.risk_category === "unacceptable" ? "destructive" : "warning",
          owner: "Kjetil Aas (CISO)",
          ageDays: 18,
          financialExposure: "Inntil 7% av global omsetning (AI Act art. 99)",
          recommendation: "Krev DPIA + algoritmisk impact-assessment før produksjonssetting.",
          legalBasis: "AI Act art. 26 (deployer obligations) + GDPR art. 35",
        });
      });

      items.push({
        id: "demo-dev-1",
        type: "Kritisk avvik",
        title: "Dataeksponering hos databehandler — uavklart varslingsplikt",
        meta: "Åpent i 42 dager",
        tone: "destructive",
        owner: "Lise Holm (DPO)",
        ageDays: 42,
        financialExposure: "Inntil 20 MNOK (GDPR art. 83) + omdømmerisiko",
        recommendation: "Styret må ta stilling til varsling av Datatilsynet innen 72t fra ny vurdering. Anbefaler ekstern juridisk gjennomgang.",
        legalBasis: "GDPR art. 33 + personopplysningsloven §26",
      });
      items.push({
        id: "demo-vendor-1",
        type: "Kritisk leverandør",
        title: "Microsoft Azure — fornyelse uten oppdatert DPIA",
        meta: "Forretningskritisk — krever styrets risikoaksept",
        tone: "warning",
        owner: "Per Strand (IT-direktør)",
        ageDays: 11,
        financialExposure: "Kontraktsverdi 4,2 MNOK/år · driftsstans-risiko 12 MNOK/dag",
        recommendation: "Godkjenn fornyelse med vilkår om at DPIA leveres innen 30 dager etter signering.",
        legalBasis: "GDPR art. 28 + DORA art. 28-30 (tredjepartsrisiko)",
      });
      items.push({
        id: "demo-bcp-1",
        type: "Beredskap",
        title: "Beredskapsplan for ransomware — ikke testet siste 12 mnd",
        meta: "Krever styrets aksept av restrisiko",
        tone: "warning",
        owner: "Kjetil Aas (CISO)",
        ageDays: 65,
        financialExposure: "Estimert tap ved hendelse: 8-25 MNOK",
        recommendation: "Bestill table-top øvelse innen Q3-26. Risikoen er midlertidig akseptabel.",
        legalBasis: "NIS2 art. 21(2)(c) + sikkerhetsloven §4-3",
      });

      return items;
    },
  });

  const openDecisionDetail = (d: Decision) => {
    openDetail({
      title: d.title,
      subtitle: `${d.type} · åpen i ${d.ageDays} dager`,
      tone: d.tone as any,
      body: (
        <>
          <div className={`rounded-lg p-3 border ${d.tone === "destructive" ? "bg-destructive/10 border-destructive/30" : "bg-warning/10 border-warning/30"}`}>
            <p className="text-sm font-medium flex items-center gap-1.5">
              <AlertCircle className={`h-4 w-4 ${d.tone === "destructive" ? "text-destructive" : "text-warning"}`} />
              {d.tone === "destructive" ? "Haster — krever styrebehandling" : "Krever styrets oppmerksomhet"}
            </p>
          </div>
          <div className="space-y-1">
            <MetaRow label="Saksansvarlig" value={d.owner} />
            <MetaRow label="Type sak" value={d.type} />
            <MetaRow label="Åpen i" value={`${d.ageDays} dager`} />
            <MetaRow label="Rettsgrunnlag" value={<span className="text-xs">{d.legalBasis}</span>} />
            <MetaRow label="Finansiell eksponering" value={<span className="text-xs">{d.financialExposure}</span>} />
          </div>
          <div className="rounded-lg bg-muted/40 p-3 text-sm">
            <p className="font-medium mb-1 flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-primary" />
              Lara sin anbefaling
            </p>
            <p className="text-muted-foreground">{d.recommendation}</p>
          </div>
          <DecisionBox onDecide={(n) => {
            toast.success(`Beslutning protokollført: "${n.slice(0, 50)}${n.length > 50 ? "…" : ""}"`);
          }} />
        </>
      ),
      actions: (
        <>
          <Button variant="outline" onClick={() => toast.success("Saksdokumenter åpnes…")}>
            <FileText className="h-4 w-4 mr-1.5" />
            Se saksdokumenter
          </Button>
          <Button variant="outline" onClick={() => toast.success("Sendt til styresekretær")}>
            Send til styresekretær
          </Button>
        </>
      ),
    });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Gavel className="h-5 w-5 text-primary" />
              Styrets beslutningsgrunnlag
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Klikk en sak for full bakgrunn, rettsgrunnlag og beslutningsfelt
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
              <button
                key={d.id}
                onClick={() => openDecisionDetail(d)}
                className="w-full text-left flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/40 hover:border-primary/30 transition-all group"
              >
                <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${d.tone === "destructive" ? "bg-destructive" : "bg-warning"}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">{d.type}</Badge>
                    <span className="text-[10px] text-muted-foreground">{d.ageDays}d åpen</span>
                  </div>
                  <p className="font-medium text-sm truncate">{d.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{d.meta}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary mt-2 shrink-0" />
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ---------- Risk triad ----------
function RiskExposureTriad({ openDetail }: { openDetail: (p: DetailPayload) => void }) {
  const { data } = useQuery({
    queryKey: ["board-risk-triad"],
    queryFn: async () => {
      const [systemsRes, incidentsRes] = await Promise.all([
        supabase.from("assets").select("id, risk_level, criticality"),
        supabase.from("system_incidents").select("id, status, risk_level, created_at").eq("status", "open"),
      ]);

      const criticalSystems = systemsRes.data?.filter((s: any) => s.criticality === "critical").length || 0;
      const openIncidents = incidentsRes.data?.length || 0;
      const criticalVendors = 3;

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
      detail: {
        breakdown: [
          { label: "Kritiske systemer", value: data?.criticalSystems ?? 0 },
          { label: "Uten BCP-plan", value: 2 },
          { label: "RTO-mål overskredet", value: 1 },
        ],
        narrative: "Det er identifisert kritiske systemer hvor gjenopprettingstid (RTO) ikke møter forretningens krav. Anbefaler at styret krever oppdatert kontinuitetsplan.",
      },
    },
    {
      title: "Cyberrisiko",
      icon: Shield,
      value: data?.openIncidents ?? 0,
      label: "åpne hendelser",
      sub: "NIS2 rapporteringsplikt 24t/72t/30d",
      tone: (data?.openIncidents ?? 0) > 2 ? "destructive" : (data?.openIncidents ?? 0) > 0 ? "warning" : "success",
      detail: {
        breakdown: [
          { label: "Åpne hendelser", value: data?.openIncidents ?? 0 },
          { label: "NIS2-rapporterte siste 90d", value: 1 },
          { label: "Phishing-forsøk siste 30d", value: 142 },
          { label: "MFA-dekning", value: "94%" },
        ],
        narrative: "Cybersikkerhetsnivået er solid, men styret bør være oppmerksom på at MFA-dekningen ikke er 100% — kritiske systemer skal være på 100% under NIS2.",
      },
    },
    {
      title: "Tredjepartsrisiko",
      icon: Building2,
      value: data?.criticalVendors ?? 0,
      label: "kritiske leverandører",
      sub: "Krever DPA + sikkerhetsvurdering",
      tone: (data?.criticalVendors ?? 0) > 5 ? "warning" : "success",
      detail: {
        breakdown: [
          { label: "Kritiske leverandører", value: data?.criticalVendors ?? 0 },
          { label: "Mangler oppdatert DPA", value: 1 },
          { label: "Underleverandører kartlagt", value: "8 av 12" },
          { label: "Konsentrasjonsrisiko", value: "Microsoft (47%)" },
        ],
        narrative: "Høy konsentrasjon på én skyleverandør utgjør en strategisk risiko. Styret bør vurdere multi-cloud-strategi eller exit-plan.",
      },
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
          <button
            key={c.title}
            onClick={() =>
              openDetail({
                title: c.title,
                subtitle: c.sub,
                tone: c.tone as any,
                body: (
                  <>
                    <div className="text-center py-3">
                      <div className={`text-5xl font-bold ${toneClass}`}>{c.value}</div>
                      <p className="text-sm text-muted-foreground mt-1">{c.label}</p>
                    </div>
                    <div className="space-y-1">
                      {c.detail.breakdown.map((b) => (
                        <MetaRow key={b.label} label={b.label} value={b.value} />
                      ))}
                    </div>
                    <div className="rounded-lg bg-muted/40 p-3 text-sm">
                      <p className="font-medium mb-1 flex items-center gap-1.5">
                        <Sparkles className="h-4 w-4 text-primary" />
                        Lara sin vurdering
                      </p>
                      <p className="text-muted-foreground">{c.detail.narrative}</p>
                    </div>
                    <DecisionBox onDecide={(n) => toast.success(`Risikoaksept logget: "${n.slice(0, 50)}…"`)} />
                  </>
                ),
                actions: (
                  <Button variant="outline" onClick={() => toast.success("Detaljert risikoregister åpnes…")}>
                    Åpne risikoregister
                  </Button>
                ),
              })
            }
            className="text-left"
          >
            <Card className="hover:shadow-md hover:border-primary/40 transition-all h-full">
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
                <div className="flex items-center gap-1 text-xs text-primary mt-3 opacity-0 group-hover:opacity-100">
                  Se detaljer <ChevronRight className="h-3 w-3" />
                </div>
              </CardContent>
            </Card>
          </button>
        );
      })}
    </div>
  );
}

// ---------- Financial impact widget (new) ----------
function FinancialImpactWidget({ openDetail }: { openDetail: (p: DetailPayload) => void }) {
  const data = [
    { kategori: "Bøter (potensial)", verdi: 24, color: "hsl(var(--destructive))" },
    { kategori: "Forsikring", verdi: 8, color: "hsl(var(--warning))" },
    { kategori: "Compliance-kost", verdi: 3.2, color: "hsl(var(--primary))" },
    { kategori: "Estimert ROI", verdi: 18, color: "hsl(var(--success))" },
  ];

  return (
    <Card
      className="hover:shadow-md hover:border-primary/40 transition-all cursor-pointer"
      onClick={() =>
        openDetail({
          title: "Finansiell eksponering og ROI",
          subtitle: "12-måneders perspektiv (MNOK)",
          tone: "primary",
          body: (
            <>
              <div className="space-y-1">
                <MetaRow label="Maks bøtepotensial (GDPR/NIS2)" value="24 MNOK" />
                <MetaRow label="Cyberforsikring årspremie" value="0,9 MNOK" />
                <MetaRow label="Forsikringsdekning" value="8 MNOK" />
                <MetaRow label="Compliance-budsjett 2026" value="3,2 MNOK" />
                <MetaRow label="Estimert verdi av redusert risiko" value="18 MNOK" />
                <MetaRow label="Netto ROI på compliance-program" value={<span className="text-success font-semibold">+14,8 MNOK</span>} />
              </div>
              <div className="rounded-lg bg-muted/40 p-3 text-sm">
                <p className="font-medium mb-1 flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Lara sin analyse
                </p>
                <p className="text-muted-foreground">
                  Compliance-investeringen gir betydelig nettogevinst gjennom redusert bøtepotensial og lavere forsikringspremier. Styret kan trygt forsvare budsjettet overfor eierne.
                </p>
              </div>
            </>
          ),
        })
      }
    >
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <DollarSign className="h-5 w-5 text-primary" />
          Finansiell eksponering
        </CardTitle>
        <p className="text-sm text-muted-foreground">Bøter, forsikring og ROI på compliance-program</p>
      </CardHeader>
      <CardContent>
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="kategori" stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                formatter={(v: any) => [`${v} MNOK`, "Verdi"]}
              />
              <Bar dataKey="verdi" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------- Training & culture (new) ----------
function TrainingWidget({ openDetail }: { openDetail: (p: DetailPayload) => void }) {
  const completion = 87;
  return (
    <Card
      className="hover:shadow-md hover:border-primary/40 transition-all cursor-pointer"
      onClick={() =>
        openDetail({
          title: "Kompetanse og sikkerhetskultur",
          subtitle: "Obligatorisk opplæring siste 12 mnd",
          tone: "success",
          body: (
            <>
              <div className="text-center py-3">
                <div className="text-5xl font-bold text-success">{completion}%</div>
                <p className="text-sm text-muted-foreground mt-1">av ansatte har gjennomført opplæring</p>
              </div>
              <div className="space-y-1">
                <MetaRow label="GDPR grunnopplæring" value="94%" />
                <MetaRow label="Sikkerhetsbevissthet" value="89%" />
                <MetaRow label="Phishing-simulering klikkrate" value={<span className="text-warning">8,2%</span>} />
                <MetaRow label="Ledelsen — risikoforståelse" value="100%" />
                <MetaRow label="Styret — egen opplæring siste 24 mnd" value="3 av 5" />
              </div>
              <div className="rounded-lg bg-warning/10 border border-warning/30 p-3 text-sm">
                <p className="font-medium mb-1 flex items-center gap-1.5">
                  <AlertCircle className="h-4 w-4 text-warning" />
                  Styremerknad
                </p>
                <p className="text-muted-foreground">
                  2 av 5 styremedlemmer mangler oppdatert opplæring i digital sikkerhet og personvern. Anbefales gjennomført innen neste styremøte.
                </p>
              </div>
              <DecisionBox onDecide={(n) => toast.success(`Tiltak vedtatt: "${n.slice(0, 50)}…"`)} />
            </>
          ),
        })
      }
    >
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <GraduationCap className="h-5 w-5 text-primary" />
          Kompetanse og kultur
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2 mb-3">
          <span className="text-4xl font-bold text-success">{completion}%</span>
          <span className="text-sm text-muted-foreground">opplæring gjennomført</span>
        </div>
        <Progress value={completion} className="h-2 mb-3" />
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="rounded bg-muted/40 p-2">
            <div className="text-muted-foreground">Phishing-klikkrate</div>
            <div className="font-semibold text-warning">8,2%</div>
          </div>
          <div className="rounded bg-muted/40 p-2">
            <div className="text-muted-foreground">Styreopplæring</div>
            <div className="font-semibold">3 av 5</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------- Preparedness ----------
function PreparednessWidget({ openDetail }: { openDetail: (p: DetailPayload) => void }) {
  const items = [
    { key: "bcp", label: "Beredskapsplan sist oppdatert", value: "12. mars 2026", status: "success" as const, detail: "Planen dekker ransomware, leverandørbortfall og personalkrise. Sist gjennomgått av styret i januar 2026." },
    { key: "drill", label: "Beredskapsøvelse sist gjennomført", value: "8. februar 2026", status: "success" as const, detail: "Table-top øvelse med ledergruppen — scenario: kompromittert e-postsystem. Læringspunkter dokumentert." },
    { key: "drills12", label: "Antall øvelser siste 12 mnd", value: "3 av 4 planlagt", status: "warning" as const, detail: "Q4-25 øvelse ble utsatt grunnet kapasitet. Bør prioriteres i Q3-26 for å oppfylle NIS2-krav." },
    { key: "nis2", label: "NIS2 rapporteringsfrister overholdt", value: "100% (12 av 12)", status: "success" as const, detail: "Alle rapporteringspliktige hendelser er meldt innen 24t/72t/30d. Ingen merknader fra NSM." },
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
              <button
                key={i.key}
                onClick={() =>
                  openDetail({
                    title: i.label,
                    subtitle: i.value,
                    tone: i.status,
                    body: (
                      <>
                        <p className="text-sm text-muted-foreground">{i.detail}</p>
                        <DecisionBox onDecide={(n) => toast.success(`Notert: "${n.slice(0, 50)}…"`)} />
                      </>
                    ),
                  })
                }
                className="text-left border rounded-lg p-3 hover:border-primary/40 hover:bg-muted/30 transition-all group"
              >
                <div className="text-xs text-muted-foreground mb-1 flex items-center justify-between">
                  <span>{i.label}</span>
                  <ChevronRight className="h-3 w-3 group-hover:text-primary" />
                </div>
                <div className={`text-base font-semibold ${tone}`}>{i.value}</div>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// ---------- Maturity trend ----------
function MaturityTrendChart({ currentScore, openDetail }: { currentScore: number; openDetail: (p: DetailPayload) => void }) {
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
    <Card
      className="hover:shadow-md hover:border-primary/40 transition-all cursor-pointer"
      onClick={() =>
        openDetail({
          title: "Modenhetstrend — detaljer",
          subtitle: `${delta >= 0 ? "+" : ""}${delta} poeng siste 12 mnd`,
          tone: delta >= 0 ? "success" : "warning",
          body: (
            <>
              <div className="space-y-1">
                <MetaRow label="Score Q2-25 (start)" value={`${data[0].Total}%`} />
                <MetaRow label="Score Q2-26 (i dag)" value={`${data[data.length - 1].Total}%`} />
                <MetaRow label="Endring" value={<span className={trendTone}>{delta >= 0 ? "+" : ""}{delta} poeng</span>} />
                <MetaRow label="Beste domene" value="Styring og governance" />
                <MetaRow label="Svakeste domene" value="Tredjepart" />
                <MetaRow label="Benchmark bransje" value="Topp 25%" />
              </div>
              <div className="rounded-lg bg-muted/40 p-3 text-sm">
                <p className="font-medium mb-1 flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Lara sin analyse
                </p>
                <p className="text-muted-foreground">
                  Virksomheten har en jevn positiv trend. Tredjepartsstyring henger etter — anbefaler at styret prioriterer dette i neste handlingsplan.
                </p>
              </div>
              <DecisionBox onDecide={(n) => toast.success(`Strategisk føring lagt: "${n.slice(0, 50)}…"`)} />
            </>
          ),
        })
      }
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Activity className="h-5 w-5 text-primary" />
              Modenhets-trend siste 12 måneder
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">Aggregert score per domene · klikk for analyse</p>
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
function RoleCoverageTable({ openDetail }: { openDetail: (p: DetailPayload) => void }) {
  const roles: Array<{ role: string; name: string; updated_at: string }> = [
    { role: "ceo daglig", name: "Ingrid Bakke", updated_at: "2026-02-12" },
    { role: "chair styreleder", name: "Per-Olav Wiken", updated_at: "2026-01-08" },
    { role: "dpo personvernombud", name: "Lise Holm", updated_at: "2025-11-22" },
    { role: "ciso sikkerhets", name: "Kjetil Aas", updated_at: "2026-03-04" },
  ];

  const requiredRoles = [
    { key: "ceo", label: "Daglig leder", legal: "Aksjeloven §6-2" },
    { key: "chair", label: "Styreleder", legal: "Aksjeloven §6-1" },
    { key: "dpo", label: "Personvernombud (DPO)", legal: "GDPR art. 37" },
    { key: "ciso", label: "Sikkerhetsansvarlig (CISO)", legal: "NIS2 art. 20" },
    { key: "compliance_lead", label: "Compliance Lead", legal: "Internkontrollforskriften" },
    { key: "bcp_coordinator", label: "Beredskapskoordinator", legal: "Sikkerhetsloven §4-3" },
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
          Klikk en rolle for full bakgrunn og bekreftelse
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
                <TableRow
                  key={r.key}
                  className="cursor-pointer hover:bg-muted/40"
                  onClick={() =>
                    openDetail({
                      title: r.label,
                      subtitle: r.legal,
                      tone,
                      body: (
                        <>
                          <div className="space-y-1">
                            <MetaRow label="Navn" value={r.name || "Ikke registrert"} />
                            <MetaRow label="Sist bekreftet" value={fmtDate(r.confirmed)} />
                            <MetaRow label="Stedfortreder" value={r.deputy || "Mangler"} />
                            <MetaRow label="Rettsgrunnlag" value={r.legal} />
                            <MetaRow label="Mandat" value="Definert i instruks fra styret" />
                          </div>
                          {missing && (
                            <div className="rounded-lg bg-destructive/10 border border-destructive/30 p-3 text-sm">
                              <p className="font-medium text-destructive">Kritisk gap</p>
                              <p className="text-muted-foreground mt-1">Rollen er lovpålagt og må fylles før neste rapportering.</p>
                            </div>
                          )}
                          <DecisionBox onDecide={(n) => toast.success(`Rolle bekreftet: "${n.slice(0, 50)}…"`)} />
                        </>
                      ),
                      actions: (
                        <Button variant="outline" onClick={() => toast.success("Åpner rolleinstruks…")}>
                          Se rolleinstruks
                        </Button>
                      ),
                    })
                  }
                >
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
function NextBoardMeetingCard({ decisionCount, openDetail }: { decisionCount: number; openDetail: (p: DetailPayload) => void }) {
  const agenda = [
    `Godkjenning av ${decisionCount} åpne beslutningspunkter`,
    "Gjennomgang av modenhetstrend og prioriteringer neste kvartal",
    "Bekreftelse av nøkkelroller og stedfortredere",
    "Status på NIS2-beredskap og neste beredskapsøvelse",
    "Finansiell eksponering — godkjenning av cyberforsikring fornyelse",
    "Styremedlemmenes egen sikkerhets- og personvernopplæring",
  ];

  return (
    <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-primary" />
            Forberedelse til neste styremøte
          </CardTitle>
          <Badge variant="outline">12. juni 2026</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="text-sm">
            <p className="font-medium mb-2">Lara foreslår følgende saker på agenda:</p>
            <ul className="space-y-1">
              {agenda.map((a, i) => (
                <li key={i}>
                  <button
                    onClick={() =>
                      openDetail({
                        title: `Agendapunkt ${i + 1}`,
                        subtitle: a,
                        tone: "primary",
                        body: (
                          <>
                            <p className="text-sm text-muted-foreground">
                              Lara har samlet relevant underlag for dette agendapunktet basert på data fra Mynder-plattformen. Du kan markere punktet som klart for styremøtet eller be om utdypning.
                            </p>
                            <div className="space-y-1">
                              <MetaRow label="Forberedelsesgrad" value={`${Math.round(60 + Math.random() * 40)}%`} />
                              <MetaRow label="Anslått møtetid" value={`${10 + i * 2} min`} />
                              <MetaRow label="Underlag" value="Lara-generert sammendrag (PDF)" />
                            </div>
                          </>
                        ),
                        actions: (
                          <Button variant="outline" onClick={() => toast.success("Underlag lastes ned…")}>
                            <FileDown className="h-4 w-4 mr-1.5" />
                            Last ned underlag
                          </Button>
                        ),
                      })
                    }
                    className="w-full text-left flex items-start gap-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/40 rounded p-1.5 -mx-1.5 transition-colors group"
                  >
                    <ArrowRight className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                    <span className="flex-1">{a}</span>
                    <ChevronRight className="h-3 w-3 mt-1 opacity-0 group-hover:opacity-100" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <Separator />
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => toast.success("Styrerapport genereres som PDF…")}>
              <FileDown className="h-4 w-4 mr-2" />
              Generer styrerapport (PDF)
            </Button>
            <Button variant="outline" onClick={() => toast.success("Agenda lagt til kalenderen")}>
              <Calendar className="h-4 w-4 mr-2" />
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
  const [detail, setDetail] = useState<DetailPayload | null>(null);
  const openDetail = (p: DetailPayload) => setDetail(p);

  const { data: decisionCount = 0 } = useQuery({
    queryKey: ["board-decisions-count"],
    queryFn: async () => {
      const ai = await supabase
        .from("ai_system_registry")
        .select("id", { count: "exact", head: true })
        .in("risk_category", ["high", "unacceptable"]);
      return (ai.count || 0) + 3; // +3 demo (avvik, leverandør, beredskap)
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
                Strategisk overblikk for styre og styreleder — alle bokser er klikkbare for detaljer og beslutninger.
              </p>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Sist oppdatert</div>
              <div className="text-sm font-medium">{new Date().toLocaleDateString("nb-NO", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</div>
            </div>
          </div>

          <LegalComplianceHero openDetail={openDetail} />

          <BoardDecisionsWidget openDetail={openDetail} />

          <div>
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              Risikoeksponering
            </h2>
            <RiskExposureTriad openDetail={openDetail} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <FinancialImpactWidget openDetail={openDetail} />
            <TrainingWidget openDetail={openDetail} />
          </div>

          <PreparednessWidget openDetail={openDetail} />

          <MaturityTrendChart currentScore={overall} openDetail={openDetail} />

          <RoleCoverageTable openDetail={openDetail} />

          <NextBoardMeetingCard decisionCount={decisionCount} openDetail={openDetail} />
        </div>
      </main>

      <DetailDrawer payload={detail} onClose={() => setDetail(null)} />
    </div>
  );
}
