// Shared partner team data. Demo only — erstattes med user_roles-spørring
// når invitasjonsflyt er på plass.

export type PartnerRole = "Kundeansvarlig" | "Driftspartner";
/** Lesetilgang eller full lese- og skrivetilgang hos kundene. */
export type PartnerAccess = "read" | "write";
/** Omfang for driftspartner-rollen: alle kunder eller et utvalg. */
export type PartnerScope = "all" | "selected";

export interface PartnerTeamMember {
  id: string;
  name: string;
  email: string;
  /** Roller på toppen av grunntilgangen «Medlem». Tom liste = kun medlem. */
  roles: PartnerRole[];
  /** Tilgangsnivå per rolle. Settes uavhengig for Kundeansvarlig og Driftspartner. */
  roleAccess: Record<PartnerRole, PartnerAccess>;
  /** Omfang per rolle: alle kunder eller et utvalg. Settes uavhengig per rolle. */
  roleScope: Record<PartnerRole, PartnerScope>;
  /** Kunde-ID-er per rolle når omfanget er "selected". */
  roleCustomerIds: Record<PartnerRole, string[]>;
  initials: string;
}

export const PARTNER_ROLE_DESC: Record<PartnerRole, string> = {
  Kundeansvarlig: "Eier kunderelasjonen: portefølje, tilbud og meldinger.",
  Driftspartner: "Utfører compliance-arbeid i kundens virksomhetsprofil.",
};

export const PARTNER_MEMBER_DESC =
  "Alle som inviteres blir medlem. Medlemmer ser partnerdelen og kundeoversikten, men jobber ikke inne hos kundene.";

/** En bruker kan ha én eller begge rollene – de er uavhengige. */
export const PARTNER_ROLE_INDEPENDENCE_NOTE =
  "En bruker kan ha én eller begge rollene – de er uavhengige. For hver rolle velger du om brukeren kan utføre oppgaver eller kun lese.";


export const PARTNER_ACCESS_LABEL: Record<PartnerAccess, string> = {
  read: "Kun lesetilgang",
  write: "Kan utføre oppgaver",
};

export const PARTNER_ACCESS_SHORT: Record<PartnerAccess, string> = {
  read: "lese",
  write: "lese og skrive",
};

/** Hva tilgangsnivået betyr for den enkelte rollen. */
export const PARTNER_ROLE_ACCESS_HINT: Record<PartnerRole, Record<PartnerAccess, string>> = {
  Kundeansvarlig: {
    read: "Kan se portefølje, tilbud og meldinger, men ikke endre.",
    write: "Kan opprette og endre tilbud, kunder og meldinger.",
  },
  Driftspartner: {
    read: "Kan se kundens compliance-profil og dokumentasjon, men ikke endre.",
    write: "Kan jobbe i kundens compliance-profil og endre dokumentasjon.",
  },
};

export const DEFAULT_ROLE_SCOPE: Record<PartnerRole, PartnerScope> = {
  Kundeansvarlig: "all",
  Driftspartner: "all",
};

/** Minst én rolle kreves før invitasjon kan sendes. */
export const PARTNER_INVITE_ROLE_REQUIRED =
  "Velg minst én rolle. Brukeren får invitasjon på e-post og kan logge inn når rollen er satt.";

export const DEFAULT_ROLE_ACCESS: Record<PartnerRole, PartnerAccess> = {
  Kundeansvarlig: "write",
  Driftspartner: "read",
};

export const PARTNER_SCOPE_LABEL: Record<PartnerScope, string> = {
  all: "Alle kunder",
  selected: "Valgte kunder",
};

/** Kort tekst for omfanget til én rolle. */
export function describeRoleScope(m: PartnerTeamMember, role: PartnerRole): string {
  const scope = m.roleScope?.[role] ?? "all";
  if (scope === "all") return PARTNER_SCOPE_LABEL.all.toLowerCase();
  const n = (m.roleCustomerIds?.[role] ?? []).length;
  return `${n} ${n === 1 ? "kunde" : "kunder"}`;
}

/** Kort oppsummering av en brukers tilgang, til bruk i lister og toasts. */
export function describeMemberAccess(m: PartnerTeamMember): string {
  if (m.roles.length === 0) return "Medlem";
  return [
    "Medlem",
    ...m.roles.map(
      (r) => `${r} (${PARTNER_ACCESS_SHORT[m.roleAccess?.[r] ?? "read"]}, ${describeRoleScope(m, r)})`,
    ),
  ].join(" · ");
}

/** Gjelder rollen for denne kunden? */
export function hasRoleForCustomer(
  m: PartnerTeamMember,
  role: PartnerRole,
  customerId: string,
): boolean {
  if (!m.roles.includes(role)) return false;
  const scope = m.roleScope?.[role] ?? "all";
  return scope === "all" || (m.roleCustomerIds?.[role] ?? []).includes(customerId);
}

/** Kan brukeren jobbe i denne kundens virksomhetsprofil? */
export function canOperateCustomer(m: PartnerTeamMember, customerId: string): boolean {
  return hasRoleForCustomer(m, "Driftspartner", customerId);
}

/** Eier brukeren kunderelasjonen for denne kunden? */
export function canManageCustomer(m: PartnerTeamMember, customerId: string): boolean {
  return hasRoleForCustomer(m, "Kundeansvarlig", customerId);
}

/**
 * Tildeler en rolle for én bestemt kunde (fra kundekortet).
 * Muterer demo-teamet, lagrer i localStorage og varsler åpne visninger.
 */
export function assignRoleForCustomer(
  memberId: string,
  role: PartnerRole,
  customerId: string,
): void {
  const member = PARTNER_TEAM.find((m) => m.id === memberId);
  if (!member) return;
  if (!member.roles.includes(role)) member.roles = [...member.roles, role];
  if ((member.roleScope?.[role] ?? "all") !== "all") {
    const ids = member.roleCustomerIds?.[role] ?? [];
    if (!ids.includes(customerId)) {
      member.roleCustomerIds = { ...member.roleCustomerIds, [role]: [...ids, customerId] };
    }
  }
  const map = readRoleMap();
  map[customerId] = { ...(map[customerId] ?? {}), [role]: member.name };
  localStorage.setItem(ROLE_STORAGE_KEY, JSON.stringify(map));
  window.dispatchEvent(
    new CustomEvent("msp-customer-role-changed", { detail: { customerId, role, name: member.name } }),
  );
}

const ROLE_STORAGE_KEY = "msp-customer-role-assignments-v1";
type RoleMap = Record<string, Partial<Record<PartnerRole, string>>>;

function readRoleMap(): RoleMap {
  try {
    const raw = localStorage.getItem(ROLE_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as RoleMap) : {};
  } catch {
    return {};
  }
}

/** Hvem er tildelt denne rollen for kunden (satt fra kundekortet)? */
export function getCustomerRoleAssignment(customerId: string, role: PartnerRole): string | null {
  return readRoleMap()[customerId]?.[role] ?? null;
}

export const PARTNER_TEAM: PartnerTeamMember[] = [
  { id: "u1", name: "Truls Berg",   email: "truls@dintero.no", roles: ["Kundeansvarlig"],                  roleAccess: { Kundeansvarlig: "write", Driftspartner: "read" },  roleScope: { Kundeansvarlig: "all", Driftspartner: "all" },           roleCustomerIds: { Kundeansvarlig: [], Driftspartner: [] }, initials: "TB" },
  { id: "u2", name: "Maja Solheim", email: "maja@dintero.no",  roles: ["Kundeansvarlig", "Driftspartner"], roleAccess: { Kundeansvarlig: "write", Driftspartner: "write" }, roleScope: { Kundeansvarlig: "selected", Driftspartner: "all" },      roleCustomerIds: { Kundeansvarlig: [], Driftspartner: [] }, initials: "MS" },
  { id: "u3", name: "Erik Hansen",  email: "erik@dintero.no",  roles: ["Driftspartner"],                   roleAccess: { Kundeansvarlig: "read", Driftspartner: "read" },   roleScope: { Kundeansvarlig: "all", Driftspartner: "selected" },      roleCustomerIds: { Kundeansvarlig: [], Driftspartner: [] }, initials: "EH" },
];



const STORAGE_KEY = "msp-account-manager-overrides-v1";

type OverrideMap = Record<string, string>; // customerId -> member name

function readMap(): OverrideMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as OverrideMap) : {};
  } catch {
    return {};
  }
}

export function getAccountManagerOverride(customerId: string): string | null {
  return readMap()[customerId] ?? null;
}

export function setAccountManagerOverride(customerId: string, name: string): void {
  const map = readMap();
  map[customerId] = name;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  window.dispatchEvent(new CustomEvent("msp-account-manager-changed", { detail: { customerId, name } }));
}
