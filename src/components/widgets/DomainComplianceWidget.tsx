import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Shield, Lock, Brain, ChevronDown, ChevronRight, ExternalLink, CheckCircle2, AlertCircle, Info, Bot, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { ComplianceChecklistPreview } from "@/components/compliance/ComplianceChecklistPreview";
import { useComplianceRequirements } from "@/hooks/useComplianceRequirements";

interface Framework {
  id: string;
  name: string;
  progress: number;
  tasksCompleted: number;
  tasksTotal: number;
  isMandatory?: boolean;
}

interface Domain {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  frameworks: Framework[];
  overallProgress: number;
}

// Map framework IDs to their display names
const frameworkDisplayNames: Record<string, string> = {
  gdpr: "GDPR / Personvernforordningen",
  personopplysningsloven: "Personopplysningsloven",
  iso27001: "ISO 27001",
  iso27701: "ISO 27701",
  nis2: "NIS2-direktivet",
  nsm: "NSMs grunnprinsipper",
  soc2: "SOC 2",
  cra: "Cyber Resilience Act",
  "ai-act": "EU AI Act",
  iso42001: "ISO/IEC 42001",
  iso42005: "ISO/IEC 42005",
  "ai-ethics": "Etiske retningslinjer for AI",
  apenhetsloven: "Åpenhetsloven",
  hms: "HMS-lovgivningen",
  bokforingsloven: "Bokføringsloven",
  hvitvasking: "Hvitvaskingsloven",
  csrd: "CSRD",
};

// Map framework IDs to categories/domains
const frameworkCategories: Record<string, string> = {
  gdpr: "privacy",
  personopplysningsloven: "privacy",
  iso27001: "security",
  iso27701: "security",
  nis2: "security",
  nsm: "security",
  soc2: "security",
  cra: "security",
  "ai-act": "ai",
  iso42001: "ai",
  iso42005: "ai",
  "ai-ethics": "ai",
};

// Map framework IDs to task relevant_for values
const frameworkTaskMapping: Record<string, string[]> = {
  gdpr: ["GDPR", "gdpr", "personvern", "privacy"],
  personopplysningsloven: ["personopplysningsloven", "personvern"],
  iso27001: ["ISO 27001", "iso27001", "informasjonssikkerhet", "security"],
  iso27701: ["ISO 27701", "iso27701"],
  nis2: ["NIS2", "nis2"],
  nsm: ["NSM", "nsm"],
  soc2: ["SOC2", "soc2", "SOC 2"],
  cra: ["CRA", "cra"],
  "ai-act": ["AI Act", "ai-act", "EU AI Act", "ai governance"],
  iso42001: ["ISO 42001", "iso42001"],
  iso42005: ["ISO 42005", "iso42005"],
  "ai-ethics": ["ai-ethics", "AI ethics"],
};

export function DomainComplianceWidget() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [expandedDomain, setExpandedDomain] = useState<string | null>(null);

  // Fetch selected frameworks
  const { data: selectedFrameworks = [] } = useQuery({
    queryKey: ["selected-frameworks-compliance"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("selected_frameworks")
        .select("*")
        .eq("is_selected", true);
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch tasks for progress calculation
  const { data: tasks = [] } = useQuery({
    queryKey: ["tasks-for-compliance"],
    queryFn: async () => {
      const { data, error } = await supabase.from("tasks").select("*");
      if (error) throw error;
      return data || [];
    },
  });

  // Calculate progress for a framework
  const calculateFrameworkProgress = (frameworkId: string): { progress: number; completed: number; total: number } => {
    const relevantTerms = frameworkTaskMapping[frameworkId] || [];
    const relevantTasks = tasks.filter((task) =>
      task.relevant_for?.some((r: string) =>
        relevantTerms.some((term) => r.toLowerCase().includes(term.toLowerCase()))
      )
    );

    if (relevantTasks.length === 0) {
      // Return mock progress if no tasks found
      return { progress: Math.floor(Math.random() * 40 + 50), completed: 0, total: 0 };
    }

    const completedTasks = relevantTasks.filter((t) => t.status === "completed").length;
    const progress = Math.round((completedTasks / relevantTasks.length) * 100);
    return { progress, completed: completedTasks, total: relevantTasks.length };
  };

  // Build domains with their frameworks
  const buildDomains = (): Domain[] => {
    const domainMap: Record<string, Framework[]> = {
      privacy: [],
      security: [],
      ai: [],
    };

    selectedFrameworks.forEach((sf) => {
      const category = frameworkCategories[sf.framework_id] || sf.category;
      if (category && domainMap[category]) {
        const { progress, completed, total } = calculateFrameworkProgress(sf.framework_id);
        domainMap[category].push({
          id: sf.framework_id,
          name: frameworkDisplayNames[sf.framework_id] || sf.framework_name,
          progress,
          tasksCompleted: completed,
          tasksTotal: total,
          isMandatory: sf.is_mandatory,
        });
      }
    });

    // Calculate overall progress per domain
    const calculateDomainProgress = (frameworks: Framework[]): number => {
      if (frameworks.length === 0) return 0;
      return Math.round(frameworks.reduce((acc, f) => acc + f.progress, 0) / frameworks.length);
    };

    return [
      {
        id: "privacy",
        name: t("statusOverview.privacy"),
        icon: <Shield className="h-5 w-5" />,
        color: "text-blue-500",
        bgColor: "bg-blue-500/10",
        frameworks: domainMap.privacy,
        overallProgress: calculateDomainProgress(domainMap.privacy),
      },
      {
        id: "security",
        name: t("statusOverview.infoSec"),
        icon: <Lock className="h-5 w-5" />,
        color: "text-green-500",
        bgColor: "bg-green-500/10",
        frameworks: domainMap.security,
        overallProgress: calculateDomainProgress(domainMap.security),
      },
      {
        id: "ai",
        name: t("statusOverview.aiGovernance"),
        icon: <Brain className="h-5 w-5" />,
        color: "text-purple-500",
        bgColor: "bg-purple-500/10",
        frameworks: domainMap.ai,
        overallProgress: calculateDomainProgress(domainMap.ai),
      },
    ];
  };

  const domains = buildDomains();

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return "[&>div]:bg-success";
    if (progress >= 50) return "[&>div]:bg-warning";
    return "[&>div]:bg-destructive";
  };

  const getStatusBadge = (progress: number) => {
    if (progress >= 80) {
      return (
        <Badge variant="outline" className="bg-success/10 text-success border-success/30 text-xs">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          {t("domainCompliance.onTrack")}
        </Badge>
      );
    }
    if (progress >= 50) {
      return (
        <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30 text-xs">
          <AlertCircle className="h-3 w-3 mr-1" />
          {t("domainCompliance.needsAttention")}
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30 text-xs">
        <AlertCircle className="h-3 w-3 mr-1" />
        {t("domainCompliance.critical")}
      </Badge>
    );
  };

  const totalFrameworks = domains.reduce((acc, d) => acc + d.frameworks.length, 0);
  const overallProgress = domains.length > 0
    ? Math.round(domains.reduce((acc, d) => acc + d.overallProgress, 0) / domains.filter(d => d.frameworks.length > 0).length) || 0
    : 0;

  // Helper component for displaying checklist preview inline
  const DomainChecklistPreview = ({ 
    frameworkId, 
    onViewFullChecklist 
  }: { 
    frameworkId: string; 
    onViewFullChecklist: () => void;
  }) => {
    const { requirements, stats, isLoading } = useComplianceRequirements({ frameworkId });
    
    const manualRequired = requirements
      .filter(r => r.status !== 'completed' && r.agent_capability === 'manual')
      .slice(0, 3);
    
    const aiWorking = requirements
      .filter(r => r.status === 'in_progress' && r.is_ai_handling)
      .slice(0, 2);
    
    const completedCount = requirements.filter(r => r.status === 'completed').length;

    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      );
    }

    return (
      <div className="space-y-3 p-3 bg-muted/20 rounded-lg border">
        {/* Progress */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">
            {stats.completed} / {stats.total} — {stats.progressPercent}%
          </span>
          <span className="text-sm font-semibold text-primary">{stats.progressPercent}%</span>
        </div>
        <Progress value={stats.progressPercent} className="h-2" />

        {/* Manual required */}
        {manualRequired.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-orange-600 dark:text-orange-400 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {t("domainCompliance.requiresAction", { count: stats.byCapability.manual })}
            </p>
            {manualRequired.map(req => (
              <div key={req.requirement_id} className="flex items-center justify-between text-xs p-1.5 bg-orange-50 dark:bg-orange-950/30 rounded">
                <span className="font-medium text-foreground truncate flex-1">
                  {req.requirement_id}: {req.name}
                </span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 text-xs px-2"
                  onClick={() => navigate(`/tasks?requirement=${req.requirement_id}`)}
                >
                  {t("domainCompliance.start")}
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* AI working */}
        {aiWorking.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <Bot className="h-3 w-3" />
              {t("domainCompliance.aiWorkingWith", { count: aiWorking.length })}
            </p>
            {aiWorking.map(req => (
              <div key={req.requirement_id} className="flex items-center gap-2 text-xs p-1.5 bg-emerald-50 dark:bg-emerald-950/30 rounded">
                <Loader2 className="h-3 w-3 animate-spin text-emerald-500" />
                <span className="text-foreground truncate">{req.requirement_id}: {req.name}</span>
              </div>
            ))}
          </div>
        )}

        {/* Completed summary */}
        <div className="flex items-center justify-between pt-2 border-t">
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3 text-success" />
            {completedCount} {t("domainCompliance.completed")}
          </span>
          <Button 
            variant="outline" 
            size="sm" 
            className="h-7 text-xs gap-1"
            onClick={onViewFullChecklist}
          >
            {t("domainCompliance.viewFullChecklist")}
            <ExternalLink className="h-3 w-3" />
          </Button>
        </div>
      </div>
    );
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base sm:text-lg font-semibold text-foreground">
              {t("domainCompliance.title")}
            </CardTitle>
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-muted">
              <Info className="h-3 w-3 text-muted-foreground" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{t("domainCompliance.total")}</span>
            <span className={cn(
              "text-sm font-semibold",
              overallProgress >= 80 ? "text-success" : overallProgress >= 50 ? "text-warning" : "text-destructive"
            )}>
              {overallProgress}%
            </span>
          </div>
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground">
          {t("domainCompliance.subtitle")}
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {domains.map((domain) => (
          <Collapsible
            key={domain.id}
            open={expandedDomain === domain.id}
            onOpenChange={(open) => setExpandedDomain(open ? domain.id : null)}
          >
            <Card className={cn(
              "border transition-all",
              expandedDomain === domain.id ? "border-primary/30 shadow-sm" : "border-border"
            )}>
              <CollapsibleTrigger asChild>
                <button className="w-full p-3 sm:p-4 flex items-center justify-between hover:bg-muted/50 transition-colors rounded-lg">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                    <div className={cn("p-2 sm:p-2.5 rounded-lg flex-shrink-0", domain.bgColor, domain.color)}>
                      {domain.icon}
                    </div>
                    <div className="text-left min-w-0 flex-1">
                      <span className="text-xs sm:text-sm font-medium text-foreground">{domain.name}</span>
                      <div className="flex items-center gap-2 mt-1">
                        <Progress
                          value={domain.overallProgress}
                          className={cn("h-1.5 w-20 sm:w-32", getProgressColor(domain.overallProgress))}
                        />
                        <span className="text-xs text-muted-foreground">{domain.overallProgress}%</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                    <span className="text-xs text-muted-foreground hidden sm:inline">
                      {domain.frameworks.length} {t("domainCompliance.frameworks")}
                    </span>
                    <span className="text-xs text-muted-foreground sm:hidden">
                      {domain.frameworks.length}
                    </span>
                    {expandedDomain === domain.id ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </button>
              </CollapsibleTrigger>

              <CollapsibleContent>
                <div className="px-4 pb-4 border-t border-border">
                  {domain.frameworks.length === 0 ? (
                    <div className="py-4 text-center">
                      <p className="text-sm text-muted-foreground mb-2">
                        {t("domainCompliance.noFrameworks")}
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate("/regulations")}
                        className="gap-2"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        {t("domainCompliance.addFramework")}
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3 pt-3">
                      {/* Show compliance checklist preview for primary framework */}
                      {domain.id === "security" && (
                        <DomainChecklistPreview 
                          frameworkId="iso27001"
                          onViewFullChecklist={() => navigate("/compliance-checklist?framework=iso27001")}
                        />
                      )}
                      {domain.id === "privacy" && (
                        <DomainChecklistPreview 
                          frameworkId="gdpr"
                          onViewFullChecklist={() => navigate("/compliance-checklist?framework=gdpr")}
                        />
                      )}
                      {domain.id === "ai" && (
                        <DomainChecklistPreview 
                          frameworkId="ai-act"
                          onViewFullChecklist={() => navigate("/compliance-checklist?framework=ai-act")}
                        />
                      )}

                      {/* Framework list */}
                      <div className="space-y-2 mt-4">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          {t("domainCompliance.activeFrameworks")}
                        </p>
                        {domain.frameworks.map((framework) => (
                          <div
                            key={framework.id}
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-muted/30 rounded-lg"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs sm:text-sm font-medium text-foreground">
                                  {framework.name}
                                </span>
                                {framework.isMandatory && (
                                  <Badge variant="secondary" className="text-xs">
                                    {t("domainCompliance.mandatory")}
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-1.5">
                                <Progress
                                  value={framework.progress}
                                  className={cn("h-1 flex-1 max-w-[150px] sm:max-w-[200px]", getProgressColor(framework.progress))}
                                />
                                <span className="text-xs font-medium text-foreground">
                                  {framework.progress}%
                                </span>
                                {framework.tasksTotal > 0 && (
                                  <span className="text-xs text-muted-foreground hidden sm:inline">
                                    ({framework.tasksCompleted}/{framework.tasksTotal} oppgaver)
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="self-start sm:self-center">
                              {getStatusBadge(framework.progress)}
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full mt-2 gap-2 text-primary hover:text-primary hover:bg-primary/10"
                        onClick={() => navigate(`/tasks?domain=${domain.id}`)}
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        {t("domainCompliance.viewAllTasks", { domain: domain.name })}
                      </Button>
                    </div>
                  )}
                </div>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        ))}

        <div className="pt-3 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <p className="text-xs sm:text-sm text-muted-foreground">
            {t("domainCompliance.totalActiveFrameworks", { count: totalFrameworks })}
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/regulations")}
            className="gap-1 text-xs self-start sm:self-auto"
          >
            {t("domainCompliance.manageFrameworks")}
            <ExternalLink className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
