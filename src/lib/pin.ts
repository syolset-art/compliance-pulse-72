/**
 * Pin — proveniens-/kvalitetsmarkør (arbeidstittel) for regelverk og AI-agenter.
 *
 * Pin er en REN DEKLARASJON om hvor innholdet kommer fra og om et menneske har
 * verifisert det. Pin er IKKE en port: den styrer ikke hva en agent får lov til
 * å gjøre, og feller ingen dom om brukbarhet eller compliance.
 *
 * Pin er knyttet til INNHOLDSVERSJON (content_hash + unit_version) — ikke til
 * enheten. Endres teksten etter verifikasjon, faller Pin (`fallen`). En falt Pin
 * blokkerer ikke bruk; den forteller at merket ikke lenger gjelder versjonen.
 *
 * STAGE: Pin skal ikke publiseres ennå. Det finnes ingen backendkilde for Pin
 * i dag. Alle verdier under er nøytrale demo-/placeholderverdier, med unntak av
 * de statusene som er dokumentert (se DOCUMENTED_* under). Ingen oppdiktede
 * personer eller kilder skal forekomme her.
 */

export type PinSourceClass =
  | "official_consolidated"
  | "official_raw"
  | "secondary"
  | "unknown";

export type PinAttestationLevel =
  | "human_verified"
  | "human_reviewed"
  | "ai_processed"
  | "not_attested";

export type PinFreshnessFlag = "current" | "aging" | "stale" | "unknown";

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
  /** Kun mennesker kan verifisere — aldri agenter. */
  attestedBy?: string;
  attestedAt?: string;
}

export interface PinFreshnessDimension {
  flag: PinFreshnessFlag;
  checkedAt?: string;
  /** Drift oppdaget: innholdet driver fra kilden. */
  drifting: boolean;
}

export interface Pin {
  pin_id: string;
  content_hash: string;
  pinned_at: string;
  unit_version: string;
  /** True når innholdsversjonen er endret etter verifikasjon. */
  fallen: boolean;
  source: PinSourceDimension;
  attestation: PinAttestationDimension;
  freshness: PinFreshnessDimension;
}

/* ---------------------------------------------------------------- labels */

export const SOURCE_CLASS_LABEL: Record<PinSourceClass, string> = {
  official_consolidated: "Offisiell konsolidert kilde",
  official_raw: "Offisiell kilde (rådata)",
  secondary: "Sekundærkilde",
  unknown: "Kilde ikke dokumentert",
};

export const ATTESTATION_LABEL: Record<PinAttestationLevel, string> = {
  human_verified: "Menneskeverifisert",
  human_reviewed: "Gjennomgått av menneske",
  ai_processed: "AI-behandlet – ikke menneskeverifisert",
  not_attested: "Ikke menneskeverifisert",
};

export const FRESHNESS_LABEL: Record<PinFreshnessFlag, string> = {
  current: "Nylig kontrollert",
  aging: "Kontrollert for en stund siden",
  stale: "Ikke kontrollert på lenge",
  unknown: "Kontrolltidspunkt ukjent",
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

/** True når Pin er verifisert av et menneske og fortsatt gjelder versjonen. */
export function isHumanVerified(pin?: Pin): boolean {
  if (!pin || pin.fallen) return false;
  return pin.attestation.level === "human_verified" || pin.attestation.level === "human_reviewed";
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
    : s.sourceClass === "unknown"
      ? "neutral"
      : "caution";

export const attestationTone = (a: PinAttestationDimension): PinTone =>
  a.level === "human_verified"
    ? "good"
    : a.level === "human_reviewed"
      ? "good"
      : "caution";

export const freshnessTone = (f: PinFreshnessDimension): PinTone =>
  f.drifting
    ? "caution"
    : f.flag === "current"
      ? "good"
      : f.flag === "unknown"
        ? "neutral"
        : "caution";

/* ------------------------------------------------- oppbygging av demo-Pin */

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
  fallen?: boolean;
  version?: string;
};

/** Deterministisk pseudo-hash for stabile pin_id/content_hash i demo. */
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
  };
}

/**
 * Standard for alt vi IKKE har dokumentert verifikasjonsstatus for.
 * Ingen oppdiktet kilde, ingen oppdiktet person, ingen oppdiktede datoer.
 */
const NOT_VERIFIED: PinRecipe = {
  sourceClass: "unknown",
  attestation: "ai_processed",
  freshness: "unknown",
};

/**
 * Kun regelverk med DOKUMENTERT menneskeverifikasjon settes grønt.
 * Kilde: Notion — NIS2 og AI Act ferdig menneskeverifisert av Vilde 26.08.2026,
 * GDPR Vilde-sikret. Ingen andre regelverk skal settes grønt uten dokumentasjon.
 */
const VILDE = "Vilde (Mynder)";

const FRAMEWORK_PIN_RECIPES: Record<string, PinRecipe> = {
  nis2: {
    sourceClass: "official_consolidated",
    sourceRef: "CELEX:32022L2555",
    fetchMethod: "manual_upload",
    attestation: "human_verified",
    attestedBy: VILDE,
    attestedAt: "2026-08-26",
    freshness: "current",
    checkedAt: "2026-08-26",
  },
  "ai-act": {
    sourceClass: "official_consolidated",
    sourceRef: "CELEX:32024R1689",
    fetchMethod: "manual_upload",
    attestation: "human_verified",
    attestedBy: VILDE,
    attestedAt: "2026-08-26",
    freshness: "current",
    checkedAt: "2026-08-26",
  },
  gdpr: {
    sourceClass: "official_consolidated",
    sourceRef: "CELEX:32016R0679",
    fetchMethod: "manual_upload",
    attestation: "human_reviewed",
    attestedBy: VILDE,
    attestedAt: "2026-08-26",
    freshness: "current",
    checkedAt: "2026-08-26",
  },
};

export const PIN_BY_FRAMEWORK: Record<string, Pin> = Object.fromEntries(
  Object.entries(FRAMEWORK_PIN_RECIPES).map(([id, r]) => [id, buildPin(id, r)]),
);

/** Alt uten dokumentert status får en ærlig «ikke menneskeverifisert»-Pin. */
export function getFrameworkPin(frameworkId: string): Pin {
  return PIN_BY_FRAMEWORK[frameworkId] ?? buildPin(frameworkId, NOT_VERIFIED);
}

/**
 * Oppslag for ikke-regelverk (f.eks. agenter). Ingen tilfeldig pool: alt som
 * ikke har dokumentert verifikasjon vises som «AI-behandlet – ikke
 * menneskeverifisert».
 */
export function getMockPin(key: string): Pin {
  return PIN_BY_FRAMEWORK[key] ?? PIN_BY_FRAMEWORK[key.toLowerCase()] ?? buildPin(key, NOT_VERIFIED);
}
