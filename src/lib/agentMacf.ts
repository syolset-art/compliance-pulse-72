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
  /**
   * Prototype: prosessene agenten jobber på (navn, matches mot system_processes.name).
   * Arbeidsområder avledes fra prosessene – en agent kan derfor være «delt»
   * på tvers av flere arbeidsområder uten egen kobling.
   */
  process_names?: string[];
  /** Fagområde agenten jobber i — viser at dette ikke bare er compliance. */
  domain?: AgentDomain;
  /** Navngitt eier (person), i tillegg til eier-team. */
  owner_name?: string;
  /** Er personopplysninger eller sensitive data involvert? */
  sensitive_data?: boolean;
  /** Livsløp: utkast → i test → aktiv → satt på pause. */
  lifecycle?: AgentLifecycle;
  /** Arbeidskontrakten — hva agenten gjør, kan selv, og må få godkjent. */
  contract?: AgentContract;
  created_at: string;
  updated_at: string;
}

export type AgentDomain = "hr" | "sales" | "comms" | "finance" | "ops" | "compliance";

export type AgentLifecycle = "draft" | "testing" | "active" | "paused";

export interface AgentContract {
  /** Steg for steg — hva jobben består av. */
  steps: string[];
  /** Hva agenten kan gjøre selv. */
  allowed: string[];
  /** Hva som krever menneskelig godkjenning. */
  approvals: string[];
  version: number;
  /** Foreslått av Lara til et menneske har bekreftet. */
  confirmed: boolean;
  confirmed_by?: string;
}

export const DOMAINS: AgentDomain[] = ["hr", "sales", "comms", "finance", "ops", "compliance"];

export const domainLabel = (d: AgentDomain): string => {
  switch (d) {
    case "hr": return "HR og personal";
    case "sales": return "Salg";
    case "comms": return "Kommunikasjon";
    case "finance": return "Økonomi";
    case "ops": return "Drift";
    case "compliance": return "Etterlevelse";
  }
};

export const domainBadgeClass = (d: AgentDomain): string => {
  switch (d) {
    case "hr": return "bg-primary/10 text-primary border-primary/25";
    case "sales": return "bg-success/10 text-success border-success/25";
    case "comms": return "bg-warning/10 text-warning border-warning/25";
    case "finance": return "bg-primary/10 text-primary border-primary/25";
    case "ops": return "bg-muted text-muted-foreground border-border";
    case "compliance": return "bg-muted text-muted-foreground border-border";
  }
};

export const lifecycleLabel = (l: AgentLifecycle): string => {
  switch (l) {
    case "draft": return "Utkast";
    case "testing": return "I test";
    case "active": return "Aktiv";
    case "paused": return "Satt på pause";
  }
};


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
  {
    id: "lara-document-assistant",
    name: "Lara — Dokumentassistent",
    subtitle: "Co-pilot · henter og sorterer bilag og meldinger",
    kind: "mynder",
    provider: "Mynder",
    owner_team: "Økonomi",
    status: "active",
    macf_level: "L2",
    trust_score: 81,
    purpose: "Finner, sorterer og forbereder dokumenter for menneskelig kontroll i flere arbeidsområder.",
    data_scope: ["Fakturaer", "Bilag", "Kanalmeldinger"],
    tools: ["doc.search", "doc.classify"],
    audit_logging: true,
    rbac_roles: ["finance.read", "collab.read"],
    process_names: ["Leverandørfaktura", "Bruk av Slack"],
    created_at: now, updated_at: now,
  },
  {
    id: "onboarding-assistant",
    name: "Onboarding-assistent",
    subtitle: "HR · klargjør alt en ny ansatt trenger",
    kind: "mynder",
    provider: "Mynder",
    owner_team: "HR",
    owner_name: "Kari Nordmann",
    domain: "hr",
    lifecycle: "active",
    sensitive_data: true,
    status: "active",
    macf_level: "L2",
    trust_score: 78,
    purpose: "Samler utstyr, tilganger og dokumenter før første arbeidsdag.",
    data_scope: ["Ansattopplysninger", "Tilgangslister"],
    tools: ["hr.read", "task.create"],
    audit_logging: true,
    rbac_roles: ["hr.user"],
    process_names: ["Onboarding av ansatt"],
    contract: {
      steps: [
        "Fanger opp ny ansettelse",
        "Lager sjekkliste for utstyr og tilganger",
        "Varsler leder og IT",
        "Følger opp åpne punkter",
      ],
      allowed: ["Lese ansattdata", "Opprette oppgaver", "Sende påminnelser"],
      approvals: ["Tildeling av tilganger", "Utsending til den ansatte"],
      version: 1,
      confirmed: true,
      confirmed_by: "Kari Nordmann",
    },
    created_at: now, updated_at: now,
  },
  {
    id: "offer-draft-agent",
    name: "Tilbudsutkast",
    subtitle: "Salg · skriver førsteutkast til tilbud",
    kind: "mynder",
    provider: "Mynder",
    owner_team: "Salg",
    owner_name: "Jonas Berg",
    domain: "sales",
    lifecycle: "testing",
    sensitive_data: false,
    status: "review",
    macf_level: "L1",
    trust_score: 62,
    purpose: "Lager utkast til tilbud basert på tidligere leveranser og prisliste.",
    data_scope: ["Kundedialog", "Prisliste"],
    tools: ["crm.read", "doc.draft"],
    audit_logging: true,
    rbac_roles: ["sales.user"],
    process_names: ["Tilbudsprosess"],
    contract: {
      steps: ["Leser forespørselen", "Henter tidligere tilbud", "Skriver utkast", "Legger til godkjenning"],
      allowed: ["Lese CRM", "Skrive utkast"],
      approvals: ["Sending til kunde", "Endring av pris"],
      version: 1,
      confirmed: false,
    },
    created_at: now, updated_at: now,
  },
  {
    id: "content-calendar-agent",
    name: "Innholdskalender",
    subtitle: "Kommunikasjon · planlegger og forbereder innhold",
    kind: "mynder",
    provider: "Mynder",
    owner_team: "Kommunikasjon",
    owner_name: "Ada Lie",
    domain: "comms",
    lifecycle: "draft",
    sensitive_data: false,
    status: "pending",
    macf_level: "not_assessed",
    trust_score: 48,
    purpose: "Foreslår innhold og klargjør utkast til publisering.",
    data_scope: ["Kampanjeplaner"],
    tools: ["doc.draft"],
    audit_logging: false,
    rbac_roles: ["comms.user"],
    contract: {
      steps: ["Foreslår temaer", "Lager utkast", "Legger i kalender"],
      allowed: ["Lese kampanjeplan", "Skrive utkast"],
      approvals: ["Publisering"],
      version: 1,
      confirmed: false,
    },
    created_at: now, updated_at: now,
  },
  {
    id: "vendor-review-agent",
    name: "Leverandørgjennomgang",
    subtitle: "Etterlevelse · forbereder årlig gjennomgang",
    kind: "mynder",
    provider: "Mynder",
    owner_team: "Etterlevelse",
    owner_name: "Vilde Haug",
    domain: "compliance",
    lifecycle: "active",
    sensitive_data: false,
    status: "active",
    macf_level: "L2",
    trust_score: 80,
    purpose: "Samler dokumentasjon og peker på hull før leverandørgjennomgang.",
    data_scope: ["Leverandørdokumenter"],
    tools: ["doc.search", "doc.classify"],
    audit_logging: true,
    rbac_roles: ["compliance.user"],
    process_names: ["Leverandøroppfølging"],
    contract: {
      steps: ["Henter dokumentasjon", "Sammenligner mot krav", "Lager gjennomgangsnotat"],
      allowed: ["Lese dokumenter", "Lage notat"],
      approvals: ["Konklusjon om leverandøren"],
      version: 2,
      confirmed: true,
      confirmed_by: "Vilde Haug",
    },
    created_at: now, updated_at: now,
  },
  {
    id: "invoice-control-agent",
    name: "Fakturakontroll",
    subtitle: "Økonomi · kontrollerer leverandørfaktura",
    kind: "mynder",
    provider: "Mynder",
    owner_team: "Økonomi",
    owner_name: "Per Olsen",
    domain: "finance",
    lifecycle: "active",
    sensitive_data: false,
    status: "active",
    macf_level: "L2",
    trust_score: 83,
    purpose: "Kontrollerer faktura mot avtale og bestilling før godkjenning.",
    data_scope: ["Fakturaer", "Avtaler"],
    tools: ["doc.search", "invoice.match"],
    audit_logging: true,
    rbac_roles: ["finance.user"],
    process_names: ["Leverandørfaktura", "Leverandøroppfølging"],
    contract: {
      steps: ["Leser faktura", "Matcher mot avtale", "Flagger avvik", "Sender til godkjenning"],
      allowed: ["Lese faktura og avtale", "Flagge avvik"],
      approvals: ["Godkjenning av betaling"],
      version: 1,
      confirmed: true,
      confirmed_by: "Per Olsen",
    },
    created_at: now, updated_at: now,
  },
];


/**
 * Sørger for at demo-agenter som er lagt til senere (f.eks. den delte
 * dokumentassistenten) også finnes hos brukere med eldre localStorage-data.
 */
function mergeDemoSeed(stored: AIAgent[]): AIAgent[] {
  const ids = new Set(stored.map((a) => a.id));
  const missing = DEMO_AGENTS.filter((d) => !ids.has(d.id));
  return missing.length ? [...stored, ...missing] : stored;
}

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
    if (Array.isArray(parsed)) return mergeDemoSeed(parsed as AIAgent[]);
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
