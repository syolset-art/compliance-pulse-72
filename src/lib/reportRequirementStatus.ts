// Delt statusmodell for PDF-rapporter (samsvarsrapport + enkeltregelverk).
// Bruker de tre statusene brukeren faktisk velger i Manuell dokumentering.
// Prototype: verdiene utledes deterministisk fra krav-ID slik at rapporten
// forteller samme historie som resten av flyten.

import type { ComplianceRequirement } from "@/lib/complianceRequirementsData";
import { toCanonicalArea, type ControlAreaKey } from "@/lib/controlAreas";
import { expectedDocLabel } from "@/lib/frameworkEvidenceExpectations";

export type ReportStatus = "fulfilled" | "not_started" | "not_applicable";

export const REPORT_STATUS_LABEL: Record<ReportStatus, string> = {
  fulfilled: "Ja, dette oppfylles",
  not_started: "Ikke påbegynt",
  not_applicable: "Ikke relevant",
};

export const REPORT_STATUS_COLOR: Record<ReportStatus, [number, number, number]> = {
  fulfilled: [16, 185, 129],
  not_started: [239, 68, 68],
  not_applicable: [140, 140, 140],
};

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 100000;
  return h;
}

export function getReportStatus(req: ComplianceRequirement): ReportStatus {
  const h = hash(req.requirement_id) % 10;
  if (h === 9) return "not_applicable";
  return h < 6 ? "fulfilled" : "not_started";
}

/** Antall bevis (dokumenter) knyttet til kravet. 0 = uten bevis. */
export function getEvidenceCount(req: ComplianceRequirement): number {
  const status = getReportStatus(req);
  if (status !== "fulfilled") return 0;
  const h = hash(req.requirement_id + "e") % 4;
  return h === 0 ? 0 : h; // noen oppfylte krav mangler bevis
}

/** True hvis kundens agent har bekreftet dokumentasjon uten opplastet fil. */
export function isAgentConfirmed(req: ComplianceRequirement): boolean {
  return getEvidenceCount(req) === 0 && hash(req.requirement_id) % 3 === 0;
}

export type EvidenceFilter = "all" | "with" | "without";

export function matchesEvidenceFilter(
  req: ComplianceRequirement,
  filter: EvidenceFilter,
): boolean {
  if (filter === "all") return true;
  const has = getEvidenceCount(req) > 0;
  return filter === "with" ? has : !has;
}

export interface ReportEvidenceRow {
  area: ControlAreaKey;
  docLabel: string;
  frameworkName: string;
  requirementId: string;
  requirementName: string;
  status: "Opplastet" | "Agent-bekreftet" | "Mangler";
}

export function buildReportEvidenceRow(
  req: ComplianceRequirement,
  frameworkName: string,
): ReportEvidenceRow {
  const count = getEvidenceCount(req);
  return {
    area: toCanonicalArea(req.sla_category),
    docLabel: expectedDocLabel(req, true),
    frameworkName,
    requirementId: req.requirement_id,
    requirementName: req.name_no || req.name,
    status: count > 0 ? "Opplastet" : isAgentConfirmed(req) ? "Agent-bekreftet" : "Mangler",
  };
}
