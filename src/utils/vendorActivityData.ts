export type ActivityType = "document" | "risk" | "incident" | "assignment" | "review" | "delivery" | "maturity" | "setting" | "upload" | "view" | "email" | "phone" | "meeting" | "manual";
export type Phase = "pre_assessment" | "onboarding" | "ongoing" | "audit" | "incident" | "termination";
export type OutcomeStatus = "in_progress" | "completed" | "needs_followup";

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
  criticality?: "kritisk" | "hoy" | "medium";
}

export const PHASE_CONFIG: Record<Phase, { nb: string; en: string; color: string }> = {
  pre_assessment: { nb: "Vurdering før avtale", en: "Pre-contract assessment", color: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300" },
  onboarding: { nb: "Onboarding", en: "Onboarding", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300" },
  ongoing: { nb: "Løpende oppfølging", en: "Ongoing follow-up", color: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300" },
  audit: { nb: "Revisjon og kontroll", en: "Audit and control", color: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300" },
  incident: { nb: "Hendelse og avvik", en: "Incident and deviation", color: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300" },
  termination: { nb: "Avslutning", en: "Termination", color: "bg-slate-100 text-slate-800 dark:bg-slate-900/40 dark:text-slate-300" },
};

export const STATUS_CONFIG: Record<OutcomeStatus, { nb: string; en: string }> = {
  in_progress: { nb: "Pågår", en: "In progress" },
  completed: { nb: "Fullført", en: "Completed" },
  needs_followup: { nb: "Krever oppfølging", en: "Needs follow-up" },
};

interface Template {
  type: ActivityType; phase: Phase;
  titleNb: string; titleEn: string; descNb: string; descEn: string;
  outcomeStatus: OutcomeStatus;
  actorRole: string;
}

const templates: Template[] = [
  { type: "document", phase: "onboarding", titleNb: "DPA lastet opp", titleEn: "DPA uploaded", descNb: "Databehandleravtale lastet opp og knyttet til leverandøren", descEn: "Data processing agreement uploaded and linked to the vendor", outcomeStatus: "completed", actorRole: "Compliance-ansvarlig" },
  { type: "assignment", phase: "onboarding", titleNb: "Leverandøransvarlig tildelt", titleEn: "Vendor manager assigned", descNb: "Ansvarlig person ble satt for oppfølging av leverandøren", descEn: "Responsible person was assigned for vendor follow-up", outcomeStatus: "completed", actorRole: "IT-leder" },
  { type: "risk", phase: "pre_assessment", titleNb: "Risikovurdering gjennomført", titleEn: "Risk assessment completed", descNb: "Intern risikovurdering ble gjennomført før kontraktsignering", descEn: "Internal risk assessment was completed prior to contract signing", outcomeStatus: "needs_followup", actorRole: "Sikkerhetsrådgiver" },
  { type: "review", phase: "audit", titleNb: "Årlig gjennomgang fullført", titleEn: "Annual review completed", descNb: "Leverandøren ble gjennomgått og godkjent for videre bruk", descEn: "Vendor was reviewed and approved for continued use", outcomeStatus: "completed", actorRole: "Compliance-ansvarlig" },
  { type: "delivery", phase: "ongoing", titleNb: "Ny leveranse registrert", titleEn: "New delivery registered", descNb: "En ny leveranse ble lagt til leverandørprofilen", descEn: "A new delivery was added to the vendor profile", outcomeStatus: "in_progress", actorRole: "Leverandøransvarlig" },
  { type: "maturity", phase: "ongoing", titleNb: "Modenhetsscore oppdatert", titleEn: "Maturity score updated", descNb: "Trust Score økte fra 32% til 38% etter kontrollgjennomgang", descEn: "Trust Score increased from 32% to 38% after control review", outcomeStatus: "completed", actorRole: "Compliance-ansvarlig" },
  { type: "document", phase: "onboarding", titleNb: "ISO 27001-sertifikat lastet opp", titleEn: "ISO 27001 certificate uploaded", descNb: "Leverandørens sertifisering ble verifisert og arkivert", descEn: "Vendor's certification was verified and archived", outcomeStatus: "completed", actorRole: "Sikkerhetsrådgiver" },
  { type: "incident", phase: "incident", titleNb: "Hendelse rapportert", titleEn: "Incident reported", descNb: "En sikkerhetshendelse hos leverandøren ble registrert og fulgt opp", descEn: "A security incident at the vendor was registered and followed up", outcomeStatus: "needs_followup", actorRole: "CISO" },
  { type: "upload", phase: "ongoing", titleNb: "SLA-dokument oppdatert", titleEn: "SLA document updated", descNb: "Oppdatert tjenestenivåavtale ble lastet opp", descEn: "Updated service level agreement was uploaded", outcomeStatus: "completed", actorRole: "Leverandøransvarlig" },
  { type: "setting", phase: "ongoing", titleNb: "Kontaktinformasjon endret", titleEn: "Contact information changed", descNb: "E-post og telefonnummer for kontaktperson ble oppdatert", descEn: "Email and phone number for contact person were updated", outcomeStatus: "completed", actorRole: "Administrasjonsansvarlig" },
  { type: "view", phase: "ongoing", titleNb: "Profil vist av kunde", titleEn: "Profile viewed by customer", descNb: "Trust Profilen ble vist 3 ganger av eksterne brukere", descEn: "The Trust Profile was viewed 3 times by external users", outcomeStatus: "in_progress", actorRole: "System" },
  { type: "maturity", phase: "audit", titleNb: "Kontrollområde forbedret", titleEn: "Control area improved", descNb: "Personvern og datahåndtering gikk fra 45% til 62%", descEn: "Privacy and data handling improved from 45% to 62%", outcomeStatus: "completed", actorRole: "Compliance-ansvarlig" },
  { type: "assignment", phase: "ongoing", titleNb: "Eier endret", titleEn: "Owner changed", descNb: "Virksomhetsområde ble oppdatert fra IT til Drift", descEn: "Work area was updated from IT to Operations", outcomeStatus: "completed", actorRole: "IT-leder" },
  { type: "document", phase: "ongoing", titleNb: "Underleverandørliste mottatt", titleEn: "Sub-processor list received", descNb: "Leverandøren sendte oppdatert liste over underleverandører", descEn: "Vendor sent updated list of sub-processors", outcomeStatus: "completed", actorRole: "Leverandøransvarlig" },
  { type: "review", phase: "audit", titleNb: "Revisjon planlagt", titleEn: "Audit scheduled", descNb: "Neste revisjon av leverandøren ble satt til Q2 2026", descEn: "Next audit of the vendor was scheduled for Q2 2026", outcomeStatus: "in_progress", actorRole: "Compliance-ansvarlig" },
  { type: "review", phase: "pre_assessment", titleNb: "Due diligence startet", titleEn: "Due diligence started", descNb: "Innledende vurdering av leverandøren før kontraktsignering", descEn: "Initial assessment of vendor prior to contract signing", outcomeStatus: "in_progress", actorRole: "Innkjøpsansvarlig" },
  { type: "document", phase: "termination", titleNb: "Avtale terminert", titleEn: "Contract terminated", descNb: "Avtalen ble avsluttet og data overført tilbake", descEn: "Contract was terminated and data transferred back", outcomeStatus: "completed", actorRole: "Compliance-ansvarlig" },
];

export function generateDemoActivities(assetId: string): VendorActivity[] {
  let seed = 0;
  for (let i = 0; i < assetId.length; i++) seed = ((seed << 5) - seed + assetId.charCodeAt(i)) | 0;
  const rand = () => { seed = (seed * 16807 + 0) % 2147483647; return (seed & 0x7fffffff) / 2147483647; };

  const actors = ["Jan Olsen", "Kari Nordmann", "Tore Berg", "Lise Andersen", "Erik Hansen"];
  const now = new Date();
  const count = 10 + Math.floor(rand() * 5);
  const activities: VendorActivity[] = [];

  for (let i = 0; i < count; i++) {
    const tmpl = templates[Math.floor(rand() * templates.length)];
    const daysAgo = Math.floor(rand() * 300) + 1;
    const date = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    const actor = actors[Math.floor(rand() * actors.length)];
    const status = STATUS_CONFIG[tmpl.outcomeStatus];

    activities.push({
      id: `act-${i}`, type: tmpl.type, phase: tmpl.phase,
      titleNb: tmpl.titleNb, titleEn: tmpl.titleEn,
      descriptionNb: tmpl.descNb, descriptionEn: tmpl.descEn,
      outcomeNb: status.nb, outcomeEn: status.en,
      outcomeStatus: tmpl.outcomeStatus,
      date, actor, actorRole: tmpl.actorRole,
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
  document: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  risk: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  incident: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  assignment: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  review: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  delivery: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300",
  maturity: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  setting: "bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-300",
  upload: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
  view: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  email: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300",
  phone: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300",
  meeting: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300",
  manual: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
};

export const OUTCOME_COLORS: Record<OutcomeStatus, string> = {
  in_progress: "text-blue-600 dark:text-blue-400",
  completed: "text-green-600 dark:text-green-400",
  needs_followup: "text-orange-600 dark:text-orange-400",
};
