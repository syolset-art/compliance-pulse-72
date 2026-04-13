export type ActivityType = "document" | "risk" | "incident" | "assignment" | "review" | "delivery" | "maturity" | "setting" | "upload" | "view";
export type Phase = "onboarding" | "ongoing" | "audit" | "incident" | "closure";
export type OutcomeStatus = "success" | "warning" | "info";

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
}

export const PHASE_CONFIG: Record<Phase, { nb: string; en: string; color: string }> = {
  onboarding: { nb: "Onboarding", en: "Onboarding", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300" },
  ongoing: { nb: "Løpende oppfølging", en: "Ongoing follow-up", color: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300" },
  audit: { nb: "Revisjon", en: "Audit", color: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300" },
  incident: { nb: "Hendelseshåndtering", en: "Incident management", color: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300" },
  closure: { nb: "Avslutning", en: "Closure", color: "bg-slate-100 text-slate-800 dark:bg-slate-900/40 dark:text-slate-300" },
};

interface Template {
  type: ActivityType; phase: Phase;
  titleNb: string; titleEn: string; descNb: string; descEn: string;
  outcomeNb: string; outcomeEn: string; outcomeStatus: OutcomeStatus;
  actorRole: string;
}

const templates: Template[] = [
  { type: "document", phase: "onboarding", titleNb: "DPA lastet opp", titleEn: "DPA uploaded", descNb: "Databehandleravtale lastet opp og knyttet til leverandøren", descEn: "Data processing agreement uploaded and linked to the vendor", outcomeNb: "Fullført", outcomeEn: "Completed", outcomeStatus: "success", actorRole: "Compliance-ansvarlig" },
  { type: "assignment", phase: "onboarding", titleNb: "Leverandøransvarlig tildelt", titleEn: "Vendor manager assigned", descNb: "Ansvarlig person ble satt for oppfølging av leverandøren", descEn: "Responsible person was assigned for vendor follow-up", outcomeNb: "Tildelt", outcomeEn: "Assigned", outcomeStatus: "success", actorRole: "IT-leder" },
  { type: "risk", phase: "audit", titleNb: "Risikovurdering gjennomført", titleEn: "Risk assessment completed", descNb: "Intern risikovurdering ble gjennomført", descEn: "Internal risk assessment was completed", outcomeNb: "Middels risiko", outcomeEn: "Medium risk", outcomeStatus: "warning", actorRole: "Sikkerhetsrådgiver" },
  { type: "review", phase: "audit", titleNb: "Årlig gjennomgang fullført", titleEn: "Annual review completed", descNb: "Leverandøren ble gjennomgått og godkjent for videre bruk", descEn: "Vendor was reviewed and approved for continued use", outcomeNb: "Godkjent", outcomeEn: "Approved", outcomeStatus: "success", actorRole: "Compliance-ansvarlig" },
  { type: "delivery", phase: "ongoing", titleNb: "Ny leveranse registrert", titleEn: "New delivery registered", descNb: "En ny leveranse ble lagt til leverandørprofilen", descEn: "A new delivery was added to the vendor profile", outcomeNb: "Registrert", outcomeEn: "Registered", outcomeStatus: "info", actorRole: "Leverandøransvarlig" },
  { type: "maturity", phase: "ongoing", titleNb: "Modenhetsscore oppdatert", titleEn: "Maturity score updated", descNb: "Trust Score økte fra 32% til 38% etter kontrollgjennomgang", descEn: "Trust Score increased from 32% to 38% after control review", outcomeNb: "+6% forbedring", outcomeEn: "+6% improvement", outcomeStatus: "success", actorRole: "Compliance-ansvarlig" },
  { type: "document", phase: "onboarding", titleNb: "ISO 27001-sertifikat lastet opp", titleEn: "ISO 27001 certificate uploaded", descNb: "Leverandørens sertifisering ble verifisert og arkivert", descEn: "Vendor's certification was verified and archived", outcomeNb: "Verifisert", outcomeEn: "Verified", outcomeStatus: "success", actorRole: "Sikkerhetsrådgiver" },
  { type: "incident", phase: "incident", titleNb: "Hendelse rapportert", titleEn: "Incident reported", descNb: "En sikkerhetshendelse hos leverandøren ble registrert og fulgt opp", descEn: "A security incident at the vendor was registered and followed up", outcomeNb: "Under oppfølging", outcomeEn: "Under investigation", outcomeStatus: "warning", actorRole: "CISO" },
  { type: "upload", phase: "ongoing", titleNb: "SLA-dokument oppdatert", titleEn: "SLA document updated", descNb: "Oppdatert tjenestenivåavtale ble lastet opp", descEn: "Updated service level agreement was uploaded", outcomeNb: "Oppdatert", outcomeEn: "Updated", outcomeStatus: "info", actorRole: "Leverandøransvarlig" },
  { type: "setting", phase: "ongoing", titleNb: "Kontaktinformasjon endret", titleEn: "Contact information changed", descNb: "E-post og telefonnummer for kontaktperson ble oppdatert", descEn: "Email and phone number for contact person were updated", outcomeNb: "Lagret", outcomeEn: "Saved", outcomeStatus: "info", actorRole: "Administrasjonsansvarlig" },
  { type: "view", phase: "ongoing", titleNb: "Profil vist av kunde", titleEn: "Profile viewed by customer", descNb: "Trust Profilen ble vist 3 ganger av eksterne brukere", descEn: "The Trust Profile was viewed 3 times by external users", outcomeNb: "3 visninger", outcomeEn: "3 views", outcomeStatus: "info", actorRole: "System" },
  { type: "maturity", phase: "audit", titleNb: "Kontrollområde forbedret", titleEn: "Control area improved", descNb: "Personvern og datahåndtering gikk fra 45% til 62%", descEn: "Privacy and data handling improved from 45% to 62%", outcomeNb: "+17% forbedring", outcomeEn: "+17% improvement", outcomeStatus: "success", actorRole: "Compliance-ansvarlig" },
  { type: "assignment", phase: "ongoing", titleNb: "Eier endret", titleEn: "Owner changed", descNb: "Virksomhetsområde ble oppdatert fra IT til Drift", descEn: "Work area was updated from IT to Operations", outcomeNb: "Overført", outcomeEn: "Transferred", outcomeStatus: "info", actorRole: "IT-leder" },
  { type: "document", phase: "ongoing", titleNb: "Underleverandørliste mottatt", titleEn: "Sub-processor list received", descNb: "Leverandøren sendte oppdatert liste over underleverandører", descEn: "Vendor sent updated list of sub-processors", outcomeNb: "Mottatt", outcomeEn: "Received", outcomeStatus: "info", actorRole: "Leverandøransvarlig" },
  { type: "review", phase: "audit", titleNb: "Revisjon planlagt", titleEn: "Audit scheduled", descNb: "Neste revisjon av leverandøren ble satt til Q2 2026", descEn: "Next audit of the vendor was scheduled for Q2 2026", outcomeNb: "Planlagt Q2 2026", outcomeEn: "Scheduled Q2 2026", outcomeStatus: "info", actorRole: "Compliance-ansvarlig" },
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

    activities.push({
      id: `act-${i}`, type: tmpl.type, phase: tmpl.phase,
      titleNb: tmpl.titleNb, titleEn: tmpl.titleEn,
      descriptionNb: tmpl.descNb, descriptionEn: tmpl.descEn,
      outcomeNb: tmpl.outcomeNb, outcomeEn: tmpl.outcomeEn,
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
};

export const OUTCOME_COLORS: Record<OutcomeStatus, string> = {
  success: "text-green-600 dark:text-green-400",
  warning: "text-orange-600 dark:text-orange-400",
  info: "text-blue-600 dark:text-blue-400",
};
