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
  recruited_at?: string | null;
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
    mutationFn: async (opts?: { processIds?: string[]; silent?: boolean }) => {
      if (!workAreaId) throw new Error("missing workAreaId");
      const { data, error } = await supabase.functions.invoke(
        "analyze-process-agent-fit",
        {
          body: {
            workAreaId,
            language: i18n.language,
            processIds: opts?.processIds,
          },
        }
      );
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return { ...data, silent: opts?.silent ?? false };
    },
    onSuccess: (data: any) => {
      if (!data?.silent) {
        const isNb = i18n.language === "nb";
        toast.success(
          isNb
            ? `Lara analyserte ${data?.count ?? 0} prosesser`
            : `Lara analyzed ${data?.count ?? 0} processes`
        );
      }
      queryClient.invalidateQueries({
        queryKey: ["process-agent-recommendations", workAreaId],
      });
    },
    onError: (e: any, vars: any) => {
      if (!vars?.silent) toast.error(e.message || "Kunne ikke analysere prosesser");
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
      const patch: Record<string, unknown> = { status };
      if (status === "recruited") patch.recruited_at = new Date().toISOString();
      if (status === "proposed") patch.recruited_at = null;
      const { error } = await supabase
        .from("process_agent_recommendations" as any)
        .update(patch)
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

  /**
   * Recruit an AI agent for a process: marks the recommendation as
   * recruited AND creates a follow-up task in the user's inbox so
   * Lara has somewhere to land the work.
   */
  const recruitAgent = useMutation({
    mutationFn: async ({
      rec,
      processName,
    }: {
      rec: ProcessAgentRec;
      processName: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const isNb = i18n.language === "nb";
      const role = rec.suggested_agent_role || (isNb ? "AI-agent" : "AI agent");
      const title = isNb
        ? `Sett opp ${role} for «${processName}»`
        : `Set up ${role} for "${processName}"`;
      const description = isNb
        ? `Lara har anbefalt en ${rec.recommendation === "autonomous" ? "autonom agent" : "co-pilot-agent"} for prosessen. ${rec.rationale || ""}`.trim()
        : `Lara recommended a ${rec.recommendation === "autonomous" ? "autonomous agent" : "co-pilot agent"} for this process. ${rec.rationale || ""}`.trim();

      // 1. Update recommendation status
      const { error: updErr } = await supabase
        .from("process_agent_recommendations" as any)
        .update({
          status: "recruited",
          recruited_at: new Date().toISOString(),
        })
        .eq("id", rec.id);
      if (updErr) throw updErr;

      // 2. Create a task in the inbox
      const { error: taskErr } = await supabase.from("user_tasks").insert({
        user_id: user.id,
        title,
        description,
        status: "todo",
      });
      if (taskErr) throw taskErr;
    },
    onSuccess: () => {
      const isNb = i18n.language === "nb";
      toast.success(
        isNb
          ? "Lara har lagt agent-oppsettet i innboksen din"
          : "Lara added the agent setup to your inbox"
      );
      queryClient.invalidateQueries({
        queryKey: ["process-agent-recommendations", workAreaId],
      });
      queryClient.invalidateQueries({ queryKey: ["user-tasks"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  return { ...query, generate, setStatus, recruitAgent };
}
