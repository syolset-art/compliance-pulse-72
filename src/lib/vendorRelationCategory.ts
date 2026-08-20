/**
 * Relasjonskategori for leverandører — hva slags forhold vi har til leverandøren.
 * Lagres i eksisterende kolonne assets.vendor_category.
 */

export interface RelationCategoryOption {
  value: string;
  labelNb: string;
  labelEn: string;
  /** Kort forklaring på hva kategorien påvirker. */
  noteNb: string;
  noteEn: string;
  keywords: string[];
}

export const RELATION_CATEGORIES: RelationCategoryOption[] = [
  {
    value: "saas",
    labelNb: "SaaS-leverandør",
    labelEn: "SaaS vendor",
    noteNb: "Krever oversikt over underleverandørkjede, lagringssted og databehandleravtale.",
    noteEn: "Requires sub-processor chain, hosting location and a data processing agreement.",
    keywords: ["saas", "sky", "cloud", "abonnement", "software", "plattform", "app"],
  },
  {
    value: "it_operations",
    labelNb: "IKT-driftsleverandør",
    labelEn: "IT operations vendor",
    noteNb: "Typisk DORA-relevant: krav til utkontraktering, exit-plan og hendelsesvarsling.",
    noteEn: "Typically DORA relevant: outsourcing requirements, exit plan and incident notification.",
    keywords: ["it-drift", "drift", "managed", "msp", "support", "helpdesk", "operations"],
  },
  {
    value: "infrastructure",
    labelNb: "Infrastrukturleverandør",
    labelEn: "Infrastructure vendor",
    noteNb: "Kritisk underlag: tilgjengelighet, redundans og kontinuitetsplan må dokumenteres.",
    noteEn: "Critical basis: availability, redundancy and continuity plans must be documented.",
    keywords: ["infrastruktur", "infrastructure", "hosting", "datasenter", "network", "nettverk", "identitet", "betaling"],
  },
  {
    value: "consulting",
    labelNb: "Rådgiver eller konsulent",
    labelEn: "Advisor or consultant",
    noteNb: "Fokus på tilgangsstyring, taushetsplikt og avgrenset tilgang i oppdragsperioden.",
    noteEn: "Focus on access management, confidentiality and time-limited access.",
    keywords: ["rådgiv", "consult", "advokat", "revisjon", "audit", "legal"],
  },
  {
    value: "development",
    labelNb: "Utviklingspartner",
    labelEn: "Development partner",
    noteNb: "Krever sikker utvikling, kildekodekontroll og styring av testdata.",
    noteEn: "Requires secure development, source code control and test data governance.",
    keywords: ["utvikling", "development", "dev", "engineering", "software house"],
  },
  {
    value: "staffing",
    labelNb: "Bemanning og innleie",
    labelEn: "Staffing",
    noteNb: "Krever bakgrunnssjekk, opplæring og oppfølging av tilganger ved av- og påmelding.",
    noteEn: "Requires background checks, training and joiner/leaver access follow-up.",
    keywords: ["bemanning", "innleie", "staffing", "rekrutter", "vikar"],
  },
  {
    value: "facilities",
    labelNb: "Fysisk tjeneste eller drift",
    labelEn: "Facilities or physical service",
    noteNb: "Fysisk sikring: adgangskontroll, besøkslogg og lokalsikkerhet.",
    noteEn: "Physical security: access control, visitor logs and premises security.",
    keywords: ["renhold", "vakt", "eiendom", "facility", "kantine", "bygg"],
  },
  {
    value: "other",
    labelNb: "Annet",
    labelEn: "Other",
    noteNb: "Ingen standardkrav utledes automatisk — vurder kravene manuelt.",
    noteEn: "No standard requirements are derived automatically — assess manually.",
    keywords: [],
  },
];

export function relationCategoryLabel(value: string | null | undefined, isNb: boolean): string {
  const found = RELATION_CATEGORIES.find((c) => c.value === value);
  if (!found) return isNb ? "Ikke satt" : "Not set";
  return isNb ? found.labelNb : found.labelEn;
}

export function relationCategoryNote(value: string | null | undefined, isNb: boolean): string | null {
  const found = RELATION_CATEGORIES.find((c) => c.value === value);
  if (!found) return null;
  return isNb ? found.noteNb : found.noteEn;
}

/** Enkelt nøkkelordbasert forslag basert på navn, beskrivelse, kategori og bruks-tagger. */
export function suggestRelationCategory(input: {
  vendorName?: string | null;
  description?: string | null;
  category?: string | null;
  usageTags?: string[];
}): string | null {
  const haystack = [
    input.vendorName,
    input.description,
    input.category,
    ...(input.usageTags || []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (!haystack.trim()) return null;

  let best: { value: string; hits: number } | null = null;
  for (const c of RELATION_CATEGORIES) {
    const hits = c.keywords.filter((k) => haystack.includes(k)).length;
    if (hits > 0 && (!best || hits > best.hits)) best = { value: c.value, hits };
  }
  return best?.value ?? null;
}
