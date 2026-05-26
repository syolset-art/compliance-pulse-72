// Agentstyring – types, MACF helpers, scoring and demo seed
// Kept local-only (localStorage) in this iteration; Supabase migration noted in plan.

export type AgentKind = "mynder" | "byoa";
export type AgentStatus = "active" | "review" | "inactive" | "pending";
export type MacfLevel = "not_assessed" | "L1" | "L2" | "L3" | "L3_pending";

export interface AIAgent {
  id: string;
  name: string;
  subtitle: string;
  kind: AgentKind;
  provider: string;
  owner_team: string;
  status: AgentStatus;
  macf_level: MacfLevel;
  trust_score: number; // 0..100
  purpose?: string;
  data_scope?: string[];
  tools?: string[];
  audit_logging?: boolean;
  rbac_roles?: string[];
  created_at: string;
  updated_at: string;
}

export const MACF_LEVELS: MacfLevel[] = ["not_assessed", "L1", "L2", "L3", "L3_pending"];

export const macfLabel = (l: MacfLevel): string => {
  switch (l) {
    case "L1": return "L1";
    case "L2": return "L2";
    case "L3": return "L3";
    case "L3_pending": return "L3 venter";
    default: return "Ikke vurdert";
  }
};

export const statusLabel = (s: AgentStatus): string => {
  switch (s) {
    case "active": return "Aktiv";
    case "review": return "Review";
    case "inactive": return "Inaktiv";
    case "pending": return "Venter";
  }
};

// Risk color rule per project memory: ≥75 success, 50-74 warning, <50 destructive
export const trustScoreColor = (score: number): string => {
  if (score >= 75) return "bg-success";
  if (score >= 50) return "bg-warning";
  return "bg-destructive";
};

export const trustScoreTextColor = (score: number): string => {
  if (score >= 75) return "text-success";
  if (score >= 50) return "text-warning";
  return "text-destructive";
};

// MACF level badge style
export const macfBadgeClass = (l: MacfLevel): string => {
  switch (l) {
    case "L1": return "bg-muted text-muted-foreground border-border";
    case "L2": return "bg-success/15 text-success border-success/30";
    case "L3": return "bg-primary/15 text-primary border-primary/30";
    case "L3_pending": return "bg-warning/15 text-warning border-warning/30";
    default: return "bg-muted/60 text-muted-foreground border-border";
  }
};

export const statusBadgeClass = (s: AgentStatus): string => {
  switch (s) {
    case "active": return "bg-success/15 text-success border-success/30";
    case "review": return "bg-warning/15 text-warning border-warning/30";
    case "pending": return "bg-warning/15 text-warning border-warning/30";
    case "inactive": return "bg-muted text-muted-foreground border-border";
  }
};

// --- Demo seed (matches the design reference) ----------------------------------
const now = new Date().toISOString();

export const DEMO_AGENTS: AIAgent[] = [
  {
    id: "lara-vendor-review",
    name: "Lara — Leverandørgjennomgang",
    subtitle: "Automatisk · audit-logging på",
    kind: "mynder",
    provider: "Mynder",
    owner_team: "Compliance",
    status: "active",
    macf_level: "L2",
    trust_score: 92,
    purpose: "Automatisk gjennomgang av leverandørdokumentasjon og risikoflagg.",
    data_scope: ["Leverandørdokumenter", "Risikomatrise", "Kontraktsmetadata"],
    tools: ["doc.search", "vendor.score", "risk.flag"],
    audit_logging: true,
    rbac_roles: ["compliance.read", "vendor.read"],
    created_at: now, updated_at: now,
  },
  {
    id: "lara-access-control",
    name: "Lara — Tilgangskontroll",
    subtitle: "Automatisk · RBAC L2",
    kind: "mynder",
    provider: "Mynder",
    owner_team: "IT-sikkerhet",
    status: "active",
    macf_level: "L2",
    trust_score: 88,
    purpose: "Overvåker rolle- og tilgangsendringer og foreslår tiltak.",
    data_scope: ["Brukerroller", "Audit-logg", "Rettighetsmatrise"],
    tools: ["iam.read", "iam.suggest", "audit.search"],
    audit_logging: true,
    rbac_roles: ["iam.read"],
    created_at: now, updated_at: now,
  },
  {
    id: "lara-policy-agent",
    name: "Lara — Policy-agent",
    subtitle: "Automatisk · venter utvidet tool-sett",
    kind: "mynder",
    provider: "Mynder",
    owner_team: "Compliance",
    status: "review",
    macf_level: "L3_pending",
    trust_score: 61,
    purpose: "Genererer og holder policies oppdatert mot regelverk.",
    data_scope: ["Policy-bibliotek", "Regelverkskart"],
    tools: ["policy.generate", "framework.map"],
    audit_logging: true,
    rbac_roles: ["compliance.write"],
    created_at: now, updated_at: now,
  },
  {
    id: "copilot-m365",
    name: "Copilot for M365",
    subtitle: "Microsoft · IT-avdelingen",
    kind: "byoa",
    provider: "Microsoft",
    owner_team: "IT",
    status: "active",
    macf_level: "L1",
    trust_score: 74,
    purpose: "Generell produktivitets-assistent i Microsoft 365.",
    data_scope: ["E-post", "Dokumenter", "Kalender"],
    tools: ["m365.*"],
    audit_logging: true,
    rbac_roles: ["m365.user"],
    created_at: now, updated_at: now,
  },
  {
    id: "github-copilot",
    name: "GitHub Copilot",
    subtitle: "GitHub · Utviklingsteam",
    kind: "byoa",
    provider: "GitHub",
    owner_team: "Engineering",
    status: "active",
    macf_level: "not_assessed",
    trust_score: 38,
    purpose: "Kodeforslag og refaktorering i utviklingsmiljø.",
    data_scope: ["Kildekode", "Commits"],
    tools: ["code.complete", "code.refactor"],
    audit_logging: false,
    rbac_roles: ["dev.user"],
    created_at: now, updated_at: now,
  },
];

// --- Local persistence ---------------------------------------------------------
const STORAGE_KEY = "mynder.agents.v1";

export function loadAgents(): AIAgent[] {
  if (typeof window === "undefined") return DEMO_AGENTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEMO_AGENTS));
      return DEMO_AGENTS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as AIAgent[];
    return DEMO_AGENTS;
  } catch {
    return DEMO_AGENTS;
  }
}

export function saveAgents(agents: AIAgent[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(agents));
  window.dispatchEvent(new Event("mynder:agents:changed"));
}

export function addAgent(input: Omit<AIAgent, "id" | "created_at" | "updated_at">): AIAgent {
  const agents = loadAgents();
  const id = `agent-${Date.now().toString(36)}`;
  const ts = new Date().toISOString();
  const next: AIAgent = { ...input, id, created_at: ts, updated_at: ts };
  saveAgents([next, ...agents]);
  return next;
}

export function getAgent(id: string): AIAgent | undefined {
  return loadAgents().find((a) => a.id === id);
}

export interface AgentMetrics {
  total: number;
  activeInProduction: number;
  pendingMacf: number;
  byoa: number;
}

export function calcMetrics(agents: AIAgent[]): AgentMetrics {
  return {
    total: agents.length,
    activeInProduction: agents.filter((a) => a.status === "active").length,
    pendingMacf: agents.filter((a) => a.macf_level === "L3_pending" || a.macf_level === "not_assessed" || a.status === "review").length,
    byoa: agents.filter((a) => a.kind === "byoa").length,
  };
}
