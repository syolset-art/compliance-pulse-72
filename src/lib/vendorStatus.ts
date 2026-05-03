// Avleder eierskaps-tilstand for en leverandør (utkast, invitert, claimet, arkivert)
// + sekundære signaler (kritikalitet, modenhetslabel).

export type VendorStatusKey = "draft" | "invited" | "claimed" | "archived";

export interface VendorStatusMeta {
  key: VendorStatusKey;
  /** Kort label brukt i pille (f.eks. «Utkast») */
  label: string;
  /** Lengre forklaring brukt i fargeforklaring */
  description: string;
  /** Tekst på vertikal stripe (f.eks. «LEVERANDØR · UTKAST») */
  stripeLabel: string;
  /** Tailwind bg-class for vertikal stripe */
  stripeBg: string;
  /** Tailwind text-class for stripe-label */
  stripeText: string;
  /** Hex-verdi for fargeforklaring/tooltip */
  hex: string;
  /** Om stripen skal ha en grønn aktiv-prikk (Claimet) */
  hasActiveDot?: boolean;
  /** Tone-navn brukt til donut/banner */
  tone: "warning" | "primary" | "success" | "muted";
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
  draft: {
    key: "draft",
    label: "Utkast",
    description: "Mynder eier profilen — leverandøren er ikke invitert ennå",
    stripeLabel: "LEVERANDØR · UTKAST",
    stripeBg: "bg-vendor-draft",
    stripeText: "text-vendor-draft-foreground",
    hex: "#534AB7",
    tone: "primary",
  },
  invited: {
    key: "invited",
    label: "Invitert",
    description: "Invitasjon sendt — venter på at leverandøren claimer profilen",
    stripeLabel: "LEVERANDØR · INVITERT",
    stripeBg: "bg-vendor-invited",
    stripeText: "text-vendor-invited-foreground",
    hex: "#BA7517",
    tone: "warning",
  },
  claimed: {
    key: "claimed",
    label: "Claimet",
    description: "Leverandøren eier og oppdaterer profilen selv",
    stripeLabel: "LEVERANDØR · CLAIMET",
    stripeBg: "bg-vendor-claimed",
    stripeText: "text-vendor-claimed-foreground",
    hex: "#0F6E56",
    hasActiveDot: false,
    tone: "success",
  },
  archived: {
    key: "archived",
    label: "Arkivert",
    description: "Samarbeidet er avsluttet — profilen er fryst",
    stripeLabel: "LEVERANDØR · ARKIVERT",
    stripeBg: "bg-vendor-archived",
    stripeText: "text-vendor-archived-foreground",
    hex: "#888780",
    tone: "muted",
  },
};

export function deriveVendorStatus(input: DeriveInput): VendorStatusMeta {
  const lc = (input.lifecycle_status || "").toLowerCase();
  const md = input.metadata || {};
  const ownership = md.ownership_model || md.ownership; // 'mynder' | 'supplier'
  const profileStatus = md.profile_status || md.status; // 'draft' | 'invitation_sent' | 'claimed' | 'archived'

  if (lc === "archived" || profileStatus === "archived") return STATUS_META.archived;
  if (ownership === "supplier" || profileStatus === "claimed" || md.claimed_at) return STATUS_META.claimed;
  if (profileStatus === "invitation_sent" || profileStatus === "invited" || lc === "invited" || md.invited_at) return STATUS_META.invited;
  if (lc === "draft" || profileStatus === "draft") return STATUS_META.draft;

  // Fallback: hvis ingen ownership-data – bruk score for å avlede
  const score = input.compliance_score || 0;
  if (score >= 75) return STATUS_META.claimed; // antatt verifisert
  return STATUS_META.draft;
}

// Sekundært signal: kritikalitet (vises som pille ved navn)
export type CriticalityKey = "high" | "medium" | "low";
export interface CriticalityMeta {
  key: CriticalityKey;
  label: string;
  dotClass: string;
  pillClass: string;
}

const CRITICALITY_META: Record<CriticalityKey, CriticalityMeta> = {
  high:   { key: "high",   label: "Høy kritikalitet",     dotClass: "bg-destructive", pillClass: "bg-destructive/10 text-destructive border-destructive/20" },
  medium: { key: "medium", label: "Middels kritikalitet", dotClass: "bg-warning",     pillClass: "bg-warning/10 text-warning border-warning/20" },
  low:    { key: "low",    label: "Lav kritikalitet",     dotClass: "bg-success",     pillClass: "bg-success/10 text-success border-success/20" },
};

export function deriveCriticality(input: { criticality?: string | null; risk_level?: string | null }): CriticalityMeta | null {
  const c = (input.criticality || input.risk_level || "").toLowerCase();
  if (c === "high" || c === "critical") return CRITICALITY_META.high;
  if (c === "medium") return CRITICALITY_META.medium;
  if (c === "low") return CRITICALITY_META.low;
  return null;
}

export const ALL_VENDOR_STATUSES: VendorStatusMeta[] = [
  STATUS_META.draft,
  STATUS_META.invited,
  STATUS_META.claimed,
  STATUS_META.archived,
];
