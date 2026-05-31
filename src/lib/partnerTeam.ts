// Shared partner team data. Demo only — erstattes med user_roles-spørring
// når invitasjonsflyt er på plass.

export interface PartnerTeamMember {
  id: string;
  name: string;
  email: string;
  role: "Partner-admin" | "Partner-rådgiver";
  initials: string;
}

export const PARTNER_TEAM: PartnerTeamMember[] = [
  { id: "u1", name: "Truls Berg",    email: "truls@dintero.no", role: "Partner-admin",    initials: "TB" },
  { id: "u2", name: "Maja Solheim",  email: "maja@dintero.no",  role: "Partner-rådgiver", initials: "MS" },
  { id: "u3", name: "Erik Hansen",   email: "erik@dintero.no",  role: "Partner-rådgiver", initials: "EH" },
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
