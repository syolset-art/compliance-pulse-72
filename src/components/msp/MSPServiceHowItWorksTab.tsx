import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Wrench,
  GitBranch,
  FileText,
  ClipboardCheck,
  FileDown,
  TrendingUp,
  Users,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import { ServiceFlowDiagram } from "./ServiceFlowDiagram";

interface Props {
  onNavigate?: (tab: "catalog" | "settings") => void;
}

const STEPS = [
  {
    icon: Wrench,
    title: "Definer dine tjenester",
    body: "Beskriv IT- og sikkerhetstjenestene du allerede leverer i dag — backup, MDR, identitetsstyring, drift og mer. Legg inn aktiviteter, timeestimat og hvilke kontroller de dekker.",
  },
  {
    icon: GitBranch,
    title: "Auto-mapping mot regelverk",
    body: "Lara mapper hver tjeneste mot kontrollpunkter på tvers av kundens valgte regelverk (NIS2, ISO 27001, GDPR m.fl.) — én tjeneste kan dekke kontroller i flere regelverk samtidig.",
  },
  {
    icon: FileText,
    title: "Bli en del av tilbudet",
    body: "Tjenestene blir byggeklosser i tilbudet til kunden. Pris og omfang beregnes fra dine standard timesatser, og kunden ser tydelig hvilke kontrollpunkter som dekkes.",
  },
  {
    icon: ClipboardCheck,
    title: "Lever og dokumenter underveis",
    body: "Når du utfører arbeidet, besvarer du korte spørsmål knyttet til hver aktivitet. Svarene mappes automatisk til kontrollpunkter på tvers av alle valgte regelverk — uten dobbeltarbeid.",
  },
  {
    icon: FileDown,
    title: "Sluttrapport til kunden",
    body: "Når leveransen er ferdig, genereres en sluttrapport automatisk med utført arbeid, bevis og oppdatert modenhetsstatus. Last ned og send til kunden i ett klikk.",
  },
];

const OUTCOMES = [
  {
    icon: TrendingUp,
    title: "Modenhet øker",
    body: "Hvert kontrollpunkt du leverer på, hever kundens modenhetsnivå (0–4) i berørte regelverk.",
    tone: "success" as const,
  },
  {
    icon: Users,
    title: "Synlig leverandør",
    body: "Kunden ser tydelig hvilke kontroller du som partner står bak — du blir en synlig del av deres compliance-historie.",
    tone: "primary" as const,
  },
  {
    icon: ShieldCheck,
    title: "Automatisk bevis",
    body: "Svar og dokumentasjon fra leveransen blir bevis i kundens trust profile — alltid oppdatert, alltid sporbart.",
    tone: "primary" as const,
  },
];

export function MSPServiceHowItWorksTab({ onNavigate }: Props) {
  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">
          Gjør eksisterende IT- og sikkerhetstjenester om til målbar compliance-leveranse
        </h2>
        <p className="text-sm text-muted-foreground max-w-3xl">
          Tjenestene du allerede leverer mappes mot kontrollpunkter i kundens valgte regelverk —
          og dokumenteres automatisk mens du jobber.
        </p>
      </div>

      {/* Steg */}
      <div className="space-y-3">
        {STEPS.map((step, i) => {
          const Icon = step.icon;
          return (
            <Card key={i} className="p-4 flex items-start gap-4">
              <div className="relative shrink-0">
                <div className="h-10 w-10 rounded-md bg-primary/10 text-primary flex items-center justify-center">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="absolute -top-1.5 -left-1.5 h-5 w-5 rounded-full bg-foreground text-background text-xs font-semibold flex items-center justify-center tabular-nums">
                  {i + 1}
                </div>
              </div>
              <div className="min-w-0 space-y-1">
                <h3 className="text-base font-semibold text-foreground">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.body}</p>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Outcomes */}
      <div className="space-y-3">
        <div>
          <h3 className="text-base font-semibold text-foreground">Slik berikes kundens trust profile</h3>
          <p className="text-sm text-muted-foreground">
            Når du leverer, oppdateres kundens trust profile automatisk.
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {OUTCOMES.map((o, i) => {
            const Icon = o.icon;
            const toneClass =
              o.tone === "success"
                ? "bg-success/10 text-success"
                : "bg-primary/10 text-primary";
            return (
              <Card key={i} className="p-4 space-y-2">
                <div className={`h-9 w-9 rounded-md flex items-center justify-center ${toneClass}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <h4 className="text-base font-semibold text-foreground">{o.title}</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">{o.body}</p>
              </Card>
            );
          })}
        </div>
      </div>

      {/* CTA-stripe */}
      <Card className="p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-muted/30">
        <div>
          <p className="text-base font-semibold text-foreground">Klar til å sette opp dine tjenester?</p>
          <p className="text-sm text-muted-foreground">
            Start med katalogen, eller juster standard timepris og tilbudsmal først.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" className="h-10 text-sm gap-1.5" onClick={() => onNavigate?.("catalog")}>
            Gå til tjenestekatalog <ArrowRight className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="outline" className="h-10 text-sm" onClick={() => onNavigate?.("settings")}>
            Sett standard timepris
          </Button>
        </div>
      </Card>
    </div>
  );
}
