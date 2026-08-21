import { useCallback, useEffect, useMemo, useState } from "react";

/**
 * Agent-leverte kravfunn: dokumentasjon funnet i kundens egen infrastruktur
 * av Sara (lokal agent) eller kundens egen agent via MCP. Selve dokumentet
 * forlater aldri kunden — kun dokument-ID, hash og kilde sendes til Mynder.
 *
 * Demodata + godkjenningsflyt. Beslutninger lagres i localStorage.
 */

export type AgentChannel = "sara" | "mcp";
export type AgentApproval = "pre_approved_at_source" | "awaiting_approval";
export type AgentDecision = "approved" | "rejected";

/** Løst status for et funn etter at brukerens beslutninger er lagt til. */
export type FindingStatus =
  | "approved_source" // godkjent i kundens system før innsending
  | "approved_mynder" // godkjent av brukeren i Mynder
  | "awaiting" // venter på godkjenning
  | "rejected"; // avvist av brukeren

export interface AgentRequirementFinding {
  requirementId: string;
  /** Navnet på agenten som leverte funnet */
  agentName: string;
  channel: AgentChannel;
  /** Navn og sted hos kunden, f.eks. "Notion / Compliance / ROPA" */
  source: string;
  documentId: string;
  hash: string;
  agentVersion: string;
  /** Visningstekst for leveringstidspunkt */
  deliveredAt: string;
  approval: AgentApproval;
  /** Person / rolle som har verifisert funnet hos kunden */
  verifiedBy: string;
  summaryNb: string;
  summaryEn: string;
}

/** Demofunn på EU AI Act som illustrerer begge godkjenningsstatusene. */
export const AGENT_REQUIREMENT_FINDINGS: AgentRequirementFinding[] = [
  {
    requirementId: "AIACT-Art9",
    agentName: "Sara",
    channel: "sara",
    source: "Notion / AI-styring / Vurdering av grunnleggende rettigheter",
    documentId: "ntn-9a41f2",
    hash: "sha256:7c3d…a118",
    agentVersion: "0.9.2",
    deliveredAt: "I dag 08:47",
    approval: "pre_approved_at_source",
    verifiedBy: "Compliance-ansvarlig, Kunden AS",
    summaryNb:
      "Vurdering av innvirkning på grunnleggende rettigheter er gjennomført for høyrisiko KI-systemene og bekreftet av ansvarlig hos kunden før innsending.",
    summaryEn:
      "Fundamental rights impact assessment completed for the high-risk AI systems and confirmed by the responsible person at the customer before submission.",
  },
  {
    requirementId: "AIACT-Art11",
    agentName: "Nordisk Compliance Bot",
    channel: "mcp",
    source: "SharePoint / Kvalitet / Teknisk dokumentasjon KI-systemer",
    documentId: "sp-77c1e0",
    hash: "sha256:b02e…6f4c",
    agentVersion: "1.4.0",
    deliveredAt: "I dag 07:15",
    approval: "awaiting_approval",
    verifiedBy: "Venter vurdering",
    summaryNb:
      "Teknisk dokumentasjon funnet med beskrivelse av design, utvikling og testing. Dekningen er ikke vurdert av en person hos kunden ennå.",
    summaryEn:
      "Technical documentation found describing design, development and testing. The coverage has not yet been assessed by a person at the customer.",
  },
  {
    requirementId: "AIACT-Art13",
    agentName: "Sara",
    channel: "sara",
    source: "Notion / Produktdokumentasjon / Brukerinformasjon KI-system",
    documentId: "ntn-5d20b7",
    hash: "sha256:e8a1…93d0",
    agentVersion: "0.9.2",
    deliveredAt: "I går 15:58",
    approval: "awaiting_approval",
    verifiedBy: "Produkteier, Kunden AS",
    summaryNb:
      "Brukerinformasjon og åpenhetsdokumentasjon funnet. Dokumentet er datert, men ikke bekreftet som gjeldende versjon av ansvarlig hos kunden.",
    summaryEn:
      "User information and transparency documentation found. The document is dated but not confirmed as the current version by the responsible person at the customer.",
  },
  {
    requirementId: "AIACT-Art72",
    agentName: "Nordisk Compliance Bot",
    channel: "mcp",
    source: "SharePoint / Etterlevelse / Markedsovervåkingsplan",
    documentId: "sp-31f9aa",
    hash: "sha256:44ac…0e71",
    agentVersion: "1.4.0",
    deliveredAt: "I går 11:02",
    approval: "pre_approved_at_source",
    verifiedBy: "Compliance-ansvarlig, Kunden AS",
    summaryNb:
      "Plan for markedsovervåking etter utplassering er funnet og godkjent av compliance-ansvarlig hos kunden før innsending.",
    summaryEn:
      "Post-market monitoring plan found and approved by the compliance lead at the customer before submission.",
  },
];

const DECISIONS_KEY = "mynder.agentFindings.decisions";
const EVENT = "mynder-agent-findings";

export interface FindingDecision {
  decision: AgentDecision;
  at: string; // ISO
}

export function readFindingDecisions(): Record<string, FindingDecision> {
  try {
    const raw = localStorage.getItem(DECISIONS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as Record<string, FindingDecision>) : {};
  } catch {
    return {};
  }
}

function writeFindingDecision(requirementId: string, decision: AgentDecision) {
  const all = readFindingDecisions();
  all[requirementId] = { decision, at: new Date().toISOString() };
  try {
    localStorage.setItem(DECISIONS_KEY, JSON.stringify(all));
  } catch {
    /* demodata */
  }
  window.dispatchEvent(new Event(EVENT));
}

export function getFindingForRequirement(requirementId: string): AgentRequirementFinding | undefined {
  return AGENT_REQUIREMENT_FINDINGS.find((f) => f.requirementId === requirementId);
}

/** Løser funnets effektive status ut fra opprinnelig godkjenning + brukerens beslutning. */
export function resolveFindingStatus(
  finding: AgentRequirementFinding,
  decisions: Record<string, FindingDecision>,
): FindingStatus {
  const d = decisions[finding.requirementId];
  if (d?.decision === "approved") return "approved_mynder";
  if (d?.decision === "rejected") return "rejected";
  // Sara-funn er allerede verifisert i kundens egen infrastruktur av en ansvarlig person
  // og trenger ikke ny godkjenning i Mynder.
  if (finding.channel === "sara") return "approved_source";
  return finding.approval === "pre_approved_at_source" ? "approved_source" : "awaiting";
}

export function useAgentFindings() {
  const [decisions, setDecisions] = useState<Record<string, FindingDecision>>(readFindingDecisions);

  useEffect(() => {
    const sync = () => setDecisions(readFindingDecisions());
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const byRequirement = useMemo(
    () => new Map(AGENT_REQUIREMENT_FINDINGS.map((f) => [f.requirementId, f])),
    [],
  );

  const approve = useCallback((requirementId: string) => writeFindingDecision(requirementId, "approved"), []);
  const reject = useCallback((requirementId: string) => writeFindingDecision(requirementId, "rejected"), []);

  return { decisions, byRequirement, approve, reject };
}
