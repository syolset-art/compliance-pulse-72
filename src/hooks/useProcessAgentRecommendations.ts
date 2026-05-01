import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

export type AgentRecommendation = "autonomous" | "copilot" | "manual";
export type AgentRecStatus = "proposed" | "recruited" | "dismissed";

export interface ProcessAgentRec {
  id: string;
  process_id: string;
  work_area_id: string;
  recommendation: AgentRecommendation;
  rationale: string | null;
  suggested_agent_role: string | null;
  estimated_hours_saved_per_month: number | null;
  status: AgentRecStatus;
  generated_at: string;
}

export function useProcessAgentRecommendations(workAreaId: string | undefined) {
  const queryClient = useQueryClient();
  const { i18n } = useTranslation();

  const query = useQuery({
    queryKey: ["process-agent-recommendations", workAreaId],
    queryFn: async (): Promise<ProcessAgentRec[]> => {
      if (!workAreaId) return [];
      const { data, error } = await supabase
        .from("process_agent_recommendations" as any)
        .select("*")
        .eq("work_area_id", workAreaId);
      if (error) throw error;
      return (data || []) as unknown as ProcessAgentRec[];
    },
    enabled: !!workAreaId,
  });

  const generate = useMutation({
    mutationFn: async () => {
      if (!workAreaId) throw new Error("missing workAreaId");
      const { data, error } = await supabase.functions.invoke(
        "analyze-process-agent-fit",
        { body: { workAreaId, language: i18n.language } }
      );
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data: any) => {
      const isNb = i18n.language === "nb";
      toast.success(
        isNb
          ? `Lara analyserte ${data?.count ?? 0} prosesser`
          : `Lara analyzed ${data?.count ?? 0} processes`
      );
      queryClient.invalidateQueries({
        queryKey: ["process-agent-recommendations", workAreaId],
      });
    },
    onError: (e: any) => {
      toast.error(e.message || "Kunne ikke analysere prosesser");
    },
  });

  const setStatus = useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string;
      status: AgentRecStatus;
    }) => {
      const { error } = await supabase
        .from("process_agent_recommendations" as any)
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["process-agent-recommendations", workAreaId],
      });
    },
    onError: (e: any) => toast.error(e.message),
  });

  return { ...query, generate, setStatus };
}
