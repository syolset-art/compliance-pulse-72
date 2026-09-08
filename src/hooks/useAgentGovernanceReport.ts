/**
 * Samler alle KI-agenter i virksomheten til én rapportmodell for
 * ISO/IEC 42001 og EU AI Act. Gjenbruker eksisterende kilder – ingen
 * skjemaendring, ingen ny kartlegging.
 */

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAgents } from "@/hooks/useAgents";
import {
  buildWorkAreaAgents,
  agentWorkAreas,
  isSharedAgent,
  type ProcessRef,
  type WorkAreaAgent,
} from "@/lib/agentWorkAreas";
import {
  classifyAiAct,
  aiActDuties,
  iso42001Coverage,
  type AiActResult,
  type AiActDutyCheck,
  type Iso42001Coverage,
} from "@/lib/aiActClassification";
import type { AIAgent } from "@/lib/agentMacf";

export interface AgentGovernanceRow {
  id: string;
  name: string;
  /** "recruited" = satt i arbeid, "mynder" = registrert agent. */
  source: WorkAreaAgent["source"];
  href?: string;
  established: boolean;
  shared: boolean;
  workAreas: { id: string; name: string }[];
  processes: { id: string; name: string }[];
  owner: string;
  controlLevel: string;
  hasPersonalData: boolean;
  riskCategory: string | null;
  autonomous: boolean;
  requiresApproval: boolean;
  hasLogging: boolean;
  hasPolicies: boolean;
  updatedAt: string | null;
  aiAct: AiActResult;
  duties: AiActDutyCheck[];
  iso: Iso42001Coverage[];
}

interface RecRow {
  process_id: string;
  work_area_id: string;
  recommendation: string;
  suggested_agent_role: string | null;
  status: string;
  generated_at: string | null;
  recruited_at: string | null;
}

interface UsageRow {
  process_id: string;
  has_ai: boolean | null;
  risk_category: string | null;
}

function enabledPolicyCount(agentId: string): number {
  try {
    const raw = localStorage.getItem(`mynder.agent.policies.${agentId}`);
    if (!raw) return 5; // standardpolicyene er på som utgangspunkt
    const parsed = JSON.parse(raw) as { enabled?: boolean }[];
    return Array.isArray(parsed) ? parsed.filter((p) => p.enabled).length : 0;
  } catch {
    return 0;
  }
}

export function useAgentGovernanceReport() {
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
        (systems ?? []).map((s: any) => [
          s.id,
          { workAreaId: s.work_area_id as string, workAreaName: (s.work_areas?.name as string) ?? "" },
        ])
      );
      if (sysMap.size === 0) return [];
      const { data: procs, error: pErr } = await supabase
        .from("system_processes")
        .select("id, name, system_id")
        .in("system_id", [...sysMap.keys()]);
      if (pErr) throw pErr;
      return (procs ?? []).flatMap((p: any) => {
        const s = sysMap.get(p.system_id);
        return s ? [{ id: p.id, name: p.name, ...s }] : [];
      });
    },
  });

  const recsQ = useQuery({
    queryKey: ["all-agent-recommendations"],
    queryFn: async (): Promise<RecRow[]> => {
      const { data, error } = await supabase
        .from("process_agent_recommendations" as any)
        .select("process_id, work_area_id, recommendation, suggested_agent_role, status, generated_at, recruited_at");
      if (error) throw error;
      return (data ?? []) as unknown as RecRow[];
    },
  });

  const usageQ = useQuery({
    queryKey: ["all-process-ai-usage"],
    queryFn: async (): Promise<UsageRow[]> => {
      const { data } = await supabase
        .from("process_ai_usage")
        .select("process_id, has_ai, risk_category");
      return (data ?? []) as unknown as UsageRow[];
    },
  });

  const rows: AgentGovernanceRow[] = useMemo(() => {
    const processes = processesQ.data ?? [];
    const recs = recsQ.data ?? [];
    const usage = usageQ.data ?? [];
    const usageByProcess = new Map(usage.map((u) => [u.process_id, u]));
    const recByProcess = new Map(recs.map((r) => [r.process_id, r]));
    const agentById = new Map<string, AIAgent>(agents.map((a) => [a.id, a]));

    // Alle agenter: satt i arbeid (recruited) + registrerte prototypeagenter.
    const built = buildWorkAreaAgents(agents, processes, recs as any);

    // Foreslåtte agenter som ennå ikke er satt i arbeid tas med som «foreslått».
    const proposed = recs.filter(
      (r) => r.status === "proposed" && r.recommendation !== "manual"
    );
    const byProcessRef = new Map(processes.map((p) => [p.id, p]));
    const proposedRows: WorkAreaAgent[] = [];
    for (const r of proposed) {
      const p = byProcessRef.get(r.process_id);
      if (!p) continue;
      const name = r.suggested_agent_role?.trim() || "Foreslått KI-agent";
      const id = `proposed-${r.process_id}`;
      proposedRows.push({
        id,
        name,
        source: "recruited",
        links: [{ processId: p.id, processName: p.name, workAreaId: p.workAreaId, workAreaName: p.workAreaName }],
      });
    }

    const all = [...built, ...proposedRows];

    return all.map((a) => {
      const established = !a.id.startsWith("proposed-");
      const workAreas = agentWorkAreas(a);
      const processList = a.links.map((l) => ({ id: l.processId, name: l.processName }));
      const usages = processList.map((p) => usageByProcess.get(p.id)).filter(Boolean) as UsageRow[];
      const hasPersonalData = usages.some((u) => u.has_ai);
      const riskCategory = usages.find((u) => u.risk_category)?.risk_category ?? null;
      const recs2 = processList.map((p) => recByProcess.get(p.id)).filter(Boolean) as RecRow[];
      const autonomous = recs2.some((r) => r.recommendation === "autonomous");
      const requiresApproval = !autonomous;
      const local = agentById.get(a.id);
      const hasLogging = local?.audit_logging ?? established;
      const policies = local ? enabledPolicyCount(local.id) : established ? 5 : 0;
      const owner = local?.owner_team || (workAreas[0]?.name ? `${workAreas[0].name} (arbeidsområde)` : "Ikke satt");
      const controlLevel = autonomous ? "Autonom" : "Co-pilot";
      const updatedAt =
        local?.updated_at ??
        recs2.map((r) => r.recruited_at || r.generated_at).filter(Boolean).sort().pop() ??
        null;

      const aiAct = classifyAiAct({ established, hasPersonalData, riskCategory, autonomous });
      const duties = aiActDuties({
        established,
        hasMandate: established,
        requiresApproval,
        hasLogging: !!hasLogging,
      });
      const iso = iso42001Coverage({
        hasWorkArea: workAreas.length > 0,
        hasOwner: !!local?.owner_team,
        hasPolicies: policies > 0,
        riskAssessed: !!riskCategory || hasPersonalData,
        hasSystems: processList.length > 0,
        hasMandate: established,
        hasLogging: !!hasLogging,
        humanConfirmed: established,
      });

      return {
        id: a.id,
        name: a.name,
        source: a.source,
        href: a.href,
        established,
        shared: isSharedAgent(a),
        workAreas,
        processes: processList,
        owner,
        controlLevel,
        hasPersonalData,
        riskCategory,
        autonomous,
        requiresApproval,
        hasLogging: !!hasLogging,
        hasPolicies: policies > 0,
        updatedAt,
        aiAct,
        duties,
        iso,
      };
    }).sort((a, b) => Number(b.established) - Number(a.established) || a.name.localeCompare(b.name, "nb"));
  }, [agents, processesQ.data, recsQ.data, usageQ.data]);

  const summary = useMemo(() => {
    const established = rows.filter((r) => r.established);
    return {
      total: rows.length,
      established: established.length,
      proposed: rows.length - established.length,
      personalData: rows.filter((r) => r.hasPersonalData).length,
      highRisk: rows.filter((r) => r.aiAct.risk === "high" || r.aiAct.risk === "unacceptable").length,
      missingControl: rows.filter((r) => r.duties.some((d) => !d.ok)).length,
    };
  }, [rows]);

  return {
    rows,
    summary,
    isLoading: processesQ.isLoading || recsQ.isLoading || usageQ.isLoading,
  };
}
