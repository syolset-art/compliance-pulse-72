import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Map,
  ChevronRight,
  ShieldCheck,
  FileWarning,
  ClipboardList,
  AlertTriangle,
  CheckCircle2,
  Server,
  Shield,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useComplianceRequirements } from "@/hooks/useComplianceRequirements";
import {
  CERTIFICATION_PHASES,
  getPhaseStatus,
  type CertificationPhase,
} from "@/lib/certificationPhases";
import { getVisiblePhases, getGovernanceLevelDef, type GovernanceLevel } from "@/lib/governanceLevelEngine";
import { ComplianceCalendarSection } from "./ComplianceCalendarSection";

interface NextAction {
  id: string;
  title_no: string;
  title_en: string;
  description_no: string;
  description_en: string;
  route: string;
  icon: React.ElementType;
  phase: CertificationPhase;
}

export function PostOnboardingRoadmapWidget() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const { stats, grouped } = useComplianceRequirements({});
  const isNorwegian = i18n.language === "nb" || i18n.language === "no";

  // Fetch company profile including governance_level
  const { data: companyProfile } = useQuery({
    queryKey: ["company-profile-governance"],
    queryFn: async () => {
      const { data } = await supabase
        .from("company_profile")
        .select("is_msp_partner, governance_level")
        .limit(1)
        .maybeSingle();
      return data as { is_msp_partner: boolean; governance_level: string | null } | null;
    },
  });
  const isMSPCustomer = companyProfile?.is_msp_partner === true;
  const govLevel = (companyProfile?.governance_level || null) as GovernanceLevel | null;
  const govLevelDef = getGovernanceLevelDef(govLevel);
  const visiblePhaseIds = useMemo(() => getVisiblePhases(govLevel), [govLevel]);
  const filteredPhases = useMemo(() => CERTIFICATION_PHASES.filter(p => visiblePhaseIds.includes(p.id)), [visiblePhaseIds]);
  const completionPercent = stats.progressPercent;

  // Determine current phase based on visible phases
  const currentPhase = useMemo(() => {
    for (const phase of filteredPhases) {
      const status = getPhaseStatus(phase.id, completionPercent);
      if (status === "in_progress") return phase;
      if (status === "not_started") return phase;
    }
    return filteredPhases[filteredPhases.length - 1];
  }, [completionPercent, filteredPhases]);

  // Build dynamic next actions
  const nextActions = useMemo((): NextAction[] => {
    const actions: NextAction[] = [];

    // 1. Critical manual requirements not started
    const criticalManual = grouped.incompleteManual
      .filter((r) => r.priority === "critical" || r.priority === "high")
      .slice(0, 2);

    for (const req of criticalManual) {
      actions.push({
        id: `req-${req.requirement_id}`,
        title_no: req.name_no || req.name,
        title_en: req.name,
        description_no: req.description_no || req.description || "",
        description_en: req.description || "",
        route: "/compliance-checklist",
        icon: ClipboardList,
        phase: "implementation",
      });
    }

    // 2. If few requirements done, suggest gap analysis
    if (stats.completed < 5 && actions.length < 3) {
      actions.push({
        id: "gap-analysis",
        title_no: "Fullfør gap-analyse",
        title_en: "Complete gap analysis",
        description_no: "Gå gjennom samsvarskrav for å identifisere mangler",
        description_en: "Review compliance requirements to identify gaps",
        route: "/compliance-checklist",
        icon: FileWarning,
        phase: "foundation",
      });
    }

    // 3. Suggest risk assessment
    if (completionPercent < 40 && actions.length < 3) {
      actions.push({
        id: "risk-assessment",
        title_no: "Gjennomfør risikovurdering",
        title_en: "Conduct risk assessment",
        description_no: "Vurder og score risiko på dine systemer",
        description_en: "Assess and score risk on your systems",
        route: "/tasks?view=readiness",
        icon: AlertTriangle,
        phase: "implementation",
      });
    }

    // 4. Vendor documentation
    if (actions.length < 3) {
      actions.push({
        id: "vendor-docs",
        title_no: "Dokumenter leverandører",
        title_en: "Document vendors",
        description_no: "Sørg for at alle leverandører har nødvendige dokumenter",
        description_en: "Ensure all vendors have required documentation",
        route: "/assets",
        icon: ShieldCheck,
        phase: "operation",
      });
    }

    // 4. MSP-specific: Acronis and backup verification
    if (isMSPCustomer && actions.length < 3) {
      actions.push({
        id: "acronis-connect",
        title_no: "Koble til Acronis",
        title_en: "Connect to Acronis",
        description_no: "Importer enheter og backup-status fra Acronis",
        description_en: "Import devices and backup status from Acronis",
        route: "/assets",
        icon: Server,
        phase: "implementation",
      });
    }

    if (isMSPCustomer && actions.length < 3) {
      actions.push({
        id: "verify-backup",
        title_no: "Verifiser backup-rutiner",
        title_en: "Verify backup routines",
        description_no: "Gå gjennom backup-testing med din IT-partner",
        description_en: "Review backup testing with your IT partner",
        route: "/compliance-checklist",
        icon: Shield,
        phase: "implementation",
      });
    }

    return actions.slice(0, 3);
  }, [grouped.incompleteManual, stats.completed, completionPercent, isMSPCustomer]);

  return (
    <Card className="mb-8 border-primary/20 bg-gradient-to-br from-card via-card to-primary/5 shadow-lg overflow-hidden">
      <CardContent className="p-0">
        {/* Header */}
        <div className="p-6 pb-4">
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
              <Map className="h-5 w-5 text-primary" />
            </div>
            <div>
            <h3 className="text-lg font-semibold text-foreground">
                {isNorwegian ? "Din compliance-prosess" : "Your compliance process"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {isNorwegian
                  ? `Modenhetsnivå: ${currentPhase.name_no}`
                  : `Maturity level: ${currentPhase.name_en}`}
              </p>
            </div>
          </div>
        </div>

        {/* Governance Level Banner */}
        {govLevelDef && (
          <div className="px-6 pb-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/15">
              <div className="p-1.5 rounded-md bg-primary/10">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">
                  {isNorwegian ? govLevelDef.name_no : govLevelDef.name_en}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {isNorwegian ? govLevelDef.description_no : govLevelDef.description_en}
                </p>
              </div>
              <Badge variant="outline" className="text-[10px] shrink-0 border-primary/30 text-primary">
                {isNorwegian ? "Ditt nivå" : "Your level"}
              </Badge>
            </div>
          </div>
        )}

        {/* Phase stepper */}
        <div className="px-6 pb-4">
          <div className="flex items-center gap-1 mb-2">
            {filteredPhases.map((phase) => {
              const status = getPhaseStatus(phase.id, completionPercent);
              return (
                <div key={phase.id} className="flex items-center flex-1">
                  <div
                    className={cn(
                      "h-2 w-full rounded-full transition-colors",
                      phase.optional ? "border border-dashed border-muted-foreground/30" : "",
                      status === "completed"
                        ? "bg-primary"
                        : status === "in_progress"
                        ? "bg-primary/40"
                        : "bg-muted/50"
                    )}
                  />
                </div>
              );
            })}
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground">
            {filteredPhases.map((phase) => (
              <span key={phase.id} className={cn("text-center flex-1 truncate", phase.optional && "opacity-50")}>
                {isNorwegian ? phase.name_no : phase.name_en}
              </span>
            ))}
          </div>
        </div>

        {/* Progress summary */}
        <div className="px-6 pb-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <Progress value={completionPercent} className="h-2 bg-muted/50" />
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-foreground whitespace-nowrap">
                {stats.completed}/{stats.total}
              </span>
            </div>
          </div>
        </div>

        {/* Next actions */}
        <div className="px-6 pb-4">
          <p className="text-xs font-medium uppercase tracking-wider text-primary mb-3">
            {isNorwegian ? "Neste prioriterte handlinger" : "Next priority actions"}
          </p>
          <div className="space-y-2">
            {nextActions.map((action) => {
              const Icon = action.icon;
              const phaseDef = CERTIFICATION_PHASES.find((p) => p.id === action.phase);
              return (
                <button
                  key={action.id}
                  onClick={() => navigate(action.route)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/30 hover:bg-primary/5 transition-all text-left group"
                >
                  <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate">
                      {isNorwegian ? action.title_no : action.title_en}
                    </h4>
                    <p className="text-xs text-muted-foreground truncate">
                      {isNorwegian ? action.description_no : action.description_en}
                    </p>
                  </div>
                  {phaseDef && (
                    <Badge variant="outline" className="text-[10px] shrink-0">
                      {isNorwegian ? phaseDef.name_no : phaseDef.name_en}
                    </Badge>
                  )}
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Calendar section */}
        <div className="px-6 pb-6">
          <ComplianceCalendarSection />
        </div>
      </CardContent>
    </Card>
  );
}
