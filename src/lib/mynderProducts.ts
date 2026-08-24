import { CORE_TIERS, VENDOR_TIERS, TRUST_CENTER_PRICE_KR, EXTRA_FRAMEWORK_PRICE_KR } from "@/lib/planConstants";
import type { ModuleKey } from "@/lib/moduleInfo";

export interface MynderProduct {
  id: string;
  moduleKey: ModuleKey;
  name: string;
  commissionPct: number;
  fromPrice: number;
  tiers: Array<{ label: string; priceKr: number; isFree?: boolean }>;
}


export const MYNDER_PRODUCTS: MynderProduct[] = [
  {
    id: "core",
    moduleKey: "core",
    name: "Core",
    commissionPct: 30,
    // Core har ingen gratisversjon — fra-pris er første betalte nivå (995 kr/mnd).
    fromPrice: CORE_TIERS.find((t) => !t.isFree)?.monthlyPriceKr ?? 0,
    tiers: CORE_TIERS.filter((t) => !t.isFree).map((t) => ({ label: t.label, priceKr: t.monthlyPriceKr })),
  },
  {
    id: "vendors",
    moduleKey: "vendors",
    name: "Leverandørmodulen",
    commissionPct: 30,
    fromPrice: VENDOR_TIERS[1].monthlyPriceKr,
    tiers: VENDOR_TIERS.map((t) => ({ label: t.label, priceKr: t.monthlyPriceKr, isFree: t.isFree })),
  },
  {
    id: "assets",
    moduleKey: "assets",
    name: "Eiendeler",
    commissionPct: 25,
    fromPrice: 490,
    tiers: [{ label: "Standard", priceKr: 490 }],
  },
  {
    id: "frameworks",
    moduleKey: "frameworks",
    name: "Regelverk",
    commissionPct: 30,
    fromPrice: 0,
    tiers: [
      { label: "Basis (GDPR/ISO 27001)", priceKr: 0, isFree: true },
      { label: "Per regelverk", priceKr: EXTRA_FRAMEWORK_PRICE_KR },
    ],
  },
  {
    id: "deviations",
    moduleKey: "deviations",
    name: "Avviksregister",
    commissionPct: 25,
    fromPrice: 490,
    tiers: [{ label: "Standard", priceKr: 490 }],
  },
  {
    id: "trust",
    moduleKey: "trust",
    name: "Trust Center",
    commissionPct: 30,
    fromPrice: TRUST_CENTER_PRICE_KR,
    tiers: [{ label: "Standard", priceKr: TRUST_CENTER_PRICE_KR }],
  },
];
