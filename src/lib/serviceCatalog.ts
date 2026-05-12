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
  /** Pris (NOK). Tolkes ut fra priceModel. */
  price?: number;
  /** Prismodell for tjenesten. */
  priceModel?: "fixed" | "monthly" | "hourly" | "per-user" | "quote";
  /** Fritekst for prisnotat (f.eks. "fra 25 000 kr" eller "ekskl. mva"). */
  priceNote?: string;
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
];

export function getService(id: string): PartnerService | undefined {
  return PARTNER_SERVICES.find((s) => s.id === id);
}

// ---------------------------------------------------------------------------
// Lara-veiviser: spørsmål, maler og forslagslogikk
// ---------------------------------------------------------------------------

export type WizardAnswers = {
  segments: string[]; // smb | mid | critical | public
  domains: string[]; // security | gdpr | iso | ai | nis2 | transparency | dora
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
      { id: "nis2", label: "NIS2" },
      { id: "dora", label: "DORA" },
      { id: "ai", label: "AI Governance / AI Act" },
      { id: "transparency", label: "Åpenhetsloven / leverandørkjede" },
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
    id: "tpl-dpo",
    name: "DPO-as-a-Service",
    description:
      "Eksternt personvernombud med løpende rådgivning, behandlingsprotokoll og tilsynsdialog.",
    defaultChecklist: [
      "Behandlingsprotokoll vedlikeholdt",
      "Rådgivning til virksomheten",
      "Avvik og brudd håndtert",
      "Årsrapport til ledelse",
    ],
    frameworkMappings: [
      { frameworkId: "gdpr", frameworkLabel: "GDPR", controlIds: ["Art.37", "Art.39"] },
    ],
    tags: ["gdpr", "subscription", "mid", "critical", "public"],
  },
  {
    id: "tpl-dpa-review",
    name: "Databehandleravtaler — gjennomgang",
    description:
      "Gjennomgang og forhandling av databehandleravtaler (DPA) med leverandører.",
    defaultChecklist: [
      "Kartlegging av leverandører",
      "Gjennomgang av DPA-er",
      "Forhandling og signering",
      "Register oppdatert",
    ],
    frameworkMappings: [
      { frameworkId: "gdpr", frameworkLabel: "GDPR", controlIds: ["Art.28"] },
    ],
    tags: ["gdpr", "project", "smb", "mid"],
  },
  {
    id: "tpl-transparency",
    name: "Åpenhetsloven — aktsomhetsvurdering",
    description:
      "Kartlegging av leverandørkjede, aktsomhetsvurdering og publisering av redegjørelse iht. åpenhetsloven.",
    defaultChecklist: [
      "Kartlegging av leverandørkjede",
      "Risikovurdering menneskerettigheter",
      "Tiltaksplan",
      "Redegjørelse publisert innen 30. juni",
    ],
    frameworkMappings: [
      { frameworkId: "transparency", frameworkLabel: "Åpenhetsloven", controlIds: ["§4", "§5"] },
    ],
    tags: ["transparency", "project", "mid", "critical"],
  },
  {
    id: "tpl-iso27001",
    name: "ISO 27001 — implementering",
    description:
      "Etablering av styringssystem for informasjonssikkerhet med dokumentasjon, risikovurdering og sertifiseringsstøtte.",
    defaultChecklist: [
      "Gap-analyse",
      "Risikovurdering",
      "Policy-rammeverk",
      "Internrevisjon",
      "Sertifiseringsstøtte",
    ],
    frameworkMappings: [
      { frameworkId: "iso27001", frameworkLabel: "ISO 27001", controlIds: ["A.5.1", "A.5.4", "A.6.1"] },
    ],
    tags: ["iso", "security", "project", "mid", "high"],
  },
  {
    id: "tpl-nis2",
    name: "NIS2-compliance",
    description:
      "Vurdering av virkeområde, gap-analyse og tiltaksplan for NIS2-direktivet.",
    defaultChecklist: [
      "Virkeområde-vurdering",
      "Gap-analyse mot Art. 21",
      "Tiltaksplan",
      "Hendelsesrapportering etablert",
    ],
    frameworkMappings: [
      { frameworkId: "nis2", frameworkLabel: "NIS2", controlIds: ["Art.20", "Art.21", "Art.23"] },
    ],
    tags: ["nis2", "security", "project", "critical"],
  },
  {
    id: "tpl-dora",
    name: "DORA-compliance (finans)",
    description:
      "Operasjonell motstandsdyktighet for finansforetak — IKT-risiko, hendelser og leverandørstyring.",
    defaultChecklist: [
      "ICT-risikorammeverk",
      "Hendelseshåndtering og rapportering",
      "TLPT-test",
      "Tredjepartsregister",
    ],
    frameworkMappings: [
      { frameworkId: "dora", frameworkLabel: "DORA", controlIds: ["Art.5", "Art.17", "Art.28"] },
    ],
    tags: ["dora", "security", "project", "critical"],
  },
  {
    id: "tpl-ai-governance",
    name: "AI Governance-rammeverk",
    description:
      "Etablering av styring, policyer og roller for ansvarlig bruk av AI iht. AI Act.",
    defaultChecklist: [
      "AI-policy etablert",
      "Roller og ansvar avklart",
      "Inventar av AI-systemer",
      "Opplæring av nøkkelpersonell",
    ],
    frameworkMappings: [
      { frameworkId: "aiact", frameworkLabel: "AI Act", controlIds: ["Art.4", "Art.9", "Art.26"] },
    ],
    tags: ["ai", "subscription", "mid", "critical"],
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
