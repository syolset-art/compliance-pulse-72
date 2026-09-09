// Prototype-styring for agentflaten: pause alle agenter og hvem som kan opprette dem.
// Lagres lokalt (localStorage) — ingen håndheving i denne runden.

export type WhoCanCreate = "everyone" | "admins" | "admins_and_groups";

export interface AgentGovernanceSettings {
  pausedAll: boolean;
  whoCanCreate: WhoCanCreate;
}

const KEY = "mynder.agents.governance.v1";

const DEFAULTS: AgentGovernanceSettings = {
  pausedAll: false,
  whoCanCreate: "admins",
};

export function loadGovernance(): AgentGovernanceSettings {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULTS;
    return { ...DEFAULTS, ...(JSON.parse(raw) as Partial<AgentGovernanceSettings>) };
  } catch {
    return DEFAULTS;
  }
}

export function saveGovernance(next: AgentGovernanceSettings) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(next));
  window.dispatchEvent(new Event("mynder:agents:governance"));
}

export const whoCanCreateLabel = (v: WhoCanCreate): string => {
  switch (v) {
    case "everyone":
      return "Alle i virksomheten";
    case "admins":
      return "Kun administratorer";
    case "admins_and_groups":
      return "Administratorer og valgte grupper";
  }
};
