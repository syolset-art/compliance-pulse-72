import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Shield, Lock, Brain, ChevronDown, CheckCircle2, Clock, Circle, MessageSquare, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useComplianceRequirements, type RequirementWithStatus } from "@/hooks/useComplianceRequirements";
import type { RequirementDomain } from "@/lib/complianceRequirementsData";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

interface DomainConfig {
  id: RequirementDomain;
  icon: React.ReactNode;
  colorClass: string;
  bgClass: string;
  borderClass: string;
  selectedBorderClass: string;
}

const domainConfigs: DomainConfig[] = [
  {
    id: "privacy",
    icon: <Shield className="w-5 h-5" />,
    colorClass: "text-blue-600 dark:text-blue-400",
    bgClass: "bg-blue-50 dark:bg-blue-950/30",
    borderClass: "border-blue-200 dark:border-blue-800",
    selectedBorderClass: "border-blue-500 dark:border-blue-400 ring-2 ring-blue-500/20"
  },
  {
    id: "security",
    icon: <Lock className="w-5 h-5" />,
    colorClass: "text-emerald-600 dark:text-emerald-400",
    bgClass: "bg-emerald-50 dark:bg-emerald-950/30",
    borderClass: "border-emerald-200 dark:border-emerald-800",
    selectedBorderClass: "border-emerald-500 dark:border-emerald-400 ring-2 ring-emerald-500/20"
  },
  {
    id: "ai",
    icon: <Brain className="w-5 h-5" />,
    colorClass: "text-purple-600 dark:text-purple-400",
    bgClass: "bg-purple-50 dark:bg-purple-950/30",
    borderClass: "border-purple-200 dark:border-purple-800",
    selectedBorderClass: "border-purple-500 dark:border-purple-400 ring-2 ring-purple-500/20"
  }
];

interface DomainSummaryCardProps {
  config: DomainConfig;
  requirements: RequirementWithStatus[];
  isSelected: boolean;
  onClick: () => void;
}

function DomainSummaryCard({ config, requirements, isSelected, onClick }: DomainSummaryCardProps) {
  const { t } = useTranslation();

  const stats = useMemo(() => {
    const total = requirements.length;
    const completed = requirements.filter(r => r.status === "completed").length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, percent };
  }, [requirements]);

  return (
    <Card 
      className={cn(
        "cursor-pointer transition-all hover:shadow-md",
        isSelected ? config.selectedBorderClass : config.borderClass
      )}
      onClick={onClick}
    >
      <CardHeader className={cn("pb-3", config.bgClass)}>
        <div className="flex items-center gap-3">
          <div className={cn("p-2 rounded-lg", config.bgClass, config.colorClass)}>
            {config.icon}
          </div>
          <div className="flex-1">
            <CardTitle className="text-base">
              {t(`tasks.readiness.domains.${config.id}`)}
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t(`tasks.readiness.standards.${config.id}`)}
            </p>
          </div>
          <div className="text-right">
            <span className={cn("text-xl font-bold", config.colorClass)}>
              {stats.percent}%
            </span>
          </div>
        </div>
        <Progress value={stats.percent} className="h-1.5 mt-2" />
        <p className="text-xs text-muted-foreground mt-1">
          {stats.completed}/{stats.total} {t("tasks.readiness.requirements")}
        </p>
      </CardHeader>
    </Card>
  );
}

interface RequirementItemProps {
  requirement: RequirementWithStatus;
  onStatusChange: (dbId: string, completed: boolean) => void;
  onCommentSave: (dbId: string, comment: string) => void;
  isUpdating: boolean;
}

function RequirementItem({ requirement, onStatusChange, onCommentSave, isUpdating }: RequirementItemProps) {
  const { t, i18n } = useTranslation();
  const isNorwegian = i18n.language === "nb";
  const [showComment, setShowComment] = useState(false);
  const [comment, setComment] = useState(requirement.evidence_notes || "");

  const getName = () => isNorwegian && requirement.name_no ? requirement.name_no : requirement.name;
  const getDescription = () => isNorwegian && requirement.description_no ? requirement.description_no : requirement.description;

  const isCompleted = requirement.status === "completed";
  const hasDbId = !!requirement.db_id;

  const handleCheckChange = (checked: boolean) => {
    if (!hasDbId) {
      toast({
        title: t("common.error"),
        description: "Requirement not found in database",
        variant: "destructive"
      });
      return;
    }
    onStatusChange(requirement.db_id!, checked);
  };

  const handleSaveComment = () => {
    if (!hasDbId) return;
    onCommentSave(requirement.db_id!, comment);
    setShowComment(false);
  };

  const priorityColors = {
    critical: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    high: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    medium: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    low: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
  };

  return (
    <div className={cn(
      "p-4 rounded-lg border transition-all",
      isCompleted 
        ? "bg-muted/30 border-muted" 
        : "bg-card border-border hover:border-primary/30"
    )}>
      <div className="flex items-start gap-3">
        <Checkbox
          checked={isCompleted}
          onCheckedChange={handleCheckChange}
          disabled={isUpdating || !hasDbId}
          className="mt-1"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-mono text-muted-foreground">
                  {requirement.requirement_id}
                </span>
                <Badge variant="outline" className={cn("text-xs", priorityColors[requirement.priority])}>
                  {t(`tasks.priority.${requirement.priority === "critical" ? "high" : requirement.priority}`)}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {requirement.category}
                </Badge>
              </div>
              <p className={cn(
                "font-medium mt-1",
                isCompleted && "line-through text-muted-foreground"
              )}>
                {getName()}
              </p>
              {getDescription() && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {getDescription()}
                </p>
              )}
            </div>
          </div>

          {/* Existing comment display */}
          {requirement.evidence_notes && !showComment && (
            <div className="mt-2 p-2 bg-muted/50 rounded text-sm text-muted-foreground italic">
              "{requirement.evidence_notes}"
            </div>
          )}

          {/* Comment input */}
          {showComment ? (
            <div className="mt-3 space-y-2">
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={t("tasks.readiness.commentPlaceholder")}
                className="text-sm"
                rows={2}
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSaveComment} disabled={isUpdating}>
                  <Save className="w-3 h-3 mr-1" />
                  {t("tasks.readiness.saveComment")}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setShowComment(false)}>
                  {t("common.cancel")}
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => setShowComment(true)}
            >
              <MessageSquare className="w-3 h-3 mr-1" />
              {requirement.evidence_notes ? t("common.edit") : t("tasks.readiness.addComment")}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

interface DomainDetailViewProps {
  config: DomainConfig;
  requirements: RequirementWithStatus[];
  updateStatus: (params: { requirementDbId: string; status?: string; evidenceNotes?: string }) => void;
  isUpdating: boolean;
}

function DomainDetailView({ config, requirements, updateStatus, isUpdating }: DomainDetailViewProps) {
  const { t } = useTranslation();
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["remaining", "inProgress"]));

  const grouped = useMemo(() => ({
    completed: requirements.filter(r => r.status === "completed"),
    inProgress: requirements.filter(r => r.status === "in_progress"),
    remaining: requirements.filter(r => r.status === "not_started")
  }), [requirements]);

  const stats = useMemo(() => {
    const total = requirements.length;
    const completed = grouped.completed.length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, percent };
  }, [requirements, grouped]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  const handleStatusChange = (dbId: string, completed: boolean) => {
    updateStatus({
      requirementDbId: dbId,
      status: completed ? "completed" : "not_started"
    });
    toast({
      title: t("tasks.readiness.savedSuccess"),
      description: t("tasks.readiness.savedSuccessDesc")
    });
  };

  const handleCommentSave = (dbId: string, comment: string) => {
    updateStatus({
      requirementDbId: dbId,
      evidenceNotes: comment
    });
    toast({
      title: t("tasks.readiness.savedSuccess"),
      description: t("tasks.readiness.savedSuccessDesc")
    });
  };

  return (
    <Card className={cn("mt-6", config.borderClass)}>
      <CardHeader className={config.bgClass}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn("p-2 rounded-lg", config.colorClass)}>
              {config.icon}
            </div>
            <div>
              <CardTitle className="text-lg">
                {t(`tasks.readiness.domains.${config.id}`)}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {t(`tasks.readiness.standards.${config.id}`)}
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className={cn("text-2xl font-bold", config.colorClass)}>
              {stats.percent}%
            </span>
            <p className="text-sm text-muted-foreground">
              {stats.completed}/{stats.total} {t("tasks.readiness.requirements")}
            </p>
          </div>
        </div>
        <Progress value={stats.percent} className="h-2 mt-3" />
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        {/* Remaining (Not Started) */}
        {grouped.remaining.length > 0 && (
          <Collapsible open={expandedSections.has("remaining")} onOpenChange={() => toggleSection("remaining")}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-2 h-auto">
                <div className="flex items-center gap-2">
                  <Circle className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">
                    {t("tasks.readiness.remaining")} ({grouped.remaining.length})
                  </span>
                </div>
                <ChevronDown className={cn(
                  "w-4 h-4 transition-transform",
                  expandedSections.has("remaining") && "rotate-180"
                )} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2 space-y-2">
              {grouped.remaining.map(req => (
                <RequirementItem
                  key={`${req.framework_id}-${req.requirement_id}`}
                  requirement={req}
                  onStatusChange={handleStatusChange}
                  onCommentSave={handleCommentSave}
                  isUpdating={isUpdating}
                />
              ))}
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* In Progress */}
        {grouped.inProgress.length > 0 && (
          <Collapsible open={expandedSections.has("inProgress")} onOpenChange={() => toggleSection("inProgress")}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-2 h-auto">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-500" />
                  <span className="font-medium text-amber-600 dark:text-amber-400">
                    {t("tasks.readiness.inProgress")} ({grouped.inProgress.length})
                  </span>
                </div>
                <ChevronDown className={cn(
                  "w-4 h-4 transition-transform",
                  expandedSections.has("inProgress") && "rotate-180"
                )} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2 space-y-2">
              {grouped.inProgress.map(req => (
                <RequirementItem
                  key={`${req.framework_id}-${req.requirement_id}`}
                  requirement={req}
                  onStatusChange={handleStatusChange}
                  onCommentSave={handleCommentSave}
                  isUpdating={isUpdating}
                />
              ))}
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Completed */}
        {grouped.completed.length > 0 && (
          <Collapsible open={expandedSections.has("completed")} onOpenChange={() => toggleSection("completed")}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-2 h-auto">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span className="font-medium text-emerald-600 dark:text-emerald-400">
                    {t("tasks.readiness.completed")} ({grouped.completed.length})
                  </span>
                </div>
                <ChevronDown className={cn(
                  "w-4 h-4 transition-transform",
                  expandedSections.has("completed") && "rotate-180"
                )} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2 space-y-2">
              {grouped.completed.map(req => (
                <RequirementItem
                  key={`${req.framework_id}-${req.requirement_id}`}
                  requirement={req}
                  onStatusChange={handleStatusChange}
                  onCommentSave={handleCommentSave}
                  isUpdating={isUpdating}
                />
              ))}
            </CollapsibleContent>
          </Collapsible>
        )}
      </CardContent>
    </Card>
  );
}

export function ISOReadinessView() {
  const { t } = useTranslation();
  const [selectedDomain, setSelectedDomain] = useState<RequirementDomain>("privacy");

  // Fetch requirements for each domain
  const { requirements: privacyReqs, isLoading: privacyLoading, updateStatus: updatePrivacy, isUpdating: updatingPrivacy } = useComplianceRequirements({ domain: "privacy" });
  const { requirements: securityReqs, isLoading: securityLoading, updateStatus: updateSecurity, isUpdating: updatingSecurity } = useComplianceRequirements({ domain: "security" });
  const { requirements: aiReqs, isLoading: aiLoading, updateStatus: updateAI, isUpdating: updatingAI } = useComplianceRequirements({ domain: "ai" });

  const isLoading = privacyLoading || securityLoading || aiLoading;

  const requirementsByDomain: Record<RequirementDomain, RequirementWithStatus[]> = {
    privacy: privacyReqs,
    security: securityReqs,
    ai: aiReqs
  };

  const updateStatusByDomain: Record<RequirementDomain, typeof updatePrivacy> = {
    privacy: updatePrivacy,
    security: updateSecurity,
    ai: updateAI
  };

  const isUpdatingByDomain: Record<RequirementDomain, boolean> = {
    privacy: updatingPrivacy,
    security: updatingSecurity,
    ai: updatingAI
  };

  // Calculate overall stats
  const overallStats = useMemo(() => {
    const allReqs = [...privacyReqs, ...securityReqs, ...aiReqs];
    const total = allReqs.length;
    const completed = allReqs.filter(r => r.status === "completed").length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, percent };
  }, [privacyReqs, securityReqs, aiReqs]);

  const selectedConfig = domainConfigs.find(c => c.id === selectedDomain)!;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">{t("common.loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">{t("tasks.readiness.title")}</h2>
          <p className="text-sm text-muted-foreground">{t("tasks.readiness.subtitle")}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">{t("tasks.overallCompliance")}</p>
          <p className="text-2xl font-bold text-primary">{overallStats.percent}%</p>
          <p className="text-xs text-muted-foreground">
            {overallStats.completed}/{overallStats.total} {t("tasks.readiness.requirements")}
          </p>
        </div>
      </div>

      {/* Domain Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {domainConfigs.map(config => (
          <DomainSummaryCard
            key={config.id}
            config={config}
            requirements={requirementsByDomain[config.id]}
            isSelected={selectedDomain === config.id}
            onClick={() => setSelectedDomain(config.id)}
          />
        ))}
      </div>

      {/* Detail View for Selected Domain */}
      <DomainDetailView
        config={selectedConfig}
        requirements={requirementsByDomain[selectedDomain]}
        updateStatus={updateStatusByDomain[selectedDomain]}
        isUpdating={isUpdatingByDomain[selectedDomain]}
      />
    </div>
  );
}
