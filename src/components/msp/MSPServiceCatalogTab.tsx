import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Pencil, ChevronDown, ChevronUp, Settings2, Megaphone, UserCog, Radar, ClipboardCheck, Bug, Cpu, Award, Archive, RotateCcw, Sparkles, Star, FileText, Lock, AlertTriangle, Wand2, Check, MoreVertical, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
import { ServiceCoverageSearch } from "./ServiceCoverageSearch";
import { AiMappingDisclosure } from "./AiMappingDisclosure";
import { LaraScopeChangeDialog, type ScopeChangeSelection } from "./LaraScopeChangeDialog";
import type { PartnerService, WizardAnswers } from "@/lib/serviceCatalog";
import {
  diffAnswers,
  hasScopeChange,
  buildRecommendations,
  summarizeDiff,
  WIZARD_ANSWERS_STORAGE_KEY,
  type ScopeRecommendations,
  type ScopeDiff,
  type AdoptedRef,
} from "@/lib/laraScopeDiff";

import { CORE_TIERS, VENDOR_TIERS } from "@/lib/planConstants";
import { usePartnerBranding } from "@/hooks/usePartnerBranding";
import { formatTaxNote } from "@/lib/partnerTax";
import { useSavedOffers, type LockInfo } from "@/lib/customerOffers";
import { SetupFeeCell } from "./SetupFeeCell";
import { MODULE_INFO, type ModuleKey } from "@/lib/moduleInfo";

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
  /** Lara-flagg: tjenesten er utvidet med nye kontrollmappinger etter scope-endring. */
  laraExtensionSummary?: string;
  /** Lara-flagg: tjenesten er markert for gjennomgang etter scope-endring. */
  laraReviewReason?: string;
}

function formatNOK(n: number): string {
  return new Intl.NumberFormat("nb-NO").format(Math.round(n)) + " kr";
}

const MYNDER_PRODUCTS: Array<{
  id: string;
  moduleKey: ModuleKey;
  name: string;
  commissionPct: number;
  fromPrice: number;
  tiers: Array<{ label: string; priceKr: number; isFree?: boolean }>;
}> = [
  {
    id: "core",
    moduleKey: "core",
    name: "Mynder Core",
    commissionPct: 30,
    fromPrice: CORE_TIERS[0].monthlyPriceKr,
    tiers: CORE_TIERS.map((t) => ({ label: t.label, priceKr: t.monthlyPriceKr })),
  },
  {
    id: "vendors",
    moduleKey: "vendors",
    name: "Leverandørmodulen",
    commissionPct: 30,
    fromPrice: VENDOR_TIERS[1].monthlyPriceKr,
    tiers: VENDOR_TIERS.map((t) => ({ label: t.label, priceKr: t.monthlyPriceKr, isFree: t.isFree })),
  },
  {
    id: "assets",
    moduleKey: "assets",
    name: "Assets",
    commissionPct: 25,
    fromPrice: 490,
    tiers: [{ label: "Standard", priceKr: 490 }],
  },
];


function formatSupportedSummary(template: ServiceTemplate): string {
  const mappings = template.mappings ?? [];
  if (mappings.length === 0) return "—";
  const primary = mappings[0];
  const rest = mappings.length - 1;
  return rest > 0 ? `${primary.frameworkLabel} +${rest}` : primary.frameworkLabel;
}


function activityCountLabel(count: number): string {
  if (count === 0) return "—";
  return count === 1 ? "1 aktivitet" : `${count} aktiviteter`;
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


export function MSPServiceCatalogTab({ onOpenSecondary }: { onOpenSecondary?: (view: "settings" | "how-it-works") => void } = {}) {
  const navigate = useNavigate();
  const { defaultHourlyRate, currencyOption } = useServiceDefaults();
  const { branding } = usePartnerBranding();
  const [hourlyRate, setHourlyRate] = useState<number>(defaultHourlyRate);
  const [manualOpen, setManualOpen] = useState(false);
  const [extras, setExtras] = useState<ExtraService[]>(() => []);
  const [searchDraft, setSearchDraft] = useState<CustomServiceDraft | null>(null);
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
  const [showMynderProducts, setShowMynderProducts] = useState(false);
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null);
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
  const [activeTab, setActiveTab] = useState("mine");

  // Forrige wizard-svar — brukes for å oppdage scope-endringer.
  const [previousAnswers, setPreviousAnswers] = useState<WizardAnswers | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const raw = window.localStorage.getItem(WIZARD_ANSWERS_STORAGE_KEY);
      return raw ? (JSON.parse(raw) as WizardAnswers) : null;
    } catch { return null; }
  });
  const [scopeDialog, setScopeDialog] = useState<{ diff: ScopeDiff; recs: ScopeRecommendations } | null>(null);

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

  // Bruk brukervalgt endringer fra Lara-scope-dialogen på tjenestekatalogen.
  const applyScopeChanges = (recs: ScopeRecommendations, sel: ScopeChangeSelection) => {
    let addedCount = 0;
    let extendedCount = 0;
    let reviewCount = 0;

    // Legg til nye tjenester
    sel.addTemplateIds.forEach((tid) => {
      const rec = recs.toAdd.find((r) => r.templateId === tid);
      const tpl = SERVICE_LIBRARY.find((t) => t.id === tid);
      if (!tpl || !rec) return;
      if (adoptedIds.has(tpl.id)) return;
      adoptTemplate(tpl);
      addedCount += 1;
    });

    // Utvid eksisterende + marker for gjennomgang i én setExtras-runde
    setExtras((prev) =>
      prev.map((e) => {
        // Utvid
        const ext = recs.toExtend.find((r) => r.extraId === e.id);
        if (ext && sel.extendExtraIds.includes(e.id)) {
          const tpl = SERVICE_LIBRARY.find((t) => t.id === ext.templateId);
          if (tpl) {
            const currentFwIds = new Set(e.mappings.map((m) => m.frameworkId));
            const newMappings: ServiceMapping[] = tpl.mappings
              .filter((m) => !currentFwIds.has(m.frameworkId) && ext.addedFrameworkLabels.includes(m.frameworkLabel))
              .flatMap((m) => {
                const fw = FRAMEWORK_CATALOG.find((f) => f.id === m.frameworkId);
                const roles = getMappingRoles(tpl, m);
                return m.controlIds.map((cid) => {
                  const cp = fw?.controlPoints.find((c) => c.id === cid);
                  return {
                    frameworkId: m.frameworkId,
                    frameworkShortName: fw?.shortName ?? m.frameworkLabel,
                    controlId: cid,
                    controlLabel: cp?.label ?? cid,
                    roles,
                  } as ServiceMapping;
                });
              });
            if (newMappings.length > 0) {
              extendedCount += 1;
              return {
                ...e,
                mappings: [...e.mappings, ...newMappings],
                laraExtensionSummary: `Utvidet med ${ext.addedFrameworkLabels.join(", ")} (${newMappings.length} krav)`,
                laraReviewReason: undefined,
              };
            }
          }
        }
        // Marker for gjennomgang
        const rev = recs.toReview.find((r) => r.extraId === e.id);
        if (rev && sel.reviewExtraIds.includes(e.id)) {
          reviewCount += 1;
          return { ...e, laraReviewReason: rev.reason };
        }
        return e;
      }),
    );

    const summary = [
      addedCount ? `${addedCount} lagt til` : null,
      extendedCount ? `${extendedCount} utvidet` : null,
      reviewCount ? `${reviewCount} markert for gjennomgang` : null,
    ].filter(Boolean).join(" · ");
    toast.success("Lara oppdaterte tjenestekatalogen", { description: summary || "Ingen endringer" });
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
      setSearchDraft(null);
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
    setSearchDraft(null);
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
    : searchDraft
    ? searchDraft
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
  const availablePicks = useMemo(
    () => mergedPicks.filter((p) => {
      const tpl = SERVICE_LIBRARY.find((t) => t.code === p.code);
      return tpl ? !adoptedIds.has(tpl.id) : true;
    }),
    [mergedPicks, adoptedIds],
  );
  const activePicks: Pick[] = useMemo(
    () => (onlyRecommended ? availablePicks.filter((p) => p.recommended) : availablePicks),
    [availablePicks, onlyRecommended],
  );
  const recommendedCount = availablePicks.filter((p) => p.recommended).length;

  const mineActiveCount = extras.filter((e) => !e.isMynder && e.status !== "retired").length;

  return (
    <div className="space-y-6">
      {/* Global søk — over arkfanene, alltid tilgjengelig */}
      <ServiceCoverageSearch
        existingNames={extras.filter((e) => !e.isMynder && e.status !== "retired").map((e) => e.name)}
        onCreate={({ name, suggestedDescription, mappings }) => {
          setSearchDraft({
            name,
            description: suggestedDescription,
            hours: 0,
            activities: [],
            mappings,
          });
          setEditingId(null);
          setPreviewTemplate(null);
          setManualOpen(true);
        }}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">

        <div className="flex items-center justify-between gap-2">
          <TabsList>
            <TabsTrigger value="mine">
              Mine ({mineActiveCount + 3})
            </TabsTrigger>
            <TabsTrigger value="alle">
              Alle ({availablePicks.length})
            </TabsTrigger>
          </TabsList>
          {onOpenSecondary && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" aria-label="Innstillinger og hjelp">
                  <Settings2 className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => onOpenSecondary("settings")}>
                  <Settings2 className="h-4 w-4 mr-2" />
                  Innstillinger
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => openWizard()}>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Tjenesteprofil
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => onOpenSecondary("how-it-works")}>
                  <FileText className="h-4 w-4 mr-2" />
                  Hvordan virker det
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

        </div>

        <TabsContent value="alle" className="space-y-6 mt-4">
      {/* Foreslåtte tjenester — vises øverst når brukeren kommer inn */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div className="text-sm font-medium text-foreground">Velg tjenester til din katalog</div>
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="inline-flex items-center justify-center text-muted-foreground/70 hover:text-foreground transition-colors"
                  aria-label="Om katalogen"
                >
                  <Info className="h-4 w-4" />
                </button>
              </PopoverTrigger>
              <PopoverContent side="top" className="max-w-sm p-3 space-y-2">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Bygg din egen tjenestekatalog fra Mynders bibliotek av sikkerhets- og compliance-tjenester. Hver tjeneste er koblet mot relevante regelverk og krav, slik at du raskt kan matche kundens behov med riktig tilbud. Du beholder full kontroll: velg, tilpass eller legg til egne tjenester og priser.
                </p>
                <div className="flex items-start gap-2 text-xs text-muted-foreground leading-relaxed">
                  <Sparkles className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                  <p className="flex-1">
                    Koblingen mellom tjenester og krav er foreslått av Lara — ikke verifisert av menneske. Forholdet er ikke 1:1.
                  </p>
                </div>
                <div className="space-y-1.5 text-xs text-muted-foreground leading-relaxed">
                  <p className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    Slik er koblingene laget
                  </p>
                  <p>Lara (AI) foreslår hvilke krav og artikler en tjeneste dekker basert på beskrivelser, aktiviteter og nøkkelord.</p>
                  <p>Forslagene er ikke verifisert av mennesker. Kvalitetssikre før du bruker dem i et tilbud eller en leveranse.</p>
                  <p>Forholdet er ikke 1:1 — én tjeneste kan dekke flere krav, og ett krav kan kreve flere tiltak eller supplerende dokumentasjon.</p>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <p className="flex items-start gap-1.5 text-xs text-muted-foreground leading-relaxed">
          <Sparkles className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" aria-hidden="true" />
          <span>
            Tjenestene under er anbefalinger basert på tjenesteprofilen din — bransjen du opererer i, kundetypene og fagområdene du har oppgitt. Du kan endre profilen under{" "}
            <button
              type="button"
              onClick={() => openWizard()}
              className="underline underline-offset-2 hover:text-foreground"
            >
              Tjenesteprofil
            </button>{" "}
            i innstillingsknappen (<Settings2 className="inline h-3 w-3 align-[-1px]" aria-hidden="true" />) øverst til høyre.
          </span>
        </p>







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
          <table className="w-full text-sm">
            <thead className="bg-muted/30 text-foreground/70">
              <tr>
                <th className="text-left font-medium px-3 py-2.5">
                  <div className="flex items-center gap-1">
                    Tjeneste
                    <AiMappingDisclosure variant="icon" />
                  </div>
                </th>
                <th className="text-left font-medium px-3 py-2.5">Støtter</th>
                <th className="text-left font-medium px-3 py-2.5">Aktiviteter</th>
                <th className="text-right font-medium px-3 py-2.5 w-32">Handling</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {activePicks.map((pick) => {
                const template = SERVICE_LIBRARY.find((t) => t.code === pick.code);
                if (!template) return null;
                const isAdopted = adoptedIds.has(template.id);
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
                      <div className="font-medium text-foreground">{pick.label}</div>
                    </td>
                    <td className="px-3 py-3 text-foreground/80">
                      {formatSupportedSummary(template)}
                    </td>
                    <td className="px-3 py-3">

                      {(() => {
                        const activities = template.activities ?? [];
                        if (activities.length === 0) {
                          return <span className="text-sm text-muted-foreground">—</span>;
                        }
                        const preview = activities.slice(0, 4);
                        const rest = activities.length - preview.length;
                        return (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="text-sm text-foreground/80 tabular-nums cursor-help underline decoration-dotted underline-offset-4">
                                {activityCountLabel(activities.length)}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs text-xs">
                              <ul className="space-y-0.5">
                                {preview.map((a) => (
                                  <li key={a.label}>• {a.label}</li>
                                ))}
                                {rest > 0 && <li className="text-muted-foreground">… og {rest} til</li>}
                              </ul>
                              <p className="mt-1.5 text-muted-foreground">Åpne tjenesten for å se alle aktivitetene.</p>
                            </TooltipContent>
                          </Tooltip>
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
                                  className="inline-flex items-center gap-1.5 h-8 pl-2 pr-2.5 rounded-full bg-primary text-primary-foreground text-xs font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
                                  aria-label="Se tjeneste i katalogen"
                                >
                                  <Check className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden="true" />
                                  <span>Se tjeneste</span>
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
                                onClick={(ev) => { ev.stopPropagation(); adoptTemplate(template); }}
                                className="h-8 gap-1 text-xs bg-primary text-primary-foreground hover:bg-accent hover:text-accent-foreground"
                              >
                                {pick.recommended ? (
                                  <Star className="h-3 w-3 fill-primary-foreground text-primary-foreground" aria-hidden="true" />
                                ) : (
                                  <Plus className="h-3.5 w-3.5" aria-hidden="true" />
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

        </TabsContent>

        <TabsContent value="mine" className="space-y-6 mt-4">




      {/* Min tjenestekatalog */}


      {(() => {
        const mine = extras.filter((e) => !e.isMynder && e.status !== "retired");
        const lockedCount = mine.filter((e) => !!getLockInfo({ templateId: e.templateId, name: e.name })).length;
        return (
          <section ref={catalogSectionRef} id="min-katalog" className="space-y-2 scroll-mt-24">
            <div className="flex flex-col items-end gap-0.5">
              <div className="flex items-baseline justify-end gap-3">
                {mine.length > 0 && (
                  <span className="text-sm text-foreground/70 whitespace-nowrap">
                    {mine.length} {mine.length === 1 ? "tjeneste" : "tjenester"}
                    {lockedCount > 0 && <> · {lockedCount} på tilbud</>}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground text-right">
                {mine.length} {mine.length === 1 ? "tjeneste" : "tjenester"} og {MYNDER_PRODUCTS.length} produkter fra Mynder i katalogen.
              </p>
            </div>
            <div className="rounded-md border border-border bg-card">

              <div className="flex items-center gap-3 px-3 py-2 bg-muted/30 border-b border-border">
                <div className="flex-1 min-w-0 text-xs font-medium text-foreground/60 inline-flex items-center gap-1.5">
                  Tjeneste
                  <AiMappingDisclosure variant="icon" />
                </div>
                <div className="text-xs font-medium text-foreground/60 whitespace-nowrap w-40 hidden md:block">Regelverk</div>
                <div className="text-xs font-medium text-foreground/60 whitespace-nowrap w-16 text-right hidden md:block">Aktiviteter</div>
                <div className="text-xs font-medium text-foreground/60 whitespace-nowrap w-12 text-right">Timer</div>
                <div className="text-xs font-medium text-foreground/60 whitespace-nowrap w-24 text-right">Pris</div>
                <div className="w-11" />
                <div className="w-11" />
              </div>
              {mine.length === 0 ? (
                <div className="px-4 py-6 text-center border-b border-dashed border-border last:border-b-0">
                  <p className="text-sm text-foreground/70">
                    Gå til arkfanen{" "}
                    <button
                      type="button"
                      onClick={() => setActiveTab("alle")}
                      className="inline font-medium text-primary hover:text-primary/80 underline underline-offset-2"
                    >
                      Alle
                    </button>{" "}
                    for å legge til tjenester fra Mynders tjenestekatalog.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {extras.filter((e) => !e.isMynder && e.status !== "retired").map((e) => {
              const price = e.priceOverride ?? e.hours * hourlyRate;
              const lock = getLockInfo({ templateId: e.templateId, name: e.name });
              return (
                <div key={e.id} className={cn(
                  "flex items-center gap-3 px-3 py-3 transition-colors cursor-pointer hover:bg-muted/30",
                  highlightId === e.id && "bg-primary/5 ring-1 ring-inset ring-primary/30",
                )}
                onClick={() => { setEditingId(e.id); setManualOpen(true); }}
                role="button"
                tabIndex={0}
                onKeyDown={(ev) => {
                  if (ev.key === "Enter" || ev.key === " ") {
                    ev.preventDefault();
                    setEditingId(e.id); setManualOpen(true);
                  }
                }}
                >
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
                    {e.laraExtensionSummary && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge variant="outline" className="text-xs h-6 px-1.5 gap-1 border-primary/30 bg-primary/5 text-primary cursor-help shrink-0">
                            <Sparkles className="h-3 w-3" aria-hidden="true" />
                            Lara utvidet
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs text-xs">
                          {e.laraExtensionSummary}
                        </TooltipContent>
                      </Tooltip>
                    )}
                    {e.laraReviewReason && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge variant="outline" className="text-xs h-6 px-1.5 gap-1 border-warning/40 bg-warning/10 text-warning cursor-help shrink-0">
                            <AlertTriangle className="h-3 w-3" aria-hidden="true" />
                            Gjennomgå
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs text-xs">
                          <div>{e.laraReviewReason}</div>
                          <button
                            type="button"
                            onClick={(ev) => {
                              ev.stopPropagation();
                              setExtras((prev) => prev.map((x) => x.id === e.id ? { ...x, laraReviewReason: undefined } : x));
                            }}
                            className="mt-1 text-[11px] underline"
                          >
                            Fjern markering
                          </button>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                  {(() => {
                    const fwLabels = Array.from(new Set(e.mappings.map((m) => m.frameworkShortName)));
                    const shown = fwLabels.slice(0, 2);
                    const extra = fwLabels.length - shown.length;
                    return (
                      <div className="hidden md:flex items-center gap-1 w-40 flex-wrap">
                        {shown.length === 0 ? (
                          <span className="text-xs text-muted-foreground">—</span>
                        ) : (
                          shown.map((label) => (
                            <Badge key={label} variant="outline" className="text-[11px] h-5 px-1.5 font-normal">
                              {label}
                            </Badge>
                          ))
                        )}
                        {extra > 0 && (
                          <span className="text-[11px] text-muted-foreground">+{extra}</span>
                        )}
                      </div>
                    );
                  })()}
                  <div className="hidden md:block text-sm text-foreground/70 tabular-nums whitespace-nowrap w-16 text-right">
                    {e.activities.length || "—"}
                  </div>
                  <div className="text-base text-foreground/70 tabular-nums whitespace-nowrap w-12 text-right">
                    {e.hours} t
                  </div>
                  <div className="text-base font-semibold tabular-nums text-foreground whitespace-nowrap w-24 text-right">
                    {formatNOK(price)}
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(ev) => {
                      ev.stopPropagation();
                      setEditingId(e.id); setManualOpen(true);
                    }}
                    className="h-11 w-11 text-foreground/70 hover:text-foreground"
                    aria-label="Rediger tjeneste"
                  >
                    <Pencil className="h-4 w-4" aria-hidden="true" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(ev) => ev.stopPropagation()}
                        className="h-11 w-11 text-foreground/50 hover:text-foreground"
                        aria-label="Flere handlinger"
                      >
                        <MoreVertical className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuItem onClick={() => setRetireId(e.id)}>
                        <Archive className="mr-2 h-4 w-4" />
                        Avvikle tjeneste
                      </DropdownMenuItem>
                      {lock ? (
                        <TooltipProvider delayDuration={200}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div>
                                <DropdownMenuItem
                                  disabled
                                  className="text-muted-foreground"
                                  onSelect={(ev) => ev.preventDefault()}
                                >
                                  <Lock className="mr-2 h-4 w-4" />
                                  Slett tjeneste
                                </DropdownMenuItem>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="left">
                              Kan ikke slettes — inngår i tilbud {lock.offerNumber}. Bruk «Avvikle».
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        <DropdownMenuItem
                          onClick={() => removeExtra(e.id)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Slett tjeneste
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              );
              })}
                </div>
              )}
            </div>
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
                    size="sm"
                    onClick={() => restoreExtra(e.id)}
                    className="h-8 gap-1.5 text-xs bg-primary text-primary-foreground hover:bg-accent hover:text-accent-foreground"
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

      {/* Mynder-produkter — videresalg med provisjon (kollapsbar) */}
      {(() => {
        const products = MYNDER_PRODUCTS;
        const sym = currencyOption.symbol;
        const trailing = sym === "kr";
        const fmt = (n: number) =>
          `${new Intl.NumberFormat("nb-NO", { maximumFractionDigits: 0 }).format(Math.round(n))} ${sym}`;
        const fmtPrice = (n: number) => (trailing ? fmt(n) : `${sym} ${Math.round(n)}`);
        return (

          <section className="space-y-3">
            <button
              type="button"
              onClick={() => setShowMynderProducts((v) => !v)}
              className="w-full flex items-center justify-between gap-3 rounded-md border border-border bg-card px-4 py-3 text-left hover:bg-accent/40 transition-colors"
              aria-expanded={showMynderProducts}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">Produkter fra Mynder</span>
                <span className="text-xs text-muted-foreground">({products.length})</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{showMynderProducts ? "Skjul" : "Vis"}</span>
                {showMynderProducts ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </div>
            </button>
            {showMynderProducts && (
              <div className="space-y-2">
                {products.map((p) => {
                  const info = MODULE_INFO[p.moduleKey];
                  const isOpen = expandedProduct === p.id;
                  return (
                    <div key={p.id} className="rounded-md border border-border bg-card overflow-hidden">
                      <div className="flex items-center gap-3 px-4 py-3">
                        <button
                          type="button"
                          onClick={() => setExpandedProduct(isOpen ? null : p.id)}
                          className="flex-1 min-w-0 flex items-center gap-3 text-left"
                          aria-expanded={isOpen}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-foreground">{p.name}</div>
                            <div className="text-xs text-muted-foreground truncate">{info.tagline}</div>
                          </div>
                          <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground whitespace-nowrap">
                            <span className="tabular-nums">Fra {fmtPrice(p.fromPrice)}/mnd</span>
                            <span>·</span>
                            <span>{p.commissionPct} % provisjon</span>
                          </div>
                        </button>
                        <div onClick={(e) => e.stopPropagation()}>
                          <SetupFeeCell
                            productId={p.id}
                            productName={p.name}
                            currencySymbol={sym}
                            trailing={trailing}
                            format={fmt}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => setExpandedProduct(isOpen ? null : p.id)}
                          className="text-muted-foreground hover:text-foreground"
                          aria-label={isOpen ? "Skjul detaljer" : "Vis detaljer"}
                        >
                          {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </button>
                      </div>
                      {isOpen && (
                        <div className="border-t border-border bg-muted/20 px-4 py-4 space-y-4">
                          <p className="text-sm text-foreground/80 leading-relaxed">{info.description}</p>

                          <div className="space-y-1.5">
                            <div className="text-xs font-medium text-muted-foreground">
                              Hva kunden får
                            </div>
                            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
                              {info.features.slice(0, 5).map((f, i) => (
                                <li key={i} className="flex items-start gap-1.5 text-sm text-foreground/80">
                                  <Check className="h-3.5 w-3.5 mt-0.5 text-primary shrink-0" aria-hidden="true" />
                                  <span>{f}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div className="space-y-1.5">
                            <div className="text-xs font-medium text-muted-foreground">
                              Nivåer kunden kan velge
                            </div>
                            <div className="rounded-md border border-border bg-card overflow-hidden">
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="text-left text-xs text-muted-foreground border-b border-border">
                                    <th className="px-3 py-2 font-medium">Nivå</th>
                                    <th className="px-3 py-2 font-medium text-right">Pris/mnd</th>
                                    <th className="px-3 py-2 font-medium text-right">Din andel</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                  {p.tiers.map((t, i) => {
                                    const share = (t.priceKr * p.commissionPct) / 100;
                                    return (
                                      <tr key={i}>
                                        <td className="px-3 py-2 text-foreground/80">{t.label}</td>
                                        <td className="px-3 py-2 text-right tabular-nums text-foreground/80">
                                          {t.isFree ? "Gratis" : fmtPrice(t.priceKr)}
                                        </td>
                                        <td className="px-3 py-2 text-right tabular-nums font-semibold text-foreground">
                                          {t.isFree ? (
                                            <span className="text-xs font-normal text-muted-foreground">Ingen provisjon</span>
                                          ) : (
                                            fmtPrice(share)
                                          )}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
                <p className="text-xs text-muted-foreground pt-1">{formatTaxNote(branding.tax)}</p>
              </div>
            )}
          </section>
        );
      })()}
        </TabsContent>

      </Tabs>



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
        onOpenChange={(o) => {
          setManualOpen(o);
          if (!o) {
            setEditingId(null);
            setPreviewTemplate(null);
            setSearchDraft(null);
          }
        }}
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
        initialAnswers={previousAnswers}
        onSaveProfile={(answers) => {
          setPreviousAnswers(answers);
          try { window.localStorage.setItem(WIZARD_ANSWERS_STORAGE_KEY, JSON.stringify(answers)); } catch {}
          const parts: string[] = [];
          if (answers.markets.length) parts.push(`${answers.markets.length} marked${answers.markets.length > 1 ? "er" : ""}`);
          if (answers.domains.length) parts.push(`${answers.domains.length} fagområde${answers.domains.length > 1 ? "r" : ""}`);
          setCurationSummary(parts.join(", ") || null);
          toast.success("Tjenesteprofilen er oppdatert");
        }}
        onComplete={(_suggestions, answers) => {
          const picks = computePicksFromAnswers(answers);
          setCuratedPicks(picks.length > 0 ? picks : null);
          const parts: string[] = [];
          if (answers.markets.length) parts.push(`${answers.markets.length} marked${answers.markets.length > 1 ? "er" : ""}`);
          if (answers.domains.length) parts.push(`${answers.domains.length} fagområde${answers.domains.length > 1 ? "r" : ""}`);
          setCurationSummary(parts.join(", ") || null);
          setPreviousAnswers(answers);
          try { window.localStorage.setItem(WIZARD_ANSWERS_STORAGE_KEY, JSON.stringify(answers)); } catch {}
          toast.success(`Lara foreslo ${picks.length} tjenester basert på kartleggingen`);
        }}
      />


      {scopeDialog && (
        <LaraScopeChangeDialog
          open={!!scopeDialog}
          onOpenChange={(v) => { if (!v) setScopeDialog(null); }}
          diff={scopeDialog.diff}
          recs={scopeDialog.recs}
          onApply={(sel) => applyScopeChanges(scopeDialog.recs, sel)}
        />
      )}



    </div>
  );
}
