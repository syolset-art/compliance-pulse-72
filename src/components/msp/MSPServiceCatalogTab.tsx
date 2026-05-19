import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, TrendingUp, Plus, Trash2, Pencil, ChevronDown, ChevronUp, Settings2 } from "lucide-react";
import { toast } from "sonner";
import {
  FRAMEWORK_CATALOG,
  type CoverageLevel,
} from "@/lib/frameworkCoverageCatalog";
import {
  FrameworkCoverageCard,
  type FrameworkSelection,
} from "./FrameworkCoverageCard";
import { CustomServiceDialog, type CustomServiceDraft, type ServiceMapping, type ServiceActivity } from "./CustomServiceDialog";
import { ServiceLibraryBrowser } from "./ServiceLibraryBrowser";
import type { ServiceTemplate, PartnerContext } from "@/lib/serviceLibrary";

type AllSelections = Record<string, FrameworkSelection>;

interface ExtraService {
  id: string;
  name: string;
  description?: string;
  hours: number;
  activities: ServiceActivity[];
  source: "library" | "manual";
  templateCode?: string;
  templateId?: string;
  templateVersion?: string;
  mappings: ServiceMapping[];
}

function formatNOK(n: number): string {
  return new Intl.NumberFormat("nb-NO").format(Math.round(n)) + " kr";
}

export function MSPServiceCatalogTab() {
  const [hourlyRate, setHourlyRate] = useState<number>(1500);
  const [manualOpen, setManualOpen] = useState(false);
  const [extras, setExtras] = useState<ExtraService[]>([]);
  const [showCalculator, setShowCalculator] = useState(false);

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
    if (showCalculator) {
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
    }
    extras.forEach((e) => {
      h += e.hours;
      p += e.fixedPrice ?? e.hours * hourlyRate;
    });
    return { grandHours: h, grandPrice: p, frameworksActive: n };
  }, [selections, hourlyRate, extras, showCalculator]);

  const adoptedIds = useMemo(
    () => new Set(extras.map((e) => e.templateId).filter(Boolean) as string[]),
    [extras],
  );

  // Partner-kontekst for Lara-kuratering. Pr nå statisk;
  // kan kobles til useMSPCustomers senere.
  const partnerContext: PartnerContext = useMemo(
    () => ({
      partnerType: undefined,
      activeScopes: ["NO", "EU", "global"],
    }),
    [],
  );

  const adoptTemplate = (template: ServiceTemplate) => {
    if (adoptedIds.has(template.id)) return;
    const hoursAvg = Math.round((template.estimatedHours.min + template.estimatedHours.max) / 2);
    const mappings: ServiceMapping[] = template.mappings.flatMap((m) => {
      const fw = FRAMEWORK_CATALOG.find((f) => f.id === m.frameworkId);
      return m.controlIds.map((cid) => {
        const cp = fw?.controlPoints.find((c) => c.id === cid);
        return {
          frameworkId: m.frameworkId,
          frameworkShortName: fw?.shortName ?? m.frameworkLabel,
          controlId: cid,
          controlLabel: cp?.label ?? cid,
        };
      });
    });
    const next: ExtraService = {
      id: `adopt-${template.id}-${Date.now()}`,
      name: template.name,
      description: template.shortDescription,
      hours: hoursAvg,
      // Ingen fastpris — pris beregnes alltid fra timer × partnerens timepris.
      source: "library",
      templateCode: template.code,
      templateId: template.id,
      templateVersion: template.version,
      mappings,
    };
    setExtras((prev) => [...prev, next]);
    toast.success(`${template.code} · ${template.name} adoptert`, {
      description: "Justér timer og aktiviteter i selve tilbudet — pris beregnes fra timepris.",
    });
  };

  const handleManualSave = (draft: CustomServiceDraft) => {
    const newService: ExtraService = {
      id: `manual-${Date.now()}`,
      name: draft.name,
      description: draft.description,
      hours: draft.hours ?? 0,
      fixedPrice: draft.fixedPrice,
      source: "manual",
      mappings: draft.mappings,
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
                onChange={(e) => setHourlyRate(Math.max(0, Number(e.target.value) || 0))}
                className="h-11 text-lg font-semibold tabular-nums"
              />
              <span className="text-sm text-muted-foreground whitespace-nowrap">kr / time</span>
            </div>
            <p className="text-[11px] text-muted-foreground">Brukes som grunnlag i alle estimat under.</p>
          </div>

          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground inline-flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-primary" />
              Adopter ferdige tjenester fra Mynders bibliotek
            </p>
            <p className="text-[12px] text-muted-foreground leading-relaxed">
              19 kuraterte tjenester på tvers av <span className="font-medium text-foreground">universell basis</span>,
              <span className="font-medium text-foreground"> MSP</span> og <span className="font-medium text-foreground">MSSP</span> — pluss
              land-spesifikke for NO/SE/NL/AU. Lara sorterer etter partnertype og kundeportefølje. Du kan også legge til
              egne tjenester.
            </p>
          </div>

          <div className="text-right md:border-l md:border-border md:pl-4">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground inline-flex items-center gap-1 justify-end">
              <TrendingUp className="h-3 w-3" /> Samlet potensial
            </div>
            <div className="text-2xl font-bold text-foreground tabular-nums">{formatNOK(grandPrice)}</div>
            <div className="text-[11px] text-muted-foreground tabular-nums">
              {grandHours} timer · {extras.length} adoptert{showCalculator ? ` · ${frameworksActive} regelverk` : ""}
            </div>
          </div>
        </div>
      </Card>

      {/* Handlingsknapper */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => setManualOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Legg til egen tjeneste
        </Button>
      </div>

      {/* Adopterte / egne tjenester */}
      {extras.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground">Min katalog ({extras.length})</h3>
            <span className="text-[11px] text-muted-foreground">Tilpass pris og aktiviteter i selve tilbudet</span>
          </div>
          <div className="space-y-2">
            {extras.map((e) => {
              const price = e.fixedPrice ?? e.hours * hourlyRate;
              return (
                <div key={e.id} className="flex items-center gap-3 rounded-md border border-border bg-card px-3 py-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {e.templateCode && (
                        <span className="inline-flex items-center rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                          {e.templateCode}
                        </span>
                      )}
                      <span className="text-sm font-medium text-foreground truncate">{e.name}</span>
                      <Badge variant="secondary" className="text-[10px] gap-1 h-5">
                        {e.source === "library" ? (<><Sparkles className="h-3 w-3" /> Bibliotek</>) : "Manuell"}
                      </Badge>
                      {e.templateVersion && (
                        <span className="text-[10px] text-muted-foreground">v{e.templateVersion}</span>
                      )}
                    </div>
                    {e.description && (
                      <p className="text-[11px] text-muted-foreground truncate">{e.description}</p>
                    )}
                    {e.mappings.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1 mt-1">
                        {e.mappings.slice(0, 6).map((m, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1 rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground"
                            title={`${m.frameworkShortName} · ${m.controlId} ${m.controlLabel}`}
                          >
                            <span className="font-semibold text-foreground/70">{m.frameworkShortName}</span>
                            <span>{m.controlId}</span>
                          </span>
                        ))}
                        {e.mappings.length > 6 && (
                          <span className="text-[10px] text-muted-foreground">+{e.mappings.length - 6}</span>
                        )}
                      </div>
                    )}
                    <p className="text-[11px] text-muted-foreground tabular-nums mt-1">
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

      {/* Bibliotek */}
      <ServiceLibraryBrowser
        context={partnerContext}
        adoptedIds={adoptedIds}
        onAdopt={adoptTemplate}
        hourlyRate={hourlyRate}
      />

      {/* Avansert: bygg fra regelverk */}
      <div className="pt-2">
        <button
          type="button"
          onClick={() => setShowCalculator((v) => !v)}
          className="inline-flex items-center gap-2 text-[12px] text-muted-foreground hover:text-foreground transition-colors"
        >
          <Settings2 className="h-3.5 w-3.5" />
          Avansert: bygg fra regelverk og kontrollpunkter
          {showCalculator ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>
        {showCalculator && (
          <div className="space-y-2 mt-3">
            <p className="text-[11px] text-muted-foreground italic">
              Bygg en helt egen tjeneste ved å hake av kontrollpunkter på tvers av regelverk. Lara estimerer omfang basert på valgte KP.
            </p>
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
        )}
      </div>

      <CustomServiceDialog
        open={manualOpen}
        onOpenChange={setManualOpen}
        onSave={handleManualSave}
        defaultHourlyRate={hourlyRate}
      />
    </div>
  );
}
