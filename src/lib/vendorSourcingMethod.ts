/**
 * Innhentingsmetode per leverandør.
 *
 * «Be om grunnlag» er ikke én handling, men et valg av metode. Hvem som gjør
 * jobben avhenger av to akser:
 *   1) Mandatstyrke — har kjøperen makt/insentiv til å få leverandøren til å jobbe?
 *   2) Offentlig fotavtrykk — ligger beviset allerede publisert (Trust Center,
 *      ISO/SOC, transparency-rapporter)?
 *
 * Lara anbefaler metoden som matcher den parten som faktisk er motivert til å
 * handle, og den laveste innsatsen som gir godt nok grunnlag.
 *
 * Prototypelagring: localStorage per assetId (samme mønster som agenticTrustCenter.ts).
 */

export type SourcingMethod = "public_harvest" | "email_request" | "vendor_agentic";

/** Bevisnivå metoden gir — «claimet» er et kvalitetsnivå, ikke en forutsetning. */
export type EvidenceLevel = "ai_public" | "vendor_stated" | "vendor_verified";

export interface SourcingMethodMeta {
  key: SourcingMethod;
  label: { nb: string; en: string };
  /** Hva metoden innebærer. */
  description: { nb: string; en: string };
  /** CTA-tekst i banner/kort. */
  cta: { nb: string; en: string };
  /** Hvor mye innsats leverandøren må legge inn. */
  vendorEffort: "none" | "low" | "high";
  vendorEffortLabel: { nb: string; en: string };
  evidenceLevel: EvidenceLevel;
  evidenceLabel: { nb: string; en: string };
}

export const SOURCING_METHOD_META: Record<SourcingMethod, SourcingMethodMeta> = {
  public_harvest: {
    key: "public_harvest",
    label: { nb: "Kunde-drevet kartlegging", en: "Customer-driven mapping" },
    description: {
      nb: "En agent høster offentlige kilder — Trust Center, ISO/SOC-sertifikater og transparency-rapporter. Leverandøren deltar ikke.",
      en: "An agent harvests public sources — Trust Center, ISO/SOC certificates and transparency reports. The vendor is not involved.",
    },
    cta: { nb: "La agenten kartlegge offentlige kilder", en: "Let the agent map public sources" },
    vendorEffort: "none",
    vendorEffortLabel: { nb: "Ingen innsats fra leverandøren", en: "No vendor effort" },
    evidenceLevel: "ai_public",
    evidenceLabel: { nb: "AI-utledet fra offentlig kilde", en: "AI-derived from public source" },
  },
  email_request: {
    key: "email_request",
    label: { nb: "Lettvekts leverandør-respons", en: "Lightweight vendor response" },
    description: {
      nb: "Én e-post — leverandøren svarer med vedlegg. Laveste tenkelige terskel, og standardveien for de fleste leverandører.",
      en: "One email — the vendor replies with attachments. The lowest possible threshold, and the default for most vendors.",
    },
    cta: { nb: "Send forespørsel på e-post", en: "Send email request" },
    vendorEffort: "low",
    vendorEffortLabel: { nb: "Minimal innsats", en: "Minimal effort" },
    evidenceLevel: "vendor_stated",
    evidenceLabel: { nb: "Oppgitt av leverandøren", en: "Stated by the vendor" },
  },
  vendor_agentic: {
    key: "vendor_agentic",
    label: { nb: "Leverandør-eid agentisk profil", en: "Vendor-owned agentic profile" },
    description: {
      nb: "Leverandøren overtar og vedlikeholder profilen selv. Krever at mandatet er sterkt nok til å rettferdiggjøre innsatsen deres.",
      en: "The vendor claims and maintains the profile. Only realistic when the mandate justifies their effort.",
    },
    cta: { nb: "Inviter til Agentisk Trust Profile", en: "Invite to Agentic Trust Profile" },
    vendorEffort: "high",
    vendorEffortLabel: { nb: "Full deltakelse", en: "Full participation" },
    evidenceLevel: "vendor_verified",
    evidenceLabel: { nb: "Verifisert av leverandøren", en: "Verified by the vendor" },
  },
};

export const SOURCING_METHOD_ORDER: SourcingMethod[] = [
  "public_harvest",
  "email_request",
  "vendor_agentic",
];

export type SignalLevel = "high" | "medium" | "low";

export interface SourcingSignals {
  /** Hvor mye leverandøren allerede publiserer offentlig. */
  publicFootprint: SignalLevel;
  /** Kundens mandatstyrke overfor leverandøren. */
  mandate: SignalLevel;
  /** Kritikalitet for kunden — hever kravet til bevisnivå. */
  criticality?: SignalLevel;
}

export interface SourcingRecommendation {
  primary: SourcingMethod;
  alternative?: SourcingMethod;
  rationale: { nb: string; en: string };
}

/** Laras heuristikk — mandat vs. offentlig fotavtrykk. */
export function recommendSourcingMethod(signals: SourcingSignals): SourcingRecommendation {
  const { publicFootprint, mandate } = signals;

  if (publicFootprint === "high" && mandate !== "high") {
    return {
      primary: "public_harvest",
      alternative: mandate === "medium" ? "vendor_agentic" : undefined,
      rationale: {
        nb: "Leverandøren publiserer dokumentasjonen selv, og har lite insentiv til å svare oss. La en agent kartlegge de offentlige kildene — du trenger ikke involvere leverandøren.",
        en: "The vendor already publishes this and has little incentive to respond to us. Let an agent map the public sources — no vendor involvement needed.",
      },
    };
  }

  if (mandate === "high") {
    return {
      primary: "vendor_agentic",
      alternative: publicFootprint === "high" ? "public_harvest" : "email_request",
      rationale: {
        nb: "Du har et sterkt mandat overfor denne leverandøren. Invitér dem til å eie profilen selv — da holdes dokumentasjonen oppdatert uten at du må purre.",
        en: "You have a strong mandate with this vendor. Invite them to own the profile so documentation stays current without chasing.",
      },
    };
  }

  if (publicFootprint === "medium") {
    return {
      primary: "public_harvest",
      alternative: "email_request",
      rationale: {
        nb: "Deler av grunnlaget ligger offentlig. Start med kartlegging, og be leverandøren om det som mangler etterpå.",
        en: "Part of the evidence is public. Start with mapping, then ask the vendor for what's missing.",
      },
    };
  }

  return {
    primary: "email_request",
    alternative: "vendor_agentic",
    rationale: {
      nb: "Lite ligger offentlig, og mandatet er moderat. Én e-post er den laveste terskelen som gir brukbart grunnlag.",
      en: "Little is public and the mandate is moderate. One email is the lowest threshold that yields usable evidence.",
    },
  };
}

// ── Arketyper for prototypen ──────────────────────────────────────────────

export type VendorArchetype = "public_giant" | "hybrid" | "mandated";

export interface VendorArchetypeMeta {
  key: VendorArchetype;
  name: string;
  hint: { nb: string; en: string };
  signals: SourcingSignals;
}

export const VENDOR_ARCHETYPES: VendorArchetypeMeta[] = [
  {
    key: "public_giant",
    name: "Microsoft",
    hint: {
      nb: "Lavt mandat · høyt offentlig fotavtrykk",
      en: "Low mandate · high public footprint",
    },
    signals: { publicFootprint: "high", mandate: "low", criticality: "high" },
  },
  {
    key: "hybrid",
    name: "BankID",
    hint: {
      nb: "Moderat mandat · delvis offentlig",
      en: "Moderate mandate · partly public",
    },
    signals: { publicFootprint: "medium", mandate: "medium", criticality: "high" },
  },
  {
    key: "mandated",
    name: "Helse Vest-leverandør",
    hint: {
      nb: "Sterkt mandat · lite offentlig",
      en: "Strong mandate · little public",
    },
    signals: { publicFootprint: "low", mandate: "high", criticality: "high" },
  },
];

export function archetypeByKey(key: VendorArchetype): VendorArchetypeMeta {
  return VENDOR_ARCHETYPES.find((a) => a.key === key) ?? VENDOR_ARCHETYPES[0];
}

// ── Lagring ───────────────────────────────────────────────────────────────

export interface VendorSourcingState {
  /** Valgt arketype (kun prototype — styrer signalene Lara ser). */
  archetype: VendorArchetype;
  /** Metoden som faktisk er satt i gang. Udefinert = ikke etterspurt ennå. */
  method?: SourcingMethod;
  startedAt?: string;
}

export const EMPTY_SOURCING_STATE: VendorSourcingState = { archetype: "hybrid" };

const KEY = (assetId: string) => `mynder_vendor_sourcing_${assetId}`;

export function readSourcingState(assetId: string): VendorSourcingState {
  try {
    const raw = localStorage.getItem(KEY(assetId));
    if (!raw) return { ...EMPTY_SOURCING_STATE };
    return { ...EMPTY_SOURCING_STATE, ...JSON.parse(raw) };
  } catch {
    return { ...EMPTY_SOURCING_STATE };
  }
}

export function writeSourcingState(assetId: string, state: VendorSourcingState) {
  try {
    localStorage.setItem(KEY(assetId), JSON.stringify(state));
  } catch {
    /* ignorer — kun preferanselagring */
  }
}

/** Tekst når ingen innhenting er startet. */
export const NOT_REQUESTED_LABEL = {
  nb: "Grunnlag for modenhetsvurdering er ikke etterspurt ennå.",
  en: "Evidence for the maturity assessment has not been requested yet.",
};
