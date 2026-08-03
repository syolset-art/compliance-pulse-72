// Fulfillment-model: skiller krav som MÅ dokumenteres fra krav som kan
// oppfylles på andre måter (handling, prosess, bekreftelse, vurdering, N/A).
//
// Alle krav i complianceRequirementsData.ts / additionalFrameworkRequirements.ts
// kan overstyre dette via feltene fulfillment_type / evidence_mandatory.
// Når feltene mangler, utleder inferFulfillment() en fornuftig default basert
// på kravets kategori, sla_category, navn og agent_capability.

import type { ComplianceRequirement } from "./complianceRequirementsData";

export type FulfillmentType =
  | "document_required"
  | "document_optional"
  | "process_confirmation"
  | "attestation"
  | "action"
  | "assessment"
  | "not_applicable_allowed";

export interface FulfillmentInfo {
  type: FulfillmentType;
  evidenceMandatory: boolean;
  labelNo: string;
  labelEn: string;
  descriptionNo: string;
  descriptionEn: string;
  /** CTA-tekst når evidence ikke er påkrevd — kravet oppfylles primært på annen måte. */
  primaryActionNo: string;
  primaryActionEn: string;
  /** Tailwind-klasser for pillen. */
  pillClass: string;
}

const FULFILLMENT_META: Record<FulfillmentType, Omit<FulfillmentInfo, "type" | "evidenceMandatory">> = {
  document_required: {
    labelNo: "Dokumentasjon påkrevd",
    labelEn: "Documentation required",
    descriptionNo: "Kravet må dokumenteres med opplastet bevis (policy, avtale, sertifisering, rapport).",
    descriptionEn: "Requires uploaded evidence (policy, agreement, certification, report).",
    primaryActionNo: "Last opp dokumentasjon",
    primaryActionEn: "Upload documentation",
    pillClass: "border-warning/40 bg-warning/10 text-warning",
  },
  document_optional: {
    labelNo: "Dokument valgfritt",
    labelEn: "Document optional",
    descriptionNo: "Et dokument styrker kravet, men er ikke påkrevd for at det skal telle som oppfylt.",
    descriptionEn: "A document strengthens the requirement but is not mandatory.",
    primaryActionNo: "Tilknytt dokument",
    primaryActionEn: "Attach document",
    pillClass: "border-border bg-muted/50 text-muted-foreground",
  },
  process_confirmation: {
    labelNo: "Bekreft prosess",
    labelEn: "Confirm process",
    descriptionNo: "Bekreft at prosessen eller rutinen er etablert i Mynder — ingen dokumentopplasting nødvendig.",
    descriptionEn: "Confirm the process is established in Mynder — no upload required.",
    primaryActionNo: "Bekreft prosess",
    primaryActionEn: "Confirm process",
    pillClass: "border-primary/30 bg-primary/10 text-primary",
  },
  attestation: {
    labelNo: "Egenerklæring",
    labelEn: "Attestation",
    descriptionNo: "Kravet oppfylles ved en signert egenerklæring i plattformen.",
    descriptionEn: "Met via a signed self-attestation in the platform.",
    primaryActionNo: "Signer egenerklæring",
    primaryActionEn: "Sign attestation",
    pillClass: "border-primary/30 bg-primary/10 text-primary",
  },
  action: {
    labelNo: "Registrer handling",
    labelEn: "Register action",
    descriptionNo: "Oppfylles ved å bekrefte at handlingen er utført (f.eks. MFA aktivert, backup testet).",
    descriptionEn: "Met by confirming an action has been performed (e.g. MFA enabled, backup tested).",
    primaryActionNo: "Bekreft utført",
    primaryActionEn: "Mark as done",
    pillClass: "border-success/30 bg-success/10 text-success",
  },
  assessment: {
    labelNo: "Vurdering",
    labelEn: "Assessment",
    descriptionNo: "Fullfør vurderingen i modulen (f.eks. DPIA, risikoanalyse) — rapporten genereres automatisk.",
    descriptionEn: "Complete the assessment in the module (e.g. DPIA, risk analysis) — report is generated automatically.",
    primaryActionNo: "Registrer vurdering",
    primaryActionEn: "Register assessment",
    pillClass: "border-primary/30 bg-primary/10 text-primary",
  },
  not_applicable_allowed: {
    labelNo: "Kan være ikke relevant",
    labelEn: "May be N/A",
    descriptionNo: "Kravet kan markeres som ikke relevant hvis det ikke gjelder virksomheten — legg ved kort begrunnelse.",
    descriptionEn: "May be marked N/A if it does not apply — add a brief justification.",
    primaryActionNo: "Marker som ikke relevant",
    primaryActionEn: "Mark as N/A",
    pillClass: "border-border bg-muted/50 text-muted-foreground",
  },
};

const DOC_REQUIRED_KEYWORDS = [
  "policy",
  "retningslinj",
  "erklærin",
  "avtale",
  "sertifisering",
  "certification",
  "dpa",
  "databehandler",
  "revisjon",
  "audit report",
  "rapport",
];

const ACTION_KEYWORDS = [
  "mfa",
  "flerfaktor",
  "multi-factor",
  "backup",
  "sikkerhetskopi",
  "kryptering",
  "encryption",
  "logging",
  "logg",
  "patch",
  "sårbarhet",
  "tilgangskontroll",
  "access control",
];

const ASSESSMENT_KEYWORDS = [
  "risikoanalys",
  "risk analysis",
  "risikovurderin",
  "risk assessment",
  "dpia",
  "konsekvensvurderin",
  "vurderin",
];

const PROCESS_KEYWORDS = [
  "roll",
  "ansvar",
  "opplæring",
  "training",
  "awareness",
  "kompetans",
  "rutine",
  "prosess",
  "process",
  "hendelseshåndterin",
  "incident",
];

/**
 * Utleder fulfillment-info fra kravmetadata når feltene ikke er satt eksplisitt.
 */
export function inferFulfillment(req: ComplianceRequirement): FulfillmentInfo {
  // Eksplisitt overstyring vinner alltid
  const override = (req as ComplianceRequirement & {
    fulfillment_type?: FulfillmentType;
    evidence_mandatory?: boolean;
  });
  if (override.fulfillment_type) {
    return {
      type: override.fulfillment_type,
      evidenceMandatory:
        override.evidence_mandatory ?? override.fulfillment_type === "document_required",
      ...FULFILLMENT_META[override.fulfillment_type],
    };
  }

  const haystack = `${req.name} ${req.name_no} ${req.description_no}`.toLowerCase();
  const has = (list: string[]) => list.some((k) => haystack.includes(k));

  let type: FulfillmentType = "document_optional";

  if (has(ACTION_KEYWORDS)) {
    type = "action";
  } else if (has(ASSESSMENT_KEYWORDS)) {
    type = "assessment";
  } else if (has(DOC_REQUIRED_KEYWORDS)) {
    type = "document_required";
  } else if (has(PROCESS_KEYWORDS)) {
    type = "process_confirmation";
  } else if (req.category === "governance" || req.category === "legal") {
    type = "document_required";
  } else if (req.agent_capability === "full") {
    type = "action";
  }

  const evidenceMandatory = type === "document_required";

  return {
    type,
    evidenceMandatory,
    ...FULFILLMENT_META[type],
  };
}

export function getFulfillmentMeta(type: FulfillmentType) {
  return FULFILLMENT_META[type];
}

// ─── Dekningsanalyse ────────────────────────────────────────────
//
// Score-effekt: hvis kravet har `covered_articles`, gis kun delvis
// score-uttelling per andel dekket. Signatur på dokumentene påvirker
// IKKE score — kun evidence-state (tillitsgrad).

export interface CoverageResult {
  /** Artikler kravet forventer å ha dekning for. */
  required: string[];
  /** Artikler som er dekket av minst ett tilknyttet dokument. */
  covered: string[];
  /** Artikler som mangler dekning. */
  missing: string[];
  /** 0..1. 1 hvis kravet ikke har artikkelliste (ingen partial-scoring). */
  ratio: number;
  /** Antall artikler som mangler dekning. */
  gapCount: number;
  /** True hvis minst ett dokument har oppdaget signatur. */
  hasSignedDocument: boolean;
}

/**
 * Beregner dekningsgrad for et krav basert på tilknyttede dokumenter.
 * Returnerer ratio = 1 hvis kravet ikke har artikkelliste (bakoverkompatibelt).
 */
export function calculateCoverage(
  requiredArticles: string[] | undefined,
  documents: Array<{ classification?: { articles?: string[] }; signature?: { isSigned?: boolean } }> | undefined,
): CoverageResult {
  const required = requiredArticles ?? [];
  const docs = documents ?? [];
  const hasSignedDocument = docs.some((d) => d.signature?.isSigned === true);

  if (required.length === 0) {
    // Ingen artikkelliste — full uttelling så snart det finnes minst ett dokument.
    return {
      required,
      covered: [],
      missing: [],
      ratio: docs.length > 0 ? 1 : 0,
      gapCount: 0,
      hasSignedDocument,
    };
  }

  const coveredSet = new Set<string>();
  for (const doc of docs) {
    for (const a of doc.classification?.articles ?? []) {
      if (required.includes(a)) coveredSet.add(a);
    }
  }
  const covered = required.filter((a) => coveredSet.has(a));
  const missing = required.filter((a) => !coveredSet.has(a));

  return {
    required,
    covered,
    missing,
    ratio: covered.length / required.length,
    gapCount: missing.length,
    hasSignedDocument,
  };
}

/**
 * Justerer et modenhetsnivå (0–4) med dekningsgraden.
 * Signatur påvirker IKKE — den forsterker kun tillitsgraden separat.
 */
export function effectiveMaturity(
  level: 0 | 1 | 2 | 3 | 4,
  coverageRatio: number,
  evidenceMandatory: boolean,
): number {
  if (!evidenceMandatory) return level;
  return level * Math.min(1, Math.max(0, coverageRatio));
}
