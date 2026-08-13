/**
 * Requirement status UI model — orthogonal fremdrift + bevis-tillit.
 * Brukes i regelverk-listen, RequirementCard og VendorControlsTab.
 */
import {
  Check,
  CheckCircle2,
  Circle,
  CircleDashed,
  CircleSlash,
  Clock,
  FileText,
  ShieldCheck,
  UserCheck,
  type LucideIcon,
} from "lucide-react";

/** Brukervalgbare statuser (tre-verdimodell). */
export type CanonicalProgressStatus = "fulfilled" | "not_applicable" | "not_started";

/** Eldre verdier beholdes for demo-data/scoring, men vises aldri som eget valg. */
export type LegacyProgressStatus =
  | "not_answered"
  | "in_progress"
  | "implemented"
  | "verified";

export type ProgressStatus = CanonicalProgressStatus | LegacyProgressStatus;

/** Rekkefølge i statusvelgeren. */
export const SELECTABLE_PROGRESS: CanonicalProgressStatus[] = [
  "fulfilled",
  "not_applicable",
  "not_started",
];

/** Map alle (også eldre) verdier til tre-verdimodellen. */
export function normalizeProgress(p: ProgressStatus | undefined): CanonicalProgressStatus {
  switch (p) {
    case "fulfilled":
    case "implemented":
    case "verified":
      return "fulfilled";
    case "not_applicable":
      return "not_applicable";
    default:
      return "not_started";
  }
}


export type EvidenceState =
  | "required"
  | "self_reported"
  | "attested"
  | "verified"
  | "revalidation_due"
  | "out_of_scope";

export interface AttestationInfo {
  name: string;
  role: string;
  date: string; // presentert dato-string
}

export interface DocumentSignature {
  /** True hvis dokumentet er digitalt signert eller inneholder identifiserbar signatur. */
  isSigned: boolean;
  /** Personen/organisasjonen som har signert, om oppdaget. */
  signedBy?: string;
  /** ISO-dato signaturen ble påført. */
  signedAt?: string;
  /** Ekstern utsteder (BDO, DNV, Nemko …) — hvis relevant. */
  issuer?: string;
}

export interface EvidenceDocument {
  name: string;
  kind: string; // e.g. "PDF", "DOCX", "URL", "Attestasjon"
  classification?: {
    docType: string;
    /** Artikler/kontrollpunkter dokumentet dekker (avledet av Lara). */
    articles: string[];
    confidence: number;
    summary?: string;
  };
  /**
   * Signatur påvirker IKKE score — kun tillitsgrad (evidence state).
   * Se scoringEngine for detaljer.
   */
  signature?: DocumentSignature;
  verificationStatus?: "self_reported" | "pending_verification" | "verified";
  verifiedBy?: string;
  verifiedAt?: string;
}

export interface VerificationInfo {
  externalVerifier: {
    name: string;          // e.g. "BDO Norge AS"
    person?: string;       // e.g. "Erik Solheim, Lead Auditor"
    standard?: string;     // e.g. "ISO 27001:2022"
    date: string;
    reportRef?: string;
    validUntil?: string;   // ISO date — når re-verifisering kreves
    verifierType?: VerifierType;
  };
  internalConfirmer: {
    name: string;
    role: string;
    date: string;
  };
}

export type VerifierType =
  | "external_audit_firm"
  | "iso_certification_body"
  | "soc2_report"
  | "pentest"
  | "attestation_letter";

export interface VerifierTypeConfig {
  value: VerifierType;
  labelNb: string;
  labelEn: string;
  descriptionNb: string;
  descriptionEn: string;
  defaultMonths: number;
}

export const VERIFIER_TYPES: VerifierTypeConfig[] = [
  {
    value: "iso_certification_body",
    labelNb: "ISO/IEC-sertifisering",
    labelEn: "ISO/IEC certification",
    descriptionNb: "Akkreditert sertifiseringsorgan (ISO 27001, 27701, 9001 m.fl.)",
    descriptionEn: "Accredited certification body (ISO 27001, 27701, 9001 etc.)",
    defaultMonths: 36,
  },
  {
    value: "external_audit_firm",
    labelNb: "Eksternt revisjonsselskap",
    labelEn: "External audit firm",
    descriptionNb: "Uavhengig revisor (BDO, DNV, Nemko, KPMG m.fl.)",
    descriptionEn: "Independent auditor (BDO, DNV, Nemko, KPMG etc.)",
    defaultMonths: 12,
  },
  {
    value: "soc2_report",
    labelNb: "SOC 2 Type II-rapport",
    labelEn: "SOC 2 Type II report",
    descriptionNb: "Uavhengig rapport gyldig i observasjonsperioden",
    descriptionEn: "Independent report valid across the observation period",
    defaultMonths: 12,
  },
  {
    value: "pentest",
    labelNb: "Penetrasjonstest / teknisk revisjon",
    labelEn: "Penetration test / technical audit",
    descriptionNb: "Uavhengig teknisk testing",
    descriptionEn: "Independent technical testing",
    defaultMonths: 12,
  },
  {
    value: "attestation_letter",
    labelNb: "Attestasjonsbrev fra uavhengig part",
    labelEn: "Attestation letter from independent party",
    descriptionNb: "Skriftlig bekreftelse fra ekstern uavhengig part",
    descriptionEn: "Written confirmation from external independent party",
    defaultMonths: 12,
  },
];

export function suggestValidityMonths(type: VerifierType): number {
  return VERIFIER_TYPES.find((t) => t.value === type)?.defaultMonths ?? 12;
}

export interface RequirementUiState {
  progress: ProgressStatus;
  evidence: EvidenceState;
  attestedBy?: AttestationInfo;
  verification?: VerificationInfo;
  evidenceCount?: { collected: number; required: number };
  revalidationDaysLeft?: number;
  documents?: EvidenceDocument[];
  /** Artikler AI/Lara har bekreftet som dekket av minst ett tilknyttet dokument. */
  coveredArticles?: string[];
  /** Artikler som ikke er dekket av noe dokument enda. */
  missingArticles?: string[];
}


export interface StatusConfig {
  labelNb: string;
  labelEn: string;
  icon: LucideIcon;
  /** Klassenavn for badge (bg + text + border). Bruker semantiske tokens. */
  badgeClass: string;
  /** Klassenavn for ledende ikon (kun tekstfarge). */
  iconClass: string;
}

/**
 * Dempet designspråk: alle badges er nøytrale outline i utgangspunktet.
 * Kun små fargeaksenter på ikonet + kant. Ingen fylte fargefelt utenom
 * subtile advarsler.
 */
const FULFILLED_CONFIG: StatusConfig = {
  labelNb: "Ja, dette oppfylles",
  labelEn: "Yes, this is met",
  icon: Check,
  badgeClass: "bg-transparent text-foreground border-success/40",
  iconClass: "text-success",
};

const NOT_APPLICABLE_CONFIG: StatusConfig = {
  labelNb: "Ikke relevant for oss",
  labelEn: "Not relevant for us",
  icon: CircleSlash,
  badgeClass: "bg-transparent text-muted-foreground border-border",
  iconClass: "text-muted-foreground",
};

const NOT_STARTED_CONFIG: StatusConfig = {
  labelNb: "Ikke påbegynt",
  labelEn: "Not started",
  icon: Circle,
  badgeClass: "bg-transparent text-muted-foreground border-border",
  iconClass: "text-muted-foreground",
};

export const PROGRESS_CONFIG: Record<ProgressStatus, StatusConfig> = {
  fulfilled: FULFILLED_CONFIG,
  not_applicable: NOT_APPLICABLE_CONFIG,
  not_started: NOT_STARTED_CONFIG,
  // Eldre verdier peker på samme tre-verdimodell.
  implemented: FULFILLED_CONFIG,
  verified: FULFILLED_CONFIG,
  in_progress: NOT_STARTED_CONFIG,
  not_answered: NOT_STARTED_CONFIG,
};


export const EVIDENCE_CONFIG: Record<EvidenceState, StatusConfig> = {
  required: {
    labelNb: "Dokumentasjon mangler",
    labelEn: "Documentation missing",
    icon: FileText,
    badgeClass: "bg-transparent text-foreground border-warning/40",
    iconClass: "text-warning",
  },
  self_reported: {
    labelNb: "Egenrapportert",
    labelEn: "Self-reported",
    icon: FileText,
    badgeClass: "bg-transparent text-muted-foreground border-border",
    iconClass: "text-muted-foreground",
  },
  attested: {
    labelNb: "Attestert",
    labelEn: "Attested",
    icon: UserCheck,
    badgeClass: "bg-transparent text-foreground border-success/40",
    iconClass: "text-success",
  },
  verified: {
    labelNb: "Verifisert",
    labelEn: "Verified",
    icon: ShieldCheck,
    badgeClass: "bg-transparent text-foreground border-success/40",
    iconClass: "text-success",
  },
  revalidation_due: {
    labelNb: "Re-attesteres snart",
    labelEn: "Re-attestation due",
    icon: Clock,
    badgeClass: "bg-transparent text-foreground border-warning/40",
    iconClass: "text-warning",
  },
  out_of_scope: {
    labelNb: "Utenfor scope",
    labelEn: "Out of scope",
    icon: CircleSlash,
    badgeClass: "bg-transparent text-muted-foreground border-border",
    iconClass: "text-muted-foreground",
  },
};


export const getProgressConfig = (p: ProgressStatus) => PROGRESS_CONFIG[p];
export const getEvidenceConfig = (e: EvidenceState) => EVIDENCE_CONFIG[e];

/** Format bevis-badge label m/ evt. dager til re-attestering. */
export function formatEvidenceLabel(
  state: RequirementUiState,
  isNb: boolean,
): string {
  const cfg = EVIDENCE_CONFIG[state.evidence];
  if (state.evidence === "revalidation_due" && state.revalidationDaysLeft != null) {
    return isNb
      ? `Re-attesteres om ${state.revalidationDaysLeft} d`
      : `Re-attest in ${state.revalidationDaysLeft}d`;
  }
  return isNb ? cfg.labelNb : cfg.labelEn;
}

/** Deterministisk demo-state fra en id-streng. */
export function demoUiStateFor(id: string, seed = 0): RequirementUiState {
  let h = seed;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  const bucket = h % 12;

  switch (bucket) {
    case 0:
    case 1:
      return {
        progress: "verified",
        evidence: "verified",
        verification: {
          externalVerifier: {
            name: "BDO Norge AS",
            person: "Erik Solheim, Lead Auditor",
            standard: "ISO 27001:2022",
            date: "8. juli 2026",
            reportRef: "BDO-2026-0472",
          },
          internalConfirmer: {
            name: "Vilde Gjellestad",
            role: "Compliance Lead",
            date: "10. juli 2026",
          },
        },
        evidenceCount: { collected: 3, required: 3 },
        documents: [
          { name: "Sikkerhetspolicy_v3.pdf", kind: "PDF" },
          {
            name: "ISO 27001-sertifikat 2026.pdf",
            kind: "PDF",
            verificationStatus: "verified",
            verifiedBy: "BDO Norge AS",
            verifiedAt: "8. juli 2026",
          },
          {
            name: "Revisjonsrapport_BDO-2026-0472.pdf",
            kind: "Rapport",
            verificationStatus: "verified",
            verifiedBy: "BDO Norge AS",
            verifiedAt: "8. juli 2026",
          },
        ],
      };
    case 2:
      return {
        progress: "verified",
        evidence: "revalidation_due",
        revalidationDaysLeft: 14,
        verification: {
          externalVerifier: {
            name: "Nemko Digital",
            person: "Anne Berg, Sertifiseringsleder",
            standard: "ISO 27701:2019",
            date: "12. jan 2026",
            reportRef: "NEMKO-2026-118",
          },
          internalConfirmer: {
            name: "Ola Nordmann",
            role: "CISO",
            date: "15. jan 2026",
          },
        },
        evidenceCount: { collected: 2, required: 2 },
        documents: [
          { name: "Hendelseslogg_2025-Q4.xlsx", kind: "XLSX" },
          {
            name: "Attestasjon_2026-01-12.pdf",
            kind: "Attestasjon",
            verificationStatus: "verified",
            verifiedBy: "Nemko Digital",
            verifiedAt: "12. jan 2026",
          },
        ],
      };
    case 3:
    case 4:
      return {
        progress: "implemented",
        evidence: "attested",
        attestedBy: { name: "Kari Hansen", role: "DPO", date: "3. juni 2026" },
        evidenceCount: { collected: 2, required: 3 },
        documents: [
          { name: "Databehandleravtale.pdf", kind: "PDF" },
          { name: "Attestasjon_2026-06-03.pdf", kind: "Attestasjon" },
        ],
      };
    case 5:
      return {
        progress: "implemented",
        evidence: "self_reported",
        evidenceCount: { collected: 1, required: 3 },
        documents: [
          { name: "Intern_beskrivelse.docx", kind: "DOCX" },
        ],
      };
    case 6:
    case 7:
      return {
        progress: "in_progress",
        evidence: "required",
        evidenceCount: { collected: 0, required: 3 },
      };
    case 8:
    case 9:
      return { progress: "not_answered", evidence: "required" };
    case 10:
      return { progress: "not_applicable", evidence: "out_of_scope" };
    default:
      return {
        progress: "in_progress",
        evidence: "self_reported",
        evidenceCount: { collected: 1, required: 4 },
        documents: [{ name: "Utkast_kontroller.docx", kind: "DOCX" }],
      };
  }
}


/** Map en legacy "met/partial/not_met"-status til ny UI-modell. */
export function uiStateFromLegacyStatus(
  status: "met" | "partial" | "not_met",
  id: string,
): RequirementUiState {
  if (status === "met") return demoUiStateFor(id, 1); // verified/attested varianter
  if (status === "partial") return demoUiStateFor(id, 5); // in_progress varianter
  return { progress: "not_answered", evidence: "required" };
}
