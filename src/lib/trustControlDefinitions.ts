/**
 * Trust Control Definitions
 * 
 * Generic controls apply to ALL trust profiles.
 * Type-specific controls apply based on asset_type.
 */

// ── Verification & ownership types ───────────────────────────────────

export type ProfileSource = "ai_generated" | "customer_created" | "vendor_claimed";
export type ProfileOwner = "platform" | "customer" | "vendor";
export type ProfileContributor = "ai" | "customer" | "vendor";
export type VerificationSource = "ai_inferred" | "customer_asserted" | "vendor_verified" | "third_party_verified";

export interface TrustProfileMeta {
  profileSource: ProfileSource;
  profileOwner: ProfileOwner;
  contributors: ProfileContributor[];
}

export type TrustControlStatus = "implemented" | "partial" | "missing";

export interface TrustControlDefinition {
  key: string;
  labelEn: string;
  labelNb: string;
  weight: number; // relative weight for score calculation
}

export interface EvaluatedControl extends TrustControlDefinition {
  status: TrustControlStatus;
  verificationSource?: VerificationSource;
}

// ── Verification weight multipliers ──────────────────────────────────
// Higher verification = higher confidence contribution
const VERIFICATION_WEIGHTS: Record<VerificationSource, number> = {
  ai_inferred: 0.5,
  customer_asserted: 0.7,
  vendor_verified: 1.0,
  third_party_verified: 1.0,
};

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

/**
 * Calculate confidence score based on verification levels.
 * Confidence rises when controls are vendor-verified or third-party-verified.
 */
export function calculateConfidenceScore(controls: EvaluatedControl[]): number {
  const implemented = controls.filter((c) => c.status !== "missing");
  if (implemented.length === 0) return 0;
  const totalPossible = implemented.length; // max 1.0 each
  const earned = implemented.reduce((s, c) => {
    const vw = VERIFICATION_WEIGHTS[c.verificationSource || "ai_inferred"];
    return s + vw;
  }, 0);
  return Math.round((earned / totalPossible) * 100);
}

/**
 * Infer TrustProfileMeta from asset data.
 */
export function inferProfileMeta(asset: {
  asset_type?: string;
  metadata?: Record<string, any> | null;
}): TrustProfileMeta {
  const meta = (asset.metadata || {}) as Record<string, any>;

  // Determine source
  const profileSource: ProfileSource =
    meta.profile_source === "vendor_claimed" ? "vendor_claimed"
    : meta.profile_source === "customer_created" ? "customer_created"
    : "ai_generated";

  // Determine owner
  const profileOwner: ProfileOwner =
    meta.profile_owner === "vendor" ? "vendor"
    : meta.profile_owner === "customer" ? "customer"
    : "platform";

  // Contributors – always include AI; add others based on data
  const contributors: ProfileContributor[] = ["ai"];
  if (meta.customer_enriched || meta.profile_source === "customer_created") {
    contributors.push("customer");
  }
  if (meta.vendor_claimed || meta.profile_source === "vendor_claimed") {
    contributors.push("vendor");
  }

  return { profileSource, profileOwner, contributors };
}

/**
 * Infer the verification source for a control based on metadata.
 */
export function inferVerificationSource(
  controlKey: string,
  asset: { metadata?: Record<string, any> | null },
  docsCount: number,
): VerificationSource {
  const meta = (asset.metadata || {}) as Record<string, any>;

  // If the vendor has verified this specific control
  const vendorVerified = meta.vendor_verified_controls as string[] | undefined;
  if (vendorVerified?.includes(controlKey)) return "vendor_verified";

  // If there's third-party certification covering this
  const tpVerified = meta.third_party_verified_controls as string[] | undefined;
  if (tpVerified?.includes(controlKey)) return "third_party_verified";

  // If vendor claimed the profile, controls default to vendor_verified
  if (meta.profile_source === "vendor_claimed") return "vendor_verified";

  // If customer explicitly set data, it's customer_asserted
  if (meta.customer_enriched) return "customer_asserted";

  // Documentation boosts from ai_inferred to customer_asserted
  if (docsCount >= 1 && controlKey === "documentation_available") return "customer_asserted";

  return "ai_inferred";
}
