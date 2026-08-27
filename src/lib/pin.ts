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
  good: "border-success/40 bg-success/10 text-success",
  caution: "border-warning/40 bg-warning/10 text-warning",
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

/* --------------------------------------------- Pin per regelverk (mock) */

type PinRecipe = {
  sourceClass: PinSourceClass;
  sourceRef?: string;
  consolidatedAt?: string;
  fetchMethod?: PinSourceDimension["fetchMethod"];
  fetchedAt?: string;
  attestation: PinAttestationLevel;
  attestedBy?: string;
  attestedAt?: string;
  freshness: PinFreshnessFlag;
  checkedAt?: string;
  drifting?: boolean;
  authority: PinAuthorityLevel;
  rationale: string;
  fallen?: boolean;
  version?: string;
};

/** Deterministisk pseudo-hash brukt til stabile pin_id/content_hash i mock. */
function stableHex(seed: string, len: number): string {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  let out = "";
  let v = h >>> 0;
  while (out.length < len) {
    out += (v % 16).toString(16);
    v = Math.floor(v / 16) || (v ^ 0x9e3779b9) >>> 0;
  }
  return out.slice(0, len);
}

function buildPin(id: string, r: PinRecipe): Pin {
  return {
    pin_id: `pin_${stableHex(id, 6)}`,
    content_hash: `sha256:${stableHex(id + "c", 4)}…${stableHex(id + "d", 4)}`,
    pinned_at: `${r.attestedAt ?? r.fetchedAt ?? "2026-03-01"}T09:00:00Z`,
    unit_version: r.version ?? "v2026.1",
    fallen: r.fallen ?? false,
    source: {
      sourceClass: r.sourceClass,
      sourceRef: r.sourceRef,
      consolidatedAt: r.consolidatedAt,
      fetchMethod: r.fetchMethod ?? "unknown",
      fetchedAt: r.fetchedAt,
    },
    attestation: {
      level: r.attestation,
      attestedBy: r.attestedBy,
      attestedAt: r.attestedAt,
    },
    freshness: { flag: r.freshness, checkedAt: r.checkedAt, drifting: r.drifting ?? false },
    authority: { level: r.authority, rationale: r.rationale },
  };
}

/** Ærlig standard for regelverk vi ennå ikke har kvalitetssikret. */
const UNVERIFIED: PinRecipe = {
  sourceClass: "unknown",
  attestation: "not_attested",
  freshness: "unknown",
  authority: "observe",
  rationale: "Kilden er ikke dokumentert og innholdet er ikke attestert av et menneske.",
};

const SECONDARY_SCRAPE: PinRecipe = {
  sourceClass: "secondary",
  fetchMethod: "scrape",
  attestation: "not_attested",
  freshness: "aging",
  authority: "observe",
  rationale: "Sekundærkilde uten attestering — kan ikke omtales som gjeldende rett.",
};

const FRAMEWORK_PIN_RECIPES: Record<string, PinRecipe> = {
  gdpr: {
    sourceClass: "official_consolidated",
    sourceRef: "CELEX:32016R0679",
    consolidatedAt: "2026-01-15",
    fetchMethod: "api",
    fetchedAt: "2026-06-12",
    attestation: "human_verified",
    attestedBy: "Synnøve Olset (juridisk)",
    attestedAt: "2026-06-12",
    freshness: "current",
    checkedAt: "2026-08-20",
    authority: "commit",
    rationale: "Konsolidert offisiell kilde attestert av menneske og fersk.",
    version: "v2026.2",
  },
  personopplysningsloven: {
    sourceClass: "official_consolidated",
    sourceRef: "LOV-2018-06-15-38 (Lovdata)",
    consolidatedAt: "2026-01-01",
    fetchMethod: "api",
    fetchedAt: "2026-05-04",
    attestation: "human_reviewed",
    attestedBy: "Synnøve Olset (juridisk)",
    attestedAt: "2026-05-04",
    freshness: "current",
    checkedAt: "2026-08-14",
    authority: "prepare",
    rationale: "Offisiell konsolidert lovtekst gjennomgått av menneske.",
  },
  nis2: {
    sourceClass: "secondary",
    sourceRef: "https://example.org/nis2-sammendrag",
    fetchMethod: "scrape",
    attestation: "not_attested",
    freshness: "unknown",
    authority: "observe",
    rationale: "Sekundærkilde uten attestering — kan ikke omtales som gjeldende rett.",
    version: "v2025.4",
  },
  "ai-act": {
    sourceClass: "official_raw",
    sourceRef: "CELEX:32024R1689",
    consolidatedAt: "2025-12-01",
    fetchMethod: "api",
    fetchedAt: "2026-02-01",
    attestation: "human_reviewed",
    attestedBy: "Kari Nordmann (compliance)",
    attestedAt: "2026-02-01",
    freshness: "stale",
    checkedAt: "2026-08-18",
    drifting: true,
    authority: "observe",
    rationale: "Pin falt — innholdsversjonen er endret siden pinning.",
    fallen: true,
  },
  dora: {
    sourceClass: "official_raw",
    sourceRef: "CELEX:32022R2554",
    fetchMethod: "api",
    fetchedAt: "2026-04-09",
    attestation: "self_declared",
    attestedBy: "Mynder innholdsteam",
    attestedAt: "2026-04-09",
    freshness: "aging",
    checkedAt: "2026-07-02",
    authority: "suggest",
    rationale: "Offisiell rådata, men kun egenerklært kvalitet.",
  },
  cra: {
    sourceClass: "official_raw",
    sourceRef: "CELEX:32024R2847",
    fetchMethod: "api",
    fetchedAt: "2026-03-20",
    attestation: "not_attested",
    freshness: "aging",
    checkedAt: "2026-07-02",
    authority: "explain",
    rationale: "Offisiell rådata uten menneskelig attestering.",
  },
  csrd: {
    sourceClass: "official_raw",
    sourceRef: "CELEX:32022L2464",
    fetchMethod: "api",
    fetchedAt: "2026-02-18",
    attestation: "not_attested",
    freshness: "aging",
    checkedAt: "2026-06-30",
    authority: "explain",
    rationale: "Offisiell rådata uten menneskelig attestering.",
  },
  apenhetsloven: {
    sourceClass: "official_consolidated",
    sourceRef: "LOV-2021-06-18-99 (Lovdata)",
    consolidatedAt: "2025-07-01",
    fetchMethod: "api",
    fetchedAt: "2026-01-22",
    attestation: "human_reviewed",
    attestedBy: "Synnøve Olset (juridisk)",
    attestedAt: "2026-01-22",
    freshness: "current",
    checkedAt: "2026-08-11",
    authority: "prepare",
    rationale: "Konsolidert lovtekst gjennomgått av menneske.",
  },
  arbeidsmiljoloven: {
    sourceClass: "official_consolidated",
    sourceRef: "LOV-2005-06-17-62 (Lovdata)",
    consolidatedAt: "2026-01-01",
    fetchMethod: "api",
    fetchedAt: "2026-01-30",
    attestation: "self_declared",
    freshness: "current",
    checkedAt: "2026-08-01",
    authority: "suggest",
    rationale: "Konsolidert kilde, men kun egenerklært kvalitet.",
  },
  bokforingsloven: {
    sourceClass: "official_consolidated",
    sourceRef: "LOV-2004-11-19-73 (Lovdata)",
    consolidatedAt: "2025-01-01",
    fetchMethod: "api",
    fetchedAt: "2025-11-12",
    attestation: "not_attested",
    freshness: "aging",
    checkedAt: "2026-05-20",
    authority: "explain",
    rationale: "Offisiell kilde, men ikke attestert og ikke nylig kontrollert.",
  },
  hvitvasking: {
    sourceClass: "official_raw",
    sourceRef: "LOV-2018-06-01-23 (Lovdata)",
    fetchMethod: "scrape",
    fetchedAt: "2025-10-04",
    attestation: "not_attested",
    freshness: "stale",
    checkedAt: "2026-04-02",
    authority: "observe",
    rationale: "Innhentet fra nettside, ikke attestert og utdatert kontroll.",
  },
  internkontroll: { ...SECONDARY_SCRAPE, fetchedAt: "2025-09-18", checkedAt: "2026-05-05" },
  hms: { ...SECONDARY_SCRAPE, fetchedAt: "2025-09-18", checkedAt: "2026-05-05" },
  normen: {
    sourceClass: "secondary",
    sourceRef: "https://www.ehelse.no/normen",
    fetchMethod: "scrape",
    fetchedAt: "2026-02-11",
    attestation: "self_declared",
    freshness: "aging",
    checkedAt: "2026-07-15",
    authority: "suggest",
    rationale: "Sekundærkilde med egenerklært kvalitet.",
  },
  nsm: { ...SECONDARY_SCRAPE, fetchedAt: "2026-01-08", checkedAt: "2026-07-20" },
  "nsm-grunnprinsipper": { ...SECONDARY_SCRAPE, fetchedAt: "2026-01-08", checkedAt: "2026-07-20" },
  "cis-controls": { ...SECONDARY_SCRAPE, fetchedAt: "2025-12-02" },
  "nist-csf": {
    sourceClass: "official_raw",
    sourceRef: "NIST CSF 2.0",
    fetchMethod: "manual_upload",
    fetchedAt: "2025-08-30",
    attestation: "self_declared",
    freshness: "aging",
    checkedAt: "2026-06-01",
    authority: "suggest",
    rationale: "Offisiell rådata lastet opp manuelt, egenerklært kvalitet.",
  },
  soc2: {
    sourceClass: "secondary",
    sourceRef: "AICPA TSC (sammendrag)",
    fetchMethod: "manual_upload",
    fetchedAt: "2025-11-25",
    attestation: "not_attested",
    freshness: "aging",
    checkedAt: "2026-05-28",
    authority: "observe",
    rationale: "Sekundær sammenstilling av lisensiert standard — ikke attestert.",
  },
  "ai-ethics": { ...UNVERIFIED },
};

/** Lisensierte standarder distribueres ikke som fulltekst — ærlig lav Pin. */
const LICENSED_STANDARD: PinRecipe = {
  sourceClass: "secondary",
  sourceRef: "Lisensiert standard — kun kravsammendrag",
  fetchMethod: "manual_upload",
  attestation: "self_declared",
  attestedBy: "Mynder innholdsteam",
  freshness: "aging",
  authority: "suggest",
  rationale:
    "Standarden er lisensiert; Mynder bruker et egenerklært kravsammendrag, ikke offisiell fulltekst.",
};

for (const id of [
  "iso27001",
  "iso27002",
  "iso27701",
  "iso42001",
  "iso42005",
  "iso9001",
  "iso14001",
  "iso45001",
]) {
  FRAMEWORK_PIN_RECIPES[id] = { ...LICENSED_STANDARD, fetchedAt: "2026-01-10", checkedAt: "2026-06-18" };
}

export const PIN_BY_FRAMEWORK: Record<string, Pin> = Object.fromEntries(
  Object.entries(FRAMEWORK_PIN_RECIPES).map(([id, r]) => [id, buildPin(id, r)]),
);

/** Regelverk vi ikke har en oppskrift for får en ærlig «ikke verifisert»-Pin. */
export function getFrameworkPin(frameworkId: string): Pin {
  return PIN_BY_FRAMEWORK[frameworkId] ?? buildPin(frameworkId, UNVERIFIED);
}

/**
 * Deterministisk oppslag. Regelverk-id-er treffer den faste katalogen;
 * øvrige nøkler (f.eks. agenter) faller tilbake til mock-poolen.
 */
export function getMockPin(key: string): Pin | undefined {
  if (PIN_BY_FRAMEWORK[key]) return PIN_BY_FRAMEWORK[key];
  const k = key.toLowerCase();
  if (PIN_BY_FRAMEWORK[k]) return PIN_BY_FRAMEWORK[k];
  if (k.includes("gdpr") || k.includes("personvern")) return MOCK_PINS.gdpr;
  if (k.includes("ai")) return MOCK_PINS.aiact;
  if (k.includes("nis")) return MOCK_PINS.nis2;
  // Ærlig standard: de fleste enheter er ikke verifisert.
  const pool = [MOCK_PINS.nis2, MOCK_PINS.aiact, MOCK_PINS.nis2, MOCK_PINS.gdpr];
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) % 9973;
  return pool[hash % pool.length];
}

