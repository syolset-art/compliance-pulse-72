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
import { ChevronDown, ChevronUp, Users, Bot, CheckCircle2, UserCheck, Paperclip, FileText as FileIcon, Download, ShieldCheck, Sparkles, Clock, Search, X, ArrowRight, HelpCircle } from "lucide-react";
import { Input } from "@/components/ui/input";

import { getRequirementsByFramework } from "@/lib/complianceRequirementsData";
import { ALL_ADDITIONAL_REQUIREMENTS } from "@/lib/additionalFrameworkRequirements";
import type { ComplianceRequirement, AgentCapability } from "@/lib/complianceRequirementsData";
import { ManualDocumentationDialog } from "@/components/dialogs/ManualDocumentationDialog";
import { LaraDataSourceExplainer } from "@/components/regulations/LaraDataSourceExplainer";
import { AttachEvidenceDialog, type AttachEvidenceResult } from "@/components/regulations/AttachEvidenceDialog";
import { MessageSquare, Save, Pencil } from "lucide-react";
import {
  demoUiStateFor,
  getProgressConfig,
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


type FilterKey = "all" | "not_met" | "partial" | "met";

/** Map ny fremdrift → legacy filter-bøtte for tabs. */
function bucketOf(progress: ProgressStatus): "met" | "partial" | "not_met" | "na" {
  if (progress === "verified") return "met";
  if (progress === "implemented" || progress === "in_progress") return "partial";
  if (progress === "not_applicable") return "na";
  return "not_met";
}

function generateUiStates(requirements: ComplianceRequirement[]): Record<string, RequirementUiState> {
  const states: Record<string, RequirementUiState> = {};
  requirements.forEach((req) => {
    states[req.requirement_id] = demoUiStateFor(req.requirement_id);
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

export const FrameworkRequirementsList = ({ frameworkId, onCountsChange, highlightRequirementId }: FrameworkRequirementsListProps) => {
  const { i18n } = useTranslation();
  const isNb = i18n.language !== "en";
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [grouping, setGrouping] = useState<"status" | "control_area">("status");
  const [search, setSearch] = useState("");
  const [docDialog, setDocDialog] = useState<{ id: string; name: string } | null>(null);
  const [reqNotes, setReqNotes] = useState<Record<string, string>>({});
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [draftNote, setDraftNote] = useState<string>("");
  const [cursorTip, setCursorTip] = useState<{ x: number; y: number } | null>(null);
  const [attachDialog, setAttachDialog] = useState<{ id: string; name: string; description?: string; articles?: string[] } | null>(null);
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

  const [uiStates, setUiStates] = useState<Record<string, RequirementUiState>>(() =>
    generateUiStates(requirements)
  );

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
    return { met, partial, notMet, auto, manual, total: requirements.length };
  }, [uiStates, requirements]);

  useEffect(() => {
    onCountsChange?.(counts);
  }, [counts, onCountsChange]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = requirements;
    if (filter !== "all") {
      list = list.filter((r) => bucketOf(uiStates[r.requirement_id]?.progress ?? "not_answered") === filter);
    }
    if (q) {
      list = list.filter((r) =>
        r.name_no.toLowerCase().includes(q) ||
        r.description_no.toLowerCase().includes(q) ||
        r.requirement_id.toLowerCase().includes(q),
      );
    }
    return list;
  }, [filter, requirements, uiStates, search]);

  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  /** Seksjoner: enten de 5 kontrollområdene, eller statusbøttene. */
  const groups = useMemo(() => {
    const metCount = (items: ComplianceRequirement[]) =>
      items.filter((r) => bucketOf(uiStates[r.requirement_id]?.progress ?? "not_answered") === "met").length;

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
          (r) => bucketOf(uiStates[r.requirement_id]?.progress ?? "not_answered") === s.key,
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



  const handleDocSave = (requirementId: string, status: string, _comment: string, doc?: EvidenceDocument) => {
    setUiStates((prev) => {
      const existingDocs = prev[requirementId]?.documents ?? [];
      const documents = doc ? [doc, ...existingDocs] : existingDocs;
      const next: RequirementUiState =
        status === "implemented"
          ? {
              progress: "implemented",
              evidence: "self_reported",
              documents,
              evidenceCount: { collected: documents.length, required: Math.max(1, documents.length) },
            }
          : status === "verified"
            ? { progress: "verified", evidence: "verified", documents, evidenceCount: { collected: 1, required: 1 } }
            : status === "in_progress"
              ? { progress: "in_progress", evidence: "self_reported", documents }
              : status === "not_applicable"
                ? { progress: "not_applicable", evidence: "out_of_scope", documents }
                : { progress: "not_answered", evidence: "required", documents };
      return { ...prev, [requirementId]: next };
    });
  };

  const handleStatusChange = (requirementId: string, next: ProgressStatus) => {
    setUiStates((prev) => {
      const cur = prev[requirementId] ?? { progress: "not_answered", evidence: "required" };
      const documents = cur.documents ?? [];
      let updated: RequirementUiState;
      if (next === "verified") {
        updated = {
          ...cur,
          progress: "verified",
          evidence: "verified",
          documents,
          evidenceCount: { collected: Math.max(1, documents.length), required: Math.max(1, documents.length) },
        };
      } else if (next === "implemented") {
        const { verification, ...rest } = cur;
        updated = {
          ...rest,
          progress: "implemented",
          evidence: "self_reported",
          documents,
        };
      } else if (next === "in_progress") {
        const { verification, ...rest } = cur;
        updated = { ...rest, progress: "in_progress", evidence: "self_reported", documents };
      } else if (next === "not_applicable") {
        const { verification, ...rest } = cur;
        updated = { ...rest, progress: "not_applicable", evidence: "out_of_scope", documents };
      } else {
        const { verification, ...rest } = cur;
        updated = { ...rest, progress: "not_answered", evidence: "required", documents };
      }
      return { ...prev, [requirementId]: updated };
    });
  };

  const applyEvidenceAttachment = (
    requirementId: string,
    req: ComplianceRequirement,
    result: AttachEvidenceResult,
  ) => {
    setUiStates((prev) => {
      const cur = prev[requirementId] ?? { progress: "not_answered" as ProgressStatus, evidence: "required" as const };
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
      let progress: ProgressStatus = "implemented";
      let evidence: RequirementUiState["evidence"] = "self_reported";
      if (fullCoverage && hasSignedDoc) {
        progress = "verified";
        evidence = "verified";
      } else if (fullCoverage) {
        progress = "implemented";
        evidence = "attested";
      } else if (coverage.ratio > 0) {
        progress = "implemented";
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
          {(["not_answered", "in_progress", "implemented", "verified", "not_applicable"] as ProgressStatus[]).map((s) => {
            const cfg = getProgressConfig(s);
            const StatusIcon = cfg.icon;
            const active = state.progress === s;
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
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-foreground">Krav og evaluatorer</h3>
        <div className="flex items-center gap-3 text-xs">
          <span className="text-muted-foreground">{counts.total} krav totalt</span>
          <Badge variant="outline" className="gap-1 text-status-closed border-status-closed/20 dark:border-status-closed">
            <Bot className="h-3 w-3" />
            {counts.auto} AUTOMATISK
          </Badge>
          <Badge variant="outline" className="gap-1 text-muted-foreground">
            <Users className="h-3 w-3" />
            {counts.manual} MANUELL
          </Badge>
        </div>
      </div>

      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={isNb ? "Søk i krav eller beskrivelse…" : "Search requirements or description…"}
          className="pl-9 pr-9 h-9"
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

      <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterKey)} className="mb-2">
        <TabsList className="w-full grid grid-cols-4">
          <TabsTrigger value="all">Alle</TabsTrigger>
          <TabsTrigger value="not_met">Ikke oppfylt ({counts.notMet})</TabsTrigger>
          <TabsTrigger value="partial">Delvis ({counts.partial})</TabsTrigger>
          <TabsTrigger value="met">Oppfylt ({counts.met})</TabsTrigger>
        </TabsList>
      </Tabs>

      <Tabs value={grouping} onValueChange={(v) => setGrouping(v as "status" | "control_area")} className="mb-4">
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="status">{isNb ? "Grupper etter status" : "Group by status"}</TabsTrigger>
          <TabsTrigger value="control_area">{isNb ? "Grupper etter kontrollområde" : "Group by control area"}</TabsTrigger>
        </TabsList>
      </Tabs>


      {filtered.length === 0 && (
        <div className="text-center py-8 text-sm text-muted-foreground">
          {isNb ? "Ingen krav matcher søket." : "No requirements match your search."}
        </div>
      )}


      <div className="space-y-3">
        {filtered.map((req) => {
          const state = uiStates[req.requirement_id] ?? { progress: "not_answered", evidence: "required" };
          const isExpanded = expandedId === req.requirement_id;
          const progressCfg = getProgressConfig(state.progress);
          const ProgressIcon = progressCfg.icon;
          const isMuted = state.progress === "not_applicable" || state.evidence === "out_of_scope";
          const isVerifiedDue = state.progress === "verified" && state.evidence === "revalidation_due";
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
                    const isAnswered =
                      state.progress === "in_progress" ||
                      state.progress === "implemented" ||
                      state.progress === "verified";
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
                          value={state.progress}
                          onChange={(e) => {
                            const next = e.target.value as ProgressStatus;
                            if (next === "verified" && state.progress !== "verified") {
                              setAttachDialog({
                                id: req.requirement_id,
                                name: isNb ? (req.name_no || req.name) : req.name,
                                description: `${isNb ? req.description_no : req.description}\n\n${getEvaluationCriteriaText(req)}`,
                                articles: getArticlesForRequirement(req),
                              });
                              return;
                            }
                            handleStatusChange(req.requirement_id, next);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        >
                          {(["not_answered", "in_progress", "implemented", "verified", "not_applicable"] as ProgressStatus[]).map((s) => {
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
            if (req) applyEvidenceAttachment(attachDialog.id, req, result);
          }}
        />
      )}

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
