import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, TrendingUp, Plus, Trash2, Pencil, ChevronDown, ChevronUp, Settings2, Megaphone, ShieldCheck, Building2, Bot, UserCog, Radar, ClipboardCheck, Bug, Cpu, Award } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
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
import { SERVICE_LIBRARY, type ServiceTemplate, type PartnerContext } from "@/lib/serviceLibrary";

type AllSelections = Record<string, FrameworkSelection>;

type MynderTier = "basic" | "premium" | "enterprise";

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
  isMynder?: boolean;
  tier?: MynderTier;
}

function formatNOK(n: number): string {
  return new Intl.NumberFormat("nb-NO").format(Math.round(n)) + " kr";
}

const TEMPLATE_PICKS: Array<{
  code: string;
  label: string;
  icon: typeof UserCog;
  bg: string;
  fg: string;
}> = [
  { code: "MSP4", label: "DPO-as-a-service", icon: UserCog, bg: "bg-primary/10", fg: "text-primary" },
  { code: "MSSP7", label: "SOC 2 forberedelse", icon: Radar, bg: "bg-success/10", fg: "text-success" },
  { code: "MSSP6", label: "Gap-analyse", icon: ClipboardCheck, bg: "bg-warning/10", fg: "text-warning" },
  { code: "MSSP5", label: "Penetrasjonstest", icon: Bug, bg: "bg-info/10", fg: "text-info" },
  { code: "MSSP8", label: "AI Act-kartlegging", icon: Cpu, bg: "bg-accent", fg: "text-accent-foreground" },
  { code: "MSSP2", label: "ISO 27001-sertifisering", icon: Award, bg: "bg-success/10", fg: "text-success" },
];

export function MSPServiceCatalogTab() {
  const navigate = useNavigate();
  const [hourlyRate, setHourlyRate] = useState<number>(1500);
  const [manualOpen, setManualOpen] = useState(false);
  const [extras, setExtras] = useState<ExtraService[]>(() => [
    {
      id: "default-mynder-core",
      name: "Mynder Core",
      description: "Grunnpakke for compliance, styring og rapportering — fundamentet alle kunder starter med.",
      hours: 10,
      activities: [
        { label: "Oppsett av organisasjon og roller", hours: 2 },
        { label: "Aktivering av compliance-rammeverk", hours: 3 },
        { label: "Onboarding og opplæring", hours: 3 },
        { label: "Løpende rådgivning første måned", hours: 2 },
      ],
      source: "manual",
      mappings: [],
      isMynder: true,
      tier: "basic",
    },
    {
      id: "default-mynder-vendor",
      name: "Leverandørmodulen (Mynder)",
      description: "Helhetlig styring av tredjeparter: kartlegging, risikovurdering og oppfølging av leverandører.",
      hours: 8,
      activities: [
        { label: "Import og kartlegging av leverandører", hours: 2 },
        { label: "Risiko- og kritikalitetsvurdering", hours: 3 },
        { label: "Dokument- og kontraktoppfølging", hours: 3 },
      ],
      source: "manual",
      mappings: [],
      isMynder: true,
      tier: "basic",
    },
    {
      id: "default-mynder-agents",
      name: "Agentstyring (Mynder)",
      description: "Register, klassifisering og kontroll av AI-agenter — MACF-nivå, eierskap og løpende oppfølging.",
      hours: 8,
      activities: [
        { label: "Aktivering av agentregister", hours: 2 },
        { label: "MACF-klassifisering og eierskap", hours: 3 },
        { label: "Risiko- og kontrolloppfølging", hours: 3 },
      ],
      source: "manual",
      mappings: [],
      isMynder: true,
      tier: "basic",
    },
  ]);
  const [showCalculator, setShowCalculator] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

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
      if (e.isMynder) return;
      h += e.hours;
      p += e.hours * hourlyRate;
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
    // Bygg aktiviteter fra malen. Hvis timer mangler, fordel snitt likt.
    const hoursAvg = Math.round((template.estimatedHours.min + template.estimatedHours.max) / 2);
    const withHours = template.activities.filter((a) => typeof a.hours === "number");
    const withoutHoursCount = template.activities.length - withHours.length;
    const remainder = Math.max(0, hoursAvg - withHours.reduce((s, a) => s + (a.hours ?? 0), 0));
    const perRemaining =
      withoutHoursCount > 0 ? remainder / withoutHoursCount : 0;
    const activities: ServiceActivity[] = template.activities.map((a) => ({
      label: a.label,
      hours: typeof a.hours === "number" ? a.hours : Math.max(0, perRemaining),
    }));
    const totalHours = activities.reduce((s, a) => s + a.hours, 0) || hoursAvg;
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
      hours: totalHours,
      activities,
      source: "library",
      templateCode: template.code,
      templateId: template.id,
      templateVersion: template.version,
      mappings,
    };
    setExtras((prev) => [...prev, next]);
    toast.success(`${template.code} · ${template.name} adoptert`, {
      description: "Rediger for å justere aktiviteter — pris beregnes fra timepris.",
    });
  };

  const handleManualSave = (draft: CustomServiceDraft) => {
    if (editingId) {
      setExtras((prev) =>
        prev.map((e) =>
          e.id === editingId
            ? {
                ...e,
                name: draft.name,
                description: draft.description,
                hours: draft.hours,
                activities: draft.activities,
                mappings: draft.mappings,
              }
            : e,
        ),
      );
      toast.success(`"${draft.name}" oppdatert`);
      setEditingId(null);
      return;
    }
    const newService: ExtraService = {
      id: `manual-${Date.now()}`,
      name: draft.name,
      description: draft.description,
      hours: draft.hours,
      activities: draft.activities,
      source: "manual",
      mappings: draft.mappings,
    };
    setExtras((prev) => [...prev, newService]);
    toast.success(`"${draft.name}" lagt til i katalogen`);
  };

  const removeExtra = (id: string) => {
    setExtras((prev) => prev.filter((e) => e.id !== id));
  };

  const editingService = editingId ? extras.find((e) => e.id === editingId) ?? null : null;
  const editingDraft: CustomServiceDraft | undefined = editingService
    ? {
        name: editingService.name,
        description: editingService.description,
        hours: editingService.hours,
        activities: editingService.activities,
        mappings: editingService.mappings,
      }
    : undefined;



  return (
    <div className="space-y-6">
      {/* Slank topplinje: timepris + samlet potensial + handlinger */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-4">
        <div className="flex items-end gap-6">
          <div className="space-y-1">
            <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Timepris
            </label>
            <div className="flex items-baseline gap-1.5">
              <Input
                type="number"
                min={0}
                step={50}
                value={hourlyRate}
                onChange={(e) => setHourlyRate(Math.max(0, Number(e.target.value) || 0))}
                className="h-9 w-24 text-sm font-semibold tabular-nums"
              />
              <span className="text-xs text-muted-foreground">kr/t</span>
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground inline-flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> Samlet potensial
            </div>
            <div className="text-lg font-semibold text-foreground tabular-nums">
              {formatNOK(grandPrice)}
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                {extras.length} tjenester{showCalculator ? ` · ${frameworksActive} regelverk` : ""}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setManualOpen(true)} className="gap-1.5 h-9">
            <Plus className="h-3.5 w-3.5" />
            Egen tjeneste
          </Button>
          <Button size="sm" onClick={() => navigate("/msp-messages?compose=campaign")} className="gap-1.5 h-9">
            <Megaphone className="h-3.5 w-3.5" />
            Lag kampanje
          </Button>
        </div>
      </div>




      {/* Mynder-tjenester — alltid inkludert */}
      {extras.some((e) => e.isMynder) && (
        <section className="space-y-2">
          <div className="flex items-baseline justify-between">
            <h3 className="text-sm font-semibold text-foreground">Mynder-tjenester</h3>
            <span className="text-xs text-muted-foreground">Inkludert i alle leveranser</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {extras.filter((e) => e.isMynder).map((e) => {
              const Icon = e.id.includes("vendor") ? Building2 : e.id.includes("agents") ? Bot : ShieldCheck;
              return (
                <Card key={e.id} className="p-4 space-y-3 border-border">
                  <div className="flex items-start gap-3">
                    <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{e.name}</p>
                      {e.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{e.description}</p>
                      )}
                    </div>
                  </div>
                  <Select
                    value={e.tier ?? "basic"}
                    onValueChange={(val) =>
                      setExtras((prev) =>
                        prev.map((x) => (x.id === e.id ? { ...x, tier: val as MynderTier } : x)),
                      )
                    }
                  >
                    <SelectTrigger className="h-9 w-full">
                      <SelectValue placeholder="Velg pakke" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basic">Basic</SelectItem>
                      <SelectItem value="premium">Premium</SelectItem>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
                    </SelectContent>
                  </Select>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      {/* Mine egne tjenester */}
      {extras.some((e) => !e.isMynder) && (
        <section className="space-y-2">
          <div className="flex items-baseline justify-between">
            <h3 className="text-sm font-semibold text-foreground">Mine tjenester</h3>
            <span className="text-xs text-muted-foreground">
              {extras.filter((e) => !e.isMynder).length} tjenester
            </span>
          </div>
          <div className="divide-y divide-border rounded-md border border-border bg-card">
            {extras.filter((e) => !e.isMynder).map((e) => {
              const price = e.hours * hourlyRate;
              return (
                <div key={e.id} className="flex items-center gap-3 px-3 py-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {e.templateCode && (
                        <span className="inline-flex items-center rounded bg-muted px-1.5 py-0.5 text-xs font-semibold text-muted-foreground">
                          {e.templateCode}
                        </span>
                      )}
                      <span className="text-sm font-medium text-foreground truncate">{e.name}</span>
                      <Badge variant="secondary" className="text-xs gap-1 h-5">
                        {e.source === "library" ? (<><Sparkles className="h-3 w-3" /> Mal</>) : "Egen"}
                      </Badge>
                      {e.activities.length > 0 && (
                        <span className="text-xs text-muted-foreground">
                          · {e.activities.length} aktivitet{e.activities.length === 1 ? "" : "er"}
                        </span>
                      )}
                    </div>
                    {e.description && (
                      <p className="text-xs text-muted-foreground truncate">{e.description}</p>
                    )}
                    {e.mappings.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1 mt-1">
                        {e.mappings.slice(0, 6).map((m, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1 rounded-full bg-muted px-1.5 py-0.5 text-xs text-muted-foreground"
                          >
                            <span className="font-semibold text-foreground">{m.frameworkShortName}</span>
                            <span>{m.controlId}</span>
                          </span>
                        ))}
                        {e.mappings.length > 6 && (
                          <span className="text-xs text-muted-foreground">+{e.mappings.length - 6}</span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="text-sm font-semibold tabular-nums text-foreground whitespace-nowrap">
                    {formatNOK(price)}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => { setEditingId(e.id); setManualOpen(true); }}
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    aria-label="Rediger tjeneste"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
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
        </section>
      )}

      {/* Mal-velger — kompakt, à la wizard step 1 */}
      <section className="space-y-3">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-foreground">Legg til tjeneste</h3>
          <p className="text-xs text-muted-foreground">
            Velg en mal for å komme raskt i gang, eller bygg din egen.
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {TEMPLATE_PICKS.map((pick) => {
            const template = SERVICE_LIBRARY.find((t) => t.code === pick.code);
            if (!template) return null;
            const isAdopted = adoptedIds.has(template.id);
            const Icon = pick.icon;
            const frameworks = template.mappings.map((m) => m.frameworkLabel).slice(0, 3);
            return (
              <button
                key={template.id}
                type="button"
                disabled={isAdopted}
                onClick={() => adoptTemplate(template)}
                className={cn(
                  "group rounded-lg border border-border bg-card p-4 text-left transition-all",
                  "hover:border-primary/50 hover:shadow-sm",
                  isAdopted && "opacity-50 cursor-not-allowed",
                )}
              >
                <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center mb-3", pick.bg)}>
                  <Icon className={cn("h-5 w-5", pick.fg)} />
                </div>
                <p className="text-sm font-semibold text-foreground line-clamp-1">{pick.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                  {frameworks.length > 0 ? frameworks.join(" · ") : template.shortDescription}
                </p>
                {isAdopted && (
                  <Badge variant="secondary" className="text-xs mt-2 h-5">Lagt til</Badge>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 pt-1">
          <Button variant="outline" size="sm" onClick={() => setManualOpen(true)} className="gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            Beskriv egen tjeneste
          </Button>
          <button
            type="button"
            onClick={() => setShowCalculator((v) => !v)}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors ml-auto"
          >
            <Settings2 className="h-3.5 w-3.5" />
            Avansert: hele biblioteket og regelverks-bygger
            {showCalculator ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        </div>
      </section>

      {/* Avansert: hele biblioteket + framework-kalkulator */}
      {showCalculator && (
        <div className="space-y-4 pt-2">
          <ServiceLibraryBrowser
            context={partnerContext}
            adoptedIds={adoptedIds}
            onAdopt={adoptTemplate}
            hourlyRate={hourlyRate}
          />
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground italic">
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
        </div>
      )}

      <CustomServiceDialog
        open={manualOpen}
        onOpenChange={(o) => { setManualOpen(o); if (!o) setEditingId(null); }}
        onSave={handleManualSave}
        defaultHourlyRate={hourlyRate}
        initial={editingDraft}
        mode={editingId ? "edit" : "create"}
      />


    </div>
  );
}
