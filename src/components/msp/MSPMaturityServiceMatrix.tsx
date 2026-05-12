import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Shield,
  Lock,
  Building2,
  Sparkles,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Zap,
  Eye,
  GraduationCap,
  FileCheck,
  Send,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MSPCreateOfferDialog } from "./MSPCreateOfferDialog";

type Filter = "all" | "potential" | "low";

interface ServiceOffering {
  icon: any;
  title: string;
  desc: string;
  cta?: string;
}

interface DomainRow {
  id: string;
  icon: any;
  name: string;
  frameworks: string[];
  score: number;
  ownership: "customer" | "potential";
  potentialLabel?: string;
  services: ServiceOffering[];
  highlightOffer?: { title: string; desc: string; primaryCta: string; secondaryCta?: string };
}

const DOMAINS: DomainRow[] = [
  {
    id: "privacy",
    icon: Shield,
    name: "Personvern",
    frameworks: ["GDPR", "Personopplysningsloven"],
    score: 42,
    ownership: "customer",
    services: [],
  },
  {
    id: "infosec",
    icon: Lock,
    name: "Informasjonssikkerhet",
    frameworks: ["ISO 27001", "NSM"],
    score: 53,
    ownership: "potential",
    services: [
      { icon: FileCheck, title: "ISO 27001-klargjøring", desc: "Strukturert løp mot sertifisering. Vi tar styringssystem og dokumentasjon." },
      { icon: Zap, title: "Penetrasjonstest", desc: "Årlig ekstern test av applikasjoner og infrastruktur." },
      { icon: Eye, title: "SOC / overvåkning 24/7", desc: "Kontinuerlig deteksjon og hendelseshåndtering." },
      { icon: GraduationCap, title: "Awareness-program", desc: "Trening, phishing-simulering og rapportering." },
    ],
  },
  {
    id: "nis2",
    icon: Building2,
    name: "NIS2",
    frameworks: [],
    score: 18,
    ownership: "potential",
    potentialLabel: "Klargjøringsmulighet",
    services: [],
    highlightOffer: {
      title: "NIS2-klargjøring som tjeneste",
      desc: "Kunden er omfattet av NIS2 men har lav modenhet. Lara har laget et utkast til tilbud: gap-analyse, risikovurdering, dokumentasjon og rapporteringsrutiner. Du kan justere innhold, omfang og pris før du sender til kunden.",
      primaryCta: "Tilby full leveranse",
    },
  },
  {
    id: "ai",
    icon: Sparkles,
    name: "AI Governance",
    frameworks: ["EU AI Act", "ISO 42001"],
    score: 0,
    ownership: "potential",
    potentialLabel: "Klargjøringsmulighet",
    services: [],
    highlightOffer: {
      title: "AI Governance-rammeverk",
      desc: "Kunden har ennå ikke etablert AI-styring. Lara har laget et utkast til tilbud: kartlegging av AI-bruk, klassifisering mot EU AI Act, og oppsett av policy og kontroller. Du kan justere og sende til kunden.",
      primaryCta: "Tilby leveranse",
    },
  },
  {
    id: "continuity",
    icon: RefreshCw,
    name: "Forretningskontinuitet",
    frameworks: ["ISO 22301", "DORA"],
    score: 67,
    ownership: "customer",
    services: [],
  },
];

function scoreColor(s: number) {
  if (s >= 75) return "bg-success";
  if (s >= 50) return "bg-warning";
  return "bg-destructive";
}

function overallLabel(s: number) {
  if (s >= 75) return "Høy";
  if (s >= 50) return "Middels";
  return "Lav";
}

export function MSPMaturityServiceMatrix() {
  const [filter, setFilter] = useState<Filter>("all");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ infosec: true });
  const [offerCtx, setOfferCtx] = useState<{
    open: boolean;
    domainName?: string;
    serviceTitle?: string;
    variant?: "Full leveranse" | "Co-delivery" | "Tjeneste";
  }>({ open: false });

  const openOffer = (ctx: Omit<typeof offerCtx, "open">) =>
    setOfferCtx({ open: true, ...ctx });

  const overall = Math.round(DOMAINS.reduce((a, d) => a + d.score, 0) / DOMAINS.length);
  const activeFrameworks = 6;
  const totalFrameworks = 8;
  const serviceOpportunities = DOMAINS.filter(d => d.ownership === "potential").length;

  const visible = DOMAINS.filter(d => {
    if (filter === "potential") return d.ownership === "potential";
    if (filter === "low") return d.score < 50;
    return true;
  });

  return (
    <Card className="p-5 space-y-5 border-primary/20">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-foreground">Modenhetsbilde og tjenestemuligheter</h3>
        </div>
        <p className="text-[11px] text-muted-foreground whitespace-nowrap">Sist oppdatert 17. april 2026</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card className="p-3 bg-muted/30 border-border/60">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Samlet modenhet</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-foreground">{overall}%</span>
            <span className="text-xs text-muted-foreground">{overallLabel(overall)}</span>
          </div>
        </Card>
        <Card className="p-3 bg-muted/30 border-border/60">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Aktive regelverk</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-foreground">{activeFrameworks} / {totalFrameworks}</span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">på tvers av områder</p>
        </Card>
        <Card className="p-3 bg-muted/30 border-border/60">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Tjenestemuligheter</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-foreground">{serviceOpportunities}</span>
          </div>
          <p className="text-[11px] text-primary mt-0.5">matcher din portefølje</p>
        </Card>
      </div>

      <p className="text-[13px] text-muted-foreground leading-relaxed">
        Du ser kundens modenhet per kontrollområde. Detaljerte vurderinger og enkeltkontroller eier kunden selv. Som
        partner kan du tilby tjenester som løfter områder kunden ikke har tid eller kompetanse til å håndtere internt.
      </p>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-muted-foreground">Vis:</span>
        {[
          { id: "all" as Filter, label: "Alle områder" },
          { id: "potential" as Filter, label: "Med tjenestepotensial" },
          { id: "low" as Filter, label: "Lav modenhet" },
        ].map(f => (
          <Button
            key={f.id}
            size="sm"
            variant={filter === f.id ? "default" : "outline"}
            className="h-7 text-xs rounded-full"
            onClick={() => setFilter(f.id)}
          >
            {f.label}
          </Button>
        ))}
      </div>

      {/* Domain rows */}
      <div className="space-y-3">
        {visible.map(d => {
          const Icon = d.icon;
          const isOpen = !!expanded[d.id];
          const canExpand = d.services.length > 0 || !!d.highlightOffer;
          return (
            <Card key={d.id} className="p-4 border-border/70 hover:border-primary/30 transition-colors">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex items-center gap-2 flex-wrap min-w-0 flex-1">
                  <span className="text-sm font-semibold text-foreground">{d.name}</span>
                  {d.potentialLabel && (
                    <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/30">
                      {d.potentialLabel}
                    </Badge>
                  )}
                  {d.frameworks.map(f => (
                    <Badge key={f} variant="outline" className="text-[10px] bg-muted/50">
                      {f}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="mt-3 flex items-center gap-3">
                <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className={cn("h-full transition-all", scoreColor(d.score))} style={{ width: `${d.score}%` }} />
                </div>
                <span className="text-sm font-semibold text-foreground tabular-nums">{d.score}%</span>
                {d.ownership === "customer" ? (
                  <span className="text-xs text-muted-foreground whitespace-nowrap">Eies av kunde</span>
                ) : (
                  canExpand && (
                    <button
                      type="button"
                      onClick={() => setExpanded(p => ({ ...p, [d.id]: !p[d.id] }))}
                      className="text-xs text-primary font-medium flex items-center gap-0.5 whitespace-nowrap hover:underline"
                    >
                      {d.highlightOffer ? "Vis tilbud" : "Vis tjenester"}
                      {isOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    </button>
                  )
                )}
              </div>

              {isOpen && d.services.length > 0 && (
                <div className="mt-4 pt-4 border-t border-border/60 space-y-3">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">
                    Tjenester du kan tilby på dette området
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {d.services.map(s => {
                      const SIcon = s.icon;
                      return (
                        <div key={s.title} className="rounded-lg border border-border/60 p-3 space-y-2">
                          <div className="flex items-center gap-2">
                            <SIcon className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-[13px] font-medium text-foreground">{s.title}</span>
                          </div>
                          <p className="text-[12px] text-muted-foreground leading-snug">{s.desc}</p>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs gap-1"
                            onClick={() => openOffer({ domainName: d.name, serviceTitle: s.title, variant: "Tjeneste" })}
                          >
                            <Send className="h-3 w-3" /> Lag tilbud
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {isOpen && d.highlightOffer && (
                <div className="mt-4 pt-4 border-t border-border/60">
                  <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-2">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-3.5 w-3.5 text-primary" />
                        <span className="text-[13px] font-semibold text-foreground">{d.highlightOffer.title}</span>
                      </div>
                      <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/30 gap-1">
                        <Sparkles className="h-2.5 w-2.5" /> Utkast laget av Lara
                      </Badge>
                    </div>
                    <p className="text-[12px] text-muted-foreground leading-snug">{d.highlightOffer.desc}</p>
                    <div className="flex flex-wrap gap-2 pt-1">
                      <Button
                        size="sm"
                        className="h-7 text-xs gap-1"
                        onClick={() => openOffer({
                          domainName: d.name,
                          serviceTitle: d.highlightOffer!.title,
                          variant: "Full leveranse",
                        })}
                      >
                        <Send className="h-3 w-3" /> Lag tilbud
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      <MSPCreateOfferDialog
        open={offerCtx.open}
        onOpenChange={(o) => setOfferCtx(s => ({ ...s, open: o }))}
        domainName={offerCtx.domainName}
        serviceTitle={offerCtx.serviceTitle}
        variant={offerCtx.variant}
      />
    </Card>
  );
}
