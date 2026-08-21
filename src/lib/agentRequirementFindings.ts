import { useCallback, useEffect, useMemo, useState } from "react";

/**
 * Agent-leverte kravfunn (BYOA): dokumentasjon funnet i kundens egen
 * infrastruktur av Sara (lokal agent) eller kundens egen agent via MCP.
 * Selve dokumentet forlater aldri kunden — kun dokument-ID, hash og kilde
 * sendes til Mynder.
 *
 * Godkjenning skjer ALLTID i Mynder-portalen: funn kommer inn som forslag
 * etter innsending, og et navngitt menneske hos kunden må godkjenne dem
 * eksplisitt før de teller som grunnlag eller påvirker skåren.
 * Aldri automatisk — heller ikke for Sara-funn.
 *
 * Demodata + godkjenningsflyt. Beslutninger lagres i localStorage.
 */

export type AgentChannel = "sara" | "mcp";
export type AgentDecision = "approved" | "rejected";

/** Effektiv status for et funn etter at brukerens beslutninger er lagt til. */
export type FindingStatus =
  | "approved_mynder" // godkjent av en navngitt person i Mynder-portalen
  | "awaiting" // forslag — påvirker ikke skåren
  | "rejected"; // avvist av en navngitt person

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
  /** Kort konklusjon fra agenten */
  conclusionNb: string;
  conclusionEn: string;
  /** Begrunnelse / sammendrag av funnet */
  summaryNb: string;
  summaryEn: string;
}

/** Demofunn på EU AI Act — alle kommer inn som forslag som venter godkjenning. */
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
    conclusionNb: "Dokumentasjon funnet — kravet ser dekket ut",
    conclusionEn: "Documentation found — the requirement appears covered",
    summaryNb:
      "Vurdering av innvirkning på grunnleggende rettigheter er funnet for høyrisiko KI-systemene. Agenten har vurdert at innholdet svarer til kravene i artikkel 9, men funnet er ikke godkjent av en person ennå.",
    summaryEn:
      "Fundamental rights impact assessment found for the high-risk AI systems. The agent has assessed that the content meets the requirements of Article 9, but the finding has not yet been approved by a person.",
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
    conclusionNb: "Teknisk dokumentasjon funnet — dekning ikke vurdert",
    conclusionEn: "Technical documentation found — coverage not assessed",
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
    conclusionNb: "Brukerinformasjon funnet — versjon ubekreftet",
    conclusionEn: "User information found — version unconfirmed",
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
    conclusionNb: "Markedsovervåkingsplan funnet",
    conclusionEn: "Post-market monitoring plan found",
    summaryNb:
      "Plan for markedsovervåking etter utplassering er funnet i kundens SharePoint. Dokumentet er ikke gjennomgått av en person hos kunden ennå.",
    summaryEn:
      "Post-market monitoring plan found in the customer's SharePoint. The document has not yet been reviewed by a person at the customer.",
  },
];

const DECISIONS_KEY = "mynder.agentFindings.decisions";
const EVENT = "mynder-agent-findings";

export interface FindingDecision {
  decision: AgentDecision;
  at: string; // ISO
  /** Navn på personen som tok beslutningen i Mynder-portalen */
  by?: string;
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

function writeFindingDecision(requirementId: string, decision: AgentDecision, by?: string) {
  const all = readFindingDecisions();
  all[requirementId] = { decision, at: new Date().toISOString(), by };
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

/**
 * Løser funnets effektive status. ALLE agent-funn (Sara og MCP) er forslag
 * fram til en navngitt person godkjenner dem i Mynder-portalen — ingenting
 * godkjennes automatisk, og ugodkjente funn påvirker ikke skåren.
 */
export function resolveFindingStatus(
  finding: AgentRequirementFinding,
  decisions: Record<string, FindingDecision>,
): FindingStatus {
  const d = decisions[finding.requirementId];
  if (d?.decision === "approved") return "approved_mynder";
  if (d?.decision === "rejected") return "rejected";
  return "awaiting";
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

  const approve = useCallback(
    (requirementId: string, by?: string) => writeFindingDecision(requirementId, "approved", by),
    [],
  );
  const reject = useCallback(
    (requirementId: string, by?: string) => writeFindingDecision(requirementId, "rejected", by),
    [],
  );

  return { decisions, byRequirement, approve, reject };
}
