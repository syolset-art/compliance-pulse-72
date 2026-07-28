/**
 * Rich, structured guidance per krav. Genereres regelbasert fra framework_id,
 * category, domain og evt. artikler — slik at hvert krav får minst 5–6 linjer
 * med kontekstuell informasjon uten å måtte manuelt utvide 1000+ krav.
 *
 * Brukes både i:
 *  - Krav-kortet (utvidet visning: "Om kravet") for å hjelpe brukeren å forstå
 *    hva som må på plass og hvordan Lara vurderer bevis.
 *  - Lara sin evaluator (analyze-evidence-coverage) som ekstra vurderingskriterier
 *    slik at scoringen blir mer nyansert enn ren artikkeldekning.
 */

import type { ComplianceRequirement } from "./complianceRequirementsData";

export interface RequirementGuidance {
  /** Kort formålsforklaring — hvorfor kravet finnes. */
  purposeNo: string;
  purposeEn: string;
  /** Konkrete elementer som må være på plass for å oppfylle kravet. */
  criteriaNo: string[];
  criteriaEn: string[];
  /** Hvordan Lara vurderer bevis / status for kravet. */
  evaluationNo: string[];
  evaluationEn: string[];
  /** Vanlige fallgruver som ofte fører til gap. */
  pitfallsNo: string[];
  pitfallsEn: string[];
}

// -----------------------------------------------------------------------------
// Rammeverk-spesifikke overrides — brukes når vi vet noe konkret om en artikkel.
// Nøkkel = regex som matches mot requirement_id.
// -----------------------------------------------------------------------------
const OVERRIDES: Array<{ match: RegExp; g: Partial<RequirementGuidance> }> = [
  {
    match: /^A\.5\.1$/i,
    g: {
      purposeNo:
        "Sikre at organisasjonen har en tydelig, ledelsesgodkjent policy som setter retning og forventninger for informasjonssikkerhet.",
      criteriaNo: [
        "Overordnet informasjonssikkerhetspolicy godkjent av øverste ledelse",
        "Tema-spesifikke retningslinjer (tilgang, kryptografi, hendelser, m.fl.)",
        "Publisert og gjort kjent for alle ansatte og relevante tredjeparter",
        "Bekreftet mottatt og forstått (kvittering, e-læring eller lignende)",
        "Revideres minst årlig eller ved vesentlige endringer",
      ],
    },
  },
  {
    match: /^Art\.?\s?30/i,
    g: {
      purposeNo:
        "Dokumentere alle behandlinger av personopplysninger i en protokoll (ROPA), slik at organisasjonen kan vise etterlevelse overfor tilsynsmyndigheten.",
      criteriaNo: [
        "Oppdatert protokoll over behandlingsaktiviteter (ROPA)",
        "Behandlingsformål, kategorier registrerte og opplysninger er beskrevet",
        "Mottakere, tredjelandsoverføringer og oppbevaringstid oppgitt",
        "Tekniske og organisatoriske sikkerhetstiltak angitt",
        "Prosess for jevnlig oppdatering ved endringer i systemlandskapet",
      ],
    },
  },
  {
    match: /^Art\.?\s?32/i,
    g: {
      purposeNo:
        "Sikre at behandling av personopplysninger skjer med et sikkerhetsnivå som er tilpasset risikoen for de registrertes rettigheter og friheter.",
      criteriaNo: [
        "Gjennomført og dokumentert risikovurdering",
        "Tekniske tiltak: kryptering, tilgangsstyring, logging, backup",
        "Organisatoriske tiltak: policyer, opplæring, ansvarsfordeling",
        "Prosess for jevnlig testing og evaluering av tiltakene",
        "Kontinuerlig forbedring basert på hendelser og nye trusler",
      ],
    },
  },
  {
    match: /^Art\.?\s?33/i,
    g: {
      purposeNo:
        "Sikre at brudd på personopplysningssikkerheten meldes til Datatilsynet innen 72 timer, og at berørte varsles ved høy risiko.",
      criteriaNo: [
        "Skriftlig rutine for håndtering av personvernbrudd",
        "Definert varslingskjede med roller og eskalering",
        "Mal og prosess for melding til tilsynsmyndighet innen 72 timer",
        "Loggføring av alle brudd (også de som ikke meldes)",
        "Årlig øvelse eller test av rutinen",
      ],
    },
  },
  {
    match: /^Art\.?\s?35/i,
    g: {
      purposeNo:
        "Vurdere personvernkonsekvenser (DPIA) før behandlinger med høy risiko iverksettes, slik at risiko kan reduseres til akseptabelt nivå.",
      criteriaNo: [
        "Kriterier for når DPIA skal utføres er dokumentert",
        "Gjennomførte DPIA-er for behandlinger med høy risiko",
        "Konsultasjon med personvernombud (DPO) der det finnes",
        "Identifiserte risikoreduserende tiltak og oppfølging",
        "Revurdering ved endringer i behandlingens karakter",
      ],
    },
  },
  {
    match: /^NIS2/i,
    g: {
      purposeNo:
        "Styrke motstandsdyktigheten i samfunnskritiske sektorer gjennom systematisk risikostyring, hendelseshåndtering og rapportering.",
      criteriaNo: [
        "Ledelsesforankret risikostyring for nettverks- og informasjonssystemer",
        "Beredskapsplan og forretningskontinuitet er dokumentert og testet",
        "Rutine for rapportering av vesentlige hendelser innen fristene",
        "Kontroll på leverandørkjeden og kritiske underleverandører",
        "Løpende opplæring av ansatte og ledelsen",
      ],
    },
  },
];

// -----------------------------------------------------------------------------
// Kategori- og domenebaserte fallback-tekster — gir alltid rikelig med kontekst.
// -----------------------------------------------------------------------------
function baseByCategory(req: ComplianceRequirement): RequirementGuidance {
  const isPrivacy = req.domain === "privacy";
  const isAi = req.domain === "ai";
  const scope = isPrivacy
    ? "behandlingen av personopplysninger"
    : isAi
    ? "utvikling og bruk av AI-systemer"
    : "informasjonssikkerheten";

  return {
    purposeNo: `Kravet skal sikre at ${scope} er styrt gjennom en dokumentert og etterprøvbar praksis som ledelsen står bak.`,
    purposeEn: `The requirement ensures that ${scope} is governed through documented and auditable practices endorsed by management.`,
    criteriaNo: [
      "En skriftlig, ledelsesgodkjent policy eller prosedyre som dekker temaet",
      "Tydelig rollefordeling og eier for kravet i organisasjonen",
      "Prosess for gjennomføring, inkludert frekvens og ansvarlig",
      "Dokumentasjon som viser at prosessen faktisk følges (logg, rapport, referat)",
      "Rutine for jevnlig gjennomgang og oppdatering ved endringer",
    ],
    criteriaEn: [
      "A written, management-approved policy or procedure covering the topic",
      "Clear role assignment and owner for the requirement",
      "Execution process including frequency and responsible party",
      "Records proving the process is actually followed (log, report, minutes)",
      "Routine for regular review and updates on change",
    ],
    evaluationNo: [
      "Lara sjekker om opplastet dokument faktisk beskriver hvordan kravet er ivaretatt — ikke bare nevner temaet",
      "Vekt legges på: godkjennende part, gyldighetsdato og konkret prosedyre",
      "Signatur eller versjonskontroll forsterker tillitsgraden, men påvirker ikke selve dekningsscoren",
      "Manglende artikler eller punkter reduserer score proporsjonalt",
    ],
    evaluationEn: [
      "Lara checks whether the document actually describes how the requirement is met — not just mentions the topic",
      "Weight on: approver, validity date and concrete procedure",
      "Signature or version control strengthens trust tier but does not change coverage score",
      "Missing articles or points reduce the score proportionally",
    ],
    pitfallsNo: [
      "Policy uten tilhørende prosedyre eller praktisk gjennomføring",
      "Utdatert dokumentasjon (over 12 måneder uten revisjon)",
      "Mangler godkjenning fra riktig nivå i organisasjonen",
    ],
    pitfallsEn: [
      "Policy without accompanying procedure or actual execution",
      "Outdated documentation (over 12 months without review)",
      "Missing approval from the appropriate organizational level",
    ],
  };
}

/**
 * Returnerer strukturert veiledning for et krav. Kombinerer basert veiledning
 * fra domene/kategori med eventuelle rammeverk-spesifikke overrides.
 */
export function getRequirementGuidance(req: ComplianceRequirement): RequirementGuidance {
  const base = baseByCategory(req);
  const override = OVERRIDES.find((o) => o.match.test(req.requirement_id))?.g;
  if (!override) return base;
  return {
    purposeNo: override.purposeNo ?? base.purposeNo,
    purposeEn: override.purposeEn ?? base.purposeEn,
    criteriaNo: override.criteriaNo ?? base.criteriaNo,
    criteriaEn: override.criteriaEn ?? base.criteriaEn,
    evaluationNo: override.evaluationNo ?? base.evaluationNo,
    evaluationEn: override.evaluationEn ?? base.evaluationEn,
    pitfallsNo: override.pitfallsNo ?? base.pitfallsNo,
    pitfallsEn: override.pitfallsEn ?? base.pitfallsEn,
  };
}

/**
 * Kompakt tekstversjon av vurderingskriteriene — brukes som ekstra kontekst
 * i evaluator-kall (analyze-evidence-coverage) for mer nyansert scoring.
 */
export function getEvaluationCriteriaText(req: ComplianceRequirement): string {
  const g = getRequirementGuidance(req);
  return [
    `Formål: ${g.purposeNo}`,
    "Hva må være på plass:",
    ...g.criteriaNo.map((c) => `- ${c}`),
    "Vurderingspunkter:",
    ...g.evaluationNo.map((e) => `- ${e}`),
  ].join("\n");
}

/**
 * Utvidet beskrivelse (5–6 linjer flytende tekst) som vises når brukeren
 * åpner kravet. Kombinerer opprinnelig beskrivelse med formål og de viktigste
 * kriteriene i naturlig prosa — uten å duplisere informasjon som allerede står
 * andre steder i kortet.
 */
export function getExtendedDescription(
  req: ComplianceRequirement,
  lang: "no" | "en",
): string {
  const g = getRequirementGuidance(req);
  const isNb = lang === "no";
  const base = isNb ? req.description_no : req.description;
  const purpose = isNb ? g.purposeNo : g.purposeEn;
  const criteria = isNb ? g.criteriaNo : g.criteriaEn;

  // Bygg en prosa-versjon av kriteriene: "X, Y, samt Z."
  const list = criteria.slice(0, 4);
  const joiner = isNb ? " samt " : " and ";
  const criteriaProse =
    list.length <= 1
      ? list.join("")
      : `${list.slice(0, -1).join(", ")}${joiner}${list[list.length - 1]}`;

  const criteriaSentence = isNb
    ? `I praksis betyr det ${criteriaProse.charAt(0).toLowerCase()}${criteriaProse.slice(1)}.`
    : `In practice this means ${criteriaProse.charAt(0).toLowerCase()}${criteriaProse.slice(1)}.`;

  // Unngå at "purpose" bare gjentar det som allerede står i base.
  const purposeSentence =
    base.toLowerCase().includes(purpose.slice(0, 40).toLowerCase()) ? "" : purpose;

  return [base, purposeSentence, criteriaSentence].filter(Boolean).join(" ");
}

