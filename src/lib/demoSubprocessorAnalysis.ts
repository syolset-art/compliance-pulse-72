// Demo Lara-analysis of a subprocessor list. Matches names against VENDOR_CATALOG
// and returns a clean, sortable list for the Trust Profile.

import { VENDOR_CATALOG, type VendorDpaType } from "./vendorCatalog";

export type AnalyzedSubprocessor = {
  name: string;
  category: string;
  country?: string;
  hasTrustProfile: boolean;
  trustProfileScore?: number; // 0–100 when present in Mynder
  dpaType: VendorDpaType | "unknown";
  source: "matched" | "unmatched";
};

export type SubprocessorListData = {
  source: "upload" | "url";
  fileName?: string;
  url?: string;
  analyzedAt: string;
  vendors: AnalyzedSubprocessor[];
};

/** Vendor names (case-insensitive contains) that should be flagged as having a Trust Profile in Mynder. */
const TP_NAMES = new Set(
  [
    "Microsoft 365",
    "Microsoft Azure",
    "Google Workspace",
    "Amazon Web Services (AWS)",
    "Stripe",
    "HubSpot",
    "Salesforce",
    "Zendesk",
    "Intercom",
    "Atlassian (Jira / Confluence)",
    "GitHub",
    "Slack",
    "Notion",
    "Figma",
    "Zoom",
    "Adobe Creative Cloud",
  ].map((s) => s.toLowerCase()),
);

const COUNTRY_BY_NAME: Record<string, string> = {
  "microsoft 365": "IE",
  "microsoft azure": "IE",
  "google workspace": "IE",
  "amazon web services (aws)": "IE",
  stripe: "IE",
  hubspot: "US",
  salesforce: "US",
  zendesk: "US",
  intercom: "US",
  "atlassian (jira / confluence)": "AU",
  github: "US",
  slack: "US",
  notion: "US",
  figma: "US",
  zoom: "US",
  "adobe creative cloud": "US",
  tripletex: "NO",
  fiken: "NO",
  "visma eaccounting": "NO",
  "visma lønn": "NO",
  "poweroffice go": "NO",
  vipps: "NO",
  dropbox: "US",
  mailchimp: "US",
  linkedin: "US",
};

function scoreFromName(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return 72 + (h % 23); // 72–94
}

function matchVendor(rawName: string): AnalyzedSubprocessor {
  const name = rawName.trim();
  const lower = name.toLowerCase();
  const hit = VENDOR_CATALOG.find(
    (v) => v.name.toLowerCase() === lower || lower.includes(v.name.toLowerCase()) || v.name.toLowerCase().includes(lower),
  );
  if (hit) {
    const hasTp = TP_NAMES.has(hit.name.toLowerCase());
    return {
      name: hit.name,
      category: hit.category,
      country: COUNTRY_BY_NAME[hit.name.toLowerCase()],
      hasTrustProfile: hasTp,
      trustProfileScore: hasTp ? scoreFromName(hit.name) : undefined,
      dpaType: hit.dpaType,
      source: "matched",
    };
  }
  return {
    name,
    category: "Ukjent",
    country: undefined,
    hasTrustProfile: false,
    dpaType: "unknown",
    source: "unmatched",
  };
}

/** Mock list returned for non-CSV uploads / URL fetches in demo mode. */
const MOCK_FALLBACK = [
  "Microsoft 365",
  "Google Workspace",
  "Amazon Web Services (AWS)",
  "Stripe",
  "HubSpot",
  "Slack",
  "Atlassian (Jira / Confluence)",
  "GitHub",
  "Mailchimp",
  "Zoom",
  "Tripletex",
  "Lokal Driftspartner AS",
];

function parseCsvLike(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.split(/[,;]/)[0].trim())
    .filter((s) => s.length > 0 && !/^name|leverand/i.test(s))
    .slice(0, 50);
}

export async function analyzeSubprocessorFile(file: File): Promise<AnalyzedSubprocessor[]> {
  await new Promise((r) => setTimeout(r, 900)); // simulate Lara thinking
  const isCsv = /\.csv$/i.test(file.name) || file.type.includes("csv");
  let names: string[];
  if (isCsv) {
    try {
      const text = await file.text();
      const parsed = parseCsvLike(text);
      names = parsed.length > 0 ? parsed : MOCK_FALLBACK;
    } catch {
      names = MOCK_FALLBACK;
    }
  } else {
    names = MOCK_FALLBACK;
  }
  return names.map(matchVendor);
}

export async function analyzeSubprocessorUrl(_url: string): Promise<AnalyzedSubprocessor[]> {
  await new Promise((r) => setTimeout(r, 1100));
  return MOCK_FALLBACK.map(matchVendor);
}
