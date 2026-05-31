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
    body: "Hvert kontrollpunkt du leverer på, hever kundens modenhet i berørte regelverk.",
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
    <div className="space-y-10">
      {/* Hero */}
      <div className="space-y-3">
        <h2 className="text-2xl font-semibold text-foreground leading-tight">
          Gjør eksisterende IT- og sikkerhetstjenester om til målbar compliance-leveranse
        </h2>
        <p className="text-base text-foreground/80 max-w-3xl leading-relaxed">
          Tjenestene du allerede leverer mappes mot kontrollpunkter i kundens valgte regelverk —
          og dokumenteres automatisk mens du jobber.
        </p>
      </div>

      {/* Visuell sammenheng */}
      <ServiceFlowDiagram />

      {/* Steg */}
      <div className="space-y-4">
        {STEPS.map((step, i) => {
          const Icon = step.icon;
          return (
            <Card key={i} className="p-5 flex items-start gap-5">
              <div className="relative shrink-0">
                <div className="h-12 w-12 rounded-md bg-primary/10 text-primary flex items-center justify-center">
                  <Icon className="h-6 w-6" aria-hidden="true" />
                </div>
                <div className="absolute -top-2 -left-2 h-6 w-6 rounded-full bg-foreground text-background text-sm font-semibold flex items-center justify-center tabular-nums">
                  {i + 1}
                </div>
              </div>
              <div className="min-w-0 space-y-2">
                <h3 className="text-lg font-semibold text-foreground">{step.title}</h3>
                <p className="text-base text-foreground/80 leading-relaxed">{step.body}</p>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Outcomes */}
      <div className="space-y-4">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-foreground">Slik berikes kundens trust profile</h3>
          <p className="text-base text-foreground/80 leading-relaxed">
            Når du leverer, oppdateres kundens trust profile automatisk.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {OUTCOMES.map((o, i) => {
            const Icon = o.icon;
            const toneClass =
              o.tone === "success"
                ? "bg-success/10 text-success"
                : "bg-primary/10 text-primary";
            return (
              <Card key={i} className="p-5 space-y-3">
                <div className={`h-11 w-11 rounded-md flex items-center justify-center ${toneClass}`}>
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <h4 className="text-lg font-semibold text-foreground">{o.title}</h4>
                <p className="text-base text-foreground/80 leading-relaxed">{o.body}</p>
              </Card>
            );
          })}
        </div>
      </div>

      {/* CTA-stripe */}
      <Card className="p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-muted/30">
        <div className="space-y-1">
          <p className="text-lg font-semibold text-foreground">Klar til å sette opp dine tjenester?</p>
          <p className="text-base text-foreground/80 leading-relaxed">
            Start med katalogen, eller juster standard timepris og tilbudsmal først.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button className="h-11 text-base gap-2" onClick={() => onNavigate?.("catalog")}>
            Gå til tjenestekatalog <ArrowRight className="h-5 w-5" aria-hidden="true" />
          </Button>
          <Button variant="outline" className="h-11 text-base" onClick={() => onNavigate?.("settings")}>
            Sett standard timepris
          </Button>
        </div>
      </Card>
    </div>
  );
}
