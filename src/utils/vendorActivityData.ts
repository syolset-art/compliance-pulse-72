export type ActivityType = "document" | "risk" | "incident" | "assignment" | "review" | "delivery" | "maturity" | "setting" | "upload" | "view" | "email" | "phone" | "meeting" | "manual";
export type Phase = "pre_assessment" | "onboarding" | "ongoing" | "audit" | "incident" | "termination";
// Simplified 4-status model for vendor activity follow-up
export type ActivityStatus = "open" | "in_progress" | "closed" | "not_relevant";
// Legacy alias retained for backwards compatibility — same keys as ActivityStatus
export type OutcomeStatus = ActivityStatus;
export type ActivityLevel = "operasjonelt" | "taktisk" | "strategisk";

export interface StatusHistoryEntry {
  from: ActivityStatus;
  to: ActivityStatus;
  comment?: string;
  changedAt: Date;
  changedBy?: string;
}

export const ACTIVITY_STATUS_CONFIG: Record<ActivityStatus, {
  nb: string;
  en: string;
  pill: string;       // pill bg + text + border
  dot: string;        // colored dot bg
  filterDot: string;  // dot used in filters
}> = {
  open: {
    nb: "Åpent", en: "Open",
    pill: "bg-destructive/10 text-destructive border-destructive/30",
    dot: "bg-destructive",
    filterDot: "bg-destructive",
  },
  in_progress: {
    nb: "Under oppfølging", en: "In progress",
    pill: "bg-warning/10 text-warning border-warning/30",
    dot: "bg-warning",
    filterDot: "bg-warning",
  },
  closed: {
    nb: "Lukket", en: "Closed",
    pill: "bg-success/10 text-success border-success/30",
    dot: "bg-success",
    filterDot: "bg-success",
  },
  not_relevant: {
    nb: "Ikke relevant", en: "Not relevant",
    pill: "bg-muted text-muted-foreground border-border",
    dot: "bg-muted-foreground",
    filterDot: "bg-muted-foreground",
  },
};

export type StatusGroup = "all" | "open" | "in_progress" | "closed";
export function getStatusGroup(s: ActivityStatus): Exclude<StatusGroup, "all"> | "not_relevant" {
  return s === "open" ? "open" : s === "in_progress" ? "in_progress" : s === "closed" ? "closed" : "not_relevant";
}

export interface VendorActivity {
  id: string;
  type: ActivityType;
  titleNb: string;
  titleEn: string;
  descriptionNb?: string;
  descriptionEn?: string;
  date: Date;
  actor?: string;
  actorRole?: string;
  phase: Phase;
  outcomeNb: string;
  outcomeEn: string;
  outcomeStatus: OutcomeStatus;
  contactPerson?: string;
  participants?: string;
  attachmentNote?: string;
  isManual?: boolean;
  linkedGapId?: string;
  criticality?: "lav" | "medium" | "hoy" | "kritisk";
  theme?: string;
  level?: ActivityLevel;
  createdAt?: Date;
  statusHistory?: StatusHistoryEntry[];
}

export const LEVEL_CONFIG: Record<ActivityLevel, { nb: string; en: string; dot: string }> = {
  operasjonelt: { nb: "Operasjonelt", en: "Operational", dot: "bg-status-closed" },
  taktisk: { nb: "Taktisk", en: "Tactical", dot: "bg-warning" },
  strategisk: { nb: "Strategisk", en: "Strategic", dot: "bg-primary" },
};

export const PHASE_CONFIG: Record<Phase, { nb: string; en: string; color: string }> = {
  pre_assessment: { nb: "Vurdering før avtale", en: "Pre-contract assessment", color: "bg-warning/10 text-warning dark:bg-warning/40 dark:text-warning" },
  onboarding: { nb: "Onboarding", en: "Onboarding", color: "bg-primary/10 text-primary dark:bg-primary/40 dark:text-primary" },
  ongoing: { nb: "Løpende oppfølging", en: "Ongoing follow-up", color: "bg-status-closed/10 text-status-closed dark:bg-status-closed/40 dark:text-status-closed" },
  audit: { nb: "Revisjon og kontroll", en: "Audit and control", color: "bg-accent/10 text-foreground dark:bg-foreground/40 dark:text-accent" },
  incident: { nb: "Hendelse og avvik", en: "Incident and deviation", color: "bg-destructive/10 text-destructive dark:bg-destructive/40 dark:text-destructive" },
  termination: { nb: "Avslutning", en: "Termination", color: "bg-slate-100 text-slate-800 dark:bg-slate-900/40 dark:text-slate-300" },
};

export const STATUS_CONFIG: Record<ActivityStatus, { nb: string; en: string }> = {
  open: { nb: "Åpent", en: "Open" },
  in_progress: { nb: "Under oppfølging", en: "In progress" },
  closed: { nb: "Lukket", en: "Closed" },
  not_relevant: { nb: "Ikke relevant", en: "Not relevant" },
};

interface Template {
  type: ActivityType; phase: Phase;
  titleNb: string; titleEn: string; descNb: string; descEn: string;
  outcomeStatus: OutcomeStatus;
  actorRole: string;
}

const templates: Template[] = [
  { type: "document", phase: "onboarding", titleNb: "DPA lastet opp", titleEn: "DPA uploaded", descNb: "Databehandleravtale lastet opp og knyttet til leverandøren", descEn: "Data processing agreement uploaded and linked to the vendor", outcomeStatus: "closed", actorRole: "Compliance-ansvarlig" },
  { type: "assignment", phase: "onboarding", titleNb: "Leverandøransvarlig tildelt", titleEn: "Vendor manager assigned", descNb: "Ansvarlig person ble satt for oppfølging av leverandøren", descEn: "Responsible person was assigned for vendor follow-up", outcomeStatus: "closed", actorRole: "IT-leder" },
  { type: "risk", phase: "pre_assessment", titleNb: "Risikovurdering gjennomført", titleEn: "Risk assessment completed", descNb: "Intern risikovurdering ble gjennomført før kontraktsignering", descEn: "Internal risk assessment was completed prior to contract signing", outcomeStatus: "open", actorRole: "Sikkerhetsrådgiver" },
  { type: "review", phase: "audit", titleNb: "Årlig gjennomgang fullført", titleEn: "Annual review completed", descNb: "Leverandøren ble gjennomgått og godkjent for videre bruk", descEn: "Vendor was reviewed and approved for continued use", outcomeStatus: "closed", actorRole: "Compliance-ansvarlig" },
  { type: "delivery", phase: "ongoing", titleNb: "Ny leveranse registrert", titleEn: "New delivery registered", descNb: "En ny leveranse ble lagt til leverandørprofilen", descEn: "A new delivery was added to the vendor profile", outcomeStatus: "in_progress", actorRole: "Leverandøransvarlig" },
  { type: "maturity", phase: "ongoing", titleNb: "Modenhetsscore oppdatert", titleEn: "Maturity score updated", descNb: "Trust Score økte fra 32% til 38% etter kontrollgjennomgang", descEn: "Trust Score increased from 32% to 38% after control review", outcomeStatus: "closed", actorRole: "Compliance-ansvarlig" },
  { type: "document", phase: "onboarding", titleNb: "ISO 27001-sertifikat lastet opp", titleEn: "ISO 27001 certificate uploaded", descNb: "Leverandørens sertifisering ble verifisert og arkivert", descEn: "Vendor's certification was verified and archived", outcomeStatus: "closed", actorRole: "Sikkerhetsrådgiver" },
  { type: "incident", phase: "incident", titleNb: "Hendelse rapportert", titleEn: "Incident reported", descNb: "En sikkerhetshendelse hos leverandøren ble registrert og fulgt opp", descEn: "A security incident at the vendor was registered and followed up", outcomeStatus: "open", actorRole: "CISO" },
  { type: "upload", phase: "ongoing", titleNb: "SLA-dokument oppdatert", titleEn: "SLA document updated", descNb: "Oppdatert tjenestenivåavtale ble lastet opp", descEn: "Updated service level agreement was uploaded", outcomeStatus: "closed", actorRole: "Leverandøransvarlig" },
  { type: "setting", phase: "ongoing", titleNb: "Kontaktinformasjon endret", titleEn: "Contact information changed", descNb: "E-post og telefonnummer for kontaktperson ble oppdatert", descEn: "Email and phone number for contact person were updated", outcomeStatus: "closed", actorRole: "Administrasjonsansvarlig" },
  { type: "view", phase: "ongoing", titleNb: "Profil vist av kunde", titleEn: "Profile viewed by customer", descNb: "Trust Profilen ble vist 3 ganger av eksterne brukere", descEn: "The Trust Profile was viewed 3 times by external users", outcomeStatus: "in_progress", actorRole: "System" },
  { type: "maturity", phase: "audit", titleNb: "Kontrollområde forbedret", titleEn: "Control area improved", descNb: "Personvern og datahåndtering gikk fra 45% til 62%", descEn: "Privacy and data handling improved from 45% to 62%", outcomeStatus: "closed", actorRole: "Compliance-ansvarlig" },
  { type: "assignment", phase: "ongoing", titleNb: "Eier endret", titleEn: "Owner changed", descNb: "Virksomhetsområde ble oppdatert fra IT til Drift", descEn: "Work area was updated from IT to Operations", outcomeStatus: "closed", actorRole: "IT-leder" },
  { type: "document", phase: "ongoing", titleNb: "Underleverandørliste mottatt", titleEn: "Sub-processor list received", descNb: "Leverandøren sendte oppdatert liste over underleverandører", descEn: "Vendor sent updated list of sub-processors", outcomeStatus: "in_progress", actorRole: "Leverandøransvarlig" },
  { type: "review", phase: "audit", titleNb: "Revisjon planlagt", titleEn: "Audit scheduled", descNb: "Neste revisjon av leverandøren ble satt til Q2 2026", descEn: "Next audit of the vendor was scheduled for Q2 2026", outcomeStatus: "in_progress", actorRole: "Compliance-ansvarlig" },
  { type: "review", phase: "pre_assessment", titleNb: "Due diligence startet", titleEn: "Due diligence started", descNb: "Innledende vurdering av leverandøren før kontraktsignering", descEn: "Initial assessment of vendor prior to contract signing", outcomeStatus: "in_progress", actorRole: "Innkjøpsansvarlig" },
  { type: "document", phase: "termination", titleNb: "Avtale terminert", titleEn: "Contract terminated", descNb: "Avtalen ble avsluttet og data overført tilbake", descEn: "Contract was terminated and data transferred back", outcomeStatus: "not_relevant", actorRole: "Compliance-ansvarlig" },
];

export function generateDemoActivities(assetId: string): VendorActivity[] {
  let seed = 0;
  for (let i = 0; i < assetId.length; i++) seed = ((seed << 5) - seed + assetId.charCodeAt(i)) | 0;
  const rand = () => { seed = (seed * 16807 + 0) % 2147483647; return (seed & 0x7fffffff) / 2147483647; };

  const actors = ["Jan Olsen", "Kari Nordmann", "Tore Berg", "Lise Andersen", "Erik Hansen"];
  const now = new Date();
  const count = 10 + Math.floor(rand() * 5);
  const activities: VendorActivity[] = [];

  const phaseToLevel: Record<Phase, ActivityLevel> = {
    pre_assessment: "strategisk",
    onboarding: "taktisk",
    ongoing: "operasjonelt",
    audit: "taktisk",
    incident: "operasjonelt",
    termination: "strategisk",
  };

  for (let i = 0; i < count; i++) {
    const tmpl = templates[Math.floor(rand() * templates.length)];
    const daysAgo = Math.floor(rand() * 300) + 1;
    const date = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    const actor = actors[Math.floor(rand() * actors.length)];
    const status = STATUS_CONFIG[tmpl.outcomeStatus];
    // createdAt slightly after the date (a few hours)
    const createdAt = new Date(date.getTime() + Math.floor(rand() * 8) * 60 * 60 * 1000);

    activities.push({
      id: `act-${i}`, type: tmpl.type, phase: tmpl.phase,
      titleNb: tmpl.titleNb, titleEn: tmpl.titleEn,
      descriptionNb: tmpl.descNb, descriptionEn: tmpl.descEn,
      outcomeNb: status.nb, outcomeEn: status.en,
      outcomeStatus: tmpl.outcomeStatus,
      date, actor, actorRole: tmpl.actorRole,
      level: phaseToLevel[tmpl.phase],
      createdAt,
    });
  }

  return activities.sort((a, b) => b.date.getTime() - a.date.getTime());
}

export function formatRelativeDate(date: Date, isNb: boolean): string {
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return isNb ? "I dag" : "Today";
  if (diffDays === 1) return isNb ? "I går" : "Yesterday";
  if (diffDays < 7) return isNb ? `${diffDays} dager siden` : `${diffDays} days ago`;
  if (diffDays < 30) { const w = Math.floor(diffDays / 7); return isNb ? `${w} ${w === 1 ? "uke" : "uker"} siden` : `${w} ${w === 1 ? "week" : "weeks"} ago`; }
  if (diffDays < 365) { const m = Math.floor(diffDays / 30); return isNb ? `${m} ${m === 1 ? "måned" : "måneder"} siden` : `${m} ${m === 1 ? "month" : "months"} ago`; }
  return date.toLocaleDateString(isNb ? "nb-NO" : "en-GB");
}

export const ACTIVITY_ICONS_MAP: Record<ActivityType, string> = {
  document: "FileText", risk: "AlertTriangle", incident: "AlertTriangle",
  assignment: "UserCheck", review: "ClipboardCheck", delivery: "Package",
  maturity: "TrendingUp", setting: "Settings", upload: "Upload", view: "Eye",
  email: "Mail", phone: "Phone", meeting: "Users", manual: "PenLine",
};

export const ACTIVITY_COLORS: Record<ActivityType, string> = {
  document: "bg-primary/10 text-primary dark:bg-primary/30 dark:text-primary",
  risk: "bg-warning/10 text-warning dark:bg-warning/30 dark:text-warning",
  incident: "bg-destructive/10 text-destructive dark:bg-destructive/30 dark:text-destructive",
  assignment: "bg-status-closed/10 text-status-closed dark:bg-status-closed/30 dark:text-status-closed",
  review: "bg-accent/10 text-foreground dark:bg-foreground/30 dark:text-accent",
  delivery: "bg-primary/10 text-primary dark:bg-primary/30 dark:text-primary",
  maturity: "bg-status-closed/10 text-status-closed dark:bg-status-closed/30 dark:text-status-closed",
  setting: "bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-300",
  upload: "bg-primary/10 text-primary dark:bg-primary/30 dark:text-primary",
  view: "bg-warning/10 text-warning dark:bg-warning/30 dark:text-warning",
  email: "bg-primary/10 text-primary dark:bg-primary/30 dark:text-primary",
  phone: "bg-status-closed/10 text-status-closed dark:bg-status-closed/30 dark:text-status-closed",
  meeting: "bg-accent/10 text-foreground dark:bg-foreground/30 dark:text-accent",
  manual: "bg-destructive/10 text-destructive dark:bg-destructive/30 dark:text-destructive",
};

export const OUTCOME_COLORS: Record<ActivityStatus, string> = {
  open: "text-destructive",
  in_progress: "text-warning",
  closed: "text-success",
  not_relevant: "text-muted-foreground",
};
