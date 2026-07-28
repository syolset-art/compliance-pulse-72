import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Pencil, ChevronDown, ChevronUp, Settings2, Megaphone, UserCog, Radar, ClipboardCheck, Bug, Cpu, Award, Info, Archive, RotateCcw } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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
import { useServiceDefaults } from "@/hooks/useServiceDefaults";
import { RetireServiceDialog, type RetireServiceOptions } from "./RetireServiceDialog";

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
  isMynder?: boolean;
  /** Overstyrt totalpris. Hvis satt, brukes denne i stedet for hours × timepris. */
  priceOverride?: number;
  /** Livssyklus-status. Default "active". */
  status?: "active" | "retired";
  retiredAt?: string;
  retiredReason?: string;
  replacedById?: string;
}

function formatNOK(n: number): string {
  return new Intl.NumberFormat("nb-NO").format(Math.round(n)) + " kr";
}

type PickTag = "recommended" | "popular" | "trending";

const TEMPLATE_PICKS: Array<{
  code: string;
  label: string;
  icon: typeof UserCog;
  bg: string;
  fg: string;
  tag?: PickTag;
  tagReason?: string;
}> = [
  { code: "MSP4", label: "DPO-as-a-service", icon: UserCog, bg: "bg-primary/10", fg: "text-primary", tag: "recommended", tagReason: "Matcher din portefølje (GDPR-tunge kunder)" },
  { code: "MSSP7", label: "SOC 2 forberedelse", icon: Radar, bg: "bg-success/10", fg: "text-success", tag: "trending", tagReason: "Etterspurt av SaaS-kunder denne måneden" },
  { code: "MSSP6", label: "Gap-analyse", icon: ClipboardCheck, bg: "bg-warning/10", fg: "text-warning", tag: "popular", tagReason: "Brukt av 78 % av MSP-partnere" },
  { code: "MSSP5", label: "Penetrasjonstest", icon: Bug, bg: "bg-secondary", fg: "text-secondary-foreground" },
  { code: "MSSP8", label: "AI Act-kartlegging", icon: Cpu, bg: "bg-accent", fg: "text-accent-foreground", tag: "trending", tagReason: "Sterk vekst etter EU AI Act ikrafttredelse" },
  { code: "MSSP2", label: "ISO 27001-sertifisering", icon: Award, bg: "bg-success/10", fg: "text-success", tag: "popular", tagReason: "Klassisk topp-selger" },
];

const TAG_META: Record<PickTag, { label: string; className: string }> = {
  recommended: { label: "Anbefalt for deg", className: "bg-primary/10 text-primary border-primary/20" },
  popular: { label: "Populært", className: "bg-success/10 text-success border-success/20" },
  trending: { label: "Trender nå", className: "bg-warning/10 text-warning border-warning/20" },
};

export function MSPServiceCatalogTab() {
  const navigate = useNavigate();
  const { defaultHourlyRate } = useServiceDefaults();
  const [hourlyRate, setHourlyRate] = useState<number>(defaultHourlyRate);
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
    },
  ]);
  const [showCalculator, setShowCalculator] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<ServiceTemplate | null>(null);

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
      p += e.priceOverride ?? e.hours * hourlyRate;
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
    toast.success(`${template.name} adoptert`, {
      description: "Rediger for å justere aktiviteter — pris beregnes fra timepris.",
    });
  };

  const buildDraftFromTemplate = (template: ServiceTemplate): CustomServiceDraft => {
    const hoursAvg = Math.round((template.estimatedHours.min + template.estimatedHours.max) / 2);
    const withHours = template.activities.filter((a) => typeof a.hours === "number");
    const withoutHoursCount = template.activities.length - withHours.length;
    const remainder = Math.max(0, hoursAvg - withHours.reduce((s, a) => s + (a.hours ?? 0), 0));
    const perRemaining = withoutHoursCount > 0 ? remainder / withoutHoursCount : 0;
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
    return { name: template.name, description: template.shortDescription, hours: totalHours, activities, mappings };
  };

  const openTemplatePreview = (template: ServiceTemplate) => {
    const existing = extras.find((e) => e.templateId === template.id);
    if (existing) {
      setEditingId(existing.id);
      setPreviewTemplate(null);
    } else {
      setPreviewTemplate(template);
      setEditingId(null);
    }
    setManualOpen(true);
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
                priceOverride: draft.priceOverride,
              }
            : e,
        ),
      );
      toast.success(`"${draft.name}" oppdatert`);
      setEditingId(null);
      return;
    }
    const fromTemplate = previewTemplate;
    const newService: ExtraService = {
      id: fromTemplate ? `adopt-${fromTemplate.id}-${Date.now()}` : `manual-${Date.now()}`,
      name: draft.name,
      description: draft.description,
      hours: draft.hours,
      activities: draft.activities,
      source: fromTemplate ? "library" : "manual",
      templateCode: fromTemplate?.code,
      templateId: fromTemplate?.id,
      templateVersion: fromTemplate?.version,
      mappings: draft.mappings,
      priceOverride: draft.priceOverride,
    };
    setExtras((prev) => [...prev, newService]);
    toast.success(`"${draft.name}" lagt til i katalogen`);
    setPreviewTemplate(null);
  };

  const removeExtra = (id: string) => {
    setExtras((prev) => prev.filter((e) => e.id !== id));
  };

  const [retireId, setRetireId] = useState<string | null>(null);
  const retireTarget = retireId ? extras.find((e) => e.id === retireId) ?? null : null;

  const retireExtra = (id: string, opts: RetireServiceOptions) => {
    const prev = extras.find((e) => e.id === id);
    if (!prev) return;
    setExtras((list) =>
      list.map((e) =>
        e.id === id
          ? {
              ...e,
              status: "retired",
              retiredAt: new Date().toISOString(),
              retiredReason: opts.reason,
              replacedById: opts.replacedById,
            }
          : e,
      ),
    );
    setRetireId(null);
    toast.success(`«${prev.name}» er avviklet`, {
      action: {
        label: "Angre",
        onClick: () =>
          setExtras((list) =>
            list.map((e) =>
              e.id === id
                ? { ...e, status: "active", retiredAt: undefined, retiredReason: undefined, replacedById: undefined }
                : e,
            ),
          ),
      },
    });
  };

  const restoreExtra = (id: string) => {
    setExtras((list) =>
      list.map((e) =>
        e.id === id
          ? { ...e, status: "active", retiredAt: undefined, retiredReason: undefined, replacedById: undefined }
          : e,
      ),
    );
    toast.success("Tjenesten er gjenopprettet");
  };


  const editingService = editingId ? extras.find((e) => e.id === editingId) ?? null : null;
  const editingDraft: CustomServiceDraft | undefined = editingService
    ? {
        name: editingService.name,
        description: editingService.description,
        hours: editingService.hours,
        activities: editingService.activities,
        mappings: editingService.mappings,
        priceOverride: editingService.priceOverride,
      }
    : previewTemplate
    ? buildDraftFromTemplate(previewTemplate)
    : undefined;



  return (
    <div className="space-y-6">
      {/* Foreslåtte tjenester — vises øverst når brukeren kommer inn */}
      <section className="space-y-3">
        <div className="flex items-center justify-end gap-2">
          <TooltipProvider delayDuration={150}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  aria-label="Hvorfor vises disse tjenestene?"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                >
                  <Info className="h-4 w-4" aria-hidden="true" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-xs text-sm">
                Foreslåtte tjenester er basert på det vi har kartlagt om din partnerprofil og tjenestene du leverer i dag.
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Button variant="outline" size="sm" onClick={() => setManualOpen(true)} className="gap-1.5 shrink-0 h-11 text-base">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Beskriv egen tjeneste
          </Button>
        </div>
        <div className="overflow-hidden rounded-md border border-border bg-card">
          <table className="w-full text-base">
            <thead className="bg-muted/30 text-sm text-foreground/70">
              <tr>
                <th className="text-left font-semibold px-3 py-2.5 w-12"></th>
                <th className="text-left font-semibold px-3 py-2.5">Tjeneste</th>
                <th className="text-left font-semibold px-3 py-2.5">Regelverk</th>
                <th className="text-right font-semibold px-3 py-2.5 w-32"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {TEMPLATE_PICKS.map((pick) => {
                const template = SERVICE_LIBRARY.find((t) => t.code === pick.code);
                if (!template) return null;
                const isAdopted = adoptedIds.has(template.id);
                const Icon = pick.icon;
                const frameworks = template.mappings.map((m) => m.frameworkLabel).slice(0, 3);
                const tagMeta = pick.tag ? TAG_META[pick.tag] : null;
                return (
                  <tr
                    key={template.id}
                    onClick={() => openTemplatePreview(template)}
                    className={cn(
                      "hover:bg-muted/30 transition-colors cursor-pointer",
                      isAdopted && "opacity-60",
                    )}
                  >
                    <td className="px-3 py-3">
                      <div className={cn("h-9 w-9 rounded-md flex items-center justify-center", pick.bg)}>
                        <Icon className={cn("h-4 w-4", pick.fg)} aria-hidden="true" />
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="text-base font-medium text-foreground">{pick.label}</div>
                      <div className="text-sm text-foreground/70 line-clamp-1">
                        {template.shortDescription}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-1">
                        {frameworks.length > 0 ? (
                          frameworks.map((f) => (
                            <span key={f} className="text-sm px-2 py-0.5 rounded bg-muted text-foreground/80">
                              {f}
                            </span>
                          ))
                        ) : (
                          <span className="text-sm text-foreground/60">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-right">
                      {isAdopted ? (
                        <Badge variant="secondary" className="text-sm h-7 px-2.5">Lagt til</Badge>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(ev) => { ev.stopPropagation(); adoptTemplate(template); }}
                          className="h-9 gap-1 text-sm"
                        >
                          <Plus className="h-4 w-4" aria-hidden="true" />
                          Legg til
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex items-center pt-1">
          <button
            type="button"
            onClick={() => setShowCalculator((v) => !v)}
            className="inline-flex items-center gap-1.5 text-base text-foreground/70 hover:text-foreground transition-colors ml-auto"
          >
            <Settings2 className="h-4 w-4" aria-hidden="true" />
            Avansert: hele biblioteket og regelverks-bygger
            {showCalculator ? <ChevronUp className="h-4 w-4" aria-hidden="true" /> : <ChevronDown className="h-4 w-4" aria-hidden="true" />}
          </button>
        </div>
      </section>

      {/* Mynder-tjenester — alltid inkludert */}
      {extras.some((e) => e.isMynder) && (
        <section className="space-y-2">
          <div className="flex items-baseline justify-between">
            <h3 className="text-lg font-semibold text-foreground">Mynder-tjenester</h3>
            <span className="text-base text-foreground/70">Inkludert i alle leveranser</span>
          </div>
          <div className="divide-y divide-border rounded-md border border-border bg-card">
            {extras.filter((e) => e.isMynder).map((e) => {
              const price = e.hours * hourlyRate;
              return (
                <div key={e.id} className="flex items-center gap-3 px-3 py-3">
                  <div className="flex-1 min-w-0">
                    <span className="text-base font-medium text-foreground truncate">{e.name}</span>
                  </div>
                  <div className="text-base text-foreground/70 tabular-nums whitespace-nowrap">
                    {e.hours} t
                  </div>
                  <div className="text-base font-semibold tabular-nums text-foreground whitespace-nowrap w-24 text-right">
                    {formatNOK(price)}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Mine egne tjenester */}
      {extras.some((e) => !e.isMynder && e.status !== "retired") && (
        <section className="space-y-2">
          <div className="flex items-baseline justify-between">
            <h3 className="text-lg font-semibold text-foreground">Mine tjenester</h3>
            <span className="text-base text-foreground/70">
              {extras.filter((e) => !e.isMynder && e.status !== "retired").length} tjenester
            </span>
          </div>
          <div className="divide-y divide-border rounded-md border border-border bg-card">
            {extras.filter((e) => !e.isMynder && e.status !== "retired").map((e) => {
              const price = e.priceOverride ?? e.hours * hourlyRate;
              return (
                <div key={e.id} className="flex items-center gap-3 px-3 py-3">
                  <div className="flex-1 min-w-0 flex items-center gap-2">
                    <span className="text-base font-medium text-foreground truncate">{e.name}</span>
                  </div>
                  <div className="text-base text-foreground/70 tabular-nums whitespace-nowrap">
                    {e.hours} t
                  </div>
                  <div className="text-base font-semibold tabular-nums text-foreground whitespace-nowrap w-24 text-right">
                    {formatNOK(price)}
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => { setEditingId(e.id); setManualOpen(true); }}
                    className="h-11 w-11 text-foreground/70 hover:text-foreground"
                    aria-label="Rediger tjeneste"
                  >
                    <Pencil className="h-4 w-4" aria-hidden="true" />
                  </Button>
                  <TooltipProvider delayDuration={200}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setRetireId(e.id)}
                          className="h-11 w-11 text-foreground/70 hover:text-foreground"
                          aria-label="Avvikle tjeneste"
                        >
                          <Archive className="h-4 w-4" aria-hidden="true" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        Avvikle — skjuler tjenesten for kunder, bevarer historikk
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <TooltipProvider delayDuration={200}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeExtra(e.id)}
                          className="h-11 w-11 text-foreground/70 hover:text-destructive"
                          aria-label="Slett tjeneste"
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        Slett — kun for tjenester som aldri har vært i bruk
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Avviklede tjenester */}
      {extras.some((e) => e.status === "retired") && (
        <section className="space-y-2">
          <div className="flex items-baseline justify-between">
            <h3 className="text-sm font-medium text-muted-foreground inline-flex items-center gap-1.5">
              <Archive className="h-3.5 w-3.5" />
              Avviklet ({extras.filter((e) => e.status === "retired").length})
            </h3>
          </div>
          <div className="divide-y divide-border rounded-md border border-dashed border-border bg-muted/20">
            {extras.filter((e) => e.status === "retired").map((e) => {
              const replacement = e.replacedById
                ? extras.find((x) => x.id === e.replacedById)
                : null;
              return (
                <div key={e.id} className="flex items-center gap-3 px-3 py-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground/70 truncate">
                      {e.name}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      Avviklet{" "}
                      {e.retiredAt
                        ? new Date(e.retiredAt).toLocaleDateString("nb-NO")
                        : ""}
                      {e.retiredReason && ` · ${e.retiredReason}`}
                      {replacement && ` · erstattet av ${replacement.name}`}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => restoreExtra(e.id)}
                    className="h-8 gap-1.5 text-xs"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Gjenopprett
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeExtra(e.id)}
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    aria-label="Slett permanent"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  </Button>
                </div>
              );
            })}
          </div>
        </section>
      )}



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
            <p className="text-base text-foreground/75 italic leading-relaxed">
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
        onOpenChange={(o) => { setManualOpen(o); if (!o) { setEditingId(null); setPreviewTemplate(null); } }}
        onSave={handleManualSave}
        defaultHourlyRate={hourlyRate}
        initial={editingDraft}
        mode={editingId ? "edit" : "create"}
      />

      <RetireServiceDialog
        open={retireId !== null}
        onOpenChange={(o) => { if (!o) setRetireId(null); }}
        serviceName={retireTarget?.name ?? ""}
        replacementOptions={extras
          .filter((e) => e.id !== retireId && e.status !== "retired" && !e.isMynder)
          .map((e) => ({ id: e.id, name: e.name }))}
        onConfirm={(opts) => retireId && retireExtra(retireId, opts)}
      />

    </div>
  );
}
