import { useState, useMemo, useEffect, useRef, type Dispatch, type SetStateAction } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ChevronDown, ChevronUp, Users, Bot, CheckCircle2, UserCheck, Paperclip, FileText as FileIcon, Download, ShieldCheck, Sparkles, Clock, Search, X, ArrowRight, HelpCircle, Upload, BotMessageSquare, CircleDashed, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";


import { getRequirementsByFramework } from "@/lib/complianceRequirementsData";
import { ALL_ADDITIONAL_REQUIREMENTS } from "@/lib/additionalFrameworkRequirements";
import type { ComplianceRequirement, AgentCapability } from "@/lib/complianceRequirementsData";
import { ManualDocumentationDialog } from "@/components/dialogs/ManualDocumentationDialog";
import { LaraDataSourceExplainer } from "@/components/regulations/LaraDataSourceExplainer";
import { SaraOnboardingDialog } from "@/components/regulations/SaraOnboardingDialog";
import { AttachEvidenceDialog, type AttachEvidenceResult } from "@/components/regulations/AttachEvidenceDialog";
import { MessageSquare, Save, Pencil } from "lucide-react";
import {
  demoUiStateFor,
  getProgressConfig,
  normalizeProgress,
  SELECTABLE_PROGRESS,
  type RequirementUiState,
  type ProgressStatus,
  type EvidenceDocument,
} from "@/lib/requirementStatusModel";
import { inferFulfillment, calculateCoverage } from "@/lib/requirementFulfillment";
import { getArticlesForRequirement } from "@/lib/requirementArticles";
import { getRequirementGuidance, getEvaluationCriteriaText, getExtendedDescription } from "@/lib/requirementGuidance";
import { Info, Target, ListChecks, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { CONTROL_AREAS, toCanonicalArea, type ControlAreaKey } from "@/lib/controlAreas";
import {
  agentConfirmedRequirementIds,
  buildExpectedEvidenceRows,
  expectedStatusLabel,
} from "@/lib/frameworkEvidenceExpectations";


type FilterKey = "all" | "waiting_you" | "agent" | "ok";

/** Map ny fremdrift → legacy filter-bøtte for tabs. */
function bucketOf(progress: ProgressStatus): "met" | "partial" | "not_met" | "na" {
  const p = normalizeProgress(progress);
  if (p === "fulfilled") return "met";
  if (p === "not_applicable") return "na";
  return "not_met";
}

function generateUiStates(
  requirements: ComplianceRequirement[],
  agentConfirmed: Set<string>,
): Record<string, RequirementUiState> {
  const states: Record<string, RequirementUiState> = {};
  requirements.forEach((req) => {
    const base = demoUiStateFor(req.requirement_id);
    // Krav som agenten har fulgt opp og bekreftet skal speiles som oppfylt.
    states[req.requirement_id] = agentConfirmed.has(req.requirement_id)
      ? { ...base, progress: "fulfilled", evidence: base.evidence === "required" ? "self_reported" : base.evidence }
      : base;
  });
  return states;
}


const capabilityLabel: Record<AgentCapability, { label: string; tooltip: string; instruction: string; icon: typeof Bot }> = {
  full: {
    label: "Auto",
    tooltip: "Plattformen verifiserer og fyller ut dette kravet automatisk basert på data og handlinger i systemet.",
    instruction: "Plattformen henter dette automatisk — ingen handling kreves fra deg.",
    icon: Bot,
  },
  assisted: {
    label: "Assistert",
    tooltip: "Lara AI forbereder et utkast eller forslag som du gjennomgår og godkjenner.",
    instruction: "Lara forbereder et utkast. Du gjennomgår og godkjenner.",
    icon: Bot,
  },
  manual: {
    label: "Manuell",
    tooltip: "Dette kravet må dokumenteres og bekreftes manuelt av en person.",
    instruction: "Last opp et dokument eller skriv en kort beskrivelse av hvordan kravet er oppfylt.",
    icon: Users,
  },
};

function getRecommendedDocs(req: ComplianceRequirement, isNb: boolean): string[] {
  const nb = [
    "Styrevedtak eller ledelsesprotokoll som godkjenner tiltaket",
    "Skriftlig policy eller rutine som beskriver hvordan kravet oppfylles",
    "Risikovurdering som viser vurderte trusler og tiltak",
    "Sist reviderte versjon av dokumentet (dato og eier)",
    "Bevis på gjennomføring — logg, sjekkliste eller rapport",
    "Referanse til relevant artikkel eller kontroll i regelverket",
  ];
  const en = [
    "Board decision or management protocol approving the measure",
    "Written policy or procedure describing how the requirement is met",
    "Risk assessment showing evaluated threats and mitigations",
    "Latest reviewed version of the document (date and owner)",
    "Proof of execution — log, checklist or report",
    "Reference to the relevant article or control in the regulation",
  ];
  return isNb ? nb : en;
}

interface FrameworkRequirementsListProps {
  frameworkId: string;
  onCountsChange?: (counts: { met: number; partial: number; notMet: number; auto: number; manual: number; total: number }) => void;
  highlightRequirementId?: string | null;
}

import { useRequirementEvidence } from "@/hooks/useRequirementEvidence";
import { persistRequirementEvidence } from "@/lib/requirementEvidence";

export const FrameworkRequirementsList = ({ frameworkId, onCountsChange, highlightRequirementId }: FrameworkRequirementsListProps) => {
  const { i18n } = useTranslation();
  const isNb = i18n.language !== "en";
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [grouping, setGrouping] = useState<"status" | "control_area">("status");
  const [docsOnly, setDocsOnly] = useState(false);
  const [search, setSearch] = useState("");
  const [docDialog, setDocDialog] = useState<{ id: string; name: string } | null>(null);
  const [reqNotes, setReqNotes] = useState<Record<string, string>>({});
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [draftNote, setDraftNote] = useState<string>("");
  const [cursorTip, setCursorTip] = useState<{ x: number; y: number } | null>(null);
  const [attachDialog, setAttachDialog] = useState<{ id: string; name: string; description?: string; articles?: string[] } | null>(null);
  const [frameworkAttachOpen, setFrameworkAttachOpen] = useState(false);
  const [saraOpen, setSaraOpen] = useState(false);
  const [readMoreIds, setReadMoreIds] = useState<Set<string>>(new Set());
  const [showAllDocsIds, setShowAllDocsIds] = useState<Set<string>>(new Set());
  const toggleSet = (setter: Dispatch<SetStateAction<Set<string>>>, id: string) =>
    setter((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const reqRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    if (highlightRequirementId) {
      setFilter("all");
      setExpandedId(highlightRequirementId);
      setTimeout(() => {
        reqRefs.current[highlightRequirementId]?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 100);
    }
  }, [highlightRequirementId]);

  const requirements = useMemo(() => {
    const main = getRequirementsByFramework(frameworkId);
    if (main.length > 0) return main;
    return ALL_ADDITIONAL_REQUIREMENTS.filter((r) => r.framework_id === frameworkId);
  }, [frameworkId]);

  /** Krav agenten har fulgt opp og bekreftet (stabilt sett). */
  const agentFollowedUp = useMemo(
    () => agentConfirmedRequirementIds(requirements, () => false),
    [requirements],
  );

  const [uiStates, setUiStates] = useState<Record<string, RequirementUiState>>(() =>
    generateUiStates(requirements, agentFollowedUp)
  );

  /** Lagrede bevis fra databasen legges oppå de genererte statusene. */
  const { byRequirement: storedEvidence, refetch: refetchEvidence } = useRequirementEvidence(frameworkId);

  useEffect(() => {
    const ids = Object.keys(storedEvidence);
    if (ids.length === 0) return;
    setUiStates((prev) => {
      const next = { ...prev };
      for (const reqId of ids) {
        const rows = storedEvidence[reqId];
        const cur = next[reqId] ?? { progress: "not_started" as ProgressStatus, evidence: "required" as const };
        const existing = cur.documents ?? [];
        const knownNames = new Set(existing.map((d) => d.name));
        const documents = [
          ...rows.filter((r) => !knownNames.has(r.document.name)).map((r) => r.document),
          ...existing,
        ];
        if (documents.length === existing.length) continue;
        const covered = Array.from(new Set(rows.flatMap((r) => r.coveredArticles)));
        const missing = Array.from(
          new Set(rows.flatMap((r) => r.missingArticles).filter((a) => !covered.includes(a))),
        );
        const fullCoverage = missing.length === 0;
        next[reqId] = {
          ...cur,
          progress: "fulfilled",
          evidence: fullCoverage ? "attested" : "self_reported",
          documents,
          coveredArticles: covered,
          missingArticles: missing,
          evidenceCount: { collected: covered.length, required: covered.length + missing.length || documents.length },
        };
      }
      return next;
    });
  }, [storedEvidence]);


  const counts = useMemo(() => {
    let met = 0, partial = 0, notMet = 0;
    for (const s of Object.values(uiStates)) {
      const b = bucketOf(s.progress);
      if (b === "met") met++;
      else if (b === "partial") partial++;
      else if (b === "not_met") notMet++;
    }
    const auto = requirements.filter((r) => r.agent_capability === "full").length;
    const manual = requirements.filter((r) => r.agent_capability !== "full").length;
    let waitingYou = 0, agentFollowUp = 0;
    for (const r of requirements) {
      if (agentFollowedUp.has(r.requirement_id)) { agentFollowUp++; continue; }
      const b = bucketOf(uiStates[r.requirement_id]?.progress ?? "not_started");
      if (b === "met") continue;
      waitingYou++;
    }
    return { met, partial, notMet, auto, manual, waitingYou, agentFollowUp, total: requirements.length };
  }, [uiStates, requirements, agentFollowedUp]);

  useEffect(() => {
    onCountsChange?.(counts);
  }, [counts, onCountsChange]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = requirements;
    if (filter !== "all") {
      list = list.filter((r) => {
        const isAgent = agentFollowedUp.has(r.requirement_id);
        const b = bucketOf(uiStates[r.requirement_id]?.progress ?? "not_started");
        if (filter === "ok") return b === "met" && !isAgent;
        if (filter === "agent") return isAgent;
        return !isAgent && b !== "met";
      });
    }

    if (q) {
      list = list.filter((r) =>
        r.name_no.toLowerCase().includes(q) ||
        r.description_no.toLowerCase().includes(q) ||
        r.requirement_id.toLowerCase().includes(q),
      );
    }
    return list;
  }, [filter, requirements, uiStates, search, agentFollowedUp]);


  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  /** Seksjoner: enten de 5 kontrollområdene, eller statusbøttene. */
  const groups = useMemo(() => {
    const metCount = (items: ComplianceRequirement[]) =>
      items.filter((r) => bucketOf(uiStates[r.requirement_id]?.progress ?? "not_started") === "met").length;

    if (grouping === "control_area") {
      const byArea = new Map<ControlAreaKey, ComplianceRequirement[]>();
      for (const req of filtered) {
        const area = toCanonicalArea(req.sla_category);
        const list = byArea.get(area) ?? [];
        list.push(req);
        byArea.set(area, list);
      }
      return CONTROL_AREAS.map((a) => {
        const items = byArea.get(a.key) ?? [];
        return {
          key: a.key as string,
          label: isNb ? a.labelNb : a.labelEn,
          Icon: a.icon,
          accentClass: a.accentClass,
          items,
          met: metCount(items),
        };
      }).filter((g) => g.items.length > 0);
    }

    const statusOrder: Array<{ key: "not_met" | "partial" | "met" | "na"; nb: string; en: string }> = [
      { key: "not_met", nb: "Ikke oppfylt", en: "Not met" },
      { key: "partial", nb: "Delvis", en: "Partially met" },
      { key: "met", nb: "Oppfylt", en: "Met" },
      { key: "na", nb: "Ikke relevant", en: "Not applicable" },
    ];
    return statusOrder
      .map((s) => {
        const items = filtered.filter(
          (r) => bucketOf(uiStates[r.requirement_id]?.progress ?? "not_started") === s.key,
        );
        return {
          key: s.key as string,
          label: isNb ? s.nb : s.en,
          Icon: ListChecks,
          accentClass: "text-muted-foreground",
          items,
          met: metCount(items),
        };
      })
      .filter((g) => g.items.length > 0);
  }, [filtered, grouping, uiStates, isNb]);

  /** Dokumentvisning: alle opplastede dokumenter samlet per kontrollområde. */
  const docGroups = useMemo(() => {
    const byArea = new Map<ControlAreaKey, { req: ComplianceRequirement; doc: EvidenceDocument }[]>();
    for (const req of filtered) {
      const docs = uiStates[req.requirement_id]?.documents ?? [];
      if (docs.length === 0) continue;
      const area = toCanonicalArea(req.sla_category);
      const list = byArea.get(area) ?? [];
      docs.forEach((doc) => list.push({ req, doc }));
      byArea.set(area, list);
    }
    return CONTROL_AREAS.map((a) => ({
      key: a.key as string,
      label: isNb ? a.labelNb : a.labelEn,
      Icon: a.icon,
      accentClass: a.accentClass,
      docs: byArea.get(a.key) ?? [],
    })).filter((g) => g.docs.length > 0);
  }, [filtered, uiStates, isNb]);

  /** Forventet dokumentasjon for regelverket, gruppert per kontrollområde. */
  const expectedRows = useMemo(() => {
    const hasDocs = (id: string) => (uiStates[id]?.documents?.length ?? 0) > 0;
    const agentConfirmed = agentConfirmedRequirementIds(requirements, hasDocs);
    return buildExpectedEvidenceRows(requirements, hasDocs, agentConfirmed, isNb);
  }, [requirements, uiStates, isNb]);

  const expectedByArea = useMemo(() => {
    const map = new Map<string, typeof expectedRows>();
    expectedRows.forEach((r) => {
      const list = map.get(r.area) ?? [];
      list.push(r);
      map.set(r.area, list);
    });
    return map;
  }, [expectedRows]);

  /** Kandidater for regelverk-nivå analyse (alle krav + artiklene de dekker). */
  const frameworkCandidates = useMemo(
    () =>
      requirements.map((r) => ({
        id: r.requirement_id,
        name: isNb ? r.name_no : r.name,
        articles: getArticlesForRequirement(r) ?? r.covered_articles ?? [],
      })),
    [requirements, isNb],
  );

  const allFrameworkArticles = useMemo(
    () => Array.from(new Set(frameworkCandidates.flatMap((c) => c.articles))),
    [frameworkCandidates],
  );

  /** Lagrer dokumentet og krav-koblingene, slik at de vises i Dokument hub. */
  const saveEvidence = async (requirementIds: string[], result: AttachEvidenceResult) => {
    try {
      const docId = await persistRequirementEvidence({
        file: result.file,
        frameworkId,
        requirementIds,
        document: result.document,
        coveredArticles: result.coveredArticles,
        missingArticles: result.missingArticles,
        coverageRatio: result.coverageRatio,
      });
      if (docId) refetchEvidence();
    } catch (err) {
      console.error("Kunne ikke lagre bevis", err);
    }
  };

  const applyFrameworkEvidence = (requirementIds: string[], result: AttachEvidenceResult) => {
    requirementIds.forEach((id) => {
      const req = requirements.find((r) => r.requirement_id === id);
      if (req) applyEvidenceAttachment(id, req, result, { silent: true });
    });
    void saveEvidence(requirementIds, result);
    setFrameworkAttachOpen(false);
    toast.success(
      isNb
        ? `Bevis tilknyttet ${requirementIds.length} krav`
        : `Evidence attached to ${requirementIds.length} requirements`,
    );
  };







  const handleDocSave = (requirementId: string, status: string, _comment: string, doc?: EvidenceDocument) => {
    setUiStates((prev) => {
      const existingDocs = prev[requirementId]?.documents ?? [];
      const documents = doc ? [doc, ...existingDocs] : existingDocs;
      const normalized = normalizeProgress(status as ProgressStatus);
      const next: RequirementUiState =
        normalized === "fulfilled"
          ? {
              progress: "fulfilled",
              evidence: documents.length > 0 ? "self_reported" : "required",
              documents,
              evidenceCount: { collected: documents.length, required: Math.max(1, documents.length) },
            }
          : normalized === "not_applicable"
            ? { progress: "not_applicable", evidence: "out_of_scope", documents }
            : { progress: "not_started", evidence: "required", documents };
      return { ...prev, [requirementId]: next };
    });
  };

  const handleStatusChange = (requirementId: string, next: ProgressStatus) => {
    setUiStates((prev) => {
      const cur = prev[requirementId] ?? { progress: "not_started" as ProgressStatus, evidence: "required" as const };
      const documents = cur.documents ?? [];
      const { verification, ...rest } = cur;
      const target = normalizeProgress(next);
      let updated: RequirementUiState;
      if (target === "fulfilled") {
        updated = {
          ...rest,
          progress: "fulfilled",
          evidence: documents.length > 0 ? "self_reported" : "required",
          documents,
        };
      } else if (target === "not_applicable") {
        updated = { ...rest, progress: "not_applicable", evidence: "out_of_scope", documents };
      } else {
        updated = { ...rest, progress: "not_started", evidence: "required", documents };
      }
      return { ...prev, [requirementId]: updated };
    });
  };

  const applyEvidenceAttachment = (
    requirementId: string,
    req: ComplianceRequirement,
    result: AttachEvidenceResult,
    opts?: { silent?: boolean },
  ) => {
    setUiStates((prev) => {
      const cur = prev[requirementId] ?? { progress: "not_started" as ProgressStatus, evidence: "required" as const };
      const existingDocs = cur.documents ?? [];
      const documents = [result.document, ...existingDocs];

      // Recompute coverage across ALL attached documents (union).
      const coverage = calculateCoverage(req.covered_articles, documents);
      const fullCoverage = coverage.ratio >= 1;
      const hasSignedDoc = coverage.hasSignedDocument;

      // Progress logic:
      //   - Full coverage + signed  → verified
      //   - Full coverage           → implemented (attested)
      //   - Partial coverage        → implemented (self_reported) — score reflects the gap
      let progress: ProgressStatus = "fulfilled";
      let evidence: RequirementUiState["evidence"] = "self_reported";
      if (fullCoverage && hasSignedDoc) {
        evidence = "verified";
      } else if (fullCoverage) {
        evidence = "attested";
      } else if (coverage.ratio > 0) {
        evidence = "self_reported";
      }

      const updated: RequirementUiState = {
        ...cur,
        progress,
        evidence,
        documents,
        coveredArticles: coverage.covered,
        missingArticles: coverage.missing,
        evidenceCount: {
          collected: coverage.covered.length,
          required: coverage.required.length || documents.length,
        },
      };
      return { ...prev, [requirementId]: updated };
    });
    if (opts?.silent) return;
    setAttachDialog(null);
    const covered = result.coveredArticles.length;
    const total = covered + result.missingArticles.length;
    toast.success(
      isNb
        ? `Bevis tilknyttet${total ? ` — ${covered}/${total} artikler dekket` : ""}`
        : `Evidence attached${total ? ` — ${covered}/${total} articles covered` : ""}`,
    );
  };

  const renderStatusControl = (requirementId: string, state: RequirementUiState) => {
    const currentCfg = getProgressConfig(state.progress);
    const CurrentIcon = currentCfg.icon;
    return (
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            onClick={(e) => e.stopPropagation()}
            className={cn(
              "inline-flex h-7 items-center gap-1.5 rounded-full border bg-background px-2.5 text-xs font-medium shadow-sm transition-colors hover:bg-muted/60",
              currentCfg.badgeClass,
            )}
            aria-label={isNb ? "Endre status" : "Change status"}
          >
            <CurrentIcon className={cn("h-3 w-3", currentCfg.iconClass)} />
            <span>{isNb ? currentCfg.labelNb : currentCfg.labelEn}</span>
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          </button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-56 p-1">
          {(SELECTABLE_PROGRESS as ProgressStatus[]).map((s) => {
            const cfg = getProgressConfig(s);
            const StatusIcon = cfg.icon;
            const active = normalizeProgress(state.progress) === s;
            return (
              <button
                key={s}
                type="button"
                onClick={() => handleStatusChange(requirementId, s)}
                className={cn(
                  "w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded hover:bg-muted text-left",
                  active && "bg-muted font-medium",
                )}
              >
                <StatusIcon className={cn("h-3.5 w-3.5", cfg.iconClass)} />
                {isNb ? cfg.labelNb : cfg.labelEn}
                {active && <CheckCircle2 className="h-3.5 w-3.5 ml-auto text-primary" />}
              </button>
            );
          })}
        </PopoverContent>
      </Popover>
    );
  };


  if (requirements.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Ingen krav registrert for denne standarden.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Rad 1: tittel + primærhandling */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="min-w-0 flex items-baseline gap-2">
          <h3 className="text-lg font-bold text-foreground">{isNb ? "Krav" : "Requirements"}</h3>
          <p className="text-xs text-muted-foreground">
            {counts.total} {isNb ? "krav" : "requirements"} · {counts.met} {isNb ? "oppfylt" : "met"}
          </p>
        </div>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              className="h-8 gap-1.5 text-xs shrink-0"
              onClick={() => setFrameworkAttachOpen(true)}
            >
              <Upload className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{isNb ? "Last opp bevis" : "Upload evidence"}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs">
            <p>
              {isNb
                ? "Last opp dokumentasjon. Lara analyserer dokumentet og foreslår hvilke krav det dekker. Bekreft forslaget, så oppdateres kravene og scoren automatisk."
                : "Upload documentation. Lara analyzes the document and suggests which requirements it covers. Confirm the suggestion, and the requirements and score are updated automatically."}
            </p>
          </TooltipContent>
        </Tooltip>

        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                className="h-8 gap-1.5 text-xs shrink-0"
                onClick={() => setSaraOpen(true)}
              >
                <Download className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{isNb ? "Installer Sara" : "Install Sara"}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-xs">
              <p>
                {isNb
                  ? "Mynder Compliance Agent Sara er en lokal agent. Klikk for å se hvordan du installerer, konfigurerer og kobler henne til dokumentkildene dine. Dokumentene prosesseres lokalt og forlater aldri infrastrukturen din — bare bevisene lastes opp til Mynder."
                  : "Mynder Compliance Agent Sara is a local agent. Click to see how to install, configure and connect her to your document sources. Documents are processed locally and never leave your infrastructure — only the evidence is uploaded to Mynder."}
              </p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => setSaraOpen(true)}
                aria-label={isNb ? "Hvordan kommer jeg i gang med Sara?" : "How do I get started with Sara?"}
              >
                <HelpCircle className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-xs">
              <p>
                {isNb
                  ? "Åpne veiledningen: last ned, installer, konfigurer og koble Sara til dokumentbiblioteket ditt."
                  : "Open the guide: download, install, configure and connect Sara to your document library."}
              </p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Rad 2: agentiske filtre */}
      <div className="flex flex-wrap items-center gap-2 mb-2">
        {([
          {
            key: "waiting_you" as FilterKey,
            labelNb: "Venter på deg",
            labelEn: "Waiting on you",
            count: counts.waitingYou,
            icon: UserCheck,
            hintNb: "Krav du må ta stilling til, dokumentere eller bekrefte selv.",
            hintEn: "Requirements you need to decide on, document or confirm yourself.",
          },
          {
            key: "agent" as FilterKey,
            labelNb: "Lara følger opp",
            labelEn: "Lara following up",
            count: counts.agentFollowUp,
            icon: Bot,
            hintNb: "Lara henter data, leser dokumenter og oppdaterer disse kravene automatisk.",
            hintEn: "Lara collects data, reads documents and updates these requirements automatically.",
          },
          {
            key: "ok" as FilterKey,
            labelNb: "I orden",
            labelEn: "In order",
            count: counts.met,
            icon: CheckCircle2,
            hintNb: "Krav som er oppfylt eller verifisert.",
            hintEn: "Requirements that are met or verified.",
          },
          {
            key: "all" as FilterKey,
            labelNb: "Alle",
            labelEn: "All",
            count: counts.total,
            icon: null,
            hintNb: "Vis alle krav i regelverket.",
            hintEn: "Show all requirements in the framework.",
          },
        ]).map((chip) => {
          const ChipIcon = chip.icon;
          const active = filter === chip.key;
          return (
            <Tooltip key={chip.key}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => setFilter(chip.key)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-3 h-8 text-xs transition-colors",
                    active
                      ? "border-foreground/80 bg-foreground text-background font-medium"
                      : "border-border bg-background text-foreground hover:bg-muted",
                  )}
                >
                  {ChipIcon && <ChipIcon className="h-3.5 w-3.5" />}
                  <span>{isNb ? chip.labelNb : chip.labelEn}</span>
                  <span className={cn("tabular-nums", active ? "opacity-90" : "text-muted-foreground")}>{chip.count}</span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className={cn("max-w-[16rem]", chip.key === "agent" && "max-w-[22rem] p-0 overflow-hidden")}>
                {chip.key === "agent" ? (
                  <div className="text-left">
                    <div className="flex items-center gap-2 border-b border-border/50 px-3 py-2">
                      <Bot className="h-4 w-4 text-primary shrink-0" />
                      <span className="text-xs font-medium">
                        {isNb ? "Slik jobber Lara med disse kravene" : "How Lara works on these requirements"}
                      </span>
                    </div>
                    <div className="px-3 py-2 space-y-2">
                      <div>
                        <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">
                          {isNb ? "Kilder" : "Sources"}
                        </p>
                        <ul className="space-y-1 text-xs leading-snug">
                          <li className="flex gap-1.5">
                            <FileIcon className="h-3 w-3 mt-0.5 shrink-0 text-muted-foreground" />
                            <span>{isNb ? "Dokumenter lastet opp i organisasjonens profil i Mynder" : "Documents uploaded to your organisation profile in Mynder"}</span>
                          </li>
                          <li className="flex gap-1.5">
                            <ShieldCheck className="h-3 w-3 mt-0.5 shrink-0 text-muted-foreground" />
                            <span>{isNb ? "Data fra alle produkter dere har aktivert — også på tvers av regelverk" : "Data from every product you have activated — across all frameworks"}</span>
                          </li>
                          <li className="flex gap-1.5">
                            <Sparkles className="h-3 w-3 mt-0.5 shrink-0 text-muted-foreground" />
                            <span>{isNb ? "Bevis og svar dere allerede har registrert på andre krav" : "Evidence and answers already registered on other requirements"}</span>
                          </li>
                        </ul>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">
                          {isNb ? "Slik analyseres det" : "How it is analysed"}
                        </p>
                        <ol className="space-y-0.5 text-xs leading-snug list-decimal pl-4">
                          <li>{isNb ? "Leser og tolker innholdet i dokumentene" : "Reads and interprets the document content"}</li>
                          <li>{isNb ? "Mapper innholdet mot krav og artikler i aktiverte regelverk" : "Maps content to requirements and articles in activated frameworks"}</li>
                          <li>{isNb ? "Foreslår status og bevis — du godkjenner" : "Suggests status and evidence — you approve"}</li>
                        </ol>
                      </div>
                      <p className="text-[11px] text-muted-foreground border-t border-border/50 pt-2">
                        {isNb
                          ? "Gjenbruk gjør at ett dokument kan dekke krav i flere regelverk samtidig."
                          : "Reuse means one document can cover requirements in several frameworks at once."}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p>{isNb ? chip.hintNb : chip.hintEn}</p>
                )}
              </TooltipContent>
            </Tooltip>

          );
        })}

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={() => setDocsOnly((v) => !v)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 h-8 text-xs transition-colors",
                docsOnly
                  ? "border-foreground/80 bg-foreground text-background font-medium"
                  : "border-border bg-background text-foreground hover:bg-muted",
              )}
            >
              <FileIcon className="h-3.5 w-3.5" />
              <span>{isNb ? "Bevis" : "Evidence"}</span>
              <span className={cn("tabular-nums", docsOnly ? "opacity-90" : "text-muted-foreground")}>
                {docGroups.reduce((sum, g) => sum + g.docs.length, 0)}
              </span>
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-[16rem]">
            <p>
              {isNb
                ? "Vis dokumentasjon per kontrollområde i stedet for kravlisten."
                : "Show documentation per control area instead of the requirement list."}
            </p>
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Rad 3: søk + filtrering */}
      <div className="flex items-center gap-2 mb-3">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={isNb ? "Søk i krav…" : "Search requirements…"}
            className="pl-9 pr-9 h-9 text-xs"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-muted text-muted-foreground"
              aria-label={isNb ? "Tøm søk" : "Clear search"}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 gap-1.5 text-xs shrink-0 relative">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              {isNb ? "Filtrer" : "Filter"}
              {grouping !== "status" && (
                <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-primary" />
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-72 p-3 space-y-3">
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">{isNb ? "Gruppér etter" : "Group by"}</p>
              <Tabs value={grouping} onValueChange={(v) => setGrouping(v as "status" | "control_area")}>
                <TabsList className="h-8 p-1 bg-muted w-full grid grid-cols-2">
                  <TabsTrigger value="status" className="text-xs h-6">
                    {isNb ? "Status" : "Status"}
                  </TabsTrigger>
                  <TabsTrigger value="control_area" className="text-xs h-6">
                    {isNb ? "Kontrollområde" : "Control area"}
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            <Separator />
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              {isNb
                ? `${counts.auto} krav vurderes automatisk av Lara, ${counts.manual} dokumenteres manuelt av deg eller teamet.`
                : `${counts.auto} requirements are assessed automatically by Lara, ${counts.manual} are documented manually by you or your team.`}
            </p>
          </PopoverContent>
        </Popover>
      </div>




      {filtered.length === 0 && (
        <div className="text-center py-8 text-sm text-muted-foreground">
          {isNb ? "Ingen krav matcher søket." : "No requirements match your search."}
        </div>
      )}

      {docsOnly ? (
        <div className="space-y-6">
          {CONTROL_AREAS.map((area) => {
            const GroupIcon = area.icon;
            const docs = docGroups.find((g) => g.key === area.key)?.docs ?? [];
            const expected = expectedByArea.get(area.key) ?? [];
            if (docs.length === 0 && expected.length === 0) return null;
            const openRequirement = (id: string) => {
              setDocsOnly(false);
              setExpandedId(id);
              setTimeout(() => {
                reqRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "center" });
              }, 60);
            };
            return (
              <section key={area.key} className="space-y-2">
                <div className="flex items-center gap-2 px-1">
                  <GroupIcon className={cn("h-4 w-4 shrink-0", area.accentClass)} />
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {isNb ? area.labelNb : area.labelEn}
                  </span>
                  <span className="text-xs tabular-nums text-muted-foreground/70">({docs.length})</span>
                  <span className="flex-1 h-px bg-border ml-2" />
                </div>
                <div className="rounded-lg border bg-card divide-y">
                  {docs.map((entry, i) => (
                    <button
                      key={`${entry.req.requirement_id}-${entry.doc.name}-${i}`}
                      type="button"
                      onClick={() => openRequirement(entry.req.requirement_id)}
                      className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-muted/40 transition-colors"
                    >
                      <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-foreground truncate">{entry.doc.name}</p>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {entry.req.requirement_id} · {isNb ? entry.req.name_no : entry.req.name}
                        </p>
                      </div>
                      <Badge variant="outline" className="h-5 px-1.5 text-[10px] uppercase shrink-0">
                        {entry.doc.kind}
                      </Badge>
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    </button>
                  ))}

                  {/* Forventet dokumentasjon som ennå ikke er lastet opp */}
                  {expected
                    .filter((row) => row.status !== "received")
                    .map((row) => {
                      const isAgent = row.status === "agent_confirmed";
                      return (
                        <button
                          key={`exp-${row.requirementId}`}
                          type="button"
                          onClick={() => openRequirement(row.requirementId)}
                          className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-muted/40 transition-colors"
                        >
                          {isAgent ? (
                            <BotMessageSquare className="h-4 w-4 text-primary shrink-0" />
                          ) : (
                            <CircleDashed className="h-4 w-4 text-muted-foreground/60 shrink-0" />
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-sm text-muted-foreground truncate">{row.docLabel}</p>
                            <p className="text-[11px] text-muted-foreground/80 truncate">
                              {row.requirementId} · {row.requirementName}
                            </p>
                          </div>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge
                                variant="outline"
                                className={cn(
                                  "h-5 px-1.5 text-[10px] shrink-0",
                                  isAgent ? "border-primary/40 text-primary" : "text-muted-foreground",
                                )}
                              >
                                {expectedStatusLabel(row.status, isNb)}
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent side="left" className="max-w-xs text-xs">
                              {isAgent
                                ? isNb
                                  ? "Kundens agent har bekreftet at dokumentet finnes. Regnes som egenrapportert bevis — last opp filen for å bli verifisert."
                                  : "The customer's agent confirmed the document exists. Counts as self-reported evidence — upload the file to become verified."
                                : isNb
                                  ? "Ingen bevis registrert. Klikk for å åpne kravet og laste opp dokumentasjon."
                                  : "No evidence registered. Click to open the requirement and upload documentation."}
                            </TooltipContent>
                          </Tooltip>
                          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        </button>
                      );
                    })}
                </div>
              </section>
            );
          })}
        </div>
      ) : (
      <div className="space-y-6">

        {groups.map((group) => {
          const isCollapsed = collapsedGroups.has(group.key);
          const GroupIcon = group.Icon;
          return (
        <section key={group.key} className="space-y-3">
          <button
            type="button"
            onClick={() => toggleSet(setCollapsedGroups, group.key)}
            className="w-full flex items-center gap-2 px-1 py-1 text-left group/section"
            aria-expanded={!isCollapsed}
          >
            <GroupIcon className={cn("h-4 w-4 shrink-0", group.accentClass)} />
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground group-hover/section:text-foreground transition-colors">
              {group.label}
            </span>
            <span className="text-xs tabular-nums text-muted-foreground/70">
              ({group.met}/{group.items.length})
            </span>
            <span className="flex-1 h-px bg-border ml-2" />
            {isCollapsed ? (
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            ) : (
              <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </button>

          {!isCollapsed && (
          <div className="space-y-3">
        {group.items.map((req) => {

          const state = uiStates[req.requirement_id] ?? { progress: "not_started", evidence: "required" };
          const isExpanded = expandedId === req.requirement_id;
          const progressCfg = getProgressConfig(state.progress);
          const ProgressIcon = progressCfg.icon;
          const isMuted = state.progress === "not_applicable" || state.evidence === "out_of_scope";
          const isVerifiedDue = normalizeProgress(state.progress) === "fulfilled" && state.evidence === "revalidation_due";
          const fulfillment = inferFulfillment(req);


          return (
            <div
              key={req.requirement_id}
              ref={(el) => { reqRefs.current[req.requirement_id] = el; }}
              className={cn(
                "rounded-lg border bg-card transition-all",
                highlightRequirementId === req.requirement_id && "ring-2 ring-primary/50",
                isMuted && "opacity-60",
              )}
            >
              <div
                onClick={() => { setExpandedId(isExpanded ? null : req.requirement_id); setCursorTip(null); }}
                onMouseMove={(e) => setCursorTip({ x: e.clientX, y: e.clientY })}
                onMouseLeave={() => setCursorTip(null)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setExpandedId(isExpanded ? null : req.requirement_id);
                    setCursorTip(null);
                  }
                }}
                role="button"
                tabIndex={0}
                aria-expanded={isExpanded}
                className="w-full p-4 flex items-start gap-3 text-left hover:bg-muted/30 transition-colors"
              >
                <div className="mt-1 shrink-0">
                  <ProgressIcon className={cn("h-5 w-5", progressCfg.iconClass)} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className={cn(
                      "text-base font-semibold text-foreground leading-snug",
                      isMuted && "line-through decoration-1",
                    )}>
                      {req.name_no}
                    </h4>
                    <TooltipProvider delayDuration={200}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span
                            onClick={(e) => e.stopPropagation()}
                            onMouseEnter={(e) => { e.stopPropagation(); setCursorTip(null); }}
                            className="inline-flex items-center ml-1 text-muted-foreground/60 hover:text-muted-foreground transition-colors cursor-help"
                            aria-label={isNb ? fulfillment.labelNo : fulfillment.labelEn}
                          >
                            {fulfillment.evidenceMandatory ? (
                              <Paperclip className="h-3.5 w-3.5" />
                            ) : (
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            )}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-[260px] text-xs">
                          <div className="font-medium mb-0.5">
                            {isNb ? fulfillment.labelNo : fulfillment.labelEn}
                          </div>
                          <div>{isNb ? fulfillment.descriptionNo : fulfillment.descriptionEn}</div>
                          {!fulfillment.evidenceMandatory && (
                            <div className="mt-1 text-muted-foreground">
                              {isNb ? "Primær vei: " : "Primary path: "}
                              <span className="font-medium text-foreground">
                                {isNb ? fulfillment.primaryActionNo : fulfillment.primaryActionEn}
                              </span>
                            </div>
                          )}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <p className={cn("text-sm text-muted-foreground mt-1", !isExpanded && "line-clamp-2")}>
                    {isExpanded ? getExtendedDescription(req, isNb ? "no" : "en") : (isNb ? req.description_no : req.description)}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 mt-1">
                  {/* Subtil dokumentasjonsindikator — kun for besvarte krav */}
                  {(() => {
                    const docCount = state.documents?.length ?? 0;
                    const isAnswered = normalizeProgress(state.progress) === "fulfilled";
                    if (docCount === 0 && !isAnswered) return null;
                    const missing = docCount === 0 && isAnswered;
                    return (
                      <TooltipProvider delayDuration={200}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span
                              className={cn(
                                "inline-flex items-center gap-0.5 text-[11px] tabular-nums cursor-help",
                                missing ? "text-warning/70" : "text-muted-foreground",
                              )}
                              onMouseEnter={(e) => { e.stopPropagation(); setCursorTip(null); }}
                            >
                              <Paperclip className="h-3.5 w-3.5" />
                              {docCount > 0 && docCount}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="text-xs max-w-[220px]">
                            {missing
                              ? (isNb ? "Dokumentasjon mangler for denne statusen" : "Documentation missing for this status")
                              : (isNb ? `${docCount} dokument${docCount === 1 ? "" : "er"} lastet opp` : `${docCount} document${docCount === 1 ? "" : "s"} uploaded`)}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    );
                  })()}

                  {(() => {
                    const cap = req.agent_capability;
                    const isAuto = cap === "full";
                    return (
                      <Badge
                        variant="outline"
                        className={cn(
                          "h-6 px-2 text-[10px] font-semibold tracking-wide uppercase",
                          isAuto
                            ? "text-status-closed border-status-closed/30 bg-status-closed/5"
                            : "text-muted-foreground border-border",
                        )}
                      >
                        {isAuto ? "AUTO" : (isNb ? "MANUELL" : "MANUAL")}
                      </Badge>
                    );
                  })()}

                  {renderStatusControl(req.requirement_id, state)}


                  {isVerifiedDue && state.revalidationDaysLeft != null && (
                    <TooltipProvider delayDuration={200}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span
                            className="inline-flex h-7 items-center gap-0.5 rounded-full border border-warning/40 px-2 text-xs text-warning cursor-help"
                            onMouseEnter={(e) => { e.stopPropagation(); setCursorTip(null); }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Clock className="h-3 w-3" />
                            {state.revalidationDaysLeft}d
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-xs">
                          {isNb
                            ? `Re-attesteres om ${state.revalidationDaysLeft} dager`
                            : `Re-attestation in ${state.revalidationDaysLeft} days`}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}

                  {/* Kapasitets-badge fjernet — skapte usikkerhet */}


                  {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </div>
              </div>


              {isExpanded && (
                <div className="px-4 pb-4">
                    <Separator className="mb-4" />
                    <div className="space-y-3">




                    {/* Veiledning til dokumentasjon — skjult som standard */}
                    {(() => {
                      const docs = getRecommendedDocs(req, isNb);
                      if (docs.length === 0) return null;
                      const isOpen = showAllDocsIds.has(req.requirement_id);
                      return (
                        <div className="rounded-md border border-border/60 bg-card">
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); toggleSet(setShowAllDocsIds, req.requirement_id); }}
                            className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-foreground hover:bg-muted/30 transition-colors rounded-md"
                          >
                            <span className="inline-flex items-center gap-1.5">
                              <FileIcon className="h-3.5 w-3.5 text-primary" />
                              {isNb ? `Veiledning til dokumentasjon (${docs.length})` : `Documentation guidance (${docs.length})`}
                            </span>
                            {isOpen ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
                          </button>
                          {isOpen && (
                            <ul className="space-y-1 px-3 pb-3 pt-0.5">
                              {docs.map((d, i) => (
                                <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground leading-relaxed">
                                  <span className="mt-1.5 h-1 w-1 rounded-full bg-muted-foreground/60 shrink-0" />
                                  <span>{d}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      );
                    })()}


                    {/* Auto-vurdering: informasjon + overstyringsknapp */}
                    {req.agent_capability === "full" && !readMoreIds.has(`__override_${req.requirement_id}`) && (
                      <>
                        <div className="rounded-md border border-border/60 bg-muted/20 px-3 py-2.5">
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {isNb
                              ? "Mynder har ikke nok data til å automatisk vurdere dette kravet ennå. Registrer relevant data i portalen for å forbedre scoren."
                              : "Mynder does not yet have enough data to automatically assess this requirement. Register relevant data in the portal to improve the score."}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); toggleSet(setReadMoreIds, `__override_${req.requirement_id}`); }}
                          className="w-full rounded-md bg-primary/10 hover:bg-primary/15 text-primary text-sm font-medium py-2.5 inline-flex items-center justify-center gap-2 transition-colors"
                        >
                          <UserCheck className="h-4 w-4" />
                          {isNb ? "Overstyr med egendefinert vurdering" : "Override with custom assessment"}
                        </button>
                      </>
                    )}

                    {/* Manuell dokumentering — alltid for MANUELL, ved klikk for AUTO */}
                    {(req.agent_capability !== "full" || readMoreIds.has(`__override_${req.requirement_id}`)) && (
                    <div className="rounded-md border border-border/60 bg-card p-3 space-y-3">

                      <div className="flex items-start gap-2">
                        <div className="h-6 w-6 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                          <Users className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-foreground leading-tight">
                            {isNb ? "Manuell dokumentering" : "Manual documentation"}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {isNb ? "Bekreft status og legg til dokumentasjon." : "Confirm status and attach documentation."}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-foreground">
                          {isNb ? "Status" : "Status"} <span className="text-destructive">*</span>
                        </label>
                        <select
                          value={normalizeProgress(state.progress)}
                          onChange={(e) => handleStatusChange(req.requirement_id, e.target.value as ProgressStatus)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        >
                          {(SELECTABLE_PROGRESS as ProgressStatus[]).map((s) => {
                            const cfg = getProgressConfig(s);
                            return (
                              <option key={s} value={s}>
                                {isNb ? cfg.labelNb : cfg.labelEn}
                              </option>
                            );
                          })}
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5">
                          <label className="text-xs font-medium text-foreground">
                            {isNb ? "Kommentar" : "Comment"}
                          </label>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button type="button" onClick={(e) => e.stopPropagation()} className="text-muted-foreground hover:text-foreground">
                                <HelpCircle className="h-3.5 w-3.5" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-[240px] text-xs">
                              {isNb
                                ? "Forklar kort hvordan kravet er oppfylt hos dere — f.eks. rutine, ansvarlig eller referanse. Dette gjør vurderingen sporbar ved revisjon."
                                : "Briefly explain how the requirement is met — e.g. routine, owner or reference. This makes the assessment auditable."}
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <Textarea
                          value={reqNotes[req.requirement_id] ?? ""}
                          onChange={(e) => setReqNotes((prev) => ({ ...prev, [req.requirement_id]: e.target.value }))}
                          onClick={(e) => e.stopPropagation()}
                          placeholder={isNb ? "Beskriv kort hvordan kravet oppfylles…" : "Briefly describe how the requirement is met…"}
                          className="min-h-[70px] text-sm resize-none"
                        />
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Button
                            type="button"
                            variant={fulfillment.evidenceMandatory ? "default" : "outline"}
                            size="sm"
                            className="h-8 gap-1.5 text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              setAttachDialog({
                                id: req.requirement_id,
                                name: isNb ? (req.name_no || req.name) : req.name,
                                description: `${isNb ? req.description_no : req.description}\n\n${getEvaluationCriteriaText(req)}`,
                                articles: getArticlesForRequirement(req),
                              });
                            }}
                          >
                            <Paperclip className="h-3.5 w-3.5" />
                            {fulfillment.evidenceMandatory
                              ? (isNb ? "Last opp dokumentasjon (påkrevd)" : "Upload documentation (required)")
                              : (isNb ? "Tilknytt dokument (valgfritt)" : "Attach document (optional)")}
                          </Button>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button type="button" onClick={(e) => e.stopPropagation()} className="text-muted-foreground hover:text-foreground">
                                <HelpCircle className="h-3.5 w-3.5" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-[260px] text-xs">
                              {fulfillment.evidenceMandatory
                                ? (isNb
                                    ? "Dette kravet må dokumenteres med opplastet bevis (policy, avtale, sertifikat, rapport)."
                                    : "This requirement must be documented with uploaded evidence (policy, agreement, certificate, report).")
                                : (isNb ? fulfillment.descriptionNo : fulfillment.descriptionEn)}
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </div>

                    </div>
                    )}



                  </div>
                </div>
              )}
            </div>
          );
        })}
          </div>
          )}
        </section>
          );
        })}
      </div>
      )}



      {filtered.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p>Ingen krav i denne kategorien.</p>
        </div>
      )}

      {docDialog && (
        <ManualDocumentationDialog
          open={!!docDialog}
          onOpenChange={(open) => { if (!open) setDocDialog(null); }}
          requirementId={docDialog.id}
          requirementName={docDialog.name}
          onSave={(status, comment, doc) => handleDocSave(docDialog.id, status, comment, doc)}
        />
      )}

      {attachDialog && (
        <AttachEvidenceDialog
          open={!!attachDialog}
          onOpenChange={(o) => { if (!o) setAttachDialog(null); }}
          requirementId={attachDialog.id}
          requirementName={attachDialog.name}
          requirementDescription={attachDialog.description}
          coveredArticles={attachDialog.articles}
          onConfirm={(result) => {
            const req = requirements.find((r) => r.requirement_id === attachDialog.id);
            if (req) {
              applyEvidenceAttachment(attachDialog.id, req, result);
              void saveEvidence([attachDialog.id], result);
            }
          }}
        />
      )}

      {frameworkAttachOpen && (
        <AttachEvidenceDialog
          open={frameworkAttachOpen}
          onOpenChange={setFrameworkAttachOpen}
          requirementId={frameworkId}
          requirementName={isNb ? "Bevis for hele regelverket" : "Evidence for the whole framework"}
          coveredArticles={allFrameworkArticles}
          frameworkRequirements={frameworkCandidates}
          onConfirm={() => {}}
          onConfirmMulti={applyFrameworkEvidence}
        />
      )}

      <SaraOnboardingDialog open={saraOpen} onOpenChange={setSaraOpen} />




      {cursorTip && (
        <div
          className="pointer-events-none fixed z-50 rounded-md bg-popover text-popover-foreground border shadow-md px-2.5 py-1.5 text-xs max-w-xs"
          style={{ left: cursorTip.x + 14, top: cursorTip.y + 16 }}
        >
          Klikk på kravet for å lese mer og utføre oppgaven
        </div>
      )}
    </div>
  );
};
