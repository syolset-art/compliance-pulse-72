/**
 * Pin — kvalitetsmerke (arbeidstittel) for regelverk og AI-agenter.
 *
 * Pin er en DEKLARASJON, ikke en port: alt innhold kan aktiveres, men Pin
 * gjør kvaliteten synlig. Autoritetsnivået en agent får (observe → commit)
 * følger av kvaliteten, og vises som en egen dimensjon (bruksgrense).
 *
 * Pin er knyttet til INNHOLDSVERSJON (content_hash + unit_version) — ikke til
 * enheten. Endres teksten, faller Pin (`fallen`).
 *
 * v1: ingen samlet score/nivå (ingen A1/B2-aktig aggregat). De fire
 * dimensjonene vises rått. Data er mock — reell utfylling kommer separat.
 */

export type PinSourceClass =
  | "official_consolidated"
  | "official_raw"
  | "secondary"
  | "unknown";

export type PinAttestationLevel =
  | "human_verified"
  | "human_reviewed"
  | "self_declared"
  | "not_attested";

export type PinFreshnessFlag = "current" | "aging" | "stale" | "unknown";

/** Hva Pin gir agenten lov til. Stigende autoritet. */
export type PinAuthorityLevel =
  | "observe"
  | "explain"
  | "suggest"
  | "prepare"
  | "commit";

export interface PinSourceDimension {
  sourceClass: PinSourceClass;
  /** Kilde-URL, CELEX-nummer eller lovdata-id */
  sourceRef?: string;
  /** ISO-dato for konsolidert versjon */
  consolidatedAt?: string;
  fetchMethod?: "api" | "scrape" | "manual_upload" | "unknown";
  fetchedAt?: string;
}

export interface PinAttestationDimension {
  level: PinAttestationLevel;
  /** Kun mennesker kan attestere — aldri agenter. */
  attestedBy?: string;
  attestedAt?: string;
}

export interface PinFreshnessDimension {
  flag: PinFreshnessFlag;
  checkedAt?: string;
  /** Drift oppdaget: innholdet driver fra kilden. */
  drifting: boolean;
}

export interface PinAuthorityDimension {
  level: PinAuthorityLevel;
  rationale?: string;
}

export interface Pin {
  pin_id: string;
  content_hash: string;
  pinned_at: string;
  unit_version: string;
  /** True når innholdet er endret etter pinning — Pin er ikke lenger gyldig. */
  fallen: boolean;
  source: PinSourceDimension;
  attestation: PinAttestationDimension;
  freshness: PinFreshnessDimension;
  authority: PinAuthorityDimension;
}

/* ---------------------------------------------------------------- labels */

export const SOURCE_CLASS_LABEL: Record<PinSourceClass, string> = {
  official_consolidated: "Offisiell konsolidert",
  official_raw: "Offisiell rådata",
  secondary: "Sekundærkilde",
  unknown: "Ukjent kilde",
};

export const ATTESTATION_LABEL: Record<PinAttestationLevel, string> = {
  human_verified: "Verifisert av menneske",
  human_reviewed: "Gjennomgått av menneske",
  self_declared: "Egenerklært",
  not_attested: "Ikke attestert",
};

export const FRESHNESS_LABEL: Record<PinFreshnessFlag, string> = {
  current: "Fersk",
  aging: "Aldrende",
  stale: "Utdatert",
  unknown: "Ukjent ferskhet",
};

export const AUTHORITY_LABEL: Record<PinAuthorityLevel, string> = {
  observe: "Observere",
  explain: "Forklare",
  suggest: "Foreslå",
  prepare: "Forberede",
  commit: "Utføre",
};

export const AUTHORITY_DESCRIPTION: Record<PinAuthorityLevel, string> = {
  observe: "Agenten kan lese innholdet, men ikke omtale det som gjeldende rett.",
  explain: "Agenten kan forklare innholdet med kildehenvisning.",
  suggest: "Agenten kan foreslå tiltak basert på innholdet.",
  prepare: "Agenten kan forberede utkast som et menneske godkjenner.",
  commit: "Agenten kan utføre endringer basert på innholdet.",
};

export const FETCH_METHOD_LABEL: Record<
  NonNullable<PinSourceDimension["fetchMethod"]>,
  string
> = {
  api: "API",
  scrape: "Innhenting fra nettside",
  manual_upload: "Manuelt opplastet",
  unknown: "Ukjent metode",
};

/** Ukjent/manglende verdi vises alltid eksplisitt, aldri som tom streng. */
export const UNKNOWN_TEXT = "Ukjent";

export function formatPinDate(value?: string): string {
  if (!value) return UNKNOWN_TEXT;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return UNKNOWN_TEXT;
  return d.toLocaleDateString("nb-NO", { day: "numeric", month: "short", year: "numeric" });
}

/**
 * Tone per dimensjon. Brukes KUN sammen med ikon + tekstlabel (WCAG AA:
 * aldri farge alene).
 */
export type PinTone = "good" | "caution" | "poor" | "neutral";

export const PIN_TONE_CLASS: Record<PinTone, string> = {
  good: "border-success/40 bg-success/10 text-success-foreground",
  caution: "border-warning/40 bg-warning/10 text-warning-foreground",
  poor: "border-destructive/40 bg-destructive/10 text-destructive",
  neutral: "border-border bg-muted text-muted-foreground",
};

export const sourceTone = (s: PinSourceDimension): PinTone =>
  s.sourceClass === "official_consolidated"
    ? "good"
    : s.sourceClass === "official_raw"
      ? "caution"
      : s.sourceClass === "secondary"
        ? "caution"
        : "poor";

export const attestationTone = (a: PinAttestationDimension): PinTone =>
  a.level === "human_verified"
    ? "good"
    : a.level === "human_reviewed"
      ? "caution"
      : a.level === "self_declared"
        ? "caution"
        : "poor";

export const freshnessTone = (f: PinFreshnessDimension): PinTone =>
  f.drifting
    ? "poor"
    : f.flag === "current"
      ? "good"
      : f.flag === "aging"
        ? "caution"
        : f.flag === "stale"
          ? "poor"
          : "neutral";

export const authorityTone = (a: PinAuthorityDimension): PinTone =>
  a.level === "commit" || a.level === "prepare"
    ? "good"
    : a.level === "suggest"
      ? "caution"
      : "neutral";

/* ------------------------------------------------------------ mock data */

export const MOCK_PINS: Record<string, Pin> = {
  /** Høy kvalitet på alle fire dimensjoner. */
  "gdpr": {
    pin_id: "pin_9f31c0",
    content_hash: "sha256:4b1c…a7e2",
    pinned_at: "2026-06-12T09:20:00Z",
    unit_version: "v2026.2",
    fallen: false,
    source: {
      sourceClass: "official_consolidated",
      sourceRef: "CELEX:32016R0679",
      consolidatedAt: "2026-01-15",
      fetchMethod: "api",
      fetchedAt: "2026-06-12",
    },
    attestation: {
      level: "human_verified",
      attestedBy: "Synnøve Olset (juridisk)",
      attestedAt: "2026-06-12",
    },
    freshness: { flag: "current", checkedAt: "2026-08-20", drifting: false },
    authority: {
      level: "commit",
      rationale: "Konsolidert offisiell kilde attestert av menneske og fersk.",
    },
  },

  /** Lav/manglende kvalitet — representativ for mesteparten av korpuset. */
  "nis2": {
    pin_id: "pin_2a77bd",
    content_hash: "sha256:0d8f…31bc",
    pinned_at: "2025-11-03T14:05:00Z",
    unit_version: "v2025.4",
    fallen: false,
    source: {
      sourceClass: "secondary",
      sourceRef: "https://example.org/nis2-sammendrag",
      consolidatedAt: undefined,
      fetchMethod: "scrape",
      fetchedAt: undefined,
    },
    attestation: { level: "not_attested" },
    freshness: { flag: "unknown", checkedAt: undefined, drifting: false },
    authority: {
      level: "observe",
      rationale: "Sekundærkilde uten attestering — kan ikke omtales som gjeldende rett.",
    },
  },

  /** Pin falt: innholdet er endret etter pinning. */
  "aiact": {
    pin_id: "pin_5c02ee",
    content_hash: "sha256:77aa…9012",
    pinned_at: "2026-02-01T08:00:00Z",
    unit_version: "v2026.1",
    fallen: true,
    source: {
      sourceClass: "official_raw",
      sourceRef: "CELEX:32024R1689",
      consolidatedAt: "2025-12-01",
      fetchMethod: "api",
      fetchedAt: "2026-02-01",
    },
    attestation: {
      level: "human_reviewed",
      attestedBy: "Kari Nordmann (compliance)",
      attestedAt: "2026-02-01",
    },
    freshness: { flag: "stale", checkedAt: "2026-08-18", drifting: true },
    authority: {
      level: "observe",
      rationale: "Pin falt — innholdsversjonen er endret siden pinning.",
    },
  },
};

/** Deterministisk mock-oppslag så demoen ser realistisk ut uten backend. */
export function getMockPin(key: string): Pin | undefined {
  const k = key.toLowerCase();
  if (k.includes("gdpr") || k.includes("personvern")) return MOCK_PINS.gdpr;
  if (k.includes("ai")) return MOCK_PINS.aiact;
  if (k.includes("nis")) return MOCK_PINS.nis2;
  // Ærlig standard: de fleste enheter er ikke verifisert.
  const pool = [MOCK_PINS.nis2, MOCK_PINS.aiact, MOCK_PINS.nis2, MOCK_PINS.gdpr];
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) % 9973;
  return pool[hash % pool.length];
}
