export interface ServiceFrameworkMapping {
  frameworkId: string;
  frameworkLabel: string;
  controlIds: string[];
}

export interface PartnerService {
  id: string;
  name: string;
  description: string;
  /** Standard sjekklistepunkter som kopieres inn på en leveranse. */
  defaultChecklist: string[];
  /** Hvilke regelverkskontroller tjenesten treffer. */
  frameworkMappings: ServiceFrameworkMapping[];
  /** Tagger brukt av Lara til å matche mot wizard-svar. */
  tags?: string[];
}

/**
 * Partnerens egen tjenestekatalog.
 * Mynder leverer regelverkene — partneren legger inn sine tjenester her,
 * og Lara viser hvordan de treffer kontrollpunkter på tvers av rammeverk.
 */
export const PARTNER_SERVICES: PartnerService[] = [
  {
    id: "awareness",
    name: "Awareness-program",
    description:
      "Løpende sikkerhetsbevissthetsprogram med phishing-simuleringer, e-læring og rapportering.",
    defaultChecklist: [
      "Kick-off med kunde",
      "Phishing-simulering Q1",
      "E-læringsmodul utrullet",
      "Rapport sendt til kunde",
      "Oppfølgingsmøte",
    ],
    frameworkMappings: [
      { frameworkId: "iso27001", frameworkLabel: "ISO 27001", controlIds: ["A.6.3", "A.5.10"] },
      { frameworkId: "nis2", frameworkLabel: "NIS2", controlIds: ["Art.20"] },
    ],
    tags: ["security", "subscription", "smb", "mid"],
  },
  {
    id: "pentest",
    name: "Penetrasjonstest",
    description:
      "Årlig ekstern test av applikasjoner og infrastruktur, med rapport og re-test av funn.",
    defaultChecklist: [
      "Scoping og forberedelse",
      "Test gjennomført",
      "Rapport levert",
      "Re-test av funn",
      "Sluttmøte med kunde",
    ],
    frameworkMappings: [
      { frameworkId: "iso27001", frameworkLabel: "ISO 27001", controlIds: ["A.8.8", "A.8.29"] },
      { frameworkId: "nis2", frameworkLabel: "NIS2", controlIds: ["Art.21"] },
    ],
    tags: ["security", "project", "mid", "critical"],
  },
  {
    id: "iso-readiness",
    name: "ISO 27001-klargjøring",
    description:
      "Strukturert leveranse for å gjøre kunden klar til ISO 27001-sertifisering.",
    defaultChecklist: [
      "Gap-analyse",
      "Policy- og dokumentpakke",
      "Risikovurdering",
      "Internrevisjon",
      "Ledelsesgjennomgang",
    ],
    frameworkMappings: [
      {
        frameworkId: "iso27001",
        frameworkLabel: "ISO 27001",
        controlIds: ["A.5.1", "A.5.9", "A.6.3", "A.8.8"],
      },
    ],
    tags: ["iso", "project", "mid", "critical"],
  },
  {
    id: "ai-governance",
    name: "AI Governance-rammeverk",
    description:
      "Kartlegging av AI-bruk, klassifisering og policy-oppsett mot AI Act.",
    defaultChecklist: [
      "Kartlegging av AI-bruk",
      "Risikoklassifisering",
      "Policy-oppsett",
      "Rutiner for menneskelig tilsyn",
    ],
    frameworkMappings: [
      { frameworkId: "aiact", frameworkLabel: "AI Act", controlIds: ["Art.9", "Art.14"] },
    ],
    tags: ["ai", "project", "mid"],
  },
];

export function getService(id: string): PartnerService | undefined {
  return PARTNER_SERVICES.find((s) => s.id === id);
}

// ---------------------------------------------------------------------------
// Lara-veiviser: spørsmål, maler og forslagslogikk
// ---------------------------------------------------------------------------

export type WizardAnswers = {
  segments: string[]; // smb | mid | critical | public
  domains: string[]; // security | gdpr | iso | ai | nis2 | quality | economy | accounting
  model: string; // project | subscription | hybrid
  maturity: string; // low | mid | high
};

export interface WizardOption {
  id: string;
  label: string;
  hint?: string;
}

export interface WizardQuestion {
  id: keyof WizardAnswers;
  title: string;
  subtitle: string;
  multi: boolean;
  options: WizardOption[];
}

export const WIZARD_QUESTIONS: WizardQuestion[] = [
  {
    id: "segments",
    title: "Hvilke kundesegmenter leverer dere til?",
    subtitle: "Velg alle som passer.",
    multi: true,
    options: [
      { id: "smb", label: "SMB (1–50 ansatte)" },
      { id: "mid", label: "Mellomstore (50–500)" },
      { id: "critical", label: "Kritisk infrastruktur" },
      { id: "public", label: "Offentlig sektor" },
    ],
  },
  {
    id: "domains",
    title: "Hvilke fagområder leverer dere på?",
    subtitle: "Lara bruker dette til å foreslå relevante tjenester.",
    multi: true,
    options: [
      { id: "security", label: "IT-sikkerhet" },
      { id: "gdpr", label: "Personvern / GDPR" },
      { id: "iso", label: "ISO 27001 / styringssystem" },
      { id: "nis2", label: "NIS2 / DORA" },
      { id: "ai", label: "AI Governance / AI Act" },
      { id: "quality", label: "Kvalitet & HMS" },
      { id: "economy", label: "Økonomi" },
      { id: "accounting", label: "Regnskap & bokføring" },
    ],
  },
  {
    id: "model",
    title: "Hvordan leverer dere typisk?",
    subtitle: "Lara tilpasser sjekklister etter leveransemodell.",
    multi: false,
    options: [
      { id: "project", label: "Engangsprosjekt" },
      { id: "subscription", label: "Løpende abonnement" },
      { id: "hybrid", label: "Hybrid (begge deler)" },
    ],
  },
  {
    id: "maturity",
    title: "Hvor moden er en typisk kunde?",
    subtitle: "Brukes til å tone forslagene riktig.",
    multi: false,
    options: [
      { id: "low", label: "Lav — starter fra null" },
      { id: "mid", label: "Middels — har noe på plass" },
      { id: "high", label: "Høy — trenger optimalisering" },
    ],
  },
];

/** Maler Lara kan foreslå basert på wizard-svar. */
export const SUGGESTION_TEMPLATES: PartnerService[] = [
  {
    id: "tpl-awareness",
    name: "Awareness-program",
    description:
      "Løpende sikkerhetsbevissthet med phishing-simuleringer, e-læring og rapportering til ledelse.",
    defaultChecklist: [
      "Kick-off med kunde",
      "Phishing-simulering kvartalsvis",
      "E-læringsmodul utrullet",
      "Rapport til ledelse",
      "Oppfølgingsmøte",
    ],
    frameworkMappings: [
      { frameworkId: "iso27001", frameworkLabel: "ISO 27001", controlIds: ["A.6.3", "A.5.10"] },
      { frameworkId: "nis2", frameworkLabel: "NIS2", controlIds: ["Art.20"] },
    ],
    tags: ["security", "subscription", "smb", "mid"],
  },
  {
    id: "tpl-pentest",
    name: "Penetrasjonstest",
    description:
      "Ekstern test av applikasjoner og infrastruktur, rapport og re-test av funn.",
    defaultChecklist: [
      "Scoping",
      "Test gjennomført",
      "Rapport levert",
      "Re-test av funn",
      "Sluttmøte",
    ],
    frameworkMappings: [
      { frameworkId: "iso27001", frameworkLabel: "ISO 27001", controlIds: ["A.8.8", "A.8.29"] },
      { frameworkId: "nis2", frameworkLabel: "NIS2", controlIds: ["Art.21"] },
    ],
    tags: ["security", "project", "mid", "critical"],
  },
  {
    id: "tpl-soc",
    name: "SOC-as-a-Service",
    description:
      "Døgnkontinuerlig overvåking, deteksjon og respons på sikkerhetshendelser.",
    defaultChecklist: [
      "Onboarding av loggkilder",
      "Use-case og alarmoppsett",
      "Månedlig rapport",
      "Hendelsesrespons-øvelse",
    ],
    frameworkMappings: [
      { frameworkId: "iso27001", frameworkLabel: "ISO 27001", controlIds: ["A.8.16", "A.5.24"] },
      { frameworkId: "nis2", frameworkLabel: "NIS2", controlIds: ["Art.21", "Art.23"] },
    ],
    tags: ["security", "subscription", "critical", "mid"],
  },
  {
    id: "tpl-iso",
    name: "ISO 27001-klargjøring",
    description:
      "Strukturert prosjekt for å gjøre kunden klar for ISO 27001-sertifisering.",
    defaultChecklist: [
      "Gap-analyse",
      "Policy- og dokumentpakke",
      "Risikovurdering",
      "Internrevisjon",
      "Ledelsesgjennomgang",
    ],
    frameworkMappings: [
      { frameworkId: "iso27001", frameworkLabel: "ISO 27001", controlIds: ["A.5.1", "A.5.9", "A.6.3", "A.8.8"] },
    ],
    tags: ["iso", "project", "mid", "low"],
  },
  {
    id: "tpl-nis2",
    name: "NIS2-klargjøring",
    description:
      "Gap-analyse mot NIS2 med policyer, risikovurdering og rapporteringsrutiner.",
    defaultChecklist: [
      "Gap-analyse mot NIS2",
      "Risiko- og sårbarhetsvurdering",
      "Policy- og dokumentpakke",
      "Hendelsesrapporteringsrutiner",
      "Ledelsesgjennomgang",
    ],
    frameworkMappings: [
      { frameworkId: "nis2", frameworkLabel: "NIS2", controlIds: ["Art.20", "Art.21", "Art.23"] },
    ],
    tags: ["nis2", "project", "critical", "public", "mid"],
  },
  {
    id: "tpl-incident",
    name: "Hendelseshåndtering",
    description:
      "Beredskapsplan, rolleavklaring og øvelser for cyberhendelser.",
    defaultChecklist: [
      "Beredskapsplan utarbeidet",
      "Roller og ansvar avklart",
      "Tabletop-øvelse",
      "Etterevaluering",
    ],
    frameworkMappings: [
      { frameworkId: "iso27001", frameworkLabel: "ISO 27001", controlIds: ["A.5.24", "A.5.26"] },
      { frameworkId: "nis2", frameworkLabel: "NIS2", controlIds: ["Art.21", "Art.23"] },
    ],
    tags: ["security", "nis2", "hybrid", "critical"],
  },
  {
    id: "tpl-gdpr",
    name: "GDPR-grunnpakke",
    description:
      "Behandlingsoversikt, personvernerklæring, databehandleravtaler og rutiner.",
    defaultChecklist: [
      "Kartlegging av behandlinger",
      "Personvernerklæring",
      "DPA-oversikt",
      "Avviksrutine",
      "Opplæring",
    ],
    frameworkMappings: [
      { frameworkId: "gdpr", frameworkLabel: "GDPR", controlIds: ["Art.30", "Art.32", "Art.33"] },
    ],
    tags: ["gdpr", "project", "smb", "mid", "low"],
  },
  {
    id: "tpl-dpia",
    name: "DPIA-tjeneste",
    description:
      "Personvernkonsekvensvurdering for høyrisiko-behandlinger og AI-systemer.",
    defaultChecklist: [
      "Identifisering av behandling",
      "Konsekvensvurdering",
      "Tiltaksplan",
      "Dokumentasjon arkivert",
    ],
    frameworkMappings: [
      { frameworkId: "gdpr", frameworkLabel: "GDPR", controlIds: ["Art.35"] },
      { frameworkId: "aiact", frameworkLabel: "AI Act", controlIds: ["Art.9"] },
    ],
    tags: ["gdpr", "ai", "project", "mid", "critical"],
  },
  {
    id: "tpl-ai-governance",
    name: "AI Governance-rammeverk",
    description:
      "Kartlegging av AI-bruk, risikoklassifisering og policy-oppsett mot AI Act.",
    defaultChecklist: [
      "Kartlegging av AI-bruk",
      "Risikoklassifisering",
      "Policy-oppsett",
      "Rutiner for menneskelig tilsyn",
    ],
    frameworkMappings: [
      { frameworkId: "aiact", frameworkLabel: "AI Act", controlIds: ["Art.9", "Art.14"] },
    ],
    tags: ["ai", "project", "mid", "high"],
  },
  {
    id: "tpl-ai-risk",
    name: "AI-risikovurdering",
    description:
      "Vurdering av risikoklasse, datakvalitet og bias for AI-systemer i bruk.",
    defaultChecklist: [
      "Inventar av AI-systemer",
      "Klassifisering",
      "Bias- og datakvalitetstest",
      "Rapport til ledelse",
    ],
    frameworkMappings: [
      { frameworkId: "aiact", frameworkLabel: "AI Act", controlIds: ["Art.9", "Art.10"] },
    ],
    tags: ["ai", "project", "mid", "critical"],
  },
  {
    id: "tpl-quality",
    name: "Kvalitets- og HMS-pakke",
    description:
      "Styringssystem for kvalitet og HMS med årshjul og avvikshåndtering.",
    defaultChecklist: [
      "Årshjul satt opp",
      "Avvikssystem etablert",
      "Internrevisjon",
      "Ledelsesgjennomgang",
    ],
    frameworkMappings: [
      { frameworkId: "iso9001", frameworkLabel: "ISO 9001", controlIds: ["8.1", "9.2"] },
    ],
    tags: ["quality", "subscription", "smb", "mid"],
  },
  {
    id: "tpl-vciso",
    name: "vCISO-tjeneste",
    description:
      "Strategisk sikkerhetsledelse på timebasis — rådgivning, rapportering og styringsstøtte.",
    defaultChecklist: [
      "Månedlig statusmøte",
      "Sikkerhetsstrategi oppdatert",
      "Rapport til styret",
      "Risikoregister vedlikeholdt",
    ],
    frameworkMappings: [
      { frameworkId: "iso27001", frameworkLabel: "ISO 27001", controlIds: ["A.5.1", "A.5.4"] },
    ],
    tags: ["security", "iso", "subscription", "mid", "high"],
  },
  {
    id: "tpl-bookkeeping",
    name: "Løpende bokføring",
    description:
      "Månedlig bokføring, avstemming og leveranse av regnskap med digital tilgang til data.",
    defaultChecklist: [
      "Bokføring månedlig",
      "Avstemming bank/kontoer",
      "MVA-melding",
      "Årsoppgjør",
      "Digital tilgang for kunde",
    ],
    frameworkMappings: [],
    tags: ["accounting", "subscription", "smb", "mid"],
  },
  {
    id: "tpl-payroll",
    name: "Lønnskjøring",
    description:
      "Utbetaling av lønn, A-melding, feriepenger og årsoppgjør for ansatte.",
    defaultChecklist: [
      "Månedlig lønnskjøring",
      "A-melding til Skatteetaten",
      "Feriepenger og sykepenger",
      "Årsoppgjør lønn",
    ],
    frameworkMappings: [],
    tags: ["accounting", "subscription", "smb", "mid"],
  },
  {
    id: "tpl-cfo",
    name: "Eksternt økonomi-styre (vCFO)",
    description:
      "Strategisk økonomirådgivning, budsjettering, likviditetsstyring og styrrapportering.",
    defaultChecklist: [
      "Månedlig økonomirapport",
      "Budsjett og prognoser",
      "Likviditetsanalyse",
      "Styremøte og presentasjon",
    ],
    frameworkMappings: [],
    tags: ["economy", "subscription", "mid", "high"],
  },
  {
    id: "tpl-audit-support",
    name: "Revisjonsstøtte",
    description:
      "Forberedelse og gjennomføring av revisjonsprosess med dokumentasjon og avvikshåndtering.",
    defaultChecklist: [
      "Forberedelse av dokumentasjon",
      "Avstemming og kontroller",
      "Revisjonsmøte",
      "Avvikshåndtering og oppfølging",
    ],
    frameworkMappings: [],
    tags: ["accounting", "project", "mid", "high"],
  },
];

/**
 * Regelbasert forslagsmotor — Lara-personlighet i UI, deterministisk under panseret.
 * Skårer hver mal etter overlapp i tags vs. wizard-svar.
 */
export function suggestServices(answers: WizardAnswers): PartnerService[] {
  const wanted = new Set<string>([
    ...answers.segments,
    ...answers.domains,
    answers.model,
    answers.maturity,
  ]);

  const scored = SUGGESTION_TEMPLATES.map((tpl) => {
    const tags = tpl.tags ?? [];
    let score = 0;
    for (const t of tags) if (wanted.has(t)) score += 1;
    // Domenetreff veier tyngre
    for (const d of answers.domains) if (tags.includes(d)) score += 2;
    return { tpl, score };
  })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map((x) => x.tpl);

  // Fallback: hvis ingen matcher, returner et lite default-utvalg
  if (scored.length === 0) {
    return SUGGESTION_TEMPLATES.slice(0, 4);
  }
  return scored;
}
