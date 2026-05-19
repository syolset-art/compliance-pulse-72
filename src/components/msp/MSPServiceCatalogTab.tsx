import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, TrendingUp, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  FRAMEWORK_CATALOG,
  type CoverageLevel,
} from "@/lib/frameworkCoverageCatalog";
import {
  FrameworkCoverageCard,
  type FrameworkSelection,
} from "./FrameworkCoverageCard";
import { MSPLaraServiceWizard } from "./MSPLaraServiceWizard";
import { CustomServiceDialog, type CustomServiceDraft, type ServiceMapping } from "./CustomServiceDialog";
import type { PartnerService } from "@/lib/serviceCatalog";
import { FRAMEWORK_CATALOG } from "@/lib/frameworkCoverageCatalog";

type AllSelections = Record<string, FrameworkSelection>;

interface ExtraService {
  id: string;
  name: string;
  description?: string;
  hours: number;
  fixedPrice?: number;
  source: "lara" | "manual";
  mappings: ServiceMapping[];
}

function formatNOK(n: number): string {
  return new Intl.NumberFormat("nb-NO").format(Math.round(n)) + " kr";
}

export function MSPServiceCatalogTab() {
  const [hourlyRate, setHourlyRate] = useState<number>(1500);
  const [laraOpen, setLaraOpen] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [extras, setExtras] = useState<ExtraService[]>([]);

  const [selections, setSelections] = useState<AllSelections>(() => {
    const init: AllSelections = {};
    const nis2 = FRAMEWORK_CATALOG.find((f) => f.id === "nis2");
    if (nis2) {
      const s: FrameworkSelection = { controls: {}, customCosts: [] };
      nis2.controlPoints.forEach((cp) => {
        s.controls[cp.id] = {
          enabled: true,
          level: "partial" as CoverageLevel,
          hours: cp.hoursByLevel.partial,
        };
      });
      init.nis2 = s;
    }
    return init;
  });

  const { grandHours, grandPrice, frameworksActive } = useMemo(() => {
    let h = 0;
    let p = 0;
    let n = 0;
    FRAMEWORK_CATALOG.forEach((fw) => {
      const sel = selections[fw.id];
      if (!sel) return;
      let fwHours = 0;
      let fwPrice = 0;
      let fwActive = false;
      const controls = sel.controls ?? {};
      fw.controlPoints.forEach((cp) => {
        const s = controls[cp.id];
        if (s?.enabled) {
          fwHours += s.hours;
          fwPrice += s.hours * hourlyRate;
          fwActive = true;
        }
      });
      (sel.customCosts ?? []).forEach((c) => {
        if (c.includeInOffer) {
          fwPrice += c.kind === "fixed" ? c.amount : c.amount * (c.hours ?? 0);
          fwActive = true;
        }
      });
      h += fwHours;
      p += fwPrice;
      if (fwActive) n += 1;
    });
    extras.forEach((e) => {
      h += e.hours;
      p += e.fixedPrice ?? e.hours * hourlyRate;
    });
    return { grandHours: h, grandPrice: p, frameworksActive: n };
  }, [selections, hourlyRate, extras]);

  const handleLaraComplete = (suggestions: PartnerService[]) => {
    const imported: ExtraService[] = suggestions.map((s) => {
      const isFixed = s.priceModel === "fixed" || s.priceModel === "monthly";
      return {
        id: s.id,
        name: s.name,
        description: s.description,
        hours: s.priceModel === "hourly" && s.price ? s.price : 8,
        fixedPrice: isFixed ? s.price : undefined,
        source: "lara" as const,
      };
    });
    setExtras((prev) => [...prev, ...imported]);
    setLaraOpen(false);
    toast.success(`${imported.length} tjenester importert fra Laras forslag`);
  };

  const handleManualSave = (draft: CustomServiceDraft) => {
    const newService: ExtraService = {
      id: `manual-${Date.now()}`,
      name: draft.name,
      description: draft.description,
      hours: draft.hours ?? 0,
      fixedPrice: draft.fixedPrice,
      source: "manual",
    };
    setExtras((prev) => [...prev, newService]);
    toast.success(`"${draft.name}" lagt til i katalogen`);
  };

  const removeExtra = (id: string) => {
    setExtras((prev) => prev.filter((e) => e.id !== id));
  };

  return (
    <div className="space-y-4">
      {/* Toppkort: timepris + samlet inntektspotensial */}
      <Card className="p-5 border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background">
        <div className="grid items-end gap-4 md:grid-cols-[260px_1fr_auto]">
          {/* Timepris */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Din timepris
            </label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={0}
                step={50}
                value={hourlyRate}
                onChange={(e) =>
                  setHourlyRate(Math.max(0, Number(e.target.value) || 0))
                }
                className="h-11 text-lg font-semibold tabular-nums"
              />
              <span className="text-sm text-muted-foreground whitespace-nowrap">kr / time</span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Brukes som standard for alle regelverk under.
            </p>
          </div>

          {/* Forklaring */}
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground inline-flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-primary" />
              Si hva dere leverer — Lara regner ut inntektspotensialet
            </p>
            <p className="text-[12px] text-muted-foreground leading-relaxed">
              Slå på regelverkene dere leverer på, hak av kontrollpunkter, og velg dekningsnivå:
              <span className="font-medium text-foreground"> Gap-analyse</span>,
              <span className="font-medium text-foreground"> Delvis dekning</span> eller
              <span className="font-medium text-foreground"> Full dekning</span>.
              Lara foreslår timetall — du kan justere fritt.
            </p>
          </div>

          {/* Totalt inntektspotensial */}
          <div className="text-right md:border-l md:border-border md:pl-4">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground inline-flex items-center gap-1 justify-end">
              <TrendingUp className="h-3 w-3" /> Samlet potensial
            </div>
            <div className="text-2xl font-bold text-foreground tabular-nums">
              {formatNOK(grandPrice)}
            </div>
            <div className="text-[11px] text-muted-foreground tabular-nums">
              {grandHours} timer · {frameworksActive} regelverk{extras.length > 0 ? ` · ${extras.length} egne` : ""}
            </div>
          </div>
        </div>
      </Card>

      {/* Handlingsknapper */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          onClick={() => setLaraOpen(true)}
          className="gap-2 bg-gradient-to-r from-primary to-primary/80"
        >
          <Sparkles className="h-4 w-4" />
          Forslag fra Lara
        </Button>
        <Button
          variant="outline"
          onClick={() => setManualOpen(true)}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Legg til egen tjeneste
        </Button>
        <span className="text-[11px] text-muted-foreground ml-1">
          La Lara foreslå et tjenestesett basert på din profil, eller legg til tjenester manuelt.
        </span>
      </div>

      {/* Egne / importerte tjenester */}
      {extras.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground">
              Egne tjenester ({extras.length})
            </h3>
          </div>
          <div className="space-y-2">
            {extras.map((e) => {
              const price = e.fixedPrice ?? e.hours * hourlyRate;
              return (
                <div
                  key={e.id}
                  className="flex items-center gap-3 rounded-md border border-border bg-card px-3 py-2"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-foreground truncate">{e.name}</span>
                      <Badge variant="secondary" className="text-[10px] gap-1 h-5">
                        {e.source === "lara" ? (
                          <><Sparkles className="h-3 w-3" /> Lara</>
                        ) : (
                          "Manuell"
                        )}
                      </Badge>
                    </div>
                    {e.description && (
                      <p className="text-[11px] text-muted-foreground truncate">{e.description}</p>
                    )}
                    <p className="text-[11px] text-muted-foreground tabular-nums">
                      {e.fixedPrice ? "Fast pris" : `${e.hours} timer × ${hourlyRate.toLocaleString("nb-NO")} kr`}
                    </p>
                  </div>
                  <div className="text-sm font-semibold tabular-nums text-foreground whitespace-nowrap">
                    {formatNOK(price)}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeExtra(e.id)}
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    aria-label="Fjern tjeneste"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Regelverk-liste */}
      <div className="space-y-2">
        {FRAMEWORK_CATALOG.map((fw) => (
          <FrameworkCoverageCard
            key={fw.id}
            framework={fw}
            hourlyRate={hourlyRate}
            selection={selections[fw.id] ?? { controls: {}, customCosts: [] }}
            onSelectionChange={(next) =>
              setSelections((prev) => ({ ...prev, [fw.id]: next }))
            }
          />
        ))}
      </div>

      <MSPLaraServiceWizard
        open={laraOpen}
        onOpenChange={setLaraOpen}
        onComplete={handleLaraComplete}
        onSkip={() => setLaraOpen(false)}
      />

      <CustomServiceDialog
        open={manualOpen}
        onOpenChange={setManualOpen}
        onSave={handleManualSave}
        defaultHourlyRate={hourlyRate}
      />
    </div>
  );
}
