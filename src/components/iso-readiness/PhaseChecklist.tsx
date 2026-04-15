import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { CheckCircle2, Circle, Clock, ChevronDown, MessageSquare, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { CERTIFICATION_PHASES, getPhaseForRequirement, type CertificationPhase } from "@/lib/certificationPhases";
import type { RequirementWithStatus } from "@/hooks/useComplianceRequirements";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

interface PhaseChecklistProps {
  requirements: RequirementWithStatus[];
  updateStatus: (params: { requirementDbId: string; status?: string; evidenceNotes?: string }) => void;
  isUpdating: boolean;
}

function RequirementRow({ 
  requirement, 
  onStatusChange, 
  onCommentSave, 
  isUpdating 
}: { 
  requirement: RequirementWithStatus; 
  onStatusChange: (dbId: string, completed: boolean) => void;
  onCommentSave: (dbId: string, comment: string) => void;
  isUpdating: boolean;
}) {
  const { t, i18n } = useTranslation();
  const isNorwegian = i18n.language === "nb";
  const [showComment, setShowComment] = useState(false);
  const [comment, setComment] = useState(requirement.evidence_notes || "");

  const name = isNorwegian && requirement.name_no ? requirement.name_no : requirement.name;
  const isCompleted = requirement.status === "completed";
  const hasDbId = !!requirement.db_id;

  const priorityColors: Record<string, string> = {
    critical: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    high: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    medium: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    low: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  };

  return (
    <div className={cn(
      "py-3 px-4 rounded-lg border transition-all",
      isCompleted ? "bg-muted/30 border-muted" : "bg-card border-border hover:border-primary/30"
    )}>
      <div className="flex items-start gap-3">
        <Checkbox
          checked={isCompleted}
          onCheckedChange={(checked) => hasDbId && onStatusChange(requirement.db_id!, !!checked)}
          disabled={isUpdating || !hasDbId}
          className="mt-0.5"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono text-muted-foreground">{requirement.requirement_id}</span>
            <span className={cn("font-medium text-sm", isCompleted && "line-through text-muted-foreground")}>
              {name}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline" className={cn("text-[13px]", priorityColors[requirement.priority])}>
              {t(`tasks.priority.${requirement.priority === "critical" ? "high" : requirement.priority}`)}
            </Badge>
            <Badge variant="secondary" className="text-[13px]">{requirement.category}</Badge>
          </div>
          
          {requirement.evidence_notes && !showComment && (
            <div className="mt-2 p-2 bg-muted/50 rounded text-xs text-muted-foreground italic">
              "{requirement.evidence_notes}"
            </div>
          )}

          {showComment ? (
            <div className="mt-2 space-y-2">
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={t("isoReadiness.commentPlaceholder")}
                className="text-sm"
                rows={2}
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={() => { onCommentSave(requirement.db_id!, comment); setShowComment(false); }} disabled={isUpdating || !hasDbId}>
                  <Save className="w-3 h-3 mr-1" />
                  {t("isoReadiness.saveComment")}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setShowComment(false)}>
                  {t("common.cancel")}
                </Button>
              </div>
            </div>
          ) : (
            <Button variant="ghost" size="sm" className="mt-1 text-xs text-muted-foreground h-7 px-2" onClick={() => setShowComment(true)}>
              <MessageSquare className="w-3 h-3 mr-1" />
              {requirement.evidence_notes ? t("common.edit") : t("isoReadiness.addComment")}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export function PhaseChecklist({ requirements, updateStatus, isUpdating }: PhaseChecklistProps) {
  const { t, i18n } = useTranslation();
  const isNorwegian = i18n.language === "nb";

  // Group requirements by certification phase
  const phaseGroups = useMemo(() => {
    const groups: Record<CertificationPhase, RequirementWithStatus[]> = {
      foundation: [],
      implementation: [],
      operation: [],
      audit: [],
      certification: [],
    };
    
    requirements.forEach(req => {
      const phase = getPhaseForRequirement(req.category, req.priority, req.sla_category);
      groups[phase].push(req);
    });

    return groups;
  }, [requirements]);

  // Start with first non-complete phase open
  const [openPhases, setOpenPhases] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    for (const phase of CERTIFICATION_PHASES) {
      const reqs = phaseGroups[phase.id];
      const allCompleted = reqs.length > 0 && reqs.every(r => r.status === 'completed');
      if (!allCompleted && reqs.length > 0) {
        initial.add(phase.id);
        break;
      }
    }
    // Also open foundation by default
    initial.add('foundation');
    return initial;
  });

  const togglePhase = (phaseId: string) => {
    setOpenPhases(prev => {
      const next = new Set(prev);
      next.has(phaseId) ? next.delete(phaseId) : next.add(phaseId);
      return next;
    });
  };

  const handleStatusChange = (dbId: string, completed: boolean) => {
    updateStatus({ requirementDbId: dbId, status: completed ? "completed" : "not_started" });
    toast({ title: t("isoReadiness.savedSuccess"), description: t("isoReadiness.savedSuccessDesc") });
  };

  const handleCommentSave = (dbId: string, comment: string) => {
    updateStatus({ requirementDbId: dbId, evidenceNotes: comment });
    toast({ title: t("isoReadiness.savedSuccess"), description: t("isoReadiness.savedSuccessDesc") });
  };

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-foreground">{t("isoReadiness.requirementsPerPhase")}</h4>
      
      {CERTIFICATION_PHASES.map(phase => {
        const reqs = phaseGroups[phase.id];
        if (reqs.length === 0) return null;
        
        const completed = reqs.filter(r => r.status === 'completed').length;
        const total = reqs.length;
        const allDone = completed === total;
        const hasProgress = completed > 0;
        const phaseName = isNorwegian ? phase.name_no : phase.name_en;

        return (
          <Collapsible key={phase.id} open={openPhases.has(phase.id)} onOpenChange={() => togglePhase(phase.id)}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-3 h-auto border border-border rounded-lg hover:bg-muted/50">
                <div className="flex items-center gap-2">
                  {allDone ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  ) : hasProgress ? (
                    <Clock className="w-4 h-4 text-amber-500" />
                  ) : (
                    <Circle className="w-4 h-4 text-muted-foreground" />
                  )}
                  <span className="font-medium text-sm">
                    {t("isoReadiness.phaseLabel", { number: CERTIFICATION_PHASES.indexOf(phase) + 1 })}: {phaseName}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "text-xs font-medium",
                    allDone ? "text-emerald-600 dark:text-emerald-400" : hasProgress ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"
                  )}>
                    {allDone ? `✓ ${t("isoReadiness.phaseComplete")}` : `${completed}/${total}`}
                  </span>
                  <ChevronDown className={cn("w-4 h-4 transition-transform", openPhases.has(phase.id) && "rotate-180")} />
                </div>
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2 space-y-2 pl-2">
              {reqs
                .sort((a, b) => {
                  // Incomplete first, then by sort_order
                  const aComplete = a.status === 'completed' ? 1 : 0;
                  const bComplete = b.status === 'completed' ? 1 : 0;
                  if (aComplete !== bComplete) return aComplete - bComplete;
                  return a.sort_order - b.sort_order;
                })
                .map(req => (
                  <RequirementRow
                    key={`${req.framework_id}-${req.requirement_id}`}
                    requirement={req}
                    onStatusChange={handleStatusChange}
                    onCommentSave={handleCommentSave}
                    isUpdating={isUpdating}
                  />
                ))}
            </CollapsibleContent>
          </Collapsible>
        );
      })}
    </div>
  );
}
