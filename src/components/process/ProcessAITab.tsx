import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
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
  Sparkles,
  Server,
  ChevronRight,
  Lightbulb,
  HelpCircle,
  Check,
} from "lucide-react";
import { ProcessAIDialog } from "./ProcessAIDialog";
import { useProcessAIDraft, type AIDraft } from "@/hooks/useProcessAIDraft";

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
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);

  // Fetch existing AI usage data
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

  // Fetch AI draft suggestions
  const { data: aiDraft, isLoading: draftLoading } = useProcessAIDraft(
    processName,
    processDescription,
    systemId
  );

  // Quick accept mutation
  const quickAcceptMutation = useMutation({
    mutationFn: async (draft: AIDraft) => {
      const payload = {
        process_id: processId,
        work_area_id: workAreaId || null,
        has_ai: draft.likelyHasAI,
        ai_purpose: draft.aiPurpose || null,
        ai_features: draft.suggestedFeatures as unknown as null,
        risk_category: draft.suggestedRisk || null,
        compliance_checklist: draft.suggestedChecks.map((q, i) => ({
          id: `check-${i}`,
          question: q,
          checked: false,
        })) as unknown as null,
        compliance_status: 'needs_review',
        last_review_date: new Date().toISOString().split('T')[0],
      };

      const { error } = await supabase
        .from("process_ai_usage")
        .insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t("processAI.draftAccepted", "Utkast lagret - fullfør dokumentasjonen"));
      queryClient.invalidateQueries({ queryKey: ["process-ai-usage"] });
    },
    onError: (error) => {
      toast.error(t("common.error", "Noe gikk galt"));
      console.error(error);
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

  const getConfidenceColor = (level: string) => {
    switch (level) {
      case 'high':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getConfidenceLabel = (level: string) => {
    switch (level) {
      case 'high':
        return t("processAI.highConfidence", "Høy sikkerhet");
      case 'medium':
        return t("processAI.mediumConfidence", "Moderat sikkerhet");
      default:
        return t("processAI.lowConfidence", "Lav sikkerhet");
    }
  };

  if (isLoading || draftLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // No AI usage documented - show proactive Lara suggestion
  if (!aiUsage) {
    const hasSuggestions = aiDraft && (aiDraft.likelyHasAI || aiDraft.suggestedFeatures.length > 0 || aiDraft.sources.length > 0);

    if (!hasSuggestions) {
      // No suggestions available - show simple empty state
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

    // Show Lara's proactive suggestion
    return (
      <div className="space-y-6">
        {/* Lara's suggestion card */}
        <Card className="border-primary/30 bg-gradient-to-br from-primary/5 via-primary/3 to-transparent">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base font-medium">
                    {t("processAI.laraAnalysis", "Lara har analysert prosessen")}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {t("processAI.basedOn", "Basert på tilknyttet system og prosessinformasjon")}
                  </p>
                </div>
              </div>
              <Badge variant="outline" className={getConfidenceColor(aiDraft.confidenceLevel)}>
                {getConfidenceLabel(aiDraft.confidenceLevel)}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-5">
            {/* System source info */}
            {aiDraft.systemName && (
              <div className="flex items-center gap-2 p-3 bg-background/60 rounded-lg border border-primary/10">
                <Server className="h-4 w-4 text-primary" />
                <span className="text-sm">
                  {t("processAI.linkedSystem", "Tilknyttet system:")}{" "}
                  <span className="font-medium">{aiDraft.systemName}</span>
                </span>
                {aiDraft.hasAI && (
                  <Badge variant="default" className="ml-auto text-xs">
                    <Bot className="h-3 w-3 mr-1" />
                    {t("processAI.systemUsesAI", "Bruker AI")}
                  </Badge>
                )}
              </div>
            )}

            {/* AI likelihood indicator */}
            {aiDraft.likelyHasAI && (
              <div className="flex items-start gap-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <Lightbulb className="h-5 w-5 text-yellow-600 dark:text-yellow-500 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-sm text-yellow-800 dark:text-yellow-200">
                    {t("processAI.likelyUsesAI", "Prosessen bruker sannsynligvis AI")}
                  </p>
                  {aiDraft.aiActNote && (
                    <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                      {aiDraft.aiActNote}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Suggested features */}
            {aiDraft.suggestedFeatures.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Bot className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    {t("processAI.suggestedFeatures", "Foreslåtte AI-funksjoner")}
                  </span>
                  <Badge variant="outline" className="text-xs bg-primary/5">
                    {t("processAI.autoGenerated", "Auto-generert")}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  {aiDraft.suggestedFeatures.map((feature, idx) => (
                    <Badge key={idx} variant="secondary" className="text-sm py-1">
                      <CheckCircle2 className="h-3 w-3 mr-1.5 text-green-600" />
                      {feature}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Suggested risk */}
            {aiDraft.suggestedRisk && (
              <div className="flex items-center gap-3">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  {t("processAI.suggestedRisk", "Foreslått risikoklassifisering:")}
                </span>
                <Badge variant={getRiskBadgeVariant(aiDraft.suggestedRisk)}>
                  {getRiskLabel(aiDraft.suggestedRisk)}
                </Badge>
              </div>
            )}

            {/* Data sources */}
            {aiDraft.sources.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                  {t("processAI.dataSources", "Datakilder")}
                </p>
                <div className="space-y-1.5">
                  {aiDraft.sources.map((source, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="h-3 w-3 text-green-600" />
                      <span>{source.name}:</span>
                      <span className="text-foreground/80">{source.contribution}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Required user input warning */}
            {aiDraft.requiresUserInput.length > 0 && (
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <HelpCircle className="h-4 w-4 text-amber-600" />
                  <span className="text-sm font-medium text-amber-800 dark:text-amber-200">
                    {t("processAI.requiresInput", "Krever din input")}
                  </span>
                </div>
                <ul className="space-y-1">
                  {aiDraft.requiresUserInput.map((input, idx) => (
                    <li key={idx} className="text-sm text-amber-700 dark:text-amber-300 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      {input.label}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button 
                onClick={() => aiDraft && quickAcceptMutation.mutate(aiDraft)}
                disabled={quickAcceptMutation.isPending}
                className="flex-1"
              >
                <Check className="h-4 w-4 mr-2" />
                {quickAcceptMutation.isPending 
                  ? t("common.saving", "Lagrer...")
                  : t("processAI.acceptDraft", "Bekreft utkast")}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setDialogOpen(true)}
                className="flex-1"
              >
                <Edit2 className="h-4 w-4 mr-2" />
                {t("processAI.adjustAndComplete", "Juster og fullfør")}
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
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

  // AI usage is documented - show existing data
  const features = (aiUsage.ai_features as string[]) || [];
  const checklist = (aiUsage.compliance_checklist as { checked: boolean }[]) || [];
  const checklistProgress =
    checklist.length > 0
      ? (checklist.filter((c) => c.checked).length / checklist.length) * 100
      : 0;

  const needsReview = aiUsage.compliance_status === 'needs_review';

  return (
    <div className="space-y-6">
      {/* Needs review banner */}
      {needsReview && (
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800">
          <CardContent className="py-3 px-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-600" />
                <span className="text-sm font-medium text-amber-800 dark:text-amber-200">
                  {t("processAI.needsReview", "Utkast - krever gjennomgang")}
                </span>
              </div>
              <Button variant="outline" size="sm" onClick={() => setDialogOpen(true)}>
                <Edit2 className="h-4 w-4 mr-1" />
                {t("processAI.completeDocumentation", "Fullfør")}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

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
