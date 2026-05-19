// Forenklet katalog: Mynder eier regelverk + kontrollpunkter.
// Partneren velger hvilke regelverk de leverer på og hvilke KP de dekker.

export interface FrameworkControlPoint {
  id: string;
  label: string;
  /** Lara-forslag for typisk omfang i timer per dekningsnivå. */
  hoursByLevel: {
    gap: number;
    partial: number;
    full: number;
  };
  /** Typiske aktiviteter partner utfører for å dekke punktet. Holdes kort — partner kan utvide selv. */
  typicalActivities?: string[];
}

export interface FrameworkDefinition {
  id: string;
  label: string;
  shortName: string;
  summary: string;
  controlPoints: FrameworkControlPoint[];
}

export type CoverageLevel = "gap" | "partial" | "full";

export const COVERAGE_LEVELS: { id: CoverageLevel; label: string; hint: string }[] = [
  { id: "gap", label: "Gap-analyse", hint: "Kartlegg status og avvik" },
  { id: "partial", label: "Delvis dekning", hint: "Etabler tiltak på prioriterte avvik" },
  { id: "full", label: "Full dekning", hint: "Drift og lukk alle gap løpende" },
];

export const FRAMEWORK_CATALOG: FrameworkDefinition[] = [
  {
    id: "nis2",
    label: "NIS2",
    shortName: "NIS2",
    summary: "EU-direktiv for cybersikkerhet i kritiske og viktige virksomheter.",
    controlPoints: [
      {
        id: "Art.20", label: "Styring og opplæring",
        hoursByLevel: { gap: 4, partial: 12, full: 28 },
        typicalActivities: ["Ledelsesworkshop og rolleavklaring", "Årlig sikkerhetsopplæring"],
      },
      {
        id: "Art.21", label: "Sikkerhetstiltak",
        hoursByLevel: { gap: 8, partial: 32, full: 90 },
        typicalActivities: ["Risikovurdering og tiltaksplan", "Etablere MFA og tilgangskontroll", "Patch- og sårbarhetsregime"],
      },
      {
        id: "Art.23", label: "Hendelseshåndtering og varsling",
        hoursByLevel: { gap: 4, partial: 16, full: 40 },
        typicalActivities: ["Beredskapsplan og varslingsrutine", "Tabletop-øvelse med ledelsen"],
      },
    ],
  },
  {
    id: "iso27001",
    label: "ISO 27001",
    shortName: "ISO 27001",
    summary: "Styringssystem for informasjonssikkerhet (ISMS).",
    controlPoints: [
      {
        id: "A.5.1", label: "Informasjonssikkerhetspolicy",
        hoursByLevel: { gap: 2, partial: 8, full: 16 },
        typicalActivities: ["Utarbeide policy", "Årlig revisjon og ledelsesgodkjenning"],
      },
      {
        id: "A.5.4", label: "Ledelsens ansvar",
        hoursByLevel: { gap: 2, partial: 6, full: 12 },
        typicalActivities: ["Ledelsens gjennomgang", "Rapportering av nøkkeltall"],
      },
      {
        id: "A.5.10", label: "Akseptabel bruk",
        hoursByLevel: { gap: 2, partial: 6, full: 12 },
        typicalActivities: ["Brukerinstruks for IT", "Signering ved ansettelse"],
      },
      {
        id: "A.5.15", label: "Tilgangskontroll",
        hoursByLevel: { gap: 4, partial: 16, full: 40 },
        typicalActivities: ["Tilgangsmatrise og roller", "Kvartalsvis tilgangsrevisjon", "Off-boarding-rutine"],
      },
      {
        id: "A.5.24", label: "Hendelsesplanlegging",
        hoursByLevel: { gap: 4, partial: 12, full: 24 },
        typicalActivities: ["Hendelsesplan og eskaleringsmatrise", "Loggføring og evaluering"],
      },
      {
        id: "A.6.3", label: "Awareness og opplæring",
        hoursByLevel: { gap: 2, partial: 12, full: 36 },
        typicalActivities: ["Phishing-simulering", "E-læring og oppfølging av repeat offenders"],
      },
      {
        id: "A.8.7", label: "Beskyttelse mot skadevare",
        hoursByLevel: { gap: 4, partial: 16, full: 48 },
        typicalActivities: ["EDR-utrulling og oppfølging", "Månedlig trusselrapport"],
      },
      {
        id: "A.8.8", label: "Sårbarhetshåndtering",
        hoursByLevel: { gap: 6, partial: 24, full: 72 },
        typicalActivities: ["Periodisk skanning (Tenable/Defender)", "Patch-styring og verifikasjon", "Rapport til ledelse"],
      },
      {
        id: "A.8.13", label: "Sikkerhetskopiering",
        hoursByLevel: { gap: 4, partial: 16, full: 40 },
        typicalActivities: ["Backup-strategi og 3-2-1", "Kvartalsvis restore-test"],
      },
      {
        id: "A.8.16", label: "Overvåking av aktiviteter",
        hoursByLevel: { gap: 6, partial: 32, full: 96 },
        typicalActivities: ["SIEM/loggsamling", "Alarmoppfølging 24/7", "Månedlig hendelsesgjennomgang"],
      },
    ],
  },
  {
    id: "gdpr",
    label: "GDPR / Personvern",
    shortName: "GDPR",
    summary: "Personvernforordningen og norsk personopplysningslov.",
    controlPoints: [
      {
        id: "Art.28", label: "Databehandleravtaler",
        hoursByLevel: { gap: 4, partial: 12, full: 24 },
        typicalActivities: ["Kartlegge leverandører", "Forhandle og signere DPA"],
      },
      {
        id: "Art.30", label: "Behandlingsprotokoll",
        hoursByLevel: { gap: 6, partial: 20, full: 40 },
        typicalActivities: ["Etablere protokoll (ROPA)", "Årlig oppdatering og verifikasjon"],
      },
      {
        id: "Art.35", label: "DPIA",
        hoursByLevel: { gap: 4, partial: 16, full: 32 },
        typicalActivities: ["Identifisere høyrisiko-behandlinger", "Gjennomføre og dokumentere DPIA"],
      },
      {
        id: "Art.37", label: "DPO-tjeneste",
        hoursByLevel: { gap: 2, partial: 24, full: 96 },
        typicalActivities: ["Månedlig DPO-samling", "Håndtering av innsynskrav", "Årsrapport til ledelse"],
      },
    ],
  },
  {
    id: "aiact",
    label: "AI Act",
    shortName: "AI Act",
    summary: "EUs AI-forordning — styring og risikohåndtering av AI-systemer.",
    controlPoints: [
      {
        id: "Art.4", label: "AI-litteracy",
        hoursByLevel: { gap: 2, partial: 8, full: 20 },
        typicalActivities: ["AI-grunnkurs for ansatte", "Rolletilpasset opplæring"],
      },
      {
        id: "Art.9", label: "Risikohåndtering",
        hoursByLevel: { gap: 6, partial: 20, full: 48 },
        typicalActivities: ["Klassifisere AI-systemer", "Risikomatrise og tiltaksplan"],
      },
      {
        id: "Art.10", label: "Datakvalitet",
        hoursByLevel: { gap: 4, partial: 16, full: 40 },
        typicalActivities: ["Datakildevurdering", "Etablere kvalitetskontroller"],
      },
      {
        id: "Art.26", label: "Bruker-ansvar",
        hoursByLevel: { gap: 2, partial: 8, full: 20 },
        typicalActivities: ["Bruksinstrukser", "Logging av AI-utdata"],
      },
    ],
  },
  {
    id: "dora",
    label: "DORA",
    shortName: "DORA",
    summary: "Digital operasjonell motstandsdyktighet i finanssektoren.",
    controlPoints: [
      {
        id: "Art.5", label: "IKT-rammeverk",
        hoursByLevel: { gap: 6, partial: 24, full: 60 },
        typicalActivities: ["Etablere IKT-styringsmodell", "Rapportering til styret"],
      },
      {
        id: "Art.17", label: "Hendelseshåndtering",
        hoursByLevel: { gap: 4, partial: 16, full: 40 },
        typicalActivities: ["Klassifisering og rapportering", "Major-incident-øvelse"],
      },
      {
        id: "Art.28", label: "Tredjepartsrisiko",
        hoursByLevel: { gap: 6, partial: 20, full: 48 },
        typicalActivities: ["Leverandørregister og kritikalitet", "Årlig leverandørrevisjon"],
      },
    ],
  },
  {
    id: "transparency",
    label: "Åpenhetsloven",
    shortName: "Åpenhetsloven",
    summary: "Aktsomhetsvurderinger av leverandørkjeden.",
    controlPoints: [
      {
        id: "§4", label: "Aktsomhetsvurdering",
        hoursByLevel: { gap: 8, partial: 24, full: 60 },
        typicalActivities: ["Kartlegge leverandørkjede", "Risikovurdere og prioritere tiltak"],
      },
      {
        id: "§5", label: "Redegjørelse",
        hoursByLevel: { gap: 4, partial: 12, full: 24 },
        typicalActivities: ["Skrive årlig redegjørelse", "Publisere og signere"],
      },
    ],
  },
];
