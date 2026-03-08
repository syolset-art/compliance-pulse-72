/**
 * Trust Control Definitions
 * 
 * Generic controls apply to ALL trust profiles.
 * Type-specific controls apply based on asset_type.
 */

export type TrustControlStatus = "implemented" | "partial" | "missing";

export interface TrustControlDefinition {
  key: string;
  labelEn: string;
  labelNb: string;
  weight: number; // relative weight for score calculation
}

export interface EvaluatedControl extends TrustControlDefinition {
  status: TrustControlStatus;
}

// ── Generic controls (apply to every object) ──────────────────────────
export const GENERIC_CONTROLS: TrustControlDefinition[] = [
  { key: "owner_assigned", labelEn: "Owner assigned", labelNb: "Eier tilordnet", weight: 1 },
  { key: "responsible_person", labelEn: "Responsible person defined", labelNb: "Ansvarlig person definert", weight: 1 },
  { key: "description_defined", labelEn: "Description defined", labelNb: "Beskrivelse definert", weight: 1 },
  { key: "risk_level_defined", labelEn: "Risk level defined", labelNb: "Risikonivå definert", weight: 1 },
  { key: "criticality_defined", labelEn: "Criticality defined", labelNb: "Kritikalitet definert", weight: 1 },
  { key: "risk_assessment", labelEn: "Risk assessment performed", labelNb: "Risikovurdering utført", weight: 1 },
  { key: "review_cycle", labelEn: "Review cycle defined", labelNb: "Gjennomgangssyklus definert", weight: 1 },
  { key: "documentation_available", labelEn: "Documentation available", labelNb: "Dokumentasjon tilgjengelig", weight: 1 },
];

// ── Vendor-specific (supplier governance) ────────────────────────────
export const VENDOR_CONTROLS: TrustControlDefinition[] = [
  { key: "dpa_verified", labelEn: "Data processing agreement verified", labelNb: "Databehandleravtale verifisert", weight: 1 },
  { key: "security_contact", labelEn: "Security contact defined", labelNb: "Sikkerhetskontakt definert", weight: 1 },
  { key: "sub_processors_disclosed", labelEn: "Sub-processors disclosed", labelNb: "Underleverandører oppgitt", weight: 1 },
  { key: "vendor_security_review", labelEn: "Vendor security review completed", labelNb: "Leverandørsikkerhetsgjennomgang fullført", weight: 1 },
];

// ── System-specific (security posture) ───────────────────────────────
export const SYSTEM_CONTROLS: TrustControlDefinition[] = [
  { key: "mfa_enabled", labelEn: "Multi-factor authentication enabled", labelNb: "Flerfaktorautentisering aktivert", weight: 1 },
  { key: "encryption_enabled", labelEn: "Encryption enabled", labelNb: "Kryptering aktivert", weight: 1 },
  { key: "backup_configured", labelEn: "Backup configured", labelNb: "Sikkerhetskopiering konfigurert", weight: 1 },
  { key: "security_logging", labelEn: "Security logging enabled", labelNb: "Sikkerhetslogging aktivert", weight: 1 },
];

// ── Hardware/asset-specific (endpoint security) ──────────────────────
export const HARDWARE_CONTROLS: TrustControlDefinition[] = [
  { key: "device_encryption", labelEn: "Device encryption enabled", labelNb: "Enhetskryptering aktivert", weight: 1 },
  { key: "endpoint_protection", labelEn: "Endpoint protection installed", labelNb: "Endepunktbeskyttelse installert", weight: 1 },
  { key: "patch_management", labelEn: "Patch management active", labelNb: "Patchhåndtering aktiv", weight: 1 },
];

// ── Organizational unit / self (governance & awareness) ──────────────
export const ORG_CONTROLS: TrustControlDefinition[] = [
  { key: "responsible_manager", labelEn: "Responsible manager assigned", labelNb: "Ansvarlig leder tilordnet", weight: 1 },
  { key: "security_training", labelEn: "Security training completed", labelNb: "Sikkerhetsopplæring gjennomført", weight: 1 },
  { key: "incident_reporting", labelEn: "Incident reporting process defined", labelNb: "Hendelsesrapporteringsprosess definert", weight: 1 },
];

/**
 * Returns the type-specific controls for a given asset type.
 */
export function getTypeSpecificControls(assetType: string): TrustControlDefinition[] {
  switch (assetType) {
    case "vendor": return VENDOR_CONTROLS;
    case "system": return SYSTEM_CONTROLS;
    case "hardware": return HARDWARE_CONTROLS;
    case "self": return ORG_CONTROLS;
    default: return [];
  }
}

/**
 * Calculate trust score from evaluated controls.
 * implemented = 1, partial = 0.5, missing = 0
 */
export function calculateTrustScore(controls: EvaluatedControl[]): number {
  if (controls.length === 0) return 0;
  const totalWeight = controls.reduce((s, c) => s + c.weight, 0);
  if (totalWeight === 0) return 0;
  const earned = controls.reduce((s, c) => {
    const factor = c.status === "implemented" ? 1 : c.status === "partial" ? 0.5 : 0;
    return s + c.weight * factor;
  }, 0);
  return Math.round((earned / totalWeight) * 100);
}
