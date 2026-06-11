/**
 * Vanlige bransjer i Norge, Norden og Europa.
 * Mapping mot NACE Rev. 2 / SN2007 hovednæringskoder (Brønnøysund/SSB/Eurostat).
 *
 * Verdien som lagres er fortsatt fritekst (label),
 * men `naceCode` og `naceSection` gir en valgfri standardisert kobling
 * som kan brukes til rapportering, AI-analyse og benchmarking senere.
 */
export interface IndustryOption {
  /** Stable identifier */
  id: string;
  /** Norsk visningsnavn (lagres som fritekst) */
  label_nb: string;
  /** Engelsk visningsnavn */
  label_en: string;
  /** NACE Rev. 2 / SN2007 hovedkode (beste tilnærming) */
  naceCode: string;
  /** NACE-seksjon (A–S) */
  naceSection: string;
}

export const INDUSTRY_OPTIONS: IndustryOption[] = [
  { id: "agriculture", label_nb: "Jordbruk, skogbruk og fiske", label_en: "Agriculture, forestry and fishing", naceCode: "01-03", naceSection: "A" },
  { id: "mining", label_nb: "Bergverksdrift og utvinning", label_en: "Mining and quarrying", naceCode: "05-09", naceSection: "B" },
  { id: "oil_gas", label_nb: "Olje og gass", label_en: "Oil and gas", naceCode: "06", naceSection: "B" },
  { id: "manufacturing", label_nb: "Industri og produksjon", label_en: "Manufacturing", naceCode: "10-33", naceSection: "C" },
  { id: "food_production", label_nb: "Næringsmiddelindustri", label_en: "Food production", naceCode: "10", naceSection: "C" },
  { id: "pharma", label_nb: "Farmasi og bioteknologi", label_en: "Pharmaceuticals and biotech", naceCode: "21", naceSection: "C" },
  { id: "medtech", label_nb: "Medtech og medisinsk utstyr", label_en: "Medical devices (medtech)", naceCode: "32.50", naceSection: "C" },
  { id: "energy", label_nb: "Energi og fornybar energi", label_en: "Energy and renewables", naceCode: "35", naceSection: "D" },
  { id: "utilities", label_nb: "Vann, avløp og renovasjon", label_en: "Water, sewerage and waste", naceCode: "36-39", naceSection: "E" },
  { id: "construction", label_nb: "Bygg og anlegg", label_en: "Construction", naceCode: "41-43", naceSection: "F" },
  { id: "wholesale", label_nb: "Engroshandel", label_en: "Wholesale trade", naceCode: "46", naceSection: "G" },
  { id: "retail", label_nb: "Varehandel og detaljhandel", label_en: "Retail trade", naceCode: "47", naceSection: "G" },
  { id: "ecommerce", label_nb: "E-handel", label_en: "E-commerce", naceCode: "47.91", naceSection: "G" },
  { id: "transport", label_nb: "Transport og logistikk", label_en: "Transport and logistics", naceCode: "49-52", naceSection: "H" },
  { id: "maritime", label_nb: "Maritim og shipping", label_en: "Maritime and shipping", naceCode: "50", naceSection: "H" },
  { id: "warehousing", label_nb: "Logistikk og lagervirksomhet", label_en: "Logistics and warehousing", naceCode: "52", naceSection: "H" },
  { id: "hospitality", label_nb: "Overnatting og servering", label_en: "Hospitality (hotel/restaurant)", naceCode: "55-56", naceSection: "I" },
  { id: "tourism", label_nb: "Reiseliv og turisme", label_en: "Travel and tourism", naceCode: "79", naceSection: "N" },
  { id: "ict", label_nb: "Informasjon og kommunikasjon", label_en: "Information and communication", naceCode: "58-63", naceSection: "J" },
  { id: "software", label_nb: "IT og programvare", label_en: "IT and software", naceCode: "62", naceSection: "J" },
  { id: "cybersecurity", label_nb: "Cybersikkerhet", label_en: "Cybersecurity", naceCode: "62.09", naceSection: "J" },
  { id: "telecom", label_nb: "Telekommunikasjon", label_en: "Telecommunications", naceCode: "61", naceSection: "J" },
  { id: "media", label_nb: "Media, forlag og kringkasting", label_en: "Media, publishing and broadcasting", naceCode: "58-60", naceSection: "J" },
  { id: "finance", label_nb: "Finans og forsikring", label_en: "Finance and insurance", naceCode: "64-66", naceSection: "K" },
  { id: "banking", label_nb: "Bank", label_en: "Banking", naceCode: "64.19", naceSection: "K" },
  { id: "realestate", label_nb: "Eiendom og eiendomsmegling", label_en: "Real estate", naceCode: "68", naceSection: "L" },
  { id: "legal", label_nb: "Juridisk tjenesteyting", label_en: "Legal services", naceCode: "69.10", naceSection: "M" },
  { id: "accounting", label_nb: "Regnskap, revisjon og rådgivning", label_en: "Accounting and auditing", naceCode: "69.20", naceSection: "M" },
  { id: "consulting", label_nb: "Konsulentvirksomhet (management)", label_en: "Management consulting", naceCode: "70.22", naceSection: "M" },
  { id: "architecture_engineering", label_nb: "Arkitekt og ingeniørtjenester", label_en: "Architecture and engineering", naceCode: "71", naceSection: "M" },
  { id: "rnd", label_nb: "Forskning og utvikling", label_en: "Research and development", naceCode: "72", naceSection: "M" },
  { id: "marketing", label_nb: "Markedsføring, reklame og PR", label_en: "Marketing, advertising and PR", naceCode: "73", naceSection: "M" },
  { id: "design", label_nb: "Design og kreative næringer", label_en: "Design and creative industries", naceCode: "74.10", naceSection: "M" },
  { id: "staffing", label_nb: "Bemanning og rekruttering", label_en: "Staffing and recruitment", naceCode: "78", naceSection: "N" },
  { id: "public_admin", label_nb: "Offentlig forvaltning", label_en: "Public administration", naceCode: "84", naceSection: "O" },
  { id: "defense", label_nb: "Forsvar og sikkerhet", label_en: "Defense and security", naceCode: "84.22", naceSection: "O" },
  { id: "education", label_nb: "Utdanning", label_en: "Education", naceCode: "85", naceSection: "P" },
  { id: "healthcare", label_nb: "Helse og sosialtjenester", label_en: "Health and social services", naceCode: "86-88", naceSection: "Q" },
  { id: "arts", label_nb: "Kunst, kultur og underholdning", label_en: "Arts, culture and entertainment", naceCode: "90-91", naceSection: "R" },
  { id: "sports", label_nb: "Sport, idrett og fritid", label_en: "Sports and recreation", naceCode: "93", naceSection: "R" },
  { id: "ngo", label_nb: "Frivillig sektor og NGO", label_en: "Non-profit and NGO", naceCode: "94", naceSection: "S" },
  { id: "other", label_nb: "Annet", label_en: "Other", naceCode: "", naceSection: "" },
];

/** Finn bransjeoppføring fra fritekst (case-insensitivt, matcher nb/en/id). */
export function findIndustryByLabel(label: string | null | undefined): IndustryOption | undefined {
  if (!label) return undefined;
  const norm = label.trim().toLowerCase();
  return INDUSTRY_OPTIONS.find(
    (o) =>
      o.label_nb.toLowerCase() === norm ||
      o.label_en.toLowerCase() === norm ||
      o.id === norm,
  );
}

/** NACE-kode for en bransje, eller null hvis ukjent / egendefinert. */
export function getNaceCodeForIndustry(label: string | null | undefined): string | null {
  const opt = findIndustryByLabel(label);
  return opt?.naceCode || null;
}
