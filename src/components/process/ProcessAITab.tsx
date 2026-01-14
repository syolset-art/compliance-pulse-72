import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Bot,
  Shield,
  Eye,
  Users,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Edit2,
  FileText,
} from "lucide-react";
import { ProcessAIDialog } from "./ProcessAIDialog";

interface ProcessAITabProps {
  processId: string;
  processName: string;
  processDescription?: string;
  workAreaId?: string;
  systemId?: string;
}

export const ProcessAITab = ({
  processId,
  processName,
  processDescription,
  workAreaId,
  systemId,
}: ProcessAITabProps) => {
  const { t } = useTranslation();
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: aiUsage, isLoading } = useQuery({
    queryKey: ["process-ai-usage", processId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("process_ai_usage")
        .select("*")
        .eq("process_id", processId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const getRiskBadgeVariant = (risk: string | null) => {
    switch (risk) {
      case "unacceptable":
        return "destructive";
      case "high":
        return "destructive";
      case "limited":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getRiskLabel = (risk: string | null) => {
    switch (risk) {
      case "unacceptable":
        return t("processAI.riskUnacceptable", "Uakseptabel");
      case "high":
        return t("processAI.riskHigh", "Høy");
      case "limited":
        return t("processAI.riskLimited", "Begrenset");
      case "minimal":
        return t("processAI.riskMinimal", "Minimal");
      default:
        return t("processAI.notAssessed", "Ikke vurdert");
    }
  };

  const getComplianceColor = (status: string | null) => {
    switch (status) {
      case "compliant":
        return "text-green-600";
      case "partial":
        return "text-yellow-600";
      case "non_compliant":
        return "text-red-600";
      default:
        return "text-muted-foreground";
    }
  };

  const getComplianceIcon = (status: string | null) => {
    switch (status) {
      case "compliant":
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case "partial":
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case "non_compliant":
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      default:
        return <FileText className="h-5 w-5 text-muted-foreground" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // No AI usage documented yet
  if (!aiUsage) {
    return (
      <div className="space-y-6">
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Bot className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {t("processAI.notDocumented", "AI-bruk ikke dokumentert")}
            </h3>
            <p className="text-sm text-muted-foreground text-center max-w-md mb-6">
              {t(
                "processAI.notDocumentedDescription",
                "Dokumenter om denne prosessen bruker AI for å sikre compliance med AI Act."
              )}
            </p>
            <Button onClick={() => setDialogOpen(true)}>
              <Bot className="h-4 w-4 mr-2" />
              {t("processAI.startDocumentation", "Dokumenter AI-bruk")}
            </Button>
          </CardContent>
        </Card>

        <ProcessAIDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          processId={processId}
          processName={processName}
          processDescription={processDescription}
          workAreaId={workAreaId}
          systemId={systemId}
        />
      </div>
    );
  }

  // AI usage is documented
  const features = (aiUsage.ai_features as string[]) || [];
  const checklist = (aiUsage.compliance_checklist as { checked: boolean }[]) || [];
  const checklistProgress =
    checklist.length > 0
      ? (checklist.filter((c) => c.checked).length / checklist.length) * 100
      : 0;

  return (
    <div className="space-y-6">
      {/* Header with edit button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bot className="h-6 w-6" />
          <div>
            <h3 className="font-medium">
              {aiUsage.has_ai
                ? t("processAI.usesAI", "Prosessen bruker AI")
                : t("processAI.noAI", "Ingen AI-bruk")}
            </h3>
            {aiUsage.last_review_date && (
              <p className="text-sm text-muted-foreground">
                {t("processAI.lastReviewed", "Sist vurdert")}:{" "}
                {new Date(aiUsage.last_review_date).toLocaleDateString("nb-NO")}
              </p>
            )}
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => setDialogOpen(true)}>
          <Edit2 className="h-4 w-4 mr-1" />
          {t("common.edit", "Rediger")}
        </Button>
      </div>

      {aiUsage.has_ai && (
        <>
          {/* Risk and Compliance Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  {t("processAI.riskCategory", "Risikoklassifisering")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant={getRiskBadgeVariant(aiUsage.risk_category)}>
                  {getRiskLabel(aiUsage.risk_category)}
                </Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  {getComplianceIcon(aiUsage.compliance_status)}
                  {t("processAI.compliance", "Compliance")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className={getComplianceColor(aiUsage.compliance_status)}>
                      {Math.round(checklistProgress)}%
                    </span>
                    <span className="text-muted-foreground">
                      {checklist.filter((c) => c.checked).length}/{checklist.length}
                    </span>
                  </div>
                  <Progress value={checklistProgress} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  {t("processAI.transparency", "Transparens")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Badge
                  variant={
                    aiUsage.transparency_status === "implemented"
                      ? "default"
                      : aiUsage.transparency_status === "required"
                      ? "destructive"
                      : "outline"
                  }
                >
                  {aiUsage.transparency_status === "implemented"
                    ? t("processAI.implemented", "Implementert")
                    : aiUsage.transparency_status === "required"
                    ? t("processAI.required", "Påkrevd")
                    : t("processAI.notRequired", "Ikke påkrevd")}
                </Badge>
              </CardContent>
            </Card>
          </div>

          {/* AI Purpose */}
          {aiUsage.ai_purpose && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  {t("processAI.aiPurpose", "Formål med AI")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{aiUsage.ai_purpose}</p>
              </CardContent>
            </Card>
          )}

          {/* AI Features */}
          {features.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  {t("processAI.aiFeatures", "AI-funksjoner i bruk")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {features.map((feature, index) => (
                    <Badge key={index} variant="secondary">
                      {feature}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Affected Persons */}
          {aiUsage.affected_persons && aiUsage.affected_persons.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  {t("processAI.affectedPersons", "Berørte personer")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {aiUsage.affected_persons.map((person: string, index: number) => (
                    <Badge key={index} variant="outline">
                      {person}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Human Oversight */}
          {aiUsage.human_oversight_required && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  {t("processAI.humanOversight", "Menneskelig tilsyn")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Badge variant="secondary">
                    {aiUsage.human_oversight_level === "full_control"
                      ? t("processAI.fullControl", "Full kontroll")
                      : aiUsage.human_oversight_level === "approval"
                      ? t("processAI.approval", "Godkjenning")
                      : t("processAI.review", "Gjennomgang")}
                  </Badge>
                  {aiUsage.human_oversight_description && (
                    <p className="text-sm text-muted-foreground">
                      {aiUsage.human_oversight_description}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Risk Justification */}
          {aiUsage.risk_justification && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  {t("processAI.riskJustification", "Begrunnelse for risikoklassifisering")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{aiUsage.risk_justification}</p>
              </CardContent>
            </Card>
          )}
        </>
      )}

      <ProcessAIDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        processId={processId}
        processName={processName}
        processDescription={processDescription}
        workAreaId={workAreaId}
        systemId={systemId}
      />
    </div>
  );
};
