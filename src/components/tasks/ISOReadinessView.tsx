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
import { LockedDomainCard } from "@/components/iso-readiness/LockedDomainCard";
import { CertificationGoalBanner } from "@/components/iso-readiness/CertificationGoalBanner";
import { useSubscription, DOMAIN_ADDON_PRICES } from "@/hooks/useSubscription";
import { DomainActivationWizard } from "@/components/regulations/DomainActivationWizard";
import { cn } from "@/lib/utils";

interface DomainConfig {
  id: RequirementDomain;
  icon: React.ReactNode;
  iconComponent: typeof Shield;
  colorClass: string;
  bgClass: string;
  borderClass: string;
  selectedBorderClass: string;
}

const domainConfigs: DomainConfig[] = [
  {
    id: "privacy",
    icon: <Shield className="w-5 h-5" />,
    iconComponent: Shield,
    colorClass: "text-primary dark:text-primary",
    bgClass: "bg-primary/10 dark:bg-blue-950/30",
    borderClass: "border-primary/20 dark:border-primary",
    selectedBorderClass: "border-primary dark:border-primary ring-2 ring-primary/20"
  },
  {
    id: "security",
    icon: <Lock className="w-5 h-5" />,
    iconComponent: Lock,
    colorClass: "text-status-closed dark:text-status-closed",
    bgClass: "bg-status-closed/10 dark:bg-emerald-950/30",
    borderClass: "border-status-closed/20 dark:border-status-closed",
    selectedBorderClass: "border-status-closed dark:border-status-closed ring-2 ring-status-closed/20"
  },
  {
    id: "ai",
    icon: <Brain className="w-5 h-5" />,
    iconComponent: Brain,
    colorClass: "text-accent dark:text-accent",
    bgClass: "bg-accent/10 dark:bg-purple-950/30",
    borderClass: "border-accent/20 dark:border-accent",
    selectedBorderClass: "border-accent dark:border-accent ring-2 ring-accent/20"
  }
];

const DOMAIN_NAMES: Record<RequirementDomain, string> = {
  privacy: "Personvern",
  security: "Informasjonssikkerhet",
  ai: "AI Governance",
};

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
            <p className="text-[13px] font-medium text-muted-foreground mt-0.5">
              {standards.primary}
            </p>
            <p className="text-[13px] text-muted-foreground">
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
          <p className="text-[13px] font-medium text-muted-foreground">
            {t("isoReadiness.maturityLevel")}: {stats.maturityName}
          </p>
        </div>
      </CardHeader>
    </Card>
  );
}

export function ISOReadinessView() {
  const { t } = useTranslation();
  const { isDomainIncluded, activateAddon, isActivatingAddon } = useSubscription();
  const [selectedDomain, setSelectedDomain] = useState<RequirementDomain>("privacy");
  const [wizardDomain, setWizardDomain] = useState<RequirementDomain | null>(null);

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

  // Only count active domains for overall stats
  const activeDomains = domainConfigs.filter(c => isDomainIncluded(c.id));

  const overallStats = useMemo(() => {
    const activeReqs = activeDomains.flatMap(c => requirementsByDomain[c.id]);
    const total = activeReqs.length;
    const completed = activeReqs.filter(r => r.status === "completed").length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, percent };
  }, [activeDomains, requirementsByDomain]);

  const selectedIsActive = isDomainIncluded(selectedDomain);
  const selectedConfig = domainConfigs.find(c => c.id === selectedDomain)!;
  const selectedReqs = requirementsByDomain[selectedDomain];

  const handleOpenWizard = (domainId: RequirementDomain) => {
    setWizardDomain(domainId);
  };

  const handleActivate = () => {
    if (wizardDomain) {
      activateAddon(wizardDomain);
    }
  };

  const wizardConfig = wizardDomain ? domainConfigs.find(c => c.id === wizardDomain) : null;

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
      {/* Recommendation Banner */}
      <CertificationGoalBanner onActivateDomain={handleOpenWizard} />

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
        {domainConfigs.map(config => {
          const isActive = isDomainIncluded(config.id);

          if (!isActive) {
            return (
              <LockedDomainCard
                key={config.id}
                domainId={config.id}
                icon={config.icon}
                colorClass={config.colorClass}
                bgClass={config.bgClass}
                borderClass={config.borderClass}
                priceInOre={DOMAIN_ADDON_PRICES[config.id] || 0}
                onActivate={() => handleOpenWizard(config.id)}
              />
            );
          }

          return (
            <DomainSummaryCard
              key={config.id}
              config={config}
              requirements={requirementsByDomain[config.id]}
              isSelected={selectedDomain === config.id}
              onClick={() => setSelectedDomain(config.id)}
            />
          );
        })}
      </div>

      {/* Selected Domain Detail - only show for active domains */}
      {selectedIsActive && (
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
            <SLACategoryBreakdown requirements={selectedReqs} />
            <PhaseChecklist 
              requirements={selectedReqs}
              updateStatus={updateStatusByDomain[selectedDomain]}
              isUpdating={isUpdatingByDomain[selectedDomain]}
            />
          </CardContent>
        </Card>
      )}

      {/* Domain Activation Wizard */}
      {wizardConfig && (
        <DomainActivationWizard
          open={!!wizardDomain}
          onOpenChange={(open) => !open && setWizardDomain(null)}
          domainId={wizardDomain!}
          domainName={DOMAIN_NAMES[wizardDomain!]}
          domainIcon={wizardConfig.iconComponent}
          domainColor={wizardConfig.colorClass}
          domainBgColor={wizardConfig.bgClass}
          monthlyPrice={DOMAIN_ADDON_PRICES[wizardDomain!] || 0}
          onActivate={handleActivate}
          isActivating={isActivatingAddon}
        />
      )}
    </div>
  );
}
