export type ModuleKey =
  | "core"
  | "frameworks"
  | "vendors"
  | "assets"
  | "trust"
  | "deviations"
  | "partner";

export interface ModuleInfo {
  title: string;
  tagline: string;
  description: string;
  features: string[];
}

export const MODULE_INFO: Record<ModuleKey, ModuleInfo> = {
  core: {
    title: "Mynder Core",
    tagline: "Grunnmodulen i plattformen",
    description:
      "Mynder Core samler alt daglig samsvarsarbeid på ett sted. Oppgaver, avvik, behandlingsprotokoll og dokumentasjon henger sammen — og Lara hjelper deg å holde tråden.",
    features: [
      "Oppgavestyring med prioritet og forfall",
      "Avvikshåndtering med rotårsak og tiltak",
      "Behandlingsprotokoll (RoPA) med maler",
      "Dokumentbibliotek med versjonering",
      "AI-assistert samsvarsvurdering med Lara",
      "Aktivitetslogg og revisjonsspor",
    ],
  },
  frameworks: {
    title: "Regelverk",
    tagline: "Aktiver rammeverk du må etterleve",
    description:
      "Velg blant obligatoriske, anbefalte og valgfrie regelverk. Hvert rammeverk gir kontroller, krav og gap-analyse tilpasset din virksomhet.",
    features: [
      "GDPR, NIS2, ISO 27001, DORA og flere",
      "Automatisk gap-analyse per rammeverk",
      "Modenhetsscore på 0–4-skala",
      "Kontroller koblet mot bevis og dokumentasjon",
      "Kontinuerlig oppdatering ved regelendringer",
    ],
  },
  deviations: {
    title: "Avviksregister",
    tagline: "Meld, følg opp og lukk avvik",
    description:
      "Avviksregisteret er et eget produkt uten kostnad. Registrer avvik, koble dem til systemer og leverandører, og følg tiltakene til de er lukket. Avvik påvirker ikke modenhetsscoren.",
    features: [
      "Registrering med kategori, alvorlighet og frist",
      "Tiltak og ansvarlig per avvik",
      "Avvik koblet til leverandører og systemer",
      "Lara foreslår rotårsak og tiltak",
      "Aktivitetslogg og revisjonsspor",
    ],
  },
  vendors: {
    title: "Leverandørmodul",
    tagline: "TPRM og leverandørvurdering",
    description:
      "Kartlegg, vurder og følg opp leverandører og databehandlere. Lara analyserer dokumenter automatisk og foreslår risiko basert på data du allerede har.",
    features: [
      "Leverandørregister med kritikalitet og risiko",
      "AI-analyse av databehandleravtaler og SOC 2",
      "Automatisk oppfølging av utløpsdatoer",
      "Trust Profile-integrasjon for delt dokumentasjon",
      "Portefølje-rapport i PDF",
    ],
  },
  assets: {
    title: "Eiendeler",
    tagline: "System- og eiendelsregister",
    description:
      "Full oversikt over systemer, tjenester og eiendeler — eid av arbeidsområdene som faktisk bruker dem. Oppdag nye systemer automatisk via integrasjoner.",
    features: [
      "Systemregister med eiere og arbeidsområder",
      "Automatisk oppdagelse via Microsoft og Google Workspace",
      "Import fra Excel eller manuell registrering",
      "Kobling mellom systemer, leverandører og data",
      "Livssyklus fra onboarding til avslutning",
    ],
  },
  // V2 — IKKE IMPLEMENTER NÅ: Trust Center er planlagt som eget produkt i v2.
  // Ikke vis/aktiver dette i prototype før produktteamet har landet scope.
  trust: {
    title: "Trust Center",
    tagline: "Del én gang — gjenbruk mot alle",
    description:
      "Trust Center gjør dokumentasjonen dere allerede har i Mynder om til én delbar profil. Kunder, leverandører og revisorer får svar uten at dere sender de samme vedleggene på nytt.",
    features: [
      "Offentlig profil på trust.mynder.no",
      "Delbare lenker til kunder og leverandører, med utløpsdato",
      "Gjenbruk av dokumentasjon fra Mynder Core og Leverandørmodulen",
      "Kundeforespørsler og meldinger samlet ett sted",
      "Full kontroll på hva som er offentlig og hva som deles privat",
      "490 kr per måned",
    ],
  },


  partner: {
    title: "Partner Workspace",
    tagline: "For MSP-er og samarbeidspartnere",
    description:
      "Egen arbeidsflate for konsulenter og MSP-er som forvalter flere kunder. Se portefølje, gap-analyser og salgspotensial på tvers.",
    features: [
      "Portefølje-dashboard for alle kunder",
      "Gap-analyse-veiviser med tjenestematching",
      "Tjenestekatalog med versjoner og godkjenning",
      "Salgspotensial basert på reelle gap",
      "Deling av dokumentasjon på tvers av kunder",
    ],
  },
};
