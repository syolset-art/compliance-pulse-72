import { ALL_COMPLIANCE_REQUIREMENTS } from "./complianceRequirementsData";
import { frameworks } from "./frameworkDefinitions";

/**
 * Låst scope for Sara v1 (BYOA):
 * - Kun Notion som dokumentkilde
 * - Kun manuell start (ingen periodisk kjøring)
 */
export const SARA_SOURCES = ["Notion"] as const;

export const SARA_AGENT_VERSION = "0.9.2";

export interface SaraScopeRequirement {
  id: string;
  title: string;
  /** Hva som teller som oppfyllelse – i klartekst */
  fulfillment: string;
}

/** Kravpakken Sara vurderer i denne versjonen (utvalg fra eksisterende kravdata). */
const PACKAGE_IDS = ["GDPR-Art30", "GDPR-Art32", "GDPR-Art6", "A.5.1", "A.5.10", "A.5.15"];

export function getSaraRequirementPackage(isNb = true): SaraScopeRequirement[] {
  const byId = new Map(ALL_COMPLIANCE_REQUIREMENTS.map((r) => [r.requirement_id, r]));
  return PACKAGE_IDS.flatMap((id) => {
    const r = byId.get(id);
    if (!r) return [];
    return [
      {
        id: `${r.framework_id.toUpperCase()} · ${r.requirement_id}`,
        title: isNb ? r.name_no : r.name,
        fulfillment: isNb
          ? `Et gjeldende, datert dokument i Notion som beskriver: ${r.description_no}`
          : `A current, dated document in Notion describing: ${r.description}`,
      },
    ];
  });
}

/**
 * Regelverksgrunnlaget Mynder forvalter. Viser kun tall og status —
 * aldri kravformuleringer, tolkning eller vekting.
 */
export function getRegulatoryLibraryStats() {
  return {
    requirementCount: ALL_COMPLIANCE_REQUIREMENTS.length,
    frameworkCount: frameworks.length,
    lastUpdated: "2026-08-01",
  };
}
