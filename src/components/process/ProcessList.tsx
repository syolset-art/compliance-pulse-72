import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Workflow, Sparkles, Loader2 } from "lucide-react";
import { AddProcessDialog } from "@/components/dialogs/AddProcessDialog";
import { ProcessSuggestionsDialog, ProcessSuggestion } from "@/components/dialogs/ProcessSuggestionsDialog";
import { AISuggestionStatusPanel } from "./AISuggestionStatusPanel";
import { ProcessOverviewCard } from "./ProcessOverviewCard";
import { AgentRecommendationStrip } from "./AgentRecommendationStrip";
import { useProcessAgentRecommendations } from "@/hooks/useProcessAgentRecommendations";
import { useAgentInsightReveal } from "@/hooks/useAgentInsightReveal";
import { useState, useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";

interface ProcessListProps {
  workAreaId: string;
  workAreaName?: string;
}

export const ProcessList = ({ workAreaId, workAreaName = "Arbeidsområde" }: ProcessListProps) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  
  // AI suggestion state
  const [isGenerating, setIsGenerating] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [suggestions, setSuggestions] = useState<ProcessSuggestion[]>([]);
  const [showSuggestionDialog, setShowSuggestionDialog] = useState(false);
  const [generationStartTime, setGenerationStartTime] = useState<number | null>(null);
  const [generationDuration, setGenerationDuration] = useState(0);
  const [availableSystems, setAvailableSystems] = useState<{ id: string; name: string }[]>([]);

  // Agent recommendations
  const { data: agentRecs = [], isLoading: agentRecsLoading, generate: generateAgentRecs } =
    useProcessAgentRecommendations(workAreaId);
  const { revealed: agentRevealed } = useAgentInsightReveal(workAreaId);
  const backfillTriggered = useRef(false);

  // Fetch systems for this work area
  const { data: systems } = useQuery({
    queryKey: ["work-area-systems", workAreaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("systems")
        .select("id, name")
        .eq("work_area_id", workAreaId);
      
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch processes for this work area (via systems)
  const { data: processes, isLoading } = useQuery({
    queryKey: ["work-area-processes", workAreaId],
    queryFn: async () => {
      // First get systems in this work area
      const { data: systemsData, error: systemsError } = await supabase
        .from("systems")
        .select("id")
        .eq("work_area_id", workAreaId);
      
      if (systemsError) throw systemsError;
      
      if (!systemsData || systemsData.length === 0) return [];
      
      const systemIds = systemsData.map(s => s.id);
      
      // Then get processes for those systems
      const { data: processData, error: processError } = await supabase
        .from("system_processes")
        .select("*")
        .in("system_id", systemIds)
        .order("created_at", { ascending: false });
      
      if (processError) throw processError;
      return processData || [];
    },
  });

  // Fetch AI usage for all processes
  const { data: processAIUsage } = useQuery({
    queryKey: ["process-ai-usage-list", workAreaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("process_ai_usage")
        .select("process_id, has_ai, risk_category, compliance_status")
        .eq("work_area_id", workAreaId);
      
      if (error) throw error;
      return data || [];
    },
  });

  // Create processes mutation with automatic AI usage registration
  const createProcessesMutation = useMutation({
    mutationFn: async (processesToCreate: ProcessSuggestion[]) => {
      if (!systems || systems.length === 0) {
        throw new Error("Ingen systemer tilgjengelig");
      }

      const defaultSystemId = systems[0].id;
      const createdProcesses: { id: string; suggestion: ProcessSuggestion }[] = [];

      for (const process of processesToCreate) {
        // Find matching system by name or use default
        const matchingSystem = systems.find(s => 
          process.related_systems.some(rs => 
            s.name.toLowerCase().includes(rs.toLowerCase()) || 
            rs.toLowerCase().includes(s.name.toLowerCase())
          )
        );

        const { data: processData, error } = await supabase
          .from("system_processes")
          .insert({
            system_id: matchingSystem?.id || defaultSystemId,
            name: process.name,
            description: process.description,
          })
          .select("id")
          .single();

        if (error) throw error;
        
        if (processData) {
          createdProcesses.push({ id: processData.id, suggestion: process });
        }
      }

      // Automatically register AI usage for processes that have AI
      const aiUsageRecords = createdProcesses
        .filter(p => p.suggestion.likely_has_ai)
        .map(p => ({
          process_id: p.id,
          work_area_id: workAreaId,
          has_ai: true,
          ai_purpose: p.suggestion.ai_use_description || null,
          ai_features: p.suggestion.data_types ? 
            JSON.stringify(p.suggestion.data_types.map(dt => ({ name: dt, description: '' }))) : 
            '[]',
          risk_category: null,
          compliance_status: 'not_assessed',
          affected_persons: p.suggestion.data_types || [],
        }));

      if (aiUsageRecords.length > 0) {
        const { error: aiError } = await supabase
          .from("process_ai_usage")
          .insert(aiUsageRecords);

        if (aiError) {
          console.error("Error creating AI usage records:", aiError);
          // Don't throw - processes are created, just log the error
        }
      }

      return { total: createdProcesses.length, withAI: aiUsageRecords.length };
    },
    onSuccess: (result) => {
      const aiMessage = result.withAI > 0 ? 
        ` (${result.withAI} med AI-bruk registrert)` : '';
      toast.success(`${result.total} prosess${result.total > 1 ? 'er' : ''} opprettet${aiMessage}`);
      queryClient.invalidateQueries({ queryKey: ["work-area-processes", workAreaId] });
      queryClient.invalidateQueries({ queryKey: ["process-ai-usage-list", workAreaId] });
      setShowSuggestionDialog(false);
      setSuggestions([]);
      setIsComplete(false);
    },
    onError: (error) => {
      toast.error("Kunne ikke opprette prosesser: " + (error as Error).message);
    },
  });

  const handleGetSuggestions = useCallback(async () => {
    setIsGenerating(true);
    setIsComplete(false);
    setGenerationStartTime(Date.now());
    setSuggestions([]);

    try {
      const { data, error } = await supabase.functions.invoke("suggest-processes", {
        body: { work_area_id: workAreaId, language: i18n.language },
      });

      if (error) throw error;

      if (data.error) {
        toast.error(data.error);
        setIsGenerating(false);
        return;
      }

      const duration = Math.round((Date.now() - (generationStartTime || Date.now())) / 1000);
      setGenerationDuration(duration);
      setSuggestions(data.suggestions || []);
      setAvailableSystems(data.systems || []);
      setIsComplete(true);
      
      // Automatically open the suggestions dialog
      setShowSuggestionDialog(true);
    } catch (error) {
      console.error("Error fetching suggestions:", error);
      toast.error("Kunne ikke hente forslag: " + (error as Error).message);
    } finally {
      setIsGenerating(false);
    }
  }, [workAreaId, generationStartTime]);

  const handleCloseStatusPanel = () => {
    setIsComplete(false);
    setIsGenerating(false);
  };

  const handleRejectAll = () => {
    setSuggestions([]);
    setIsComplete(false);
    toast.info("Alle forslag avslått");
  };

  // Mock stats for processes - in a real app this would come from the database
  const getProcessStats = (processId: string) => {
    return {
      dataTypes: 0,
      systems: 2,
      riskScenarios: 2,
      pendingMitigations: 1,
    };
  };

  const getProcessCriticality = (processId: string): "low" | "medium" | "high" | "critical" => {
    const aiInfo = processAIUsage?.find(p => p.process_id === processId);
    if (aiInfo?.risk_category === 'unacceptable' || aiInfo?.risk_category === 'high') return 'high';
    if (aiInfo?.risk_category === 'limited') return 'medium';
    return 'medium';
  };

  if (isLoading) {
    return (
      <Card className="p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </Card>
    );
  }

  if (!processes || processes.length === 0) {
    return (
      <>
        <AISuggestionStatusPanel
          isGenerating={isGenerating}
          isComplete={isComplete}
          workAreaName={workAreaName}
          suggestionCount={suggestions.length}
          duration={generationDuration}
          onClose={handleCloseStatusPanel}
        />

        <Card className="p-8">
          <div className="text-center">
            <Workflow className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {t("processList.noProcesses", "Ingen prosesser registrert")}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {t("processList.noProcessesDesc", "Legg til prosesser for å dokumentere AI-bruk og sikre compliance.")}
            </p>
            <div className="flex items-center justify-center gap-2">
              <Button variant="outline" onClick={handleGetSuggestions} disabled={isGenerating}>
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Genererer...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Få forslag fra Lara Soft
                  </>
                )}
              </Button>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                {t("processList.addProcess", "Legg til prosess")}
              </Button>
            </div>
          </div>
        </Card>

        <AddProcessDialog
          open={isAddDialogOpen}
          onOpenChange={setIsAddDialogOpen}
          workAreaId={workAreaId}
          workAreaName={workAreaName}
          onProcessAdded={() => queryClient.invalidateQueries({ queryKey: ["work-area-processes", workAreaId] })}
        />

        <ProcessSuggestionsDialog
          open={showSuggestionDialog}
          onOpenChange={setShowSuggestionDialog}
          suggestions={suggestions}
          availableSystems={availableSystems}
          onCreateProcesses={(selected) => createProcessesMutation.mutate(selected)}
          onRejectAll={handleRejectAll}
          isCreating={createProcessesMutation.isPending}
        />
      </>
    );
  }

  return (
    <div className="space-y-6">
      <AISuggestionStatusPanel
        isGenerating={isGenerating}
        isComplete={isComplete}
        workAreaName={workAreaName}
        suggestionCount={suggestions.length}
        duration={generationDuration}
        onClose={handleCloseStatusPanel}
      />

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold">Prosessoversikt</h2>
          <p className="text-sm text-muted-foreground">
            Her ser du prosessene for dette arbeidsområdet.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={handleGetSuggestions} disabled={isGenerating}>
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Genererer...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Få forslag fra Lara Soft
              </>
            )}
          </Button>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            Legg til prosess
          </Button>
        </div>
      </div>

      {/* AI Agent Recommendation Strip */}
      <AgentRecommendationStrip workAreaId={workAreaId} workAreaName={workAreaName} />

      {/* Process Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {processes.map((process) => {
          const aiInfo = processAIUsage?.find(p => p.process_id === process.id);
          const agentRec = agentRecs.find((r) => r.process_id === process.id);
          return (
            <ProcessOverviewCard
              key={process.id}
              process={process}
              stats={getProcessStats(process.id)}
              criticality={getProcessCriticality(process.id)}
              processOwner="Ukjent bruker"
              aiUsage={aiInfo ? {
                hasAI: aiInfo.has_ai,
                riskCategory: aiInfo.risk_category,
                complianceStatus: aiInfo.compliance_status
              } : undefined}
              agentRec={agentRec}
              workAreaId={workAreaId}
              onClick={() => navigate(`/processes/${process.id}`)}
            />
          );
        })}
      </div>

      <AddProcessDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        workAreaId={workAreaId}
        workAreaName={workAreaName}
        onProcessAdded={() => queryClient.invalidateQueries({ queryKey: ["work-area-processes", workAreaId] })}
      />

      <ProcessSuggestionsDialog
        open={showSuggestionDialog}
        onOpenChange={setShowSuggestionDialog}
        suggestions={suggestions}
        availableSystems={availableSystems}
        onCreateProcesses={(selected) => createProcessesMutation.mutate(selected)}
        onRejectAll={handleRejectAll}
        isCreating={createProcessesMutation.isPending}
      />
    </div>
  );
};
