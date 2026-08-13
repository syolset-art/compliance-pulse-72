// Agentisk arbeidskø for regelverk-siden (beta).
// Utledes deterministisk fra samme kravdata som kravlisten bruker, slik at
// tallene i køen stemmer med det brukeren ser når hun åpner et regelverk.

import { getRequirementsByFramework } from "@/lib/complianceRequirementsData";
import { ALL_ADDITIONAL_REQUIREMENTS } from "@/lib/additionalFrameworkRequirements";
import type { ComplianceRequirement } from "@/lib/complianceRequirementsData";
import { agentConfirmedRequirementIds } from "@/lib/frameworkEvidenceExpectations";
import { demoUiStateFor, normalizeProgress } from "@/lib/requirementStatusModel";
import type { Framework } from "@/lib/frameworkDefinitions";

export type RegulationQueueKind = "approve_evidence" | "confirm_status" | "missing_basis";

export interface RegulationQueueItem {
  id: string;
  kind: RegulationQueueKind;
  frameworkId: string;
  frameworkName: string;
  /** Hva Lara har gjort / hva som venter. */
  title: string;
  /** Kort begrunnelse — hvorfor dette ligger i køen. */
  rationale: string;
  /** Antall krav dette gjelder. */
  count: number;
}

export interface FrameworkAgentStats {
  frameworkId: string;
  total: number;
  met: number;
  /** Krav Lara følger opp / har bekreftet automatisk. */
  agentFollowUp: number;
  /** Krav som venter på brukeren. */
  waitingYou: number;
  percent: number;
}

export function getFrameworkRequirements(frameworkId: string): ComplianceRequirement[] {
  const main = getRequirementsByFramework(frameworkId);
  if (main.length > 0) return main;
  return ALL_ADDITIONAL_REQUIREMENTS.filter((r) => r.framework_id === frameworkId);
}

export function getFrameworkAgentStats(frameworkId: string): FrameworkAgentStats {
  const reqs = getFrameworkRequirements(frameworkId);
  const agentConfirmed = agentConfirmedRequirementIds(reqs, () => false);
  let met = 0;
  let agentFollowUp = 0;
  let waitingYou = 0;
  reqs.forEach((r) => {
    const isAgent = agentConfirmed.has(r.requirement_id);
    const progress = isAgent ? "fulfilled" : demoUiStateFor(r.requirement_id).progress;
    const fulfilled = normalizeProgress(progress) === "fulfilled";
    if (fulfilled) met++;
    if (isAgent) agentFollowUp++;
    else if (!fulfilled) waitingYou++;
  });
  return {
    frameworkId,
    total: reqs.length,
    met,
    agentFollowUp,
    waitingYou,
    percent: reqs.length > 0 ? Math.round((met / reqs.length) * 100) : 0,
  };
}

/** Hva Lara har gjort siden sist — oppsummert over alle aktive regelverk. */
export function summarizeAgentWork(frameworkIds: string[]) {
  let analysed = 0;
  let confirmed = 0;
  let waitingYou = 0;
  frameworkIds.forEach((id) => {
    const s = getFrameworkAgentStats(id);
    analysed += s.total;
    confirmed += s.agentFollowUp;
    waitingYou += s.waitingYou;
  });
  return { frameworks: frameworkIds.length, analysed, confirmed, waitingYou };
}

/** Bygger maks tre køkort på tvers av aktive regelverk. */
export function buildRegulationsQueue(activeFrameworks: Framework[]): RegulationQueueItem[] {
  const items: RegulationQueueItem[] = [];

  activeFrameworks.forEach((fw) => {
    const reqs = getFrameworkRequirements(fw.id);
    if (reqs.length === 0) return;
    const stats = getFrameworkAgentStats(fw.id);
    const agentConfirmed = agentConfirmedRequirementIds(reqs, () => false);
    const firstAgent = reqs.find((r) => agentConfirmed.has(r.requirement_id));

    if (stats.agentFollowUp > 0 && firstAgent) {
      items.push({
        id: `${fw.id}-evidence`,
        kind: "approve_evidence",
        frameworkId: fw.id,
        frameworkName: fw.name,
        title: `Godkjenn bevis — ${firstAgent.name_no}`,
        rationale: `Jeg fant dokumentasjon som dekker ${stats.agentFollowUp} krav i ${fw.name}. Du bekrefter, så settes status.`,
        count: stats.agentFollowUp,
      });
    }

    const autoNotMet = reqs.filter(
      (r) =>
        !agentConfirmed.has(r.requirement_id) &&
        r.agent_capability === "full" &&
        normalizeProgress(demoUiStateFor(r.requirement_id).progress) !== "fulfilled",
    );
    if (autoNotMet.length > 0) {
      items.push({
        id: `${fw.id}-status`,
        kind: "confirm_status",
        frameworkId: fw.id,
        frameworkName: fw.name,
        title: `Bekreft foreslått status — ${autoNotMet[0].name_no}`,
        rationale: `Jeg har utkast til ${autoNotMet.length} krav i ${fw.name} basert på data i plattformen.`,
        count: autoNotMet.length,
      });
    }

    if (stats.waitingYou > 0) {
      items.push({
        id: `${fw.id}-basis`,
        kind: "missing_basis",
        frameworkId: fw.id,
        frameworkName: fw.name,
        title: `Mangler grunnlag — ${fw.name}`,
        rationale: `Jeg finner ikke dokumentasjon for ${stats.waitingYou} krav. Last opp eller beskriv hvordan dere løser dette.`,
        count: stats.waitingYou,
      });
    }
  });

  // Prioritet: godkjenn bevis → bekreft status → manglende grunnlag.
  const order: Record<RegulationQueueKind, number> = {
    approve_evidence: 0,
    confirm_status: 1,
    missing_basis: 2,
  };
  return items.sort((a, b) => order[a.kind] - order[b.kind] || b.count - a.count).slice(0, 3);
}
