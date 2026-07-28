// ────────────────────────────────────────────────────────────────────────────
// Tjenestebibliotek (eid av Mynder) — kuraterte maler partneren kan adoptere.
// Spec: Notion "Tjenestebibliotek MVP" 19.05.2026.
// Lag 1 = Universelle basis (alle), Lag 2A = MSP, Lag 2B = MSSP,
// Lag 3 = land-/bransje-spesifikke (foreslås av Lara når relevant).
// ────────────────────────────────────────────────────────────────────────────

export type ServiceTier = "universal" | "msp" | "mssp" | "regional";
export type ServiceDelivery = "one-off" | "recurring";
export type ServicePartnerType = "all" | "msp" | "mssp";
export type ServiceScope =
  | "global"
  | "EU"
  | "NO"
  | "SE"
  | "NL"
  | "AU"
  | "US";
export type ServiceIndustry =
  | "healthcare"
  | "finance"
  | "public"
  | "critical-infrastructure";

export interface TemplateActivity {
  label: string;
  /** Estimerte timer; undefined = variabel/auto. */
  hours?: number;
}

/**
 * Rolle en tjeneste har mot et krav. En kobling kan ha flere roller
 * (f.eks. pentest = vurderende + dokumenterende).
 */
export type ServiceRole = "direct" | "enabling" | "documenting" | "assessing";

export const ROLE_META: Record<
  ServiceRole,
  { label: string; verb: string; description: string }
> = {
  direct: {
    label: "Direkte tiltak",
    verb: "utfører",
    description: "Tjenesten utfører selve kravet (f.eks. drift av MFA).",
  },
  enabling: {
    label: "Muliggjørende",
    verb: "muliggjør",
    description: "Tjenesten legger til rette for at kravet kan oppfylles.",
  },
  documenting: {
    label: "Dokumenterende",
    verb: "dokumenterer",
    description: "Tjenesten produserer bevis eller dokumentasjon.",
  },
  assessing: {
    label: "Vurderende",
    verb: "vurderer",
    description: "Tjenesten vurderer status eller modenhet mot kravet.",
  },
};

export interface TemplateFrameworkMapping {
  frameworkId: string;
  /** Vises i UI når vi ikke finner framework i katalogen. */
  frameworkLabel: string;
  controlIds: string[];
  /** Overstyrer template.defaultRoles for denne konkrete koblingen. */
  roles?: ServiceRole[];
}

export interface ServiceTemplate {
  id: string;
  /** Spec-kode: "B1", "MSP3", "MSSP5", "NO1" osv. */
  code: string;
  name: string;
  shortDescription: string;
  tier: ServiceTier;
  delivery: ServiceDelivery;
  partnerType: ServicePartnerType;
  scopes: ServiceScope[];
  industries?: ServiceIndustry[];
  /** Anbefalt pris-spenn i NOK. Partner setter selv ved adopsjon. */
  recommendedPrice: {
    min: number;
    max: number;
    /** "fixed", "monthly", "per-questionnaire", "quote". */
    model: "fixed" | "monthly" | "per-questionnaire" | "quote";
  };
  estimatedHours: {
    min: number;
    max: number;
    /** Skrives ut når timer er per måned e.l. */
    cadenceNote?: string;
  };
  activities: TemplateActivity[];
  mappings: TemplateFrameworkMapping[];
  /** Standard-roller for alle mappings som ikke overstyrer selv. */
  defaultRoles: ServiceRole[];
  /** Versjon — partner-kopi peker på templateId + version. */
  version: string;
}

/** Slår opp roller for én mapping — bruker mapping.roles først, ellers template.defaultRoles. */
export function getMappingRoles(
  template: Pick<ServiceTemplate, "defaultRoles">,
  mapping: Pick<TemplateFrameworkMapping, "roles">,
): ServiceRole[] {
  const roles = mapping.roles && mapping.roles.length > 0
    ? mapping.roles
    : template.defaultRoles;
  return roles ?? [];
}

/** "vurderer og dokumenterer" fra ["assessing","documenting"]. */
export function formatRoleVerbs(roles: ServiceRole[]): string {
  const verbs = roles.map((r) => ROLE_META[r].verb);
  if (verbs.length === 0) return "";
  if (verbs.length === 1) return verbs[0];
  return `${verbs.slice(0, -1).join(", ")} og ${verbs[verbs.length - 1]}`;
}

const v = "1.0.0";

// ────────────────────────────────────────────────────────────────────────────
// LAG 1 — Universelle basis-tjenester
// ────────────────────────────────────────────────────────────────────────────
const UNIVERSAL: ServiceTemplate[] = [
  {
    id: "tpl-b1-gdpr-startup",
    code: "B1",
    name: "GDPR-startkartlegging",
    shortDescription:
      "Strukturert kartlegging av kundens GDPR-situasjon via Mynders spørreskjema-mal. Resultat: TP med innhold, synlig score og gap-analyse.",
    tier: "universal",
    delivery: "one-off",
    partnerType: "all",
    scopes: ["EU"],
    recommendedPrice: { min: 9900, max: 19900, model: "fixed" },
    estimatedHours: { min: 4, max: 8 },
    activities: [
      { label: "Send Mynders kartleggings-spørreskjema til kunden", hours: 0.5 },
      { label: "Gjennomgang av svar med kunden", hours: 1.5 },
      { label: "Utfylling av TP-kontrollpunkter basert på svar", hours: 2 },
      { label: "Lever rapport med gap-analyse", hours: 1 },
    ],
    mappings: [
      { frameworkId: "gdpr", frameworkLabel: "GDPR", controlIds: ["Art.5", "Art.6", "Art.13", "Art.30"] },
      { frameworkId: "iso27701", frameworkLabel: "ISO 27701", controlIds: ["utvalg"] },
    ],
    defaultRoles: ['assessing', 'documenting'],
    version: v,
  },
  {
    id: "tpl-b2-questionnaire-once",
    code: "B2",
    name: "Sikkerhetsspørreskjema-besvarelse (engangs)",
    shortDescription:
      "Partner mottar et innkommende sikkerhetsspørreskjema, fyller ut basert på kundens TP-data med Lara-forslag, returnerer ferdig utfylt skjema.",
    tier: "universal",
    delivery: "one-off",
    partnerType: "all",
    scopes: ["global"],
    recommendedPrice: { min: 4900, max: 4900, model: "per-questionnaire" },
    estimatedHours: { min: 3, max: 4 },
    activities: [
      { label: "Motta og analysere skjema", hours: 0.5 },
      { label: "Lara foreslår svar basert på TP-data (auto)" },
      { label: "Partner kvalitetssikrer og justerer", hours: 2 },
      { label: "Sender ferdig utfylt skjema", hours: 0.5 },
    ],
    mappings: [
      { frameworkId: "iso27001", frameworkLabel: "ISO 27001", controlIds: ["varierer"] },
      { frameworkId: "gdpr", frameworkLabel: "GDPR", controlIds: ["Art.32"] },
    ],
    defaultRoles: ['documenting'],
    version: v,
  },
  {
    id: "tpl-b3-questionnaire-retainer",
    code: "B3",
    name: "Spørreskjema-beredskap (løpende)",
    shortDescription:
      "Partner håndterer alle innkommende sikkerhetsspørreskjemaer som løpende tjeneste — forutsigbart, ingen overraskelser i kundens salgsprosesser.",
    tier: "universal",
    delivery: "recurring",
    partnerType: "all",
    scopes: ["global"],
    recommendedPrice: { min: 1990, max: 1990, model: "monthly" },
    estimatedHours: { min: 1, max: 3, cadenceNote: "per mnd, inntil 5 skjemaer/år inkludert" },
    activities: [
      { label: "Motta og håndtere skjemaer fortløpende" },
      { label: "Kvartalsvis statusmøte med kunden", hours: 1 },
      { label: "Oppdatering av TP-grunnlag (løpende)" },
    ],
    mappings: [
      { frameworkId: "iso27001", frameworkLabel: "ISO 27001", controlIds: ["varierer"] },
      { frameworkId: "gdpr", frameworkLabel: "GDPR", controlIds: ["Art.32"] },
    ],
    defaultRoles: ['documenting'],
    version: v,
  },
];

// ────────────────────────────────────────────────────────────────────────────
// LAG 2A — MSP-tjenester
// ────────────────────────────────────────────────────────────────────────────
const MSP: ServiceTemplate[] = [
  {
    id: "tpl-msp1-gdpr-action",
    code: "MSP1",
    name: "GDPR-handlingsplan",
    shortDescription:
      "Etterfølger til GDPR-startkartlegging. Konkret plan for å lukke avdekkede gaps med tidsfrister og ansvar.",
    tier: "msp", delivery: "one-off", partnerType: "msp", scopes: ["EU"],
    recommendedPrice: { min: 14900, max: 24900, model: "fixed" },
    estimatedHours: { min: 12, max: 18 },
    activities: [
      { label: "Detaljert gjennomgang av gap-analyse", hours: 3 },
      { label: "Workshop med daglig leder", hours: 3 },
      { label: "Utarbeide handlingsplan med frister", hours: 4 },
      { label: "Lever og presenter", hours: 2 },
    ],
    mappings: [
      { frameworkId: "gdpr", frameworkLabel: "GDPR", controlIds: ["Art.5", "Art.6", "Art.13", "Art.32", "Art.33", "Art.34"] },
      { frameworkId: "iso27001", frameworkLabel: "ISO 27001", controlIds: ["utvalg"] },
    ],
    defaultRoles: ['assessing', 'documenting'],
    version: v,
  },
  {
    id: "tpl-msp2-privacy-notice",
    code: "MSP2",
    name: "Personvernerklæring og samtykkeløsning",
    shortDescription:
      "Lag eller oppgrader personvernerklæring på kundens nettside og etabler samtykkeløsning for cookies og nyhetsbrev.",
    tier: "msp", delivery: "one-off", partnerType: "msp", scopes: ["EU"],
    recommendedPrice: { min: 7900, max: 7900, model: "fixed" },
    estimatedHours: { min: 6, max: 8 },
    activities: [
      { label: "Kartlegge eksisterende informasjon og samtykker", hours: 1 },
      { label: "Skrive personvernerklæring", hours: 3 },
      { label: "Implementere samtykkeløsning", hours: 3 },
      { label: "Test og lever", hours: 1 },
    ],
    mappings: [
      { frameworkId: "gdpr", frameworkLabel: "GDPR", controlIds: ["Art.7", "Art.12", "Art.13"] },
    ],
    defaultRoles: ['direct', 'documenting'],
    version: v,
  },
  {
    id: "tpl-msp3-dpa-review",
    code: "MSP3",
    name: "DPA-gjennomgang",
    shortDescription:
      "Gjennomgå og oppgradere kundens databehandleravtaler med deres leverandører.",
    tier: "msp", delivery: "one-off", partnerType: "msp", scopes: ["EU"],
    recommendedPrice: { min: 9900, max: 9900, model: "fixed" },
    estimatedHours: { min: 6, max: 10 },
    activities: [
      { label: "Kartlegge leverandører som behandler personopplysninger", hours: 2 },
      { label: "Gjennomgå eksisterende DPA-er", hours: 4 },
      { label: "Utarbeide forslag til oppdaterte avtaler", hours: 3 },
      { label: "Lever rapport og anbefalinger", hours: 1 },
    ],
    mappings: [
      { frameworkId: "gdpr", frameworkLabel: "GDPR", controlIds: ["Art.28"] },
    ],
    defaultRoles: ['assessing', 'documenting'],
    version: v,
  },
  {
    id: "tpl-msp4-vdpo",
    code: "MSP4",
    name: "vDPO (virtuelt personvernombud)",
    shortDescription: "Fast personvern-rådgivning som månedlig retainer.",
    tier: "msp", delivery: "recurring", partnerType: "msp", scopes: ["EU"],
    recommendedPrice: { min: 4900, max: 4900, model: "monthly" },
    estimatedHours: { min: 4, max: 4, cadenceNote: "per mnd" },
    activities: [
      { label: "Månedlig statusmøte", hours: 1 },
      { label: "Håndtering av forespørsler og hendelser" },
      { label: "Oppdatering av TP og dokumentasjon", hours: 1 },
      { label: "Beredskap og rådgivning", hours: 2 },
    ],
    mappings: [
      { frameworkId: "gdpr", frameworkLabel: "GDPR", controlIds: ["helhetlig", "Art.37"] },
    ],
    defaultRoles: ['enabling', 'documenting'],
    version: v,
  },
  {
    id: "tpl-msp5-incident-plan",
    code: "MSP5",
    name: "Hendelseshåndteringsplan",
    shortDescription:
      "Lag planer for håndtering av sikkerhetshendelser, brudd og varsling til tilsyn og berørte.",
    tier: "msp", delivery: "one-off", partnerType: "msp", scopes: ["EU"],
    recommendedPrice: { min: 12900, max: 12900, model: "fixed" },
    estimatedHours: { min: 8, max: 12 },
    activities: [
      { label: "Risikovurdering og scenario-analyse", hours: 3 },
      { label: "Lage hendelseshåndteringsplan", hours: 4 },
      { label: "Utarbeide kommunikasjonsmaler", hours: 2 },
      { label: "Tabletop-øvelse med kunden", hours: 3 },
    ],
    mappings: [
      { frameworkId: "gdpr", frameworkLabel: "GDPR", controlIds: ["Art.33", "Art.34"] },
      { frameworkId: "iso27001", frameworkLabel: "ISO 27001", controlIds: ["A.5.24"] },
      { frameworkId: "nis2", frameworkLabel: "NIS2", controlIds: ["Art.23"] },
    ],
    defaultRoles: ['enabling', 'documenting'],
    version: v,
  },
  {
    id: "tpl-msp6-awareness",
    code: "MSP6",
    name: "Awareness-program",
    shortDescription:
      "Sikkerhetsopplæring av ansatte med Mynder-integrasjon. E-læring, phishing-simulering, rapportering.",
    tier: "msp", delivery: "recurring", partnerType: "msp", scopes: ["global"],
    recommendedPrice: { min: 2900, max: 19900, model: "monthly" },
    estimatedHours: { min: 4, max: 16, cadenceNote: "16 t setup eller 4 t/mnd" },
    activities: [
      { label: "Kartlegge nåværende opplæring", hours: 2 },
      { label: "Sette opp Mynder-integrasjon for awareness-plattform", hours: 4 },
      { label: "Lansere første kampanje", hours: 3 },
      { label: "Månedlig phishing-simulering og rapportering", hours: 4 },
    ],
    mappings: [
      { frameworkId: "iso27001", frameworkLabel: "ISO 27001", controlIds: ["A.6.3"] },
      { frameworkId: "nis2", frameworkLabel: "NIS2", controlIds: ["Art.21"] },
    ],
    defaultRoles: ['direct'],
    version: v,
  },
  {
    id: "tpl-msp7-transparency-no",
    code: "MSP7",
    name: "Åpenhetsloven-rapportering",
    shortDescription:
      "Aktsomhetsvurdering og rapportering iht. Åpenhetsloven for kunder med 50+ ansatte eller over omsetningsterskler.",
    tier: "msp", delivery: "one-off", partnerType: "msp", scopes: ["NO"],
    recommendedPrice: { min: 12900, max: 12900, model: "fixed" },
    estimatedHours: { min: 8, max: 8 },
    activities: [
      { label: "Vurdere om kunden er omfattet", hours: 1 },
      { label: "Kartlegge leverandørkjede", hours: 3 },
      { label: "Utarbeide aktsomhetsvurdering", hours: 3 },
      { label: "Skrive offentlig rapport", hours: 1 },
    ],
    mappings: [
      { frameworkId: "transparency", frameworkLabel: "Åpenhetsloven", controlIds: ["§4", "§5", "§6"] },
    ],
    defaultRoles: ['assessing', 'documenting'],
    version: v,
  },
];

// ────────────────────────────────────────────────────────────────────────────
// LAG 2B — MSSP-tjenester
// ────────────────────────────────────────────────────────────────────────────
const MSSP: ServiceTemplate[] = [
  {
    id: "tpl-mssp1-iso-prep",
    code: "MSSP1",
    name: "ISO 27001-forarbeid",
    shortDescription:
      "Forberedelse mot ISO 27001-sertifisering. Gap-analyse mot alle Annex A-kontroller, handlingsplan, ressursestimat.",
    tier: "mssp", delivery: "one-off", partnerType: "mssp", scopes: ["global"],
    recommendedPrice: { min: 49000, max: 49000, model: "fixed" },
    estimatedHours: { min: 40, max: 40 },
    activities: [
      { label: "Kartlegging av eksisterende sikkerhetsarbeid", hours: 8 },
      { label: "Gap-analyse mot Annex A", hours: 16 },
      { label: "Workshop med ledelse", hours: 4 },
      { label: "Lever rapport og handlingsplan", hours: 8 },
      { label: "Tilbud om sertifiseringsløp som neste steg", hours: 4 },
    ],
    mappings: [
      { frameworkId: "iso27001", frameworkLabel: "ISO 27001", controlIds: ["alle Annex A"] },
    ],
    defaultRoles: ['assessing'],
    version: v,
  },
  {
    id: "tpl-mssp2-iso-full",
    code: "MSSP2",
    name: "ISO 27001-sertifiseringsløp (full)",
    shortDescription:
      "Hele løpet fra start til oppnådd ISO 27001-sertifisering, inkludert intern revisjon. 6–12 måneder.",
    tier: "mssp", delivery: "one-off", partnerType: "mssp", scopes: ["global"],
    recommendedPrice: { min: 280000, max: 450000, model: "quote" },
    estimatedHours: { min: 200, max: 300, cadenceNote: "over 6–12 mnd" },
    activities: [
      { label: "ISMS-etablering", hours: 40 },
      { label: "Risikohåndtering", hours: 32 },
      { label: "Policy- og dokumentasjonsutvikling", hours: 60 },
      { label: "Implementering av kontroller", hours: 60 },
      { label: "Intern revisjon", hours: 24 },
      { label: "Forberedelse mot ekstern revisjon", hours: 24 },
      { label: "Oppfølging og avvik", hours: 20 },
    ],
    mappings: [
      { frameworkId: "iso27001", frameworkLabel: "ISO 27001", controlIds: ["helhetlig"] },
    ],
    defaultRoles: ['direct', 'enabling', 'documenting'],
    version: v,
  },
  {
    id: "tpl-mssp3-nis2",
    code: "MSSP3",
    name: "NIS2-implementering",
    shortDescription:
      "Komplett NIS2-implementering for omfattede virksomheter. Cybersäkerhetslag for svenske kunder.",
    tier: "mssp", delivery: "one-off", partnerType: "mssp", scopes: ["EU", "SE"],
    industries: ["critical-infrastructure"],
    recommendedPrice: { min: 180000, max: 280000, model: "quote" },
    estimatedHours: { min: 120, max: 200 },
    activities: [
      { label: "Styringsforankring og rolleavklaring", hours: 16 },
      { label: "Risikohåndteringsrammeverk", hours: 24 },
      { label: "Implementering av tekniske og organisatoriske tiltak", hours: 60 },
      { label: "Hendelseshåndterings- og rapporteringssystem", hours: 20 },
      { label: "Ledelsesgodkjenning og opplæring", hours: 10 },
    ],
    mappings: [
      { frameworkId: "nis2", frameworkLabel: "NIS2", controlIds: ["Art.20", "Art.21", "Art.22", "Art.23"] },
    ],
    defaultRoles: ['direct', 'enabling', 'documenting'],
    version: v,
  },
  {
    id: "tpl-mssp4-vciso",
    code: "MSSP4",
    name: "vCISO (virtuell sikkerhetssjef)",
    shortDescription: "Strategisk sikkerhetsrådgivning på CISO-nivå som fast retainer.",
    tier: "mssp", delivery: "recurring", partnerType: "mssp", scopes: ["global"],
    recommendedPrice: { min: 14900, max: 14900, model: "monthly" },
    estimatedHours: { min: 8, max: 8, cadenceNote: "per mnd" },
    activities: [
      { label: "Månedlig styringsmøte med ledelse", hours: 2 },
      { label: "Risikovurdering og oppdatering av plan", hours: 2 },
      { label: "Rådgivning ved beslutninger", hours: 2 },
      { label: "Beredskap og kommunikasjon", hours: 2 },
    ],
    mappings: [
      { frameworkId: "iso27001", frameworkLabel: "ISO 27001", controlIds: ["A.5.4"] },
      { frameworkId: "nis2", frameworkLabel: "NIS2", controlIds: ["Art.20"] },
      { frameworkId: "gdpr", frameworkLabel: "GDPR", controlIds: ["Art.24"] },
    ],
    defaultRoles: ['enabling'],
    version: v,
  },
  {
    id: "tpl-mssp5-pentest",
    code: "MSSP5",
    name: "Penetrasjonstest knyttet til kontrollpunkter",
    shortDescription:
      "Teknisk test som dokumenterer faktisk sikkerhet. Resultatet oppdaterer KP-status i kundens TP med evidens.",
    tier: "mssp", delivery: "one-off", partnerType: "mssp", scopes: ["global"],
    recommendedPrice: { min: 60000, max: 120000, model: "quote" },
    estimatedHours: { min: 40, max: 80 },
    activities: [
      { label: "Scope-avklaring og kontrakt", hours: 4 },
      { label: "Rekognosering og sårbarhetsskanning", hours: 12 },
      { label: "Manuell utnytting og verifikasjon", hours: 16 },
      { label: "Rapportskriving med funn og anbefalinger", hours: 8 },
      { label: "Presentasjon for kunde", hours: 4 },
    ],
    mappings: [
      { frameworkId: "iso27001", frameworkLabel: "ISO 27001", controlIds: ["A.5.7", "A.8.8"] },
      { frameworkId: "nis2", frameworkLabel: "NIS2", controlIds: ["Art.21"] },
    ],
    defaultRoles: ['assessing', 'documenting'],
    version: v,
  },
  {
    id: "tpl-mssp6-risk",
    code: "MSSP6",
    name: "Risikovurdering (omfattende)",
    shortDescription:
      "Strukturert risikoanalyse med konsekvensvurdering og tiltak. Grunnlag for ISO 27001 eller selvstendig leveranse.",
    tier: "mssp", delivery: "one-off", partnerType: "mssp", scopes: ["global"],
    recommendedPrice: { min: 49000, max: 49000, model: "fixed" },
    estimatedHours: { min: 32, max: 32 },
    activities: [
      { label: "Verdivurdering av eiendeler", hours: 6 },
      { label: "Trussel- og sårbarhetskartlegging", hours: 8 },
      { label: "Risikoanalyse og scoring", hours: 8 },
      { label: "Anbefalte tiltak", hours: 6 },
      { label: "Lever rapport", hours: 4 },
    ],
    mappings: [
      { frameworkId: "iso27001", frameworkLabel: "ISO 27001", controlIds: ["A.5.4"] },
    ],
    defaultRoles: ['assessing', 'documenting'],
    version: v,
  },
  {
    id: "tpl-mssp7-soc2",
    code: "MSSP7",
    name: "SOC 2 Type II-forberedelse",
    shortDescription:
      "Forberedelse mot SOC 2-revisjon for selskaper med amerikanske kunder.",
    tier: "mssp", delivery: "one-off", partnerType: "mssp", scopes: ["US", "global"],
    recommendedPrice: { min: 150000, max: 220000, model: "quote" },
    estimatedHours: { min: 100, max: 150 },
    activities: [
      { label: "Scope og criteria-valg", hours: 8 },
      { label: "Kontroll-mapping og gap-analyse", hours: 24 },
      { label: "Implementering av manglende kontroller", hours: 40 },
      { label: "Dokumentasjon og evidens", hours: 20 },
      { label: "Forberedelse mot ekstern revisor", hours: 8 },
    ],
    mappings: [
      { frameworkId: "soc2", frameworkLabel: "SOC 2", controlIds: ["Trust Service Criteria"] },
      { frameworkId: "iso27001", frameworkLabel: "ISO 27001", controlIds: ["overlapp"] },
    ],
    defaultRoles: ['enabling', 'documenting'],
    version: v,
  },
  {
    id: "tpl-mssp8-ai-act",
    code: "MSSP8",
    name: "AI Act-kartlegging",
    shortDescription:
      "Kartlegg AI-bruk, klassifiser risikonivå, etabler governance.",
    tier: "mssp", delivery: "one-off", partnerType: "mssp", scopes: ["EU"],
    recommendedPrice: { min: 39000, max: 39000, model: "fixed" },
    estimatedHours: { min: 24, max: 24 },
    activities: [
      { label: "Kartlegging av eksisterende AI-systemer", hours: 6 },
      { label: "Risikoklassifisering iht. AI Act", hours: 6 },
      { label: "Etablere governance-rammeverk", hours: 8 },
      { label: "Lever rapport og handlingsplan", hours: 4 },
    ],
    mappings: [
      { frameworkId: "aiact", frameworkLabel: "AI Act", controlIds: ["risikoklassifisering"] },
      { frameworkId: "iso42001", frameworkLabel: "ISO 42001", controlIds: ["utvalg"] },
    ],
    defaultRoles: ['assessing', 'enabling'],
    version: v,
  },
  {
    id: "tpl-mssp9-dora",
    code: "MSSP9",
    name: "DORA-rådgivning",
    shortDescription:
      "Implementering av DORA for finansielle institusjoner. CPS 234 for australske finanskunder.",
    tier: "mssp", delivery: "one-off", partnerType: "mssp", scopes: ["EU", "AU"],
    industries: ["finance"],
    recommendedPrice: { min: 89000, max: 160000, model: "quote" },
    estimatedHours: { min: 60, max: 100 },
    activities: [
      { label: "Scope-avklaring og styringsforankring", hours: 8 },
      { label: "ICT-risikohåndteringsrammeverk", hours: 24 },
      { label: "Hendelseshåndtering og rapportering", hours: 16 },
      { label: "Tredjepartsstyring", hours: 16 },
      { label: "Resiliensplaner og testing", hours: 16 },
      { label: "Dokumentasjon og lever", hours: 12 },
    ],
    mappings: [
      { frameworkId: "dora", frameworkLabel: "DORA", controlIds: ["Art.5", "Art.8", "Art.25"] },
      { frameworkId: "cps234", frameworkLabel: "CPS 234 (AU)", controlIds: ["helhetlig"] },
    ],
    defaultRoles: ['direct', 'enabling', 'documenting'],
    version: v,
  },
];

// ────────────────────────────────────────────────────────────────────────────
// LAG 3 — Land- og bransje-spesifikke (vises som "Anbefalt for deg")
// ────────────────────────────────────────────────────────────────────────────
const REGIONAL: ServiceTemplate[] = [
  // ── Norge ──
  {
    id: "tpl-no1-normen",
    code: "NO1",
    name: "Normen v7.0-vurdering",
    shortDescription: "Vurdering mot Normen for helse- og omsorgssektoren.",
    tier: "regional", delivery: "one-off", partnerType: "all", scopes: ["NO"],
    industries: ["healthcare"],
    recommendedPrice: { min: 19900, max: 29900, model: "fixed" },
    estimatedHours: { min: 16, max: 16 },
    activities: [
      { label: "Kartlegge eksisterende sikkerhetstiltak", hours: 4 },
      { label: "Vurdering mot Normens kontrollpunkter", hours: 8 },
      { label: "Lever rapport med gap og tiltak", hours: 4 },
    ],
    mappings: [{ frameworkId: "normen", frameworkLabel: "Normen v7.0", controlIds: ["helhetlig"] }],
    defaultRoles: ['assessing', 'documenting'],
    version: v,
  },
  {
    id: "tpl-no2-nsm",
    code: "NO2",
    name: "NSM grunnprinsipper for IKT-sikkerhet",
    shortDescription: "For offentlig sektor og leverandører som må følge NSMs grunnprinsipper.",
    tier: "regional", delivery: "one-off", partnerType: "all", scopes: ["NO"],
    industries: ["public"],
    recommendedPrice: { min: 24900, max: 39900, model: "fixed" },
    estimatedHours: { min: 16, max: 24 },
    activities: [
      { label: "Kartlegge mot NSMs prinsipper", hours: 8 },
      { label: "Tiltaksplan og prioritering", hours: 6 },
      { label: "Rapport og presentasjon", hours: 4 },
    ],
    mappings: [{ frameworkId: "nsm", frameworkLabel: "NSM grunnprinsipper", controlIds: ["4 prinsipper"] }],
    defaultRoles: ['assessing', 'documenting'],
    version: v,
  },
  {
    id: "tpl-no3-sikkerhetsloven",
    code: "NO3",
    name: "Sikkerhetslov-vurdering",
    shortDescription: "For skjermingsverdig virksomhet underlagt sikkerhetsloven.",
    tier: "regional", delivery: "one-off", partnerType: "mssp", scopes: ["NO"],
    industries: ["critical-infrastructure", "public"],
    recommendedPrice: { min: 49000, max: 89000, model: "quote" },
    estimatedHours: { min: 32, max: 60 },
    activities: [
      { label: "Verdivurdering og skjermingsverdivurdering", hours: 12 },
      { label: "Sikkerhetstiltak iht. sikkerhetsloven", hours: 16 },
      { label: "Lever rapport og handlingsplan", hours: 8 },
    ],
    mappings: [{ frameworkId: "sikkerhetsloven", frameworkLabel: "Sikkerhetsloven", controlIds: ["helhetlig"] }],
    defaultRoles: ['assessing', 'documenting'],
    version: v,
  },

  // ── Sverige ──
  {
    id: "tpl-se1-patientdata",
    code: "SE1",
    name: "Patientdatalagen-vurdering",
    shortDescription: "Vurdering mot svensk Patientdatalagen for helsesektoren.",
    tier: "regional", delivery: "one-off", partnerType: "all", scopes: ["SE"],
    industries: ["healthcare"],
    recommendedPrice: { min: 19900, max: 29900, model: "fixed" },
    estimatedHours: { min: 16, max: 16 },
    activities: [
      { label: "Kartlegg behandling av patientdata", hours: 6 },
      { label: "Vurdering mot Patientdatalagen", hours: 6 },
      { label: "Lever rapport", hours: 4 },
    ],
    mappings: [{ frameworkId: "patientdatalagen", frameworkLabel: "Patientdatalagen", controlIds: ["helhetlig"] }],
    defaultRoles: ['assessing', 'documenting'],
    version: v,
  },
  {
    id: "tpl-se2-sakerhetsskydd",
    code: "SE2",
    name: "Säkerhetsskyddslag-vurdering",
    shortDescription: "For sikkerhetskritisk virksomhet i Sverige.",
    tier: "regional", delivery: "one-off", partnerType: "mssp", scopes: ["SE"],
    industries: ["critical-infrastructure"],
    recommendedPrice: { min: 49000, max: 89000, model: "quote" },
    estimatedHours: { min: 32, max: 60 },
    activities: [
      { label: "Säkerhetsskyddsanalys", hours: 16 },
      { label: "Tiltaksplan", hours: 12 },
      { label: "Lever rapport", hours: 8 },
    ],
    mappings: [{ frameworkId: "sakerhetsskydd", frameworkLabel: "Säkerhetsskyddslag", controlIds: ["helhetlig"] }],
    defaultRoles: ['assessing', 'documenting'],
    version: v,
  },
  {
    id: "tpl-se3-fffs",
    code: "SE3",
    name: "FFFS 2024:20-implementering",
    shortDescription: "For finanssektoren i Sverige (når støtte er på plass).",
    tier: "regional", delivery: "one-off", partnerType: "mssp", scopes: ["SE"],
    industries: ["finance"],
    recommendedPrice: { min: 89000, max: 160000, model: "quote" },
    estimatedHours: { min: 60, max: 100 },
    activities: [
      { label: "Gap-analyse mot FFFS 2024:20", hours: 24 },
      { label: "Implementering av krav", hours: 40 },
      { label: "Dokumentasjon og rapport", hours: 16 },
    ],
    mappings: [{ frameworkId: "fffs", frameworkLabel: "FFFS 2024:20", controlIds: ["helhetlig"] }],
    defaultRoles: ['direct', 'documenting'],
    version: v,
  },

  // ── Nederland ──
  {
    id: "tpl-nl1-bio2",
    code: "NL1",
    name: "BIO2-rammeverk",
    shortDescription: "Baseline Informatiebeveiliging Overheid for nederlandsk offentlig sektor.",
    tier: "regional", delivery: "one-off", partnerType: "mssp", scopes: ["NL"],
    industries: ["public"],
    recommendedPrice: { min: 49000, max: 89000, model: "quote" },
    estimatedHours: { min: 32, max: 60 },
    activities: [
      { label: "Gap-analyse mot BIO2", hours: 16 },
      { label: "Tiltaksplan", hours: 12 },
      { label: "Lever rapport", hours: 8 },
    ],
    mappings: [{ frameworkId: "bio2", frameworkLabel: "BIO2", controlIds: ["helhetlig"] }],
    defaultRoles: ['assessing', 'documenting'],
    version: v,
  },
  {
    id: "tpl-nl2-nen7510",
    code: "NL2",
    name: "NEN 7510-vurdering",
    shortDescription: "Nederlandsk standard for informasjonssikkerhet i helsesektoren.",
    tier: "regional", delivery: "one-off", partnerType: "all", scopes: ["NL"],
    industries: ["healthcare"],
    recommendedPrice: { min: 24900, max: 39900, model: "fixed" },
    estimatedHours: { min: 16, max: 24 },
    activities: [
      { label: "Vurdering mot NEN 7510", hours: 12 },
      { label: "Tiltaksplan", hours: 6 },
      { label: "Lever rapport", hours: 4 },
    ],
    mappings: [{ frameworkId: "nen7510", frameworkLabel: "NEN 7510", controlIds: ["helhetlig"] }],
    defaultRoles: ['assessing', 'documenting'],
    version: v,
  },
  {
    id: "tpl-nl3-wwft",
    code: "NL3",
    name: "Wwft-veiledning",
    shortDescription: "AML-rådgivning for finanssektoren i Nederland.",
    tier: "regional", delivery: "one-off", partnerType: "mssp", scopes: ["NL"],
    industries: ["finance"],
    recommendedPrice: { min: 39000, max: 79000, model: "quote" },
    estimatedHours: { min: 24, max: 48 },
    activities: [
      { label: "AML-risikovurdering", hours: 12 },
      { label: "Kundeavklaringsprosesser (KYC)", hours: 12 },
      { label: "Rapportering og dokumentasjon", hours: 8 },
    ],
    mappings: [{ frameworkId: "wwft", frameworkLabel: "Wwft", controlIds: ["helhetlig"] }],
    defaultRoles: ['enabling', 'documenting'],
    version: v,
  },

  // ── Australia ──
  {
    id: "tpl-au1-privacy-apps",
    code: "AU1",
    name: "Privacy Act 1988 + APPs-kartlegging",
    shortDescription: "GDPR-ekvivalent for australske kunder (Australian Privacy Principles).",
    tier: "regional", delivery: "one-off", partnerType: "all", scopes: ["AU"],
    recommendedPrice: { min: 9900, max: 19900, model: "fixed" },
    estimatedHours: { min: 8, max: 16 },
    activities: [
      { label: "Kartlegge mot 13 APPs", hours: 6 },
      { label: "Gap-analyse", hours: 4 },
      { label: "Lever rapport", hours: 2 },
    ],
    mappings: [{ frameworkId: "privacy-act-au", frameworkLabel: "Privacy Act 1988 / APPs", controlIds: ["APP 1–13"] }],
    defaultRoles: ['assessing', 'documenting'],
    version: v,
  },
  {
    id: "tpl-au2-essential8",
    code: "AU2",
    name: "Essential Eight modenhetsvurdering",
    shortDescription: "ASD Essential Eight — sikkerhetsstandard for AU.",
    tier: "regional", delivery: "one-off", partnerType: "mssp", scopes: ["AU"],
    recommendedPrice: { min: 24900, max: 49000, model: "fixed" },
    estimatedHours: { min: 16, max: 32 },
    activities: [
      { label: "Vurdering av modenhet for hvert tiltak", hours: 12 },
      { label: "Tiltaksplan mot Maturity Level 2/3", hours: 8 },
      { label: "Lever rapport", hours: 4 },
    ],
    mappings: [{ frameworkId: "essential8", frameworkLabel: "Essential Eight", controlIds: ["8 tiltak"] }],
    defaultRoles: ['assessing', 'documenting'],
    version: v,
  },
  {
    id: "tpl-au3-soci",
    code: "AU3",
    name: "SOCI Act-vurdering",
    shortDescription: "Security of Critical Infrastructure Act-vurdering.",
    tier: "regional", delivery: "one-off", partnerType: "mssp", scopes: ["AU"],
    industries: ["critical-infrastructure"],
    recommendedPrice: { min: 49000, max: 120000, model: "quote" },
    estimatedHours: { min: 40, max: 80 },
    activities: [
      { label: "Sektoranalyse og scope", hours: 12 },
      { label: "Risikovurdering iht. SOCI", hours: 20 },
      { label: "Implementering og rapportering", hours: 16 },
    ],
    mappings: [{ frameworkId: "soci", frameworkLabel: "SOCI Act", controlIds: ["helhetlig"] }],
    defaultRoles: ['assessing', 'documenting'],
    version: v,
  },
  {
    id: "tpl-au4-cps234",
    code: "AU4",
    name: "CPS 234-rådgivning",
    shortDescription: "APRA Prudential Standard CPS 234 for finanssektoren i AU.",
    tier: "regional", delivery: "one-off", partnerType: "mssp", scopes: ["AU"],
    industries: ["finance"],
    recommendedPrice: { min: 49000, max: 99000, model: "quote" },
    estimatedHours: { min: 32, max: 64 },
    activities: [
      { label: "Vurdering mot CPS 234", hours: 16 },
      { label: "Implementering av krav", hours: 24 },
      { label: "Rapport og evidens", hours: 8 },
    ],
    mappings: [{ frameworkId: "cps234", frameworkLabel: "CPS 234", controlIds: ["helhetlig"] }],
    defaultRoles: ['assessing', 'documenting'],
    version: v,
  },
  {
    id: "tpl-au5-modern-slavery",
    code: "AU5",
    name: "Modern Slavery Act-rapportering",
    shortDescription: "Åpenhetslov-ekvivalent for AU. Aktsomhetsvurdering av leverandørkjeden.",
    tier: "regional", delivery: "one-off", partnerType: "all", scopes: ["AU"],
    recommendedPrice: { min: 19900, max: 39900, model: "fixed" },
    estimatedHours: { min: 12, max: 24 },
    activities: [
      { label: "Kartlegge leverandørkjede", hours: 6 },
      { label: "Aktsomhetsvurdering", hours: 6 },
      { label: "Skrive Modern Slavery Statement", hours: 4 },
    ],
    mappings: [{ frameworkId: "modern-slavery-au", frameworkLabel: "Modern Slavery Act (AU)", controlIds: ["helhetlig"] }],
    defaultRoles: ['assessing', 'documenting'],
    version: v,
  },
];

export const SERVICE_LIBRARY: ServiceTemplate[] = [
  ...UNIVERSAL,
  ...MSP,
  ...MSSP,
  ...REGIONAL,
];

// ────────────────────────────────────────────────────────────────────────────
// Lara-kuratering — sorterer biblioteket basert på partner-kontekst.
// ────────────────────────────────────────────────────────────────────────────

export interface PartnerContext {
  /** Partnerens primærtype. */
  partnerType?: ServicePartnerType;
  /** Antall kunder per bransje (signal for relevans). */
  industryMix?: Partial<Record<ServiceIndustry, number>>;
  /** Aktive jurisdiksjoner i kundeporteføljen. */
  activeScopes?: ServiceScope[];
  /** Regelverk som har mange åpne KP hos kunder — boost tjenester som dekker disse. */
  openFrameworkIds?: string[];
}

export interface RankedTemplate {
  template: ServiceTemplate;
  score: number;
  reasons: string[];
}

export function curateServiceLibrary(
  ctx: PartnerContext,
  templates: ServiceTemplate[] = SERVICE_LIBRARY,
): RankedTemplate[] {
  return templates
    .map((template) => {
      let score = 0;
      const reasons: string[] = [];

      // Partnertype match
      if (ctx.partnerType && ctx.partnerType !== "all") {
        if (template.partnerType === ctx.partnerType) {
          score += 30;
          reasons.push(`Tilpasset ${ctx.partnerType.toUpperCase()}`);
        } else if (template.partnerType === "all") {
          score += 10;
        } else {
          score -= 15;
        }
      } else {
        score += 5;
      }

      // Scope-match
      if (ctx.activeScopes?.length) {
        const overlap = template.scopes.filter((s) => ctx.activeScopes!.includes(s));
        if (overlap.length > 0) {
          score += overlap.length * 12;
          reasons.push(`Relevant for ${overlap.join(", ")}`);
        } else if (!template.scopes.includes("global")) {
          score -= 8;
        }
      }

      // Industri-match
      if (ctx.industryMix && template.industries) {
        const matches = template.industries.filter((i) => (ctx.industryMix![i] ?? 0) > 0);
        if (matches.length > 0) {
          const customers = matches.reduce((acc, i) => acc + (ctx.industryMix![i] ?? 0), 0);
          score += customers * 8;
          reasons.push(`${customers} kunde(r) i ${matches.join(", ")}`);
        }
      }

      // Åpne KP-er hos kundene
      if (ctx.openFrameworkIds?.length) {
        const overlap = template.mappings.filter((m) =>
          ctx.openFrameworkIds!.includes(m.frameworkId),
        );
        if (overlap.length > 0) {
          score += overlap.length * 10;
          reasons.push(`Dekker åpne KP i ${overlap.map((m) => m.frameworkLabel).join(", ")}`);
        }
      }

      // Lag 1 universelle baseline-boost
      if (template.tier === "universal") score += 5;

      return { template, score, reasons };
    })
    .sort((a, b) => b.score - a.score);
}

export function tierLabel(tier: ServiceTier): string {
  switch (tier) {
    case "universal": return "Universell basis";
    case "msp": return "MSP-tjenester";
    case "mssp": return "MSSP-tjenester";
    case "regional": return "Land- og bransje-spesifikke";
  }
}

export function scopeLabel(scope: ServiceScope): string {
  return { global: "Global", EU: "EU", NO: "Norge", SE: "Sverige", NL: "Nederland", AU: "Australia", US: "USA" }[scope];
}

export function industryLabel(industry: ServiceIndustry): string {
  return {
    healthcare: "Helse",
    finance: "Finans",
    public: "Offentlig",
    "critical-infrastructure": "Kritisk infrastruktur",
  }[industry];
}

export function deliveryLabel(d: ServiceDelivery): string {
  return d === "one-off" ? "Engangs" : "Løpende";
}

export function formatHoursRange(h: ServiceTemplate["estimatedHours"]): string {
  const range = h.min === h.max ? `${h.min} t` : `${h.min}–${h.max} t`;
  return h.cadenceNote ? `${range} (${h.cadenceNote})` : range;
}

/**
 * Beregn estimert pris fra timer × kundens egen timepris.
 * Vi setter ALDRI fastpris på maler — partneren bruker sin egen rate.
 */
export function formatEstimatedPrice(
  h: ServiceTemplate["estimatedHours"],
  hourlyRate: number,
): string {
  const fmt = (n: number) => new Intl.NumberFormat("nb-NO").format(Math.round(n));
  const lo = h.min * hourlyRate;
  const hi = h.max * hourlyRate;
  const range = lo === hi ? `${fmt(lo)} kr` : `fra ${fmt(lo)}–${fmt(hi)} kr`;
  return h.cadenceNote ? `${range} (${h.cadenceNote})` : `${range} est.`;
}
