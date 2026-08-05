// ─── Plan-based business model ───────────────────────────────────────
// Three clear subscription plans + per-framework add-ons.
// No more credits packages or pay-per-use messaging.

export type BillingInterval = "monthly" | "yearly";

export type PlanId = "starter" | "growth" | "professional" | "enterprise";

// Legacy alias for backward compatibility with existing components/hooks
export type PlanTier = "free" | "basis" | "premium" | "enterprise";

export type ModuleId = "systems" | "vendors";

// ─── Plan definitions ────────────────────────────────────────────────

export interface PlanLimits {
  vendors: number;        // -1 = unlimited
  systems: number;        // -1 = unlimited
  workAreas: number;      // -1 = unlimited
  frameworksIncluded: number;
}

export interface Plan {
  id: PlanId;
  displayName: string;
  tagline: string;
  description: string;
  monthlyPriceKr: number;     // 0 = free, -1 = "contact sales"
  yearlyPriceKr: number;      // 0 = free, -1 = "contact sales"
  limits: PlanLimits;
  features: string[];
  popular?: boolean;
  ctaLabel: string;
}

export const PLANS: Record<PlanId, Plan> = {
  starter: {
    id: "starter",
    displayName: "Starter",
    tagline: "For å komme i gang",
    description: "Bygg en grunnleggende Trust Profile og kom i gang med samsvar.",
    monthlyPriceKr: 0,
    yearlyPriceKr: 0,
    limits: { vendors: 5, systems: 5, workAreas: 1, frameworksIncluded: 1 },
    ctaLabel: "Kom i gang gratis",
    features: [
      "1 arbeidsområde",
      "Inntil 5 leverandører",
      "Inntil 5 systemer",
      "Trust Profile (publiserbar)",
      "1 regelverk inkludert",
      "Avvikshåndtering (inntil 5 systemer)",
      "RoPA (inntil 5 systemer)",
      "Lara AI (grunnleggende)",
    ],

  },
  growth: {
    id: "growth",
    displayName: "Vekst",
    tagline: "For dere som vokser forbi 5",
    description: "Rom til å vokse med inntil 20 leverandører og systemer, uten å hoppe helt til ubegrenset.",
    monthlyPriceKr: 1990,
    yearlyPriceKr: 19900,
    limits: { vendors: 20, systems: 20, workAreas: 2, frameworksIncluded: 2 },
    popular: true,
    ctaLabel: "Velg Vekst",
    features: [
      "2 arbeidsområder",
      "Inntil 20 systemer",
      "Avvikshåndtering",
      "RoPA",
      "Lara AI (utvidet)",
      "Trust Profile (publiserbar)",
    ],

  },
  professional: {
    id: "professional",
    displayName: "Profesjonell",
    tagline: "For SMB som vil vokse trygt",
    description: "Full plattform med ubegrensede ressurser og alle agenter inkludert.",
    monthlyPriceKr: 2490,
    yearlyPriceKr: 24900,
    limits: { vendors: -1, systems: -1, workAreas: -1, frameworksIncluded: 3 },
    ctaLabel: "Velg\u00a0",
    features: [
      "Ubegrensede arbeidsområder",
      "Ubegrenset leverandører og systemer",
      "Lara AI ubegrenset",
      "PDF-eksport og deling",
    ],
  },
  enterprise: {
    id: "enterprise",
    displayName: "Enterprise",
    tagline: "For konsern og regulerte bransjer",
    description: "Skreddersydd for store virksomheter med dedikert support og SLA.",
    monthlyPriceKr: -1,
    yearlyPriceKr: -1,
    limits: { vendors: -1, systems: -1, workAreas: -1, frameworksIncluded: 999 },
    ctaLabel: "Ta kontakt",
    features: [
      "Alt i Profesjonell",
      "SSO / SAML",
      "DPA + BCP-bistand",
      "Dedikert kundekontakt",
      "SLA 99,9 %",
      "MSP-tilgang og custom regelverk",
      "API-tilgang",
    ],
  },
};

export const ORDERED_PLANS: PlanId[] = ["starter", "growth", "professional", "enterprise"];

// ─── Mynder Core module tiers ───────────────────────────────────────
// Mynder Core is its own module priced by system capacity.

export type CoreTierId = "tier_10" | "tier_20" | "tier_50" | "tier_100";

export interface CoreTier {
  id: CoreTierId;
  label: string;         // e.g. "Inntil 20 systemer"
  shortLabel: string;    // e.g. "Inntil 20"
  systemLimit: number;
  monthlyPriceKr: number;
  isFree?: boolean;
}

export const CORE_TIERS: CoreTier[] = [
  { id: "tier_10",   label: "Inntil 10 systemer",  shortLabel: "Inntil 10",  systemLimit: 10,  monthlyPriceKr: 995 },
  { id: "tier_20",   label: "Inntil 20 systemer",  shortLabel: "Inntil 20",  systemLimit: 20,  monthlyPriceKr: 1499 },
  { id: "tier_50",   label: "Inntil 50 systemer",  shortLabel: "Inntil 50",  systemLimit: 50,  monthlyPriceKr: 2499 },
  { id: "tier_100",  label: "Inntil 100 systemer", shortLabel: "Inntil 100", systemLimit: 100, monthlyPriceKr: 4999 },
];

export const DEFAULT_CORE_TIER_ID: CoreTierId = "tier_10";

export function getCoreTier(id: CoreTierId): CoreTier {
  return CORE_TIERS.find((t) => t.id === id) ?? CORE_TIERS[0];
}

export function getNextCoreTier(id: CoreTierId): CoreTier | null {
  const idx = CORE_TIERS.findIndex((t) => t.id === id);
  return idx >= 0 && idx < CORE_TIERS.length - 1 ? CORE_TIERS[idx + 1] : null;
}

// ─── Vendor module tiers ────────────────────────────────────────────
// Leverandørmodulen mirrors Core's model: free up to 5, then paid tiers.

export type VendorTierId = "vendor_free" | "vendor_20" | "vendor_50" | "vendor_100";

export interface VendorTier {
  id: VendorTierId;
  label: string;
  shortLabel: string;
  vendorLimit: number;
  monthlyPriceKr: number;
  isFree?: boolean;
}

export const VENDOR_TIERS: VendorTier[] = [
  { id: "vendor_free", label: "Inntil 5 leverandører",   shortLabel: "Inntil 5",   vendorLimit: 5,   monthlyPriceKr: 0,    isFree: true },
  { id: "vendor_20",   label: "Inntil 20 leverandører",  shortLabel: "Inntil 20",  vendorLimit: 20,  monthlyPriceKr: 1089 },
  { id: "vendor_50",   label: "Inntil 50 leverandører",  shortLabel: "Inntil 50",  vendorLimit: 50,  monthlyPriceKr: 1990 },
  { id: "vendor_100",  label: "Inntil 100 leverandører", shortLabel: "Inntil 100", vendorLimit: 100, monthlyPriceKr: 3990 },
];

export const DEFAULT_VENDOR_TIER_ID: VendorTierId = "vendor_free";

export function getVendorTier(id: VendorTierId): VendorTier {
  return VENDOR_TIERS.find((t) => t.id === id) ?? VENDOR_TIERS[0];
}

export function getNextVendorTier(id: VendorTierId): VendorTier | null {
  const idx = VENDOR_TIERS.findIndex((t) => t.id === id);
  return idx >= 0 && idx < VENDOR_TIERS.length - 1 ? VENDOR_TIERS[idx + 1] : null;
}


// ─── Plan-level add-ons ─────────────────────────────────────────────

export const EXTRA_WORK_AREA_PRICE_KR = 190; // /mnd, only on Starter
export const EXTRA_FRAMEWORK_PRICE_KR = 290; // /mnd per framework

// ─── Framework add-on pricing (kept as-is) ──────────────────────────

export const FREE_FRAMEWORKS = ["gdpr", "iso27001"] as const;

export interface FrameworkAddon {
  id: string;
  name: string;
  yearlyPriceKr: number;
  monthlyPriceKr: number;
  includes: string[];
}

export const FRAMEWORK_ADDONS: Record<string, FrameworkAddon> = {
  nis2: { id: "nis2", name: "NIS2", yearlyPriceKr: 4900, monthlyPriceKr: 490, includes: ["Gap-analyse", "Tiltaksliste", "Modenhetsvurdering", "Rapportdeling"] },
  dora: { id: "dora", name: "DORA", yearlyPriceKr: 8900, monthlyPriceKr: 890, includes: ["Gap-analyse", "Tiltaksliste", "Modenhetsvurdering", "Rapportdeling"] },
  apenhetsloven: { id: "apenhetsloven", name: "Åpenhetsloven", yearlyPriceKr: 4900, monthlyPriceKr: 490, includes: ["Gap-analyse", "Tiltaksliste", "Modenhetsvurdering", "Rapportdeling"] },
  "ai-act": { id: "ai-act", name: "EU AI Act", yearlyPriceKr: 8900, monthlyPriceKr: 890, includes: ["Gap-analyse", "Tiltaksliste", "Modenhetsvurdering", "Rapportdeling"] },
  cra: { id: "cra", name: "CRA", yearlyPriceKr: 4900, monthlyPriceKr: 490, includes: ["Gap-analyse", "Tiltaksliste", "Modenhetsvurdering", "Rapportdeling"] },
  transparency_act: { id: "transparency_act", name: "Åpenhetsloven", yearlyPriceKr: 4900, monthlyPriceKr: 490, includes: ["Gap-analyse", "Tiltaksliste", "Modenhetsvurdering", "Rapportdeling"] },
  ai_act: { id: "ai_act", name: "EU AI Act", yearlyPriceKr: 8900, monthlyPriceKr: 890, includes: ["Gap-analyse", "Tiltaksliste", "Modenhetsvurdering", "Rapportdeling"] },
};

// ─── Free inclusions (used in marketing copy) ───────────────────────

export const FREE_INCLUSIONS = [
  "Trust Profile-forhåndsvisning",
  "GDPR regelverk",
  "ISO 27001 regelverk",
  "Synlig i Mynder Trust Engine — bli enklere funnet av kunder og partnere",
] as const;

// ─── Helper functions ───────────────────────────────────────────────

export function getPlanPriceKr(planId: PlanId, interval: BillingInterval): number {
  const plan = PLANS[planId];
  return interval === "yearly" ? plan.yearlyPriceKr : plan.monthlyPriceKr;
}

export function getYearlySavingsKr(planId: PlanId): number {
  const plan = PLANS[planId];
  if (plan.monthlyPriceKr <= 0) return 0;
  return plan.monthlyPriceKr * 12 - plan.yearlyPriceKr;
}

export function isFrameworkFree(frameworkId: string): boolean {
  return (FREE_FRAMEWORKS as readonly string[]).includes(frameworkId);
}

export function getFrameworkYearlyPrice(frameworkId: string): number {
  if (isFrameworkFree(frameworkId)) return 0;
  return FRAMEWORK_ADDONS[frameworkId]?.yearlyPriceKr ?? 0;
}

export function getFrameworkMonthlyPrice(frameworkId: string): number {
  if (isFrameworkFree(frameworkId)) return 0;
  return FRAMEWORK_ADDONS[frameworkId]?.monthlyPriceKr ?? 0;
}


export function formatKr(amountKr: number): string {
  return new Intl.NumberFormat("nb-NO", {
    style: "currency",
    currency: "NOK",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amountKr);
}

export function formatOre(amountOre: number): string {
  return formatKr(amountOre / 100);
}

// ============================================================================
// LEGACY / BACKWARD-COMPAT EXPORTS
// Kept so existing components compile while we transition to plan-based UI.
// All credits-related concepts are now no-ops or map to the active plan.
// ============================================================================

/** @deprecated Use PlanId instead */
export interface PlanDefinition {
  id: PlanTier;
  displayName: string;
  description: string;
  maxSystems: number;
  maxVendors: number;
  monthly: number;
  yearly: number;
  includesWorkAreas: boolean;
  prioritySupport: boolean;
  monthlyCredits: number;
  includedModules: ModuleId[];
}

/** @deprecated Mapped onto new PLANS for backward compat */
export const PLAN_TIERS: Record<PlanTier, PlanDefinition> = {
  free: {
    id: "free", displayName: PLANS.starter.displayName, description: PLANS.starter.description,
    maxSystems: 5, maxVendors: 5, monthly: 0, yearly: 0,
    includesWorkAreas: false, prioritySupport: false,
    monthlyCredits: 9999, includedModules: [],
  },
  basis: {
    id: "basis", displayName: PLANS.professional.displayName, description: PLANS.professional.description,
    maxSystems: 9999, maxVendors: 9999, monthly: PLANS.professional.monthlyPriceKr, yearly: PLANS.professional.yearlyPriceKr,
    includesWorkAreas: true, prioritySupport: false,
    monthlyCredits: 9999, includedModules: ["systems", "vendors"],
  },
  premium: {
    id: "premium", displayName: PLANS.professional.displayName, description: PLANS.professional.description,
    maxSystems: 9999, maxVendors: 9999, monthly: PLANS.professional.monthlyPriceKr, yearly: PLANS.professional.yearlyPriceKr,
    includesWorkAreas: true, prioritySupport: true,
    monthlyCredits: 9999, includedModules: ["systems", "vendors"],
  },
  enterprise: {
    id: "enterprise", displayName: PLANS.enterprise.displayName, description: PLANS.enterprise.description,
    maxSystems: 9999, maxVendors: 9999, monthly: 0, yearly: 0,
    includesWorkAreas: true, prioritySupport: true,
    monthlyCredits: 9999, includedModules: ["systems", "vendors"],
  },
};

export const ORDERED_TIERS: PlanTier[] = ["free", "basis", "premium", "enterprise"];

/** @deprecated Map db plan name to PlanTier */
export function planNameToTier(name: string | undefined | null): PlanTier {
  if (!name) return "basis"; // default everyone to professional in demo
  const map: Record<string, PlanTier> = {
    free: "free", starter: "free",
    growth: "basis", vekst: "basis",
    basis: "basis", professional: "basis",
    premium: "premium", pro: "premium",
    enterprise: "enterprise",
  };
  return map[name.toLowerCase()] ?? "basis";
}

/** @deprecated kept for backward compat */
export function getPlanPrice(tier: PlanTier, interval: BillingInterval): number {
  const plan = PLAN_TIERS[tier];
  return interval === "yearly" ? plan.yearly : plan.monthly;
}

/** @deprecated kept for backward compat */
export function getAnnualSavingsKr(tier: PlanTier): number {
  const plan = PLAN_TIERS[tier];
  return plan.monthly * 2;
}

// ─── Deprecated module/credits exports (no-op stubs) ────────────────

/** @deprecated Modules are no longer separate purchases */
export interface ModuleDefinition {
  id: ModuleId;
  displayName: string;
  description: string;
  monthlyPriceKr: number;
  yearlyPriceKr: number;
  bonusCredits: number;
  features: string[];
  freeLimit: number;
  paidLimit: number;
}

/** @deprecated Modules are now included in Profesjonell plan */
export const MODULES: Record<ModuleId, ModuleDefinition> = {
  systems: {
    id: "systems", displayName: "Systemer", description: "Inkludert i Profesjonell-planen",
    monthlyPriceKr: 0, yearlyPriceKr: 0, bonusCredits: 0,
    freeLimit: 5, paidLimit: 9999,
    features: ["Inkludert i Profesjonell-planen"],
  },
  vendors: {
    id: "vendors", displayName: "Leverandørstyring", description: "Inkludert i Profesjonell-planen",
    monthlyPriceKr: 0, yearlyPriceKr: 0, bonusCredits: 0,
    freeLimit: 5, paidLimit: 9999,
    features: ["Inkludert i Profesjonell-planen"],
  },
};

/** @deprecated Modules are included in plans */
export function getModulePrice(_moduleId: ModuleId, _interval: BillingInterval): number {
  return 0;
}

/** @deprecated */
export function getModuleAnnualSavingsKr(_moduleId: ModuleId): number {
  return 0;
}

/** @deprecated Credits are no longer sold as packages */
export interface CreditPackage {
  id: string; name: string; credits: number; priceKr: number; popular?: boolean;
}

/** @deprecated Credits are no longer sold */
export const CREDIT_PACKAGES: CreditPackage[] = [];

export const BASE_FREE_CREDITS = 0;
