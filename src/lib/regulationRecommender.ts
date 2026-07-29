/**
 * Rule-based regulation recommender.
 *
 * Purpose: gjør at partneren slipper å svare på 15 spørsmål før en kunde er
 * opprettet. Basert på land, NACE-bransje, størrelse og en fritekstbeskrivelse
 * foreslår Lara hvilke regelverk som gjelder — med tydelig confidence.
 *
 * "high" = auto-anvendt (kunden opprettes med regelverket aktivt)
 * "medium" = anbefalt, krever ett klikk for å bekrefte
 * "low" = vurder (vises ikke som standard, men kan slås på)
 */

export type Confidence = "high" | "medium";

export interface RecommenderInput {
  countryCode: string;                 // ISO-2, f.eks "NO"
  industryCode?: string | null;        // NACE, f.eks "62.010"
  industryLabel?: string | null;       // fritekst-bransje (for manuelle kunder)
  employees?: number | null;
  businessDescription?: string | null; // ren tekst
}

export interface FrameworkRecommendation {
  frameworkId: string;
  label: string;
  confidence: Confidence;
  reason: string;
}

// -- Hjelpere -----------------------------------------------------------------

const naceMajor = (code?: string | null): number | null => {
  if (!code) return null;
  const m = code.match(/^(\d{2})/);
  return m ? Number(m[1]) : null;
};

const includesAny = (haystack: string, needles: string[]): boolean => {
  const h = haystack.toLowerCase();
  return needles.some((n) => h.includes(n.toLowerCase()));
};

// -- Regelmotor ---------------------------------------------------------------

export function recommendFrameworks(input: RecommenderInput): FrameworkRecommendation[] {
  const out = new Map<string, FrameworkRecommendation>();
  const add = (rec: FrameworkRecommendation) => {
    const prev = out.get(rec.frameworkId);
    // høyere confidence vinner
    if (!prev || (prev.confidence === "medium" && rec.confidence === "high")) {
      out.set(rec.frameworkId, rec);
    }
  };

  const desc = (input.businessDescription || "") + " " + (input.industryLabel || "");
  const nace = naceMajor(input.industryCode);
  const country = input.countryCode?.toUpperCase() || "NO";
  const employees = input.employees ?? null;

  // 1. GDPR — gjelder alle virksomheter i EØS
  if (["NO", "SE", "DK", "FI", "DE", "NL", "IS"].includes(country)) {
    add({
      frameworkId: "gdpr",
      label: "GDPR",
      confidence: "high",
      reason: "Personvernforordningen gjelder alle virksomheter i EØS som behandler personopplysninger.",
    });
  }

  // 2. Norsk personopplysningslov — Norge
  if (country === "NO") {
    add({
      frameworkId: "personopplysningsloven",
      label: "Personopplysningsloven",
      confidence: "high",
      reason: "Nasjonal implementering av GDPR i Norge.",
    });
  }

  // 3. Finans (NACE 64–66) → DORA + NIS2
  if (nace !== null && nace >= 64 && nace <= 66) {
    add({
      frameworkId: "dora",
      label: "DORA",
      confidence: "high",
      reason: "Digital Operational Resilience Act gjelder finansielle virksomheter.",
    });
    add({
      frameworkId: "nis2",
      label: "NIS2",
      confidence: "high",
      reason: "Finanssektoren er dekket av NIS2 som «vesentlig virksomhet».",
    });
  }

  // 4. Helse (NACE 86–88) → Normen
  if (nace !== null && nace >= 86 && nace <= 88) {
    add({
      frameworkId: "normen",
      label: "Normen",
      confidence: "high",
      reason: "Norm for informasjonssikkerhet i helse- og omsorgssektoren.",
    });
  }

  // 5. Kritisk infrastruktur — fritekst-match
  if (includesAny(desc, ["energi", "kraft", "vann", "transport", "telekom", "datasenter", "cloud", "sky"])) {
    add({
      frameworkId: "nis2",
      label: "NIS2",
      confidence: "high",
      reason: "Virksomheten leverer tjenester i kritisk infrastruktur (NIS2-sektor).",
    });
  }

  // 6. Størrelse ≥ 50 ansatte + EU-eksponering → NIS2 medium
  if (employees !== null && employees >= 50 && country === "NO" && !out.has("nis2")) {
    add({
      frameworkId: "nis2",
      label: "NIS2",
      confidence: "medium",
      reason: `Virksomheten har ${employees} ansatte og kan være omfattet av NIS2 avhengig av sektor.`,
    });
  }

  // 7. IT/programvare (NACE 62–63) → ISO 27001 (medium)
  if (nace !== null && (nace === 62 || nace === 63)) {
    add({
      frameworkId: "iso27001",
      label: "ISO 27001",
      confidence: "medium",
      reason: "IT- og programvareleverandører velger ofte ISO 27001 for å dokumentere informasjonssikkerhet mot kunder.",
    });
    add({
      frameworkId: "soc2",
      label: "SOC 2",
      confidence: "medium",
      reason: "SaaS-leverandører rettet mot internasjonale kunder blir ofte bedt om SOC 2.",
    });
  }

  // 8. Offentlig sektor / stat (NACE 84) → Internkontroll + ISO 27001
  if (nace === 84) {
    add({
      frameworkId: "internkontroll",
      label: "Internkontrollforskriften",
      confidence: "high",
      reason: "Offentlige virksomheter er underlagt internkontrollforskriften.",
    });
    add({
      frameworkId: "iso27001",
      label: "ISO 27001",
      confidence: "medium",
      reason: "Offentlig sektor velger ofte ISO 27001 som informasjonssikkerhetsrammeverk.",
    });
  }

  // 9. AI-relatert virksomhet
  if (includesAny(desc, ["kunstig intelligens", "artificial intelligence", "maskinlæring", "machine learning", "ai-modell", "ai model"])) {
    add({
      frameworkId: "ai-act",
      label: "AI Act",
      confidence: "medium",
      reason: "Virksomheten utvikler eller bruker AI-systemer som kan være omfattet av AI Act.",
    });
  }

  // 10. Åpenhetsloven — ≥ 50 ansatte i Norge
  if (country === "NO" && employees !== null && employees >= 50) {
    add({
      frameworkId: "transparency",
      label: "Åpenhetsloven",
      confidence: "medium",
      reason: `Åpenhetsloven omfatter norske virksomheter med ≥ 50 ansatte (denne har ${employees}).`,
    });
  }

  // Sorter: high før medium, deretter alfabetisk
  return Array.from(out.values()).sort((a, b) => {
    if (a.confidence !== b.confidence) return a.confidence === "high" ? -1 : 1;
    return a.label.localeCompare(b.label);
  });
}
