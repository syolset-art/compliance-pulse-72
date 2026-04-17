// ─── Plan-based business model ───────────────────────────────────────
// Three clear subscription plans + per-framework add-ons.
// No more credits packages or pay-per-use messaging.

export type BillingInterval = "monthly" | "yearly";

export type PlanId = "starter" | "professional" | "enterprise";

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
      "Lara AI (grunnleggende)",
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
    popular: true,
    ctaLabel: "Velg Profesjonell",
    features: [
      "Ubegrensede arbeidsområder",
      "Ubegrenset leverandører og systemer",
      "Lara AI ubegrenset",
      "Slette-agent inkludert",
      "3 regelverk inkludert",
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

export const ORDERED_PLANS: PlanId[] = ["starter", "professional", "enterprise"];

// ─── Plan-level add-ons ─────────────────────────────────────────────

export const EXTRA_WORK_AREA_PRICE_KR = 190; // /mnd, only on Starter
export const EXTRA_FRAMEWORK_PRICE_KR = 290; // /mnd per framework

// ─── Framework add-on pricing (kept as-is) ──────────────────────────

export const FREE_FRAMEWORKS = ["gdpr", "iso27001"] as const;

export interface FrameworkAddon {
  id: string;
  name: string;
  yearlyPriceKr: number;
  includes: string[];
}

export const FRAMEWORK_ADDONS: Record<string, FrameworkAddon> = {
  nis2: { id: "nis2", name: "NIS2", yearlyPriceKr: 50000, includes: ["Gap-analyse", "Tiltaksliste", "Modenhetsvurdering", "Rapportdeling"] },
  dora: { id: "dora", name: "DORA", yearlyPriceKr: 50000, includes: ["Gap-analyse", "Tiltaksliste", "Modenhetsvurdering", "Rapportdeling"] },
  apenhetsloven: { id: "apenhetsloven", name: "Åpenhetsloven", yearlyPriceKr: 50000, includes: ["Gap-analyse", "Tiltaksliste", "Modenhetsvurdering", "Rapportdeling"] },
  "ai-act": { id: "ai-act", name: "EU AI Act", yearlyPriceKr: 50000, includes: ["Gap-analyse", "Tiltaksliste", "Modenhetsvurdering", "Rapportdeling"] },
  cra: { id: "cra", name: "CRA", yearlyPriceKr: 50000, includes: ["Gap-analyse", "Tiltaksliste", "Modenhetsvurdering", "Rapportdeling"] },
  transparency_act: { id: "transparency_act", name: "Åpenhetsloven", yearlyPriceKr: 50000, includes: ["Gap-analyse", "Tiltaksliste", "Modenhetsvurdering", "Rapportdeling"] },
  ai_act: { id: "ai_act", name: "EU AI Act", yearlyPriceKr: 50000, includes: ["Gap-analyse", "Tiltaksliste", "Modenhetsvurdering", "Rapportdeling"] },
};

// ─── Free inclusions (used in marketing copy) ───────────────────────

export const FREE_INCLUSIONS = [
  "Trust Center (alle undermenyer)",
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
  const yearly = getFrameworkYearlyPrice(frameworkId);
  return yearly > 0 ? Math.round(yearly / 12) : 0;
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
