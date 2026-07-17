// Concrete article examples per requirement — used as prototype fallback
// when a requirement lacks an explicit `covered_articles` list. The goal is
// to always show the user WHAT the evidence must cover, in concrete terms.

import type { ComplianceRequirement } from "@/lib/complianceRequirementsData";

const EXPLICIT: Record<string, string[]> = {
  // GDPR
  "GDPR-Art13-14": [
    "Art. 13 – Informasjon ved innsamling",
    "Art. 14 – Informasjon fra tredjepart",
    "Identitet og kontaktinfo for behandlingsansvarlig",
    "Formål og rettslig grunnlag",
    "Lagringstid og rettigheter",
  ],
  "GDPR-Art28": [
    "Art. 28 – Databehandleravtale",
    "Formål og varighet",
    "Instruksjonsplikt",
    "Underdatabehandlere",
    "Sikkerhetstiltak (Art. 32)",
  ],
  "GDPR-Art30": [
    "Art. 30(1) – Behandlingsprotokoll",
    "Kategorier av registrerte og opplysninger",
    "Mottakere",
    "Overføring til tredjeland",
    "Sikkerhetstiltak",
  ],
  "GDPR-Art32": [
    "Art. 32 – Sikkerhet i behandlingen",
    "Kryptering",
    "Tilgangsstyring",
    "Robusthet og beredskap",
    "Testing og evaluering",
  ],
  "GDPR-Art33-34": [
    "Art. 33 – Melding til tilsyn (72t)",
    "Art. 34 – Melding til registrerte",
    "Beskrivelse av bruddet",
    "Konsekvenser og tiltak",
  ],
  "GDPR-Art35": [
    "Art. 35 – DPIA",
    "Beskrivelse av behandlingen",
    "Nødvendighet og forholdsmessighet",
    "Risiko for de registrerte",
    "Tiltak",
  ],
  // Åpenhetsloven
  "aap:§4": [
    "§4a – Kartlegging",
    "§4b – Tiltak",
    "§4c – Oppfølging",
    "Kommunikasjon",
  ],
  "aap:§5": [
    "§5 – Offentliggjøring senest 30. juni",
    "Metodikk",
    "Faktiske og potensielle konsekvenser",
    "Tiltak",
  ],
  "aap:§6": ["§6 – Rett til informasjon", "Svarfrist 3 uker"],
};

/** Attempt to derive concrete article tokens from a requirement_id. */
function parseFromId(id: string): string[] {
  const out: string[] = [];
  const gdpr = id.match(/Art\s*\d+[a-z]?/gi);
  if (gdpr) out.push(...gdpr.map((s) => s.replace(/Art\s*/i, "Art. ")));
  const para = id.match(/§\s*\d+[a-z]?/g);
  if (para) out.push(...para);
  return Array.from(new Set(out));
}

/**
 * Returns a non-empty list of concrete articles/points the evidence must
 * cover for the requirement. Prefer explicit data on the requirement; then
 * an explicit fallback map; then articles parsed from the id; finally a
 * generic single-item list.
 */
export function getArticlesForRequirement(req: ComplianceRequirement): string[] {
  if (req.covered_articles && req.covered_articles.length > 0) return req.covered_articles;
  if (EXPLICIT[req.requirement_id]) return EXPLICIT[req.requirement_id];
  const parsed = parseFromId(req.requirement_id);
  if (parsed.length > 0) return parsed;
  return [req.name_no || req.name];
}
