import { useState, useMemo, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  ChevronDown,
  ChevronUp,
  CircleAlert,
  CheckCircle2,
  Circle,
  Users,
  Bot,
} from "lucide-react";
import { getRequirementsByFramework } from "@/lib/complianceRequirementsData";
import { ALL_ADDITIONAL_REQUIREMENTS } from "@/lib/additionalFrameworkRequirements";
import type { ComplianceRequirement, AgentCapability } from "@/lib/complianceRequirementsData";
import { ManualDocumentationDialog } from "@/components/dialogs/ManualDocumentationDialog";
import { MessageSquare, Save, Pencil } from "lucide-react";

type DemoStatus = "not_met" | "partial" | "met";

interface RequirementState {
  status: DemoStatus;
  progress: number;
}

function generateDemoStates(requirements: ComplianceRequirement[]): Record<string, RequirementState> {
  const states: Record<string, RequirementState> = {};
  requirements.forEach((req, i) => {
    const hash = (req.requirement_id.charCodeAt(req.requirement_id.length - 1) + i) % 10;
    if (hash < 3) {
      states[req.requirement_id] = { status: "met", progress: 100 };
    } else if (hash === 3) {
      states[req.requirement_id] = { status: "partial", progress: 50 };
    } else {
      states[req.requirement_id] = { status: "not_met", progress: 0 };
    }
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
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "not_met" | "partial" | "met">("all");
  const [docDialog, setDocDialog] = useState<{ id: string; name: string } | null>(null);
  const [reqNotes, setReqNotes] = useState<Record<string, string>>({});
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [draftNote, setDraftNote] = useState<string>("");
  const reqRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Handle highlight from chart event click
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

  const [reqStates, setReqStates] = useState<Record<string, RequirementState>>(() =>
    generateDemoStates(requirements)
  );

  const counts = useMemo(() => {
    const met = Object.values(reqStates).filter((s) => s.status === "met").length;
    const partial = Object.values(reqStates).filter((s) => s.status === "partial").length;
    const notMet = Object.values(reqStates).filter((s) => s.status === "not_met").length;
    const auto = requirements.filter((r) => r.agent_capability === "full").length;
    const manual = requirements.filter((r) => r.agent_capability !== "full").length;
    const result = { met, partial, notMet, auto, manual, total: requirements.length };
    return result;
  }, [reqStates, requirements]);

  // Report counts up
  useMemo(() => {
    onCountsChange?.(counts);
  }, [counts, onCountsChange]);

  const filtered = useMemo(() => {
    if (filter === "all") return requirements;
    return requirements.filter((r) => reqStates[r.requirement_id]?.status === filter);
  }, [filter, requirements, reqStates]);

  const handleDocSave = (requirementId: string, status: string) => {
    setReqStates((prev) => ({
      ...prev,
      [requirementId]: {
        status: status === "fulfilled" ? "met" : status === "partial" ? "partial" : "not_met",
        progress: status === "fulfilled" ? 100 : status === "partial" ? 50 : 0,
      },
    }));
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
          <Badge variant="outline" className="gap-1 text-emerald-600 border-emerald-200 dark:border-emerald-800">
            <Bot className="h-3 w-3" />
            {counts.auto} AUTOMATISK
          </Badge>
          <Badge variant="outline" className="gap-1 text-muted-foreground">
            <Users className="h-3 w-3" />
            {counts.manual} MANUELL
          </Badge>
        </div>
      </div>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)} className="mb-4">
        <TabsList className="w-full grid grid-cols-4">
          <TabsTrigger value="all">Alle</TabsTrigger>
          <TabsTrigger value="not_met">Ikke oppfylt ({counts.notMet})</TabsTrigger>
          <TabsTrigger value="partial">Delvis ({counts.partial})</TabsTrigger>
          <TabsTrigger value="met">Oppfylt ({counts.met})</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="space-y-3">
        {filtered.map((req) => {
          const state = reqStates[req.requirement_id] || { status: "not_met", progress: 0 };
          const isExpanded = expandedId === req.requirement_id;
          const cap = capabilityLabel[req.agent_capability];

          return (
            <div
              key={req.requirement_id}
              ref={(el) => { reqRefs.current[req.requirement_id] = el; }}
              className={`rounded-lg border bg-card transition-all ${highlightRequirementId === req.requirement_id ? "ring-2 ring-primary/50" : ""}`}
            >
              <button
                onClick={() => setExpandedId(isExpanded ? null : req.requirement_id)}
                className="w-full p-4 flex items-start gap-3 text-left hover:bg-muted/30 transition-colors"
              >
                <div className="mt-0.5 shrink-0">
                  {state.status === "met" ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  ) : state.status === "partial" ? (
                    <CircleAlert className="h-5 w-5 text-amber-500" />
                  ) : (
                    <Circle className="h-5 w-5 text-destructive/60" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <span className="text-xs font-mono text-muted-foreground">{req.requirement_id}</span>
                    <span className="font-semibold text-sm text-foreground">{req.name_no}</span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{req.description_no}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className={`text-[13px] font-bold tracking-wider cursor-help ${cap.color}`}>{cap.label}</span>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-[220px]">
                      <p className="text-xs">{cap.tooltip}</p>
                    </TooltipContent>
                  </Tooltip>
                  <span className={`text-xs font-semibold ${
                    state.progress === 100 ? "text-emerald-600" : state.progress > 0 ? "text-amber-600" : "text-muted-foreground"
                  }`}>
                    {state.progress}%
                  </span>
                  {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </div>
              </button>

              {isExpanded && (
                <div className="px-4 pb-4">
                  <Separator className="mb-4" />
                  <div className="space-y-3">
                    <p className={`text-sm font-medium ${
                      state.status === "met" ? "text-emerald-600" : state.status === "partial" ? "text-amber-600" : "text-destructive"
                    }`}>
                      {state.status === "met" ? "Oppfylt" : state.status === "partial" ? "Delvis oppfylt" : "Ikke oppfylt"}
                    </p>

                    {/* Inline note for partial status */}
                    {state.status === "partial" && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                          <CircleAlert className="h-4 w-4 text-amber-500 shrink-0" />
                          <span className="text-sm text-amber-700 dark:text-amber-400">
                            Delvis oppfylt — legg til et notat om hva som gjenstår.
                          </span>
                        </div>
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
                              value={editingNoteId === req.requirement_id ? draftNote : draftNote}
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

                    {state.status !== "met" && (
                      <Button
                        className="w-full gap-2"
                        variant="outline"
                        onClick={() => setDocDialog({ id: req.requirement_id, name: req.name_no })}
                      >
                        <Users className="h-4 w-4" />
                        Dokumenter manuelt
                      </Button>
                    )}
                    {state.status === "met" && (
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        <span className="text-sm text-emerald-700 dark:text-emerald-400">
                          Dette kravet er dokumentert og verifisert.
                        </span>
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
          onSave={(status) => handleDocSave(docDialog.id, status)}
        />
      )}
    </div>
  );
};
