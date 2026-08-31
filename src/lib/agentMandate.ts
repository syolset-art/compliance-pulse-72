/**
 * Agent Access – mandat og tilkoblede agenter (klikkbar prototype).
 *
 * Mandatet beskriver hva en tilkoblet agent får lese og gjøre, og hva som
 * krever brukerens godkjenning. Lagres foreløpig i localStorage; backend
 * (OAuth/OIDC, scope-håndheving og audit-logg) kommer senere.
 */

export type MandateKey =
  | "read"
  | "analyze"
  | "create_activity"
  | "start_playbook"
  | "change_data"
  | "admin";

export interface MandatePermission {
  key: MandateKey;
  label: string;
  description: string;
  /** Standardverdi når en ny kobling opprettes. */
  defaultEnabled: boolean;
  /** Sensitive handlinger kan kreve godkjenning før de utføres. */
  approvable: boolean;
  defaultRequiresApproval: boolean;
}

export const MANDATE_PERMISSIONS: MandatePermission[] = [
  {
    key: "read",
    label: "Lese krav, leverandører og dokumentasjon",
    description: "Agenten kan svare på spørsmål om compliance-grunnlaget ditt.",
    defaultEnabled: true,
    approvable: false,
    defaultRequiresApproval: false,
  },
  {
    key: "analyze",
    label: "Analysere status og foreslå tiltak",
    description: "Agenten kan vurdere status og foreslå hva som bør gjøres.",
    defaultEnabled: true,
    approvable: false,
    defaultRequiresApproval: false,
  },
  {
    key: "create_activity",
    label: "Opprette aktiviteter",
    description: "Agenten kan legge inn aktiviteter og oppfølgingspunkter.",
    defaultEnabled: true,
    approvable: true,
    defaultRequiresApproval: false,
  },
  {
    key: "start_playbook",
    label: "Starte Playbooks",
    description: "Agenten kan sette i gang arbeidsflyter på dine vegne.",
    defaultEnabled: true,
    approvable: true,
    defaultRequiresApproval: true,
  },
  {
    key: "change_data",
    label: "Endre compliance-data",
    description: "Agenten kan oppdatere status og innhold i Mynder.",
    defaultEnabled: true,
    approvable: true,
    defaultRequiresApproval: true,
  },
  {
    key: "admin",
    label: "Administrative handlinger",
    description: "Brukere, roller og innstillinger. Av som standard.",
    defaultEnabled: false,
    approvable: true,
    defaultRequiresApproval: true,
  },
];

export type Mandate = Record<MandateKey, { enabled: boolean; requiresApproval: boolean }>;

export function defaultMandate(): Mandate {
  return MANDATE_PERMISSIONS.reduce((acc, p) => {
    acc[p.key] = { enabled: p.defaultEnabled, requiresApproval: p.defaultRequiresApproval };
    return acc;
  }, {} as Mandate);
}

export function readOnlyMandate(): Mandate {
  const m = defaultMandate();
  (["create_activity", "start_playbook", "change_data", "admin"] as MandateKey[]).forEach((k) => {
    m[k] = { ...m[k], enabled: false };
  });
  return m;
}

/** Kort, lesbart sammendrag av mandatet – brukes i oppsummering og listevisning. */
export function mandateSummary(mandate: Mandate): string {
  const on = MANDATE_PERMISSIONS.filter((p) => mandate[p.key]?.enabled);
  const writes = on.filter((p) => p.key !== "read" && p.key !== "analyze");
  if (writes.length === 0) return "Kun lesetilgang";
  const short: Record<MandateKey, string> = {
    read: "lese",
    analyze: "analysere",
    create_activity: "opprette aktiviteter",
    start_playbook: "starte Playbooks",
    change_data: "endre data",
    admin: "administrere",
  };
  return `Lese + ${writes.map((p) => short[p.key]).join(", ")}`;
}

export function approvalSummary(mandate: Mandate): string {
  const needs = MANDATE_PERMISSIONS.filter(
    (p) => mandate[p.key]?.enabled && mandate[p.key]?.requiresApproval,
  );
  if (needs.length === 0) return "Ingen handlinger krever godkjenning";
  return `Kreves før ${needs
    .map((p) => p.label.toLowerCase())
    .join(" og ")}`;
}

export type AgentClientKind = "claude" | "chatgpt" | "other";
export type ConnectedAgentStatus = "active" | "revoked";

export interface ConnectedAgent {
  id: string;
  name: string;
  client: AgentClientKind;
  status: ConnectedAgentStatus;
  connectedAt: string;
  lastUsedLabel: string;
  mandate: Mandate;
  /** Manuell/avansert oppsett med token i stedet for OAuth. */
  manual?: boolean;
  demo?: boolean;
}

const KEY = "mynder_connected_agents";

function demoAgents(): ConnectedAgent[] {
  const chatgptMandate = defaultMandate();
  chatgptMandate.start_playbook = { enabled: false, requiresApproval: true };
  chatgptMandate.change_data = { enabled: false, requiresApproval: true };

  return [
    {
      id: "demo-chatgpt",
      name: "ChatGPT – jobb-PC",
      client: "chatgpt",
      status: "active",
      connectedAt: "2026-08-12T09:00:00.000Z",
      lastUsedLabel: "Sist brukt i dag",
      mandate: chatgptMandate,
      demo: true,
    },
    {
      id: "demo-claude",
      name: "Claude – privat",
      client: "claude",
      status: "active",
      connectedAt: "2026-07-30T09:00:00.000Z",
      lastUsedLabel: "Sist brukt 28. aug.",
      mandate: readOnlyMandate(),
      demo: true,
    },
  ];
}

export function readConnectedAgents(): ConnectedAgent[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return demoAgents();
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as ConnectedAgent[]) : demoAgents();
  } catch {
    return demoAgents();
  }
}

export function writeConnectedAgents(items: ConnectedAgent[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    /* kun prototypelagring */
  }
  try {
    window.dispatchEvent(new CustomEvent("mynder:agents-change"));
  } catch {
    /* ignorer */
  }
}

export const AGENT_CLIENT_LABEL: Record<AgentClientKind, string> = {
  claude: "Claude",
  chatgpt: "ChatGPT",
  other: "Annen agent",
};
