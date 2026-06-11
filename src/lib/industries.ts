/**
 * Vanlige bransjer i Norge, Norden og Europa.
 * Dekker både tradisjonelle næringer og moderne digitale kategorier.
 *
 * Verdien som lagres er fritekst (label).
 */
export interface IndustryOption {
  /** Stable identifier */
  id: string;
  /** Norsk visningsnavn (lagres som fritekst) */
  label_nb: string;
  /** Engelsk visningsnavn */
  label_en: string;
}

export const INDUSTRY_OPTIONS: IndustryOption[] = [
  { id: "agriculture", label_nb: "Jordbruk, skogbruk og fiske", label_en: "Agriculture, forestry and fishing" },
  { id: "mining", label_nb: "Bergverksdrift og utvinning", label_en: "Mining and quarrying" },
  { id: "oil_gas", label_nb: "Olje og gass", label_en: "Oil and gas" },
  { id: "manufacturing", label_nb: "Industri og produksjon", label_en: "Manufacturing" },
  { id: "food_production", label_nb: "Næringsmiddelindustri", label_en: "Food production" },
  { id: "pharma", label_nb: "Farmasi og bioteknologi", label_en: "Pharmaceuticals and biotech" },
  { id: "medtech", label_nb: "Medtech og medisinsk utstyr", label_en: "Medical devices (medtech)" },
  { id: "energy", label_nb: "Energi og fornybar energi", label_en: "Energy and renewables" },
  { id: "utilities", label_nb: "Vann, avløp og renovasjon", label_en: "Water, sewerage and waste" },
  { id: "construction", label_nb: "Bygg og anlegg", label_en: "Construction" },
  { id: "wholesale", label_nb: "Engroshandel", label_en: "Wholesale trade" },
  { id: "retail", label_nb: "Varehandel og detaljhandel", label_en: "Retail trade" },
  { id: "ecommerce", label_nb: "E-handel", label_en: "E-commerce" },
  { id: "transport", label_nb: "Transport og logistikk", label_en: "Transport and logistics" },
  { id: "maritime", label_nb: "Maritim og shipping", label_en: "Maritime and shipping" },
  { id: "warehousing", label_nb: "Logistikk og lagervirksomhet", label_en: "Logistics and warehousing" },
  { id: "hospitality", label_nb: "Overnatting og servering", label_en: "Hospitality (hotel/restaurant)" },
  { id: "tourism", label_nb: "Reiseliv og turisme", label_en: "Travel and tourism" },
  { id: "ict", label_nb: "Informasjon og kommunikasjon", label_en: "Information and communication" },
  { id: "software", label_nb: "IT og programvare", label_en: "IT and software" },
  { id: "saas", label_nb: "SaaS og skybaserte tjenester", label_en: "SaaS and cloud services" },
  { id: "cybersecurity", label_nb: "Cybersikkerhet", label_en: "Cybersecurity" },
  { id: "telecom", label_nb: "Telekommunikasjon", label_en: "Telecommunications" },
  { id: "media", label_nb: "Media, forlag og kringkasting", label_en: "Media, publishing and broadcasting" },
  { id: "gaming", label_nb: "Gaming og spillutvikling", label_en: "Gaming and game development" },
  { id: "finance", label_nb: "Finans og forsikring", label_en: "Finance and insurance" },
  { id: "fintech", label_nb: "Fintech og betalingsteknologi", label_en: "Fintech and payment technology" },
  { id: "banking", label_nb: "Bank", label_en: "Banking" },
  { id: "realestate", label_nb: "Eiendom og eiendomsmegling", label_en: "Real estate" },
  { id: "legal", label_nb: "Juridisk tjenesteyting", label_en: "Legal services" },
  { id: "accounting", label_nb: "Regnskap, revisjon og rådgivning", label_en: "Accounting and auditing" },
  { id: "consulting", label_nb: "Konsulentvirksomhet (management)", label_en: "Management consulting" },
  { id: "architecture_engineering", label_nb: "Arkitekt og ingeniørtjenester", label_en: "Architecture and engineering" },
  { id: "rnd", label_nb: "Forskning og utvikling", label_en: "Research and development" },
  { id: "marketing", label_nb: "Markedsføring, reklame og PR", label_en: "Marketing, advertising and PR" },
  { id: "design", label_nb: "Design og kreative næringer", label_en: "Design and creative industries" },
  { id: "staffing", label_nb: "Bemanning og rekruttering", label_en: "Staffing and recruitment" },
  { id: "public_admin", label_nb: "Offentlig forvaltning", label_en: "Public administration" },
  { id: "defense", label_nb: "Forsvar og sikkerhet", label_en: "Defense and security" },
  { id: "education", label_nb: "Utdanning", label_en: "Education" },
  { id: "healthcare", label_nb: "Helse og sosialtjenester", label_en: "Health and social services" },
  { id: "arts", label_nb: "Kunst, kultur og underholdning", label_en: "Arts, culture and entertainment" },
  { id: "sports", label_nb: "Sport, idrett og fritid", label_en: "Sports and recreation" },
  { id: "ngo", label_nb: "Frivillig sektor og NGO", label_en: "Non-profit and NGO" },
  { id: "ai_ml", label_nb: "AI og maskinlæring", label_en: "AI and machine learning" },
  { id: "cleantech", label_nb: "Cleantech og grønn teknologi", label_en: "Cleantech and green technology" },
  { id: "web3", label_nb: "Crypto, Web3 og blockchain", label_en: "Crypto, Web3 and blockchain" },
  { id: "other", label_nb: "Annet", label_en: "Other" },
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
