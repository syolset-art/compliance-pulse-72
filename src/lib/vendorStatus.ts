// Avleder visuell status for en leverandør basert på eksisterende felter
// (compliance_score, risk_level, lifecycle_status, dokumenter, inbox).
// Returnerer både farge-tokens og kontekstuell handlings-CTA.

export type VendorStatusKey =
  | "approved"          // Godkjent (grønn)
  | "needs_action"      // Krever tiltak (rød)
  | "in_followup"       // Under oppfølging (oransje)
  | "invited"           // Invitert (blå/lilla)
  | "draft";            // Utkast (oransje prikk, ingen score)

export interface VendorStatusMeta {
  key: VendorStatusKey;
  label: string;
  /** Tailwind className for prikk-bakgrunn */
  dotClass: string;
  /** Tailwind className for tekst-farge */
  textClass: string;
  /** Tailwind className for chip-bakgrunn (pille) */
  pillClass: string;
  /** Tone-navn brukt til donut/CTA */
  tone: "success" | "destructive" | "warning" | "primary" | "muted";
}

interface DeriveInput {
  compliance_score?: number | null;
  risk_level?: string | null;
  lifecycle_status?: string | null;
  metadata?: any;
  expiredDocsCount?: number;
  inboxCount?: number;
}

const STATUS_META: Record<VendorStatusKey, VendorStatusMeta> = {
  approved: {
    key: "approved",
    label: "Godkjent",
    dotClass: "bg-success",
    textClass: "text-success",
    pillClass: "bg-success/10 border-success/20",
    tone: "success",
  },
  needs_action: {
    key: "needs_action",
    label: "Krever tiltak",
    dotClass: "bg-destructive",
    textClass: "text-destructive",
    pillClass: "bg-destructive/10 border-destructive/20",
    tone: "destructive",
  },
  in_followup: {
    key: "in_followup",
    label: "Under oppfølging",
    dotClass: "bg-warning",
    textClass: "text-warning",
    pillClass: "bg-warning/10 border-warning/20",
    tone: "warning",
  },
  invited: {
    key: "invited",
    label: "Invitert",
    dotClass: "bg-primary",
    textClass: "text-primary",
    pillClass: "bg-primary/10 border-primary/20",
    tone: "primary",
  },
  draft: {
    key: "draft",
    label: "Utkast",
    dotClass: "bg-warning",
    textClass: "text-warning",
    pillClass: "bg-warning/10 border-warning/20",
    tone: "warning",
  },
};

export function deriveVendorStatus(input: DeriveInput): VendorStatusMeta {
  const score = input.compliance_score || 0;
  const lc = (input.lifecycle_status || "").toLowerCase();
  const md = input.metadata || {};
  const expired = input.expiredDocsCount || 0;

  // 1. Eksplisitte livssyklus-stater
  if (lc === "draft" || md.status === "draft") return STATUS_META.draft;
  if (lc === "invited" || md.status === "invited" || md.invited_at) return STATUS_META.invited;

  // 2. Avledet fra score / risiko / dokumenter
  if (expired > 0) return STATUS_META.needs_action;
  if (input.risk_level === "high" || score < 40) {
    if (score === 0) return STATUS_META.draft;
    return STATUS_META.needs_action;
  }
  if (score >= 75) return STATUS_META.approved;
  if (score >= 40) return STATUS_META.in_followup;

  return STATUS_META.draft;
}

export const ALL_VENDOR_STATUSES: VendorStatusMeta[] = [
  STATUS_META.approved,
  STATUS_META.in_followup,
  STATUS_META.needs_action,
  STATUS_META.invited,
  STATUS_META.draft,
];
