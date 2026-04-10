// ─── Unified pricing model ───────────────────────────────────────────

export type BillingInterval = "monthly" | "yearly";

export type PlanTier = "free" | "basis" | "premium" | "enterprise";

export interface PlanDefinition {
  id: PlanTier;
  displayName: string;
  maxSystems: number;
  maxVendors: number;
  monthly: number; // kr
  yearly: number; // kr
  includesWorkAreas: boolean;
  prioritySupport: boolean;
}

export const PLAN_TIERS: Record<PlanTier, PlanDefinition> = {
  free: {
    id: "free",
    displayName: "Gratis",
    maxSystems: 5,
    maxVendors: 5,
    monthly: 0,
    yearly: 0,
    includesWorkAreas: false,
    prioritySupport: false,
  },
  basis: {
    id: "basis",
    displayName: "Basis",
    maxSystems: 20,
    maxVendors: 20,
    monthly: 1490,
    yearly: 14900,
    includesWorkAreas: true,
    prioritySupport: false,
  },
  premium: {
    id: "premium",
    displayName: "Premium",
    maxSystems: 70,
    maxVendors: 70,
    monthly: 2490,
    yearly: 24900,
    includesWorkAreas: true,
    prioritySupport: true,
  },
  enterprise: {
    id: "enterprise",
    displayName: "Enterprise",
    maxSystems: 9999,
    maxVendors: 9999,
    monthly: 0,
    yearly: 0,
    includesWorkAreas: true,
    prioritySupport: true,
  },
};

export const ORDERED_TIERS: PlanTier[] = ["free", "basis", "premium", "enterprise"];

// ─── Framework add-on pricing ────────────────────────────────────────

export const FREE_FRAMEWORKS = ["gdpr", "iso27001"] as const;

export interface FrameworkAddon {
  id: string;
  name: string;
  yearlyPriceKr: number;
  includes: string[];
}

export const FRAMEWORK_ADDONS: Record<string, FrameworkAddon> = {
  nis2: {
    id: "nis2",
    name: "NIS2",
    yearlyPriceKr: 50000,
    includes: ["Gap-analyse", "Tiltaksliste", "Modenhetsvurdering", "Rapportdeling"],
  },
  dora: {
    id: "dora",
    name: "DORA",
    yearlyPriceKr: 50000,
    includes: ["Gap-analyse", "Tiltaksliste", "Modenhetsvurdering", "Rapportdeling"],
  },
  apenhetsloven: {
    id: "apenhetsloven",
    name: "Åpenhetsloven",
    yearlyPriceKr: 50000,
    includes: ["Gap-analyse", "Tiltaksliste", "Modenhetsvurdering", "Rapportdeling"],
  },
  "ai-act": {
    id: "ai-act",
    name: "EU AI Act",
    yearlyPriceKr: 50000,
    includes: ["Gap-analyse", "Tiltaksliste", "Modenhetsvurdering", "Rapportdeling"],
  },
  cra: {
    id: "cra",
    name: "CRA",
    yearlyPriceKr: 50000,
    includes: ["Gap-analyse", "Tiltaksliste", "Modenhetsvurdering", "Rapportdeling"],
  },
  // Legacy aliases
  transparency_act: {
    id: "transparency_act",
    name: "Åpenhetsloven",
    yearlyPriceKr: 50000,
    includes: ["Gap-analyse", "Tiltaksliste", "Modenhetsvurdering", "Rapportdeling"],
  },
  ai_act: {
    id: "ai_act",
    name: "EU AI Act",
    yearlyPriceKr: 50000,
    includes: ["Gap-analyse", "Tiltaksliste", "Modenhetsvurdering", "Rapportdeling"],
  },
};

// ─── Free inclusions ─────────────────────────────────────────────────

export const FREE_INCLUSIONS = [
  "Trust Center (alle undermenyer)",
  "GDPR regelverk",
  "ISO 27001 regelverk",
  "Inntil 5 systemer",
  "Inntil 5 leverandører",
] as const;

// ─── Helper functions ────────────────────────────────────────────────

export function getPlanPrice(tier: PlanTier, interval: BillingInterval): number {
  const plan = PLAN_TIERS[tier];
  return interval === "yearly" ? plan.yearly : plan.monthly;
}

export function getAnnualSavingsKr(tier: PlanTier): number {
  const plan = PLAN_TIERS[tier];
  return plan.monthly * 2; // 2 months free
}

export function isFrameworkFree(frameworkId: string): boolean {
  return (FREE_FRAMEWORKS as readonly string[]).includes(frameworkId);
}

export function getFrameworkYearlyPrice(frameworkId: string): number {
  if (isFrameworkFree(frameworkId)) return 0;
  return FRAMEWORK_ADDONS[frameworkId]?.yearlyPriceKr ?? 0;
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

/** Map DB plan name to PlanTier */
export function planNameToTier(name: string | undefined | null): PlanTier {
  if (!name) return "free";
  const map: Record<string, PlanTier> = {
    free: "free",
    starter: "free",
    basis: "basis",
    professional: "basis",
    premium: "premium",
    enterprise: "enterprise",
  };
  return map[name] ?? "free";
}
