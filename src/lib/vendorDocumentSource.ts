/**
 * Proveniens for leverandørdokumentasjon.
 * Mapper `vendor_documents.source` til fire kilder brukeren forstår:
 *  - uploaded    : lastet opp manuelt av deg
 *  - agent       : hentet av lokal agent (Sara) i egen infrastruktur
 *  - vendor      : sendt inn av leverandøren (portal / e-post), ofte etter forespørsel
 *  - trustEngine : hentet automatisk fra leverandørens Trust Profile
 */

export type DocSourceKey = "uploaded" | "agent" | "vendor" | "trustEngine";

export const DOC_SOURCE_ORDER: DocSourceKey[] = ["uploaded", "agent", "vendor", "trustEngine"];

export function resolveDocSource(rawSource?: string | null): DocSourceKey {
  const s = (rawSource || "").toLowerCase();
  if (s === "local_agent" || s === "sara" || s === "sara_agent" || s === "agent") return "agent";
  if (s === "trust_engine" || s === "trust_profile") return "trustEngine";
  if (s === "vendor_portal" || s === "email_inbox" || s === "vendor") return "vendor";
  return "uploaded";
}

export function docSourceLabel(key: DocSourceKey, isNb: boolean): string {
  const nb: Record<DocSourceKey, string> = {
    uploaded: "Lastet opp",
    agent: "Fra agent",
    vendor: "Fra leverandør",
    trustEngine: "Fra Trust Engine",
  };
  const en: Record<DocSourceKey, string> = {
    uploaded: "Uploaded",
    agent: "From agent",
    vendor: "From vendor",
    trustEngine: "From Trust Engine",
  };
  return isNb ? nb[key] : en[key];
}

export function docSourceTooltip(key: DocSourceKey, isNb: boolean): string {
  const nb: Record<DocSourceKey, string> = {
    uploaded: "Lastet opp manuelt av din organisasjon",
    agent: "Hentet av den lokale agenten Sara fra egne kilder – kun underlaget, ikke hele dokumentet",
    vendor: "Sendt inn av leverandøren, som svar på en forespørsel",
    trustEngine: "Hentet automatisk fra leverandørens Trust Profile i Mynder Trust Engine",
  };
  const en: Record<DocSourceKey, string> = {
    uploaded: "Uploaded manually by your organisation",
    agent: "Collected by the local Sara agent from your own sources – only the record, not the full file",
    vendor: "Submitted by the vendor in response to a request",
    trustEngine: "Retrieved automatically from the vendor's Trust Profile in Mynder Trust Engine",
  };
  return isNb ? nb[key] : en[key];
}

export interface DocCoverage {
  total: number;
  valid: number;
  expiring: number;
  expired: number;
  bySource: Record<DocSourceKey, number>;
}

const DAY = 1000 * 60 * 60 * 24;

export function computeDocCoverage(docs: any[]): DocCoverage {
  const bySource: Record<DocSourceKey, number> = { uploaded: 0, agent: 0, vendor: 0, trustEngine: 0 };
  let valid = 0;
  let expiring = 0;
  let expired = 0;

  for (const d of docs) {
    bySource[resolveDocSource(d.source)] += 1;
    const to = d.valid_to ? new Date(d.valid_to).getTime() : null;
    if (d.status === "expired" || (to !== null && to < Date.now())) {
      expired += 1;
    } else if (to !== null && to - Date.now() <= 30 * DAY) {
      expiring += 1;
    } else {
      valid += 1;
    }
  }

  return { total: docs.length, valid, expiring, expired, bySource };
}

/** Intern = produsert/hentet i egen organisasjon. Ekstern = mottatt fra leverandør/tredjepart. */
export type DocOrigin = "internal" | "external";

export function resolveDocOrigin(rawSource?: string | null): DocOrigin {
  const key = resolveDocSource(rawSource);
  return key === "uploaded" || key === "agent" ? "internal" : "external";
}

export function docOriginLabel(origin: DocOrigin, isNb: boolean): string {
  if (origin === "internal") return isNb ? "Intern" : "Internal";
  return isNb ? "Ekstern" : "External";
}
