import { useState, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Shield, Lock, Brain, Crown, ArrowRight, Gem } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sidebar } from "@/components/Sidebar";
import { CertificationJourney } from "@/components/iso-readiness/CertificationJourney";
import { CertificationGoalBanner } from "@/components/iso-readiness/CertificationGoalBanner";
import { SLACategoryBreakdown } from "@/components/iso-readiness/SLACategoryBreakdown";
import { PhaseChecklist } from "@/components/iso-readiness/PhaseChecklist";
import { useComplianceRequirements } from "@/hooks/useComplianceRequirements";
import { useSubscription, DOMAIN_ADDON_PRICES } from "@/hooks/useSubscription";
import { DomainActivationWizard } from "@/components/regulations/DomainActivationWizard";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { CoverageWidget } from "@/components/widgets/CoverageWidget";
import type { RequirementDomain } from "@/lib/complianceRequirementsData";

const frameworkToDomain: Record<string, RequirementDomain> = {
  "iso27001": "security",
  "gdpr": "privacy",
  "ai-act": "ai",
};

const frameworkConfig = {
  "iso27001": {
    id: "iso27001",
    name: "ISO 27001:2022",
    fullName: "ISO/IEC 27001:2022 Information Security",
    icon: Lock,
    color: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-500/10",
    iconComponent: Lock,
    domainColorClass: "text-emerald-600 dark:text-emerald-400",
    domainBgClass: "bg-emerald-50 dark:bg-emerald-950/30",
  },
  "gdpr": {
    id: "gdpr",
    name: "GDPR",
    fullName: "General Data Protection Regulation",
    icon: Shield,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-500/10",
    iconComponent: Shield,
    domainColorClass: "text-blue-600 dark:text-blue-400",
    domainBgClass: "bg-blue-50 dark:bg-blue-950/30",
  },
  "ai-act": {
    id: "ai-act",
    name: "EU AI Act",
    fullName: "EU Artificial Intelligence Act",
    icon: Brain,
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-500/10",
    iconComponent: Brain,
    domainColorClass: "text-purple-600 dark:text-purple-400",
    domainBgClass: "bg-purple-50 dark:bg-purple-950/30",
  }
};

type FrameworkId = keyof typeof frameworkConfig;

export default function ComplianceChecklist() {
  const { t, i18n } = useTranslation();
  const isNorwegian = i18n.language?.startsWith('nb') || i18n.language?.startsWith('no');
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isDomainIncluded, activateAddon, isActivatingAddon } = useSubscription();

  const frameworkParam = searchParams.get("framework") as FrameworkId || "iso27001";
  const [selectedFramework, setSelectedFramework] = useState<FrameworkId>(
    frameworkConfig[frameworkParam] ? frameworkParam : "iso27001"
  );
  const [wizardDomain, setWizardDomain] = useState<RequirementDomain | null>(null);

  const domain = frameworkToDomain[selectedFramework];
  const domainActive = isDomainIncluded(domain);
  const framework = frameworkConfig[selectedFramework];
  const Icon = framework.icon;

  const { requirements, isLoading, updateStatus, isUpdating } = useComplianceRequirements({
    domain,
  });

  const overallStats = useMemo(() => {
    const total = requirements.length;
    const completed = requirements.filter(r => r.status === "completed").length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, percent };
  }, [requirements]);

  const handleFrameworkChange = (value: string) => {
    const newFramework = value as FrameworkId;
    setSelectedFramework(newFramework);
    setSearchParams({ framework: newFramework });
  };

  const handleOpenWizard = (domainId: RequirementDomain) => {
    setWizardDomain(domainId);
  };

  const handleActivate = () => {
    if (wizardDomain) {
      activateAddon(wizardDomain);
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto p-6 max-w-7xl space-y-6">
          {/* Hero Section */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={cn("p-3 rounded-xl", framework.bgColor)}>
                <Icon className={cn("h-7 w-7", framework.color)} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                    {isNorwegian ? "ISO Readiness" : "ISO Readiness"}
                  </h1>
                  <Badge className="gap-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/20">
                    <Gem className="h-3 w-3" />
                    Premium
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {isNorwegian
                    ? "Strukturert vei til sertifisering – fra grunnlag til revisjon"
                    : "Structured path to certification – from foundation to audit"}
                </p>
              </div>
            </div>

            {/* Framework selector */}
            <Select value={selectedFramework} onValueChange={handleFrameworkChange}>
              <SelectTrigger className="w-[220px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="iso27001">
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4 text-emerald-500" />
                    ISO 27001:2022
                  </div>
                </SelectItem>
                <SelectItem value="gdpr">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-blue-500" />
                    GDPR
                  </div>
                </SelectItem>
                <SelectItem value="ai-act">
                  <div className="flex items-center gap-2">
                    <Brain className="h-4 w-4 text-purple-500" />
                    EU AI Act
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Certification Goal Banner */}
          <CertificationGoalBanner onActivateDomain={handleOpenWizard} />

          {/* Overall progress + Controls link */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="md:col-span-2">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-foreground">
                    {isNorwegian ? "Samlet fremdrift" : "Overall Progress"}
                  </h3>
                  <span className="text-2xl font-bold text-primary">{overallStats.percent}%</span>
                </div>
                <Progress value={overallStats.percent} className="h-2 mb-2" />
                <p className="text-xs text-muted-foreground">
                  {overallStats.completed}/{overallStats.total} {isNorwegian ? "krav fullført" : "requirements completed"}
                </p>
              </CardContent>
            </Card>

            {/* Controls Connection Card */}
            <Card className="border-primary/20 bg-gradient-to-br from-card to-primary/5 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => navigate("/controls")}
            >
              <CardContent className="pt-6 flex flex-col justify-between h-full">
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-1">
                    Mynder Controls
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {isNorwegian
                      ? "Alle kontroller administreres i Mynder Controls"
                      : "All controls are managed in Mynder Controls"}
                  </p>
                </div>
                <Button variant="link" className="p-0 h-auto mt-3 gap-1 text-primary justify-start">
                  {isNorwegian ? "Gå til kontroller" : "Go to controls"}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Certification Journey */}
          {domainActive && (
            <>
              <Card className="p-4">
                <CertificationJourney completedPercent={overallStats.percent} />
              </Card>

              {/* SLA Category Breakdown */}
              <SLACategoryBreakdown requirements={requirements} />

              {/* Phase Checklist (premium content) */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Icon className={cn("h-5 w-5", framework.color)} />
                    {framework.name} – {isNorwegian ? "Krav per fase" : "Requirements by Phase"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <PhaseChecklist
                    requirements={requirements}
                    updateStatus={updateStatus}
                    isUpdating={isUpdating}
                  />
                </CardContent>
              </Card>
            </>
          )}

          {/* Locked state when domain not active */}
          {!domainActive && !isLoading && (
            <Card className="border-dashed border-2 border-muted-foreground/20">
              <CardContent className="py-12 text-center">
                <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Crown className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {isNorwegian ? "Aktiver domenet for ISO Readiness" : "Activate domain for ISO Readiness"}
                </h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
                  {isNorwegian
                    ? `Få tilgang til sertifiseringsreisen, fasekontroller og detaljerte krav for ${framework.name}.`
                    : `Get access to the certification journey, phase controls and detailed requirements for ${framework.name}.`}
                </p>
                <Button onClick={() => handleOpenWizard(domain)} className="gap-2">
                  <Gem className="h-4 w-4" />
                  {isNorwegian ? "Aktiver nå" : "Activate now"}
                </Button>
              </CardContent>
            </Card>
          )}

          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          )}
        </div>
      </main>

      {/* Domain Activation Wizard */}
      {wizardDomain && (
        <DomainActivationWizard
          open={!!wizardDomain}
          onOpenChange={(open) => !open && setWizardDomain(null)}
          domainId={wizardDomain}
          domainName={framework.name}
          domainIcon={framework.iconComponent}
          domainColor={framework.domainColorClass}
          domainBgColor={framework.domainBgClass}
          monthlyPrice={DOMAIN_ADDON_PRICES[domain] || 0}
          onActivate={handleActivate}
          isActivating={isActivatingAddon}
        />
      )}
    </div>
  );
}
