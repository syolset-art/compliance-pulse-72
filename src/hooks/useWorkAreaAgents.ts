import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAgents } from "@/hooks/useAgents";
import {
  buildWorkAreaAgents,
  type ProcessRef,
  type RecruitedRecommendation,
  type WorkAreaAgent,
} from "@/lib/agentWorkAreas";

/**
 * Henter alle prosesser (med arbeidsområde) og alle anbefalinger satt i arbeid,
 * og avleder hvilke KI-agenter som jobber hvor. Én spørring for hele
 * virksomheten, slik at «delt»-notasjonen blir riktig uansett valgt område.
 */
export function useWorkAreaAgents() {
  const { agents } = useAgents();

  const processesQ = useQuery({
    queryKey: ["all-processes-with-work-area"],
    queryFn: async (): Promise<ProcessRef[]> => {
      const { data: systems, error: sErr } = await supabase
        .from("systems")
        .select("id, work_area_id, work_areas(name)")
        .not("work_area_id", "is", null);
      if (sErr) throw sErr;
      const sysMap = new Map(
        (systems ?? []).map((s: any) => [s.id, { workAreaId: s.work_area_id as string, workAreaName: (s.work_areas?.name as string) ?? "" }])
      );
      if (sysMap.size === 0) return [];
      const { data: procs, error: pErr } = await supabase
        .from("system_processes")
        .select("id, name, system_id")
        .in("system_id", [...sysMap.keys()]);
      if (pErr) throw pErr;
      return (procs ?? []).flatMap((p) => {
        const s = sysMap.get(p.system_id);
        return s ? [{ id: p.id, name: p.name, ...s }] : [];
      });
    },
  });

  const recruitedQ = useQuery({
    queryKey: ["recruited-agent-recommendations"],
    queryFn: async (): Promise<RecruitedRecommendation[]> => {
      const { data, error } = await supabase
        .from("process_agent_recommendations" as any)
        .select("process_id, suggested_agent_role, status")
        .eq("status", "recruited");
      if (error) throw error;
      return (data ?? []) as unknown as RecruitedRecommendation[];
    },
  });

  const workAreaAgents: WorkAreaAgent[] = useMemo(
    () => buildWorkAreaAgents(agents, processesQ.data ?? [], recruitedQ.data ?? []),
    [agents, processesQ.data, recruitedQ.data]
  );

  return {
    agents: workAreaAgents,
    processes: processesQ.data ?? [],
    isLoading: processesQ.isLoading || recruitedQ.isLoading,
  };
}
