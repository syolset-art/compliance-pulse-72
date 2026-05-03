// Avleder eierskaps-tilstand for et system (kartlagt av Lara, tildelt, eid, utfases, arkivert).
// Speilbilde av vendorStatus.ts — gir fargekodet livssyklus på systemkortet.

export type SystemStatusKey = "mapped" | "assigned" | "owned" | "phasing" | "archived";

export interface SystemStatusMeta {
  key: SystemStatusKey;
  label: string;
  description: string;
  stripeLabel: string;
  stripeBg: string;
  stripeText: string;
  hex: string;
  hasActiveDot?: boolean;
  tone: "warning" | "primary" | "success" | "muted";
}

interface DeriveInput {
  status?: string | null;
  work_area_id?: string | null;
  compliance_score?: number | null;
  metadata?: any;
}

const STATUS_META: Record<SystemStatusKey, SystemStatusMeta> = {
  mapped: {
    key: "mapped",
    label: "Kartlagt",
    description: "Lara har oppdaget systemet — ingen Work Area har tatt eierskap ennå",
    stripeLabel: "SYSTEM · KARTLAGT",
    stripeBg: "bg-system-mapped",
    stripeText: "text-system-mapped-foreground",
    hex: "#534AB7",
    tone: "primary",
  },
  assigned: {
    key: "assigned",
    label: "Tildelt",
    description: "Tildelt et arbeidsområde — avventer bekreftelse fra eier",
    stripeLabel: "SYSTEM · TILDELT",
    stripeBg: "bg-system-assigned",
    stripeText: "text-system-assigned-foreground",
    hex: "#BA7517",
    tone: "warning",
  },
  owned: {
    key: "owned",
    label: "Eid",
    description: "Et arbeidsområde eier og oppdaterer systemet aktivt",
    stripeLabel: "SYSTEM · EID",
    stripeBg: "bg-system-owned",
    stripeText: "text-system-owned-foreground",
    hex: "#0F6E56",
    hasActiveDot: true,
    tone: "success",
  },
  phasing: {
    key: "phasing",
    label: "Fases ut",
    description: "Systemet er under utfasing",
    stripeLabel: "SYSTEM · UTFASES",
    stripeBg: "bg-system-phasing",
    stripeText: "text-system-phasing-foreground",
    hex: "#C97A1F",
    tone: "warning",
  },
  archived: {
    key: "archived",
    label: "Arkivert",
    description: "Systemet er ikke lenger i bruk — profilen er fryst",
    stripeLabel: "SYSTEM · ARKIVERT",
    stripeBg: "bg-system-archived",
    stripeText: "text-system-archived-foreground",
    hex: "#6B6A62",
    tone: "muted",
  },
};

export function deriveSystemStatus(input: DeriveInput): SystemStatusMeta {
  const st = (input.status || "").toLowerCase();
  const md = input.metadata || {};
  const score = input.compliance_score || 0;

  if (st === "archived") return STATUS_META.archived;
  if (st === "phasing_out" || st === "phase_out") return STATUS_META.phasing;

  if (!input.work_area_id) {
    // Ingen eier — Lara/Mynder har profilen
    return STATUS_META.mapped;
  }

  // Tildelt: eier finnes men er ikke bekreftet eller har lav modenhet
  const confirmed = md.owner_confirmed_at || md.claimed_at;
  if (!confirmed && score < 40) return STATUS_META.assigned;

  return STATUS_META.owned;
}

export const ALL_SYSTEM_STATUSES: SystemStatusMeta[] = [
  STATUS_META.mapped,
  STATUS_META.assigned,
  STATUS_META.owned,
  STATUS_META.phasing,
  STATUS_META.archived,
];
