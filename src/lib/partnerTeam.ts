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
  /** Gjelder kun for Driftspartner-rollen. */
  access: PartnerAccess;
  /** Gjelder kun for Driftspartner-rollen. */
  scope: PartnerScope;
  /** Kunde-ID-er når scope = "selected". */
  customerIds: string[];
  initials: string;
}

export const PARTNER_ROLE_DESC: Record<PartnerRole, string> = {
  Kundeansvarlig: "Eier kunderelasjonen: portefølje, tilbud og meldinger.",
  Driftspartner: "Utfører compliance-arbeid i kundens virksomhetsprofil.",
};

export const PARTNER_MEMBER_DESC =
  "Alle som inviteres blir medlem. Medlemmer ser partnerdelen og kundeoversikten, men jobber ikke inne hos kundene.";

export const PARTNER_ACCESS_LABEL: Record<PartnerAccess, string> = {
  read: "Kun lesetilgang",
  write: "Lese- og skrivetilgang",
};

export const PARTNER_SCOPE_LABEL: Record<PartnerScope, string> = {
  all: "Alle kunder",
  selected: "Valgte kunder",
};

/** Kort oppsummering av en brukers tilgang, til bruk i lister og toasts. */
export function describeMemberAccess(m: PartnerTeamMember): string {
  if (m.roles.length === 0) return "Medlem";
  const parts = ["Medlem", ...m.roles];
  if (m.roles.includes("Driftspartner")) {
    const scope =
      m.scope === "all"
        ? PARTNER_SCOPE_LABEL.all.toLowerCase()
        : `${m.customerIds.length} ${m.customerIds.length === 1 ? "kunde" : "kunder"}`;
    parts.push(`${PARTNER_ACCESS_LABEL[m.access].toLowerCase()} · ${scope}`);
  }
  return parts.join(" · ");
}

/** Kan brukeren jobbe i denne kundens virksomhetsprofil? */
export function canOperateCustomer(m: PartnerTeamMember, customerId: string): boolean {
  if (!m.roles.includes("Driftspartner")) return false;
  return m.scope === "all" || m.customerIds.includes(customerId);
}

export const PARTNER_TEAM: PartnerTeamMember[] = [
  { id: "u1", name: "Truls Berg",   email: "truls@dintero.no", roles: ["Kundeansvarlig"],                  access: "read",  scope: "all",      customerIds: [], initials: "TB" },
  { id: "u2", name: "Maja Solheim", email: "maja@dintero.no",  roles: ["Kundeansvarlig", "Driftspartner"], access: "write", scope: "all",      customerIds: [], initials: "MS" },
  { id: "u3", name: "Erik Hansen",  email: "erik@dintero.no",  roles: ["Driftspartner"],                   access: "read",  scope: "selected", customerIds: [], initials: "EH" },
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
