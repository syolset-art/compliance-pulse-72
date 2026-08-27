// Demo data for Mynder Admin Dashboard (intern eier-visning)

export type PlanTier = "Starter" | "Pro" | "Business" | "Enterprise";
export type BillingStatus = "ok" | "missing" | "pending";
export type SalesChannel = "direct" | "partner";
export type PartnerType = "MSP" | "MSSP" | "Konsulent" | "Reseller";

export interface PartnerRow {
  id: string;
  name: string;
  type: PartnerType;
  country: string;
  since: string;
  contactEmail: string;
  commissionPct: number;
}

export interface CustomerRow {
  id: string;
  country: string;
  name: string;
  industry: string;
  plan: PlanTier;
  modules: string[];
  frameworks: string[];
  users: number;
  systems: number;
  vendors: number;
  mrrNok: number;
  billing: BillingStatus;
  since: string;
  salesChannel: SalesChannel;
  partnerId?: string;
}

export const PARTNERS: PartnerRow[] = [
  { id: "p1", name: "Bouvet", type: "Konsulent", country: "NO", since: "2023-09-01", contactEmail: "partner@bouvet.no", commissionPct: 20 },
  { id: "p2", name: "Sopra Steria", type: "MSSP", country: "NO", since: "2023-11-12", contactEmail: "mynder@soprasteria.no", commissionPct: 25 },
  { id: "p3", name: "Atea Managed", type: "MSP", country: "NO", since: "2024-02-04", contactEmail: "msp@atea.no", commissionPct: 22 },
  { id: "p4", name: "Visma Advisory", type: "Reseller", country: "SE", since: "2024-05-18", contactEmail: "channel@visma.com", commissionPct: 15 },
];

export const CUSTOMERS: CustomerRow[] = [
  // Partner-solgte
  { id: "c1", country: "NO", name: "Nordic Energy AS", industry: "Energi", plan: "Enterprise", modules: ["Vendors", "Systems", "Assets"], frameworks: ["ISO 27001", "NIS2", "GDPR"], users: 42, systems: 86, vendors: 142, mrrNok: 9800, billing: "ok", since: "2024-01-15", salesChannel: "partner", partnerId: "p2" },
  { id: "c2", country: "NO", name: "Fjord Helse", industry: "Helse", plan: "Business", modules: ["Vendors", "Systems"], frameworks: ["GDPR", "Normen"], users: 18, systems: 34, vendors: 58, mrrNok: 4900, billing: "ok", since: "2024-03-02", salesChannel: "partner", partnerId: "p1" },
  { id: "c3", country: "NO", name: "Bergen Logistikk", industry: "Logistikk", plan: "Pro", modules: ["Vendors"], frameworks: ["GDPR"], users: 9, systems: 12, vendors: 27, mrrNok: 1990, billing: "pending", since: "2024-05-21", salesChannel: "partner", partnerId: "p3" },
  { id: "c4", country: "NO", name: "Oslo Advokatfirma", industry: "Juridisk", plan: "Business", modules: ["Vendors", "Assets"], frameworks: ["GDPR", "Hvitvasking"], users: 14, systems: 22, vendors: 41, mrrNok: 4900, billing: "ok", since: "2024-02-11", salesChannel: "partner", partnerId: "p1" },
  { id: "c5", country: "NO", name: "Tromsø Tech", industry: "IT", plan: "Starter", modules: ["Vendors"], frameworks: ["GDPR"], users: 4, systems: 6, vendors: 11, mrrNok: 990, billing: "missing", since: "2024-09-08", salesChannel: "partner", partnerId: "p3" },
  { id: "c6", country: "SE", name: "Malmö Industri", industry: "Industri", plan: "Pro", modules: ["Vendors", "Systems"], frameworks: ["ISO 27001", "GDPR"], users: 11, systems: 18, vendors: 33, mrrNok: 2490, billing: "ok", since: "2024-04-30", salesChannel: "partner", partnerId: "p4" },
  { id: "c7", country: "SE", name: "Göteborg Bygg", industry: "Bygg", plan: "Starter", modules: ["Vendors"], frameworks: ["GDPR"], users: 6, systems: 8, vendors: 14, mrrNok: 990, billing: "ok", since: "2024-10-04", salesChannel: "partner", partnerId: "p4" },
  { id: "c8", country: "NO", name: "Kystverket Maritim", industry: "Offentlig", plan: "Enterprise", modules: ["Vendors", "Systems", "Assets"], frameworks: ["NIS2", "ISO 27001", "GDPR", "DORA"], users: 67, systems: 124, vendors: 198, mrrNok: 14800, billing: "ok", since: "2023-11-04", salesChannel: "partner", partnerId: "p2" },

  // Direkte-solgte
  { id: "d1", country: "NO", name: "Aurora Biotech", industry: "Helse", plan: "Business", modules: ["Vendors", "Systems"], frameworks: ["GDPR", "ISO 27001"], users: 22, systems: 28, vendors: 47, mrrNok: 4900, billing: "ok", since: "2024-01-22", salesChannel: "direct" },
  { id: "d2", country: "NO", name: "Sognefjord Forsikring", industry: "Finans", plan: "Enterprise", modules: ["Vendors", "Systems", "Assets"], frameworks: ["DORA", "ISO 27001", "GDPR"], users: 54, systems: 96, vendors: 173, mrrNok: 12900, billing: "ok", since: "2023-08-14", salesChannel: "direct" },
  { id: "d3", country: "NO", name: "Hadeland Mat AS", industry: "Næringsmiddel", plan: "Pro", modules: ["Vendors"], frameworks: ["GDPR", "HACCP"], users: 12, systems: 16, vendors: 38, mrrNok: 1990, billing: "ok", since: "2024-06-12", salesChannel: "direct" },
  { id: "d4", country: "DK", name: "København Reklame", industry: "Marked", plan: "Starter", modules: ["Vendors"], frameworks: ["GDPR"], users: 5, systems: 7, vendors: 12, mrrNok: 990, billing: "pending", since: "2024-11-01", salesChannel: "direct" },
  { id: "d5", country: "NO", name: "Lofoten Reiseliv", industry: "Reiseliv", plan: "Pro", modules: ["Vendors", "Systems"], frameworks: ["GDPR"], users: 8, systems: 14, vendors: 22, mrrNok: 2490, billing: "ok", since: "2024-07-08", salesChannel: "direct" },
  { id: "d6", country: "NO", name: "Skien Skole AS", industry: "Utdanning", plan: "Business", modules: ["Vendors", "Systems"], frameworks: ["GDPR", "Utdanningsloven"], users: 19, systems: 31, vendors: 44, mrrNok: 4900, billing: "missing", since: "2024-03-19", salesChannel: "direct" },
];

export const PLAN_META: Record<PlanTier, { color: string; price: number }> = {
  Starter: { color: "bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-500/15 dark:text-sky-300 dark:border-sky-500/30", price: 990 },
  Pro: { color: "bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-500/15 dark:text-violet-300 dark:border-violet-500/30", price: 1990 },
  Business: { color: "bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200 dark:bg-fuchsia-500/15 dark:text-fuchsia-300 dark:border-fuchsia-500/30", price: 4900 },
  Enterprise: { color: "bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-white border-transparent", price: 9800 },
};

export const PARTNER_TYPE_COLOR: Record<PartnerType, string> = {
  MSP: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30",
  MSSP: "bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-500/15 dark:text-indigo-300 dark:border-indigo-500/30",
  Konsulent: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30",
  Reseller: "bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-500/15 dark:text-sky-300 dark:border-sky-500/30",
};

export const countryFlag = (cc: string) =>
  cc.toUpperCase().replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)));

/** MCP-produkter kunder kan koble seg til direkte hos Mynder. */
export type McpProductKey = "mynder-regulation" | "canvas-regulation";

export const MCP_PRODUCTS: Record<McpProductKey, { label: string; status: "live" | "coming"; description: string }> = {
  "mynder-regulation": {
    label: "Mynder Regulation",
    status: "live",
    description: "MCP-produkt som gir kundens egne agenter tilgang til regelverk og krav i Mynder.",
  },
  "canvas-regulation": {
    label: "Canvas Regulation",
    status: "coming",
    description: "MCP for kontinuerlig compliance innenfor aktiverte produkter. Under utvikling.",
  },
};

/** Demo: hvilke direktekunder som har koblet seg til hvilke MCP-produkter, og når. */
export const CUSTOMER_MCP: Record<string, { key: McpProductKey; since: string }[]> = {
  d1: [{ key: "mynder-regulation", since: "2025-11-04" }],
  d2: [
    { key: "mynder-regulation", since: "2025-09-18" },
    { key: "canvas-regulation", since: "2026-06-02" },
  ],
  d5: [{ key: "mynder-regulation", since: "2026-01-22" }],
};
