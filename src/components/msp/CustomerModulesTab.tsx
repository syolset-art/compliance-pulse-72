import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Layers, Shield, Package, Server, Globe, Plus, ExternalLink } from "lucide-react";
import { frameworks as ALL_FRAMEWORKS } from "@/lib/frameworkDefinitions";
import { EditActiveFrameworksDialog } from "@/components/regulations/EditActiveFrameworksDialog";
import { supabase } from "@/integrations/supabase/client";

interface CustomerModulesTabProps {
  customerId: string;
  customerName: string;
  activeFrameworkIds: string[];
  onUpdate?: () => void;
}

interface ModuleDef {
  key: string;
  title: string;
  icon: any;
  description: string;
  activated: boolean;
  meta?: string; // e.g. "3 aktive: GDPR, ISO 27001"
  usage?: { current: number; max: number; label: string };
  price: number | null; // null = included / free
  priceLabel?: string; // e.g. "Inkludert"
  primaryAction: { label: string; onClick: () => void };
  secondaryAction?: { label: string; onClick: () => void };
}

function formatPrice(n: number) {
  return `${n.toLocaleString("nb-NO")} kr`;
}

export function CustomerModulesTab({ customerId, customerName, activeFrameworkIds }: CustomerModulesTabProps) {
  const frameworkNames = useMemo(() => {
    return activeFrameworkIds
      .map((id) => ALL_FRAMEWORKS.find((f) => f.id === id)?.name || id)
      .filter(Boolean);
  }, [activeFrameworkIds]);

  const slug = customerName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const notImplemented = (label: string) => () => toast.info(`${label} — kommer`, { description: "Denne handlingen er ikke koblet på i prototypen." });

  const modules: ModuleDef[] = [
    {
      key: "core",
      title: "Mynder Core",
      icon: Layers,
      description: "Grunnmodulen. Oppgaver, avvik, samsvar, behandlingsprotokoll og dokumenter.",
      activated: true,
      usage: { current: 21, max: 50, label: "systemer i bruk" },
      price: 2499,
      primaryAction: { label: "Endre nivå", onClick: notImplemented("Endre nivå") },
      secondaryAction: { label: "Avbestill", onClick: notImplemented("Avbestill Core") },
    },
    {
      key: "regulations",
      title: "Regelverk",
      icon: Shield,
      description: "Kravene fra lover og standarder, koblet mot deres eget arbeid.",
      activated: activeFrameworkIds.length > 0,
      meta: activeFrameworkIds.length > 0
        ? `${activeFrameworkIds.length} aktive: ${frameworkNames.slice(0, 3).join(", ")}${frameworkNames.length > 3 ? "…" : ""}`
        : "Ingen aktive regelverk",
      price: activeFrameworkIds.length * 836, // demo pricing
      primaryAction: { label: "Legg til regelverk", onClick: notImplemented("Legg til regelverk") },
    },
    {
      key: "vendors",
      title: "Leverandørmodul",
      icon: Package,
      description: "Kartlegg leverandørene deres og følg opp dokumentasjonen de skal levere.",
      activated: true,
      meta: "11 leverandører registrert",
      price: 1089,
      primaryAction: { label: "Åpne modulen", onClick: notImplemented("Åpne Leverandørmodul") },
      secondaryAction: { label: "Avbestill", onClick: notImplemented("Avbestill Leverandørmodul") },
    },
    {
      key: "assets",
      title: "Assets",
      icon: Server,
      description: "Oversikt over IT-eiendelene og systemene organisasjonen bruker.",
      activated: true,
      meta: "21 registrerte eiendeler",
      price: 690,
      primaryAction: { label: "Åpne modulen", onClick: notImplemented("Åpne Assets") },
      secondaryAction: { label: "Avbestill", onClick: notImplemented("Avbestill Assets") },
    },
    {
      key: "trust-profile",
      title: "Trust Profile",
      icon: Globe,
      description: "Offentlig profil som viser kunder og partnere hvordan dere jobber med etterlevelse av lover og regler.",
      activated: true,
      meta: `trust.mynder.no/${slug || "kunde"}`,
      price: null,
      priceLabel: "Inkludert i Core",
      primaryAction: { label: "Åpne modulen", onClick: notImplemented("Åpne Trust Profile") },
    },
  ];

  const monthlyTotal = modules.reduce((sum, m) => sum + (m.activated && m.price ? m.price : 0), 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Moduler</h2>
          <p className="text-sm text-muted-foreground max-w-2xl mt-0.5">
            Se hva {customerName} har aktivert, og hva som kan legges til. Aktiverte moduler dukker opp i menyen. Endringer påvirker månedsprisen.
          </p>
        </div>
        <div className="text-right shrink-0">
          <div className="text-xs text-muted-foreground">Månedspris</div>
          <div className="text-lg font-semibold text-foreground">{formatPrice(monthlyTotal)}</div>
        </div>
      </div>

      <div className="space-y-3">
        {modules.map((m) => {
          const Icon = m.icon;
          return (
            <Card key={m.key} className="p-4 sm:p-5">
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="h-4.5 w-4.5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-semibold text-foreground">{m.title}</h3>
                      {m.activated ? (
                        <Badge variant="secondary" className="bg-success/15 text-success border-transparent text-[10px] px-1.5 py-0">
                          Aktivert
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-muted-foreground">
                          Ikke aktivert
                        </Badge>
                      )}
                      {m.usage && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-primary/30 text-primary">
                          Inntil {m.usage.max} {m.usage.label}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{m.description}</p>

                    {m.meta && (
                      <div className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                        {m.key === "trust-profile" && <ExternalLink className="h-3 w-3" />}
                        <span>{m.meta}</span>
                      </div>
                    )}

                    {m.usage && (
                      <div className="mt-2 space-y-1">
                        <div className="text-xs text-muted-foreground">
                          {m.usage.current} av {m.usage.max} {m.usage.label}
                        </div>
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${Math.min(100, (m.usage.current / m.usage.max) * 100)}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-row sm:flex-col items-end justify-between sm:justify-start sm:text-right gap-2 sm:min-w-[140px]">
                  <div>
                    {m.price === null ? (
                      <div>
                        <div className="text-base font-semibold text-primary">Gratis</div>
                        <div className="text-[11px] text-muted-foreground">{m.priceLabel}</div>
                      </div>
                    ) : (
                      <div>
                        <div className="text-base font-semibold text-foreground">{formatPrice(m.price)}</div>
                        <div className="text-[11px] text-muted-foreground">per måned</div>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {m.secondaryAction && (
                      <button
                        onClick={m.secondaryAction.onClick}
                        className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                      >
                        {m.secondaryAction.label}
                      </button>
                    )}
                    <Button size="sm" variant="outline" onClick={m.primaryAction.onClick}>
                      {m.primaryAction.label === "Legg til regelverk" && <Plus className="h-3.5 w-3.5 mr-1" />}
                      {m.primaryAction.label}
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
