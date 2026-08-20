import { SARA_AGENT_VERSION } from "./saraScope";

/**
 * Scope og avvikstyper for den lokale agenten Sara når den brukes til
 * avvikskartlegging hos kunden. Kun metadata forlater kundens infrastruktur.
 */

export type SaraScopeStatus = "connected" | "out_of_scope";

export interface SaraMonitoredSystem {
  id: string;
  name: string;
  /** Hva Sara ser hos dette systemet – på metadatanivå */
  watches: string;
  status: SaraScopeStatus;
  lastRun?: string;
  /** Systemeier som avvik tildeles automatisk */
  owner?: string;
  ownerPhoneMasked?: string;
}

export interface SaraDeviationType {
  id: string;
  /** Rammeverk som gjør denne avvikstypen pålagt */
  frameworkId: string;
  frameworkLabel: string;
  requirementRef: string;
  title: string;
  titleEn: string;
  /** Frist / varslingsplikt i klartekst */
  obligation: string;
  obligationEn: string;
  /** Utløser SMS til systemeier ved kritisk alvorlighet */
  smsOnCritical: boolean;
}

export const SARA_MONITORED_SYSTEMS: SaraMonitoredSystem[] = [
  {
    id: "notion",
    name: "Notion",
    watches: "Dokumentendringer og manglende/utdaterte styrende dokumenter",
    status: "connected",
    lastRun: "I dag 09:12",
    owner: "Kari Nordmann",
    ownerPhoneMasked: "+47 ••• •• 412",
  },
  {
    id: "entra",
    name: "Microsoft Entra ID",
    watches: "Tilgangsendringer på privilegerte kontoer (kun hendelsesmetadata)",
    status: "connected",
    lastRun: "I dag 08:40",
    owner: "Ola Hansen",
    ownerPhoneMasked: "+47 ••• •• 208",
  },
  {
    id: "fileshare",
    name: "Filområde (on-prem)",
    watches: "Endring i tilgangsstyring på mapper med personopplysninger",
    status: "connected",
    lastRun: "I går 22:05",
    owner: "Ingrid Solvang",
    ownerPhoneMasked: "+47 ••• •• 771",
  },
  { id: "m365", name: "Microsoft 365", watches: "Ikke tilkoblet", status: "out_of_scope" },
  { id: "jira", name: "Jira Service Management", watches: "Ikke tilkoblet", status: "out_of_scope" },
  { id: "endpoints", name: "Endepunkter / EDR", watches: "Ikke tilkoblet", status: "out_of_scope" },
];

const ALL_DEVIATION_TYPES: SaraDeviationType[] = [
  {
    id: "gdpr-33",
    frameworkId: "gdpr",
    frameworkLabel: "GDPR",
    requirementRef: "Art. 33",
    title: "Brudd på personopplysningssikkerheten",
    titleEn: "Personal data breach",
    obligation: "Meldeplikt til Datatilsynet innen 72 timer",
    obligationEn: "Must be reported to the DPA within 72 hours",
    smsOnCritical: true,
  },
  {
    id: "gdpr-28",
    frameworkId: "gdpr",
    frameworkLabel: "GDPR",
    requirementRef: "Art. 28",
    title: "Leverandøravvik – manglende databehandleravtale",
    titleEn: "Vendor deviation – missing data processing agreement",
    obligation: "Må dokumenteres og lukkes; ingen ekstern frist",
    obligationEn: "Must be documented and closed; no external deadline",
    smsOnCritical: false,
  },
  {
    id: "nis2-23",
    frameworkId: "nis2",
    frameworkLabel: "NIS2",
    requirementRef: "Art. 23",
    title: "Hendelse i vesentlig tjeneste",
    titleEn: "Incident in an essential service",
    obligation: "Tidligvarsel innen 24 timer, rapport innen 72 timer",
    obligationEn: "Early warning within 24 hours, report within 72 hours",
    smsOnCritical: true,
  },
  {
    id: "ai-act-73",
    frameworkId: "ai-act",
    frameworkLabel: "EU AI Act",
    requirementRef: "Art. 73",
    title: "Alvorlig hendelse i AI-system",
    titleEn: "Serious incident in an AI system",
    obligation: "Meldeplikt til myndighet uten ugrunnet opphold",
    obligationEn: "Must be reported to the authority without undue delay",
    smsOnCritical: true,
  },
  {
    id: "iso27001-a5",
    frameworkId: "iso27001",
    frameworkLabel: "ISO 27001",
    requirementRef: "A.5.24 / A.5.26",
    title: "Avvik på sikkerhetskontroll",
    titleEn: "Security control deviation",
    obligation: "Skal håndteres i hendelseshåndteringsprosessen",
    obligationEn: "Handled through the incident management process",
    smsOnCritical: false,
  },
  {
    id: "iso42001-10",
    frameworkId: "iso42001",
    frameworkLabel: "ISO/IEC 42001",
    requirementRef: "Kap. 10",
    title: "Avvik i AI-styringssystemet",
    titleEn: "Nonconformity in the AI management system",
    obligation: "Skal registreres med korrigerende tiltak",
    obligationEn: "Must be recorded with corrective actions",
    smsOnCritical: false,
  },
  {
    id: "iso9001-10",
    frameworkId: "iso9001",
    frameworkLabel: "ISO 9001",
    requirementRef: "Kap. 10.2",
    title: "Avvik i kvalitetsstyringssystemet",
    titleEn: "Nonconformity in the quality management system",
    obligation: "Skal registreres med korrigerende tiltak",
    obligationEn: "Must be recorded with corrective actions",
    smsOnCritical: false,
  },
  {
    id: "normen-hendelse",
    frameworkId: "normen",
    frameworkLabel: "Normen",
    requirementRef: "Kap. 5",
    title: "Sikkerhetshendelse i helseopplysninger",
    titleEn: "Security incident involving health data",
    obligation: "Skal meldes internt og til Norsk helsenett",
    obligationEn: "Must be reported internally and to the health network",
    smsOnCritical: true,
  },
];

/** Kun avvikstyper som er pålagt av regelverk kunden faktisk har aktivert. */
export function getSaraDeviationTypes(activeFrameworkIds: string[]): SaraDeviationType[] {
  const set = new Set(activeFrameworkIds.map((f) => f.toLowerCase()));
  return ALL_DEVIATION_TYPES.filter((t) => set.has(t.frameworkId));
}

export interface SaraDeviationFinding {
  id: string;
  system: string;
  summary: string;
  requirementRef: string;
  severity: "critical" | "high" | "medium" | "low";
  owner: string;
  at: string;
  notified: boolean;
  agentVersion: string;
}

export const SARA_RECENT_DEVIATIONS: SaraDeviationFinding[] = [
  {
    id: "sd1",
    system: "Microsoft Entra ID",
    summary: "Privilegert konto uten MFA oppdaget",
    requirementRef: "GDPR Art. 32",
    severity: "critical",
    owner: "Ola Hansen",
    at: "I dag 08:41",
    notified: true,
    agentVersion: SARA_AGENT_VERSION,
  },
  {
    id: "sd2",
    system: "Filområde (on-prem)",
    summary: "Mappe med personopplysninger åpnet for alle ansatte",
    requirementRef: "GDPR Art. 32",
    severity: "high",
    owner: "Ingrid Solvang",
    at: "I går 22:07",
    notified: false,
    agentVersion: SARA_AGENT_VERSION,
  },
  {
    id: "sd3",
    system: "Notion",
    summary: "Databehandleravtale mangler for aktiv leverandør",
    requirementRef: "GDPR Art. 28",
    severity: "medium",
    owner: "Kari Nordmann",
    at: "I går 14:20",
    notified: false,
    agentVersion: SARA_AGENT_VERSION,
  },
];
