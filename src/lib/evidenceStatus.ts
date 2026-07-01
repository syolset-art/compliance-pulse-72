/**
 * Evidence status model for the Trust Profile document register.
 *
 * Five status trinn — status opptjenes gjennom en guidet flyt:
 *   uploaded   — Fil mottatt, AI kjører klassifisering.
 *   classified — Bruker har bekreftet type; tier låst (utledet av AI).
 *   confirmed  — Bruker har bekreftet plassering (kontroll og/eller ressurs).
 *   attested   — Ansvarlig person har bekreftet med navn/rolle/dato.
 *   verified   — Ekstern verifikator har godkjent.
 *
 * AI kan ALDRI sette status til `confirmed`, `attested` eller `verified`.
 * Kun mennesker via UI.
 *
 * Legacy aliases (`draft`, `evidence`) beholdes i typen for bakoverkompat i
 * eldre skjermbilder — nye rader skal ikke bruke disse.
 */

import { CheckCircle2, FileText, ShieldCheck, Sparkles, UserCheck } from "lucide-react";

export type EvidenceStatus =
  | "uploaded"
  | "classified"
  | "confirmed"
  | "attested"
  | "verified"
  // Legacy aliases (mapped in DB migration)
  | "draft"
  | "evidence";

export const EVIDENCE_STATUS_ORDER: EvidenceStatus[] = [
  "uploaded",
  "classified",
  "confirmed",
  "attested",
  "verified",
];

export interface EvidenceStatusConfig {
  key: EvidenceStatus;
  labelNb: string;
  labelEn: string;
  descriptionNb: string;
  descriptionEn: string;
  icon: typeof CheckCircle2;
  badgeClass: string;
  /** Multiplikator til Trust Score-bidrag (0 = ignoreres). */
  trustScoreWeight: number;
}

export const EVIDENCE_STATUS_CONFIG: Record<EvidenceStatus, EvidenceStatusConfig> = {
  uploaded: {
    key: "uploaded",
    labelNb: "Lastet opp",
    labelEn: "Uploaded",
    descriptionNb: "Fil mottatt. Lara analyserer.",
    descriptionEn: "File received. Lara is analysing.",
    icon: FileText,
    badgeClass: "bg-muted text-muted-foreground border border-border",
    trustScoreWeight: 0,
  },
  classified: {
    key: "classified",
    labelNb: "Klassifisert",
    labelEn: "Classified",
    descriptionNb: "Dokumenttype bekreftet. Vekting utledet.",
    descriptionEn: "Document type confirmed. Weighting derived.",
    icon: Sparkles,
    badgeClass: "bg-primary/10 text-primary border border-primary/30",
    trustScoreWeight: 0.25,
  },
  confirmed: {
    key: "confirmed",
    labelNb: "Bekreftet",
    labelEn: "Confirmed",
    descriptionNb: "Plassering bekreftet. Bidrar til Trust Score.",
    descriptionEn: "Placement confirmed. Contributes to Trust Score.",
    icon: CheckCircle2,
    badgeClass: "bg-success/15 text-success border border-success/30",
    trustScoreWeight: 1,
  },
  attested: {
    key: "attested",
    labelNb: "Attestert",
    labelEn: "Attested",
    descriptionNb: "Ansvarlig person har bekreftet.",
    descriptionEn: "Signed off by a responsible person.",
    icon: UserCheck,
    badgeClass: "bg-success/20 text-success border border-success/40",
    trustScoreWeight: 1.25,
  },
  verified: {
    key: "verified",
    labelNb: "Verifisert",
    labelEn: "Verified",
    descriptionNb: "Verifisert av ekstern part.",
    descriptionEn: "Verified by an external party.",
    icon: ShieldCheck,
    badgeClass: "bg-primary/15 text-primary border border-primary/30",
    trustScoreWeight: 1.5,
  },
  // Legacy aliases (map to nearest new status for display purposes)
  draft: {
    key: "draft",
    labelNb: "Lastet opp",
    labelEn: "Uploaded",
    descriptionNb: "Fil mottatt.",
    descriptionEn: "File received.",
    icon: FileText,
    badgeClass: "bg-muted text-muted-foreground border border-border",
    trustScoreWeight: 0,
  },
  evidence: {
    key: "evidence",
    labelNb: "Bekreftet",
    labelEn: "Confirmed",
    descriptionNb: "Bekreftet som bevis.",
    descriptionEn: "Confirmed as evidence.",
    icon: CheckCircle2,
    badgeClass: "bg-success/15 text-success border border-success/30",
    trustScoreWeight: 1,
  },
};

/** Normaliser gammel status til ny modell for beregninger og UI-progresjon. */
export function normalizeEvidenceStatus(s: EvidenceStatus | string | null | undefined): EvidenceStatus {
  if (!s) return "uploaded";
  if (s === "draft") return "uploaded";
  if (s === "evidence") return "confirmed";
  return s as EvidenceStatus;
}

export const VERIFIER_TYPES = [
  { value: "external_auditor", labelNb: "Ekstern revisor", labelEn: "External auditor" },
  { value: "certification_body", labelNb: "Sertifiseringsorgan", labelEn: "Certification body" },
  { value: "internal_reviewer", labelNb: "Intern reviewer", labelEn: "Internal reviewer" },
  { value: "customer", labelNb: "Kunde", labelEn: "Customer" },
  { value: "partner", labelNb: "Partner", labelEn: "Partner" },
  { value: "other", labelNb: "Annet", labelEn: "Other" },
] as const;

export const VERIFICATION_BASIS = [
  { value: "iso_audit", labelNb: "ISO-revisjon", labelEn: "ISO audit" },
  { value: "security_review", labelNb: "Sikkerhetsgjennomgang", labelEn: "Security review" },
  { value: "legal_review", labelNb: "Juridisk gjennomgang", labelEn: "Legal review" },
  { value: "customer_due_diligence", labelNb: "Kundedue diligence", labelEn: "Customer due diligence" },
  { value: "other", labelNb: "Annet", labelEn: "Other" },
] as const;

export const SHARING_LEVELS = [
  { value: "internal", labelNb: "Kun intern", labelEn: "Internal only" },
  { value: "partners", labelNb: "Delt med inviterte partnere", labelEn: "Shared with invited partners" },
  { value: "public", labelNb: "Offentlig", labelEn: "Public" },
] as const;

export type SharingLevel = typeof SHARING_LEVELS[number]["value"];

export interface QualityFinding {
  type:
    | "missing_owner"
    | "missing_approval"
    | "missing_version"
    | "missing_review_date"
    | "looks_like_draft"
    | "outdated"
    | "sensitive_info";
  severity: "info" | "warning" | "critical";
  messageNb: string;
  messageEn: string;
}

export const QUALITY_FINDING_LABELS: Record<QualityFinding["type"], { nb: string; en: string }> = {
  missing_owner: { nb: "Mangler eier", en: "Missing owner" },
  missing_approval: { nb: "Mangler godkjenning", en: "Missing approval" },
  missing_version: { nb: "Mangler versjon", en: "Missing version" },
  missing_review_date: { nb: "Mangler revisjonsdato", en: "Missing review date" },
  looks_like_draft: { nb: "Ser ut som utkast", en: "Looks like a draft" },
  outdated: { nb: "Utdatert dokument", en: "Outdated document" },
  sensitive_info: { nb: "Sensitiv informasjon oppdaget", en: "Sensitive information detected" },
};

export interface AuditEvent {
  action:
    | "uploaded"
    | "ai_classified"
    | "manually_classified"
    | "edited"
    | "confirmed"
    | "attested"
    | "verified"
    | "rejected";
  actor: string;
  actor_role?: string;
  timestamp: string;
  note?: string;
}

export function appendAudit(trail: AuditEvent[] | null | undefined, event: Omit<AuditEvent, "timestamp"> & { timestamp?: string }): AuditEvent[] {
  const next: AuditEvent = {
    ...event,
    timestamp: event.timestamp ?? new Date().toISOString(),
  };
  return [...(trail ?? []), next];
}

export function getEvidenceStatusLabel(status: EvidenceStatus, isNb: boolean): string {
  const cfg = EVIDENCE_STATUS_CONFIG[status] ?? EVIDENCE_STATUS_CONFIG.uploaded;
  return isNb ? cfg.labelNb : cfg.labelEn;
}
