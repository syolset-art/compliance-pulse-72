import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
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
import { ActivityLogWidget } from "@/components/msp/ActivityLogWidget";
import { LaraWorkQueueWidget } from "@/components/msp/LaraWorkQueueWidget";
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
  { key: "portfolio", label: "PORTEFØLJE", labelEn: "PORTFOLIO", value: "400", sub: "kunder", subEn: "customers", tone: "default" as const },
  { key: "claim", label: "GODKJENT AV KUNDE", labelEn: "APPROVED BY CUSTOMER", value: "12%", sub: "47 av 400 kunder har godkjent regelverkstilbud", subEn: "47 of 400 customers have approved regulation offer", tone: "primary" as const, delta: "+2", progress: 30 },
  { key: "signals", label: "SALGSSIGNALER", labelEn: "SALES SIGNALS", value: "23", sub: "aktive nå", subEn: "active now", tone: "warning" as const },
  { key: "won", label: "VUNNET I MND", labelEn: "WON THIS MONTH", value: "340k", sub: "12 oppdrag", subEn: "12 assignments", tone: "success" as const },
];

type LaraSuggestion = {
  id: number;
  dot: string;
  text: string;
  textEn: string;
  icon: typeof Target;
  title: string;
  titleEn: string;
  summary: string;
  summaryEn: string;
  impact: { reach: string; expectedClaims: string; revenue: string };
  impactEn: { reach: string; expectedClaims: string; revenue: string };
  steps: string[];
  stepsEn: string[];
  cta: { primary: string; secondary: string; icon: typeof Mail };
  ctaEn: { primary: string; secondary: string; icon: typeof Mail };
  regulation: "NIS2" | "GDPR" | "DORA" | "AI Act";
  targetCount: number;
  expectedEffect: string;
  expectedEffectEn: string;
  priority: "Høy" | "Middels" | "Lav";
  priorityEn: "High" | "Medium" | "Low";
};

const LARA_SUGGESTIONS: LaraSuggestion[] = [
  {
    id: 1,
    dot: "bg-status-followup",
    text: "Kjør NIS2-aktiveringskampanje mot 28 kunder",
    textEn: "Run NIS2 activation campaign for 28 customers",
    icon: Target,
    title: "NIS2-aktiveringskampanje",
    titleEn: "NIS2 activation campaign",
    summary: "28 kunder i porteføljen er NIS2-eksponert, men har ennå ikke aktivert sin Trust Profile. Lara har klargjort en målrettet kampanje.",
    summaryEn: "28 customers in the portfolio are NIS2-exposed but have not yet activated their Trust Profile. Lara has prepared a targeted campaign.",
    impact: { reach: "28 kunder", expectedClaims: "9–12 nye aktiveringer", revenue: "~210 000 kr ARR" },
    impactEn: { reach: "28 customers", expectedClaims: "9–12 new activations", revenue: "~NOK 210,000 ARR" },
    steps: [
      "Send personalisert e-post med NIS2-eksponering og frister",
      "Automatisk oppfølging etter 3 dager til de som ikke åpnet",
      "Lara booker intro-møte for de som klikker «Vis min profil»",
      "Du får daglig statusrapport i innboksen",
    ],
    stepsEn: [
      "Send personalized email with NIS2 exposure and deadlines",
      "Automatic follow-up after 3 days to those who did not open",
      "Lara books an intro meeting for those who click \"View my profile\"",
      "You get a daily status report in your inbox",
    ],
    cta: { primary: "Start kampanje nå", secondary: "Tilpass mal", icon: Mail },
    ctaEn: { primary: "Start campaign now", secondary: "Customize template", icon: Mail },
    regulation: "NIS2",
    targetCount: 28,
    expectedEffect: "9–12 nye aktiveringer",
    expectedEffectEn: "9–12 new activations",
    priority: "Høy",
    priorityEn: "High",
  },
  {
    id: 2,
    dot: "bg-primary",
    text: "GDPR årlig oppfriskning mot 46 kunder",
    textEn: "GDPR annual refresh for 46 customers",
    icon: Mail,
    title: "GDPR årlig oppfriskning",
    titleEn: "GDPR annual refresh",
    summary: "46 kunder har databehandleravtaler og ROPA-oppføringer som ikke er gjennomgått de siste 12 månedene. Lara har klargjort en fornyelseskampanje.",
    summaryEn: "46 customers have data processing agreements and ROPA entries that have not been reviewed in the last 12 months. Lara has prepared a renewal campaign.",
    impact: { reach: "46 kunder", expectedClaims: "30+ fornyelser", revenue: "~180 000 kr ARR" },
    impactEn: { reach: "46 customers", expectedClaims: "30+ renewals", revenue: "~NOK 180,000 ARR" },
    steps: [
      "Send påminnelse om årlig GDPR-gjennomgang",
      "Automatisk sjekk av DPA-status og ROPA-oppdateringer",
      "Lara foreslår oppdaterte tekster per kunde",
      "Fornyelsesrapport til deg ukentlig",
    ],
    stepsEn: [
      "Send reminder about annual GDPR review",
      "Automatic check of DPA status and ROPA updates",
      "Lara suggests updated text per customer",
      "Weekly renewal report to you",
    ],
    cta: { primary: "Start kampanje", secondary: "Tilpass mal", icon: Mail },
    ctaEn: { primary: "Start campaign", secondary: "Customize template", icon: Mail },
    regulation: "GDPR",
    targetCount: 46,
    expectedEffect: "30+ fornyelser",
    expectedEffectEn: "30+ renewals",
    priority: "Middels",
    priorityEn: "Medium",
  },
  {
    id: 3,
    dot: "bg-status-followup",
    text: "DORA-beredskapssjekk mot 12 finanskunder",
    textEn: "DORA readiness check for 12 finance customers",
    icon: Target,
    title: "DORA-beredskapssjekk",
    titleEn: "DORA readiness check",
    summary: "12 kunder i finanssektoren omfattes av DORA, men mangler dokumentert IKT-risikovurdering. Lara kan starte en beredskapssjekk.",
    summaryEn: "12 customers in the financial sector are covered by DORA but lack a documented ICT risk assessment. Lara can start a readiness check.",
    impact: { reach: "12 kunder", expectedClaims: "8 risikovurderinger", revenue: "~140 000 kr ARR" },
    impactEn: { reach: "12 customers", expectedClaims: "8 risk assessments", revenue: "~NOK 140,000 ARR" },
    steps: [
      "Send DORA-eksponeringsanalyse til hver kunde",
      "Lara henter data fra Trust Profile og kartlegger gap",
      "Foreslå prioriterte tiltak per kunde",
      "Ukentlig statusrapport til deg",
    ],
    stepsEn: [
      "Send DORA exposure analysis to each customer",
      "Lara retrieves data from Trust Profile and maps gaps",
      "Suggest prioritized actions per customer",
      "Weekly status report to you",
    ],
    cta: { primary: "Start kampanje", secondary: "Tilpass mal", icon: Mail },
    ctaEn: { primary: "Start campaign", secondary: "Customize template", icon: Mail },
    regulation: "DORA",
    targetCount: 12,
    expectedEffect: "8 risikovurderinger",
    expectedEffectEn: "8 risk assessments",
    priority: "Høy",
    priorityEn: "High",
  },
  {
    id: 4,
    dot: "bg-primary",
    text: "AI Act-kartlegging mot 19 kunder med AI-systemer",
    textEn: "AI Act mapping for 19 customers with AI systems",
    icon: Users,
    title: "AI Act-kartlegging",
    titleEn: "AI Act mapping",
    summary: "19 kunder har registrert AI-systemer, men mangler ROPA-oppføring og risikoklassifisering iht. AI Act. Lara kan kartlegge og opprette utkast.",
    summaryEn: "19 customers have registered AI systems but lack a ROPA entry and risk classification per the AI Act. Lara can map these and create drafts.",
    impact: { reach: "19 kunder", expectedClaims: "15 nye ROPA-oppføringer", revenue: "~95 000 kr ARR" },
    impactEn: { reach: "19 customers", expectedClaims: "15 new ROPA entries", revenue: "~NOK 95,000 ARR" },
    steps: [
      "Lara identifiserer AI-systemer i kundens portefølje",
      "Klassifiserer risikonivå iht. AI Act",
      "Genererer ROPA-utkast per system",
      "Rådgiver godkjenner før publisering",
    ],
    stepsEn: [
      "Lara identifies AI systems in the customer's portfolio",
      "Classifies risk level per the AI Act",
      "Generates a ROPA draft per system",
      "Advisor approves before publishing",
    ],
    cta: { primary: "Start kampanje", secondary: "Tilpass mal", icon: Mail },
    ctaEn: { primary: "Start campaign", secondary: "Customize template", icon: Mail },
    regulation: "AI Act",
    targetCount: 19,
    expectedEffect: "15 nye ROPA-oppføringer",
    expectedEffectEn: "15 new ROPA entries",
    priority: "Middels",
    priorityEn: "Medium",
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


const SEGMENTS_BY_INDUSTRY = [
  { label: "Industri & produksjon", labelEn: "Industry & manufacturing", count: 98, color: "bg-primary", widthPct: 53, activatedPct: 41 },
  { label: "Helse & biotek", labelEn: "Health & biotech", count: 74, color: "bg-recommend", widthPct: 40, activatedPct: 48 },
  { label: "Energi & utilities", labelEn: "Energy & utilities", count: 61, color: "bg-success", widthPct: 33, activatedPct: 55 },
  { label: "Finans & forsikring", labelEn: "Finance & insurance", count: 55, color: "bg-warning", widthPct: 30, activatedPct: 39 },
  { label: "Transport & logistikk", labelEn: "Transport & logistics", count: 42, color: "bg-destructive", widthPct: 23, activatedPct: 35 },
  { label: "Offentlig & samfunn", labelEn: "Public sector & society", count: 36, color: "bg-muted", widthPct: 20, activatedPct: 62 },
  { label: "Teknologi & SaaS", labelEn: "Technology & SaaS", count: 34, color: "bg-primary/70", widthPct: 18, activatedPct: 58 },
];

const SEGMENTS_BY_FRAMEWORK = [
  { label: "NIS2-eksponert", labelEn: "NIS2-exposed", count: 71, color: "bg-primary", widthPct: 35, activatedPct: 38 },
  { label: "Sky-avhengig", labelEn: "Cloud-dependent", count: 186, color: "bg-recommend", widthPct: 92, activatedPct: 54 },
  { label: "Særlige kategorier", labelEn: "Special categories", count: 128, color: "bg-success", widthPct: 64, activatedPct: 61 },
  { label: "DORA-finans", labelEn: "DORA finance", count: 42, color: "bg-warning", widthPct: 21, activatedPct: 29 },
  { label: "ISO 27001", labelEn: "ISO 27001", count: 23, color: "bg-destructive", widthPct: 12, activatedPct: 48 },
];

const LIVE_SIGNALS = [
  { time: "2t", timeEn: "2h", name: "Bergen Maskin AS", note: "ISO 27001 utløpt", noteEn: "ISO 27001 expired", accent: "bg-destructive" },
  { time: "04:15", timeEn: "04:15", name: "Sognefjord Helse AS", note: "Datatilsyn-sak åpnet", noteEn: "Data protection authority case opened", accent: "bg-status-followup" },
  { time: "i går", timeEn: "yesterday", name: "Vestland Logistikk", note: "Ny CEO i Brreg", noteEn: "New CEO in the register", accent: "bg-primary" },
  { time: "i går", timeEn: "yesterday", name: "Nordic Cargo AS", note: "Kunde har aktivert profilen", noteEn: "Customer has activated the profile", accent: "bg-emerald-500" },
];

// ---------- Components ----------

function PartnerHeader() {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb" || i18n.language === "no";
  const periods = isNb ? ["I dag", "Uke", "Måned"] : ["Today", "Week", "Month"];
  return (
    <div className="flex items-start justify-between">
      <div>
        <h1 className="text-3xl font-bold text-foreground">{isNb ? "Hei, Beate" : "Hi, Beate"}</h1>
        <p className="text-muted-foreground mt-1">
          {isNb ? "Her er din daglig oppdatering" : "Here's your daily update"}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <div className="inline-flex rounded-lg border border-border bg-card p-1 text-sm">
          {periods.map((p, i) => (
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
          aria-label={isNb ? "Innstillinger" : "Settings"}
          title={isNb ? "Innstillinger" : "Settings"}
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
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb" || i18n.language === "no";
  const ALL_LABEL = isNb ? "Alle" : "All";
  const [period, setPeriod] = useState<"month" | "halfYear">("month");
  const [framework, setFramework] = useState<string>("Alle");

  const rows = FRAMEWORK_ACTIVATIONS.filter(
    (f) => framework === "Alle" || f.label === framework,
  );
  const total = rows.reduce(
    (sum, f) => sum + (period === "month" ? f.lastMonth : f.lastHalfYear),
    0,
  );
  const periodLabel = isNb
    ? (period === "month" ? "siste måned" : "siste halvår")
    : (period === "month" ? "last month" : "last half year");
  const max = Math.max(...FRAMEWORK_ACTIVATIONS.map((f) => f.activeCustomers), 1);
  const pctOf = (n: number) => Math.round((n / PORTFOLIO_CUSTOMERS) * 100);
  const leader = [...FRAMEWORK_ACTIVATIONS].sort(
    (a, b) => b.activeCustomers - a.activeCustomers,
  )[0];
  const headline = framework === "Alle" ? leader : rows[0] ?? leader;

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
            {isNb ? "Regelverk aktivert" : "Regulations activated"}
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
                {isNb
                  ? `Viser hvor mange av de ${PORTFOLIO_CUSTOMERS} kundene dine som har aktivert regelverk siste måned og siste halvår. Filtrer på regelverk for å se andelen per regelverk.`
                  : `Shows how many of your ${PORTFOLIO_CUSTOMERS} customers have activated regulations in the last month and last half year. Filter by regulation to see the share per regulation.`}
              </p>
            </TooltipContent>
          </UITooltip>
        </div>

        <div
          className="mt-3 inline-flex rounded-lg bg-white/15 p-0.5 text-xs"
          role="group"
          aria-label={isNb ? "Velg periode" : "Select period"}
          onClick={(e) => e.stopPropagation()}
        >
          {([
            ["month", isNb ? "Siste måned" : "Last month"],
            ["halfYear", isNb ? "Siste halvår" : "Last half year"],
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

        <div className="mt-3">
          <div className="text-5xl font-bold leading-none tabular-nums">
            {pctOf(headline.activeCustomers)} %
          </div>
          <p className="mt-1 text-sm text-white/85">
            {isNb
              ? `av ${PORTFOLIO_CUSTOMERS} kunder har aktivert ${headline.label}`
              : `of ${PORTFOLIO_CUSTOMERS} customers have activated ${headline.label}`}
          </p>
        </div>

        <div
          className="mt-3 flex flex-wrap gap-1.5"
          role="group"
          aria-label={isNb ? "Filtrer på regelverk" : "Filter by regulation"}
          onClick={(e) => e.stopPropagation()}
        >
          {[ALL_LABEL, ...FRAMEWORK_ACTIVATIONS.map((f) => f.label)].map((label) => (
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
          {rows.map((f) => (
            <li key={f.label} className="flex items-center gap-2 text-xs">
              <span className="w-20 shrink-0 text-white/90">{f.label}</span>
              <span className="flex-1 h-1.5 rounded-full bg-white/20 overflow-hidden" aria-hidden="true">
                <span
                  className="block h-full rounded-full bg-white"
                  style={{ width: `${Math.round((f.activeCustomers / max) * 100)}%` }}
                />
              </span>
              <span className="w-32 shrink-0 text-right text-white/90 tabular-nums">
                {pctOf(f.activeCustomers)}% · {f.activeCustomers} {isNb ? "kunder" : "customers"}
              </span>
            </li>
          ))}
        </ul>

        <p className="mt-2 text-xs text-white/75 tabular-nums">
          +{total} {isNb ? "nye aktiveringer" : "new activations"} {periodLabel}
        </p>

        <p className="sr-only">
          {isNb
            ? `Andel av ${PORTFOLIO_CUSTOMERS} kunder som har aktivert regelverk: `
            : `Share of ${PORTFOLIO_CUSTOMERS} customers who have activated regulations: `}
          {rows
            .map((f) => isNb
              ? `${f.label}: ${pctOf(f.activeCustomers)} prosent, ${f.activeCustomers} kunder`
              : `${f.label}: ${pctOf(f.activeCustomers)} percent, ${f.activeCustomers} customers`)
            .join(". ")}
          . {total} {isNb ? "nye aktiveringer" : "new activations"} {periodLabel}.
        </p>


        <ChevronRight className="absolute top-3 right-3 h-4 w-4 text-white/60 group-hover:text-white transition-colors" />
      </div>
    </Card>
  );
}

// V2 — IKKE IMPLEMENTER NÅ: "Trust score"-widget med porteføljefordeling er planlagt i v2.
// Behold widgeten i prototype for å vise fremtidig partner-dashboard, men merk den tydelig som V2.
function AvgTrustScoreWidget() {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb" || i18n.language === "no";
  const score = 78;
  const delta = 4;
  const totalCustomers = 300;

  const distribution = [
    { label: "≥ 75 %", count: 186, band: isNb ? "Høy" : "High", color: "bg-success" as const },
    { label: "50–74 %", count: 84, band: isNb ? "Middels" : "Medium", color: "bg-warning" as const },
    { label: "< 50 %", count: 30, band: isNb ? "Lav" : "Low", color: "bg-destructive" as const },
  ];

  const r = 52;
  const c = 2 * Math.PI * r;
  const dash = (score / 100) * c;
  const tone =
    score >= 75 ? "text-success" : score >= 50 ? "text-warning" : "text-destructive";
  const ring =
    score >= 75 ? "stroke-success" : score >= 50 ? "stroke-warning" : "stroke-destructive";

  return (
    <Card
      onClick={() => navigate("/msp-partner/widget/trust-score")}
      className="p-5 flex flex-col items-center text-center gap-5 cursor-pointer hover:border-primary/40 transition-colors group relative"
    >
      <div className="flex items-center gap-1.5">
        <div className="text-[11px] uppercase tracking-[0.15em] text-muted-foreground font-semibold">
          Trust score
        </div>
        <span className="inline-flex items-center rounded border border-muted-foreground/20 bg-muted/40 px-1.5 py-0 text-[10px] font-medium text-muted-foreground">
          V2
        </span>
        <TooltipProvider delayDuration={100}>
          <UITooltip>
            <TooltipTrigger asChild>
              <HelpCircle
                className="h-3.5 w-3.5 text-muted-foreground cursor-help"
                onClick={(e) => e.stopPropagation()}
              />
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs text-xs">
              {isNb
                ? <>Trust Score er en samlet modenhetsvurdering per kunde (0–100) basert på Governance, Operations, Privacy og Third-Party. Snittet viser hvor solid hele porteføljen står samlet. <span className="font-semibold">V2 — ikke implementer nå.</span></>
                : <>Trust Score is an aggregated maturity assessment per customer (0–100) based on Governance, Operations, Privacy and Third-Party. The average shows how solid the entire portfolio is overall. <span className="font-semibold">V2 — not implemented yet.</span></>}
            </TooltipContent>
          </UITooltip>
        </TooltipProvider>
      </div>

      <div className="relative h-32 w-32 shrink-0">
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/5 to-transparent" />
        <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
          <circle
            cx="60"
            cy="60"
            r={r}
            className="stroke-muted"
            strokeWidth="10"
            fill="none"
          />
          <circle
            cx="60"
            cy="60"
            r={r}
            className={ring}
            strokeWidth="10"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${c}`}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className={`text-3xl font-bold leading-none ${tone}`}>{score}</div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">score</div>
        </div>
      </div>

      <div>
        <div className="text-sm font-medium text-foreground">{isNb ? "Snitt portefølje" : "Portfolio average"}</div>
        <div className="text-xs text-muted-foreground mt-0.5">
          <span className="text-success font-semibold">+{delta}</span> {isNb ? "siste 30 dager" : "last 30 days"}
        </div>
      </div>

      <div className="w-full space-y-2 pt-1">
        <div className="text-[11px] uppercase tracking-[0.15em] text-muted-foreground font-semibold text-left">
          {isNb ? "Fordeling" : "Distribution"}
        </div>
        {distribution.map((d) => {
          const pct = Math.round((d.count / totalCustomers) * 100);
          return (
            <div key={d.label} className="flex items-center gap-2 text-[11px]">
              <span className="w-14 shrink-0 text-muted-foreground text-left">{d.label}</span>
              <span className="flex-1 h-2 rounded-full bg-muted overflow-hidden" aria-hidden="true">
                <span className={`block h-full rounded-full ${d.color}`} style={{ width: `${pct}%` }} />
              </span>
              <span className="w-20 shrink-0 text-right tabular-nums text-foreground">
                {pct}% · {d.count}
              </span>
            </div>
          );
        })}
      </div>

      <ChevronRight className="absolute top-3 right-3 h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
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
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb" || i18n.language === "no";
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
              <div className="text-base font-semibold text-foreground">{isNb ? "Lara-forslag" : "Lara suggestions"}</div>
              <ChevronRight
                className={`h-4 w-4 text-muted-foreground transition-transform ${expanded ? "rotate-90" : ""}`}
              />
            </div>
            <div className="text-xs text-muted-foreground">
              {LARA_SUGGESTIONS.length} {isNb ? "anbefalinger klare for gjennomgang" : "recommendations ready for review"}
            </div>
          </div>
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="text-muted-foreground hover:text-foreground p-1 -m-1"
          aria-label={isNb ? "Skjul" : "Hide"}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {expanded && (
        <div className="overflow-x-auto -mx-5 px-5 mt-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border">
                <th className="text-left font-semibold py-2 pr-4">{isNb ? "Regelverk" : "Regulation"}</th>
                <th className="text-left font-semibold py-2 pr-4">{isNb ? "Anbefaling" : "Recommendation"}</th>
                <th className="text-left font-semibold py-2 pr-4 whitespace-nowrap">{isNb ? "Målgruppe" : "Target group"}</th>
                <th className="text-left font-semibold py-2 pr-4">{isNb ? "Forventet effekt" : "Expected effect"}</th>
                <th className="text-left font-semibold py-2 pr-4">{isNb ? "Prioritet" : "Priority"}</th>
                <th className="text-right font-semibold py-2">{isNb ? "Handling" : "Action"}</th>
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
                    <div className="font-semibold text-foreground">{isNb ? s.title : s.titleEn}</div>
                    <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2 max-w-md">
                      {isNb ? s.summary : s.summaryEn}
                    </div>
                  </td>
                  <td className="py-3 pr-4 align-top whitespace-nowrap tabular-nums">
                    {s.targetCount} {isNb ? "kunder" : "customers"}
                  </td>
                  <td className="py-3 pr-4 align-top text-foreground/90">
                    {isNb ? s.expectedEffect : s.expectedEffectEn}
                  </td>
                  <td className="py-3 pr-4 align-top">
                    <Badge variant="outline" className={`text-[11px] ${PRIORITY_STYLES[s.priority]}`}>
                      {isNb ? s.priority : s.priorityEn}
                    </Badge>
                  </td>
                  <td className="py-3 text-right align-top">
                    <Button size="sm" variant="outline" onClick={() => onSelect(s)} className="gap-1">
                      {isNb ? "Sett opp" : "Set up"} <ChevronRight className="h-3.5 w-3.5" />
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
  { name: "Bergen Energi AS", industry: "Energi", industryEn: "Energy", risk: "Høy", riskEn: "High", reason: "NIS2 + ikke aktivert", reasonEn: "NIS2 + not activated" },
  { name: "Sognefjord Helse AS", industry: "Helse", industryEn: "Health", risk: "Høy", riskEn: "High", reason: "Særlige kategorier", reasonEn: "Special categories" },
  { name: "Vestland Logistikk", industry: "Transport", industryEn: "Transport", risk: "Medium", riskEn: "Medium", reason: "Ny CEO + DORA", reasonEn: "New CEO + DORA" },
  { name: "Nordic Cargo AS", industry: "Transport", industryEn: "Transport", risk: "Medium", riskEn: "Medium", reason: "NIS2-eksponert", reasonEn: "NIS2-exposed" },
  { name: "Stavanger Logistikk", industry: "Transport", industryEn: "Transport", risk: "Medium", riskEn: "Medium", reason: "Sky-avhengig", reasonEn: "Cloud-dependent" },
  { name: "Kystbygg Entreprenør", industry: "Bygg", industryEn: "Construction", risk: "Lav", riskEn: "Low", reason: "200+ ansatte", reasonEn: "200+ employees" },
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
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb" || i18n.language === "no";
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
      title: isNb ? "Kampanje aktivert" : "Campaign activated",
      description: isNb
        ? `Lara kjører «${suggestion.title}» mot ${includedCount} kunder.`
        : `Lara is running "${suggestion.titleEn}" for ${includedCount} customers.`,
    });
  };

  const STEPS: { key: FlowStep; label: string }[] = isNb ? [
    { key: "review", label: "Gjennomgå" },
    { key: "audience", label: "Målgruppe" },
    { key: "preview", label: "E-post" },
    { key: "schedule", label: "Tidsplan" },
    { key: "activated", label: "Aktiv" },
  ] : [
    { key: "review", label: "Review" },
    { key: "audience", label: "Audience" },
    { key: "preview", label: "Email" },
    { key: "schedule", label: "Schedule" },
    { key: "activated", label: "Active" },
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
            {isNb ? "LARA-FORSLAG" : "LARA SUGGESTION"}
          </Badge>
          <h3 className="text-xl font-semibold text-foreground">{isNb ? suggestion.title : suggestion.titleEn}</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {isNb ? suggestion.summary : suggestion.summaryEn}
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
                <div className="text-[11px] tracking-wider text-muted-foreground font-semibold">{isNb ? "REKKEVIDDE" : "REACH"}</div>
                <div className="text-sm font-semibold text-foreground mt-1">{isNb ? suggestion.impact.reach : suggestion.impactEn.reach}</div>
              </div>
              <div className="p-3 rounded-lg bg-muted/50 border border-border">
                <div className="text-[11px] tracking-wider text-muted-foreground font-semibold">{isNb ? "FORVENTET" : "EXPECTED"}</div>
                <div className="text-sm font-semibold text-foreground mt-1">{isNb ? suggestion.impact.expectedClaims : suggestion.impactEn.expectedClaims}</div>
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
                  <h4 className="text-sm font-semibold text-foreground">{isNb ? "Slik utfører Lara dette" : "How Lara does this"}</h4>
                  <Badge variant="outline" className="text-[11px]">{suggestion.steps.length} {isNb ? "steg" : "steps"}</Badge>
                </div>
                <ChevronDown
                  className={`h-4 w-4 text-muted-foreground transition-transform ${showSteps ? "rotate-180" : ""}`}
                />
              </button>
              {showSteps && (
                <ol className="space-y-2 mt-2">
                  {(isNb ? suggestion.steps : suggestion.stepsEn).map((s, i) => (
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
                {isNb ? `Lara har valgt ${CAMPAIGN_TARGETS.length} kunder` : `Lara has selected ${CAMPAIGN_TARGETS.length} customers`}
              </h4>
              <Badge variant="outline" className="text-xs">
                {isNb ? `${includedCount} inkludert · ${excluded.size} ekskludert` : `${includedCount} included · ${excluded.size} excluded`}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {isNb
                ? "Klikk på en kunde for å ekskludere fra kampanjen. Lara har rangert etter risiko og signalstyrke."
                : "Click a customer to exclude them from the campaign. Lara has ranked them by risk and signal strength."}
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
                        {isNb ? c.industry : c.industryEn} · {isNb ? c.reason : c.reasonEn}
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
                      {isNb ? c.risk : c.riskEn}
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
              <h4 className="text-sm font-semibold text-foreground">{isNb ? "Forhåndsvis e-posten" : "Preview the email"}</h4>
              <Badge variant="outline" className="text-[11px] gap-1">
                <Sparkles className="h-3 w-3 text-primary" />
                {isNb ? "Generert av Lara" : "Generated by Lara"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {isNb
                ? "Tydelig pristilbud og verdiforslag — kunden forstår hva som er gratis, hva som koster, og hva de får. Eksempel for Bergen Energi AS:"
                : "Clear pricing and value proposition — the customer understands what's free, what costs money, and what they get. Example for Bergen Energi AS:"}
            </p>
            <div className="border border-border rounded-lg overflow-hidden bg-card">
              <div className="bg-muted/40 px-4 py-2.5 border-b border-border space-y-1">
                <div className="text-xs">
                  <span className="text-muted-foreground">{isNb ? "Fra:" : "From:"}</span>{" "}
                  <span className="text-foreground font-medium">Beate Solberg · Mynder Partner</span>
                </div>
                <div className="text-xs">
                  <span className="text-muted-foreground">{isNb ? "Til:" : "To:"}</span>{" "}
                  <span className="text-foreground font-medium">erik@bergenenergi.no</span>
                </div>
                <div className="text-xs">
                  <span className="text-muted-foreground">{isNb ? "Emne:" : "Subject:"}</span>{" "}
                  <span className="text-foreground font-medium">
                    {isNb
                      ? "Bergen Energi omfattes av NIS2 — slik kommer dere i gang (gratis kartlegging)"
                      : "Bergen Energi is covered by NIS2 — here's how to get started (free mapping)"}
                  </span>
                </div>
              </div>
              <div className="p-4 text-sm text-foreground/90 leading-relaxed space-y-3">
                <p>{isNb ? "Hei Erik," : "Hi Erik,"}</p>
                <p>
                  {isNb ? (
                    <>Bergen Energi AS er omfattet av <strong>NIS2-direktivet</strong> (Energi, 51–200 ansatte).
                    Direktivet ble en del av norsk lov i 2025 og krever bl.a. risikostyring,
                    hendelseshåndtering og dokumentert sikkerhetsstyring — med personlig ansvar for ledelsen.</>
                  ) : (
                    <>Bergen Energi AS is covered by the <strong>NIS2 directive</strong> (Energy, 51–200 employees).
                    The directive became part of Norwegian law in 2025 and requires, among other things, risk management,
                    incident handling and documented security governance — with personal liability for management.</>
                  )}
                </p>

                <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 space-y-1">
                  <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 tracking-wider">
                    {isNb ? "GRATIS — INGEN BINDING" : "FREE — NO COMMITMENT"}
                  </div>
                  <p className="text-sm">
                    {isNb ? (
                      <><strong>Trust Profile + NIS2 selv-vurdering.</strong> Dere får oversikt over hvor
                      dere står i dag og hvilke krav som gjelder for nettopp deres virksomhet.</>
                    ) : (
                      <><strong>Trust Profile + NIS2 self-assessment.</strong> You get an overview of where
                      you stand today and which requirements apply specifically to your business.</>
                    )}
                  </p>
                </div>

                <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-semibold text-primary tracking-wider">
                      {isNb ? "NIS2-MODUL — 2 490 KR / MND" : "NIS2 MODULE — NOK 2,490 / MONTH"}
                    </div>
                    <Badge className="bg-primary text-primary-foreground text-[11px] hover:bg-primary">
                      {isNb ? "ANBEFALT" : "RECOMMENDED"}
                    </Badge>
                  </div>
                  <p className="text-sm">{isNb ? "Aktivering inkluderer:" : "Activation includes:"}</p>
                  <ul className="text-sm space-y-1 ml-4 list-disc">
                    {isNb ? (
                      <>
                        <li><strong>Full gap-analyse</strong> mot alle NIS2-krav (24 kontrollområder)</li>
                        <li>Konkret tiltaksplan med prioritering og tidslinje</li>
                        <li>Hendelsesrapportering til myndighetene (24-timers frist)</li>
                        <li>Løpende overvåking av leverandørkjede og endringer</li>
                        <li>Dokumentasjon klar for tilsyn og styrebehandling</li>
                      </>
                    ) : (
                      <>
                        <li><strong>Full gap analysis</strong> against all NIS2 requirements (24 control areas)</li>
                        <li>Concrete action plan with prioritization and timeline</li>
                        <li>Incident reporting to authorities (24-hour deadline)</li>
                        <li>Ongoing monitoring of supply chain and changes</li>
                        <li>Documentation ready for audits and board review</li>
                      </>
                    )}
                  </ul>
                </div>

                <p>
                  {isNb
                    ? "Vil du se hva som gjelder for Bergen Energi? Det tar 2 minutter og koster ingenting."
                    : "Want to see what applies to Bergen Energi? It takes 2 minutes and costs nothing."}
                </p>
                <p>
                  <span className="inline-block bg-primary text-primary-foreground rounded-md px-3 py-1.5 text-sm font-semibold">
                    {isNb ? "→ Start gratis NIS2-kartlegging" : "→ Start free NIS2 mapping"}
                  </span>
                </p>

                <p className="text-xs text-muted-foreground border-t border-border pt-3">
                  {isNb ? "Mvh," : "Best regards,"}<br />
                  Beate Solberg · Mynder Partner<br />
                  {isNb ? "Sertifisert NIS2-rådgiver · 90 12 34 56" : "Certified NIS2 advisor · 90 12 34 56"}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/40 rounded-lg p-3 border border-border">
              <Sparkles className="h-3.5 w-3.5 text-primary flex-shrink-0 mt-0.5" />
              <span>
                {isNb ? (
                  <>Lara tilpasser bransje, eksempler og kontaktperson per kunde.
                  Konverteringsrate: <strong className="text-foreground">~14 %</strong> velger NIS2-modulen
                  etter gratis kartlegging.</>
                ) : (
                  <>Lara adapts the industry, examples and contact person per customer.
                  Conversion rate: <strong className="text-foreground">~14%</strong> choose the NIS2 module
                  after the free mapping.</>
                )}
              </span>
            </div>
          </div>
        )}

        {/* STEP 4: Schedule */}
        {step === "schedule" && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground">{isNb ? "Når skal kampanjen starte?" : "When should the campaign start?"}</h4>
            <div className="space-y-2">
              {(isNb ? [
                { key: "now" as const, label: "Send nå", sub: "Første e-post går ut innen 5 min" },
                { key: "tomorrow" as const, label: "I morgen kl. 09:00", sub: "Best åpningsrate ifølge Lara" },
                { key: "monday" as const, label: "Mandag kl. 08:30", sub: "Anbefalt for B2B-segmentet" },
              ] : [
                { key: "now" as const, label: "Send now", sub: "First email goes out within 5 min" },
                { key: "tomorrow" as const, label: "Tomorrow at 09:00", sub: "Best open rate according to Lara" },
                { key: "monday" as const, label: "Monday at 08:30", sub: "Recommended for the B2B segment" },
              ]).map((opt) => (
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
                      {isNb ? "ANBEFALT" : "RECOMMENDED"}
                    </Badge>
                  )}
                </button>
              ))}
            </div>
            <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/40 rounded-lg p-3 border border-border">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <span>
                {isNb
                  ? "Du kan pause eller stoppe kampanjen når som helst fra dashbordet. Lara sender automatisk oppfølging etter 3 dager til de som ikke åpner."
                  : "You can pause or stop the campaign at any time from the dashboard. Lara automatically sends a follow-up after 3 days to those who don't open it."}
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
              <h3 className="text-lg font-semibold text-foreground">{isNb ? "Kampanje aktivert" : "Campaign activated"}</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-md">
                {isNb
                  ? <>Lara kjører «{suggestion.title}» mot {includedCount} kunder. Du får statusrapport i innboksen daglig.</>
                  : <>Lara is running "{suggestion.titleEn}" for {includedCount} customers. You get a status report in your inbox daily.</>}
              </p>
            </div>

            <div className="border border-border rounded-lg p-4 space-y-3 bg-muted/20">
              <div className="text-[11px] tracking-wider text-muted-foreground font-semibold">
                {isNb ? "LARAS NESTE STEG" : "LARA'S NEXT STEPS"}
              </div>
              {(isNb ? [
                { time: "Nå", text: `${schedule === "now" ? "Sender" : "Planlegger"} ${includedCount} personaliserte e-poster`, done: schedule === "now" },
                { time: "+3 dager", text: "Automatisk oppfølging til ikke-åpnere" },
                { time: "Løpende", text: "Booker intro-møte ved klikk på «Vis min profil»" },
                { time: "Daglig", text: "Statusrapport i din innboks 07:00" },
              ] : [
                { time: "Now", text: `${schedule === "now" ? "Sending" : "Scheduling"} ${includedCount} personalized emails`, done: schedule === "now" },
                { time: "+3 days", text: "Automatic follow-up to non-openers" },
                { time: "Ongoing", text: "Books an intro meeting on \"View my profile\" clicks" },
                { time: "Daily", text: "Status report in your inbox at 07:00" },
              ]).map((item, i) => (
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
              {isNb ? "Avbryt" : "Cancel"}
            </Button>
            <Button onClick={() => setStep("audience")} className="gap-2">
              {isNb ? "Sett opp kampanje" : "Set up campaign"}
              <ChevronRight className="h-4 w-4" />
            </Button>
          </>
        )}
        {step === "audience" && (
          <>
            <Button variant="outline" onClick={() => setStep("review")}>
              {isNb ? "Tilbake" : "Back"}
            </Button>
            <Button
              onClick={() => setStep("preview")}
              disabled={includedCount === 0}
              className="gap-2"
            >
              {isNb ? `Se e-post (${includedCount})` : `View email (${includedCount})`} <ChevronRight className="h-4 w-4" />
            </Button>
          </>
        )}
        {step === "preview" && (
          <>
            <Button variant="outline" onClick={() => setStep("audience")}>
              {isNb ? "Tilbake" : "Back"}
            </Button>
            <Button onClick={() => setStep("schedule")} className="gap-2">
              {isNb ? "Velg tidspunkt" : "Choose time"} <ChevronRight className="h-4 w-4" />
            </Button>
          </>
        )}
        {step === "schedule" && (
          <>
            <Button variant="outline" onClick={() => setStep("preview")}>
              {isNb ? "Tilbake" : "Back"}
            </Button>
            <Button onClick={handleActivate} className="gap-2">
              <CtaIcon className="h-4 w-4" />
              {isNb ? "Aktiver kampanje" : "Activate campaign"}
            </Button>
          </>
        )}
        {step === "activated" && (
          <Button onClick={handleClose} className="w-full sm:w-auto">
            {isNb ? "Ferdig" : "Done"}
          </Button>
        )}
      </div>
    </Card>

  );
}

function ClaimDevelopmentChart() {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb" || i18n.language === "no";
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
            <h3 className="text-base font-semibold text-foreground">{isNb ? "Salgspotensial fra gap-analyser" : "Sales potential from gap analyses"}</h3>
            <UITooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-[280px]">
                <p className="text-xs">
                  {isNb
                    ? "Estimert tjenestesalg partner kan levere for å lukke gap i kundenes aktiverte regelverk. Basert på antall åpne krav × snittpris per tjeneste, i partnerens standardvaluta."
                    : "Estimated service sales the partner can deliver to close gaps in customers' activated regulations. Based on the number of open requirements × average price per service, in the partner's default currency."}
                </p>
              </TooltipContent>
            </UITooltip>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isNb
              ? `Basert på åpne krav i utvalgte regelverk hos ${customerCount} kunder`
              : `Based on open requirements in selected regulations for ${customerCount} customers`}
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
              formatter={(value: number) => [formatPartnerCurrency(value), isNb ? "Potensial" : "Potential"]}
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
          <div className="text-xs text-muted-foreground">{isNb ? `kunder · ${frameworkCount} regelverk` : `customers · ${frameworkCount} regulations`}</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-foreground tabular-nums">{openGaps}</div>
          <div className="text-xs text-muted-foreground">{isNb ? "åpne gap" : "open gaps"}</div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-primary tabular-nums">{formatPartnerCurrency(totalPotential)}</div>
          <div className="text-xs text-muted-foreground">{isNb ? "potensielt salg" : "potential sales"}</div>
        </div>
      </div>
    </Card>
  );
}


function PortfolioSegmentation() {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb" || i18n.language === "no";
  const [grouping, setGrouping] = useState<"industry" | "framework">("industry");
  const segments = grouping === "industry" ? SEGMENTS_BY_INDUSTRY : SEGMENTS_BY_FRAMEWORK;
  const groupingLabel = isNb
    ? (grouping === "industry" ? "bransje" : "regelverk")
    : (grouping === "industry" ? "industry" : "regulation");

  return (
    <Card onClick={() => navigate("/msp-partner/widget/segmentation")} className="p-5 cursor-pointer hover:border-primary/40 transition-colors">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-1.5">
          <h3 className="text-base font-semibold text-foreground">{isNb ? "Portefølje-segmentering" : "Portfolio segmentation"}</h3>
          <TooltipProvider delayDuration={150}>
            <UITooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={(e) => e.stopPropagation()}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={isNb ? "Hva viser denne widgeten?" : "What does this widget show?"}
                >
                  <HelpCircle className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs text-xs leading-relaxed">
                {isNb
                  ? `Porteføljen din gruppert etter ${groupingLabel}. «Treffer» viser hvor mange kunder som tilhører segmentet, «Aktivert» viser andelen av dem som har aktivert tilhørende regelverk. Klikk widgeten for å se detaljer.`
                  : `Your portfolio grouped by ${groupingLabel}. "Matches" shows how many customers belong to the segment, "Activated" shows the share of them who have activated the related regulation. Click the widget for details.`}
              </TooltipContent>
            </UITooltip>
          </TooltipProvider>
        </div>
        <div
          className="inline-flex rounded-lg border border-border p-0.5"
          role="group"
          aria-label={isNb ? "Velg segmentering" : "Select grouping"}
          onClick={(e) => e.stopPropagation()}
        >
          {(["industry", "framework"] as const).map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setGrouping(g)}
              aria-pressed={grouping === g}
              className={
                "flex-1 sm:flex-none whitespace-nowrap px-3 py-1.5 text-xs font-medium rounded-md transition-colors " +
                (grouping === g
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground")
              }
            >
              {isNb
                ? (g === "industry" ? "Per bransje" : "Per regelverk")
                : (g === "industry" ? "By industry" : "By regulation")}
            </button>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-3 mb-2 text-[10px] uppercase tracking-wide text-muted-foreground">
        <div className="w-36">{isNb ? "Segment" : "Segment"}</div>
        <div className="flex-1" />
        <div className="w-10 text-right">{isNb ? "Treffer" : "Matches"}</div>
        <div className="w-16 text-right">{isNb ? "Aktivert" : "Activated"}</div>
      </div>
      <div className="space-y-3">
        {segments.map((s) => (
          <div key={s.label} className="flex items-center gap-3">
            <div className="w-36 text-sm text-foreground">{isNb ? s.label : s.labelEn}</div>
            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden" aria-hidden="true">
              <div
                className={"h-full rounded-full " + s.color}
                style={{ width: `${s.widthPct}%` }}
              />
            </div>
            <div className="w-10 text-right text-sm font-semibold text-foreground tabular-nums">
              {s.count}
            </div>
            <div className="w-16 text-right text-sm text-muted-foreground tabular-nums">
              {s.activatedPct} %
            </div>
          </div>
        ))}
      </div>

    </Card>
  );
}

const TOP_SERVICES = [
  { label: "GDPR / Personvern", labelEn: "GDPR / Privacy", count: 142, color: "bg-primary" },
  { label: "ISO 27001-forberedelse", labelEn: "ISO 27001 preparation", count: 118, color: "bg-purple-500" },
  { label: "Risikovurdering leverandører", labelEn: "Supplier risk assessment", count: 96, color: "bg-fuchsia-500" },
  { label: "DPA / Databehandleravtaler", labelEn: "DPA / Data processing agreements", count: 81, color: "bg-violet-400" },
  { label: "Sikkerhetsopplæring", labelEn: "Security training", count: 64, color: "bg-indigo-400" },
  { label: "Incident response-plan", labelEn: "Incident response plan", count: 47, color: "bg-pink-400" },
];

function TopServicesWidget() {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb" || i18n.language === "no";
  const max = Math.max(...TOP_SERVICES.map((s) => s.count));
  return (
    <Card
      onClick={() => navigate("/msp-partner/widget/top-services")}
      className="p-5 cursor-pointer hover:border-primary/40 transition-colors"
    >
      <div className="flex items-start justify-between mb-1 gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <h3 className="text-base font-semibold text-foreground">{isNb ? "Tjenester kundene trenger mest hjelp med" : "Services customers need the most help with"}</h3>
            <TooltipProvider delayDuration={150}>
              <UITooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={(e) => e.stopPropagation()}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={isNb ? "Hva viser denne widgeten?" : "What does this widget show?"}
                  >
                    <HelpCircle className="h-3.5 w-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs text-xs leading-relaxed">
                  {isNb
                    ? "Antall kunder i porteføljen din som har åpne aktiviteter, forespørsler eller gap innenfor hvert tjenesteområde. Kilde: kundenes Trust Profile og Lara-signaler. Bruk listen til å pakketere og selge rådgivning."
                    : "Number of customers in your portfolio with open activities, requests or gaps within each service area. Source: customers' Trust Profile and Lara signals. Use the list to package and sell advisory services."}
                </TooltipContent>
              </UITooltip>
            </TooltipProvider>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{isNb ? "Etterspørsel per regelverk — siste 30 dager" : "Demand per regulation — last 30 days"}</p>
        </div>
      </div>

      <div className="flex items-center gap-3 mt-4 mb-2 text-[10px] uppercase tracking-wide text-muted-foreground">
        <div className="w-56">{isNb ? "Tjeneste" : "Service"}</div>
        <div className="flex-1" />
        <div className="w-12 text-right">{isNb ? "Kunder" : "Customers"}</div>
      </div>

      <div className="space-y-2.5">
        {TOP_SERVICES.map((s) => (
          <div key={s.label} className="flex items-center gap-3">
            <div className="w-56 text-sm text-foreground truncate">{isNb ? s.label : s.labelEn}</div>
            <div className="flex-1 h-2.5 bg-muted rounded-full overflow-hidden">
              <div className={"h-full rounded-full " + s.color} style={{ width: `${(s.count / max) * 100}%` }} />
            </div>
            <div className="w-12 text-right text-sm font-semibold tabular-nums">{s.count}</div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-end">
        <span className="text-xs font-medium text-primary flex items-center gap-1">
          {isNb ? "Se detaljer og handlinger" : "View details and actions"} <ChevronRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </Card>
  );
}

function LiveSignals() {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb" || i18n.language === "no";
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-foreground">{isNb ? "Live signaler" : "Live signals"}</h3>
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
              <div className="text-xs text-muted-foreground">{isNb ? sig.note : sig.noteEn}</div>
            </div>
            <span className="text-xs text-muted-foreground whitespace-nowrap">{isNb ? sig.time : sig.timeEn}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}



export default function MSPPartnerDashboard() {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb" || i18n.language === "no";
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
            <LaraWorkQueueWidget />
            <AvgTrustScoreWidget />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <OpportunityWidget />
            <ActivityLogWidget />
          </div>

          <PortfolioSegmentation />

          <TopServicesWidget />

          <div className="flex justify-end">
            <Button variant="outline" onClick={() => navigate("/msp-dashboard")}>
              {isNb ? "Gå til kundeoversikt" : "Go to customer overview"}
            </Button>
          </div>
        </div>
      </main>

    </div>
  );
}
