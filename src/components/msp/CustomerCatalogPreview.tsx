import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, CheckCircle2, Sparkles, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ServiceMapping, ServiceActivity } from "./CustomServiceDialog";

export interface CustomerVisibleService {
  id: string;
  name: string;
  description?: string;
  activities: ServiceActivity[];
  mappings: ServiceMapping[];
  templateCode?: string;
  source: "library" | "manual";
}

interface Props {
  services: CustomerVisibleService[];
}

/**
 * Renderer hvordan tjenestene ser ut fra KUNDENS perspektiv.
 * Skjuler alltid: timepris, interne timer, marginer, fastpris.
 * Viser: navn, beskrivelse, aktiviteter (uten timer), regelverk-dekning,
 * og Lara-flagg på tjenester som mangler innhold.
 */
export function CustomerCatalogPreview({ services }: Props) {
  if (services.length === 0) {
    return (
      <Card className="p-8 text-center text-sm text-muted-foreground">
        Ingen tjenester i katalogen ennå — kunden ser en tom oversikt.
      </Card>
    );
  }

  return (
    <Card className="p-4 border-dashed border-primary/30 bg-primary/[0.02]">
      {/* Preview-banner */}
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border">
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/15">
          <Shield className="h-3 w-3 text-primary" />
        </span>
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground">Slik ser kunden tjenestene dine</p>
          <p className="text-[11px] text-muted-foreground">
            Pris, timer og interne marginer er skjult. Aktiviteter vises som leveranseinnhold.
          </p>
        </div>
        <Badge variant="outline" className="text-[10px]">Forhåndsvisning</Badge>
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {services.map((s) => {
          const issues = detectIssues(s);
          return (
            <div
              key={s.id}
              className={cn(
                "rounded-lg border border-border bg-card p-3 flex flex-col gap-2",
                issues.length > 0 && "border-warning/40",
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h4 className="text-sm font-semibold text-foreground leading-tight">{s.name}</h4>
                  {s.description && (
                    <p className="text-[11px] text-muted-foreground mt-1 leading-snug line-clamp-2">
                      {s.description}
                    </p>
                  )}
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-success/10 text-success px-1.5 py-0.5 text-[10px] font-medium whitespace-nowrap">
                  <CheckCircle2 className="h-2.5 w-2.5" /> Aktiv
                </span>
              </div>

              {/* Aktiviteter (uten timer) */}
              {s.activities.length > 0 && (
                <div className="space-y-0.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Hva inngår
                  </p>
                  <ul className="space-y-0.5">
                    {s.activities.slice(0, 5).map((a, i) => (
                      <li key={i} className="text-[11px] text-foreground/80 flex items-start gap-1.5">
                        <span className="text-success mt-0.5">·</span>
                        <span>{a.label}</span>
                      </li>
                    ))}
                    {s.activities.length > 5 && (
                      <li className="text-[10px] text-muted-foreground pl-3">
                        +{s.activities.length - 5} til
                      </li>
                    )}
                  </ul>
                </div>
              )}

              {/* Regelverk-dekning */}
              {s.mappings.length > 0 && (
                <div className="mt-auto pt-2 border-t border-border">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Dekker krav i
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {dedupeFrameworks(s.mappings).slice(0, 4).map((fw, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-foreground/70"
                      >
                        {fw}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Lara-advarsel hvis tjenesten ser tom ut */}
              {issues.length > 0 && (
                <div className="rounded-md bg-warning/10 border border-warning/30 px-2 py-1.5 flex items-start gap-1.5">
                  <Sparkles className="h-3 w-3 text-warning mt-0.5 shrink-0" />
                  <div className="text-[10px] text-foreground/80">
                    <span className="font-semibold text-warning inline-flex items-center gap-1">
                      <AlertCircle className="h-2.5 w-2.5" /> Lara
                    </span>
                    <span className="ml-1">{issues[0]}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function dedupeFrameworks(mappings: ServiceMapping[]): string[] {
  return Array.from(new Set(mappings.map((m) => m.frameworkShortName)));
}

function detectIssues(s: CustomerVisibleService): string[] {
  const out: string[] = [];
  if (!s.description) out.push("Mangler beskrivelse — kunden ser ikke hva tjenesten handler om.");
  if (s.activities.length === 0) out.push("Ingen aktiviteter — kunden ser ikke hva som leveres.");
  if (s.mappings.length === 0) out.push("Ingen kobling til regelverk — vanskelig å vise verdi.");
  return out;
}
