import { useEffect, useMemo, useRef, useState } from "react";
import type { SearchKind } from "@/lib/serviceSearchMatch";
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
import { SERVICE_LIBRARY, type ServiceTemplate, type PartnerContext } from "@/lib/serviceLibrary";
import { useServiceDefaults } from "@/hooks/useServiceDefaults";
import { RetireServiceDialog, type RetireServiceOptions } from "./RetireServiceDialog";
import { MSPLaraServiceWizard } from "./MSPLaraServiceWizard";
import { ServiceCoverageSearch } from "./ServiceCoverageSearch";
import { MSPFrameworkHoursTab } from "./MSPFrameworkHoursTab";
import type { SavedFrameworkPackage } from "./MSPFrameworkTaskPackageSheet";
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

import { CORE_TIERS, VENDOR_TIERS, TRUST_CENTER_PRICE_KR, TRUST_CENTER_V2 } from "@/lib/planConstants";
import { MYNDER_PRODUCTS } from "@/lib/mynderProducts";

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


export function MSPServiceCatalogTab({ onOpenSecondary, onRegisterActions }: { onOpenSecondary?: (view: "settings" | "how-it-works") => void; onRegisterActions?: (actions: { openWizard: () => void }) => void } = {}) {
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
  useEffect(() => {
    onRegisterActions?.({ openWizard });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onRegisterActions]);
  const [curatedPicks, setCuratedPicks] = useState<Pick[] | null>(null);
  const [curationSummary, setCurationSummary] = useState<string | null>(null);
  const [onlyRecommended, setOnlyRecommended] = useState(false);
  const [activeTab, setActiveTab] = useState("regelverk");
  const [openFrameworkId, setOpenFrameworkId] = useState<string | null>(null);
  const [searchMode, setSearchMode] = useState<SearchKind>("framework");

  useEffect(() => {
    if (searchMode === "product") {
      setActiveTab("mine");
      setShowMynderProducts(true);
    }
  }, [searchMode]);


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
                return m.controlIds.map((cid) => {
                  const cp = fw?.controlPoints.find((c) => c.id === cid);
                  return {
                    frameworkId: m.frameworkId,
                    frameworkShortName: fw?.shortName ?? m.frameworkLabel,
                    controlId: cid,
                    controlLabel: cp?.label ?? cid,
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

  const saveFrameworkPackageAsService = (pkg: SavedFrameworkPackage) => {
    const service: ExtraService = {
      id: `framework-${pkg.frameworkId}-${Date.now()}`,
      name: pkg.name,
      description: `Full timeleveranse som dekker kravene i ${pkg.frameworkName}.`,
      hours: pkg.hours,
      activities: pkg.tasks,
      source: "manual",
      mappings: pkg.requirementIds.slice(0, 40).map((rid) => ({
        frameworkId: pkg.frameworkId,
        frameworkShortName: pkg.frameworkName,
        controlId: rid,
        controlLabel: rid,
      })),
      priceOverride: pkg.price,
    };
    setExtras((prev) => [...prev, service]);
    setActiveTab("mine");
    revealInCatalog(service.id);
    toast.success(`La til «${pkg.name}» i din tjenestekatalog`, {
      description: `${pkg.tasks.length} oppgaver · ${pkg.hours} timer`,
      action: { label: "Vis i katalogen", onClick: () => revealInCatalog(service.id) },
    });
  };



  const removeExtra = (id: string) => {
    const target = extras.find((e) => e.id === id);
    if (target) {
      const lock = getLockInfo({ templateId: target.templateId, name: target.name });
      if (lock) {
        toast.error("Kan ikke slettes", {
          description: `«${target.name}» inngår i tilbud ${lock.offerNumber}. Bruk «Avslutt» for kontrollert utfasing.`,
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
    toast.success(`«${prev.name}» er avsluttet`, {
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
      <MSPFrameworkHoursTab
        onSaveAsService={saveFrameworkPackageAsService}
        openFrameworkId={openFrameworkId}
        onOpenedFramework={() => setOpenFrameworkId(null)}
      />
    </div>
  );
}
