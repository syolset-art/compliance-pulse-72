import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Pencil, ChevronDown, ChevronUp, Settings2, Megaphone, UserCog, Radar, ClipboardCheck, Bug, Cpu, Award, Info, Archive, RotateCcw, Sparkles, Star, FileText, Lock } from "lucide-react";
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
import { SERVICE_LIBRARY, type ServiceTemplate, type PartnerContext, type ServiceRole, getMappingRoles, formatRoleVerbs, ROLE_META } from "@/lib/serviceLibrary";
import { useServiceDefaults } from "@/hooks/useServiceDefaults";
import { RetireServiceDialog, type RetireServiceOptions } from "./RetireServiceDialog";
import { MSPLaraServiceWizard } from "./MSPLaraServiceWizard";
import type { PartnerService, WizardAnswers } from "@/lib/serviceCatalog";

import { CORE_TIERS, VENDOR_TIERS } from "@/lib/planConstants";
import { usePartnerBranding } from "@/hooks/usePartnerBranding";
import { formatTaxNote } from "@/lib/partnerTax";
import { useSavedOffers, type LockInfo } from "@/lib/customerOffers";

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

const TEMPLATE_PICKS: Pick[] = [
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

const PICK_PALETTE: Array<{ bg: string; fg: string; icon: typeof UserCog }> = [
  { bg: "bg-primary/10", fg: "text-primary", icon: UserCog },
  { bg: "bg-success/10", fg: "text-success", icon: Radar },
  { bg: "bg-warning/10", fg: "text-warning", icon: ClipboardCheck },
  { bg: "bg-secondary", fg: "text-secondary-foreground", icon: Bug },
  { bg: "bg-accent", fg: "text-accent-foreground", icon: Cpu },
  { bg: "bg-success/10", fg: "text-success", icon: Award },
];

type Pick = { code: string; label: string; icon: typeof UserCog; bg: string; fg: string; tag?: PickTag; tagReason?: string; recommended?: boolean };

const DOMAIN_KEYWORDS: Record<string, string[]> = {
  security: ["sikkerhet", "security", "iso 27001", "soc"],
  gdpr: ["gdpr", "personvern", "privacy", "dpo"],
  iso: ["iso 27001", "iso 42001", "styringssystem"],
  nis2: ["nis2"],
  dora: ["dora"],
  ai: ["ai act", "ai governance", "iso 42001", "ai-"],
  transparency: ["åpenhet", "transparency", "leverandørkjede", "supply chain"],
};

const MARKET_TO_SCOPES: Record<string, string[]> = {
  no: ["NO", "EU", "global"],
  se: ["SE", "EU", "global"],
  dk: ["EU", "global"],
  fi: ["EU", "global"],
  eu: ["EU", "global"],
  uk: ["UK", "global"],
  au: ["AU", "global"],
  global: ["global"],
};

function computePicksFromAnswers(answers: WizardAnswers): Pick[] {
  const allowedScopes = new Set<string>();
  answers.markets.forEach((m) => (MARKET_TO_SCOPES[m] ?? ["global"]).forEach((s) => allowedScopes.add(s)));
  if (allowedScopes.size === 0) allowedScopes.add("global");

  const knownDomains = Object.keys(DOMAIN_KEYWORDS);
  const presetDomains = answers.domains.filter((d) => knownDomains.includes(d));
  const freeText = answers.domains
    .filter((d) => !knownDomains.includes(d))
    .map((d) => d.toLowerCase().trim())
    .filter(Boolean);
  const domainKeywords = [
    ...presetDomains.flatMap((d) => DOMAIN_KEYWORDS[d]),
    ...freeText,
  ];

  const scored = SERVICE_LIBRARY.map((tpl) => {
    let score = 0;
    // Market fit
    const scopeHit = tpl.scopes.some((s) => allowedScopes.has(s));
    if (!scopeHit) return { tpl, score: -1 };
    score += 1;
    // Domain match on name / description / framework labels
    const hay = `${tpl.name} ${tpl.shortDescription} ${tpl.mappings.map((m) => m.frameworkLabel).join(" ")}`.toLowerCase();
    for (const kw of domainKeywords) if (hay.includes(kw)) score += 2;
    // Delivery model preference
    if (answers.models.includes("subscription") || answers.models.includes("managed")) {
      if (tpl.delivery === "recurring") score += 1;
    }
    if (answers.models.includes("project") && tpl.delivery === "one-off") score += 1;
    return { tpl, score };
  })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  return scored.map(({ tpl }, i) => {
    const p = PICK_PALETTE[i % PICK_PALETTE.length];
    return { code: tpl.code, label: tpl.name, icon: p.icon, bg: p.bg, fg: p.fg };
  });
}


export function MSPServiceCatalogTab() {
  const navigate = useNavigate();
  const { defaultHourlyRate, currencyOption } = useServiceDefaults();
  const { branding } = usePartnerBranding();
  const [hourlyRate, setHourlyRate] = useState<number>(defaultHourlyRate);
  const [manualOpen, setManualOpen] = useState(false);
  const [extras, setExtras] = useState<ExtraService[]>(() => []);
  const { getLockInfo, isLocked } = useSavedOffers();
  const [showCalculator, setShowCalculator] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<ServiceTemplate | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardSeen, setWizardSeen] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try { return window.localStorage.getItem("msp-lara-wizard-seen-v1") === "1"; } catch { return false; }
  });
  const markWizardSeen = () => {
    setWizardSeen(true);
    try { window.localStorage.setItem("msp-lara-wizard-seen-v1", "1"); } catch {}
  };
  const catalogSectionRef = useRef<HTMLElement | null>(null);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const revealInCatalog = (id: string) => {
    catalogSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    setHighlightId(id);
    window.setTimeout(() => {
      setHighlightId((cur) => (cur === id ? null : cur));
    }, 1800);
  };
  const openWizard = () => { markWizardSeen(); setWizardOpen(true); };
  const [curatedPicks, setCuratedPicks] = useState<Pick[] | null>(null);
  const [curationSummary, setCurationSummary] = useState<string | null>(null);
  const [onlyRecommended, setOnlyRecommended] = useState(false);

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
      const roles = getMappingRoles(template, m);
      return m.controlIds.map((cid) => {
        const cp = fw?.controlPoints.find((c) => c.id === cid);
        return {
          frameworkId: m.frameworkId,
          frameworkShortName: fw?.shortName ?? m.frameworkLabel,
          controlId: cid,
          controlLabel: cp?.label ?? cid,
          roles,
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
    revealInCatalog(next.id);
    toast.success(`La til «${template.name}» i din tjenestekatalog`, {
      description: "Rediger for å justere aktiviteter og pris.",
      action: {
        label: "Vis i katalogen",
        onClick: () => revealInCatalog(next.id),
      },
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
      const roles = getMappingRoles(template, m);
      return m.controlIds.map((cid) => {
        const cp = fw?.controlPoints.find((c) => c.id === cid);
        return {
          frameworkId: m.frameworkId,
          frameworkShortName: fw?.shortName ?? m.frameworkLabel,
          controlId: cid,
          controlLabel: cp?.label ?? cid,
          roles,
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
    revealInCatalog(newService.id);
    toast.success(`La til «${draft.name}» i din tjenestekatalog`, {
      action: {
        label: "Vis i katalogen",
        onClick: () => revealInCatalog(newService.id),
      },
    });
    setPreviewTemplate(null);
  };

  const removeExtra = (id: string) => {
    const target = extras.find((e) => e.id === id);
    if (target) {
      const lock = getLockInfo({ templateId: target.templateId, name: target.name });
      if (lock) {
        toast.error("Kan ikke slettes", {
          description: `«${target.name}» inngår i tilbud ${lock.offerNumber}. Bruk «Avvikle» for kontrollert utfasing.`,
        });
        return;
      }
    }
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

  const recommendedCodes = useMemo(
    () => new Set((curatedPicks ?? []).map((p) => p.code)),
    [curatedPicks],
  );
  const mergedPicks: Pick[] = useMemo(() => {
    if (!curatedPicks || curatedPicks.length === 0) return TEMPLATE_PICKS;
    const templateCodes = new Set(TEMPLATE_PICKS.map((p) => p.code));
    const extraFromLara = curatedPicks
      .filter((p) => !templateCodes.has(p.code))
      .map((p) => ({ ...p, recommended: true }));
    const marked = TEMPLATE_PICKS.map((p) =>
      recommendedCodes.has(p.code) ? { ...p, recommended: true } : p,
    );
    // Sort: recommended first, preserve relative order
    return [...extraFromLara, ...marked].sort((a, b) => {
      if (!!a.recommended === !!b.recommended) return 0;
      return a.recommended ? -1 : 1;
    });
  }, [curatedPicks, recommendedCodes]);
  const activePicks: Pick[] = useMemo(
    () => (onlyRecommended ? mergedPicks.filter((p) => p.recommended) : mergedPicks),
    [mergedPicks, onlyRecommended],
  );
  const recommendedCount = mergedPicks.filter((p) => p.recommended).length;

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
          {wizardSeen || extras.length > 0 || (curatedPicks && curatedPicks.length > 0) ? (
            <TooltipProvider delayDuration={150}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={openWizard}
                    aria-label="La Lara foreslå tjenester på nytt"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors"
                  >
                    <Sparkles className="h-4 w-4" aria-hidden="true" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-xs text-sm">
                  La Lara foreslå tjenester på nytt
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <Button variant="outline" size="sm" onClick={openWizard} className="gap-1.5 shrink-0 h-11 text-base">
              <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
              La Lara foreslå tjenester
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => setManualOpen(true)} className="gap-1.5 shrink-0 h-11 text-base">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Beskriv egen tjeneste
          </Button>
        </div>

        {curatedPicks && recommendedCount > 0 && (
          <div className="flex items-center justify-between gap-3 rounded-md border border-primary/20 bg-primary/5 px-3 py-2 text-sm">
            <div className="flex items-center gap-2 text-foreground/80">
              <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
              <span>
                Lara anbefaler <span className="font-medium text-foreground">{recommendedCount} tjenester</span>{curationSummary ? ` basert på ${curationSummary}` : ""}. Merket med <Star className="inline h-3 w-3 fill-primary text-primary align-[-2px]" /> i listen.
              </span>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setOnlyRecommended((v) => !v)}
                className={cn(
                  "text-xs px-2 py-1 rounded border transition-colors",
                  onlyRecommended
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-foreground/80 border-border hover:bg-muted/60",
                )}
              >
                {onlyRecommended ? "Viser kun anbefalte" : "Vis kun anbefalte"}
              </button>
              <button
                type="button"
                onClick={() => { setCuratedPicks(null); setCurationSummary(null); setOnlyRecommended(false); }}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Nullstill
              </button>
            </div>
          </div>
        )}



        <div className="overflow-hidden rounded-md border border-border bg-card">
          <table className="w-full text-base">
            <thead className="bg-muted/30 text-sm text-foreground/70">
              <tr>
                <th className="text-left font-semibold px-3 py-2.5 w-12"></th>
                <th className="text-left font-semibold px-3 py-2.5">Tjeneste</th>
                <th className="text-left font-semibold px-3 py-2.5">Krav tjenesten støtter</th>
                <th className="text-left font-semibold px-3 py-2.5 w-44">Rolle</th>
                <th className="text-right font-semibold px-3 py-2.5 w-32"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {activePicks.map((pick) => {
                const template = SERVICE_LIBRARY.find((t) => t.code === pick.code);
                if (!template) return null;
                const isAdopted = adoptedIds.has(template.id);
                const Icon = pick.icon;
                const mappings = template.mappings ?? [];
                const visibleMappings = mappings.slice(0, 2);
                const extraFrameworks = mappings.length - visibleMappings.length;
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
                        {visibleMappings.length > 0 ? (
                          <>
                            {visibleMappings.map((m) => {
                              const ids = m.controlIds ?? [];
                              const shown = ids.slice(0, 3);
                              const rest = ids.length - shown.length;
                              const label = shown.length > 0
                                ? `${m.frameworkLabel} · ${shown.join(", ")}${rest > 0 ? ` +${rest}` : ""}`
                                : m.frameworkLabel;
                              const fullList = ids.length > 0 ? ids.join(", ") : "Ingen krav mappet";
                              const roles = getMappingRoles(template, m);
                              const roleLabels = roles.map((r) => ROLE_META[r].label).join(", ");
                              return (
                                <Tooltip key={`${template.id}-${m.frameworkId}`}>
                                  <TooltipTrigger asChild>
                                    <span className="text-sm px-2 py-0.5 rounded bg-muted text-foreground/80 whitespace-nowrap">
                                      {label}
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent side="top" className="max-w-xs">
                                    <div className="text-xs font-semibold mb-0.5">{m.frameworkLabel}</div>
                                    <div className="text-xs text-foreground/80">{fullList}</div>
                                    {roleLabels && (
                                      <div className="text-xs text-foreground/70 mt-1 pt-1 border-t border-border/40">
                                        Rolle: {roleLabels}
                                      </div>
                                    )}
                                  </TooltipContent>
                                </Tooltip>
                              );
                            })}
                            {extraFrameworks > 0 && (
                              <span className="text-sm px-2 py-0.5 rounded bg-muted/60 text-foreground/70">
                                +{extraFrameworks} regelverk til
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="text-sm text-foreground/60">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3 align-top">
                      {(() => {
                        const allRoles = Array.from(
                          new Set(mappings.flatMap((m) => getMappingRoles(template, m))),
                        );
                        if (allRoles.length === 0) {
                          return <span className="text-sm text-foreground/60">—</span>;
                        }
                        return (
                          <div className="flex flex-wrap gap-1">
                            {allRoles.map((r) => (
                              <Tooltip key={r}>
                                <TooltipTrigger asChild>
                                  <span className="text-xs px-2 py-0.5 rounded bg-muted text-foreground/80 whitespace-nowrap cursor-help">
                                    {ROLE_META[r].label}
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="max-w-xs">
                                  <div className="text-xs">{ROLE_META[r].description}</div>
                                </TooltipContent>
                              </Tooltip>
                            ))}
                          </div>
                        );
                      })()}
                    </td>
                    <td className="px-3 py-3 text-right">
                      {(() => {
                        const lock = getLockInfo({ templateId: template.id, name: pick.label });
                        if (lock) {
                          return (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge variant="outline" className="text-xs h-7 px-2 gap-1 border-primary/30 bg-primary/5 text-primary cursor-help">
                                  <FileText className="h-3 w-3" aria-hidden="true" />
                                  På tilbud
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="max-w-xs text-xs">
                                Inngår i {lock.count > 1 ? `${lock.count} tilbud` : `tilbud ${lock.offerNumber}`}
                                {lock.customerName ? ` · ${lock.customerName}` : ""}. Tjenesten kan ikke fjernes.
                              </TooltipContent>
                            </Tooltip>
                          );
                        }
                        if (isAdopted) {
                          const added = extras.find((e) => e.templateId === template.id);
                          return (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  type="button"
                                  onClick={(ev) => { ev.stopPropagation(); if (added) revealInCatalog(added.id); }}
                                  className="inline-flex items-center gap-1 h-7 px-2.5 rounded-md bg-primary/10 text-primary text-sm font-medium hover:bg-primary/15 transition-colors"
                                >
                                  ✓ I katalogen
                                </button>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="max-w-xs text-xs">
                                Ligger i «Min tjenestekatalog». Klikk for å redigere pris og timer.
                              </TooltipContent>
                            </Tooltip>
                          );
                        }
                        return (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(ev) => { ev.stopPropagation(); adoptTemplate(template); }}
                                className="h-9 gap-1 text-sm"
                              >
                                {pick.recommended ? (
                                  <Star className="h-3.5 w-3.5 fill-primary text-primary" aria-hidden="true" />
                                ) : (
                                  <Plus className="h-4 w-4" aria-hidden="true" />
                                )}
                                Legg til
                              </Button>
                            </TooltipTrigger>
                            {pick.recommended && (
                              <TooltipContent side="top" className="max-w-xs text-xs">
                                Anbefalt av Lara basert på din partnerprofil{curationSummary ? ` (${curationSummary})` : ""}.
                              </TooltipContent>
                            )}
                          </Tooltip>
                        );
                      })()}
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

      {/* Mynder-produkter — videresalg med provisjon */}
      {(() => {
        const rows = [
          { id: "core", name: "Mynder Core", price: CORE_TIERS[0].monthlyPriceKr, commissionPct: 30 },
          { id: "vendors", name: "Leverandørmodulen", price: VENDOR_TIERS[1].monthlyPriceKr, commissionPct: 30 },
          { id: "assets", name: "Assets", price: 490, commissionPct: 25 },
        ];
        const sym = currencyOption.symbol;
        const trailing = sym === "kr";

        const fmt = (n: number) =>
          `${new Intl.NumberFormat("nb-NO", { maximumFractionDigits: 0 }).format(Math.round(n))} ${sym}`;
        return (
          <section className="space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Produkter fra Mynder</h3>
                <p className="text-sm text-foreground/70 mt-0.5">
                  Abonnementer du kan selge videre. Din andel utbetales månedlig.
                </p>
              </div>
              <a
                href="#"
                onClick={(e) => e.preventDefault()}
                className="text-sm text-foreground/60 hover:text-foreground whitespace-nowrap"
              >
                Mynders produktløfte
              </a>
            </div>
            <div className="rounded-md border border-border bg-card overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-muted-foreground border-b border-border">
                    <th className="px-4 py-2.5 font-medium">Produkt</th>
                    <th className="px-4 py-2.5 font-medium text-right">Lisens/mnd</th>
                    <th className="px-4 py-2.5 font-medium text-right">Din andel</th>
                    <th className="px-4 py-2.5 font-medium text-right">Etablering</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {rows.map((r) => {
                    const share = (r.price * r.commissionPct) / 100;
                    return (
                      <tr key={r.id}>
                        <td className="px-4 py-3 font-medium text-foreground">{r.name}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-foreground/80">
                          {trailing ? fmt(r.price) : `${sym} ${Math.round(r.price)}`}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums font-semibold text-foreground">
                          {trailing ? fmt(share) : `${sym} ${Math.round(share)}`}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                className="text-sm text-primary hover:underline"
                              >
                                Sett pris
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="top">
                              Etableringsgebyr legges til når du lager tilbud. Valgfritt.
                            </TooltipContent>
                          </Tooltip>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground">{formatTaxNote(branding.tax)}</p>
          </section>
        );
      })()}



      {/* Min tjenestekatalog */}
      {(() => {
        const mine = extras.filter((e) => !e.isMynder && e.status !== "retired");
        const lockedCount = mine.filter((e) => !!getLockInfo({ templateId: e.templateId, name: e.name })).length;
        return (
          <section ref={catalogSectionRef} id="min-katalog" className="space-y-2 scroll-mt-24">
            <div className="flex items-baseline justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Min tjenestekatalog</h3>
                <p className="text-sm text-foreground/70 mt-0.5">
                  Tjenester du tilbyr kundene dine. Brukes i tilbud og gap-analyser.
                </p>
              </div>
              {mine.length > 0 && (
                <span className="text-sm text-foreground/70 whitespace-nowrap">
                  {mine.length} {mine.length === 1 ? "tjeneste" : "tjenester"}
                  {lockedCount > 0 && <> · {lockedCount} på tilbud</>}
                </span>
              )}
            </div>
            {mine.length === 0 ? (
              <div className="rounded-md border border-dashed border-border bg-muted/20 px-4 py-6 text-center">
                <p className="text-sm font-medium text-foreground">Min tjenestekatalog er tom</p>
                <p className="text-sm text-foreground/70 mt-1">
                  Legg til tjenester fra listen over — de blir tilgjengelige når du lager tilbud.
                </p>
              </div>
            ) : (
          <div className="divide-y divide-border rounded-md border border-border bg-card">
            {extras.filter((e) => !e.isMynder && e.status !== "retired").map((e) => {
              const price = e.priceOverride ?? e.hours * hourlyRate;
              const lock = getLockInfo({ templateId: e.templateId, name: e.name });
              return (
                <div key={e.id} className="flex items-center gap-3 px-3 py-3">
                  <div className="flex-1 min-w-0 flex items-center gap-2">
                    <span className="text-base font-medium text-foreground truncate">{e.name}</span>
                    {lock && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge variant="outline" className="text-xs h-6 px-1.5 gap-1 border-primary/30 bg-primary/5 text-primary cursor-help shrink-0">
                            <FileText className="h-3 w-3" aria-hidden="true" />
                            På tilbud · {lock.offerNumber}
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs text-xs">
                          Inngår i {lock.count > 1 ? `${lock.count} tilbud` : `tilbud ${lock.offerNumber}`}
                          {lock.customerName ? ` · ${lock.customerName}` : ""}. Kan ikke slettes — bruk «Avvikle».
                        </TooltipContent>
                      </Tooltip>
                    )}
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
                        <span>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeExtra(e.id)}
                            disabled={!!lock}
                            className="h-11 w-11 text-foreground/70 hover:text-destructive disabled:opacity-40"
                            aria-label={lock ? "Låst — kan ikke slettes" : "Slett tjeneste"}
                          >
                            {lock ? <Lock className="h-4 w-4" aria-hidden="true" /> : <Trash2 className="h-4 w-4" aria-hidden="true" />}
                          </Button>
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        {lock
                          ? `Kan ikke slettes — inngår i tilbud ${lock.offerNumber}. Bruk «Avvikle».`
                          : "Slett — kun for tjenester som aldri har vært i bruk"}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              );
            })}
          </div>
            )}
          </section>
        );
      })()}

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

      <MSPLaraServiceWizard
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        onComplete={(_suggestions, answers) => {
          const picks = computePicksFromAnswers(answers);
          setCuratedPicks(picks.length > 0 ? picks : null);
          const parts: string[] = [];
          if (answers.markets.length) parts.push(`${answers.markets.length} marked${answers.markets.length > 1 ? "er" : ""}`);
          if (answers.domains.length) parts.push(`${answers.domains.length} fagområde${answers.domains.length > 1 ? "r" : ""}`);
          setCurationSummary(parts.join(", ") || null);
          toast.success(`Lara foreslo ${picks.length} tjenester basert på kartleggingen`);
        }}
      />



    </div>
  );
}
