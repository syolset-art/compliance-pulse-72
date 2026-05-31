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
import { Sparkles, ArrowUpRight, TrendingUp, ChevronRight, ChevronDown, Mail, Phone, Calendar, CheckCircle2, Users, Target, Clock, FileText, Send, ThumbsUp, Megaphone, Settings, Newspaper, Video, GraduationCap, Zap, X } from "lucide-react";
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
  { key: "claim", label: "AKTIVERINGSGRAD", value: "12%", sub: "47 av 400 kunder har aktivert compliance-leveransen", tone: "primary" as const, delta: "+2", progress: 30 },
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
    summary: "28 kunder i porteføljen er NIS2-eksponert, men har ennå ikke overtatt sin Trust Profile. Lara har klargjort en målrettet kampanje.",
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
  const navigate = useNavigate();
  return (
    <div className="flex items-start justify-between">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Hei, Beate</h1>
        <p className="text-muted-foreground mt-1">
          Du har 7 nye meldinger og Lara har 3 forslag i dag
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


function ClaimRateWidget() {
  const navigate = useNavigate();
  const claimPct = 12;
  const claimGoal = 40;
  const ringProgress = Math.min(100, (claimPct / claimGoal) * 100);
  const r = 42;
  const c = 2 * Math.PI * r;
  const dash = (ringProgress / 100) * c;

  return (
    <Card
      onClick={() => navigate("/msp-partner/widget/claim-rate")}
      className="relative overflow-hidden border-0 p-0 cursor-pointer group"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-purple-600 to-fuchsia-600" />
      <div className="absolute -top-16 -right-16 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
      <div className="relative flex items-center gap-4 p-5 text-white">
        <div className="relative h-24 w-24 shrink-0">
          <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
            <circle cx="50" cy="50" r={r} stroke="rgba(255,255,255,0.18)" strokeWidth="8" fill="none" />
            <circle
              cx="50" cy="50" r={r}
              stroke="white" strokeWidth="8" fill="none"
              strokeLinecap="round"
              strokeDasharray={`${dash} ${c}`}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-2xl font-bold leading-none">{claimPct}%</div>
            <div className="text-[9px] uppercase tracking-wider text-white/80 mt-0.5">aktive</div>
          </div>
        </div>
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-[0.15em] text-white/80 font-semibold">Aktiveringsgrad</div>
          <div className="text-sm text-white/90 mt-0.5">47 av 400 kunder har aktivert</div>
          <div className="text-xs text-white/70 mt-1">Kunder som har godkjent compliance-leveranse · <span className="text-emerald-200 font-semibold">+2 mnd</span></div>
        </div>
        <ChevronRight className="absolute top-3 right-3 h-4 w-4 text-white/60 group-hover:text-white transition-colors" />
      </div>
    </Card>
  );
}

function NeedsFollowUpWidget() {
  const navigate = useNavigate();
  const total = 23;
  const breakdown = [
    { label: "Utdaterte Trust Profiler", count: 11, tone: "bg-warning" },
    { label: "Manglende DPA", count: 7, tone: "bg-primary" },
    { label: "Kritiske avvik", count: 5, tone: "bg-destructive" },
  ];
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
          <div className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-semibold">Krever oppfølging</div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold leading-none tabular-nums">{total}</span>
            <span className="text-xs text-muted-foreground">kunder</span>
          </div>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
      </div>
      <div className="space-y-1.5">
        {breakdown.map((b) => (
          <div key={b.label} className="flex items-center gap-2 text-[11px]">
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
          <div className="text-[9px] uppercase tracking-wider text-muted-foreground mt-0.5">score</div>
        </div>
      </div>
      <div className="min-w-0">
        <div className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-semibold">Trust score</div>
        <div className="text-sm text-foreground mt-0.5">Snitt portefølje</div>
        <div className="text-xs text-muted-foreground mt-1">
          <span className="text-success font-semibold">+{delta}</span> siste 30 dager
        </div>
      </div>
    </Card>
  );
}


function LaraSuggestions({ onSelect }: { onSelect: (s: LaraSuggestion) => void }) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  const total = LARA_SUGGESTIONS.length;
  const critical = LARA_SUGGESTIONS.filter((s) => s.dot === "bg-status-followup").length;
  const top = LARA_SUGGESTIONS[0];

  return (
    <Card className="p-4 bg-primary/5 border-primary/20">
      <div className="flex items-center gap-4">
        <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
          <Sparkles className="h-5 w-5 text-primary-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-foreground">Lara har en anbefaling til deg</div>
          <div className="text-sm text-muted-foreground">
            Du har {total} oppgaver som krever oppmerksomhet, hvorav {critical} er kritiske. Vil du starte en gjennomgang?
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button size="sm" onClick={() => onSelect(top)}>Vis plan</Button>
          <button
            onClick={() => setDismissed(true)}
            className="text-sm text-muted-foreground hover:text-foreground px-2"
          >
            Ikke nå
          </button>
        </div>
      </div>
    </Card>
  );
}


// Mock target customers for the NIS2 campaign preview
const CAMPAIGN_TARGETS = [
  { name: "Bergen Energi AS", industry: "Energi", risk: "Høy", reason: "NIS2 + ingen claim" },
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
          <Badge className="mb-2 bg-primary/10 text-primary border-primary/20 hover:bg-primary/10 text-[10px] tracking-wider">
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
                      "text-[10px] mt-1 font-semibold tracking-wider " +
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
                <div className="text-[10px] tracking-wider text-muted-foreground font-semibold">REKKEVIDDE</div>
                <div className="text-sm font-semibold text-foreground mt-1">{suggestion.impact.reach}</div>
              </div>
              <div className="p-3 rounded-lg bg-muted/50 border border-border">
                <div className="text-[10px] tracking-wider text-muted-foreground font-semibold">FORVENTET</div>
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
                  <Badge variant="outline" className="text-[10px]">{suggestion.steps.length} steg</Badge>
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
                        "text-[10px] " +
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
              <Badge variant="outline" className="text-[10px] gap-1">
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
                    <Badge className="bg-primary text-primary-foreground text-[10px] hover:bg-primary">
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
                    <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/10 text-[10px]">
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
              <div className="text-[10px] tracking-wider text-muted-foreground font-semibold">
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
  const data = CLAIM_TREND;
  const last = data[data.length - 1];

  return (
    <Card onClick={() => navigate("/msp-partner/widget/claim-development")} className="p-5 cursor-pointer hover:border-primary/40 transition-colors">
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
  const navigate = useNavigate();
  return (
    <Card onClick={() => navigate("/msp-partner/widget/segmentation")} className="p-5 cursor-pointer hover:border-primary/40 transition-colors">
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
    <Card onClick={() => navigate("/msp-partner/widget/top-services")} className="p-5 cursor-pointer hover:border-primary/40 transition-colors">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-foreground">Tjenester kundene trenger mest hjelp med</h3>
        <span className="text-xs text-muted-foreground">på tvers av portefølje</span>
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

// ---------- Campaigns widget ----------
type ActiveCampaign = {
  id: string;
  title: string;
  reach: number;
  accepted: number;
  startedDaysAgo: number;
  daysLeft: number;
  totalDays: number;
};

const ACTIVE_CAMPAIGNS: ActiveCampaign[] = [
  { id: "nis2", title: "NIS2-vurdering", reach: 42, accepted: 11, startedDaysAgo: 18, daysLeft: 4, totalDays: 30 },
  { id: "transparency", title: "Åpenhetsloven — redegjørelse", reach: 28, accepted: 9, startedDaysAgo: 12, daysLeft: 12, totalDays: 30 },
  { id: "dpia", title: "DPIA for AI-systemer", reach: 22, accepted: 4, startedDaysAgo: 5, daysLeft: 21, totalDays: 30 },
];

function CampaignsWidget() {
  const navigate = useNavigate();
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Megaphone className="h-4 w-4 text-primary" />
          <h3 className="text-base font-semibold">Pågående kampanjer</h3>
        </div>
        <Button variant="ghost" size="sm" onClick={() => navigate("/msp-partner/widget/campaigns")} className="gap-1 text-xs h-7">
          Lær mer <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="space-y-3.5">
        {ACTIVE_CAMPAIGNS.map((c) => {
          const acceptPct = Math.round((c.accepted / c.reach) * 100);
          const urgent = c.daysLeft <= 5;
          const soon = c.daysLeft <= 14 && !urgent;
          const barColor = urgent ? "bg-destructive" : soon ? "bg-warning" : "bg-primary";
          const textColor = urgent ? "text-destructive" : soon ? "text-warning" : "text-muted-foreground";

          return (
            <button
              key={c.id}
              type="button"
              onClick={() => navigate("/msp-messages")}
              className="w-full text-left hover:bg-muted/40 rounded-md p-1.5 -mx-1.5 transition-colors"
            >
              <div className="flex items-baseline justify-between gap-3 mb-1.5">
                <p className="text-sm font-medium text-foreground truncate">{c.title}</p>
                <span className={`text-[11px] tabular-nums ${textColor}`}>{c.daysLeft}d igjen</span>
              </div>
              <div className="relative h-1.5 bg-muted rounded-full overflow-hidden">
                <div className={`absolute inset-y-0 left-0 ${barColor} rounded-full`} style={{ width: `${acceptPct}%` }} />
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">{c.accepted} av {c.reach} svar · {acceptPct}%</p>
            </button>
          );
        })}
      </div>
    </Card>
  );
}

// ---------- News widget ----------
type NewsItem = {
  id: string;
  kind: "feature" | "course" | "webinar";
  title: string;
  meta: string;
  when: string;
};

const NEWS_ITEMS: NewsItem[] = [
  { id: "n1", kind: "feature", title: "Lara kan nå generere DPIA-utkast", meta: "Ny funksjon", when: "I dag" },
  { id: "n2", kind: "webinar", title: "NIS2 i praksis for MSP-er", meta: "Webinar · 28. mai · 10:00", when: "Om 7 dager" },
  { id: "n3", kind: "course", title: "Kurs: Trust Profile-salg for MSP", meta: "45 min · sertifisering", when: "Tilgjengelig" },
  { id: "n4", kind: "feature", title: "Automatisk leverandørkartlegging", meta: "Ny funksjon · Beta", when: "Denne uken" },
];

const NEWS_META: Record<NewsItem["kind"], { Icon: typeof Zap; label: string; cls: string }> = {
  feature: { Icon: Zap, label: "Nyhet", cls: "text-primary bg-primary/10" },
  course: { Icon: GraduationCap, label: "Kurs", cls: "text-success bg-success/10" },
  webinar: { Icon: Video, label: "Webinar", cls: "text-warning bg-warning/10" },
};

function NewsWidget() {
  const navigate = useNavigate();
  return (
    <Card onClick={() => navigate("/msp-partner/widget/news")} className="p-5 cursor-pointer hover:border-primary/40 transition-colors">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Newspaper className="h-4 w-4 text-primary" />
          <h3 className="text-base font-semibold">Nyheter</h3>
        </div>
        <span className="text-[11px] text-muted-foreground">fra Mynder</span>
      </div>

      <ul className="space-y-2.5">
        {NEWS_ITEMS.map((n) => {
          const { Icon, cls } = NEWS_META[n.kind];
          return (
            <li
              key={n.id}
              className="flex gap-3 hover:bg-muted/40 rounded-md p-1.5 -mx-1.5 transition-colors cursor-pointer"
            >
              <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${cls}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-sm font-medium text-foreground truncate">{n.title}</p>
                  <span className="text-[11px] text-muted-foreground shrink-0">{n.when}</span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">{n.meta}</p>
              </div>
            </li>
          );
        })}
      </ul>
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
          {!activeSuggestion && <LaraSuggestions onSelect={setActiveSuggestion} />}
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
            <ClaimDevelopmentChart />
            <PortfolioSegmentation />
          </div>

          <TopServicesWidget />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <CampaignsWidget />
            <NewsWidget />
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
