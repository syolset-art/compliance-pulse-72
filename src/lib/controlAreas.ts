/**
 * Canonical Control Areas — single source of truth.
 *
 * All Trust Profile views (Trust Center, vendor profiles, MSP customer
 * profiles, dashboards) must use these 5 areas with these exact keys,
 * labels, icons, and order.
 */
import {
  Shield,
  Settings,
  KeyRound,
  Lock,
  Users,
  type LucideIcon,
} from "lucide-react";

export type ControlAreaKey =
  | "governance"
  | "operations"
  | "identityAccess"
  | "privacy"
  | "vendor";

export interface ControlAreaDefinition {
  key: ControlAreaKey;
  labelNb: string;
  labelEn: string;
  descriptionNb: string;
  descriptionEn: string;
  icon: LucideIcon;
  /** Tailwind text-color class for accent (icons, dots) */
  accentClass: string;
  /** Tailwind background class for chart series / progress */
  bgClass: string;
  /** CSS color (HSL token) for charts */
  chartColor: string;
}

export const CONTROL_AREAS: ControlAreaDefinition[] = [
  {
    key: "governance",
    labelNb: "Styring og ansvar",
    labelEn: "Governance & Accountability",
    descriptionNb:
      "Roller, policyer og ledelsesforankring som styrer sikkerhet og personvern.",
    descriptionEn:
      "Roles, policies and management commitment that govern security and privacy.",
    icon: Shield,
    accentClass: "text-primary",
    bgClass: "bg-primary",
    chartColor: "hsl(var(--primary))",
  },
  {
    key: "operations",
    labelNb: "Drift og sikkerhet",
    labelEn: "Operations & Security",
    descriptionNb:
      "Drift, hendelseshåndtering, sikkerhetskopiering, logging og endringshåndtering.",
    descriptionEn:
      "Operations, incident handling, backups, logging and change management.",
    icon: Settings,
    accentClass: "text-success",
    bgClass: "bg-success",
    chartColor: "hsl(142, 71%, 45%)",
  },
  {
    key: "identityAccess",
    labelNb: "Identitet og tilgang",
    labelEn: "Identity & Access",
    descriptionNb:
      "Autentisering, tilgangsstyring, MFA og prinsippet om minste privilegium.",
    descriptionEn:
      "Authentication, access control, MFA and least-privilege practices.",
    icon: KeyRound,
    accentClass: "text-accent",
    bgClass: "bg-accent",
    chartColor: "hsl(262, 83%, 58%)",
  },
  {
    key: "privacy",
    labelNb: "Personvern og datahåndtering",
    labelEn: "Privacy & Data Handling",
    descriptionNb:
      "GDPR-samsvar, behandlingsgrunnlag, oppbevaring og registrertes rettigheter.",
    descriptionEn:
      "GDPR compliance, legal basis, retention and data subject rights.",
    icon: Lock,
    accentClass: "text-warning",
    bgClass: "bg-warning",
    chartColor: "hsl(38, 92%, 50%)",
  },
  {
    key: "vendor",
    labelNb: "Tredjepart og verdikjede",
    labelEn: "Third-Party & Supply Chain",
    descriptionNb:
      "Leverandøroversikt, risikovurdering og oppfølging av tredjeparter.",
    descriptionEn:
      "Vendor inventory, risk assessment and follow-up of third parties.",
    icon: Users,
    accentClass: "text-destructive",
    bgClass: "bg-destructive",
    chartColor: "hsl(340, 82%, 52%)",
  },
];

export const CONTROL_AREA_KEYS: ControlAreaKey[] = CONTROL_AREAS.map(
  (a) => a.key
);

export const CONTROL_AREA_BY_KEY: Record<ControlAreaKey, ControlAreaDefinition> =
  CONTROL_AREAS.reduce(
    (acc, a) => {
      acc[a.key] = a;
      return acc;
    },
    {} as Record<ControlAreaKey, ControlAreaDefinition>
  );

/**
 * Map any legacy / alternative key to the canonical key.
 * Keep this exhaustive — every historical value found in the codebase
 * or in the DB must resolve to one of the 5 canonical areas.
 */
const LEGACY_AREA_MAP: Record<string, ControlAreaKey> = {
  // canonical (identity)
  governance: "governance",
  operations: "operations",
  identityAccess: "identityAccess",
  privacy: "privacy",
  vendor: "vendor",

  // trustControlDefinitions.ControlArea
  risk_compliance: "operations",
  security_posture: "identityAccess",
  privacy_data: "privacy",
  supplier_governance: "vendor",

  // scoringEngine.SLACategory
  identity_access: "identityAccess",
  supplier_ecosystem: "vendor",

  // compliance_requirements.sla_category (DB)
  organization_governance: "governance",
  systems_processes: "operations",
  roles_access: "identityAccess",
};

export function toCanonicalArea(key: string | null | undefined): ControlAreaKey {
  if (!key) return "governance";
  return LEGACY_AREA_MAP[key] ?? "governance";
}

export function isControlAreaKey(key: string): key is ControlAreaKey {
  return key in CONTROL_AREA_BY_KEY;
}

export function getControlArea(key: string): ControlAreaDefinition {
  return CONTROL_AREA_BY_KEY[toCanonicalArea(key)];
}

export function getControlAreaLabel(
  key: string,
  locale: "nb" | "en" = "nb"
): string {
  const area = getControlArea(key);
  return locale === "nb" ? area.labelNb : area.labelEn;
}

export function getControlAreaDescription(
  key: string,
  locale: "nb" | "en" = "nb"
): string {
  const area = getControlArea(key);
  return locale === "nb" ? area.descriptionNb : area.descriptionEn;
}

export function getControlAreaIcon(key: string): LucideIcon {
  return getControlArea(key).icon;
}

/**
 * Områdevekt i Trust Score (0-1). Summen er 1.0.
 * Personvern veier tyngst (30 %), Styring og Drift 25 % hver,
 * Identitet og Leverandører 10 % hver.
 */
export const AREA_WEIGHTS: Record<ControlAreaKey, number> = {
  privacy: 0.30,
  governance: 0.25,
  operations: 0.25,
  identityAccess: 0.10,
  vendor: 0.10,
};

/** Kort, brukervennlig forklaring av hva hvert område svarer på. */
export const AREA_QUESTION_NB: Record<ControlAreaKey, string> = {
  operations: "Fungerer sikkerheten i praksis?",
  governance: "Hvem har ansvaret, og er det nedskrevet?",
  privacy: "Har vi kontroll på personopplysninger?",
  identityAccess: "Hvem har tilgang til hva?",
  vendor: "Har vi kontroll på tredjeparter?",
};

/**
 * Beregn samlet Trust Score som vektet snitt av områdescorer.
 * @param areaScores Map fra område-nøkkel til score 0–100.
 */
export function calculateTrustScore(
  areaScores: Partial<Record<ControlAreaKey, number>>
): number {
  let weighted = 0;
  let totalWeight = 0;
  for (const key of CONTROL_AREA_KEYS) {
    const score = areaScores[key];
    if (typeof score !== "number") continue;
    const w = AREA_WEIGHTS[key];
    weighted += score * w;
    totalWeight += w;
  }
  if (totalWeight === 0) return 0;
  return Math.round(weighted / totalWeight);
}

