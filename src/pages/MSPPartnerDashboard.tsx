import { useMemo, useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import { useWorkspaceMode } from "@/contexts/WorkspaceModeContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Sparkles, ArrowUpRight, TrendingUp, ChevronRight, ChevronDown, Mail, Phone, Calendar, CheckCircle2, Users, Target, Clock, FileText, Send, ThumbsUp, Settings, X, HelpCircle } from "lucide-react";
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { OpportunityWidget } from "@/components/msp/OpportunityWidget";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceDot,
} from "recharts";

// ---------- Mock data (aggregated partner view) ----------
const KPIS = [
  { key: "portfolio", label: "PORTEFØLJE", value: "400", sub: "kunder", tone: "default" as const },
  { key: "claim", label: "GODKJENT AV KUNDE", value: "12%", sub: "47 av 400 kunder har godkjent regelverkstilbud", tone: "primary" as const, delta: "+2", progress: 30 },
  { key: "signals", label: "SALGSSIGNALER", value: "23", sub: "aktive nå", tone: "warning" as const },
  { key: "won", label: "VUNNET I MND", value: "340k", sub: "12 oppdrag", tone: "success" as const },
];

type LaraSuggestion = {
  id: number;
  dot: string;
  text: string;
  icon: typeof Target;
  title: string;
  summary: string;
  impact: { reach: string; expectedClaims: string; revenue: string };
  steps: string[];
  cta: { primary: string; secondary: string; icon: typeof Mail };
  regulation: "NIS2" | "GDPR" | "DORA" | "AI Act";
  targetCount: number;
  expectedEffect: string;
  priority: "Høy" | "Middels" | "Lav";
};

const LARA_SUGGESTIONS: LaraSuggestion[] = [
  {
    id: 1,
    dot: "bg-status-followup",
    text: "Kjør NIS2-aktiveringskampanje mot 28 kunder",
    icon: Target,
    title: "NIS2-aktiveringskampanje",
    summary: "28 kunder i porteføljen er NIS2-eksponert, men har ennå ikke aktivert sin Trust Profile. Lara har klargjort en målrettet kampanje.",
    impact: { reach: "28 kunder", expectedClaims: "9–12 nye aktiveringer", revenue: "~210 000 kr ARR" },
    steps: [
      "Send personalisert e-post med NIS2-eksponering og frister",
      "Automatisk oppfølging etter 3 dager til de som ikke åpnet",
      "Lara booker intro-møte for de som klikker «Vis min profil»",
      "Du får daglig statusrapport i innboksen",
    ],
    cta: { primary: "Start kampanje nå", secondary: "Tilpass mal", icon: Mail },
    regulation: "NIS2",
    targetCount: 28,
    expectedEffect: "9–12 nye aktiveringer",
    priority: "Høy",
  },
  {
    id: 2,
    dot: "bg-primary",
    text: "GDPR årlig oppfriskning mot 46 kunder",
    icon: Mail,
    title: "GDPR årlig oppfriskning",
    summary: "46 kunder har databehandleravtaler og ROPA-oppføringer som ikke er gjennomgått de siste 12 månedene. Lara har klargjort en fornyelseskampanje.",
    impact: { reach: "46 kunder", expectedClaims: "30+ fornyelser", revenue: "~180 000 kr ARR" },
    steps: [
      "Send påminnelse om årlig GDPR-gjennomgang",
      "Automatisk sjekk av DPA-status og ROPA-oppdateringer",
      "Lara foreslår oppdaterte tekster per kunde",
      "Fornyelsesrapport til deg ukentlig",
    ],
    cta: { primary: "Start kampanje", secondary: "Tilpass mal", icon: Mail },
    regulation: "GDPR",
    targetCount: 46,
    expectedEffect: "30+ fornyelser",
    priority: "Middels",
  },
  {
    id: 3,
    dot: "bg-status-followup",
    text: "DORA-beredskapssjekk mot 12 finanskunder",
    icon: Target,
    title: "DORA-beredskapssjekk",
    summary: "12 kunder i finanssektoren omfattes av DORA, men mangler dokumentert IKT-risikovurdering. Lara kan starte en beredskapssjekk.",
    impact: { reach: "12 kunder", expectedClaims: "8 risikovurderinger", revenue: "~140 000 kr ARR" },
    steps: [
      "Send DORA-eksponeringsanalyse til hver kunde",
      "Lara henter data fra Trust Profile og kartlegger gap",
      "Foreslå prioriterte tiltak per kunde",
      "Ukentlig statusrapport til deg",
    ],
    cta: { primary: "Start kampanje", secondary: "Tilpass mal", icon: Mail },
    regulation: "DORA",
    targetCount: 12,
    expectedEffect: "8 risikovurderinger",
    priority: "Høy",
  },
  {
    id: 4,
    dot: "bg-primary",
    text: "AI Act-kartlegging mot 19 kunder med AI-systemer",
    icon: Users,
    title: "AI Act-kartlegging",
    summary: "19 kunder har registrert AI-systemer, men mangler ROPA-oppføring og risikoklassifisering iht. AI Act. Lara kan kartlegge og opprette utkast.",
    impact: { reach: "19 kunder", expectedClaims: "15 nye ROPA-oppføringer", revenue: "~95 000 kr ARR" },
    steps: [
      "Lara identifiserer AI-systemer i kundens portefølje",
      "Klassifiserer risikonivå iht. AI Act",
      "Genererer ROPA-utkast per system",
      "Rådgiver godkjenner før publisering",
    ],
    cta: { primary: "Start kampanje", secondary: "Tilpass mal", icon: Mail },
    regulation: "AI Act",
    targetCount: 19,
    expectedEffect: "15 nye ROPA-oppføringer",
    priority: "Middels",
  },
];

const CLAIM_TREND = [
  { month: "nov", value: 6 },
  { month: "des", value: 9 },
  { month: "jan", value: 22 },
  { month: "feb", value: 32 },
  { month: "mar", value: 41 },
  { month: "apr", value: 47 },
];

// Partner default currency (prototype). Change here to reflect partner setting.
const PARTNER_CURRENCY = "NOK";
const PARTNER_LOCALE = "nb-NO";

// Accumulated service sales potential over the last 6 months, in partner currency.
const SERVICE_POTENTIAL_TREND = [
  { month: "nov", value: 420000 },
  { month: "des", value: 680000 },
  { month: "jan", value: 1050000 },
  { month: "feb", value: 1480000 },
  { month: "mar", value: 1920000 },
  { month: "apr", value: 2400000 },
];

function formatPartnerCurrency(amount: number, compact = true) {
  try {
    return new Intl.NumberFormat(PARTNER_LOCALE, {
      style: "currency",
      currency: PARTNER_CURRENCY,
      maximumFractionDigits: 0,
      notation: compact ? "compact" : "standard",
    }).format(amount);
  } catch {
    return `${amount} ${PARTNER_CURRENCY}`;
  }
}


const SEGMENTS = [
  { label: "NIS2-eksponert", count: 71, color: "bg-primary", widthPct: 35, activatedPct: 38 },
  { label: "Sky-avhengig", count: 186, color: "bg-purple-400", widthPct: 92, activatedPct: 54 },
  { label: "Særlige kategorier", count: 128, color: "bg-emerald-500", widthPct: 64, activatedPct: 61 },
  { label: "DORA-finans", count: 42, color: "bg-orange-500", widthPct: 21, activatedPct: 29 },
  { label: "ISO 27001", count: 23, color: "bg-amber-700", widthPct: 12, activatedPct: 48 },
];

const LIVE_SIGNALS = [
  { time: "2t", name: "Bergen Maskin AS", note: "ISO 27001 utløpt", accent: "bg-destructive" },
  { time: "04:15", name: "Sognefjord Helse AS", note: "Datatilsyn-sak åpnet", accent: "bg-status-followup" },
  { time: "i går", name: "Vestland Logistikk", note: "Ny CEO i Brreg", accent: "bg-primary" },
  { time: "i går", name: "Nordic Cargo AS", note: "Kunde har aktivert profilen", accent: "bg-emerald-500" },
];

// ---------- Components ----------

function PartnerHeader() {
  const navigate = useNavigate();
  return (
    <div className="flex items-start justify-between">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Hei, Beate</h1>
        <p className="text-muted-foreground mt-1">
          Her er din daglig oppdatering
        </p>
      </div>
      <div className="flex items-center gap-2">
        <div className="inline-flex rounded-lg border border-border bg-card p-1 text-sm">
          {["I dag", "Uke", "Måned"].map((p, i) => (
            <button
              key={p}
              className={
                "px-3 py-1.5 rounded-md transition-colors " +
                (i === 0
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground")
              }
            >
              {p}
            </button>
          ))}
        </div>
        <Button
          variant="outline"
          size="icon"
          aria-label="Innstillinger"
          title="Innstillinger"
          onClick={() => navigate("/msp-settings")}
        >
          <Settings className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}


// Regelverksaktivering på tvers av kundeporteføljen (mockdata).
const PORTFOLIO_CUSTOMERS = 300;
const FRAMEWORK_ACTIVATIONS = [
  { label: "GDPR", lastMonth: 18, lastHalfYear: 90, activeCustomers: 186 },
  { label: "NIS2", lastMonth: 11, lastHalfYear: 54, activeCustomers: 71 },
  { label: "ISO 27001", lastMonth: 6, lastHalfYear: 33, activeCustomers: 54 },
  { label: "DORA", lastMonth: 4, lastHalfYear: 21, activeCustomers: 42 },
];

function ClaimRateWidget() {
  const navigate = useNavigate();
  const [period, setPeriod] = useState<"month" | "halfYear">("month");
  const [framework, setFramework] = useState<string>("Alle");

  const rows = FRAMEWORK_ACTIVATIONS.filter(
    (f) => framework === "Alle" || f.label === framework,
  );
  const total = rows.reduce(
    (sum, f) => sum + (period === "month" ? f.lastMonth : f.lastHalfYear),
    0,
  );
  const periodLabel = period === "month" ? "siste måned" : "siste halvår";
  const max = Math.max(...rows.map((f) => (period === "month" ? f.lastMonth : f.lastHalfYear)), 1);

  return (
    <Card
      onClick={() => navigate("/msp-partner/widget/claim-rate")}
      className="relative overflow-hidden border-0 p-0 cursor-pointer group"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-indigo-700 to-primary/80" />
      <div className="absolute -top-16 -right-16 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
      <div className="relative p-5 text-white">
        <div className="flex items-center gap-1.5">
          <div className="text-[11px] uppercase tracking-[0.15em] text-white/80 font-semibold">
            Regelverk aktivert
          </div>
          <UITooltip>
            <TooltipTrigger asChild>
              <HelpCircle
                className="h-3.5 w-3.5 text-white/60 cursor-help"
                onClick={(e) => e.stopPropagation()}
              />
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-[280px]">
              <p>
                Viser hvor mange av de {PORTFOLIO_CUSTOMERS} kundene dine som har aktivert
                regelverk siste måned og siste halvår. Filtrer på regelverk for å se andelen
                per regelverk.
              </p>
            </TooltipContent>
          </UITooltip>
        </div>

        <div
          className="mt-3 inline-flex rounded-lg bg-white/15 p-0.5 text-xs"
          role="group"
          aria-label="Velg periode"
          onClick={(e) => e.stopPropagation()}
        >
          {([
            ["month", "Siste måned"],
            ["halfYear", "Siste halvår"],
          ] as const).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setPeriod(value)}
              aria-pressed={period === value}
              className={
                "px-2.5 py-1 rounded-md font-medium transition-colors " +
                (period === value ? "bg-white text-primary" : "text-white/80 hover:text-white")
              }
            >
              {label}
            </button>
          ))}
        </div>

        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-bold leading-none tabular-nums">{total}</span>
          <span className="text-sm text-white/85">
            aktiveringer {periodLabel} · {Math.round((total / PORTFOLIO_CUSTOMERS) * 100)}% av{" "}
            {PORTFOLIO_CUSTOMERS} kunder
          </span>
        </div>

        <div
          className="mt-3 flex flex-wrap gap-1.5"
          role="group"
          aria-label="Filtrer på regelverk"
          onClick={(e) => e.stopPropagation()}
        >
          {["Alle", ...FRAMEWORK_ACTIVATIONS.map((f) => f.label)].map((label) => (
            <button
              key={label}
              type="button"
              onClick={() => setFramework(label)}
              aria-pressed={framework === label}
              className={
                "px-2.5 py-1 rounded-full text-xs font-medium transition-colors " +
                (framework === label
                  ? "bg-white text-primary"
                  : "bg-white/15 text-white/85 hover:bg-white/25")
              }
            >
              {label}
            </button>
          ))}
        </div>

        <ul className="mt-3 space-y-1.5">
          {rows.map((f) => {
            const count = period === "month" ? f.lastMonth : f.lastHalfYear;
            const pct = Math.round((count / PORTFOLIO_CUSTOMERS) * 100);
            return (
              <li key={f.label} className="flex items-center gap-2 text-xs">
                <span className="w-20 shrink-0 text-white/90">{f.label}</span>
                <span className="flex-1 h-1.5 rounded-full bg-white/20 overflow-hidden" aria-hidden="true">
                  <span
                    className="block h-full rounded-full bg-white"
                    style={{ width: `${Math.round((count / max) * 100)}%` }}
                  />
                </span>
                <span className="w-32 shrink-0 text-right text-white/90 tabular-nums">
                  {pct}% · {count} kunder
                </span>
              </li>
            );
          })}
        </ul>
        <p className="sr-only">
          Regelverk aktivert {periodLabel} av {PORTFOLIO_CUSTOMERS} kunder:{" "}
          {rows
            .map((f) => {
              const count = period === "month" ? f.lastMonth : f.lastHalfYear;
              return `${f.label}: ${Math.round((count / PORTFOLIO_CUSTOMERS) * 100)} prosent, ${count} kunder`;
            })
            .join(". ")}
          .
        </p>

        <ChevronRight className="absolute top-3 right-3 h-4 w-4 text-white/60 group-hover:text-white transition-colors" />
      </div>
    </Card>
  );
}

function NeedsFollowUpWidget() {
  const navigate = useNavigate();
  const breakdown = [
    { label: "NIS2-aktivering", count: 28, tone: "bg-primary" },
    { label: "ISO 27001-resertifisering", count: 12, tone: "bg-warning" },
    { label: "DORA gap-analyse", count: 9, tone: "bg-destructive" },
  ];
  const total = breakdown.reduce((sum, b) => sum + b.count, 0);
  const max = Math.max(...breakdown.map((b) => b.count));

  return (
    <Card
      onClick={() => navigate("/msp-partner/widget/needs-follow-up")}
      className="p-5 flex flex-col gap-3 cursor-pointer hover:border-warning/40 transition-colors group"
    >
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-warning/10 text-warning flex items-center justify-center shrink-0">
          <Target className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <div className="text-[11px] uppercase tracking-[0.15em] text-muted-foreground font-semibold">Pågående Kampanjer</div>
            <TooltipProvider delayDuration={100}>
              <UITooltip>
                <TooltipTrigger asChild>
                  <HelpCircle
                    className="h-3.5 w-3.5 text-muted-foreground cursor-help"
                    onClick={(e) => e.stopPropagation()}
                  />
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs text-xs">
                  Oversikt over aktive kampanjer per kunde — for eksempel NIS2-aktivering, ISO 27001-resertifisering og DORA gap-analyse. Tallene viser hvor mange kunder som deltar i hver kampanje.
                </TooltipContent>
              </UITooltip>
            </TooltipProvider>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold leading-none tabular-nums">{total}</span>
            <span className="text-xs text-muted-foreground">kunder</span>
          </div>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
      </div>
      <div className="space-y-1.5">
        {breakdown.map((b) => (
          <div key={b.label} className="flex items-center gap-2 text-[12px]">
            <span className="text-muted-foreground flex-1 truncate">{b.label}</span>
            <div className="h-1.5 w-16 rounded-full bg-muted overflow-hidden">
              <div className={`h-full ${b.tone}`} style={{ width: `${(b.count / max) * 100}%` }} />
            </div>
            <span className="tabular-nums font-semibold w-5 text-right">{b.count}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function AvgTrustScoreWidget() {
  const navigate = useNavigate();
  const score = 78;
  const delta = 4;
  const r = 42;
  const c = 2 * Math.PI * r;
  const dash = (score / 100) * c;
  const tone =
    score >= 75 ? "text-success" : score >= 50 ? "text-warning" : "text-destructive";
  const ring =
    score >= 75 ? "stroke-success" : score >= 50 ? "stroke-warning" : "stroke-destructive";

  return (
    <Card
      onClick={() => navigate("/msp-partner/widget/trust-score")}
      className="p-5 flex items-center gap-4 cursor-pointer hover:border-primary/40 transition-colors group relative"
    >
      <div className="relative h-24 w-24 shrink-0">
        <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
          <circle cx="50" cy="50" r={r} className="stroke-muted" strokeWidth="8" fill="none" />
          <circle
            cx="50" cy="50" r={r}
            className={ring}
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${c}`}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className={`text-2xl font-bold leading-none ${tone}`}>{score}</div>
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground mt-0.5">score</div>
        </div>
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <div className="text-[11px] uppercase tracking-[0.15em] text-muted-foreground font-semibold">Trust score</div>
          <TooltipProvider delayDuration={100}>
            <UITooltip>
              <TooltipTrigger asChild>
                <HelpCircle
                  className="h-3.5 w-3.5 text-muted-foreground cursor-help"
                  onClick={(e) => e.stopPropagation()}
                />
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs text-xs">
                Trust Score er en samlet modenhetsvurdering per kunde (0–100) basert på Governance, Operations, Privacy og Third-Party. Snittet viser hvor solid hele porteføljen står samlet.
              </TooltipContent>
            </UITooltip>
          </TooltipProvider>
        </div>
        <div className="text-sm text-foreground mt-0.5">Snitt portefølje</div>
        <div className="text-xs text-muted-foreground mt-1">
          <span className="text-success font-semibold">+{delta}</span> siste 30 dager
        </div>
      </div>
    </Card>
  );
}


const REG_STYLES: Record<LaraSuggestion["regulation"], string> = {
  "NIS2": "bg-primary/10 text-primary border-primary/20",
  "GDPR": "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
  "DORA": "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20",
  "AI Act": "bg-fuchsia-500/10 text-fuchsia-700 dark:text-fuchsia-400 border-fuchsia-500/20",
};

const PRIORITY_STYLES: Record<LaraSuggestion["priority"], string> = {
  "Høy": "bg-destructive/10 text-destructive border-destructive/20",
  "Middels": "bg-warning/10 text-warning border-warning/20",
  "Lav": "bg-muted text-muted-foreground border-border",
};

function LaraSuggestionsTable({ onSelect }: { onSelect: (s: LaraSuggestion) => void }) {
  const [dismissed, setDismissed] = useState(false);
  const [expanded, setExpanded] = useState(false);
  if (dismissed) return null;

  return (
    <Card className="p-5 bg-primary/[0.03] border-primary/20">
      <div className="flex items-start justify-between gap-4">
        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-3 min-w-0 flex-1 text-left"
          aria-expanded={expanded}
        >
          <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <div className="text-base font-semibold text-foreground">Lara-forslag</div>
              <ChevronRight
                className={`h-4 w-4 text-muted-foreground transition-transform ${expanded ? "rotate-90" : ""}`}
              />
            </div>
            <div className="text-xs text-muted-foreground">
              {LARA_SUGGESTIONS.length} anbefalinger klare for gjennomgang
            </div>
          </div>
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="text-muted-foreground hover:text-foreground p-1 -m-1"
          aria-label="Skjul"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {expanded && (
        <div className="overflow-x-auto -mx-5 px-5 mt-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border">
                <th className="text-left font-semibold py-2 pr-4">Regelverk</th>
                <th className="text-left font-semibold py-2 pr-4">Anbefaling</th>
                <th className="text-left font-semibold py-2 pr-4 whitespace-nowrap">Målgruppe</th>
                <th className="text-left font-semibold py-2 pr-4">Forventet effekt</th>
                <th className="text-left font-semibold py-2 pr-4">Prioritet</th>
                <th className="text-right font-semibold py-2">Handling</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {LARA_SUGGESTIONS.map((s) => (
                <tr key={s.id} className="hover:bg-accent/30 transition-colors">
                  <td className="py-3 pr-4 align-top">
                    <Badge variant="outline" className={`text-[11px] font-semibold ${REG_STYLES[s.regulation]}`}>
                      {s.regulation}
                    </Badge>
                  </td>
                  <td className="py-3 pr-4 align-top">
                    <div className="font-semibold text-foreground">{s.title}</div>
                    <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2 max-w-md">
                      {s.summary}
                    </div>
                  </td>
                  <td className="py-3 pr-4 align-top whitespace-nowrap tabular-nums">
                    {s.targetCount} kunder
                  </td>
                  <td className="py-3 pr-4 align-top text-foreground/90">
                    {s.expectedEffect}
                  </td>
                  <td className="py-3 pr-4 align-top">
                    <Badge variant="outline" className={`text-[11px] ${PRIORITY_STYLES[s.priority]}`}>
                      {s.priority}
                    </Badge>
                  </td>
                  <td className="py-3 text-right align-top">
                    <Button size="sm" variant="outline" onClick={() => onSelect(s)} className="gap-1">
                      Sett opp <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}



// Mock target customers for the NIS2 campaign preview
const CAMPAIGN_TARGETS = [
  { name: "Bergen Energi AS", industry: "Energi", risk: "Høy", reason: "NIS2 + ikke aktivert" },
  { name: "Sognefjord Helse AS", industry: "Helse", risk: "Høy", reason: "Særlige kategorier" },
  { name: "Vestland Logistikk", industry: "Transport", risk: "Medium", reason: "Ny CEO + DORA" },
  { name: "Nordic Cargo AS", industry: "Transport", risk: "Medium", reason: "NIS2-eksponert" },
  { name: "Stavanger Logistikk", industry: "Transport", risk: "Medium", reason: "Sky-avhengig" },
  { name: "Kystbygg Entreprenør", industry: "Bygg", risk: "Lav", reason: "200+ ansatte" },
];

type FlowStep = "review" | "audience" | "preview" | "schedule" | "activated";

function LaraSuggestionInline({
  suggestion,
  onClose,
}: {
  suggestion: LaraSuggestion | null;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const [step, setStep] = useState<FlowStep>("review");
  const [excluded, setExcluded] = useState<Set<string>>(new Set());
  const [schedule, setSchedule] = useState<"now" | "tomorrow" | "monday">("now");
  const [showSteps, setShowSteps] = useState(false);

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setStep("review");
      setExcluded(new Set());
      setSchedule("now");
    }, 200);
  };

  if (!suggestion) return null;
  const Icon = suggestion.icon;
  const CtaIcon = suggestion.cta.icon;
  const includedCount = CAMPAIGN_TARGETS.length - excluded.size;

  const toggleExclude = (name: string) => {
    setExcluded((prev) => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  };

  const handleActivate = () => {
    setStep("activated");
    toast({
      title: "Kampanje aktivert",
      description: `Lara kjører «${suggestion.title}» mot ${includedCount} kunder.`,
    });
  };

  const STEPS: { key: FlowStep; label: string }[] = [
    { key: "review", label: "Gjennomgå" },
    { key: "audience", label: "Målgruppe" },
    { key: "preview", label: "E-post" },
    { key: "schedule", label: "Tidsplan" },
    { key: "activated", label: "Aktiv" },
  ];
  const stepIndex = STEPS.findIndex((s) => s.key === step);

  return (
    <Card className="p-5 border-primary/20 bg-primary/[0.03] animate-in fade-in slide-in-from-top-2 duration-200 space-y-4">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <Badge className="mb-2 bg-primary/10 text-primary border-primary/20 hover:bg-primary/10 text-[11px] tracking-wider">
            <Sparkles className="h-3 w-3 mr-1" />
            LARA-FORSLAG
          </Badge>
          <h3 className="text-xl font-semibold text-foreground">{suggestion.title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {suggestion.summary}
          </p>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" onClick={handleClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

        {/* Progress indicator */}
        {step !== "activated" && (
          <div className="flex items-center gap-1 py-2">
            {STEPS.slice(0, 4).map((s, i) => (
              <div key={s.key} className="flex-1 flex items-center gap-1">
                <div className="flex-1">
                  <div
                    className={
                      "h-1 rounded-full transition-colors " +
                      (i <= stepIndex ? "bg-primary" : "bg-muted")
                    }
                  />
                  <div
                    className={
                      "text-[11px] mt-1 font-semibold tracking-wider " +
                      (i <= stepIndex ? "text-primary" : "text-muted-foreground")
                    }
                  >
                    {i + 1}. {s.label.toUpperCase()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* STEP 1: Review */}
        {step === "review" && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-lg bg-muted/50 border border-border">
                <div className="text-[11px] tracking-wider text-muted-foreground font-semibold">REKKEVIDDE</div>
                <div className="text-sm font-semibold text-foreground mt-1">{suggestion.impact.reach}</div>
              </div>
              <div className="p-3 rounded-lg bg-muted/50 border border-border">
                <div className="text-[11px] tracking-wider text-muted-foreground font-semibold">FORVENTET</div>
                <div className="text-sm font-semibold text-foreground mt-1">{suggestion.impact.expectedClaims}</div>
              </div>
            </div>

            <div>
              <button
                type="button"
                onClick={() => setShowSteps((v) => !v)}
                className="w-full flex items-center justify-between gap-2 text-left py-2 group"
              >
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <h4 className="text-sm font-semibold text-foreground">Slik utfører Lara dette</h4>
                  <Badge variant="outline" className="text-[11px]">{suggestion.steps.length} steg</Badge>
                </div>
                <ChevronDown
                  className={`h-4 w-4 text-muted-foreground transition-transform ${showSteps ? "rotate-180" : ""}`}
                />
              </button>
              {showSteps && (
                <ol className="space-y-2 mt-2">
                  {suggestion.steps.map((s, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm">
                      <span className="flex-shrink-0 h-5 w-5 rounded-full bg-primary/10 text-primary text-xs font-semibold inline-flex items-center justify-center mt-0.5">
                        {i + 1}
                      </span>
                      <span className="text-foreground/90">{s}</span>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </div>
        )}

        {/* STEP 2: Audience */}
        {step === "audience" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-foreground">
                Lara har valgt {CAMPAIGN_TARGETS.length} kunder
              </h4>
              <Badge variant="outline" className="text-xs">
                {includedCount} inkludert · {excluded.size} ekskludert
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Klikk på en kunde for å ekskludere fra kampanjen. Lara har rangert etter risiko og signalstyrke.
            </p>
            <div className="border border-border rounded-lg divide-y divide-border max-h-[280px] overflow-y-auto">
              {CAMPAIGN_TARGETS.map((c) => {
                const isExcluded = excluded.has(c.name);
                return (
                  <button
                    key={c.name}
                    onClick={() => toggleExclude(c.name)}
                    className={
                      "w-full flex items-center gap-3 p-3 text-left transition-colors " +
                      (isExcluded ? "bg-muted/40 opacity-60" : "hover:bg-accent/40")
                    }
                  >
                    <div
                      className={
                        "h-5 w-5 rounded border-2 flex items-center justify-center flex-shrink-0 " +
                        (isExcluded
                          ? "border-muted-foreground bg-transparent"
                          : "border-primary bg-primary")
                      }
                    >
                      {!isExcluded && <CheckCircle2 className="h-3 w-3 text-primary-foreground" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={"text-sm font-semibold truncate " + (isExcluded ? "line-through text-muted-foreground" : "text-foreground")}>
                        {c.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {c.industry} · {c.reason}
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={
                        "text-[11px] " +
                        (c.risk === "Høy"
                          ? "border-destructive/40 text-destructive"
                          : c.risk === "Medium"
                          ? "border-status-followup/40 text-status-followup"
                          : "border-border text-muted-foreground")
                      }
                    >
                      {c.risk}
                    </Badge>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 3: Email Preview */}
        {step === "preview" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-foreground">Forhåndsvis e-posten</h4>
              <Badge variant="outline" className="text-[11px] gap-1">
                <Sparkles className="h-3 w-3 text-primary" />
                Generert av Lara
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Tydelig pristilbud og verdiforslag — kunden forstår hva som er gratis, hva som koster, og hva de får.
              Eksempel for Bergen Energi AS:
            </p>
            <div className="border border-border rounded-lg overflow-hidden bg-card">
              <div className="bg-muted/40 px-4 py-2.5 border-b border-border space-y-1">
                <div className="text-xs">
                  <span className="text-muted-foreground">Fra:</span>{" "}
                  <span className="text-foreground font-medium">Beate Solberg · Mynder Partner</span>
                </div>
                <div className="text-xs">
                  <span className="text-muted-foreground">Til:</span>{" "}
                  <span className="text-foreground font-medium">erik@bergenenergi.no</span>
                </div>
                <div className="text-xs">
                  <span className="text-muted-foreground">Emne:</span>{" "}
                  <span className="text-foreground font-medium">
                    Bergen Energi omfattes av NIS2 — slik kommer dere i gang (gratis kartlegging)
                  </span>
                </div>
              </div>
              <div className="p-4 text-sm text-foreground/90 leading-relaxed space-y-3">
                <p>Hei Erik,</p>
                <p>
                  Bergen Energi AS er omfattet av <strong>NIS2-direktivet</strong> (Energi, 51–200 ansatte).
                  Direktivet ble en del av norsk lov i 2025 og krever bl.a. risikostyring,
                  hendelseshåndtering og dokumentert sikkerhetsstyring — med personlig ansvar for ledelsen.
                </p>

                <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 space-y-1">
                  <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 tracking-wider">
                    GRATIS — INGEN BINDING
                  </div>
                  <p className="text-sm">
                    <strong>Trust Profile + NIS2 selv-vurdering.</strong> Dere får oversikt over hvor
                    dere står i dag og hvilke krav som gjelder for nettopp deres virksomhet.
                  </p>
                </div>

                <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-semibold text-primary tracking-wider">
                      NIS2-MODUL — 2 490 KR / MND
                    </div>
                    <Badge className="bg-primary text-primary-foreground text-[11px] hover:bg-primary">
                      ANBEFALT
                    </Badge>
                  </div>
                  <p className="text-sm">Aktivering inkluderer:</p>
                  <ul className="text-sm space-y-1 ml-4 list-disc">
                    <li><strong>Full gap-analyse</strong> mot alle NIS2-krav (24 kontrollområder)</li>
                    <li>Konkret tiltaksplan med prioritering og tidslinje</li>
                    <li>Hendelsesrapportering til myndighetene (24-timers frist)</li>
                    <li>Løpende overvåking av leverandørkjede og endringer</li>
                    <li>Dokumentasjon klar for tilsyn og styrebehandling</li>
                  </ul>
                </div>

                <p>
                  Vil du se hva som gjelder for Bergen Energi? Det tar 2 minutter og koster ingenting.
                </p>
                <p>
                  <span className="inline-block bg-primary text-primary-foreground rounded-md px-3 py-1.5 text-sm font-semibold">
                    → Start gratis NIS2-kartlegging
                  </span>
                </p>

                <p className="text-xs text-muted-foreground border-t border-border pt-3">
                  Mvh,<br />
                  Beate Solberg · Mynder Partner<br />
                  Sertifisert NIS2-rådgiver · 90 12 34 56
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/40 rounded-lg p-3 border border-border">
              <Sparkles className="h-3.5 w-3.5 text-primary flex-shrink-0 mt-0.5" />
              <span>
                Lara tilpasser bransje, eksempler og kontaktperson per kunde.
                Konverteringsrate: <strong className="text-foreground">~14 %</strong> velger NIS2-modulen
                etter gratis kartlegging.
              </span>
            </div>
          </div>
        )}

        {/* STEP 4: Schedule */}
        {step === "schedule" && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground">Når skal kampanjen starte?</h4>
            <div className="space-y-2">
              {[
                { key: "now" as const, label: "Send nå", sub: "Første e-post går ut innen 5 min" },
                { key: "tomorrow" as const, label: "I morgen kl. 09:00", sub: "Best åpningsrate ifølge Lara" },
                { key: "monday" as const, label: "Mandag kl. 08:30", sub: "Anbefalt for B2B-segmentet" },
              ].map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setSchedule(opt.key)}
                  className={
                    "w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-colors " +
                    (schedule === opt.key
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-accent/40")
                  }
                >
                  <div
                    className={
                      "h-4 w-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 " +
                      (schedule === opt.key ? "border-primary" : "border-muted-foreground")
                    }
                  >
                    {schedule === opt.key && <div className="h-2 w-2 rounded-full bg-primary" />}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-foreground">{opt.label}</div>
                    <div className="text-xs text-muted-foreground">{opt.sub}</div>
                  </div>
                  {opt.key === "tomorrow" && (
                    <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/10 text-[11px]">
                      ANBEFALT
                    </Badge>
                  )}
                </button>
              ))}
            </div>
            <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/40 rounded-lg p-3 border border-border">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <span>
                Du kan pause eller stoppe kampanjen når som helst fra dashbordet. Lara sender automatisk
                oppfølging etter 3 dager til de som ikke åpner.
              </span>
            </div>
          </div>
        )}

        {/* STEP 5: Activated */}
        {step === "activated" && (
          <div className="space-y-4 py-2">
            <div className="flex flex-col items-center text-center py-4">
              <div className="h-16 w-16 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-3">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Kampanje aktivert</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-md">
                Lara kjører «{suggestion.title}» mot {includedCount} kunder.
                Du får statusrapport i innboksen daglig.
              </p>
            </div>

            <div className="border border-border rounded-lg p-4 space-y-3 bg-muted/20">
              <div className="text-[11px] tracking-wider text-muted-foreground font-semibold">
                LARAS NESTE STEG
              </div>
              {[
                { time: "Nå", text: `${schedule === "now" ? "Sender" : "Planlegger"} ${includedCount} personaliserte e-poster`, done: schedule === "now" },
                { time: "+3 dager", text: "Automatisk oppfølging til ikke-åpnere" },
                { time: "Løpende", text: "Booker intro-møte ved klikk på «Vis min profil»" },
                { time: "Daglig", text: "Statusrapport i din innboks 07:00" },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div
                    className={
                      "h-5 w-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 " +
                      (item.done ? "bg-emerald-500/10 text-emerald-600" : "bg-primary/10 text-primary")
                    }
                  >
                    {item.done ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                  </div>
                  <div className="flex-1 text-sm">
                    <span className="text-foreground/90">{item.text}</span>
                    <span className="text-xs text-muted-foreground ml-2">· {item.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      <div className="flex flex-wrap justify-end gap-2 pt-3 border-t border-border/40">
        {step === "review" && (
          <>
            <Button variant="outline" onClick={handleClose}>
              Avbryt
            </Button>
            <Button onClick={() => setStep("audience")} className="gap-2">
              Sett opp kampanje
              <ChevronRight className="h-4 w-4" />
            </Button>
          </>
        )}
        {step === "audience" && (
          <>
            <Button variant="outline" onClick={() => setStep("review")}>
              Tilbake
            </Button>
            <Button
              onClick={() => setStep("preview")}
              disabled={includedCount === 0}
              className="gap-2"
            >
              Se e-post ({includedCount}) <ChevronRight className="h-4 w-4" />
            </Button>
          </>
        )}
        {step === "preview" && (
          <>
            <Button variant="outline" onClick={() => setStep("audience")}>
              Tilbake
            </Button>
            <Button onClick={() => setStep("schedule")} className="gap-2">
              Velg tidspunkt <ChevronRight className="h-4 w-4" />
            </Button>
          </>
        )}
        {step === "schedule" && (
          <>
            <Button variant="outline" onClick={() => setStep("preview")}>
              Tilbake
            </Button>
            <Button onClick={handleActivate} className="gap-2">
              <CtaIcon className="h-4 w-4" />
              Aktiver kampanje
            </Button>
          </>
        )}
        {step === "activated" && (
          <Button onClick={handleClose} className="w-full sm:w-auto">
            Ferdig
          </Button>
        )}
      </div>
    </Card>

  );
}

function ClaimDevelopmentChart() {
  const navigate = useNavigate();
  const data = SERVICE_POTENTIAL_TREND;
  const last = data[data.length - 1];
  const prev = data[data.length - 2];
  const growth = prev ? Math.round(((last.value - prev.value) / prev.value) * 100) : 0;
  const totalPotential = last.value;
  const openGaps = 312;
  const customerCount = 24;
  const frameworkCount = 6;

  return (
    <Card onClick={() => navigate("/msp-partner/widget/claim-development")} className="p-5 cursor-pointer hover:border-primary/40 transition-colors">
      <div className="flex items-start justify-between mb-1">
        <div>
          <div className="flex items-center gap-1.5">
            <h3 className="text-base font-semibold text-foreground">Salgspotensial fra gap-analyser</h3>
            <UITooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-[280px]">
                <p className="text-xs">
                  Estimert tjenestesalg partner kan levere for å lukke gap i kundenes aktiverte regelverk.
                  Basert på antall åpne krav × snittpris per tjeneste, i partnerens standardvaluta.
                </p>
              </TooltipContent>
            </UITooltip>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Basert på åpne krav i utvalgte regelverk hos {customerCount} kunder
          </p>
        </div>
        <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs gap-1 hover:bg-emerald-500/10">
          <TrendingUp className="h-3 w-3" />
          +{growth}%
        </Badge>
      </div>

      <div className="h-[180px] mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="claimGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.25} />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            />
            <YAxis hide domain={[0, "dataMax"]} />
            <Tooltip
              contentStyle={{
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: 8,
                fontSize: 12,
              }}
              formatter={(value: number) => [formatPartnerCurrency(value), "Potensial"]}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="hsl(var(--primary))"
              strokeWidth={2.5}
              fill="url(#claimGradient)"
              dot={{ r: 4, stroke: "hsl(var(--primary))", strokeWidth: 2, fill: "hsl(var(--card))" }}
              activeDot={{ r: 6 }}
            />
            <ReferenceDot
              x={last.month}
              y={last.value}
              r={6}
              fill="hsl(var(--primary))"
              stroke="hsl(var(--card))"
              strokeWidth={2}
              label={{
                value: formatPartnerCurrency(last.value),
                position: "right",
                fill: "hsl(var(--primary))",
                fontSize: 12,
                fontWeight: 700,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border">
        <div>
          <div className="text-2xl font-bold text-foreground tabular-nums">{customerCount}</div>
          <div className="text-xs text-muted-foreground">kunder · {frameworkCount} regelverk</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-foreground tabular-nums">{openGaps}</div>
          <div className="text-xs text-muted-foreground">åpne gap</div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-primary tabular-nums">{formatPartnerCurrency(totalPotential)}</div>
          <div className="text-xs text-muted-foreground">potensielt salg</div>
        </div>
      </div>
    </Card>
  );
}


function PortfolioSegmentation() {
  const navigate = useNavigate();
  return (
    <Card onClick={() => navigate("/msp-partner/widget/segmentation")} className="p-5 cursor-pointer hover:border-primary/40 transition-colors">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-1.5">
          <h3 className="text-base font-semibold text-foreground">Portefølje-segmentering</h3>
          <TooltipProvider delayDuration={150}>
            <UITooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={(e) => e.stopPropagation()}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Hva viser denne widgeten?"
                >
                  <HelpCircle className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs text-xs leading-relaxed">
                Porteføljen din gruppert etter hovedkategori. Hver søyle viser hvor mange kunder
                som tilhører segmentet. Klikk widgeten for å se detaljer.
              </TooltipContent>
            </UITooltip>
          </TooltipProvider>
        </div>
        <span className="text-xs text-muted-foreground">Lara · oppdatert i går</span>
      </div>
      <div className="space-y-3">
        {SEGMENTS.map((s) => (
          <div key={s.label} className="flex items-center gap-3">
            <div className="w-36 text-sm text-foreground">{s.label}</div>
            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={"h-full rounded-full " + s.color}
                style={{ width: `${s.widthPct}%` }}
              />
            </div>
            <div className="w-10 text-right text-sm font-semibold text-foreground">{s.count}</div>
          </div>
        ))}
      </div>
    </Card>
  );
}

const TOP_SERVICES = [
  { label: "GDPR / Personvern", count: 142, color: "bg-primary" },
  { label: "ISO 27001-forberedelse", count: 118, color: "bg-purple-500" },
  { label: "Risikovurdering leverandører", count: 96, color: "bg-fuchsia-500" },
  { label: "DPA / Databehandleravtaler", count: 81, color: "bg-violet-400" },
  { label: "Sikkerhetsopplæring", count: 64, color: "bg-indigo-400" },
  { label: "Incident response-plan", count: 47, color: "bg-pink-400" },
];

function TopServicesWidget() {
  const navigate = useNavigate();
  const max = Math.max(...TOP_SERVICES.map((s) => s.count));
  return (
    <Card
      onClick={() => navigate("/msp-partner/widget/top-services")}
      className="p-5 cursor-pointer hover:border-primary/40 transition-colors"
    >
      <div className="flex items-start justify-between mb-1 gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <h3 className="text-base font-semibold text-foreground">Tjenester kundene trenger mest hjelp med</h3>
            <TooltipProvider delayDuration={150}>
              <UITooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={(e) => e.stopPropagation()}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Hva viser denne widgeten?"
                  >
                    <HelpCircle className="h-3.5 w-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs text-xs leading-relaxed">
                  Antall kunder i porteføljen din som har åpne aktiviteter, forespørsler eller gap
                  innenfor hvert tjenesteområde. Kilde: kundenes Trust Profile og Lara-signaler.
                  Bruk listen til å pakketere og selge rådgivning.
                </TooltipContent>
              </UITooltip>
            </TooltipProvider>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">Etterspørsel per regelverk — siste 30 dager</p>
        </div>
      </div>

      <div className="flex items-center gap-3 mt-4 mb-2 text-[10px] uppercase tracking-wide text-muted-foreground">
        <div className="w-56">Tjeneste</div>
        <div className="flex-1" />
        <div className="w-12 text-right">Kunder</div>
      </div>

      <div className="space-y-2.5">
        {TOP_SERVICES.map((s) => (
          <div key={s.label} className="flex items-center gap-3">
            <div className="w-56 text-sm text-foreground truncate">{s.label}</div>
            <div className="flex-1 h-2.5 bg-muted rounded-full overflow-hidden">
              <div className={"h-full rounded-full " + s.color} style={{ width: `${(s.count / max) * 100}%` }} />
            </div>
            <div className="w-12 text-right text-sm font-semibold tabular-nums">{s.count}</div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-end">
        <span className="text-xs font-medium text-primary flex items-center gap-1">
          Se detaljer og handlinger <ChevronRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </Card>
  );
}

function LiveSignals() {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-foreground">Live signaler</h3>
        <span className="text-xs text-muted-foreground">06:42</span>
      </div>
      <div className="space-y-2">
        {LIVE_SIGNALS.map((sig, i) => (
          <div
            key={i}
            className="flex items-start gap-3 px-3 py-2 rounded-lg hover:bg-accent/40 transition-colors cursor-pointer"
          >
            <span className={"w-1 self-stretch rounded-full " + sig.accent} />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-foreground truncate">{sig.name}</div>
              <div className="text-xs text-muted-foreground">{sig.note}</div>
            </div>
            <span className="text-xs text-muted-foreground whitespace-nowrap">{sig.time}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}



export default function MSPPartnerDashboard() {
  const navigate = useNavigate();
  const { mode } = useWorkspaceMode();
  const [activeSuggestion, setActiveSuggestion] = useState<LaraSuggestion | null>(null);

  // Partner-dashbordet skal kun vises i Partner-modus. I "Min virksomhet"
  // sendes brukeren tilbake til hoveddashbordet for å unngå at partner-
  // navigasjon (ROI-kalkulator, Salgsguide osv.) blir synlig.
  if (mode === "compliance") {
    return <Navigate to="/" replace />;
  }


  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto pt-11">
        <div className="container max-w-7xl mx-auto py-8 px-4 md:px-8 space-y-5">
          <PartnerHeader />
          {!activeSuggestion && <LaraSuggestionsTable onSelect={setActiveSuggestion} />}
          {activeSuggestion && (
            <LaraSuggestionInline
              suggestion={activeSuggestion}
              onClose={() => setActiveSuggestion(null)}
            />
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <ClaimRateWidget />
            <NeedsFollowUpWidget />            
            <AvgTrustScoreWidget />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <OpportunityWidget />
            <PortfolioSegmentation />
          </div>

          <TopServicesWidget />

          <div className="flex justify-end">
            <Button variant="outline" onClick={() => navigate("/msp-dashboard")}>
              Gå til kundeoversikt
            </Button>
          </div>
        </div>
      </main>

    </div>
  );
}
