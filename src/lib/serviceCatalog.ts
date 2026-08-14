export interface ServiceFrameworkMapping {
  frameworkId: string;
  frameworkLabel: string;
  controlIds: string[];
}

/** Hvilken type leveranse partneren utfører. */
export type ServiceDeliveryType = "advisory" | "questionnaire";

/** Identifikator for et innebygd spørreskjema (gjenbruker eksisterende spørsmålssett). */
export type QuestionnaireId = "gdpr_maturity" | "nis2_scope" | "iso_gap";

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
  /** Synlig og bestillbar for partnerens kunder i deres Mynder-portal. */
  publishedToCustomers?: boolean;
  /** Hvordan tjenesten leveres. Default "advisory". */
  deliveryType?: ServiceDeliveryType;
  /** Hvilket innebygd spørreskjema som benyttes når deliveryType === "questionnaire". */
  questionnaireId?: QuestionnaireId;
  /** Estimert tid for kunden å besvare et spørreskjema, i minutter. */
  estimatedMinutes?: number;
  /** Livssyklus-status. Default "active". Avsluttede tjenester skjules fra kunder og nye tilbud, men bevares i historikk. */
  status?: "active" | "retired";
  /** ISO-tidspunkt for når tjenesten ble avsluttet. */
  retiredAt?: string;
  /** Fritekst årsak til avslutning (audit-logg). */
  retiredReason?: string;
  /** Id på tjenesten som erstatter denne. */
  replacedById?: string;
}

/**
 * Partnerens egen tjenestekatalog.
 * Mynder leverer regelverkene — partneren legger inn sine tjenester her,
 * og Lara viser hvordan de treffer kontrollpunkter på tvers av rammeverk.
 */
export const PARTNER_SERVICES: PartnerService[] = [
  // ──────────────────────────────────────────────────────────────────────
  // Spørreskjema-tjenester — partneren bestiller, kunden besvarer i sin
  // egen Mynder, svarene flyter tilbake som modenhetsdata.
  // ──────────────────────────────────────────────────────────────────────
  {
    id: "q-gdpr-maturity",
    name: "GDPR-helsesjekk",
    description:
      "Strukturert spørreskjema som kartlegger GDPR-modenhet på styring, drift, personvern og tredjepart. Kunden besvarer 19 spørsmål — Lara genererer tiltaksliste og foreslår oppfølgingstjenester.",
    defaultChecklist: [
      "Send skjema til kundekontakt",
      "Kunden besvarer 19 spørsmål",
      "Lara identifiserer gap",
      "Tiltaksrapport og forslag til oppfølging",
    ],
    frameworkMappings: [
      { frameworkId: "gdpr", frameworkLabel: "GDPR", controlIds: ["Art.5", "Art.24", "Art.28", "Art.30", "Art.32"] },
    ],
    tags: ["gdpr", "questionnaire", "smb", "mid"],
    price: 7500,
    priceModel: "fixed",
    deliveryType: "questionnaire",
    questionnaireId: "gdpr_maturity",
    estimatedMinutes: 15,
    publishedToCustomers: true,
  },
  {
    id: "q-nis2-scope",
    name: "NIS2-scoping",
    description:
      "Kort skjema som avklarer om virksomheten er i scope for NIS2 og hvor styringsmessig moden den er. Brukes som grunnlag for tilbud om full NIS2-leveranse.",
    defaultChecklist: [
      "Send skjema til daglig leder / CISO",
      "Kunden besvarer scoping-spørsmål",
      "Lara avklarer NIS2-status",
      "Forslag til neste steg",
    ],
    frameworkMappings: [
      { frameworkId: "nis2", frameworkLabel: "NIS2", controlIds: ["Art.2", "Art.20", "Art.21"] },
    ],
    tags: ["nis2", "questionnaire", "mid", "critical"],
    price: 5000,
    priceModel: "fixed",
    deliveryType: "questionnaire",
    questionnaireId: "nis2_scope",
    estimatedMinutes: 8,
    publishedToCustomers: true,
  },
  {
    id: "q-iso-gap",
    name: "ISO 27001 mini gap-analyse",
    description:
      "Komplett selvevaluering på tvers av styring, drift, personvern og tredjepart. Lara skårer modenhet og lager gap-rapport som forarbeid til full ISO-leveranse.",
    defaultChecklist: [
      "Send skjema til sikkerhetsansvarlig",
      "Kunden besvarer alle kategorier",
      "Gap-rapport generert",
      "Anbefaling om full ISO-løp",
    ],
    frameworkMappings: [
      { frameworkId: "iso27001", frameworkLabel: "ISO 27001", controlIds: ["A.5.1", "A.6.1", "A.8.1", "A.15.1"] },
    ],
    tags: ["iso", "questionnaire", "security", "mid", "high"],
    price: 15000,
    priceModel: "fixed",
    deliveryType: "questionnaire",
    questionnaireId: "iso_gap",
    estimatedMinutes: 20,
    publishedToCustomers: true,
  },

  {
    id: "nis2",
    name: "NIS2-vurdering",
    description:
      "Vurdering av virkeområde, gap-analyse mot Art. 21 og tiltaksplan for NIS2-direktivet.",
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
    price: 45000,
    priceModel: "fixed",
    priceNote: "fra 45 000 kr",
  },
  {
    id: "dpia",
    name: "DPIA — personvernkonsekvensvurdering",
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
    tags: ["gdpr", "ai", "project"],
    price: 25000,
    priceModel: "fixed",
  },
  {
    id: "transparency",
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
    price: 35000,
    priceModel: "fixed",
  },
  {
    id: "iso27001",
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
    tags: ["iso", "security", "project"],
    priceNote: "fra 120 000 kr",
    priceModel: "quote",
  },
  {
    id: "dpo",
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
    tags: ["gdpr", "subscription"],
    price: 7500,
    priceModel: "monthly",
    priceNote: "fra 7 500 kr/mnd",
  },
  {
    id: "vciso",
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
    tags: ["security", "iso", "subscription"],
    price: 12000,
    priceModel: "monthly",
  },
  {
    id: "ai-governance",
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
    tags: ["ai", "project"],
    price: 55000,
    priceModel: "fixed",
  },
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
    price: 1500,
    priceModel: "monthly",
    priceNote: "fra 1 500 kr/mnd",
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
    price: 65000,
    priceModel: "fixed",
  },
  {
    id: "soc",
    name: "SOC-as-a-Service (24/7)",
    description:
      "Døgnbemannet sikkerhetsovervåking med SIEM, hendelseshåndtering og månedlig rapportering til kunden.",
    defaultChecklist: [
      "Onboarding og logg-kilder koblet",
      "Use-cases og deteksjon aktivert",
      "Hendelseshåndtering 24/7",
      "Månedlig SOC-rapport",
      "Kvartalsvis tuning av regler",
    ],
    frameworkMappings: [
      { frameworkId: "iso27001", frameworkLabel: "ISO 27001", controlIds: ["A.8.15", "A.8.16", "A.5.24"] },
      { frameworkId: "nis2", frameworkLabel: "NIS2", controlIds: ["Art.21", "Art.23"] },
    ],
    tags: ["security", "subscription", "mid", "critical"],
    price: 18000,
    priceModel: "monthly",
    priceNote: "fra 18 000 kr/mnd",
  },
  {
    id: "managed-edr",
    name: "Managed EDR / endpoint-beskyttelse",
    description:
      "Drift og overvåking av endepunktsikkerhet (EDR/XDR) med respons på alarmer og kvartalsrapport.",
    defaultChecklist: [
      "Rollout av EDR-agent",
      "Policy hardening",
      "Døgnkontinuerlig alarmrespons",
      "Kvartalsrapport til kunde",
    ],
    frameworkMappings: [
      { frameworkId: "iso27001", frameworkLabel: "ISO 27001", controlIds: ["A.8.7", "A.8.16"] },
      { frameworkId: "nis2", frameworkLabel: "NIS2", controlIds: ["Art.21"] },
    ],
    tags: ["security", "subscription", "smb", "mid"],
    price: 95,
    priceModel: "per-user",
    priceNote: "per bruker/mnd",
  },
  {
    id: "managed-backup",
    name: "Managed Backup & Recovery",
    description:
      "Driftet sikkerhetskopi med immutable storage, restore-tester og rapportering iht. 3-2-1-prinsippet.",
    defaultChecklist: [
      "Oppsett av backup-policy",
      "Immutable storage konfigurert",
      "Månedlig restore-test",
      "Kvartalsrapport med RTO/RPO",
    ],
    frameworkMappings: [
      { frameworkId: "iso27001", frameworkLabel: "ISO 27001", controlIds: ["A.8.13", "A.5.29"] },
      { frameworkId: "nis2", frameworkLabel: "NIS2", controlIds: ["Art.21"] },
    ],
    tags: ["security", "subscription", "smb", "mid", "critical"],
    price: 6500,
    priceModel: "monthly",
    priceNote: "fra 6 500 kr/mnd",
  },
  {
    id: "incident-response",
    name: "Beredskap & hendelseshåndtering",
    description:
      "Retainer for IR-bistand ved sikkerhetshendelser, inkl. øvelser og varslingsrutiner mot tilsynsmyndigheter.",
    defaultChecklist: [
      "IR-plan etablert",
      "Årlig table-top øvelse",
      "Kontaktveier for 24/7 varsling",
      "Etterevaluering ved hendelse",
    ],
    frameworkMappings: [
      { frameworkId: "nis2", frameworkLabel: "NIS2", controlIds: ["Art.23"] },
      { frameworkId: "iso27001", frameworkLabel: "ISO 27001", controlIds: ["A.5.24", "A.5.26"] },
    ],
    tags: ["security", "subscription", "critical", "mid"],
    price: 4500,
    priceModel: "monthly",
    priceNote: "retainer fra 4 500 kr/mnd",
  },
  {
    id: "m365-hardening",
    name: "Microsoft 365 sikkerhetshardening",
    description:
      "Gjennomgang og hardening av M365-tenant (Entra ID, Defender, Purview) med konfigurasjonsrapport.",
    defaultChecklist: [
      "Tenant-vurdering (Secure Score)",
      "Conditional Access policies",
      "MFA og rolle-hygiene",
      "Defender/Purview konfigurert",
      "Rapport og overlevering",
    ],
    frameworkMappings: [
      { frameworkId: "iso27001", frameworkLabel: "ISO 27001", controlIds: ["A.5.15", "A.8.2", "A.8.3"] },
    ],
    tags: ["security", "project", "smb", "mid"],
    price: 35000,
    priceModel: "fixed",
  },
];


export function getService(id: string): PartnerService | undefined {
  return PARTNER_SERVICES.find((s) => s.id === id);
}

// ---------------------------------------------------------------------------
// Lara-veiviser: spørsmål, maler og forslagslogikk
// ---------------------------------------------------------------------------

export type WizardAnswers = {
  markets: string[];
  segments: string[];
  domains: string[];
  models: string[];
  maturity: string[]; // valgfri
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
  optional?: boolean;
  allowFreeText?: boolean;
  freeTextPlaceholder?: string;
  options: WizardOption[];
}

export const WIZARD_QUESTIONS: WizardQuestion[] = [
  {
    id: "markets",
    title: "Hvilke markeder betjener dere kundene i?",
    subtitle: "Velg alle som gjelder. Lara filtrerer regelverksforslag til valgte markeder.",
    multi: true,
    options: [
      { id: "no", label: "Norge" },
      { id: "se", label: "Sverige" },
      { id: "dk", label: "Danmark" },
      { id: "fi", label: "Finland" },
      { id: "eu", label: "EU / EØS" },
      { id: "uk", label: "UK" },
      { id: "au", label: "Australia" },
      { id: "global", label: "Globalt" },
    ],
  },
  {
    id: "segments",
    title: "Hvilke kundesegmenter leverer dere til?",
    subtitle: "Velg alle som passer.",
    multi: true,
    options: [
      { id: "smb", label: "SMB (1–50 ansatte)" },
      { id: "mid", label: "Mellomstore (50–500)" },
      { id: "enterprise", label: "Enterprise (500+)" },
      { id: "critical", label: "Kritisk infrastruktur" },
      { id: "public", label: "Offentlig sektor" },
    ],
  },
  {
    id: "domains",
    title: "Hvilke fagområder leverer dere på?",
    subtitle: "Lara bruker dette til å foreslå relevante tjenester. Du kan også legge til egne.",
    multi: true,
    allowFreeText: true,
    freeTextPlaceholder: "Legg til eget fagområde og trykk Enter",
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
    id: "models",
    title: "Hvordan leverer dere typisk?",
    subtitle: "Velg alle som passer. Lara tilpasser sjekklister etter leveransemodell.",
    multi: true,
    options: [
      { id: "project", label: "Engangsprosjekt" },
      { id: "subscription", label: "Løpende abonnement" },
      { id: "managed", label: "Managed service" },
      { id: "hybrid", label: "Hybrid" },
    ],
  },
  {
    id: "maturity",
    title: "Hvor moden er en typisk kunde?",
    subtitle: "Valgfritt — brukes til å tone forslagene riktig.",
    multi: true,
    optional: true,
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
  const knownDomains = new Set(
    WIZARD_QUESTIONS.find((q) => q.id === "domains")?.options.map((o) => o.id) ?? [],
  );
  const presetDomains = answers.domains.filter((d) => knownDomains.has(d));
  const freeTextDomains = answers.domains
    .filter((d) => !knownDomains.has(d))
    .map((d) => d.toLowerCase().trim())
    .filter(Boolean);

  const wanted = new Set<string>([
    ...answers.segments,
    ...presetDomains,
    ...answers.models,
    ...answers.maturity,
  ]);

  const scored = SUGGESTION_TEMPLATES.map((tpl) => {
    const tags = tpl.tags ?? [];
    let score = 0;
    for (const t of tags) if (wanted.has(t)) score += 1;
    for (const d of presetDomains) if (tags.includes(d)) score += 2;
    const haystack = `${tpl.name} ${tpl.description}`.toLowerCase();
    for (const q of freeTextDomains) if (haystack.includes(q)) score += 2;
    return { tpl, score };
  })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map((x) => x.tpl);

  if (scored.length === 0) return SUGGESTION_TEMPLATES.slice(0, 4);
  return scored;
}

