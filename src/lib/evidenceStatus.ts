/**
 * Evidence status model for the Trust Profile document register.
 *
 * Three statuses only:
 *  - draft     The document has been uploaded but not confirmed.
 *  - evidence  The organization has confirmed the document is current,
 *              relevant and can be used as evidence in the Trust Profile.
 *  - verified  The document has been reviewed/verified by an external
 *              party (auditor, certification body, internal reviewer, etc.).
 *
 * AI may NEVER set status to `evidence` or `verified`. Only a human action.
 */

import { CheckCircle2, FileText, ShieldCheck } from "lucide-react";

export type EvidenceStatus = "draft" | "evidence" | "verified";

export interface EvidenceStatusConfig {
  key: EvidenceStatus;
  labelNb: string;
  labelEn: string;
  descriptionNb: string;
  descriptionEn: string;
  icon: typeof CheckCircle2;
  /** Tailwind classes for the badge */
  badgeClass: string;
  /** Weight contribution to Trust Score (0 = ignored). */
  trustScoreWeight: number;
}

export const EVIDENCE_STATUS_CONFIG: Record<EvidenceStatus, EvidenceStatusConfig> = {
  draft: {
    key: "draft",
    labelNb: "Utkast",
    labelEn: "Draft",
    descriptionNb: "Lastet opp, men ikke bekreftet som bevis.",
    descriptionEn: "Uploaded but not yet confirmed as evidence.",
    icon: FileText,
    badgeClass:
      "bg-muted text-muted-foreground border border-border",
    trustScoreWeight: 0,
  },
  evidence: {
    key: "evidence",
    labelNb: "Bevis",
    labelEn: "Evidence",
    descriptionNb:
      "Bekreftet av organisasjonen som gjeldende og relevant bevis.",
    descriptionEn:
      "Confirmed by the organization as current and relevant evidence.",
    icon: CheckCircle2,
    badgeClass:
      "bg-success/15 text-success border border-success/30",
    trustScoreWeight: 1,
  },
  verified: {
    key: "verified",
    labelNb: "Verifisert",
    labelEn: "Verified",
    descriptionNb:
      "Gjennomgått eller verifisert av en ekstern part.",
    descriptionEn: "Reviewed or verified by an external party.",
    icon: ShieldCheck,
    badgeClass:
      "bg-primary/15 text-primary border border-primary/30",
    trustScoreWeight: 1.5,
  },
};

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
  const cfg = EVIDENCE_STATUS_CONFIG[status];
  return isNb ? cfg.labelNb : cfg.labelEn;
}
