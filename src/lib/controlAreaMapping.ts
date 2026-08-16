/**
 * Mapping-hjelpere for drill-down på kontrollområde.
 *
 * - Krav plasseres i kontrollområde via `toCanonicalArea(sla_category)`.
 * - Kravkategori grupperes i de fire visningsgruppene brukeren filtrerer på.
 * - Dokumenter (sertifikater, policyer, avtaler, rapporter) plasseres i
 *   riktig kontrollområde ut fra dokumenttype / typegruppe / kildemodul.
 */
import type { ControlAreaKey } from "@/lib/controlAreas";
import { typeGroup, type HubDocument } from "@/lib/documentHub";

export type RequirementCategoryGroup =
  | "organisation"
  | "technical"
  | "physical"
  | "people";

export const REQUIREMENT_CATEGORY_GROUPS: {
  key: RequirementCategoryGroup;
  labelNb: string;
  labelEn: string;
}[] = [
  { key: "organisation", labelNb: "Organisasjon", labelEn: "Organisation" },
  { key: "technical", labelNb: "Teknisk sikkerhet", labelEn: "Technical security" },
  { key: "physical", labelNb: "Fysisk sikkerhet", labelEn: "Physical security" },
  { key: "people", labelNb: "Folk og internt", labelEn: "People & internal" },
];

const CATEGORY_MAP: Record<string, RequirementCategoryGroup> = {
  organizational: "organisation",
  governance: "organisation",
  legal: "organisation",
  technological: "technical",
  physical: "physical",
  people: "people",
};

export function requirementCategoryGroup(
  category: string | null | undefined,
): RequirementCategoryGroup {
  if (!category) return "organisation";
  return CATEGORY_MAP[category] ?? "organisation";
}

export function categoryGroupLabel(
  key: RequirementCategoryGroup,
  isNb: boolean,
): string {
  const g = REQUIREMENT_CATEGORY_GROUPS.find((c) => c.key === key);
  return g ? (isNb ? g.labelNb : g.labelEn) : key;
}

/** Eksplisitt dokumenttype → kontrollområde. */
const DOC_TYPE_AREA: Record<string, ControlAreaKey> = {
  // Personvern
  dpa: "privacy",
  privacy_policy: "privacy",
  data_protection_policy: "privacy",
  ropa: "privacy",
  dpia: "privacy",
  // Identitet og tilgang
  access_policy: "identityAccess",
  mfa_policy: "identityAccess",
  iam_policy: "identityAccess",
  acceptable_use: "identityAccess",
  // Drift og sikkerhet
  iso27001: "operations",
  certification: "operations",
  soc2_report: "operations",
  audit_report: "operations",
  pentest: "operations",
  incident_response: "operations",
  backup_policy: "operations",
  security_policy: "operations",
  // Tredjepart
  contract: "vendor",
  sla: "vendor",
  agreement: "vendor",
  vendor_assessment: "vendor",
  // Styring
  policy: "governance",
  governance_policy: "governance",
};

/**
 * Plasser et hub-dokument i ett av de fem kontrollområdene.
 * Fallback: leverandørdokumenter → tredjepart, ellers styring og ansvar.
 */
export function documentControlArea(doc: HubDocument): ControlAreaKey {
  const explicit = DOC_TYPE_AREA[doc.documentType];
  if (explicit) return explicit;

  const group = typeGroup(doc.documentType);
  if (group === "certification" || group === "report") return "operations";
  if (group === "agreement") return "vendor";
  if (doc.module === "vendor") return "vendor";
  return "governance";
}

/** Dokumenter som teller som «bekreftet dokumentasjon» i Ressurser-fanen. */
export function isResourceDocument(doc: HubDocument): boolean {
  const group = typeGroup(doc.documentType);
  return group !== "other" || doc.module === "trust" || doc.module === "framework";
}
