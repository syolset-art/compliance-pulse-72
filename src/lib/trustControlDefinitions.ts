/**
 * Trust Control Definitions — Risk-Driven Trust Model
 * 
 * Generic controls apply to ALL trust profiles.
 * Type-specific controls apply based on asset_type.
 * Key risks and recommended actions are derived from control status.
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
export type ControlArea = "governance" | "risk_compliance" | "security_posture" | "supplier_governance";
export type RiskSeverity = "high" | "medium" | "low";

export interface TrustControlDefinition {
  key: string;
  labelEn: string;
  labelNb: string;
  weight: number;
  area: ControlArea;
}

export interface EvaluatedControl extends TrustControlDefinition {
  status: TrustControlStatus;
  verificationSource?: VerificationSource;
}

export interface KeyRisk {
  id: string;
  severity: RiskSeverity;
  titleEn: string;
  titleNb: string;
  triggerControlKey: string;
}

export interface RecommendedAction {
  id: string;
  titleEn: string;
  titleNb: string;
  relatedRiskId: string;
  triggerControlKey: string;
}

// ── Verification weight multipliers ──────────────────────────────────
const VERIFICATION_WEIGHTS: Record<VerificationSource, number> = {
  ai_inferred: 0.5,
  customer_asserted: 0.7,
  vendor_verified: 1.0,
  third_party_verified: 1.0,
};

// ── Generic controls (Governance area) ───────────────────────────────
export const GENERIC_CONTROLS: TrustControlDefinition[] = [
  { key: "owner_assigned", labelEn: "Owner assigned", labelNb: "Eier tilordnet", weight: 1, area: "governance" },
  { key: "responsible_person", labelEn: "Responsible person defined", labelNb: "Ansvarlig person definert", weight: 1, area: "governance" },
  { key: "description_defined", labelEn: "Description defined", labelNb: "Beskrivelse definert", weight: 1, area: "governance" },
  { key: "risk_level_defined", labelEn: "Risk level defined", labelNb: "Risikonivå definert", weight: 1, area: "risk_compliance" },
  { key: "criticality_defined", labelEn: "Criticality defined", labelNb: "Kritikalitet definert", weight: 1, area: "risk_compliance" },
  { key: "risk_assessment", labelEn: "Risk assessment performed", labelNb: "Risikovurdering utført", weight: 1, area: "risk_compliance" },
  { key: "review_cycle", labelEn: "Review cycle defined", labelNb: "Gjennomgangssyklus definert", weight: 1, area: "governance" },
  { key: "documentation_available", labelEn: "Documentation available", labelNb: "Dokumentasjon tilgjengelig", weight: 1, area: "governance" },
];

// ── Vendor-specific (Supplier Governance) ────────────────────────────
export const VENDOR_CONTROLS: TrustControlDefinition[] = [
  { key: "dpa_verified", labelEn: "Data processing agreement verified", labelNb: "Databehandleravtale verifisert", weight: 1, area: "supplier_governance" },
  { key: "security_contact", labelEn: "Security contact defined", labelNb: "Sikkerhetskontakt definert", weight: 1, area: "supplier_governance" },
  { key: "sub_processors_disclosed", labelEn: "Sub-processors disclosed", labelNb: "Underleverandører oppgitt", weight: 1, area: "supplier_governance" },
  { key: "vendor_security_review", labelEn: "Vendor security review completed", labelNb: "Leverandørsikkerhetsgjennomgang fullført", weight: 1, area: "supplier_governance" },
];

// ── System-specific (Security Posture) ───────────────────────────────
export const SYSTEM_CONTROLS: TrustControlDefinition[] = [
  { key: "mfa_enabled", labelEn: "Multi-factor authentication enabled", labelNb: "Flerfaktorautentisering aktivert", weight: 1, area: "security_posture" },
  { key: "encryption_enabled", labelEn: "Encryption enabled", labelNb: "Kryptering aktivert", weight: 1, area: "security_posture" },
  { key: "backup_configured", labelEn: "Backup configured", labelNb: "Sikkerhetskopiering konfigurert", weight: 1, area: "security_posture" },
  { key: "security_logging", labelEn: "Security logging enabled", labelNb: "Sikkerhetslogging aktivert", weight: 1, area: "security_posture" },
];

// ── Hardware/asset-specific (Security Posture) ───────────────────────
export const HARDWARE_CONTROLS: TrustControlDefinition[] = [
  { key: "device_encryption", labelEn: "Device encryption enabled", labelNb: "Enhetskryptering aktivert", weight: 1, area: "security_posture" },
  { key: "endpoint_protection", labelEn: "Endpoint protection installed", labelNb: "Endepunktbeskyttelse installert", weight: 1, area: "security_posture" },
  { key: "patch_management", labelEn: "Patch management active", labelNb: "Patchhåndtering aktiv", weight: 1, area: "security_posture" },
];

// ── Organizational unit / self (Governance) ──────────────────────────
export const ORG_CONTROLS: TrustControlDefinition[] = [
  { key: "responsible_manager", labelEn: "Responsible manager assigned", labelNb: "Ansvarlig leder tilordnet", weight: 1, area: "governance" },
  { key: "security_training", labelEn: "Security training completed", labelNb: "Sikkerhetsopplæring gjennomført", weight: 1, area: "governance" },
  { key: "incident_reporting", labelEn: "Incident reporting process defined", labelNb: "Hendelsesrapporteringsprosess definert", weight: 1, area: "risk_compliance" },
];

// ── Risk mapping: control key → risk when missing/partial ────────────
const RISK_MAP: Record<string, { severity: RiskSeverity; titleEn: string; titleNb: string }> = {
  dpa_verified: { severity: "high", titleEn: "No Data Processing Agreement verified — GDPR compliance risk", titleNb: "Ingen databehandleravtale verifisert — GDPR-samsvarsrisiko" },
  encryption_enabled: { severity: "high", titleEn: "Encryption not enabled — data exposure risk", titleNb: "Kryptering ikke aktivert — risiko for dataeksponering" },
  device_encryption: { severity: "high", titleEn: "Device encryption missing — data exposure risk", titleNb: "Enhetskryptering mangler — risiko for dataeksponering" },
  mfa_enabled: { severity: "high", titleEn: "MFA not enabled — account compromise risk", titleNb: "MFA ikke aktivert — risiko for kontokompromittering" },
  vendor_security_review: { severity: "medium", titleEn: "Vendor security review missing — third-party security risk", titleNb: "Leverandørsikkerhetsgjennomgang mangler — tredjepartsrisiko" },
  risk_assessment: { severity: "medium", titleEn: "Risk assessment not performed — unknown risk exposure", titleNb: "Risikovurdering ikke utført — ukjent risikoeksponering" },
  sub_processors_disclosed: { severity: "medium", titleEn: "Sub-processors not disclosed — supply chain risk", titleNb: "Underleverandører ikke oppgitt — leverandørkjederisiko" },
  security_logging: { severity: "medium", titleEn: "Security logging not enabled — incident detection risk", titleNb: "Sikkerhetslogging ikke aktivert — risiko for manglende hendelsesdeteksjon" },
  backup_configured: { severity: "medium", titleEn: "Backup not configured — data loss risk", titleNb: "Sikkerhetskopiering ikke konfigurert — risiko for datatap" },
  endpoint_protection: { severity: "medium", titleEn: "Endpoint protection missing — malware risk", titleNb: "Endepunktbeskyttelse mangler — risiko for skadevare" },
  documentation_available: { severity: "low", titleEn: "Documentation missing — audit readiness risk", titleNb: "Dokumentasjon mangler — risiko for manglende revisjonsberedskap" },
  review_cycle: { severity: "low", titleEn: "Review cycle not defined — compliance drift risk", titleNb: "Gjennomgangssyklus ikke definert — risiko for samsvarsavvik" },
  owner_assigned: { severity: "low", titleEn: "No owner assigned — accountability gap", titleNb: "Ingen eier tilordnet — manglende ansvarsplassering" },
  responsible_person: { severity: "low", titleEn: "Responsible person not defined — governance gap", titleNb: "Ansvarlig person ikke definert — styringsmangler" },
  security_contact: { severity: "low", titleEn: "Security contact not defined — communication gap", titleNb: "Sikkerhetskontakt ikke definert — kommunikasjonsgap" },
  patch_management: { severity: "medium", titleEn: "Patch management not active — vulnerability risk", titleNb: "Patchhåndtering ikke aktiv — sårbarhetssrisiko" },
  security_training: { severity: "low", titleEn: "Security training not completed — awareness gap", titleNb: "Sikkerhetsopplæring ikke gjennomført — bevissthetsgap" },
  incident_reporting: { severity: "medium", titleEn: "Incident reporting process not defined — response gap", titleNb: "Hendelsesrapporteringsprosess ikke definert — responsgap" },
};

// ── Action mapping: control key → recommended action ─────────────────
const ACTION_MAP: Record<string, { titleEn: string; titleNb: string }> = {
  dpa_verified: { titleEn: "Request updated Data Processing Agreement", titleNb: "Be om oppdatert databehandleravtale" },
  encryption_enabled: { titleEn: "Enable encryption for this system", titleNb: "Aktiver kryptering for dette systemet" },
  device_encryption: { titleEn: "Enable device encryption", titleNb: "Aktiver enhetskryptering" },
  mfa_enabled: { titleEn: "Enable multi-factor authentication", titleNb: "Aktiver flerfaktorautentisering" },
  vendor_security_review: { titleEn: "Complete vendor security review", titleNb: "Fullfør leverandørsikkerhetsgjennomgang" },
  risk_assessment: { titleEn: "Complete risk assessment", titleNb: "Fullfør risikovurdering" },
  sub_processors_disclosed: { titleEn: "Request sub-processor disclosure from vendor", titleNb: "Be om underleverandøroversikt fra leverandør" },
  security_logging: { titleEn: "Enable security logging", titleNb: "Aktiver sikkerhetslogging" },
  backup_configured: { titleEn: "Configure backup solution", titleNb: "Konfigurer sikkerhetskopiering" },
  endpoint_protection: { titleEn: "Install endpoint protection", titleNb: "Installer endepunktbeskyttelse" },
  documentation_available: { titleEn: "Upload security documentation", titleNb: "Last opp sikkerhetsdokumentasjon" },
  review_cycle: { titleEn: "Define review cycle", titleNb: "Definer gjennomgangssyklus" },
  owner_assigned: { titleEn: "Assign an owner", titleNb: "Tilordne en eier" },
  responsible_person: { titleEn: "Define responsible person", titleNb: "Definer ansvarlig person" },
  security_contact: { titleEn: "Define security contact", titleNb: "Definer sikkerhetskontakt" },
  patch_management: { titleEn: "Activate patch management", titleNb: "Aktiver patchhåndtering" },
  security_training: { titleEn: "Complete security training", titleNb: "Fullfør sikkerhetsopplæring" },
  incident_reporting: { titleEn: "Define incident reporting process", titleNb: "Definer hendelsesrapporteringsprosess" },
};

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
 */
export function calculateConfidenceScore(controls: EvaluatedControl[]): number {
  const implemented = controls.filter((c) => c.status !== "missing");
  if (implemented.length === 0) return 0;
  const totalPossible = implemented.length;
  const earned = implemented.reduce((s, c) => {
    const vw = VERIFICATION_WEIGHTS[c.verificationSource || "ai_inferred"];
    return s + vw;
  }, 0);
  return Math.round((earned / totalPossible) * 100);
}

/**
 * Derive key risks from evaluated controls.
 */
export function deriveKeyRisks(controls: EvaluatedControl[]): KeyRisk[] {
  const risks: KeyRisk[] = [];
  for (const c of controls) {
    if (c.status === "implemented") continue;
    const mapping = RISK_MAP[c.key];
    if (!mapping) continue;
    risks.push({
      id: `risk-${c.key}`,
      severity: mapping.severity,
      titleEn: mapping.titleEn,
      titleNb: mapping.titleNb,
      triggerControlKey: c.key,
    });
  }
  // Sort: high → medium → low
  const order: Record<RiskSeverity, number> = { high: 0, medium: 1, low: 2 };
  return risks.sort((a, b) => order[a.severity] - order[b.severity]);
}

/**
 * Derive recommended actions from key risks.
 */
export function deriveRecommendedActions(risks: KeyRisk[]): RecommendedAction[] {
  return risks
    .map((r) => {
      const action = ACTION_MAP[r.triggerControlKey];
      if (!action) return null;
      return {
        id: `action-${r.triggerControlKey}`,
        titleEn: action.titleEn,
        titleNb: action.titleNb,
        relatedRiskId: r.id,
        triggerControlKey: r.triggerControlKey,
      };
    })
    .filter(Boolean) as RecommendedAction[];
}

/**
 * Generate AI insight summary text.
 */
export function generateAISummary(
  trustScore: number,
  confidenceScore: number,
  risks: KeyRisk[],
  actions: RecommendedAction[],
  assetType: string,
  isNb: boolean,
): string {
  const confidenceLevel = confidenceScore >= 80 ? (isNb ? "høy" : "high") : confidenceScore >= 50 ? (isNb ? "middels" : "medium") : (isNb ? "lav" : "low");
  const typeLabel = isNb
    ? (assetType === "vendor" ? "leverandørprofil" : assetType === "system" ? "systemprofil" : assetType === "hardware" ? "enhetsprofil" : "organisasjonsprofil")
    : (assetType === "vendor" ? "vendor profile" : assetType === "system" ? "system profile" : assetType === "hardware" ? "device profile" : "organization profile");

  const highRisks = risks.filter((r) => r.severity === "high");
  const topRisk = highRisks.length > 0 ? highRisks[0] : risks[0];
  const topAction = actions[0];

  const parts: string[] = [];

  if (isNb) {
    parts.push(`Denne ${typeLabel}en har ${confidenceLevel} verifiseringsgrad (${confidenceScore}%).`);
    if (topRisk) parts.push(`Den viktigste risikoen er: ${topRisk.titleNb.toLowerCase()}.`);
    if (topAction) parts.push(`Anbefalt handling: ${topAction.titleNb.toLowerCase()}.`);
    if (risks.length === 0) parts.push("Ingen kritiske risikoer identifisert.");
  } else {
    parts.push(`This ${typeLabel} has ${confidenceLevel} verification confidence (${confidenceScore}%).`);
    if (topRisk) parts.push(`The most important risk is: ${topRisk.titleEn.toLowerCase()}.`);
    if (topAction) parts.push(`Recommended action: ${topAction.titleEn.toLowerCase()}.`);
    if (risks.length === 0) parts.push("No critical risks identified.");
  }

  return parts.join(" ");
}

/**
 * Infer TrustProfileMeta from asset data.
 */
export function inferProfileMeta(asset: {
  asset_type?: string;
  metadata?: Record<string, any> | null;
}): TrustProfileMeta {
  const meta = (asset.metadata || {}) as Record<string, any>;
  const profileSource: ProfileSource =
    meta.profile_source === "vendor_claimed" ? "vendor_claimed"
    : meta.profile_source === "customer_created" ? "customer_created"
    : "ai_generated";
  const profileOwner: ProfileOwner =
    meta.profile_owner === "vendor" ? "vendor"
    : meta.profile_owner === "customer" ? "customer"
    : "platform";
  const contributors: ProfileContributor[] = ["ai"];
  if (meta.customer_enriched || meta.profile_source === "customer_created") contributors.push("customer");
  if (meta.vendor_claimed || meta.profile_source === "vendor_claimed") contributors.push("vendor");
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
  const vendorVerified = meta.vendor_verified_controls as string[] | undefined;
  if (vendorVerified?.includes(controlKey)) return "vendor_verified";
  const tpVerified = meta.third_party_verified_controls as string[] | undefined;
  if (tpVerified?.includes(controlKey)) return "third_party_verified";
  if (meta.profile_source === "vendor_claimed") return "vendor_verified";
  if (meta.customer_enriched) return "customer_asserted";
  if (docsCount >= 1 && controlKey === "documentation_available") return "customer_asserted";
  return "ai_inferred";
}

/**
 * Group controls by area.
 */
export function groupControlsByArea(controls: EvaluatedControl[]): Record<ControlArea, EvaluatedControl[]> {
  const grouped: Record<ControlArea, EvaluatedControl[]> = {
    governance: [],
    risk_compliance: [],
    security_posture: [],
    supplier_governance: [],
  };
  for (const c of controls) {
    grouped[c.area].push(c);
  }
  return grouped;
}

/**
 * Navigation map: control key → profile tab (or "_header:field" for header-level fields).
 */
export const CONTROL_NAV_MAP: Record<string, string> = {
  owner_assigned: "_header:work_area",
  responsible_person: "_header:asset_manager",
  description_defined: "_header:description",
  risk_level_defined: "riskManagement",
  criticality_defined: "riskManagement",
  risk_assessment: "riskManagement",
  review_cycle: "validation",
  documentation_available: "documents",
  dpa_verified: "documents",
  security_contact: "_header:contact",
  sub_processors_disclosed: "relations",
  vendor_security_review: "controls",
  mfa_enabled: "controls",
  encryption_enabled: "controls",
  backup_configured: "controls",
  security_logging: "controls",
  device_encryption: "controls",
  endpoint_protection: "controls",
  patch_management: "controls",
  responsible_manager: "_header:asset_manager",
  security_training: "controls",
  incident_reporting: "incidents",
};
