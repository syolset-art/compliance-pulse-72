// Shared partner team data. Demo only — erstattes med user_roles-spørring
// når invitasjonsflyt er på plass.

export type PartnerRole = "Kundeansvarlig" | "Driftspartner";
/** Lesetilgang eller full lese- og skrivetilgang hos kundene. */
export type PartnerAccess = "read" | "write";

export interface PartnerTeamMember {
  id: string;
  name: string;
  email: string;
  role: PartnerRole;
  access: PartnerAccess;
  initials: string;
}

export const PARTNER_ROLE_DESC: Record<PartnerRole, string> = {
  Kundeansvarlig: "Eier kunderelasjonen: portefølje, tilbud og meldinger.",
  Driftspartner: "Utfører compliance-arbeid i kundens virksomhetsprofil.",
};

export const PARTNER_ACCESS_LABEL: Record<PartnerAccess, string> = {
  read: "Kun lesetilgang",
  write: "Lese- og skrivetilgang",
};

export const PARTNER_TEAM: PartnerTeamMember[] = [
  { id: "u1", name: "Truls Berg",    email: "truls@dintero.no", role: "Kundeansvarlig", access: "write", initials: "TB" },
  { id: "u2", name: "Maja Solheim",  email: "maja@dintero.no",  role: "Driftspartner",  access: "write", initials: "MS" },
  { id: "u3", name: "Erik Hansen",   email: "erik@dintero.no",  role: "Kundeansvarlig", access: "read",  initials: "EH" },
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
