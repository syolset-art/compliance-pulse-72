import { useState, useMemo, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ChevronDown, ChevronUp, Users, Bot, CheckCircle2, UserCheck, Paperclip, FileText as FileIcon, Download, ShieldCheck, Sparkles, Clock, Search, X, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";

import { getRequirementsByFramework } from "@/lib/complianceRequirementsData";
import { ALL_ADDITIONAL_REQUIREMENTS } from "@/lib/additionalFrameworkRequirements";
import type { ComplianceRequirement, AgentCapability } from "@/lib/complianceRequirementsData";
import { ManualDocumentationDialog } from "@/components/dialogs/ManualDocumentationDialog";
import { LaraDataSourceExplainer } from "@/components/regulations/LaraDataSourceExplainer";
import { MessageSquare, Save, Pencil } from "lucide-react";
import {
  demoUiStateFor,
  formatEvidenceLabel,
  getEvidenceConfig,
  getProgressConfig,
  type RequirementUiState,
  type ProgressStatus,
  type EvidenceDocument,
} from "@/lib/requirementStatusModel";
import { cn } from "@/lib/utils";

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
  const [search, setSearch] = useState("");
  const [docDialog, setDocDialog] = useState<{ id: string; name: string } | null>(null);
  const [reqNotes, setReqNotes] = useState<Record<string, string>>({});
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [draftNote, setDraftNote] = useState<string>("");
  const [cursorTip, setCursorTip] = useState<{ x: number; y: number } | null>(null);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [verifyName, setVerifyName] = useState<string>("");
  const [verifyDate, setVerifyDate] = useState<string>("");
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

  useMemo(() => {
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

  const confirmVerification = (requirementId: string) => {
    const name = verifyName.trim();
    const date = verifyDate.trim() || new Date().toLocaleDateString(isNb ? "nb-NO" : "en-GB", { year: "numeric", month: "long", day: "numeric" });
    if (!name) return;
    setUiStates((prev) => {
      const cur = prev[requirementId] ?? { progress: "not_answered", evidence: "required" };
      const documents = cur.documents ?? [];
      const updated: RequirementUiState = {
        ...cur,
        progress: "verified",
        evidence: "verified",
        documents,
        evidenceCount: { collected: Math.max(1, documents.length), required: Math.max(1, documents.length) },
        verification: {
          externalVerifier: { name, date },
          internalConfirmer: { name: "Vilde Gjellestad", role: isNb ? "Leverandøransvarlig" : "Vendor Manager", date },
        },
      };
      return { ...prev, [requirementId]: updated };
    });
    setVerifyingId(null);
    setVerifyName("");
    setVerifyDate("");
    toast.success(isNb ? "Markert som verifisert" : "Marked as verified");
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

      <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterKey)} className="mb-4">
        <TabsList className="w-full grid grid-cols-4">
          <TabsTrigger value="all">Alle</TabsTrigger>
          <TabsTrigger value="not_met">Ikke oppfylt ({counts.notMet})</TabsTrigger>
          <TabsTrigger value="partial">Delvis ({counts.partial})</TabsTrigger>
          <TabsTrigger value="met">Oppfylt ({counts.met})</TabsTrigger>
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
          const cap = capabilityLabel[req.agent_capability];
          const CapIcon = cap.icon;
          const progressCfg = getProgressConfig(state.progress);
          const evidenceCfg = getEvidenceConfig(state.evidence);
          const ProgressIcon = progressCfg.icon;
          const EvidenceIcon = evidenceCfg.icon;
          const isMuted = state.progress === "not_applicable" || state.evidence === "out_of_scope";
          const isVerified = state.progress === "verified" && state.evidence === "verified";
          const isVerifiedDue = state.progress === "verified" && state.evidence === "revalidation_due";
          const progressLabel = isNb ? progressCfg.labelNb : progressCfg.labelEn;
          const evidenceLabel = formatEvidenceLabel(state, isNb);
          // Slå sammen når labels er like, eller når det er Verifisert m/ re-attestering nær
          const sameLabel = progressLabel === evidenceLabel || isVerifiedDue;
          // Ved dedup: bruk evidence-cfg som primær (bevis-tilstanden er mer informativ), men for
          // "verifisert m/ re-attestering nær" vil vi vise Verifisert-pill med warning-teller
          const primaryCfg = isVerifiedDue ? progressCfg : evidenceCfg;
          const PrimaryIcon = primaryCfg.icon;
          const primaryLabel = isVerifiedDue ? progressLabel : evidenceLabel;


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
                  <h4 className={cn(
                    "text-base font-semibold text-foreground leading-snug",
                    isMuted && "line-through decoration-1",
                  )}>
                    {req.name_no}
                  </h4>
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{req.description_no}</p>
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

                    {/* Dokumentasjon øverst — alltid synlig, subtil og tett */}
                    <div className="border-y border-border/40 py-1.5 text-[11px]">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="inline-flex items-center gap-1 font-medium text-muted-foreground shrink-0">
                          <Paperclip className="h-3 w-3" />
                          {isNb ? "Dokumentasjon" : "Documentation"}
                        </span>
                        <span className="truncate text-muted-foreground">
                          {(state.documents?.length ?? 0) > 0
                            ? `${state.documents?.length ?? 0} ${isNb ? "dokument" : "document"}${(state.documents?.length ?? 0) === 1 ? "" : isNb ? "er" : "s"}`
                            : isNb ? "Ingen dokumenter lagt til" : "No documents added"}
                        </span>
                        <button
                          type="button"
                          onClick={() => setDocDialog({ id: req.requirement_id, name: req.name_no })}
                          className="ml-auto shrink-0 text-primary hover:underline"
                        >
                          {isNb ? "Legg til" : "Add"}
                        </button>
                      </div>
                      {state.documents && state.documents.length > 0 && (
                        <ul className="mt-1 divide-y divide-border/20">
                          {state.documents.slice(0, 3).map((d) => {
                          const vStatus = d.verificationStatus ?? "self_reported";
                          const isVerifiedDoc = vStatus === "verified";
                          return (
                            <li
                              key={d.name}
                              className="group flex items-center gap-1.5 py-0.5 min-w-0 text-muted-foreground"
                            >
                              <FileIcon className="h-3 w-3 text-muted-foreground shrink-0" />
                              <span className="truncate text-foreground min-w-[120px] max-w-[240px]">{d.name}</span>
                              <span className="text-[10px] uppercase shrink-0">{d.classification?.docType ?? d.kind}</span>
                              {d.classification && d.classification.articles.length > 0 && (
                                <span className="truncate hidden sm:inline">
                                  · {isNb ? "dekker" : "covers"} {d.classification.articles.slice(0, 2).join(", ")}
                                  {d.classification.articles.length > 2 && ` +${d.classification.articles.length - 2}`}
                                </span>
                              )}
                              <span className="ml-auto flex items-center gap-2 shrink-0">
                                {isVerifiedDoc ? (
                                  <TooltipProvider delayDuration={200}>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <ShieldCheck className="h-3 w-3 text-success" />
                                      </TooltipTrigger>
                                      <TooltipContent side="top" className="text-xs">
                                        {isNb ? "Verifisert" : "Verified"}{d.verifiedBy ? ` · ${d.verifiedBy}` : ""}{d.verifiedAt ? ` · ${d.verifiedAt}` : ""}
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                ) : (
                                  <span className="text-[10px] text-muted-foreground">{isNb ? "Egenrapportert" : "Self-reported"}</span>
                                )}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toast.info(isNb ? "Åpner dokument…" : "Opening document…", { description: d.name });
                                  }}
                                  className="text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                                  aria-label={isNb ? "Last ned" : "Download"}
                                >
                                  <Download className="h-3 w-3" />
                                </button>
                              </span>
                            </li>
                          );
                        })}
                          {state.documents.length > 3 && (
                            <li className="py-0.5 text-muted-foreground">
                              +{state.documents.length - 3} {isNb ? "flere" : "more"}
                            </li>
                          )}
                        </ul>
                      )}
                    </div>

                    {state.progress !== "verified" && state.progress !== "not_applicable" && (state.documents?.length ?? 0) === 0 && (() => {
                      // Finn et dokument fra et annet krav som Lara kan gjenbruke.
                      // Demo: bruk første dokument fra et annet krav som har dokumenter.
                      
                      let crossRef: undefined | {
                        name: string;
                        sourceRequirementName: string;
                        uploadedBy: string;
                        uploadedAt: string;
                        classification?: string;
                        coversRequirements?: string[];
                        onAccept: () => void;
                      };
                      if (bucketOf(state.progress) !== "met") {
                        const currentDocNames = new Set((state.documents ?? []).map((d) => d.name));
                        for (const other of requirements) {
                          if (other.requirement_id === req.requirement_id) continue;
                          const otherState = uiStates[other.requirement_id];
                          const doc = otherState?.documents?.find((d) => !currentDocNames.has(d.name));
                          if (doc) {
                            const uploader = otherState?.verification?.internalConfirmer?.name
                              ?? otherState?.attestedBy?.name
                              ?? "Vilde Gjellestad";
                            const uploadedAt = otherState?.verification?.internalConfirmer?.date
                              ?? otherState?.attestedBy?.date
                              ?? "3. juni 2026";
                            // Finn alle andre krav dette dokumentet allerede dekker
                            const alsoCovers = requirements
                              .filter((r) => {
                                if (r.requirement_id === other.requirement_id) return false;
                                if (r.requirement_id === req.requirement_id) return false;
                                return uiStates[r.requirement_id]?.documents?.some((d) => d.name === doc.name);
                              })
                              .map((r) => r.name_no);
                            // Enkel klassifisering ut fra filnavn
                            const lower = doc.name.toLowerCase();
                            const classification = lower.includes("policy")
                              ? "Policy"
                              : lower.includes("prosedyre") || lower.includes("procedure")
                                ? "Prosedyre"
                                : lower.includes("avtale") || lower.includes("dpa")
                                  ? "Avtale"
                                  : lower.includes("rapport")
                                    ? "Rapport"
                                    : "Dokumentasjon";
                            crossRef = {
                              name: doc.name,
                              sourceRequirementName: other.name_no,
                              uploadedBy: uploader,
                              uploadedAt,
                              classification,
                              coversRequirements: [req.name_no, ...alsoCovers],
                              onAccept: () => {
                                handleDocSave(req.requirement_id, "implemented", "", { ...doc });
                                toast.success("Bekreftet", {
                                  description: `${doc.name} er koblet til ${req.name_no}`,
                                });
                              },
                            };
                            break;
                          }
                        }
                      }
                      return (
                        <LaraDataSourceExplainer
                          requirement={req}
                          status={bucketOf(state.progress) === "met" ? "met" : bucketOf(state.progress) === "partial" ? "partial" : "not_met"}
                          onManualDocument={() => setDocDialog({ id: req.requirement_id, name: req.name_no })}
                          crossReferenceDoc={crossRef}
                        />
                      );
                    })()}


                    {state.progress === "implemented" && verifyingId !== req.requirement_id && (
                      <div className="flex justify-end text-xs">
                        <button
                          type="button"
                          onClick={() => {
                            setVerifyingId(req.requirement_id);
                            setVerifyName("");
                            setVerifyDate(new Date().toISOString().slice(0, 10));
                          }}
                          className="inline-flex items-center gap-1 text-primary hover:underline"
                        >
                          {isNb ? "Marker som verifisert" : "Mark as verified"}
                          <ArrowRight className="h-3 w-3" />
                        </button>
                      </div>
                    )}


                    {/* Inline verifiseringsform (kompakt, ingen dialog) */}
                    {verifyingId === req.requirement_id && (
                      <div className="rounded-md border bg-muted/20 p-2.5 flex flex-wrap items-end gap-2">
                        <div className="flex-1 min-w-[160px]">
                          <label className="text-[11px] text-muted-foreground block mb-1">{isNb ? "Verifisert av" : "Verified by"}</label>
                          <Input
                            value={verifyName}
                            onChange={(e) => setVerifyName(e.target.value)}
                            placeholder={isNb ? "F.eks. PwC eller intern rolle" : "e.g. PwC or internal role"}
                            className="h-8 text-xs"
                            autoFocus
                            onKeyDown={(e) => { if (e.key === "Enter" && verifyName.trim()) confirmVerification(req.requirement_id); }}
                          />
                        </div>
                        <div className="w-[140px]">
                          <label className="text-[11px] text-muted-foreground block mb-1">{isNb ? "Dato" : "Date"}</label>
                          <Input
                            type="date"
                            value={verifyDate}
                            onChange={(e) => setVerifyDate(e.target.value)}
                            className="h-8 text-xs"
                          />
                        </div>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => { setVerifyingId(null); setVerifyName(""); }}>
                            {isNb ? "Avbryt" : "Cancel"}
                          </Button>
                          <Button size="sm" className="h-8 text-xs" disabled={!verifyName.trim()} onClick={() => confirmVerification(req.requirement_id)}>
                            {isNb ? "Bekreft" : "Confirm"}
                          </Button>
                        </div>
                      </div>
                    )}

                    {state.progress === "in_progress" && (
                      <div className="space-y-2">
                        {reqNotes[req.requirement_id] && editingNoteId !== req.requirement_id ? (
                          <div className="p-3 rounded-lg bg-muted/50 border">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-start gap-2 min-w-0">
                                <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                                <p className="text-sm text-foreground whitespace-pre-wrap">{reqNotes[req.requirement_id]}</p>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 gap-1 text-xs shrink-0"
                                onClick={() => {
                                  setEditingNoteId(req.requirement_id);
                                  setDraftNote(reqNotes[req.requirement_id]);
                                }}
                              >
                                <Pencil className="h-3 w-3" />
                                Rediger
                              </Button>
                            </div>
                          </div>
                        ) : editingNoteId === req.requirement_id ? (
                          (() => {
                            const suggestions = [
                              "Mangler signatur fra ansvarlig",
                              "Venter på godkjenning fra ledelsen",
                              "Under utarbeidelse — ferdig neste kvartal",
                              "Trenger ekstern gjennomgang",
                            ];
                            const saveNote = (text: string) => {
                              setReqNotes((prev) => ({ ...prev, [req.requirement_id]: text }));
                              setEditingNoteId(null);
                              setDraftNote("");
                              toast.success("Notat lagret", { description: `Notat for ${req.name_no} er oppdatert` });
                            };
                            return (
                              <div className="p-3 rounded-lg border bg-muted/30 space-y-2.5">
                                <p className="text-xs text-muted-foreground">
                                  Hva gjenstår? Velg et vanlig svar eller skriv ditt eget.
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                  {suggestions.map((s) => (
                                    <button
                                      key={s}
                                      type="button"
                                      onClick={() => saveNote(s)}
                                      className="text-xs px-2.5 py-1 rounded-full border bg-background hover:bg-accent hover:border-primary/40 transition-colors"
                                    >
                                      {s}
                                    </button>
                                  ))}
                                </div>
                                <div className="flex items-center gap-2 pt-1">
                                  <Input
                                    value={draftNote}
                                    onChange={(e) => setDraftNote(e.target.value)}
                                    placeholder="Egen kommentar (valgfritt)"
                                    className="h-8 text-xs"
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter" && draftNote.trim()) saveNote(draftNote.trim());
                                    }}
                                  />
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 text-xs shrink-0"
                                    onClick={() => { setEditingNoteId(null); setDraftNote(""); }}
                                  >
                                    Avbryt
                                  </Button>
                                  <Button
                                    size="sm"
                                    className="h-8 text-xs shrink-0"
                                    disabled={!draftNote.trim()}
                                    onClick={() => saveNote(draftNote.trim())}
                                  >
                                    Lagre
                                  </Button>
                                </div>
                              </div>
                            );
                          })()
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 gap-1.5 text-xs text-muted-foreground hover:text-foreground px-2"
                            onClick={() => { setEditingNoteId(req.requirement_id); setDraftNote(""); }}
                          >
                            <MessageSquare className="h-3.5 w-3.5" />
                            Legg til kommentar (valgfritt)
                          </Button>
                        )}
                      </div>
                    )}

                    <p className="text-sm text-foreground leading-relaxed pt-1">{req.description_no}</p>

                    <p className="text-xs text-muted-foreground pt-2 border-t">
                      Referanse: <span className="font-mono">{req.requirement_id}</span>
                    </p>

                    {/* Verifisering — subtil, tett variant helt nederst */}
                    {state.progress === "verified" && state.verification && (
                      <div className="text-xs text-muted-foreground space-y-0.5">
                        <div className="flex items-start gap-1.5">
                          <ShieldCheck className="h-3.5 w-3.5 text-success mt-0.5 shrink-0" />
                          <span className="min-w-0">
                            {isNb ? "Verifisert av" : "Verified by"}{" "}
                            <span className="text-foreground font-medium">{state.verification.externalVerifier.name}</span>
                            {state.verification.externalVerifier.standard && <> · {state.verification.externalVerifier.standard}</>}
                            <> · {state.verification.externalVerifier.date}</>
                            {state.verification.externalVerifier.reportRef && (
                              <> · {isNb ? "Rapport" : "Report"} <span className="font-mono text-foreground/80">{state.verification.externalVerifier.reportRef}</span></>
                            )}
                            {state.verification.externalVerifier.person && <> · {state.verification.externalVerifier.person}</>}
                          </span>
                        </div>
                        <div className="flex items-start gap-1.5 pl-5">
                          <span className="min-w-0">
                            {isNb ? "Bekreftet av" : "Confirmed by"}{" "}
                            <span className="text-foreground">{state.verification.internalConfirmer.name}</span>
                            , {state.verification.internalConfirmer.role} · {state.verification.internalConfirmer.date}
                          </span>
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
