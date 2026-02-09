import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Shield, Lock, Brain } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useComplianceRequirements, type RequirementWithStatus } from "@/hooks/useComplianceRequirements";
import type { RequirementDomain } from "@/lib/complianceRequirementsData";
import { DOMAIN_STANDARDS, getMaturityLevel, MATURITY_LEVELS } from "@/lib/certificationPhases";
import { CertificationJourney } from "@/components/iso-readiness/CertificationJourney";
import { SLACategoryBreakdown } from "@/components/iso-readiness/SLACategoryBreakdown";
import { PhaseChecklist } from "@/components/iso-readiness/PhaseChecklist";
import { cn } from "@/lib/utils";

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

function DomainSummaryCard({ 
  config, requirements, isSelected, onClick 
}: { 
  config: DomainConfig; requirements: RequirementWithStatus[]; isSelected: boolean; onClick: () => void; 
}) {
  const { t, i18n } = useTranslation();
  const isNorwegian = i18n.language === "nb";

  const stats = useMemo(() => {
    const total = requirements.length;
    const completed = requirements.filter(r => r.status === "completed").length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    const maturity = getMaturityLevel(percent);
    const maturityInfo = MATURITY_LEVELS.find(m => m.level === maturity);
    return { total, completed, percent, maturityName: maturityInfo ? (isNorwegian ? maturityInfo.name_no : maturityInfo.name_en) : '' };
  }, [requirements, isNorwegian]);

  const standards = DOMAIN_STANDARDS[config.id];

  return (
    <Card 
      className={cn("cursor-pointer transition-all hover:shadow-md", isSelected ? config.selectedBorderClass : config.borderClass)}
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
            <p className="text-[10px] font-medium text-muted-foreground mt-0.5">
              {standards.primary}
            </p>
            <p className="text-[10px] text-muted-foreground">
              + {standards.supporting.join(', ')}
            </p>
          </div>
          <div className="text-right">
            <span className={cn("text-xl font-bold", config.colorClass)}>{stats.percent}%</span>
          </div>
        </div>
        <Progress value={stats.percent} className="h-1.5 mt-2" />
        <div className="flex items-center justify-between mt-1">
          <p className="text-xs text-muted-foreground">
            {stats.completed}/{stats.total} {t("tasks.readiness.requirements")}
          </p>
          <p className="text-[10px] font-medium text-muted-foreground">
            {t("isoReadiness.maturityLevel")}: {stats.maturityName}
          </p>
        </div>
      </CardHeader>
    </Card>
  );
}

export function ISOReadinessView() {
  const { t } = useTranslation();
  const [selectedDomain, setSelectedDomain] = useState<RequirementDomain>("privacy");

  const { requirements: privacyReqs, isLoading: privacyLoading, updateStatus: updatePrivacy, isUpdating: updatingPrivacy } = useComplianceRequirements({ domain: "privacy" });
  const { requirements: securityReqs, isLoading: securityLoading, updateStatus: updateSecurity, isUpdating: updatingSecurity } = useComplianceRequirements({ domain: "security" });
  const { requirements: aiReqs, isLoading: aiLoading, updateStatus: updateAI, isUpdating: updatingAI } = useComplianceRequirements({ domain: "ai" });

  const isLoading = privacyLoading || securityLoading || aiLoading;

  const requirementsByDomain: Record<RequirementDomain, RequirementWithStatus[]> = {
    privacy: privacyReqs, security: securityReqs, ai: aiReqs
  };

  const updateStatusByDomain: Record<RequirementDomain, typeof updatePrivacy> = {
    privacy: updatePrivacy, security: updateSecurity, ai: updateAI
  };

  const isUpdatingByDomain: Record<RequirementDomain, boolean> = {
    privacy: updatingPrivacy, security: updatingSecurity, ai: updatingAI
  };

  const overallStats = useMemo(() => {
    const allReqs = [...privacyReqs, ...securityReqs, ...aiReqs];
    const total = allReqs.length;
    const completed = allReqs.filter(r => r.status === "completed").length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, percent };
  }, [privacyReqs, securityReqs, aiReqs]);

  const selectedConfig = domainConfigs.find(c => c.id === selectedDomain)!;
  const selectedReqs = requirementsByDomain[selectedDomain];

  const domainStats = useMemo(() => {
    const completed = selectedReqs.filter(r => r.status === 'completed').length;
    const total = selectedReqs.length;
    return { percent: total > 0 ? Math.round((completed / total) * 100) : 0 };
  }, [selectedReqs]);

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
          <h2 className="text-xl font-semibold">{t("isoReadiness.journey.title")}</h2>
          <p className="text-sm text-muted-foreground">{t("isoReadiness.journey.subtitle")}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">{t("tasks.overallCompliance")}</p>
          <p className="text-2xl font-bold text-primary">{overallStats.percent}%</p>
          <p className="text-xs text-muted-foreground">
            {overallStats.completed}/{overallStats.total} {t("tasks.readiness.requirements")}
          </p>
        </div>
      </div>

      {/* Certification Journey Stepper */}
      <Card className="p-4">
        <CertificationJourney completedPercent={overallStats.percent} />
      </Card>

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

      {/* Selected Domain Detail */}
      <Card className={cn("", selectedConfig.borderClass)}>
        <CardHeader className={selectedConfig.bgClass}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn("p-2 rounded-lg", selectedConfig.colorClass)}>
                {selectedConfig.icon}
              </div>
              <div>
                <CardTitle className="text-lg">
                  {t(`tasks.readiness.domains.${selectedDomain}`)} – {DOMAIN_STANDARDS[selectedDomain].primary}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  + {DOMAIN_STANDARDS[selectedDomain].supporting.join(', ')}
                </p>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          {/* SLA Category Breakdown */}
          <SLACategoryBreakdown requirements={selectedReqs} />

          {/* Phase Checklist */}
          <PhaseChecklist 
            requirements={selectedReqs}
            updateStatus={updateStatusByDomain[selectedDomain]}
            isUpdating={isUpdatingByDomain[selectedDomain]}
          />
        </CardContent>
      </Card>
    </div>
  );
}
