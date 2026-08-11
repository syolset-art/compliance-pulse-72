/**
 * Agentisk Trust Center for en leverandør.
 *
 * I stedet for å be om dokumentasjon én gang av gangen, inviteres leverandøren
 * til et eget trust center-rom. Lara ber om, validerer og fornyer dokumentasjon
 * løpende, slik at kunden slipper å purre.
 *
 * Prototypelagring: localStorage per assetId (samme mønster som
 * readFrameworkState/writeFrameworkState i vendorFrameworkSuggestions.ts).
 */

export type TrustCenterContactRole = "owner" | "contributor" | "viewer";

export interface TrustCenterContact {
  id: string;
  name: string;
  email: string;
  role: TrustCenterContactRole;
}

export type TrustCenterInterval = "quarterly" | "semiannual" | "annual";

export type TrustCenterStatus = "none" | "invited" | "active";

export interface AgenticTrustCenterState {
  status: TrustCenterStatus;
  contacts: TrustCenterContact[];
  /** documentType-verdier som trust centeret holder oppdatert. */
  requestedDocumentTypes: string[];
  interval: TrustCenterInterval;
  message?: string;
  /** ISO-dato. */
  invitedAt?: string;
  lastUpdatedAt?: string;
  remindedAt?: string;
  /** Antall dokumenter leverandøren har levert (prototype). */
  deliveredCount?: number;
  /** Delbar lenke leverandøren mottar. */
  link?: string;
}

export const EMPTY_TRUST_CENTER: AgenticTrustCenterState = {
  status: "none",
  contacts: [],
  requestedDocumentTypes: [],
  interval: "semiannual",
};

export const CONTACT_ROLE_LABEL: Record<TrustCenterContactRole, { nb: string; en: string }> = {
  owner: { nb: "Eier", en: "Owner" },
  contributor: { nb: "Bidragsyter", en: "Contributor" },
  viewer: { nb: "Kun lesetilgang", en: "Read only" },
};

export const INTERVAL_LABEL: Record<TrustCenterInterval, { nb: string; en: string }> = {
  quarterly: { nb: "Kvartalsvis", en: "Quarterly" },
  semiannual: { nb: "Halvårlig", en: "Semi-annually" },
  annual: { nb: "Årlig", en: "Annually" },
};

const KEY = (assetId: string) => `mynder_agentic_trust_center_${assetId}`;

export function readTrustCenterState(assetId: string): AgenticTrustCenterState {
  try {
    const raw = localStorage.getItem(KEY(assetId));
    if (!raw) return { ...EMPTY_TRUST_CENTER };
    const parsed = JSON.parse(raw);
    return { ...EMPTY_TRUST_CENTER, ...parsed };
  } catch {
    return { ...EMPTY_TRUST_CENTER };
  }
}

export function writeTrustCenterState(assetId: string, state: AgenticTrustCenterState) {
  try {
    localStorage.setItem(KEY(assetId), JSON.stringify(state));
  } catch {
    /* ignorer — kun preferanselagring */
  }
}

export function trustCenterLink(assetId: string) {
  return `${window.location.origin}/trust-center/leverandor/${assetId}`;
}

/** Dokumenttyper som dekkes løpende av trust centeret. */
export function coversDocumentType(state: AgenticTrustCenterState, documentType?: string) {
  if (!documentType) return false;
  if (state.status === "none") return false;
  return state.requestedDocumentTypes.includes(documentType);
}
