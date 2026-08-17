/**
 * MCP-agentkoblinger: kundens egne agenter kobles til Mynder slik at Lara kan
 * hente leverandørdata virksomheten allerede har i egen infrastruktur.
 *
 * Prototypelagring: localStorage (samme mønster som agenticTrustCenter.ts).
 */

export type McpConnectionStatus = "active" | "pending" | "failed";

export interface McpAgentConnection {
  id: string;
  name: string;
  url: string;
  description?: string;
  status: McpConnectionStatus;
  createdAt: string;
  lastUsedAt?: string;
}

export const MCP_STATUS_LABEL: Record<McpConnectionStatus, { nb: string; en: string }> = {
  active: { nb: "Aktiv", en: "Active" },
  pending: { nb: "Venter", en: "Pending" },
  failed: { nb: "Feilet", en: "Failed" },
};

/** Verktøy Mynder eksponerer mot kundens egne agenter. */
export const MCP_EXPOSED_TOOLS: { name: string; nb: string; en: string }[] = [
  {
    name: "list_vendors",
    nb: "Les leverandører og kritikalitet",
    en: "Read vendors and criticality",
  },
  {
    name: "get_documentation_status",
    nb: "Les dokumentasjonsstatus per regelverk",
    en: "Read documentation status per framework",
  },
  {
    name: "create_activity",
    nb: "Opprett aktivitet på en leverandør",
    en: "Create an activity on a vendor",
  },
  {
    name: "list_requirements",
    nb: "Les krav og artikler i aktiverte regelverk",
    en: "Read requirements and articles in activated regulations",
  },
  {
    name: "report_document_coverage",
    nb: "Rapporter dekningsgrad for dokumentasjon i egen infrastruktur",
    en: "Report documentation coverage from your own infrastructure",
  },
];

const KEY = "mynder_mcp_agent_connections";

export function readMcpConnections(): McpAgentConnection[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as McpAgentConnection[]) : [];
  } catch {
    return [];
  }
}

export function writeMcpConnections(items: McpAgentConnection[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    /* ignorer — kun prototypelagring */
  }
}

export function mcpServerUrl() {
  const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID;
  if (projectRef) {
    return `https://${projectRef}.supabase.co/functions/v1/mcp`;
  }
  return `${window.location.origin}/api/mcp`;
}

export function hasMcpConnections() {
  return readMcpConnections().some((c) => c.status === "active");
}
