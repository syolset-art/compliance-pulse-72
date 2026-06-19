/**
 * Knytter aktiverte regelverk til kontrollpunktene per kontrollområde.
 * Holdes adskilt fra controlAreas.ts for å unngå sirkulære imports
 * (controlAreas.ts brukes vidt og bredt; krav-data er tunge).
 */
import { ALL_COMPLIANCE_REQUIREMENTS, type ComplianceRequirement } from "./complianceRequirementsData";
import { ALL_ADDITIONAL_REQUIREMENTS } from "./additionalFrameworkRequirements";
import { toCanonicalArea, CONTROL_AREA_KEYS, type ControlAreaKey } from "./controlAreas";

const ALL_REQUIREMENTS: ComplianceRequirement[] = [
  ...ALL_COMPLIANCE_REQUIREMENTS,
  ...ALL_ADDITIONAL_REQUIREMENTS,
];

export interface AreaRequirementBreakdown {
  area: ControlAreaKey;
  /** Totalt antall kontrollpunkter på tvers av aktive regelverk i dette området. */
  total: number;
  /** Antall kontrollpunkter per framework_id. */
  byFramework: Record<string, number>;
  /** Alle requirements som inngår — for tabellvisning. */
  requirements: ComplianceRequirement[];
}

/**
 * Returner kontrollpunkt-fordeling per kontrollområde basert på aktive regelverk.
 * Tomt resultat hvis ingen regelverk er aktive.
 */
export function getActiveControlPointsByArea(
  activeFrameworkIds: string[]
): Record<ControlAreaKey, AreaRequirementBreakdown> {
  const active = new Set(activeFrameworkIds);
  const empty: Record<ControlAreaKey, AreaRequirementBreakdown> = {} as never;
  for (const key of CONTROL_AREA_KEYS) {
    empty[key] = { area: key, total: 0, byFramework: {}, requirements: [] };
  }
  for (const req of ALL_REQUIREMENTS) {
    if (!active.has(req.framework_id)) continue;
    const area = toCanonicalArea(req.sla_category);
    const bucket = empty[area];
    bucket.requirements.push(req);
    bucket.total += 1;
    bucket.byFramework[req.framework_id] =
      (bucket.byFramework[req.framework_id] || 0) + 1;
  }
  return empty;
}

/**
 * Per-punkt-vekt (vekting). MVP: alle teller likt (1.0).
 * TODO (dynamisk – Mynders scoringsmodell):
 * Vektingen er en dynamisk verdi som skal hentes fra Mynders scoringsmodell.
 * Kan senere kobles til `priority` (critical=2, high=1.5, medium=1, low=0.5),
 * spesifikke regelverk-avhengigheter, eller dynamiske risikovurderinger fra Lara.
 */
export function getRequirementWeight(_req: ComplianceRequirement): number {
  return 1.0;
}
