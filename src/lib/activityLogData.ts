/**
 * Aktivitetslogg – demo/prototype datakilde.
 *
 * Kontekstbevisst: samme "hendelseslager" filtreres etter aktiv workspace-mode.
 * - "compliance" (egen virksomhet): kun hendelser hvor scope = "own"
 * - "partner" (partner-visning): hendelser på tvers av partnerens kunder
 *   pluss partnerens interne handlinger (scope = "partner-internal" | "customer")
 *
 * I en fullversjon vil disse komme fra en `activity_log`-tabell + aggregerte
 * kilder (assets, requirement_status, credit_transactions m.fl.).
 */

export type ActivityCategory =
  | "resource"     // Ressurser (systemer, assets, leverandører)
  | "compliance"   // Krav, kontroller, dokumentasjon
  | "account"      // Brukere, roller, abonnement
  | "ai";          // Lara/AI-hendelser

export type ActorType = "customer_user" | "partner_user" | "ai" | "system";

export interface ActivityEvent {
  id: string;
  createdAt: string; // ISO
  scope: "own" | "customer" | "partner-internal";
  customerName?: string; // satt når scope = "customer"
  actorType: ActorType;
  actorName: string;
  category: ActivityCategory;
  action: string;      // kort setning
  resource?: string;   // hva det gjaldt
  meta?: string;       // valgfri tilleggsdetalj
}

const hoursAgo = (h: number) =>
  new Date(Date.now() - h * 3600 * 1000).toISOString();

/** Egen virksomhet – ting brukeren og teamet gjør internt. */
const OWN_EVENTS: ActivityEvent[] = [
  {
    id: "own-1",
    createdAt: hoursAgo(0.5),
    scope: "own",
    actorType: "customer_user",
    actorName: "Anna Berg",
    category: "compliance",
    action: "Oppdaterte status til «Verifisert»",
    resource: "NIS2 · Art. 21 – Risikostyring",
    meta: "Bevis lastet opp: Risikovurdering_2026.pdf",
  },
  {
    id: "own-2",
    createdAt: hoursAgo(2),
    scope: "own",
    actorType: "ai",
    actorName: "Lara",
    category: "ai",
    action: "Analyserte nytt dokument",
    resource: "ISO 27001 – Vedlegg A",
    meta: "Dekker 14 av 18 kontroller",
  },
  {
    id: "own-3",
    createdAt: hoursAgo(5),
    scope: "own",
    actorType: "customer_user",
    actorName: "Ola Nordmann",
    category: "resource",
    action: "La til nytt system",
    resource: "Microsoft 365",
    meta: "Automatisk oppdaget via M365-tilkobling",
  },
  {
    id: "own-4",
    createdAt: hoursAgo(9),
    scope: "own",
    actorType: "customer_user",
    actorName: "Anna Berg",
    category: "account",
    action: "Endret nivå på Mynder Core",
    resource: "Fra Gratis (5) til Inntil 20 systemer",
    meta: "995 kr/mnd",
  },
  {
    id: "own-5",
    createdAt: hoursAgo(22),
    scope: "own",
    actorType: "system",
    actorName: "System",
    category: "compliance",
    action: "Dokumentasjon nærmer seg utløp",
    resource: "ISO 27001-sertifikat",
    meta: "Gyldig til 14.03.2026",
  },
  {
    id: "own-6",
    createdAt: hoursAgo(30),
    scope: "own",
    actorType: "ai",
    actorName: "Lara",
    category: "ai",
    action: "Foreslo prioritet P1 for system",
    resource: "Visma Payroll",
    meta: "Godtatt av Anna Berg",
  },
  {
    id: "own-7",
    createdAt: hoursAgo(48),
    scope: "own",
    actorType: "customer_user",
    actorName: "Kari Ås",
    category: "account",
    action: "Inviterte bruker",
    resource: "erik@virksomhet.no",
    meta: "Rolle: Operativ bruker",
  },
  {
    id: "own-8",
    createdAt: hoursAgo(72),
    scope: "own",
    actorType: "customer_user",
    actorName: "Ola Nordmann",
    category: "resource",
    action: "Endret kritikalitet",
    resource: "Leverandør: Slack Technologies",
    meta: "Fra Medium til Høy",
  },
];

/** Partner-visning – hendelser på tvers av partnerens kunder + partnerens egne handlinger. */
const PARTNER_EVENTS: ActivityEvent[] = [
  {
    id: "p-1",
    createdAt: hoursAgo(0.3),
    scope: "customer",
    customerName: "Nordic Bygg AS",
    actorType: "partner_user",
    actorName: "Marte Solberg",
    category: "compliance",
    action: "Sendte GAP-analyse",
    resource: "NIS2 · 24 krav",
    meta: "Estimert tjenesteverdi: 148 000 kr",
  },
  {
    id: "p-2",
    createdAt: hoursAgo(1),
    scope: "customer",
    customerName: "Fjord Consulting",
    actorType: "ai",
    actorName: "Lara",
    category: "ai",
    action: "Fant nye systemer i M365",
    resource: "3 systemer oppdaget",
    meta: "Venter på partnergodkjenning",
  },
  {
    id: "p-3",
    createdAt: hoursAgo(2),
    scope: "partner-internal",
    actorType: "partner_user",
    actorName: "Jonas Lie",
    category: "account",
    action: "Opprettet ny kundeprofil",
    resource: "Kystfrakt Nord AS",
    meta: "Status: Utkast",
  },
  {
    id: "p-4",
    createdAt: hoursAgo(4),
    scope: "customer",
    customerName: "TekstilPartner",
    actorType: "customer_user",
    actorName: "Ingrid Vik",
    category: "compliance",
    action: "Lastet opp bevis",
    resource: "Databehandleravtale – AWS",
    meta: "Signert av begge parter",
  },
  {
    id: "p-5",
    createdAt: hoursAgo(7),
    scope: "partner-internal",
    actorType: "partner_user",
    actorName: "Marte Solberg",
    category: "account",
    action: "Oppdaterte tilbudsmal",
    resource: "Partner-innstillinger · Tilbudsmerking",
  },
  {
    id: "p-6",
    createdAt: hoursAgo(10),
    scope: "customer",
    customerName: "Nordic Bygg AS",
    actorType: "customer_user",
    actorName: "Petter Aas",
    category: "resource",
    action: "Godkjente foreslått system",
    resource: "Azure Active Directory",
    meta: "Foreslått av Lara",
  },
  {
    id: "p-7",
    createdAt: hoursAgo(20),
    scope: "customer",
    customerName: "Fjord Consulting",
    actorType: "ai",
    actorName: "Lara",
    category: "ai",
    action: "Analyserte personvernerklæring",
    resource: "Trust Profile-oppdatering",
    meta: "Dekker 6 nye GDPR-artikler",
  },
  {
    id: "p-8",
    createdAt: hoursAgo(28),
    scope: "partner-internal",
    actorType: "partner_user",
    actorName: "Jonas Lie",
    category: "account",
    action: "Aktiverte modul for kunde",
    resource: "Kunde: TekstilPartner · Mynder Core",
    meta: "Nivå: Inntil 20 systemer",
  },
  {
    id: "p-9",
    createdAt: hoursAgo(46),
    scope: "customer",
    customerName: "Kystfrakt Nord AS",
    actorType: "partner_user",
    actorName: "Marte Solberg",
    category: "compliance",
    action: "Publiserte tjenestekatalog",
    resource: "3 tjenester basert på GAP",
  },
  {
    id: "p-10",
    createdAt: hoursAgo(60),
    scope: "customer",
    customerName: "Nordic Bygg AS",
    actorType: "system",
    actorName: "System",
    category: "compliance",
    action: "Kravdekning falt under 75%",
    resource: "ISO 27001",
    meta: "Fra 78% til 71%",
  },
];

export function getActivityEvents(mode: "compliance" | "partner" | "admin"): ActivityEvent[] {
  if (mode === "partner") return PARTNER_EVENTS;
  if (mode === "admin") return [...OWN_EVENTS, ...PARTNER_EVENTS];
  return OWN_EVENTS;
}


export const CATEGORY_LABELS: Record<ActivityCategory, string> = {
  resource: "Ressurser",
  compliance: "Samsvar",
  account: "Konto & abonnement",
  ai: "AI / Lara",
};

export function formatRelative(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return "nå nettopp";
  if (mins < 60) return `${mins} min siden`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} t siden`;
  const days = Math.round(hrs / 24);
  if (days < 7) return `${days} d siden`;
  return new Date(iso).toLocaleDateString("nb-NO", { day: "2-digit", month: "short" });
}
