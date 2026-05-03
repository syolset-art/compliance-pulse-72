import type { ActivityType, Phase } from "./vendorActivityData";

export type GuidanceLevel = "strategisk" | "taktisk" | "operasjonelt";
export type Criticality = "kritisk" | "hoy" | "medium";
export type GapStatus = "open" | "in_progress" | "closed" | "not_relevant";

export type NextActionType = "email" | "meeting" | "task";

export interface NextActionDraft {
  /** Hva Lara foreslår å gjøre — én kort setning. */
  proposalNb: string;
  proposalEn: string;
  type: NextActionType;
  /** For e-post / møte: foreslått mottaker. */
  recipient?: string;
  /** Forhåndsutfylt emne / agenda / oppgave-tittel. */
  subjectNb?: string;
  subjectEn?: string;
  /** Forhåndsutfylt brødtekst. */
  bodyNb?: string;
  bodyEn?: string;
}

export interface SuggestedActivity {
  id: string;
  gapId: string;
  titleNb: string;
  titleEn: string;
  descriptionNb: string;
  descriptionEn: string;
  reasonNb: string;
  reasonEn: string;
  statusNoteNb: string;
  statusNoteEn: string;
  status: GapStatus;
  criticality: Criticality;
  level: GuidanceLevel;
  themeNb: string;
  themeEn: string;
  suggestedType: ActivityType;
  suggestedPhase: Phase;
  contactPerson?: string;
  /** Lara's neste konkrete handling — vises etter at aktiviteten er opprettet. */
  nextAction?: NextActionDraft;
}

export const STATUS_CONFIG: Record<GapStatus, { nb: string; en: string; badge: string; dot: string; bar: string }> = {
  open: {
    nb: "Åpent",
    en: "Open",
    badge: "bg-destructive/10 text-destructive border border-destructive/30",
    dot: "bg-destructive",
    bar: "bg-destructive",
  },
  in_progress: {
    nb: "Under oppfølging",
    en: "In progress",
    badge: "bg-warning/10 text-warning border border-warning/30",
    dot: "bg-warning",
    bar: "bg-warning",
  },
  closed: {
    nb: "Lukket",
    en: "Closed",
    badge: "bg-success/10 text-success border border-success/30",
    dot: "bg-success",
    bar: "bg-success",
  },
  not_relevant: {
    nb: "Ikke relevant",
    en: "Not relevant",
    badge: "bg-muted text-muted-foreground border border-border",
    dot: "bg-muted-foreground",
    bar: "bg-muted-foreground",
  },
};

export const LEVEL_DOT: Record<GuidanceLevel, string> = {
  operasjonelt: "bg-status-closed",
  taktisk: "bg-warning",
  strategisk: "bg-primary",
};

export interface VendorGuidance {
  summaryNb: string;
  summaryEn: string;
  suggestions: SuggestedActivity[];
}

export const CRITICALITY_CONFIG: Record<Criticality, { nb: string; en: string; badge: string }> = {
  kritisk: { nb: "Kritisk", en: "Critical", badge: "bg-destructive/15 text-destructive border border-destructive/20" },
  hoy: { nb: "Høy", en: "High", badge: "bg-warning/15 text-warning dark:text-warning border border-warning/20" },
  medium: { nb: "Medium", en: "Medium", badge: "bg-warning/15 text-warning dark:text-warning border border-warning/20" },
};

export const LEVEL_CONFIG: Record<GuidanceLevel, { nb: string; en: string }> = {
  strategisk: { nb: "Strategisk", en: "Strategic" },
  taktisk: { nb: "Taktisk", en: "Tactical" },
  operasjonelt: { nb: "Operasjonelt", en: "Operational" },
};

export const TYPE_LABEL: Record<ActivityType, { nb: string; en: string }> = {
  email: { nb: "E-post foreslått", en: "Email suggested" },
  phone: { nb: "Telefon foreslått", en: "Phone suggested" },
  meeting: { nb: "Møte foreslått", en: "Meeting suggested" },
  manual: { nb: "Manuell oppgave", en: "Manual task" },
  document: { nb: "Dokument", en: "Document" },
  risk: { nb: "Risiko", en: "Risk" },
  incident: { nb: "Hendelse", en: "Incident" },
  assignment: { nb: "Tildeling", en: "Assignment" },
  review: { nb: "Gjennomgang", en: "Review" },
  delivery: { nb: "Leveranse", en: "Delivery" },
  maturity: { nb: "Modenhet", en: "Maturity" },
  setting: { nb: "Innstilling", en: "Setting" },
  upload: { nb: "Opplasting", en: "Upload" },
  view: { nb: "Visning", en: "View" },
};

const TEMPLATES: Omit<SuggestedActivity, "id">[] = [
  {
    gapId: "gap-dpa",
    titleNb: "Følg opp databehandleravtale",
    titleEn: "Follow up on data processing agreement",
    descriptionNb: "Send forespørsel til leverandør om signert databehandleravtale (DPA) som dekker behandlingsformål, sikkerhetstiltak og underleverandører.",
    descriptionEn: "Send a request to the vendor for a signed data processing agreement (DPA) covering processing purpose, security measures and sub-processors.",
    reasonNb: "DPA ikke mottatt · påkrevd etter GDPR art. 28",
    reasonEn: "DPA not received · required by GDPR art. 28",
    statusNoteNb: "Under oppfølging siden 20.04.2026 · venter på bevis",
    statusNoteEn: "In progress since 20/04/2026 · awaiting evidence",
    status: "in_progress",
    criticality: "kritisk",
    level: "taktisk",
    themeNb: "DPA & personvern",
    themeEn: "DPA & privacy",
    suggestedType: "email",
    suggestedPhase: "onboarding",
    nextAction: {
      type: "email",
      proposalNb: "Send e-post til kontakt@leverandor.no og be om signert DPA.",
      proposalEn: "Send an email to kontakt@leverandor.no requesting a signed DPA.",
      recipient: "kontakt@leverandor.no",
      subjectNb: "Forespørsel om signert databehandleravtale",
      subjectEn: "Request for signed Data Processing Agreement",
      bodyNb: "Hei,\n\nVi gjennomgår vår leverandøroversikt og trenger en signert databehandleravtale (DPA) som dekker behandlingsformål, sikkerhetstiltak og underleverandører i tråd med GDPR art. 28.\n\nKan dere sende oss en oppdatert versjon innen 14 dager?\n\nMvh",
      bodyEn: "Hi,\n\nDuring our vendor review we need a signed Data Processing Agreement (DPA) covering processing purpose, security measures and sub-processors in line with GDPR art. 28.\n\nCould you share an updated version within 14 days?\n\nBest regards",
    },
  },
  {
    gapId: "gap-sla",
    titleNb: "Be om SLA-dokumentasjon",
    titleEn: "Request SLA documentation",
    descriptionNb: "Innhent gjeldende tjenestenivåavtale (SLA) med oppetidsgaranti, responstider og prosedyrer for hendelseshåndtering.",
    descriptionEn: "Obtain the current service level agreement (SLA) with uptime guarantee, response times and incident handling procedures.",
    reasonNb: "SLA er over 12 måneder gammel · krav om årlig revisjon",
    reasonEn: "SLA is over 12 months old · annual review required",
    statusNoteNb: "Under oppfølging siden 20.04.2026 · venter på bevis",
    statusNoteEn: "In progress since 20/04/2026 · awaiting evidence",
    status: "in_progress",
    criticality: "hoy",
    level: "operasjonelt",
    themeNb: "SLA & leveranse",
    themeEn: "SLA & delivery",
    suggestedType: "email",
    suggestedPhase: "ongoing",
    nextAction: {
      type: "email",
      proposalNb: "Send e-post og be om gjeldende SLA med oppetidsgaranti og responstider.",
      proposalEn: "Send an email requesting the current SLA with uptime guarantee and response times.",
      recipient: "kontakt@leverandor.no",
      subjectNb: "Forespørsel om oppdatert SLA",
      subjectEn: "Request for updated SLA",
      bodyNb: "Hei,\n\nKan dere sende oss gjeldende tjenestenivåavtale (SLA), inkludert oppetidsgaranti, responstider og prosedyrer for hendelseshåndtering?\n\nMvh",
      bodyEn: "Hi,\n\nCould you share the current Service Level Agreement (SLA), including uptime guarantee, response times and incident-handling procedures?\n\nBest regards",
    },
  },
  {
    gapId: "gap-risk",
    titleNb: "Gjennomfør risikovurdering",
    titleEn: "Conduct risk assessment",
    descriptionNb: "Avtal et møte med leverandørens sikkerhetskontakt for å gjennomgå risikobildet, endringer i underleverandørkjeden og kontrollnivå.",
    descriptionEn: "Schedule a meeting with the vendor's security contact to review the risk picture, sub-processor changes and control level.",
    reasonNb: "Intern vurdering forfalt 23.03.2026",
    reasonEn: "Internal assessment due 23/03/2026",
    statusNoteNb: "Intern vurdering forfalt 23.03.2026",
    statusNoteEn: "Internal assessment overdue since 23/03/2026",
    status: "open",
    criticality: "hoy",
    level: "strategisk",
    themeNb: "Revisjon & kontroll",
    themeEn: "Audit & control",
    suggestedType: "meeting",
    suggestedPhase: "audit",
    nextAction: {
      type: "meeting",
      proposalNb: "Foreslå 3 møtetider og send invitasjon til sikkerhetskontakten.",
      proposalEn: "Propose 3 time slots and send a meeting invitation to the security contact.",
      recipient: "security@leverandor.no",
      subjectNb: "Møteforespørsel: årlig risikogjennomgang",
      subjectEn: "Meeting request: annual risk review",
      bodyNb: "Hei,\n\nVi ønsker å avtale en gjennomgang av risikobildet for vårt samarbeid — endringer i underleverandørkjeden, kontrollnivå og hendelseshåndtering.\n\nForslag til tider:\n• Tirsdag 12.05 kl. 10:00\n• Onsdag 13.05 kl. 14:00\n• Fredag 15.05 kl. 09:00\n\nMvh",
      bodyEn: "Hi,\n\nWe'd like to schedule a review of the risk picture for our partnership — sub-processor changes, control level and incident handling.\n\nProposed times:\n• Tuesday 12/05 at 10:00\n• Wednesday 13/05 at 14:00\n• Friday 15/05 at 09:00\n\nBest regards",
    },
  },
];

export function generateGuidanceForVendor(vendorId: string): VendorGuidance {
  let seed = 0;
  for (let i = 0; i < vendorId.length; i++) seed = ((seed << 5) - seed + vendorId.charCodeAt(i)) | 0;
  const suggestions: SuggestedActivity[] = TEMPLATES.map((tmpl, idx) => ({
    ...tmpl,
    id: `sugg-${Math.abs(seed)}-${idx}`,
  }));

  const open = suggestions.filter((s) => s.status === "open").length;
  const inProgress = suggestions.filter((s) => s.status === "in_progress").length;

  return {
    summaryNb: `${open} åpne gap, ${inProgress} under oppfølging, 2 lukket siste 30 dager.`,
    summaryEn: `${open} open gaps, ${inProgress} in progress, 2 closed in the last 30 days.`,
    suggestions,
  };
}

export function recomputeSummary(suggestions: SuggestedActivity[], isNb: boolean): string {
  const open = suggestions.filter((s) => s.status === "open").length;
  const inProgress = suggestions.filter((s) => s.status === "in_progress").length;
  if (open === 0 && inProgress === 0) {
    return isNb
      ? "Alle gap er lukket. Følg med på nye signaler fra Mynder."
      : "All gaps are closed. Watch for new signals from Mynder.";
  }
  return isNb
    ? `${open} åpne gap, ${inProgress} under oppfølging, 2 lukket siste 30 dager.`
    : `${open} open gaps, ${inProgress} in progress, 2 closed in the last 30 days.`;
}

