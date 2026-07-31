/**
 * Statiske hint om hvilken dokumentasjon som typisk kreves per krav-artikkel.
 * Brukes i ManualDocumentationDialog og i Lara-forslagene i tjenestekatalogen.
 */

export interface DocumentationHint {
  articleLabel: string;
  typicalDocs: string[];
  /** True når hintet er spesifikt for kravet (ikke generisk fallback). */
  specific?: boolean;
}

interface HintRule {
  match: RegExp;
  label: string;
  docs: string[];
}

/** Rammeverksspesifikke hint — slås opp først når frameworkId er kjent. */
const FRAMEWORK_HINTS: Record<string, HintRule[]> = {
  gdpr: [
    { match: /^Art\.?\s?5/i, label: "GDPR Art. 5 (Prinsipper)", docs: ["Personvernerklæring", "Slettepolicy / lagringstider"] },
    { match: /^Art\.?\s?6/i, label: "GDPR Art. 6 (Behandlingsgrunnlag)", docs: ["Oversikt over behandlingsgrunnlag", "Samtykkeløsning"] },
    { match: /^Art\.?\s?13|^Art\.?\s?14/i, label: "GDPR Art. 13/14 (Informasjonsplikt)", docs: ["Personvernerklæring", "Informasjonsskriv til registrerte"] },
    { match: /^Art\.?\s?15/i, label: "GDPR Art. 15 (Innsyn)", docs: ["Rutine for innsynsbegjæringer", "Logg over henvendelser"] },
    { match: /^Art\.?\s?28/i, label: "GDPR Art. 28 (Databehandler)", docs: ["Databehandleravtale", "Underleverandøroversikt", "Vurdering av databehandler"] },
    { match: /^Art\.?\s?30/i, label: "GDPR Art. 30 (Protokoll)", docs: ["Protokoll over behandlingsaktiviteter (ROPA)"] },
    { match: /^Art\.?\s?32/i, label: "GDPR Art. 32 (Sikkerhet)", docs: ["Sikkerhetspolicy", "Risikovurdering", "Testrapport / penetrasjonstest"] },
    { match: /^Art\.?\s?33|^Art\.?\s?34/i, label: "GDPR Art. 33/34 (Brudd)", docs: ["Rutine for avviksmelding", "Hendelseslogg"] },
    { match: /^Art\.?\s?35/i, label: "GDPR Art. 35 (DPIA)", docs: ["Personvernkonsekvensvurdering (DPIA)"] },
    { match: /^Art\.?\s?37/i, label: "GDPR Art. 37 (Personvernombud)", docs: ["Oppnevnelse av personvernombud (DPO)", "Mandat og rapporteringslinje", "Kontaktinformasjon publisert"] },
    { match: /^Art\.?\s?44|^Art\.?\s?46/i, label: "GDPR Art. 44–46 (Overføring)", docs: ["Standard personvernbestemmelser (SCC)", "Transfer Impact Assessment (TIA)"] },
  ],
  iso27001: [
    { match: /^A\.5\./i, label: "ISO 27001 A.5 (Organisatoriske)", docs: ["Informasjonssikkerhetspolicy", "Rolle- og ansvarsbeskrivelse"] },
    { match: /^A\.6\./i, label: "ISO 27001 A.6 (Personell)", docs: ["Ansettelsesavtale/klausul", "Sikkerhetsopplæringsplan", "Phishing-/kursrapport"] },
    { match: /^A\.7\./i, label: "ISO 27001 A.7 (Fysisk)", docs: ["Adgangskontroll-rutine", "Fysisk sikkerhetsplan"] },
    { match: /^A\.8\.7/i, label: "ISO 27001 A.8.7 (Skadevare)", docs: ["EDR-/antivirus-konfigurasjon", "Dekningsrapport endepunkt"] },
    { match: /^A\.8\.8/i, label: "ISO 27001 A.8.8 (Sårbarheter)", docs: ["Sårbarhetsrapport", "Patch-rutine", "Pentest-rapport"] },
    { match: /^A\.8\.13/i, label: "ISO 27001 A.8.13 (Sikkerhetskopi)", docs: ["Backup-policy", "Gjenopprettingstest-rapport"] },
    { match: /^A\.8\.16/i, label: "ISO 27001 A.8.16 (Overvåking)", docs: ["SOC-/SIEM-tjenestebeskrivelse", "Månedlig overvåkingsrapport"] },
    { match: /^A\.8\./i, label: "ISO 27001 A.8 (Teknologisk)", docs: ["Konfigurasjonsstandard", "Endringslogg", "Patch-rutine"] },
  ],
  nis2: [
    { match: /^Art\.?\s?20/i, label: "NIS2 Art. 20 (Ledelsens ansvar)", docs: ["Styrevedtak / ledelsesforankring", "Opplæringsbevis for ledelsen"] },
    { match: /^Art\.?\s?21/i, label: "NIS2 Art. 21 (Sikkerhetstiltak)", docs: ["Risikovurdering", "Oversikt over tekniske tiltak", "Leverandørkrav"] },
    { match: /^Art\.?\s?23/i, label: "NIS2 Art. 23 (Hendelsesrapportering)", docs: ["Beredskaps- og varslingsplan", "Hendelseslogg", "Øvelsesrapport"] },
  ],
  dora: [
    { match: /^Art\.?\s?5/i, label: "DORA Art. 5 (IKT-styring)", docs: ["IKT-risikorammeverk", "Styrende dokument vedtatt av ledelsen"] },
    { match: /^Art\.?\s?17/i, label: "DORA Art. 17 (Hendelseshåndtering)", docs: ["Prosess for IKT-hendelser", "Klassifisering og rapporteringsmal"] },
    { match: /^Art\.?\s?28/i, label: "DORA Art. 28 (Tredjepartsrisiko)", docs: ["Register over IKT-leverandører", "Kontraktsklausuler", "Exit-plan"] },
  ],
  aiact: [
    { match: /^Art\.?\s?4/i, label: "AI Act Art. 4 (AI-kompetanse)", docs: ["Opplæringsplan for AI-bruk", "Kursbevis"] },
    { match: /^Art\.?\s?9/i, label: "AI Act Art. 9 (Risikostyring)", docs: ["AI-risikovurdering", "Rutine for løpende oppfølging"] },
    { match: /^Art\.?\s?10/i, label: "AI Act Art. 10 (Data og styring)", docs: ["Datasettbeskrivelse", "Kvalitetskontroll av treningsdata"] },
    { match: /^Art\.?\s?26/i, label: "AI Act Art. 26 (Bruk av AI)", docs: ["Retningslinjer for AI-bruk", "Logg over AI-systemer"] },
  ],
  transparency: [
    { match: /^§\s?4/i, label: "Åpenhetsloven § 4 (Aktsomhetsvurdering)", docs: ["Aktsomhetsvurdering", "Leverandørkjedekartlegging"] },
    { match: /^§\s?5/i, label: "Åpenhetsloven § 5 (Redegjørelse)", docs: ["Publisert redegjørelse", "Styregodkjenning"] },
  ],
};

/** Generelle hint som brukes når rammeverket ikke har egen regel. */
const ARTICLE_HINTS: HintRule[] = [
  ...FRAMEWORK_HINTS.gdpr,
  ...FRAMEWORK_HINTS.iso27001,
  { match: /^NIS2/i, label: "NIS2", docs: ["Risikovurdering", "Beredskapsplan", "Rapporteringsrutine"] },
];

const DEFAULT_DOCS = ["Policy", "Prosedyre", "Rutinebeskrivelse"];

/** Sentinel-verdi som betyr «hele rammeverket» i tjenestebiblioteket. */
export const WHOLE_FRAMEWORK_ID = "helhetlig";

const WHOLE_FRAMEWORK_DOCS = [
  "Styrende policy",
  "Risikovurdering",
  "Gap-analyse mot rammeverket",
];

function findRule(requirementId: string, frameworkId?: string): HintRule | undefined {
  const scoped = frameworkId ? FRAMEWORK_HINTS[frameworkId.toLowerCase()] : undefined;
  return (
    scoped?.find((h) => h.match.test(requirementId)) ??
    ARTICLE_HINTS.find((h) => h.match.test(requirementId))
  );
}

export function getTypicalDocumentation(
  requirementId: string,
  frameworkId?: string,
): DocumentationHint {
  const id = (requirementId ?? "").trim();
  if (id.toLowerCase() === WHOLE_FRAMEWORK_ID) {
    return {
      articleLabel: "Hele rammeverket",
      typicalDocs: WHOLE_FRAMEWORK_DOCS,
      specific: true,
    };
  }
  const hit = findRule(id, frameworkId);
  if (hit) return { articleLabel: hit.label, typicalDocs: hit.docs, specific: true };
  return { articleLabel: id, typicalDocs: DEFAULT_DOCS, specific: false };
}

/** True når vi har et reelt, kravspesifikt dokumentasjonshint (ikke generisk fallback). */
export function hasSpecificDocumentation(
  requirementId: string,
  frameworkId?: string,
): boolean {
  return getTypicalDocumentation(requirementId, frameworkId).specific === true;
}
