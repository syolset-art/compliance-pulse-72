import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Bot, Building2, AlertTriangle, CheckCircle2, Users, BarChart3 } from "lucide-react";
import type { AISystem } from "@/hooks/useAISystemRegistry";

interface AISystemCardProps {
  system: AISystem;
  onClick: () => void;
}

const RISK_COLORS: Record<string, string> = {
  unacceptable: "bg-destructive text-destructive-foreground",
  high: "bg-warning text-white",
  limited: "bg-warning text-black",
  minimal: "bg-status-closed text-white",
  not_assessed: "bg-muted text-muted-foreground",
};

const RISK_LABELS: Record<string, string> = {
  unacceptable: "Uakseptabel",
  high: "Høyrisiko",
  limited: "Begrenset",
  minimal: "Minimal",
  not_assessed: "Ikke vurdert",
};

const COMPLIANCE_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  compliant: { label: "Compliant", variant: "default" },
  partial: { label: "Delvis", variant: "secondary" },
  non_compliant: { label: "Ikke compliant", variant: "destructive" },
  not_assessed: { label: "Ikke vurdert", variant: "outline" },
};

export function AISystemCard({ system, onClick }: AISystemCardProps) {
  const riskCategory = system.risk_category || "not_assessed";
  const complianceStatus = system.compliance_status || "not_assessed";
  const complianceConfig = COMPLIANCE_CONFIG[complianceStatus] || COMPLIANCE_CONFIG.not_assessed;
  
  const useCases = Array.isArray(system.use_cases) ? system.use_cases : [];
  const affectedPersons = Array.isArray(system.affected_persons) ? system.affected_persons : [];

  const isHighRisk = riskCategory === "high" || riskCategory === "unacceptable";
  const hasMissingInfo = !system.transparency_measures || complianceStatus === "not_assessed";

  return (
    <Card 
      className={`cursor-pointer transition-all hover:shadow-md ${
        isHighRisk ? "border-warning/20 dark:border-warning/50" : ""
      }`}
      onClick={onClick}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${RISK_COLORS[riskCategory].split(" ")[0]}`} />
            <div>
              <h3 className="font-semibold text-lg">{system.name}</h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Building2 className="h-3.5 w-3.5" />
                <span>{system.provider || "Ukjent leverandør"}</span>
              </div>
            </div>
          </div>
          <Badge className={RISK_COLORS[riskCategory]}>
            {RISK_LABELS[riskCategory]}
          </Badge>
        </div>

        {/* Metrics row */}
        <div className="grid grid-cols-3 gap-4 py-3 border-y border-border mb-3">
          <div className="text-center">
            <p className="text-xl font-bold">{system.decisions_per_month || 0}</p>
            <p className="text-xs text-muted-foreground">beslut./mnd</p>
          </div>
          <div className="text-center border-x border-border">
            <p className="text-xl font-bold">{system.estimated_affected_persons || 0}</p>
            <p className="text-xs text-muted-foreground">berørte</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold">{system.override_rate_percent || 0}%</p>
            <p className="text-xs text-muted-foreground">override</p>
          </div>
        </div>

        {/* Use cases */}
        {useCases.length > 0 && (
          <div className="mb-3">
            <p className="text-xs text-muted-foreground mb-1.5">Bruksområder:</p>
            <div className="flex flex-wrap gap-1">
              {useCases.slice(0, 3).map((useCase, idx) => (
                <Badge key={idx} variant="outline" className="text-xs">
                  {useCase as string}
                </Badge>
              ))}
              {useCases.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{useCases.length - 3} flere
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant={complianceConfig.variant}>{complianceConfig.label}</Badge>
            {hasMissingInfo && (
              <div className="flex items-center gap-1 text-xs text-warning dark:text-warning">
                <AlertTriangle className="h-3 w-3" />
                <span>Mangler info</span>
              </div>
            )}
          </div>
          <Button variant="ghost" size="sm" className="text-primary">
            Se detaljer
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
