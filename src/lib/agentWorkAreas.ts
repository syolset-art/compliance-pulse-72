/**
 * Avleder hvilke arbeidsområder en KI-agent jobber i.
 *
 * Modell B (valgt): en agent eies av prosesser – aldri direkte av et
 * arbeidsområde. Arbeidsområdene følger av prosessene (prosess → system →
 * arbeidsområde). Er agenten koblet til prosesser i flere arbeidsområder,
 * er den «delt».
 *
 * Kilder (prototype, ingen skjemaendring):
 *  1. `process_agent_recommendations` med status `recruited` – «Sett AI i arbeid».
 *     Samme `suggested_agent_role` på flere prosesser = samme agent.
 *  2. Lokale prototype-agenter (`agentMacf`) med `process_names`.
 */

import type { AIAgent } from "@/lib/agentMacf";

export interface ProcessRef {
  id: string;
  name: string;
  workAreaId: string;
  workAreaName: string;
}

export interface AgentProcessLink {
  processId: string;
  processName: string;
  workAreaId: string;
  workAreaName: string;
}

export interface WorkAreaAgent {
  /** Stabil id på tvers av arbeidsområder. */
  id: string;
  name: string;
  /** "mynder" = registrert agent, "recruited" = agent satt i arbeid fra en anbefaling. */
  source: "mynder" | "recruited";
  /** Lenke til agentprofil (kun registrerte agenter). */
  href?: string;
  links: AgentProcessLink[];
}

export interface RecruitedRecommendation {
  process_id: string;
  suggested_agent_role: string | null;
  status: string;
}

const slug = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

/** Bygger agentlisten på tvers av HELE virksomheten. */
export function buildWorkAreaAgents(
  agents: AIAgent[],
  processes: ProcessRef[],
  recruited: RecruitedRecommendation[]
): WorkAreaAgent[] {
  const byId = new Map<string, WorkAreaAgent>();
  const byProcessId = new Map(processes.map((p) => [p.id, p]));
  const byProcessName = new Map<string, ProcessRef[]>();
  for (const p of processes) {
    const key = p.name.trim().toLowerCase();
    byProcessName.set(key, [...(byProcessName.get(key) ?? []), p]);
  }

  const push = (agent: Omit<WorkAreaAgent, "links">, p: ProcessRef) => {
    const existing = byId.get(agent.id) ?? { ...agent, links: [] };
    if (!existing.links.some((l) => l.processId === p.id)) {
      existing.links.push({
        processId: p.id,
        processName: p.name,
        workAreaId: p.workAreaId,
        workAreaName: p.workAreaName,
      });
    }
    byId.set(agent.id, existing);
  };

  for (const a of agents) {
    for (const name of a.process_names ?? []) {
      for (const p of byProcessName.get(name.trim().toLowerCase()) ?? []) {
        push({ id: a.id, name: a.name, source: "mynder", href: `/agents/${a.id}` }, p);
      }
    }
  }

  for (const r of recruited) {
    if (r.status !== "recruited") continue;
    const p = byProcessId.get(r.process_id);
    if (!p) continue;
    const role = r.suggested_agent_role?.trim() || "Mynder-agent";
    push({ id: `recruited-${slug(role)}`, name: role, source: "recruited" }, p);
  }

  return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name, "nb"));
}

/** Unike arbeidsområder agenten jobber i. */
export function agentWorkAreas(agent: WorkAreaAgent): { id: string; name: string }[] {
  const seen = new Map<string, string>();
  for (const l of agent.links) seen.set(l.workAreaId, l.workAreaName);
  return [...seen.entries()].map(([id, name]) => ({ id, name }));
}

export function isSharedAgent(agent: WorkAreaAgent): boolean {
  return agentWorkAreas(agent).length > 1;
}

/** Agenter som jobber i et gitt arbeidsområde (med alle koblingene sine). */
export function agentsForWorkArea(agents: WorkAreaAgent[], workAreaId: string): WorkAreaAgent[] {
  return agents.filter((a) => a.links.some((l) => l.workAreaId === workAreaId));
}
