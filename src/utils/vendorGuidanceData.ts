import type { ActivityType, Phase } from "./vendorActivityData";

export type GuidanceLevel = "strategisk" | "taktisk" | "operasjonelt";
export type Criticality = "kritisk" | "hoy" | "medium";
export type GapStatus = "open" | "in_progress" | "closed";

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
}

export const STATUS_CONFIG: Record<GapStatus, { nb: string; en: string; badge: string; bar: string }> = {
  open: {
    nb: "Åpen",
    en: "Open",
    badge: "bg-destructive/15 text-destructive border border-destructive/25",
    bar: "bg-destructive",
  },
  in_progress: {
    nb: "Under oppfølging",
    en: "In progress",
    badge: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/25",
    bar: "bg-amber-500",
  },
  closed: {
    nb: "Lukket",
    en: "Closed",
    badge: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25",
    bar: "bg-emerald-500",
  },
};

export const LEVEL_DOT: Record<GuidanceLevel, string> = {
  operasjonelt: "bg-emerald-500",
  taktisk: "bg-amber-500",
  strategisk: "bg-primary",
};

export interface VendorGuidance {
  summaryNb: string;
  summaryEn: string;
  suggestions: SuggestedActivity[];
}

export const CRITICALITY_CONFIG: Record<Criticality, { nb: string; en: string; badge: string }> = {
  kritisk: { nb: "Kritisk", en: "Critical", badge: "bg-destructive/15 text-destructive border border-destructive/20" },
  hoy: { nb: "Høy", en: "High", badge: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/20" },
  medium: { nb: "Medium", en: "Medium", badge: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-300 border border-yellow-500/20" },
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

