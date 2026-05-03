import { useState, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { format } from "date-fns";

export interface NormativeRule {
  code: string;
  label: string;
  deadlineHours?: number;
  action: string;
  triggered: boolean;
}

export interface FollowUpQuestion {
  id: string;
  question: string;
  options: string[];
  affects?: string;
}

export interface DeviationProposal {
  title: string;
  description: string;
  category: string;
  criticality: "critical" | "high" | "medium" | "low";
  frameworks: string[];
  normativeRules: NormativeRule[];
  suggestedResponsible?: { name: string; reason: string };
  suggestedMeasures: string[];
  followUpQuestions?: FollowUpQuestion[];
  reasoning: string;
}

export type AgentState = "idle" | "prompt" | "analysing" | "draft";

export function useDeviationAgent(onCreated?: () => void) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [state, setState] = useState<AgentState>("idle");
  const [proposal, setProposal] = useState<DeviationProposal | null>(null);
  const [lastDescription, setLastDescription] = useState("");
  const [followUpAnswers, setFollowUpAnswers] = useState<Record<string, string>>({});

  const { data: workAreas = [] } = useQuery({
    queryKey: ["work-areas-for-deviations"],
    queryFn: async () => {
      const { data } = await supabase
        .from("work_areas")
        .select("id, name, responsible_person");
      return data || [];
    },
  });

  const { data: companyProfile } = useQuery({
    queryKey: ["company-profile"],
    queryFn: async () => {
      const { data } = await supabase.from("company_profile").select("industry").maybeSingle();
      return data;
    },
  });

  const { data: systems = [] } = useQuery({
    queryKey: ["systems-for-deviations"],
    queryFn: async () => {
      const { data } = await supabase.from("systems").select("id, name");
      return data || [];
    },
  });

  const analyse = useCallback(
    async (description: string, quickCategory?: string, answers?: Record<string, string>) => {
      setState("analysing");
      setLastDescription(description);
      try {
        const { data, error } = await supabase.functions.invoke("classify-deviation", {
          body: {
            description,
            quickCategory,
            followUpAnswers: answers,
            industry: companyProfile?.industry,
            workAreas: workAreas.map((w) => ({
              name: w.name,
              responsible_person: w.responsible_person,
            })),
          },
        });
        if (error) throw error;
        if ((data as any)?.error) throw new Error((data as any).error);
        setProposal((data as any).proposal as DeviationProposal);
        setState("draft");
      } catch (e: any) {
        console.error(e);
        toast.error(e?.message || "Lara klarte ikke å analysere avviket");
        setState("prompt");
      }
    },
    [companyProfile, workAreas],
  );

  const refineWithAnswer = useCallback(
    (qId: string, answer: string) => {
      const next = { ...followUpAnswers, [qId]: answer };
      setFollowUpAnswers(next);
      analyse(lastDescription, undefined, next);
    },
    [analyse, followUpAnswers, lastDescription],
  );

  const createMutation = useMutation({
    mutationFn: async (overrides?: Partial<DeviationProposal>) => {
      if (!proposal) throw new Error("Ingen forslag");
      const final = { ...proposal, ...overrides };
      const systemId = systems[0]?.id;
      if (!systemId) throw new Error("Ingen systemer funnet");

      const { data: inserted, error } = await supabase
        .from("system_incidents")
        .insert({
          system_id: systemId,
          title: final.title,
          description: final.description,
          category: final.category,
          criticality: final.criticality,
          risk_level: final.criticality,
          status: "open",
          responsible:
            final.suggestedResponsible?.name || user?.email || null,
          relevant_frameworks: final.frameworks,
          measures_count: final.suggestedMeasures.length,
          measures_completed: 0,
          systems_count: 1,
          processes_count: 0,
          discovered_at: format(new Date(), "yyyy-MM-dd"),
          normative_rules: final.normativeRules as any,
          agent_reasoning: final.reasoning,
          suggested_measures: final.suggestedMeasures as any,
        })
        .select()
        .single();
      if (error) throw error;

      // Spawn user_tasks for each suggested measure
      if (user?.id && inserted) {
        const tasks = final.suggestedMeasures.map((m) => ({
          user_id: user.id,
          title: m,
          description: `Tiltak fra avvik: ${final.title}`,
        }));
        await supabase.from("user_tasks").insert(tasks);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deviations"] });
      queryClient.invalidateQueries({ queryKey: ["user-tasks"] });
      toast.success("Avvik opprettet av Lara");
      reset();
      onCreated?.();
    },
    onError: (e: any) => {
      toast.error(e?.message || "Kunne ikke opprette avviket");
    },
  });

  const reset = useCallback(() => {
    setState("idle");
    setProposal(null);
    setLastDescription("");
    setFollowUpAnswers({});
  }, []);

  return {
    state,
    setState,
    proposal,
    setProposal,
    analyse,
    refineWithAnswer,
    confirm: createMutation.mutate,
    isCreating: createMutation.isPending,
    reset,
  };
}
