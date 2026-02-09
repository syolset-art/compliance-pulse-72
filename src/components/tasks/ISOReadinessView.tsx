import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Shield, Lock, Brain, ChevronDown, CheckCircle2, Clock, Circle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useComplianceRequirements, type RequirementWithStatus } from "@/hooks/useComplianceRequirements";
import type { RequirementDomain } from "@/lib/complianceRequirementsData";
import { cn } from "@/lib/utils";

interface DomainConfig {
  id: RequirementDomain;
  icon: React.ReactNode;
  colorClass: string;
  bgClass: string;
  borderClass: string;
}

const domainConfigs: DomainConfig[] = [
  {
    id: "privacy",
    icon: <Shield className="w-5 h-5" />,
    colorClass: "text-blue-600 dark:text-blue-400",
    bgClass: "bg-blue-50 dark:bg-blue-950/30",
    borderClass: "border-blue-200 dark:border-blue-800"
  },
  {
    id: "security",
    icon: <Lock className="w-5 h-5" />,
    colorClass: "text-emerald-600 dark:text-emerald-400",
    bgClass: "bg-emerald-50 dark:bg-emerald-950/30",
    borderClass: "border-emerald-200 dark:border-emerald-800"
  },
  {
    id: "ai",
    icon: <Brain className="w-5 h-5" />,
    colorClass: "text-purple-600 dark:text-purple-400",
    bgClass: "bg-purple-50 dark:bg-purple-950/30",
    borderClass: "border-purple-200 dark:border-purple-800"
  }
];

interface DomainCardProps {
  config: DomainConfig;
  requirements: RequirementWithStatus[];
  isExpanded: boolean;
  onToggle: () => void;
}

function DomainCard({ config, requirements, isExpanded, onToggle }: DomainCardProps) {
  const { t, i18n } = useTranslation();
  const isNorwegian = i18n.language === "nb";

  const stats = useMemo(() => {
    const total = requirements.length;
    const completed = requirements.filter(r => r.status === "completed").length;
    const inProgress = requirements.filter(r => r.status === "in_progress").length;
    const notStarted = requirements.filter(r => r.status === "not_started").length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, inProgress, notStarted, percent };
  }, [requirements]);

  const groupedRequirements = useMemo(() => ({
    completed: requirements.filter(r => r.status === "completed"),
    inProgress: requirements.filter(r => r.status === "in_progress"),
    notStarted: requirements.filter(r => r.status === "not_started")
  }), [requirements]);

  const getName = (req: RequirementWithStatus) => 
    isNorwegian && req.name_no ? req.name_no : req.name;

  return (
    <Card className={cn("transition-all", config.borderClass)}>
      <CardHeader className={cn("pb-3", config.bgClass)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn("p-2 rounded-lg", config.bgClass, config.colorClass)}>
              {config.icon}
            </div>
            <div>
              <CardTitle className="text-lg">
                {t(`tasks.readiness.domains.${config.id}`)}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {stats.completed}/{stats.total} {t("tasks.readiness.requirements")}
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className={cn("text-2xl font-bold", config.colorClass)}>
              {stats.percent}%
            </span>
          </div>
        </div>
        <Progress value={stats.percent} className="h-2 mt-3" />
      </CardHeader>
      <CardContent className="pt-4">
        <div className="flex items-center gap-4 text-sm mb-4">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>{stats.completed} {t("tasks.readiness.completed")}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-amber-500" />
            <span>{stats.inProgress} {t("tasks.readiness.inProgress")}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Circle className="w-4 h-4 text-muted-foreground" />
            <span>{stats.notStarted} {t("tasks.readiness.remaining")}</span>
          </div>
        </div>

        <Collapsible open={isExpanded} onOpenChange={onToggle}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full justify-between">
              {isExpanded ? t("tasks.readiness.hideDetails") : t("tasks.readiness.viewDetails")}
              <ChevronDown className={cn(
                "w-4 h-4 transition-transform",
                isExpanded && "rotate-180"
              )} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-4 space-y-4">
            {/* Completed */}
            {groupedRequirements.completed.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                    {t("tasks.readiness.completed")} ({groupedRequirements.completed.length})
                  </span>
                </div>
                <ul className="space-y-1 ml-6">
                  {groupedRequirements.completed.slice(0, 5).map(req => (
                    <li key={`${req.framework_id}-${req.requirement_id}`} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-xs text-muted-foreground/70 min-w-[80px]">{req.requirement_id}</span>
                      <span>{getName(req)}</span>
                    </li>
                  ))}
                  {groupedRequirements.completed.length > 5 && (
                    <li className="text-xs text-muted-foreground">
                      +{groupedRequirements.completed.length - 5} {t("tasks.readiness.more")}
                    </li>
                  )}
                </ul>
              </div>
            )}

            {/* In Progress */}
            {groupedRequirements.inProgress.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-amber-500" />
                  <span className="text-sm font-medium text-amber-600 dark:text-amber-400">
                    {t("tasks.readiness.inProgress")} ({groupedRequirements.inProgress.length})
                  </span>
                </div>
                <ul className="space-y-1 ml-6">
                  {groupedRequirements.inProgress.map(req => (
                    <li key={`${req.framework_id}-${req.requirement_id}`} className="text-sm text-foreground flex items-start gap-2">
                      <span className="text-xs text-muted-foreground/70 min-w-[80px]">{req.requirement_id}</span>
                      <span>{getName(req)}</span>
                      {req.progress_percent > 0 && (
                        <Badge variant="secondary" className="text-xs ml-auto">
                          {req.progress_percent}%
                        </Badge>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Not Started */}
            {groupedRequirements.notStarted.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Circle className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">
                    {t("tasks.readiness.remaining")} ({groupedRequirements.notStarted.length})
                  </span>
                </div>
                <ul className="space-y-1 ml-6">
                  {groupedRequirements.notStarted.slice(0, 5).map(req => (
                    <li key={`${req.framework_id}-${req.requirement_id}`} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-xs text-muted-foreground/70 min-w-[80px]">{req.requirement_id}</span>
                      <span>{getName(req)}</span>
                    </li>
                  ))}
                  {groupedRequirements.notStarted.length > 5 && (
                    <li className="text-xs text-muted-foreground">
                      +{groupedRequirements.notStarted.length - 5} {t("tasks.readiness.more")}
                    </li>
                  )}
                </ul>
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}

export function ISOReadinessView() {
  const { t } = useTranslation();
  const [expandedDomains, setExpandedDomains] = useState<Set<RequirementDomain>>(new Set());

  // Fetch requirements for each domain
  const { requirements: privacyReqs, isLoading: privacyLoading } = useComplianceRequirements({ domain: "privacy" });
  const { requirements: securityReqs, isLoading: securityLoading } = useComplianceRequirements({ domain: "security" });
  const { requirements: aiReqs, isLoading: aiLoading } = useComplianceRequirements({ domain: "ai" });

  const isLoading = privacyLoading || securityLoading || aiLoading;

  const requirementsByDomain: Record<RequirementDomain, RequirementWithStatus[]> = {
    privacy: privacyReqs,
    security: securityReqs,
    ai: aiReqs
  };

  const toggleDomain = (domain: RequirementDomain) => {
    setExpandedDomains(prev => {
      const next = new Set(prev);
      if (next.has(domain)) {
        next.delete(domain);
      } else {
        next.add(domain);
      }
      return next;
    });
  };

  // Calculate overall stats
  const overallStats = useMemo(() => {
    const allReqs = [...privacyReqs, ...securityReqs, ...aiReqs];
    const total = allReqs.length;
    const completed = allReqs.filter(r => r.status === "completed").length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, percent };
  }, [privacyReqs, securityReqs, aiReqs]);

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

      {/* Domain Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {domainConfigs.map(config => (
          <DomainCard
            key={config.id}
            config={config}
            requirements={requirementsByDomain[config.id]}
            isExpanded={expandedDomains.has(config.id)}
            onToggle={() => toggleDomain(config.id)}
          />
        ))}
      </div>
    </div>
  );
}
