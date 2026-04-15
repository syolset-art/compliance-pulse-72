// ─── Credits-first business model ────────────────────────────────────

export type BillingInterval = "monthly" | "yearly";

export type PlanTier = "free" | "basis" | "premium" | "enterprise";

export type ModuleId = "systems" | "vendors";

// ─── Credit packages (one-time purchases) ────────────────────────────

export interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  priceKr: number;
  popular?: boolean;
}

export const CREDIT_PACKAGES: CreditPackage[] = [
  { id: "starter", name: "Starter", credits: 100, priceKr: 490 },
  { id: "standard", name: "Standard", credits: 300, priceKr: 990, popular: true },
  { id: "pro", name: "Pro", credits: 800, priceKr: 1990 },
];

// ─── Modules (optional monthly packages) ─────────────────────────────

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

export const MODULES: Record<ModuleId, ModuleDefinition> = {
  systems: {
    id: "systems",
    displayName: "Mynder Core",
    description: "Kjerneplattformen med systemer, arbeidsområder, oppgaver, risikovurdering og compliance-oversikt",
    monthlyPriceKr: 4900,
    yearlyPriceKr: 49000,
    bonusCredits: 50,
    freeLimit: 5,
    paidLimit: 70,
    features: [
      "Ubegrenset systemer",
      "Arbeidsområder",
      "Oppgaver og aktiviteter",
      "Risikovurdering",
      "Compliance-oversikt",
      "+50 credits/mnd inkludert",
    ],
  },
  vendors: {
    id: "vendors",
    displayName: "Leverandørstyring",
    description: "Komplett leverandørstyring med DPA-sporing, risikoanalyse, compliance-scoring og varsler",
    monthlyPriceKr: 4900,
    yearlyPriceKr: 49000,
    bonusCredits: 50,
    freeLimit: 5,
    paidLimit: 70,
    features: [
      "Ubegrenset leverandører",
      "Automatisk DPA-sporing",
      "Risikoanalyse",
      "Compliance-scoring",
      "Varsler ved utløp",
      "+50 credits/mnd inkludert",
    ],
  },
};

// ─── Legacy PlanTier support (backward compat) ──────────────────────

export interface PlanDefinition {
  id: PlanTier;
  displayName: string;
  maxSystems: number;
  maxVendors: number;
  monthly: number;
  yearly: number;
  includesWorkAreas: boolean;
  prioritySupport: boolean;
  monthlyCredits: number;
  includedModules: ModuleId[];
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
    monthlyCredits: 10,
    includedModules: [],
  },
  basis: {
    id: "basis",
    displayName: "Basis",
    maxSystems: 20,
    maxVendors: 20,
    monthly: 4900,
    yearly: 49000,
    includesWorkAreas: true,
    prioritySupport: false,
    monthlyCredits: 100,
    includedModules: ["systems"],
  },
  premium: {
    id: "premium",
    displayName: "Pro",
    maxSystems: 70,
    maxVendors: 70,
    monthly: 8900,
    yearly: 89000,
    includesWorkAreas: true,
    prioritySupport: true,
    monthlyCredits: 300,
    includedModules: ["systems", "vendors"],
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
    monthlyCredits: 999999,
    includedModules: ["systems", "vendors"],
  },
};

export const ORDERED_TIERS: PlanTier[] = ["free", "basis", "premium", "enterprise"];

// ─── Base free package ───────────────────────────────────────────────

export const BASE_FREE_CREDITS = 10;

export const FREE_INCLUSIONS = [
  "Trust Center (alle undermenyer)",
  "GDPR regelverk",
  "ISO 27001 regelverk",
  "10 credits/mnd",
  "Synlig i Mynder Trust Engine — bli enklere funnet av kunder og partnere",
] as const;

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

// ─── Helper functions ────────────────────────────────────────────────

export function getModulePrice(moduleId: ModuleId, interval: BillingInterval): number {
  const mod = MODULES[moduleId];
  return interval === "yearly" ? mod.yearlyPriceKr : mod.monthlyPriceKr;
}

export function getModuleAnnualSavingsKr(moduleId: ModuleId): number {
  const mod = MODULES[moduleId];
  return mod.monthlyPriceKr * 2; // 2 months free on yearly
}

export function getPlanPrice(tier: PlanTier, interval: BillingInterval): number {
  const plan = PLAN_TIERS[tier];
  return interval === "yearly" ? plan.yearly : plan.monthly;
}

export function getAnnualSavingsKr(tier: PlanTier): number {
  const plan = PLAN_TIERS[tier];
  return plan.monthly * 2;
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
