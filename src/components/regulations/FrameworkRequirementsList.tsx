import { useState, useMemo, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { ChevronDown, ChevronUp, Users, Bot, CheckCircle2, UserCheck, Paperclip, FileText as FileIcon, Download, ShieldCheck, Sparkles, Clock } from "lucide-react";

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
              : { progress: "not_answered", evidence: "required", documents };
      return { ...prev, [requirementId]: next };
    });
  };

  const handleRequestVerification = (requirementId: string, docName: string) => {
    setUiStates((prev) => {
      const cur = prev[requirementId];
      if (!cur?.documents) return prev;
      const documents = cur.documents.map((d) =>
        d.name === docName ? { ...d, verificationStatus: "pending_verification" as const } : d,
      );
      return { ...prev, [requirementId]: { ...cur, documents } };
    });
    toast.info("Uavhengig verifisering kommer snart", {
      description: "Vi varsler deg når tjenesten er tilgjengelig.",
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
                  {/* Dokument- og bevis-tellere fjernet — status sier alt */}


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

                    {/* Dokumentasjonsliste */}
                    {state.documents && state.documents.length > 0 && (
                      <div className="rounded-lg border bg-muted/20">
                        <div className="flex items-center justify-between px-3 py-2 border-b">
                          <div className="flex items-center gap-2 text-xs font-medium text-foreground">
                            <Paperclip className="h-3.5 w-3.5 text-muted-foreground" />
                            {isNb ? "Dokumentasjon" : "Documentation"}
                            <span className="text-muted-foreground font-normal">({state.documents.length})</span>
                          </div>
                          {state.attestedBy && (
                            <span className="text-[11px] text-muted-foreground">
                              {isNb ? "Attestert" : "Attested"} · {state.attestedBy.date}
                            </span>
                          )}
                        </div>
                        <ul className="divide-y">
                          {state.documents.map((d) => {
                            const vStatus = d.verificationStatus ?? "self_reported";
                            const vLabel =
                              vStatus === "verified"
                                ? (isNb ? "Verifisert" : "Verified")
                                : vStatus === "pending_verification"
                                  ? (isNb ? "Til verifisering" : "Pending verification")
                                  : (isNb ? "Egenrapportert" : "Self-reported");
                            const vClass =
                              vStatus === "verified"
                                ? "text-success border-success/40"
                                : vStatus === "pending_verification"
                                  ? "text-warning border-warning/40"
                                  : "text-muted-foreground border-border";
                            const canDownload = vStatus === "verified";
                            return (
                              <li key={d.name} className="px-3 py-2.5 text-sm space-y-2 hover:bg-muted/30 transition-colors">
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <FileIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                                    <span className="truncate font-medium">{d.name}</span>
                                    <span className="text-[10px] uppercase tracking-wide text-muted-foreground bg-muted px-1.5 py-0.5 rounded shrink-0">{d.kind}</span>
                                  </div>
                                  <Badge variant="outline" className={cn("gap-1 text-[10px] font-medium shrink-0", vClass)}>
                                    {vStatus === "verified" && <ShieldCheck className="h-3 w-3" />}
                                    {vLabel}
                                  </Badge>
                                </div>

                                {d.classification && (
                                  <div className="flex items-start gap-1.5 text-xs text-muted-foreground pl-6">
                                    <Sparkles className="h-3 w-3 mt-0.5 text-primary shrink-0" />
                                    <span className="min-w-0">
                                      <span className="font-medium text-foreground">{d.classification.docType}</span>
                                      {d.classification.articles.length > 0 && (
                                        <> · {isNb ? "dekker" : "covers"} {d.classification.articles.join(", ")}</>
                                      )}
                                      {d.classification.confidence > 0 && (
                                        <> · {Math.round(d.classification.confidence * 100)}% {isNb ? "sikker" : "confident"}</>
                                      )}
                                    </span>
                                  </div>
                                )}

                                <div className="flex items-center justify-end gap-2 pl-6">
                                  <TooltipProvider delayDuration={200}>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <span>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-7 gap-1.5 text-xs"
                                            disabled={!canDownload}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              toast.info(isNb ? "Åpner dokument…" : "Opening document…", { description: d.name });
                                            }}
                                          >
                                            <Download className="h-3 w-3" />
                                            {isNb ? "Last ned" : "Download"}
                                          </Button>
                                        </span>
                                      </TooltipTrigger>
                                      {!canDownload && (
                                        <TooltipContent side="top" className="max-w-[240px]">
                                          <p className="text-xs">{isNb ? "Tilgjengelig etter uavhengig verifisering" : "Available after independent verification"}</p>
                                        </TooltipContent>
                                      )}
                                    </Tooltip>
                                  </TooltipProvider>

                                  {vStatus !== "verified" && (
                                    <Button
                                      variant={vStatus === "pending_verification" ? "outline" : "default"}
                                      size="sm"
                                      className="h-7 gap-1.5 text-xs"
                                      disabled={vStatus === "pending_verification"}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleRequestVerification(req.requirement_id, d.name);
                                      }}
                                    >
                                      <ShieldCheck className="h-3 w-3" />
                                      {vStatus === "pending_verification"
                                        ? (isNb ? "Venter på verifisering" : "Awaiting verification")
                                        : (isNb ? "Be om verifisering" : "Request verification")}
                                      <Badge variant="secondary" className="ml-1 h-4 px-1 text-[9px] font-semibold">
                                        {isNb ? "Kommer" : "Soon"}
                                      </Badge>
                                    </Button>
                                  )}
                                </div>
                              </li>
                            );
                          })}
                        </ul>
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
