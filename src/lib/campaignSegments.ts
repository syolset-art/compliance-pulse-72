/**
 * Lara-segmenter for kampanjer / felles utsendelser fra MSP-partner til kunder.
 *
 * Hver segment har et predikat som tar en (forenklet) kunde og returnerer true
 * hvis kunden treffer kriteriet. I demoflyten genererer vi en mock-kundeliste,
 * men når dette persisteres senere skal predikatene kjøres mot reelle data
 * fra `msp_customers` + `assets` + framework-status.
 */

export type CampaignCustomer = {
  id: string;
  name: string;
  contactName?: string;
  contactEmail?: string;
  sector?: string;
  /** "critical" | "smb" | "mid" | "public" */
  criticality?: string;
  /** 0–100, samlet modenhet */
  maturity?: number;
  /** Risiko-score 0–100 (lavere = høyere risiko) */
  riskScore?: number;
  /** Rammeverk de er omfattet av men IKKE har dekket */
  missingFrameworks?: string[];
  /** Tjenester partner har levert / kunden har kjøpt */
  purchasedServices?: string[];
  /** Trust-profil status */
  trustProfileStatus?: "not_started" | "in_progress" | "complete";
  /** Dager siden siste kontakt */
  daysSinceContact?: number;
  /** Baseline (Se over baseline) fullført — påvirker om regelverk/modenhet kan bekreftes */
  baselineComplete?: boolean;
};

export interface CampaignSegment {
  id: string;
  label: string;
  description: string;
  /** Lara-tag — hvilken slags innsikt segmentet bygger på */
  category: "framework" | "maturity" | "service" | "activity" | "criticality" | "product";
  predicate: (c: CampaignCustomer) => boolean;
}

export const CAMPAIGN_SEGMENTS: CampaignSegment[] = [
  // Regelverk-gap
  {
    id: "needs-nis2",
    label: "Trenger NIS2-vurdering",
    description: "Kunder som er omfattet av NIS2 men ikke har startet vurderingen.",
    category: "framework",
    predicate: (c) => (c.missingFrameworks ?? []).includes("nis2"),
  },
  {
    id: "missing-iso27001",
    label: "Mangler ISO 27001-grunnlag",
    description: "Kunder uten ISO 27001-styringssystem på plass.",
    category: "framework",
    predicate: (c) => (c.missingFrameworks ?? []).includes("iso27001"),
  },
  {
    id: "missing-gdpr-protocol",
    label: "Ikke startet GDPR-protokoll",
    description: "Kunder uten behandlingsprotokoll iht. GDPR Art. 30.",
    category: "framework",
    predicate: (c) => (c.missingFrameworks ?? []).includes("gdpr"),
  },
  {
    id: "transparency-act",
    label: "Berørt av åpenhetsloven uten redegjørelse",
    description: "Større kunder som må publisere aktsomhetsvurdering innen 30. juni.",
    category: "framework",
    predicate: (c) => (c.missingFrameworks ?? []).includes("transparency"),
  },
  {
    id: "ai-without-dpia",
    label: "AI-systemer uten DPIA",
    description: "Kunder som har registrert AI-systemer uten gjennomført personvernkonsekvens.",
    category: "framework",
    predicate: (c) => (c.missingFrameworks ?? []).includes("aiact"),
  },

  // Modenhet & risiko
  {
    id: "low-maturity-privacy",
    label: "Lav modenhet i Privacy",
    description: "Kunder med samlet modenhet under 40 % i personvern-domenet.",
    category: "maturity",
    predicate: (c) => (c.maturity ?? 100) < 40,
  },
  {
    id: "high-risk",
    label: "Risiko under 50 %",
    description: "Kunder hvor Mynder/Lara har avledet høy risiko fra dataene.",
    category: "maturity",
    predicate: (c) => (c.riskScore ?? 100) < 50,
  },

  // Tjeneste-gap
  {
    id: "no-vciso",
    label: "Har ikke kjøpt vCISO",
    description: "Kunder som ikke har en aktiv vCISO-leveranse.",
    category: "service",
    predicate: (c) => !(c.purchasedServices ?? []).includes("vciso"),
  },
  {
    id: "no-active-delivery",
    label: "Ingen pågående leveranse",
    description: "Kunder uten aktiv tjeneste fra dere akkurat nå.",
    category: "service",
    predicate: (c) => (c.purchasedServices ?? []).length === 0,
  },

  // Aktivitet
  {
    id: "trust-profile-not-claimed",
    label: "Har ikke overtatt Trust-profil",
    description: "Kunder hvor dere administrerer profilen, men kunden ikke har claimet den selv ennå.",
    category: "activity",
    predicate: (c) => c.trustProfileStatus !== "complete",
  },
  {
    id: "trust-profile-incomplete",
    label: "Aktiverte Trust-profil men ikke fullført",
    description: "Kunder som har startet, men ikke fullført, sin Trust-profil.",
    category: "activity",
    predicate: (c) => c.trustProfileStatus === "in_progress",
  },
  {
    id: "no-contact-60d",
    label: "Ingen kontakt på 60 dager",
    description: "Kunder dere ikke har snakket med på over 2 måneder.",
    category: "activity",
    predicate: (c) => (c.daysSinceContact ?? 0) >= 60,
  },

  // Kritikalitet
  {
    id: "critical-infrastructure",
    label: "Kritisk infrastruktur",
    description: "Kunder definert som kritisk infrastruktur.",
    category: "criticality",
    predicate: (c) => c.criticality === "critical",
  },
  {
    id: "public-sector",
    label: "Offentlig sektor",
    description: "Kunder i offentlig sektor.",
    category: "criticality",
    predicate: (c) => c.criticality === "public",
  },

  // Mynder-produkter — mersalg av plattform-moduler
  {
    id: "missing-mynder-core",
    label: "Mangler Mynder Core – Styringssystem",
    description: "Kunder uten det agentiske GRC-styringssystemet aktivert. Potensial for mersalg av Mynder Core.",
    category: "product",
    predicate: (c) => !(c.purchasedServices ?? []).includes("mynder-core"),
  },
  {
    id: "missing-vendor-module",
    label: "Mangler Leverandørmodul",
    description: "Kunder uten Mynder Leverandørmodul. Aktuelt for alle med tredjepartsrisiko (DPA, NIS2, DORA).",
    category: "product",
    predicate: (c) => !(c.purchasedServices ?? []).includes("mynder-vendors"),
  },
];

export const SEGMENT_CATEGORY_LABEL: Record<CampaignSegment["category"], string> = {
  framework: "Regelverk-gap",
  maturity: "Modenhet & risiko",
  service: "Tjeneste-gap",
  activity: "Aktivitet",
  criticality: "Kritikalitet",
  product: "Mynder-produkter",
};

/**
 * Demo-kundebase. Erstattes med reelle data fra `msp_customers` når kampanjer
 * persisteres mot Supabase.
 */
export const DEMO_CAMPAIGN_CUSTOMERS: CampaignCustomer[] = [
  {
    id: "c-dintero",
    name: "Dintero AS",
    contactName: "Truls Andersen",
    contactEmail: "truls@dintero.com",
    sector: "Fintech",
    criticality: "critical",
    maturity: 52,
    riskScore: 58,
    missingFrameworks: ["nis2", "iso27001"],
    purchasedServices: ["awareness"],
    trustProfileStatus: "in_progress",
    daysSinceContact: 12,
    baselineComplete: true,
  },
  {
    id: "c-catalystone",
    name: "Catalystone Solutions",
    contactName: "Linn Berg",
    contactEmail: "linn@catalystone.com",
    sector: "SaaS",
    criticality: "mid",
    maturity: 68,
    riskScore: 71,
    missingFrameworks: ["iso27001"],
    purchasedServices: [],
    trustProfileStatus: "complete",
    daysSinceContact: 28,
    baselineComplete: true,
  },
  {
    id: "c-visma",
    name: "Visma Software AS",
    contactName: "Mari Solli",
    contactEmail: "mari.solli@visma.com",
    sector: "SaaS",
    criticality: "critical",
    maturity: 84,
    riskScore: 82,
    missingFrameworks: ["aiact"],
    purchasedServices: ["pentest", "vciso", "mynder-core", "mynder-vendors"],
    trustProfileStatus: "complete",
    daysSinceContact: 4,
    baselineComplete: true,
  },
  {
    id: "c-sparebank1",
    name: "Sparebank 1 Utvikling",
    contactName: "Petter Lien",
    contactEmail: "petter.lien@sparebank1.no",
    sector: "Bank",
    criticality: "critical",
    maturity: 76,
    riskScore: 78,
    missingFrameworks: ["dora"],
    purchasedServices: ["awareness", "mynder-core"],
    trustProfileStatus: "complete",
    daysSinceContact: 45,
    baselineComplete: true,
  },
  {
    id: "c-kommune",
    name: "Bærum kommune",
    contactName: "Ingrid Holm",
    contactEmail: "ingrid.holm@baerum.kommune.no",
    sector: "Offentlig",
    criticality: "public",
    maturity: 38,
    riskScore: 42,
    missingFrameworks: ["nis2", "gdpr"],
    purchasedServices: [],
    trustProfileStatus: "in_progress",
    daysSinceContact: 70,
    baselineComplete: false,
  },
  {
    id: "c-hydra",
    name: "Hydra Industri AS",
    contactName: "Jonas Vik",
    contactEmail: "jonas@hydra-industri.no",
    sector: "Industri",
    criticality: "mid",
    maturity: 44,
    riskScore: 49,
    missingFrameworks: ["nis2", "transparency"],
    purchasedServices: [],
    trustProfileStatus: "not_started",
    daysSinceContact: 90,
    baselineComplete: false,
  },
  {
    id: "c-northpower",
    name: "NorthPower Energi",
    contactName: "Eva Strand",
    contactEmail: "eva.strand@northpower.no",
    sector: "Energi",
    criticality: "critical",
    maturity: 35,
    riskScore: 40,
    missingFrameworks: ["nis2"],
    purchasedServices: [],
    trustProfileStatus: "not_started",
    daysSinceContact: 110,
    baselineComplete: false,
  },
  {
    id: "c-medtech",
    name: "MedTech Norge AS",
    contactName: "Sara Lund",
    contactEmail: "sara@medtech.no",
    sector: "Helse",
    criticality: "critical",
    maturity: 60,
    riskScore: 62,
    missingFrameworks: ["aiact", "gdpr"],
    purchasedServices: ["awareness"],
    trustProfileStatus: "in_progress",
    daysSinceContact: 22,
    baselineComplete: true,
  },
];

export function applySegments(
  customers: CampaignCustomer[],
  segmentIds: string[],
  combine: "and" | "or" = "or",
): CampaignCustomer[] {
  if (segmentIds.length === 0) return [];
  const segs = CAMPAIGN_SEGMENTS.filter((s) => segmentIds.includes(s.id));
  return customers.filter((c) =>
    combine === "and" ? segs.every((s) => s.predicate(c)) : segs.some((s) => s.predicate(c)),
  );
}

/**
 * Returnerer treff splittet på baseline-status. Brukes når valgte segmenter
 * er avhengige av baseline-data (regelverk-gap eller modenhet & risiko).
 */
export function applySegmentsWithBaseline(
  customers: CampaignCustomer[],
  segmentIds: string[],
  combine: "and" | "or" = "or",
): { confirmed: CampaignCustomer[]; possible: CampaignCustomer[]; baselineMatters: boolean } {
  const matches = applySegments(customers, segmentIds, combine);
  const segs = CAMPAIGN_SEGMENTS.filter((s) => segmentIds.includes(s.id));
  const baselineMatters = segs.some(
    (s) => s.category === "framework" || s.category === "maturity",
  );
  if (!baselineMatters) {
    return { confirmed: matches, possible: [], baselineMatters: false };
  }
  return {
    confirmed: matches.filter((c) => c.baselineComplete === true),
    possible: matches.filter((c) => c.baselineComplete !== true),
    baselineMatters: true,
  };
}
