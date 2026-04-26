import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
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
import { Sparkles, ArrowUpRight, TrendingUp, ChevronRight, Mail, Phone, Calendar, CheckCircle2, Users, Target, Clock, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
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
  { key: "claim", label: "CLAIM-RATE", value: "12%", sub: "47 av 400 · mål 40%", tone: "primary" as const, delta: "+2", progress: 30 },
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
};

const LARA_SUGGESTIONS: LaraSuggestion[] = [
  {
    id: 1,
    dot: "bg-status-followup",
    text: "Kjør NIS2-claim-kampanje mot 28 kunder",
    icon: Target,
    title: "NIS2-claim-kampanje",
    summary: "28 kunder i porteføljen er NIS2-eksponert, men har ennå ikke claimet sin Trust Profile. Lara har klargjort en målrettet kampanje.",
    impact: { reach: "28 kunder", expectedClaims: "9–12 nye claims", revenue: "~210 000 kr ARR" },
    steps: [
      "Send personalisert e-post med NIS2-eksponering og frister",
      "Automatisk oppfølging etter 3 dager til de som ikke åpnet",
      "Lara booker intro-møte for de som klikker «Vis min profil»",
      "Du får daglig statusrapport i innboksen",
    ],
    cta: { primary: "Start kampanje nå", secondary: "Tilpass mal", icon: Mail },
  },
  {
    id: 2,
    dot: "bg-status-followup",
    text: "Følg opp Bergen Maskin — sertifikat utløpt",
    icon: Clock,
    title: "Bergen Maskin AS — ISO 27001 utløpt",
    summary: "ISO 27001-sertifikatet utløp for 14 dager siden. Kunden har ikke lastet opp nytt bevis. Risiko for at de mister sertifisering — og at du mister rådgivningsmulighet.",
    impact: { reach: "1 kunde", expectedClaims: "Beholde kunde + resertifisering", revenue: "~85 000 kr i prosjekt" },
    steps: [
      "Ring kontaktperson Erik Solheim (CISO)",
      "Send forhåndsskrevet e-post med tilbud om resertifiseringsløp",
      "Book oppfølging i kalender om 7 dager",
      "Lara overvåker Brreg + datatilsyn for nye signaler",
    ],
    cta: { primary: "Ring nå", secondary: "Send e-post", icon: Phone },
  },
  {
    id: 3,
    dot: "bg-primary",
    text: "Book intro med Vestland Logistikk — ny CEO",
    icon: Users,
    title: "Vestland Logistikk — ny CEO",
    summary: "Brreg-signal: ny CEO registrert i går. Statistisk topp-tidspunkt for å introdusere compliance-rådgivning. Selskapet er DORA-eksponert (transport + finansielle tjenester).",
    impact: { reach: "1 kunde", expectedClaims: "Ny rådgivningskontrakt", revenue: "~150 000 kr ARR" },
    steps: [
      "Lara har funnet CEO på LinkedIn — godkjenn introtekst",
      "Send connect-forespørsel med personlig melding",
      "Foreslå 20-min intromøte neste uke",
      "Forbered briefing-pakke om DORA + transportbransjen",
    ],
    cta: { primary: "Book møte", secondary: "Se briefing", icon: Calendar },
  },
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
};

const CLAIM_TREND = [
  { month: "nov", value: 6 },
  { month: "des", value: 9 },
  { month: "jan", value: 22 },
  { month: "feb", value: 32 },
  { month: "mar", value: 41 },
  { month: "apr", value: 47 },
];

const SEGMENTS = [
  { label: "NIS2-eksponert", count: 71, color: "bg-primary", widthPct: 35 },
  { label: "Sky-avhengig", count: 186, color: "bg-purple-400", widthPct: 92 },
  { label: "Særlige kategorier", count: 128, color: "bg-emerald-500", widthPct: 64 },
  { label: "DORA-finans", count: 42, color: "bg-orange-500", widthPct: 21 },
  { label: "ISO 27001", count: 23, color: "bg-amber-700", widthPct: 12 },
];

const LIVE_SIGNALS = [
  { time: "2t", name: "Bergen Maskin AS", note: "ISO 27001 utløpt", accent: "bg-destructive" },
  { time: "04:15", name: "Sognefjord Helse AS", note: "Datatilsyn-sak åpnet", accent: "bg-status-followup" },
  { time: "i går", name: "Vestland Logistikk", note: "Ny CEO i Brreg", accent: "bg-primary" },
  { time: "i går", name: "Nordic Cargo AS", note: "Profil claimed", accent: "bg-emerald-500" },
];

// ---------- Components ----------

function PartnerHeader() {
  return (
    <div className="flex items-start justify-between">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Hei, Beate</h1>
        <p className="text-muted-foreground mt-1">
          Du har 7 nye meldinger og Lara har 3 forslag i dag
        </p>
      </div>
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
    </div>
  );
}

function KpiCards() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {KPIS.map((k) => {
        const isClaim = k.key === "claim";
        return (
          <Card
            key={k.key}
            className={
              "p-4 relative " +
              (isClaim ? "border-primary/40 ring-1 ring-primary/30" : "")
            }
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold tracking-wider text-muted-foreground">
                {k.label}
              </span>
              {isClaim && (
                <Badge className="bg-primary text-primary-foreground text-[10px] px-1.5 py-0 h-4 rounded-sm">
                  KPI
                </Badge>
              )}
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <div
                className={
                  "text-3xl font-bold " +
                  (k.tone === "primary"
                    ? "text-primary"
                    : k.tone === "warning"
                    ? "text-status-followup"
                    : k.tone === "success"
                    ? "text-emerald-600"
                    : "text-foreground")
                }
              >
                {k.value}
              </div>
              {k.delta && (
                <span className="text-xs font-semibold text-emerald-600 inline-flex items-center">
                  ↑{k.delta}
                </span>
              )}
            </div>
            <div className="text-xs text-muted-foreground mt-1">{k.sub}</div>
            {isClaim && k.progress !== undefined && (
              <div className="mt-3 h-1 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full"
                  style={{ width: `${k.progress}%` }}
                />
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}

function LaraSuggestions() {
  return (
    <Card className="p-4 bg-primary/5 border-primary/20">
      <div className="flex items-center justify-between mb-3">
        <div className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
          <Sparkles className="h-4 w-4" />
          Lara har 3 forslag
        </div>
        <button className="text-xs text-primary hover:underline inline-flex items-center gap-1">
          Vis alle <ArrowUpRight className="h-3 w-3" />
        </button>
      </div>
      <div className="space-y-2">
        {LARA_SUGGESTIONS.map((s) => (
          <button
            key={s.id}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg bg-card hover:bg-accent/50 border border-border transition-colors text-left"
          >
            <span className={"h-2 w-2 rounded-full flex-shrink-0 " + s.dot} />
            <span className="text-sm text-foreground flex-1">{s.text}</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        ))}
      </div>
    </Card>
  );
}

function ClaimDevelopmentChart() {
  // From image 2: smooth curve 6 -> 47, +167%, 8 in april, 12% portfolio, 40% target 2026
  const data = CLAIM_TREND;
  const last = data[data.length - 1];

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between mb-1">
        <div>
          <h3 className="text-base font-semibold text-foreground">Claim-utvikling</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Fra 6 til 47 claims · siste 6 mnd
          </p>
        </div>
        <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs gap-1 hover:bg-emerald-500/10">
          <TrendingUp className="h-3 w-3" />
          +167%
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
            <YAxis hide domain={[0, 55]} />
            <Tooltip
              contentStyle={{
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: 8,
                fontSize: 12,
              }}
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
                value: String(last.value),
                position: "right",
                fill: "hsl(var(--primary))",
                fontSize: 14,
                fontWeight: 700,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border">
        <div>
          <div className="text-2xl font-bold text-foreground">8</div>
          <div className="text-xs text-muted-foreground">claims i april</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-foreground">12%</div>
          <div className="text-xs text-muted-foreground">av portefølje</div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-primary">40%</div>
          <div className="text-xs text-muted-foreground">mål 2026</div>
        </div>
      </div>
    </Card>
  );
}

function PortfolioSegmentation() {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-foreground">Portefølje-segmentering</h3>
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

// ---------- Page ----------
export default function MSPPartnerDashboard() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto pt-11">
        <div className="container max-w-7xl mx-auto py-8 px-4 md:px-8 space-y-5">
          <PartnerHeader />
          <KpiCards />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <LaraSuggestions />
            <ClaimDevelopmentChart />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <PortfolioSegmentation />
            <LiveSignals />
          </div>

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
