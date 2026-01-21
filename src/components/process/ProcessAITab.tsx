import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Bot,
  Server,
  CheckCircle2,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { ProcessAIDialog } from "./ProcessAIDialog";
import { AIHeroSummary } from "./AIHeroSummary";
import { GuidedInputWizard } from "./GuidedInputWizard";
import { AIDocumentedSummary } from "./AIDocumentedSummary";
import { useProcessAIDraft, type AIDraft } from "@/hooks/useProcessAIDraft";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

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
  const [detailsExpanded, setDetailsExpanded] = useState(false);
  const [showGuidedWizard, setShowGuidedWizard] = useState(false);

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
    mutationFn: async (draft: AIDraft & { additionalData?: Record<string, any> }) => {
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
        compliance_status: 'not_assessed',
        last_review_date: new Date().toISOString().split('T')[0],
        affected_persons: draft.additionalData?.affectedPersons || null,
        transparency_description: draft.additionalData?.transparencyDescription || null,
        human_oversight_description: draft.additionalData?.humanOversightDescription || null,
      };

      const { error } = await supabase
        .from("process_ai_usage")
        .insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t("processAI.draftAccepted", "AI-bruk dokumentert!"));
      queryClient.invalidateQueries({ queryKey: ["process-ai-usage"] });
      setShowGuidedWizard(false);
    },
    onError: (error) => {
      toast.error(t("common.error", "Noe gikk galt"));
      console.error(error);
    },
  });

  const handleQuickAccept = () => {
    if (!aiDraft) return;
    
    // Check if we need additional input
    if (aiDraft.requiresUserInput.length > 0) {
      setShowGuidedWizard(true);
    } else {
      quickAcceptMutation.mutate(aiDraft);
    }
  };

  const handleGuidedComplete = (values: Record<string, any>) => {
    if (!aiDraft) return;
    quickAcceptMutation.mutate({
      ...aiDraft,
      additionalData: values,
    });
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

    // Show guided wizard if user clicked confirm
    if (showGuidedWizard && aiDraft.requiresUserInput.length > 0) {
      return (
        <div className="space-y-6">
          <GuidedInputWizard
            requiredInputs={aiDraft.requiresUserInput}
            onComplete={handleGuidedComplete}
            onCancel={() => setShowGuidedWizard(false)}
          />

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

    // Show clean hero summary with Lara's suggestion
    return (
      <div className="space-y-4">
        <AIHeroSummary
          riskLevel={aiDraft.suggestedRisk}
          purpose={aiDraft.aiPurpose}
          confidence={aiDraft.confidenceLevel}
          isExpanded={detailsExpanded}
          onToggleExpand={() => setDetailsExpanded(!detailsExpanded)}
          onAccept={handleQuickAccept}
          onAdjust={() => setDialogOpen(true)}
          isAccepting={quickAcceptMutation.isPending}
        />

        {/* Collapsible details section */}
        <Collapsible open={detailsExpanded} onOpenChange={setDetailsExpanded}>
          <CollapsibleContent className="space-y-3">
            {/* System source */}
            {aiDraft.systemName && (
              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg border">
                <Server className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  Kilde: <span className="font-medium">{aiDraft.systemName}</span>
                </span>
                {aiDraft.hasAI && (
                  <Badge variant="default" className="ml-auto text-xs">
                    <Bot className="h-3 w-3 mr-1" />
                    Bruker AI
                  </Badge>
                )}
              </div>
            )}

            {/* Suggested features */}
            {aiDraft.suggestedFeatures.length > 0 && (
              <div className="p-3 bg-muted/50 rounded-lg border space-y-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">AI-funksjoner</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {aiDraft.suggestedFeatures.map((feature, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      <CheckCircle2 className="h-3 w-3 mr-1 text-green-600" />
                      {feature}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Data sources */}
            {aiDraft.sources.length > 0 && (
              <div className="p-3 bg-muted/50 rounded-lg border space-y-2">
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                  Datakilder
                </span>
                <div className="space-y-1">
                  {aiDraft.sources.map((source, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="h-3 w-3 text-green-600" />
                      <span>{source.name}:</span>
                      <span className="text-foreground/80">{source.contribution}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AI Act note */}
            {aiDraft.aiActNote && (
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  💡 {aiDraft.aiActNote}
                </p>
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>

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

  // AI usage is documented - show compact summary
  // Ensure affected_persons is always an array (can be null or non-array from DB)
  const affectedPersonsArray = Array.isArray(aiUsage.affected_persons) 
    ? aiUsage.affected_persons 
    : [];

  return (
    <div className="space-y-6">
      <AIDocumentedSummary
        hasAI={aiUsage.has_ai}
        riskLevel={aiUsage.risk_category}
        purpose={aiUsage.ai_purpose}
        affectedPersons={affectedPersonsArray}
        lastReviewDate={aiUsage.last_review_date}
        complianceStatus={aiUsage.compliance_status}
        onEdit={() => setDialogOpen(true)}
      />

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
