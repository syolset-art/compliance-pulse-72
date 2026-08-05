// Lokal stegstatus for Trust Center-oppsett hos en MSP-kunde.
// Trust Center har ingen nivåer — kunden får ett Trust Center, og oppsettet
// følger en fast rekkefølge: aktivering → claim sendt → claimet → publisert.

export type TrustCenterStep = "activated" | "claimSent" | "claimed" | "published";

export interface TrustCenterState {
  /** ISO-dato for når claim-e-posten sist ble sendt. */
  claimSentAt?: string;
  /** ISO-dato for når kunden claimet profilen. */
  claimedAt?: string;
  /** ISO-dato for når Trust Center ble publisert. */
  publishedAt?: string;
}

export type TrustCenterStatus =
  | "inactive"
  | "activated"
  | "claimSent"
  | "claimed"
  | "published";

const KEY = (customerId: string) => `msp.customer.trustCenter.${customerId}`;
/** Beholdes for bakoverkompatibilitet med tidligere claim-markering. */
export const claimSentKey = (customerId: string) =>
  `msp.customer.trustClaimSent.${customerId}`;

export const TRUST_CENTER_EVENT = "trustcenter:changed";

function emit() {
  window.dispatchEvent(new CustomEvent(TRUST_CENTER_EVENT));
}

export function getTrustCenterState(customerId: string): TrustCenterState {
  try {
    const raw = window.localStorage.getItem(KEY(customerId));
    const parsed: TrustCenterState = raw ? JSON.parse(raw) : {};
    if (!parsed.claimSentAt) {
      const legacy = window.localStorage.getItem(claimSentKey(customerId));
      if (legacy) parsed.claimSentAt = legacy;
    }
    return parsed;
  } catch {
    return {};
  }
}

function setTrustCenterState(customerId: string, patch: Partial<TrustCenterState>) {
  const next = { ...getTrustCenterState(customerId), ...patch };
  try {
    window.localStorage.setItem(KEY(customerId), JSON.stringify(next));
  } catch {}
  emit();
  return next;
}

export function markClaimSent(customerId: string) {
  const now = new Date().toISOString();
  try {
    window.localStorage.setItem(claimSentKey(customerId), now);
  } catch {}
  return setTrustCenterState(customerId, { claimSentAt: now });
}

export function markClaimed(customerId: string) {
  return setTrustCenterState(customerId, { claimedAt: new Date().toISOString() });
}

export function markPublished(customerId: string) {
  return setTrustCenterState(customerId, { publishedAt: new Date().toISOString() });
}

export function resetTrustCenterState(customerId: string) {
  try {
    window.localStorage.removeItem(KEY(customerId));
    window.localStorage.removeItem(claimSentKey(customerId));
  } catch {}
  emit();
}

export function trustCenterStatusFor(
  customerId: string,
  isActive: boolean,
): TrustCenterStatus {
  if (!isActive) return "inactive";
  const s = getTrustCenterState(customerId);
  if (s.publishedAt) return "published";
  if (s.claimedAt) return "claimed";
  if (s.claimSentAt) return "claimSent";
  return "activated";
}

export const TRUST_CENTER_STATUS_LABEL: Record<TrustCenterStatus, string> = {
  inactive: "Ikke aktivert",
  activated: "Aktivert – claim ikke sendt",
  claimSent: "Claim sendt – venter på kunden",
  claimed: "Claimet av kunden",
  published: "Trust Center publisert",
};

export const TRUST_CENTER_NEXT_STEP: Record<TrustCenterStatus, string | null> = {
  inactive: "Neste: aktiver Trust Center",
  activated: "Neste: send claim-e-post til kunden",
  claimSent: "Neste: kunden godkjenner claim",
  claimed: "Neste: fyll ut Trust Profilen og publiser",
  published: null,
};

export function formatTrustDate(iso?: string): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("nb-NO", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
