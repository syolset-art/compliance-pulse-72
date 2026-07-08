/**
 * Statiske hint om hvilken dokumentasjon som typisk kreves per krav-artikkel.
 * Brukes i ManualDocumentationDialog for kontekstuell hjelp.
 */

export interface DocumentationHint {
  articleLabel: string;
  typicalDocs: string[];
}

const ARTICLE_HINTS: Array<{ match: RegExp; label: string; docs: string[] }> = [
  // GDPR
  { match: /^Art\.?\s?28/i, label: "GDPR Art. 28 (Databehandler)", docs: ["Databehandleravtale", "Underleverandøroversikt", "Vurdering av databehandler"] },
  { match: /^Art\.?\s?30/i, label: "GDPR Art. 30 (Protokoll)", docs: ["Protokoll over behandlingsaktiviteter (ROPA)"] },
  { match: /^Art\.?\s?32/i, label: "GDPR Art. 32 (Sikkerhet)", docs: ["Sikkerhetspolicy", "Risikovurdering", "Testrapport / penetrasjonstest"] },
  { match: /^Art\.?\s?33/i, label: "GDPR Art. 33 (Brudd)", docs: ["Rutine for avviksmelding", "Hendelseslogg"] },
  { match: /^Art\.?\s?35/i, label: "GDPR Art. 35 (DPIA)", docs: ["Personvernkonsekvensvurdering (DPIA)"] },

  // ISO 27001 Annex A
  { match: /^A\.5\./i, label: "ISO 27001 A.5 (Organisatoriske)", docs: ["Informasjonssikkerhetspolicy", "Rolle- og ansvarsbeskrivelse"] },
  { match: /^A\.6\./i, label: "ISO 27001 A.6 (Personell)", docs: ["Ansettelsesavtale/klausul", "Sikkerhetsopplæringsplan"] },
  { match: /^A\.7\./i, label: "ISO 27001 A.7 (Fysisk)", docs: ["Adgangskontroll-rutine", "Fysisk sikkerhetsplan"] },
  { match: /^A\.8\./i, label: "ISO 27001 A.8 (Teknologisk)", docs: ["Konfigurasjonsstandard", "Endringslogg", "Patch-rutine"] },

  // NIS2
  { match: /^NIS2/i, label: "NIS2", docs: ["Risikovurdering", "Beredskapsplan", "Rapporteringsrutine"] },
];

const DEFAULT_DOCS = ["Policy", "Prosedyre", "Rutinebeskrivelse"];

export function getTypicalDocumentation(requirementId: string): DocumentationHint {
  const hit = ARTICLE_HINTS.find((h) => h.match.test(requirementId));
  if (hit) return { articleLabel: hit.label, typicalDocs: hit.docs };
  return { articleLabel: requirementId, typicalDocs: DEFAULT_DOCS };
}
