/**
 * Grunnlinje for antall krav per regelverk.
 *
 * Databasen (`compliance_requirements`) er ennå bare fylt for noen regelverk.
 * For partnerens salgspotensial trenger vi likevel et realistisk kravtall for
 * alle regelverk — ellers vises 0 kr. Tallene under er veiledende estimater
 * og brukes kun når databasen ikke har krav for regelverket.
 */

import { frameworkDocumentationCatalog } from "./requirementDocumentationHints";
import type { RequirementRow } from "./frameworkTaskPackage";

const BASELINE_REQUIREMENTS: Record<string, number> = {
  gdpr: 34,
  personopplysningsloven: 12,
  iso27001: 93,
  iso27701: 49,
  nis2: 42,
  normen: 30,
  nsm: 21,
  "nsm-grunnprinsipper": 21,
  soc2: 33,
  dora: 45,
  cra: 27,
  "ai-act": 38,
  iso42001: 38,
  iso42005: 18,
  "ai-ethics": 14,
  iso9001: 28,
  iso14001: 24,
  iso45001: 26,
  internkontroll: 16,
  arbeidsmiljoloven: 18,
  apenhetsloven: 12,
  hms: 16,
  bokforingsloven: 14,
  hvitvasking: 22,
  csrd: 30,
  "cis-controls": 18,
  "nist-csf": 23,
};

const GENERIC_BASELINE = 20;

/** Veiledende kravtall når databasen mangler krav for regelverket. */
export function baselineRequirementCount(frameworkId: string): number {
  return BASELINE_REQUIREMENTS[frameworkId] ?? GENERIC_BASELINE;
}

/** Faktisk kravtall når vi har det, ellers grunnlinjen. */
export function effectiveRequirementCount(frameworkId: string, dbCount: number) {
  if (dbCount > 0) return { count: dbCount, estimated: false };
  return { count: baselineRequirementCount(frameworkId), estimated: true };
}

/**
 * Syntetiske kravrader slik at oppgavepakken kan bygges, justeres og lagres
 * også for regelverk uten krav i databasen.
 */
export function baselineRequirementRows(frameworkId: string): RequirementRow[] {
  const total = baselineRequirementCount(frameworkId);
  const catalog = frameworkDocumentationCatalog(frameworkId);
  const rows: RequirementRow[] = catalog.slice(0, total).map((entry) => ({
    framework_id: frameworkId,
    requirement_id: entry.requirementId,
    name_no: entry.label,
    category: null,
  }));
  for (let i = rows.length; i < total; i++) {
    rows.push({
      framework_id: frameworkId,
      requirement_id: `Krav ${i + 1}`,
      name_no: `Krav ${i + 1}`,
      category: null,
    });
  }
  return rows;
}
