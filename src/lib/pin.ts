/**
 * Pin — proveniens-/kvalitetsmarkør for regelverk og AI-agenter.
 *
 * Pin har NØYAKTIG TO tilstander, og alt som er produksjonssatt har alltid én
 * av dem:
 *   - human_verified → grønn rosett, «Menneskeverifisert»
 *   - agent_verified → oransje rosett, «Agentverifisert»
 *
 * Fargen forteller HVEM som verifiserte — aldri hvor bra innholdet er. Grønn er
 * ikke «bedre» enn oransje; de er sidestilte kvalitetsnivåer med ulik
 * verifikator. Innhold uten verifikasjon produksjonssettes ikke, og kan derfor
 * ikke rendres.
 *
 * Pin er knyttet til INNHOLDSVERSJON (content_hash + unit_version). Endres
 * teksten etter menneskelig verifikasjon, gjelder merket den nye versjonen som
 * agentverifisert, og forrige verifikasjon vises som historikk
 * (`previousAttestation`).
 */

import { frameworks } from "./frameworkDefinitions";

export type PinSourceClass =
  | "official_consolidated"
  | "official_raw"
  | "secondary"
  | "unknown";

export type PinAttestationLevel = "human_verified" | "agent_verified";

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
  /**
   * Organisasjon eller agentrolle — aldri personnavn.
   * Personidentitet hører kun hjemme i revisjonslogg med tilgangsstyring.
   */
  attestedBy?: string;
  /** Valgfri rolle, f.eks. «juridisk fagansvarlig». Aldri en person. */
  attestedByRole?: string;
  attestedAt?: string;
  /** Ikke-avslørende identifikator for agenten som verifiserte. */
  agentId?: string;
  /** Alias for agenten, f.eks. «LEX-3». Aldri modell eller leverandør. */
  agentAlias?: string;
  /** Kontrollrutine i kvalitetssystemet, uten metodedetaljer. */
  routineRef?: string;
}

export interface PinFreshnessDimension {
  flag: PinFreshnessFlag;
  checkedAt?: string;
  /** Drift oppdaget: innholdet driver fra kilden. */
  drifting: boolean;
}

export interface PinPreviousAttestation {
  level: PinAttestationLevel;
  at?: string;
  unitVersion: string;
}

export interface PinSubject {
  id: string;
  label: string;
}

/** Kravtelling for regelverket merket gjelder. */
export interface PinRequirements {
  total: number;
  requiringDocs: number;
  missing: number;
}

/** En rettskilde som innholdet bygger på. */
export interface PinSourceEntry {
  label: string;
  ref?: string;
  note?: string;
}

export interface Pin {
  pin_id: string;
  content_hash: string;
  pinned_at: string;
  unit_version: string;
  source: PinSourceDimension;
  attestation: PinAttestationDimension;
  freshness: PinFreshnessDimension;
  /** Historikk: forrige versjon hadde høyere verifikator. */
  previousAttestation?: PinPreviousAttestation;
  /** Hva merket gjelder — f.eks. regelverket. */
  subject?: PinSubject;
  /** Kravtelling som vises i hover. */
  requirements?: PinRequirements;
  /** Alle rettskilder innholdet bygger på. */
  sources?: PinSourceEntry[];
  /** Hva vi følger i tillegg til rettskildene. */
  alsoFollows?: string;
  /** Sist sjekket mot kilden (fritekst, f.eks. «I dag, 06:00»). */
  lastSourceCheck?: string;
  /** Når menneskelig verifikasjon forfaller. */
  attestationExpiresAt?: string;
  /** Hvor ofte kilden sjekkes, f.eks. «kilden sjekkes daglig». */
  sourceCheckCadence?: string;
}

/* ---------------------------------------------------------------- labels */

export const SOURCE_CLASS_LABEL: Record<PinSourceClass, string> = {
  official_consolidated: "Offisiell konsolidert kilde",
  official_raw: "Offisiell kilde (rådata)",
  secondary: "Sekundærkilde",
  unknown: "Kilde ikke dokumentert",
};

export const SOURCE_CLASS_DESCRIPTION: Record<PinSourceClass, string> = {
  official_consolidated:
    "Kilden er offisiell og har blitt konsolidert, det vil si samlet til én gjeldende versjon av regelverket.",
  official_raw:
    "Kilden er offisiell, men viser rådata uten at ulike endringer er slått sammen til én versjon.",
  secondary: "Kilden er ikke primær, for eksempel en tolkning, veileder eller fagartikkel.",
  unknown: "Kilden er ikke dokumentert.",
};

/** Visningsnavn og URL for en kildereferanse. */
export function sourceRefDisplay(ref?: string): string {
  if (!ref) return UNKNOWN_TEXT;
  if (ref.startsWith("CELEX:")) return `EUR-Lex ${ref.replace("CELEX:", "")}`;
  if (ref.startsWith("lovdata:")) return `Lovdata ${ref.replace("lovdata:", "")}`;
  return ref;
}

export function sourceRefHref(ref?: string): string | undefined {
  if (!ref) return undefined;
  if (ref.startsWith("CELEX:")) {
    return `https://eur-lex.europa.eu/legal-content/NO/TXT/?uri=${encodeURIComponent(ref)}`;
  }
  if (ref.startsWith("lovdata:")) {
    return `https://lovdata.no/${ref.replace("lovdata:", "")}`;
  }
  return undefined;
}

export const VERIFICATION_FREQUENCY_TEXT = "Hver 12. måned";

export const ATTESTATION_LABEL: Record<PinAttestationLevel, string> = {
  human_verified: "Menneskeverifisert",
  agent_verified: "Agentverifisert",
};

/** Hvem som verifiserte — aldri personnavn. */
export const ATTESTATION_VERIFIER_TEXT: Record<PinAttestationLevel, string> = {
  human_verified: "Mynder, juridisk fagansvarlig",
  agent_verified: "Regelverksagent",
};

/** Hvilken kontrollmetode som ligger bak verifiseringen. */
export const ATTESTATION_METHOD_TEXT: Record<PinAttestationLevel, string> = {
  human_verified: "manuell fagvurdering",
  agent_verified: "automatisk kildesjekk",
};

/** Hvem/hva som produserte innholdet ut fra kilden. */
export const CONTENT_CREATED_BY_TEXT: Record<PinAttestationLevel, string> = {
  human_verified: "Menneske, bearbeidet fra kilde",
  agent_verified: "Agent, bearbeidet fra kilde",
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

export const PIN_ROW_LABEL = {
  agent: "Agent",
  agentId: "Agent-ID",
  routine: "Kontrollrutine",
} as const;

/** Ukjent/manglende verdi vises alltid eksplisitt, aldri som tom streng. */
export const UNKNOWN_TEXT = "Ukjent";

/** Kort forklaring på hvem som står bak innholdet. */
export const ATTESTATION_SUMMARY_TEXT: Record<PinAttestationLevel, string> = {
  human_verified: "Gjennomgått av Mynder juridisk.",
  agent_verified:
    "Utledet og kontrollert av Regelverksagenten. Ikke gjennomgått av en jurist.",
};

/** Punktene i «Slik kvalitetssikrer vi regelverk». */
export const QUALITY_PROCESS_STEPS: string[] = [
  "Teksten hentes fra den offisielle rettskilden, aldri fra en oppsummering.",
  "Kravene utledes fra teksten, og hvert krav peker tilbake på bestemmelsen det bygger på.",
  "Et uavhengig kontrollpass ser etter manglende kildekobling, motstrid og overtolkning.",
  "En jurist i Mynder går gjennom der konsekvensen er størst, og tar stikkprøver ellers.",
  "Vi følger kildene løpende. Endres teksten, starter en ny gjennomgang.",
  "Merket på hvert regelverk viser hvem som sist gikk gjennom innholdet — en jurist eller en agent.",
];

export const QUALITY_PROCESS_DISCLAIMER =
  "Innholdet er dokumentasjon av gjeldende regelverk. Det er ikke juridisk rådgivning.";

export const SOURCE_POLICY_TEXT =
  "Vi bygger bare på offisielle rettskilder.";

export const SOURCE_CHANGE_TEXT =
  "Endres teksten i en av kildene over, starter en ny gjennomgang automatisk. Innhold som var menneskeverifisert står som agentverifisert til en jurist har sett på den nye teksten.";

export function formatPinDate(value?: string): string {
  if (!value) return UNKNOWN_TEXT;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return UNKNOWN_TEXT;
  return d.toLocaleDateString("nb-NO", { day: "numeric", month: "short", year: "numeric" });
}

/** Dato pluss enkel relativ periode på norsk, f.eks. «31. aug. 2026 · 1 dag siden». */
export function formatPinRelativeDate(value?: string): string {
  const formatted = formatPinDate(value);
  if (formatted === UNKNOWN_TEXT || !value) return formatted;
  const d = new Date(value);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return `${formatted} · i dag`;
  if (diffDays === 0) return `${formatted} · i dag`;
  if (diffDays === 1) return `${formatted} · 1 dag siden`;
  if (diffDays < 30) return `${formatted} · ${diffDays} dager siden`;
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths === 1) return `${formatted} · 1 måned siden`;
  if (diffMonths < 12) return `${formatted} · ${diffMonths} måneder siden`;
  const diffYears = Math.floor(diffMonths / 12);
  if (diffYears === 1) return `${formatted} · 1 år siden`;
  return `${formatted} · ${diffYears} år siden`;
}

/** Tokenklasser per tilstand. Farge er aldri eneste bærer av mening. */
export const PIN_LEVEL_CLASS: Record<PinAttestationLevel, string> = {
  human_verified: "border-pin-human/40 bg-pin-human-soft text-pin-human-fg",
  agent_verified: "border-pin-agent/40 bg-pin-agent-soft text-pin-agent-fg",
};

export const PIN_LEVEL_ROSETTE_CLASS: Record<PinAttestationLevel, string> = {
  human_verified: "text-pin-human",
  agent_verified: "text-pin-agent",
};

/** Én linje for hover/fokus: «Verifisert av <verifikator> · <dato> · <kilde>». */
export function pinTooltipLine(pin: Pin): string {
  return [
    `Verifisert av ${ATTESTATION_VERIFIER_TEXT[pin.attestation.level]}`,
    formatPinDate(pin.attestation.attestedAt ?? pin.freshness.checkedAt),
    pin.source.sourceRef || SOURCE_CLASS_LABEL[pin.source.sourceClass],
  ].join(" · ");
}

/* ------------------------------------------------- oppbygging av demo-Pin */

type PinRecipe = {
  sourceClass: PinSourceClass;
  sourceRef?: string;
  consolidatedAt?: string;
  fetchMethod?: PinSourceDimension["fetchMethod"];
  fetchedAt?: string;
  attestation: PinAttestationLevel;
  attestedBy?: string;
  attestedByRole?: string;
  attestedAt?: string;
  agentId?: string;
  agentAlias?: string;
  routineRef?: string;
  freshness: PinFreshnessFlag;
  checkedAt?: string;
  drifting?: boolean;
  version?: string;
  previousAttestation?: PinPreviousAttestation;
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
      attestedByRole: r.attestedByRole,
      attestedAt: r.attestedAt,
      agentId: r.agentId,
      agentAlias: r.agentAlias,
      routineRef: r.routineRef,
    },
    freshness: { flag: r.freshness, checkedAt: r.checkedAt, drifting: r.drifting ?? false },
    previousAttestation: r.previousAttestation,
  };
}

const ANONYMOUS_ATTESTANT = "Mynder";
const ATTESTANT_ROLE = "juridisk fagansvarlig";
const AGENT_ATTESTANT = "Mynder-agent";
const AGENT_ROLE = "dokumentert kontrollrutine";

const AGENT_ALIASES = ["LEX-1", "LEX-2", "LEX-3", "LEX-4"] as const;
const AGENT_ROUTINES: Record<string, string> = {
  "LEX-1": "Kildesjekk og versjonskontroll, rutine QS-02",
  "LEX-2": "Kildesjekk og artikkelmapping, rutine QS-04",
  "LEX-3": "Kravutledning og kryssreferanse, rutine QS-06",
  "LEX-4": "Endringsovervåking mot kilde, rutine QS-08",
};

function aliasFor(id: string): string {
  const h = parseInt(stableHex(id + "alias", 4), 16);
  return AGENT_ALIASES[h % AGENT_ALIASES.length];
}

/** Standard for alt som er produksjonssatt uten menneskelig verifikasjon. */
function agentRecipe(id: string): PinRecipe {
  const alias = aliasFor(id);
  return {
    sourceClass: "official_raw",
    attestation: "agent_verified",
    attestedBy: AGENT_ATTESTANT,
    attestedByRole: AGENT_ROLE,
    attestedAt: "2026-08-26",
    agentId: `agt_${stableHex(id + "agent", 6)}`,
    agentAlias: alias,
    routineRef: AGENT_ROUTINES[alias],
    freshness: "current",
    checkedAt: "2026-08-26",
  };
}

function humanRecipe(id: string, sourceRef: string): PinRecipe {
  return {
    sourceClass: "official_consolidated",
    sourceRef,
    fetchMethod: "manual_upload",
    attestation: "human_verified",
    attestedBy: ANONYMOUS_ATTESTANT,
    attestedByRole: ATTESTANT_ROLE,
    attestedAt: "2026-08-26",
    routineRef: "Manuell fagvurdering, rutine QS-01",
    freshness: "current",
    checkedAt: "2026-08-26",
  };
}

const HUMAN_VERIFIED_FRAMEWORKS: Record<string, string> = {
  nis2: "CELEX:32022L2555",
  "ai-act": "CELEX:32024R1689",
  gdpr: "CELEX:32016R0679",
};

const FRAMEWORK_PIN_RECIPES: Record<string, PinRecipe> = Object.fromEntries([
  ...frameworks.map((f) => [f.id, agentRecipe(f.id)] as const),
  ...Object.entries(HUMAN_VERIFIED_FRAMEWORKS).map(
    ([id, ref]) => [id, humanRecipe(id, ref)] as const,
  ),
]);

/** Deterministisk tall i et intervall, stabilt per id. */
function stableNumber(seed: string, min: number, max: number): number {
  const hex = stableHex(seed, 6);
  return min + (parseInt(hex, 16) % (max - min + 1));
}

/** Fyller Pin med regelverksnavn, kravtelling og kildeliste. */
function enrichPin(id: string, pin: Pin): Pin {
  const fw = frameworks.find((f) => f.id === id);
  const label = fw?.name ?? id.toUpperCase();
  const total = stableNumber(id + "req", 18, 62);
  const requiringDocs = Math.max(4, Math.round(total * 0.62));
  const missing = stableNumber(id + "miss", 0, 8);

  const sources: PinSourceEntry[] = [];
  if (pin.source.sourceRef) {
    sources.push({
      label: sourceRefDisplay(pin.source.sourceRef),
      ref: pin.source.sourceRef,
      note: pin.source.consolidatedAt
        ? `konsolidert ${formatPinDate(pin.source.consolidatedAt)}`
        : "konsolidert 04.05.2016",
    });
  }
  if (id === "gdpr") {
    sources.push({
      label: "Personopplysningsloven",
      ref: "lovdata:lov/2018-06-15-38",
      note: "sist endret 01.01.2024",
    });
  }
  if (sources.length === 0) {
    sources.push({ label: SOURCE_CLASS_LABEL[pin.source.sourceClass] });
  }

  return {
    ...pin,
    subject: { id, label: fw?.name.split(" / ")[0] ?? label },
    requirements: { total, requiringDocs, missing },
    sources,
    alsoFollows: "Avgjørelser og veiledning fra EU-domstolen, EDPB og Datatilsynet",
    lastSourceCheck: "I dag, 06:00",
    attestationExpiresAt:
      pin.attestation.level === "human_verified" ? "2027-08-26" : undefined,
    sourceCheckCadence:
      pin.attestation.level === "agent_verified" ? "kilden sjekkes daglig" : undefined,
  };
}

export const PIN_BY_FRAMEWORK: Record<string, Pin> = Object.fromEntries(
  Object.entries(FRAMEWORK_PIN_RECIPES).map(([id, r]) => [id, enrichPin(id, buildPin(id, r))]),
);

/** Alt produksjonssatt har en Pin — ukjente id-er er agentverifisert. */
export function getFrameworkPin(frameworkId: string): Pin {
  return (
    PIN_BY_FRAMEWORK[frameworkId] ??
    enrichPin(frameworkId, buildPin(frameworkId, agentRecipe(frameworkId)))
  );
}

/** Oppslag for ikke-regelverk (f.eks. agenter). */
export function getMockPin(key: string): Pin {
  return (
    PIN_BY_FRAMEWORK[key] ??
    PIN_BY_FRAMEWORK[key.toLowerCase()] ??
    enrichPin(key, buildPin(key, agentRecipe(key)))
  );
}
