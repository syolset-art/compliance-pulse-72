import { useState, useMemo, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { ChevronDown, ChevronUp, Users, Bot, CheckCircle2, UserCheck, Paperclip, FileText as FileIcon, Download } from "lucide-react";

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
  const [docDialog, setDocDialog] = useState<{ id: string; name: string } | null>(null);
  const [reqNotes, setReqNotes] = useState<Record<string, string>>({});
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [draftNote, setDraftNote] = useState<string>("");
  const [cursorTip, setCursorTip] = useState<{ x: number; y: number } | null>(null);
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
    if (filter === "all") return requirements;
    return requirements.filter((r) => bucketOf(uiStates[r.requirement_id]?.progress ?? "not_answered") === filter);
  }, [filter, requirements, uiStates]);

  const handleDocSave = (requirementId: string, status: string) => {
    setUiStates((prev) => {
      const next: RequirementUiState =
        status === "fulfilled"
          ? { progress: "verified", evidence: "verified", evidenceCount: { collected: 1, required: 1 } }
          : status === "partial"
            ? { progress: "in_progress", evidence: "self_reported" }
            : { progress: "not_answered", evidence: "required" };
      return { ...prev, [requirementId]: next };
    });
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

      <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterKey)} className="mb-4">
        <TabsList className="w-full grid grid-cols-4">
          <TabsTrigger value="all">Alle</TabsTrigger>
          <TabsTrigger value="not_met">Ikke oppfylt ({counts.notMet})</TabsTrigger>
          <TabsTrigger value="partial">Delvis ({counts.partial})</TabsTrigger>
          <TabsTrigger value="met">Oppfylt ({counts.met})</TabsTrigger>
        </TabsList>
      </Tabs>

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
              <button
                onClick={() => { setExpandedId(isExpanded ? null : req.requirement_id); setCursorTip(null); }}
                onMouseMove={(e) => setCursorTip({ x: e.clientX, y: e.clientY })}
                onMouseLeave={() => setCursorTip(null)}
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
                  {state.attestedBy ? (
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                      <UserCheck className="h-3.5 w-3.5 shrink-0 text-success" />
                      <span className="truncate">
                        {isNb ? "Attestert av" : "Attested by"} {state.attestedBy.name} ({state.attestedBy.role}) · {state.attestedBy.date}
                      </span>
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{req.description_no}</p>
                  )}
                </div>
                <div className="flex items-center gap-1.5 shrink-0 mt-1">
                  {/* Dokument-teller (klikkbar via ekspandering) */}
                  {state.documents && state.documents.length > 0 && (
                    <TooltipProvider delayDuration={200}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span
                            className="inline-flex items-center gap-1 rounded-md border border-border bg-muted/40 px-1.5 py-0.5 text-xs font-medium text-foreground"
                            onMouseEnter={(e) => { e.stopPropagation(); setCursorTip(null); }}
                          >
                            <Paperclip className="h-3 w-3 text-muted-foreground" />
                            {state.documents.length}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-[260px]">
                          <p className="text-xs font-medium mb-1">{isNb ? "Dokumentasjon" : "Documentation"}</p>
                          <ul className="text-xs text-muted-foreground space-y-0.5">
                            {state.documents.slice(0, 4).map((d) => (
                              <li key={d.name} className="truncate">· {d.name}</li>
                            ))}
                            {state.documents.length > 4 && (
                              <li className="italic">+{state.documents.length - 4} {isNb ? "til" : "more"}</li>
                            )}
                          </ul>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}

                  {/* Bevis-tellingen (X/Y) — vises kun når det gir mening (ikke identisk med doc-teller) */}
                  {state.evidenceCount && state.evidenceCount.required > 0 && (
                    <span className="inline-flex items-center rounded-md border border-border bg-transparent px-1.5 py-0.5 text-[11px] font-mono tabular-nums text-muted-foreground">
                      {state.evidenceCount.collected}/{state.evidenceCount.required}
                    </span>
                  )}

                  {/* Ett samlet statusbadge — dedup når fremdrift == bevistilstand */}
                  {sameLabel ? (
                    <Badge variant="outline" className={cn("gap-1.5 text-xs font-medium", primaryCfg.badgeClass)}>
                      <PrimaryIcon className={cn("h-3 w-3", primaryCfg.iconClass)} />
                      {primaryLabel}
                    </Badge>
                  ) : (
                    <>
                      <Badge variant="outline" className={cn("gap-1.5 text-xs font-medium", evidenceCfg.badgeClass)}>
                        <EvidenceIcon className={cn("h-3 w-3", evidenceCfg.iconClass)} />
                        {formatEvidenceLabel(state, isNb)}
                      </Badge>
                      <Badge variant="outline" className={cn("gap-1.5 text-xs font-medium", progressCfg.badgeClass)}>
                        {isNb ? progressCfg.labelNb : progressCfg.labelEn}
                      </Badge>
                    </>
                  )}

                  {/* Kapasitets-badge — nøytral */}
                  <TooltipProvider delayDuration={200}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge
                          variant="outline"
                          className="gap-1.5 text-xs font-medium text-muted-foreground cursor-help"
                          onMouseEnter={(e) => { e.stopPropagation(); setCursorTip(null); }}
                        >
                          <CapIcon className="h-3 w-3" />
                          {cap.label}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-[240px]">
                        <p className="text-xs">{cap.tooltip}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </div>
              </button>


              {isExpanded && (
                <div className="px-4 pb-4">
                  <Separator className="mb-4" />
                  <div className="space-y-4">
                    <p className="text-sm text-foreground leading-relaxed">{req.description_no}</p>

                    {state.progress !== "verified" && state.progress !== "not_applicable" && (
                      <LaraDataSourceExplainer
                        requirement={req}
                        status={bucketOf(state.progress) === "met" ? "met" : bucketOf(state.progress) === "partial" ? "partial" : "not_met"}
                        onManualDocument={() => setDocDialog({ id: req.requirement_id, name: req.name_no })}
                      />
                    )}

                    {bucketOf(state.progress) === "partial" && (
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
                        ) : (
                          <div className="space-y-2">
                            <Textarea
                              value={draftNote}
                              onChange={(e) => setDraftNote(e.target.value)}
                              placeholder="Legg til notat om hva som gjenstår..."
                              className="min-h-[80px] text-sm"
                              onFocus={() => {
                                if (editingNoteId !== req.requirement_id) {
                                  setEditingNoteId(req.requirement_id);
                                  setDraftNote(reqNotes[req.requirement_id] || "");
                                }
                              }}
                            />
                            <div className="flex justify-end">
                              <Button
                                size="sm"
                                className="h-8 gap-1.5 text-xs"
                                disabled={!draftNote.trim()}
                                onClick={() => {
                                  setReqNotes((prev) => ({ ...prev, [req.requirement_id]: draftNote.trim() }));
                                  setEditingNoteId(null);
                                  setDraftNote("");
                                  toast.success("Notat lagret", { description: `Notat for ${req.name_no} er oppdatert` });
                                }}
                              >
                                <Save className="h-3.5 w-3.5" />
                                Lagre notat
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {state.progress === "verified" && (
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-success/10 border border-success/25">
                        <CheckCircle2 className="h-4 w-4 text-success" />
                        <span className="text-sm text-success">
                          {isNb
                            ? state.attestedBy
                              ? `Verifisert · Attestert av ${state.attestedBy.name} (${state.attestedBy.role}) den ${state.attestedBy.date}.`
                              : "Dette kravet er dokumentert og verifisert."
                            : "This requirement is documented and verified."}
                        </span>
                      </div>
                    )}

                    <p className="text-xs text-muted-foreground pt-2 border-t">
                      Referanse: <span className="font-mono">{req.requirement_id}</span>
                    </p>
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
          onSave={(status) => handleDocSave(docDialog.id, status)}
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
