import { useNavigate, useParams } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  ArrowRight,
  TrendingUp,
  Target,
  ShieldCheck,
  PieChart as PieIcon,
  Megaphone,
  Newspaper,
  Layers,
  CheckCircle2,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

// ---- Shared demo data (mirrors dashboard) ----
const CLAIM_TREND = [
  { month: "nov", value: 6 },
  { month: "des", value: 9 },
  { month: "jan", value: 22 },
  { month: "feb", value: 32 },
  { month: "mar", value: 41 },
  { month: "apr", value: 47 },
];

const SEGMENTS = [
  { label: "NIS2-eksponert", count: 71, color: "hsl(var(--primary))" },
  { label: "Sky-avhengig", count: 186, color: "hsl(270 70% 70%)" },
  { label: "Særlige kategorier", count: 128, color: "hsl(155 65% 45%)" },
  { label: "DORA-finans", count: 42, color: "hsl(25 90% 55%)" },
  { label: "ISO 27001", count: 23, color: "hsl(35 70% 40%)" },
];

const REGULATIONS = [
  { name: "GDPR", customers: 142, growth: "+12%", status: "high" as const },
  { name: "ISO 27001", customers: 118, growth: "+24%", status: "high" as const },
  { name: "DORA", customers: 81, growth: "+4%", status: "medium" as const },
  { name: "AI Act", customers: 47, growth: "+31%", status: "high" as const },
];

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  high: { label: "Høy", cls: "bg-destructive/10 text-destructive border-destructive/20" },
  medium: { label: "Middels", cls: "bg-warning/10 text-warning border-warning/20" },
  low: { label: "Lav", cls: "bg-success/10 text-success border-success/20" },
};

const FOLLOW_UP_CUSTOMERS = [
  { name: "Bergen Maskin AS", reason: "ISO 27001 utløpt 14 dager siden", category: "Kritiske avvik", tone: "destructive" as const },
  { name: "Sognefjord Helse AS", reason: "Datatilsyn-sak åpnet", category: "Kritiske avvik", tone: "destructive" as const },
  { name: "Nordic Cargo AS", reason: "Trust Profile ikke oppdatert på 8 mnd", category: "Utdaterte Trust Profiler", tone: "warning" as const },
  { name: "Vestland Logistikk", reason: "Trust Profile mangler 4 av 6 områder", category: "Utdaterte Trust Profiler", tone: "warning" as const },
  { name: "Fjord IT AS", reason: "Trust Profile sist sett 14 mnd siden", category: "Utdaterte Trust Profiler", tone: "warning" as const },
  { name: "Helse Vest Klinikk", reason: "DPA ikke på plass med ny leverandør", category: "Manglende DPA", tone: "primary" as const },
  { name: "Oslo Eiendom AS", reason: "DPA mangler for 2 SaaS-systemer", category: "Manglende DPA", tone: "primary" as const },
];

const CAMPAIGNS = [
  { id: "nis2", title: "NIS2-vurdering", reach: 42, accepted: 11, daysLeft: 4, status: "Aktiv", responseRate: 26 },
  { id: "transparency", title: "Åpenhetsloven — redegjørelse", reach: 28, accepted: 9, daysLeft: 12, status: "Aktiv", responseRate: 32 },
  { id: "dpia", title: "DPIA for AI-systemer", reach: 22, accepted: 4, daysLeft: 21, status: "Aktiv", responseRate: 18 },
  { id: "dora", title: "DORA-readiness for finans", reach: 18, accepted: 14, daysLeft: 0, status: "Avsluttet", responseRate: 78 },
  { id: "iso", title: "ISO 27001-løft", reach: 35, accepted: 22, daysLeft: 0, status: "Avsluttet", responseRate: 63 },
];

const NEWS = [
  { kind: "Nyhet", title: "Lara kan nå generere DPIA-utkast", meta: "Lara henter inn ROPA og leverandørdata automatisk", when: "I dag" },
  { kind: "Webinar", title: "NIS2 i praksis for MSP-er", meta: "28. mai · 10:00 · Påmelding åpen", when: "Om 7 dager" },
  { kind: "Kurs", title: "Trust Profile-salg for MSP", meta: "45 min · gir sertifisering", when: "Tilgjengelig" },
  { kind: "Nyhet", title: "Automatisk leverandørkartlegging", meta: "Lara skanner og foreslår oppføringer", when: "Denne uken" },
  { kind: "Kurs", title: "Compliance-pakkene forklart", meta: "Kort intro for nye partnere", when: "Tilgjengelig" },
  { kind: "Webinar", title: "Åpenhetsloven 2.0", meta: "12. juni · 13:00", when: "Om 3 uker" },
];

const SCORE_DISTRIBUTION = [
  { bucket: "0–40", count: 22 },
  { bucket: "41–60", count: 58 },
  { bucket: "61–75", count: 142 },
  { bucket: "76–90", count: 138 },
  { bucket: "91–100", count: 40 },
];

const CLAIM_BY_SEGMENT = [
  { segment: "NIS2", claimed: 22, total: 71 },
  { segment: "Sky", claimed: 14, total: 186 },
  { segment: "Særlige", claimed: 6, total: 128 },
  { segment: "DORA", claimed: 4, total: 42 },
  { segment: "ISO 27001", claimed: 1, total: 23 },
];

type WidgetMeta = {
  id: string;
  title: string;
  subtitle: string;
  icon: typeof Target;
  hero: { value: string; sub: string };
  explainer: string;
  ctas: { label: string; href: string; primary?: boolean }[];
};

const WIDGETS: Record<string, WidgetMeta> = {
  "claim-rate": {
    id: "claim-rate",
    title: "Aktiveringsgrad",
    subtitle: "Andelen kunder som har aktivert sin Trust Profile og godkjent compliance-leveransen",
    icon: Target,
    hero: { value: "12%", sub: "47 av 400 kunder har aktivert sin profil. Mål: 40% innen 2026." },
    explainer:
      "Aktiveringsgrad måles som antall kunder som har godkjent compliance-leveransen og tatt eierskap til sin Trust Profile, delt på total portefølje. Høyere aktiveringsgrad gir mer engasjement, bedre datakvalitet og flere muligheter for å levere tilbud som hjelper kundene å øke modenheten innenfor valgte regelverk.",
    ctas: [
      { label: "Kjør aktiveringskampanje", href: "/msp-messages", primary: true },
      { label: "Se ikke-aktiverte kunder", href: "/msp-licenses?filter=unclaimed" },
    ],
  },
  "needs-follow-up": {
    id: "needs-follow-up",
    title: "Krever oppfølging",
    subtitle: "Kunder med utdaterte profiler, manglende DPA eller kritiske avvik",
    icon: Target,
    hero: { value: "23", sub: "kunder krever konkret oppfølging nå" },
    explainer:
      "Vi flagger kunder hvor noe må adresseres innen kort tid: en Trust Profile som ikke er oppdatert, en manglende databehandleravtale, eller et registrert kritisk avvik. Listen oppdateres daglig av Lara.",
    ctas: [
      { label: "Åpne kundeoversikt", href: "/msp-licenses?filter=needs_attention", primary: true },
      { label: "Send påminnelse i bulk", href: "/msp-messages" },
    ],
  },
  "trust-score": {
    id: "trust-score",
    title: "Gjennomsnittlig Trust Score",
    subtitle: "Snitt på tvers av hele kundeporteføljen",
    icon: ShieldCheck,
    hero: { value: "78", sub: "+4 poeng siste 30 dager" },
    explainer:
      "Trust Score er en sammensatt score per kunde (0–100) basert på modenhet i de fire kjernedomenene Governance, Operations, Privacy og Third-Party. Porteføljesnittet viser hvor solid kundebasen din står samlet.",
    ctas: [
      { label: "Se kunder med lavest score", href: "/msp-licenses?sort=score_asc", primary: true },
    ],
  },
  "claim-development": {
    id: "claim-development",
    title: "Aktivering over tid",
    subtitle: "Hvordan aktiveringsgraden har utviklet seg",
    icon: TrendingUp,
    hero: { value: "+167%", sub: "vekst i aktiveringer siste 6 måneder (fra 6 til 47)" },
    explainer:
      "Grafen viser nye aktiverte kunder per måned. Trenden lar deg se effekten av kampanjer og oppfølgingsarbeid. Et naturlig mål er å holde en stigende trend frem til 40% aktiveringsgrad er nådd.",
    ctas: [
      { label: "Planlegg ny kampanje", href: "/msp-messages", primary: true },
    ],
  },
  "segmentation": {
    id: "segmentation",
    title: "Portefølje-segmentering",
    subtitle: "Hvordan kundene fordeler seg på regulatoriske krav",
    icon: PieIcon,
    hero: { value: "5", sub: "aktive segmenter i porteføljen" },
    explainer:
      "Lara segmenterer kundene basert på bransje, datatyper og regulatorisk eksponering. Bruk segmentene til å lage målrettede kampanjer og rådgivningstilbud.",
    ctas: [
      { label: "Lag segment-kampanje", href: "/msp-messages", primary: true },
    ],
  },
  "top-services": {
    id: "top-services",
    title: "Regelverk kundene trenger mest hjelp med",
    subtitle: "Samlet oversikt over regulatoriske behov i porteføljen",
    icon: Layers,
    hero: { value: "388", sub: "kunder har minst ett regelverksbehov i porteføljen" },
    explainer:
      "Tallene baseres på åpne aktiviteter, gap i Trust Profile og innkommende forespørsler fra kundene. Lara oppdaterer oversikten daglig. Veksttrend (+%) viser endring siste 30 dager sammenlignet med forrige periode.",
    ctas: [
      { label: "Se servicekatalog", href: "/msp-service-catalog", primary: true },
      { label: "Opprett kampanje", href: "/msp-messages", primary: false },
    ],
  },
  "campaigns": {
    id: "campaigns",
    title: "Kampanjer",
    subtitle: "Aktive, planlagte og avsluttede kampanjer",
    icon: Megaphone,
    hero: { value: "3", sub: "pågående kampanjer · 2 avsluttede i kvartalet" },
    explainer:
      "Kampanjer er målrettede utsendelser til et utvalg av porteføljen. Lara foreslår mål og innhold basert på regulatoriske signaler og kundens modenhet.",
    ctas: [
      { label: "Opprett ny kampanje", href: "/msp-messages", primary: true },
    ],
  },
  "news": {
    id: "news",
    title: "Nyheter fra Mynder",
    subtitle: "Nye funksjoner, kurs og webinarer",
    icon: Newspaper,
    hero: { value: "6", sub: "nye saker denne måneden" },
    explainer:
      "Hold deg oppdatert på det siste fra plattformen — nye AI-funksjoner i Lara, webinarer for partnere, og sertifiseringskurs du kan ta selv eller anbefale teamet ditt.",
    ctas: [
      { label: "Åpne ressurssenter", href: "/resources", primary: true },
    ],
  },
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">{title}</h2>
      {children}
    </div>
  );
}

function RegulatoryOverview() {
  const totalCustomers = 400;
  const withNeed = REGULATIONS.reduce((sum, r) => sum + r.customers, 0);

  return (
    <Section title="Regelverk og antall kunder med behov">
      <Card className="divide-y divide-border">
        {/* Header row */}
        <div className="grid grid-cols-4 gap-3 px-4 py-2.5 text-[10px] uppercase tracking-wider text-muted-foreground">
          <div>Regelverk</div>
          <div className="text-right">Kunder med behov</div>
          <div className="text-right">Vekst (30 d)</div>
          <div className="text-right">Etterspørsel</div>
        </div>

        {/* Data rows */}
        {REGULATIONS.map((r) => {
          const status = STATUS_LABELS[r.status];
          return (
            <div
              key={r.name}
              className="grid grid-cols-4 gap-3 px-4 py-3 items-center hover:bg-accent/40 transition-colors"
            >
              <div className="font-medium text-foreground">{r.name}</div>
              <div className="text-right text-sm font-semibold tabular-nums">{r.customers}</div>
              <div className="text-right">
                <Badge variant="outline" className="text-xs text-success border-success/30">
                  {r.growth}
                </Badge>
              </div>
              <div className="text-right">
                <Badge variant="outline" className={`text-[11px] ${status.cls}`}>
                  {status.label}
                </Badge>
              </div>
            </div>
          );
        })}
      </Card>

      {/* Summary card */}
      <Card className="p-5 mt-5 bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
        <div className="flex items-baseline gap-3 flex-wrap">
          <div className="text-4xl font-bold text-foreground tabular-nums">{withNeed}</div>
          <div className="text-sm text-muted-foreground">
            av totalt {totalCustomers} kunder har minst ett regelverksbehov
            <span className="ml-1 text-xs">({Math.round((withNeed / totalCustomers) * 100)}%)</span>
          </div>
        </div>
      </Card>
    </Section>
  );
}

function WidgetBody({ id }: { id: string }) {
  switch (id) {
    case "claim-rate":
    case "claim-development":
      return (
        <>
          <Section title="Utvikling siste 6 måneder">
            <Card className="p-5">
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={CLAIM_TREND} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                    <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2.5} fill="url(#g1)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </Section>
          <Section title="Aktiverte kunder per segment">
            <Card className="p-5">
              <div className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={CLAIM_BY_SEGMENT}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="segment" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                    <Bar dataKey="claimed" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="total" fill="hsl(var(--muted))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </Section>
        </>
      );

    case "needs-follow-up": {
      const toneCls: Record<string, string> = {
        destructive: "bg-destructive",
        warning: "bg-warning",
        primary: "bg-primary",
      };
      return (
        <Section title="Kunder som krever oppfølging">
          <Card className="divide-y divide-border">
            {FOLLOW_UP_CUSTOMERS.map((c) => (
              <div key={c.name} className="flex items-center gap-3 p-4">
                <div className={`h-2 w-2 rounded-full shrink-0 ${toneCls[c.tone]}`} />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-foreground">{c.name}</div>
                  <div className="text-xs text-muted-foreground">{c.reason}</div>
                </div>
                <Badge variant="outline" className="text-xs">{c.category}</Badge>
                <Button size="sm" variant="ghost">Åpne <ArrowRight className="h-3 w-3 ml-1" /></Button>
              </div>
            ))}
          </Card>
        </Section>
      );
    }

    case "trust-score":
      return (
        <Section title="Fordeling av Trust Score i porteføljen">
          <Card className="p-5">
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={SCORE_DISTRIBUTION}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="bucket" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {SCORE_DISTRIBUTION.map((d, i) => (
                      <Cell key={i} fill={
                        d.bucket === "0–40" || d.bucket === "41–60" ? "hsl(var(--destructive))"
                          : d.bucket === "61–75" ? "hsl(var(--warning))"
                            : "hsl(var(--success))"
                      } />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Section>
      );

    case "segmentation":
      return (
        <Section title="Porteføljens regulatoriske eksponering">
          <Card className="p-5">
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={SEGMENTS} dataKey="count" nameKey="label" cx="50%" cy="50%" outerRadius={110} innerRadius={60} paddingAngle={2}>
                    {SEGMENTS.map((s, i) => <Cell key={i} fill={s.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Section>
      );

    case "top-services":
      return <RegulatoryOverview />;




    case "campaigns":
      return (
        <Section title="Alle kampanjer">
          <Card className="divide-y divide-border">
            {CAMPAIGNS.map((c) => (
              <div key={c.id} className="p-4 flex items-center gap-4">
                <Megaphone className="h-4 w-4 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <div className="font-medium text-foreground">{c.title}</div>
                    <Badge variant={c.status === "Aktiv" ? "default" : "secondary"} className="text-[11px]">{c.status}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">{c.accepted} av {c.reach} svar · responsrate {c.responseRate}%</div>
                </div>
                {c.status === "Aktiv" && (
                  <div className="text-xs text-muted-foreground tabular-nums">{c.daysLeft}d igjen</div>
                )}
                <Button size="sm" variant="ghost">Detaljer <ArrowRight className="h-3 w-3 ml-1" /></Button>
              </div>
            ))}
          </Card>
        </Section>
      );

    case "news":
      return (
        <Section title="Alle nyheter">
          <Card className="divide-y divide-border">
            {NEWS.map((n, i) => (
              <div key={i} className="p-4 flex items-start gap-4">
                <Badge variant="outline" className="text-[11px] shrink-0">{n.kind}</Badge>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-foreground">{n.title}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{n.meta}</div>
                </div>
                <div className="text-xs text-muted-foreground shrink-0">{n.when}</div>
              </div>
            ))}
          </Card>
        </Section>
      );

    default:
      return null;
  }
}

export default function MSPWidgetDetail() {
  const { widgetId = "" } = useParams();
  const navigate = useNavigate();
  const meta = WIDGETS[widgetId];

  if (!meta) {
    return (
      <div className="flex min-h-screen w-full bg-background">
        <Sidebar />
        <main className="flex-1 overflow-auto pt-11 p-8">
          <Button variant="ghost" onClick={() => navigate("/msp-partner")} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Tilbake til dashboard
          </Button>
          <p className="text-muted-foreground mt-6">Fant ikke widget «{widgetId}».</p>
        </main>
      </div>
    );
  }

  const Icon = meta.icon;

  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto pt-11">
        <div className="container max-w-5xl mx-auto py-8 px-4 md:px-8 space-y-8">
          <Button variant="ghost" onClick={() => navigate("/msp-partner")} className="gap-2 -ml-2">
            <ArrowLeft className="h-4 w-4" /> Tilbake til dashboard
          </Button>

          {/* Hero */}
          <div className="space-y-3">
            <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Icon className="h-5 w-5" />
            </div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight">{meta.title}</h1>
            <p className="text-muted-foreground">{meta.subtitle}</p>
          </div>

          {/* Key number */}
          <Card className="p-6 bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
            <div className="flex items-baseline gap-4 flex-wrap">
              <div className="text-5xl font-bold text-foreground tabular-nums">{meta.hero.value}</div>
              <div className="text-sm text-muted-foreground max-w-md">{meta.hero.sub}</div>
            </div>
          </Card>

          {/* Body */}
          <WidgetBody id={widgetId} />

          {/* Explainer */}
          <Section title="Hva betyr dette?">
            <Card className="p-5">
              <p className="text-sm text-foreground leading-relaxed">{meta.explainer}</p>
            </Card>
          </Section>

          {/* CTAs */}
          <Section title="Anbefalte handlinger">
            <div className="flex flex-wrap gap-2">
              {meta.ctas.map((cta) => (
                <Button
                  key={cta.label}
                  variant={cta.primary ? "default" : "outline"}
                  onClick={() => navigate(cta.href)}
                  className="gap-2"
                >
                  {cta.primary && <CheckCircle2 className="h-4 w-4" />}
                  {cta.label}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ))}
            </div>
          </Section>
        </div>
      </main>
    </div>
  );
}
