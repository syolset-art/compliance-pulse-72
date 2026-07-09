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
import { ChevronDown, ChevronUp, Users, Bot, CheckCircle2, UserCheck, Paperclip, FileText as FileIcon, Download, ShieldCheck, Sparkles, Clock, Search, X, ArrowRight, HelpCircle } from "lucide-react";
import { Input } from "@/components/ui/input";

import { getRequirementsByFramework } from "@/lib/complianceRequirementsData";
import { ALL_ADDITIONAL_REQUIREMENTS } from "@/lib/additionalFrameworkRequirements";
import type { ComplianceRequirement, AgentCapability } from "@/lib/complianceRequirementsData";
import { ManualDocumentationDialog } from "@/components/dialogs/ManualDocumentationDialog";
import { LaraDataSourceExplainer } from "@/components/regulations/LaraDataSourceExplainer";
import { MessageSquare, Save, Pencil } from "lucide-react";
import {
  demoUiStateFor,
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
          const progressCfg = getProgressConfig(state.progress);
          const ProgressIcon = progressCfg.icon;
          const isMuted = state.progress === "not_applicable" || state.evidence === "out_of_scope";
          const isVerifiedDue = state.progress === "verified" && state.evidence === "revalidation_due";


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

                    {/* Dokumentasjon øverst — én subtil og tett linje */}
                    <div className="border-y border-border/40 py-1.5 text-[11px] text-muted-foreground">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="inline-flex items-center gap-1 font-medium text-muted-foreground shrink-0">
                          <Paperclip className="h-3 w-3" />
                          {isNb ? "Dokumentasjon" : "Documentation"}
                        </span>
                        {(state.documents?.length ?? 0) > 0 ? (
                          <div className="flex items-center gap-1.5 min-w-0 flex-1 overflow-hidden">
                            {state.documents?.slice(0, 3).map((d) => {
                              const isVerifiedDoc = (d.verificationStatus ?? "self_reported") === "verified";
                              return (
                                <button
                                  key={d.name}
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toast.info(isNb ? "Åpner dokument…" : "Opening document…", { description: d.name });
                                  }}
                                  className="inline-flex items-center gap-1 min-w-0 max-w-[180px] hover:text-foreground"
                                  title={d.name}
                                >
                                  <FileIcon className="h-3 w-3 shrink-0" />
                                  <span className="truncate">{d.name}</span>
                                  {isVerifiedDoc && <ShieldCheck className="h-3 w-3 text-success shrink-0" />}
                                </button>
                              );
                            })}
                            {state.documents && state.documents.length > 3 && (
                              <span className="shrink-0">+{state.documents.length - 3}</span>
                            )}
                          </div>
                        ) : (
                          <span className="truncate flex-1">{isNb ? "Ingen dokumenter lagt til" : "No documents added"}</span>
                        )}
                        <button
                          type="button"
                          onClick={() => setDocDialog({ id: req.requirement_id, name: req.name_no })}
                          className="ml-auto shrink-0 text-primary hover:underline"
                        >
                          {isNb ? "Legg til" : "Add"}
                        </button>
                      </div>
                    </div>

                    {/* Automatisk vurdering — én tett linje med klikkbare AI-dokumenter */}
                    <div className="rounded-md border border-border/60 bg-muted/20 px-3 py-2 text-xs space-y-1.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span className="font-medium text-foreground">
                          {isNb ? "Automatisk vurdering" : "Automatic assessment"}
                        </span>
                        <span className="text-muted-foreground truncate">
                          · {state.documents?.length ?? 0} {isNb ? "AI-dokument(er)" : "AI document(s)"}
                        </span>
                      </div>
                      {(state.documents?.length ?? 0) > 0 && (
                        <div className="flex flex-wrap gap-1 pl-5">
                          {state.documents?.map((d) => (
                            <button
                              key={d.name}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toast.info(isNb ? "Åpner dokument…" : "Opening document…", { description: d.name });
                              }}
                              className="inline-flex items-center gap-1 max-w-[220px] rounded border border-border/60 bg-background px-1.5 py-0.5 text-[11px] text-muted-foreground hover:text-foreground hover:border-border transition-colors"
                              title={isNb ? `Åpne ${d.name}` : `Open ${d.name}`}
                            >
                              <FileIcon className="h-3 w-3 shrink-0" />
                              <span className="truncate">{d.name}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Manuell dokumentering — alltid tilgjengelig, inline */}
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
                          onChange={(e) => handleStatusChange(req.requirement_id, e.target.value as ProgressStatus)}
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
                        <div className="flex items-center gap-1.5">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-8 gap-1.5 text-xs"
                            onClick={(e) => { e.stopPropagation(); setDocDialog({ id: req.requirement_id, name: req.name_no }); }}
                          >
                            <Paperclip className="h-3.5 w-3.5" />
                            {isNb ? "Tilknytt dokument" : "Attach document"}
                          </Button>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button type="button" onClick={(e) => e.stopPropagation()} className="text-muted-foreground hover:text-foreground">
                                <HelpCircle className="h-3.5 w-3.5" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-[240px] text-xs">
                              {isNb
                                ? "Last opp eller koble til et dokument som beviser at kravet er oppfylt — f.eks. policy, rutine, avtale eller skjermbilde."
                                : "Upload or link a document that proves the requirement is met — e.g. policy, routine, agreement or screenshot."}
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </div>

                    </div>


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
