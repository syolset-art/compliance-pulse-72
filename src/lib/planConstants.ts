// ─── Unified module-based pricing model ──────────────────────────────

export type BillingInterval = "monthly" | "yearly";

export type ModuleTier = "basis" | "premium";

export type PlanTier = "free" | "basis" | "premium" | "enterprise";

export type ModuleId = "systems" | "vendors";

export interface ModuleDefinition {
  id: ModuleId;
  displayName: string;
  description: string;
  tiers: Record<ModuleTier, ModuleTierConfig>;
}

export interface ModuleTierConfig {
  maxItems: number;
  monthly: number; // kr
  yearly: number;  // kr
  features: string[];
}

export const MODULES: Record<ModuleId, ModuleDefinition> = {
  systems: {
    id: "systems",
    displayName: "Mynder Core",
    description: "Kjerneplattformen med systemer, arbeidsområder, oppgaver, risikovurdering og compliance-oversikt",
    tiers: {
      basis: {
        maxItems: 20,
        monthly: 1490,
        yearly: 14900,
        features: [
          "Inntil 20 systemer",
          "Arbeidsområder",
          "Oppgaver",
          "Risikovurdering",
          "Compliance-oversikt",
        ],
      },
      premium: {
        maxItems: 70,
        monthly: 2490,
        yearly: 24900,
        features: [
          "Inntil 70 systemer",
          "Arbeidsområder",
          "Oppgaver",
          "Risikovurdering",
          "Compliance-oversikt",
          "Prioritert support",
        ],
      },
    },
  },
  vendors: {
    id: "vendors",
    displayName: "Leverandør (tillegg)",
    description: "Valgfri tilleggsmodul for leverandørstyring, DPA-sporing, risikoanalyse og varsler",
    tiers: {
      basis: {
        maxItems: 20,
        monthly: 1490,
        yearly: 14900,
        features: [
          "Inntil 20 leverandører",
          "Automatisk DPA-sporing",
          "Risikoanalyse",
          "Compliance-scoring",
          "Varsler ved utløp",
        ],
      },
      premium: {
        maxItems: 70,
        monthly: 2490,
        yearly: 24900,
        features: [
          "Inntil 70 leverandører",
          "Automatisk DPA-sporing",
          "Risikoanalyse",
          "Compliance-scoring",
          "Varsler ved utløp",
          "Prioritert support",
        ],
      },
    },
  },
};

// ─── Legacy PlanTier support (for backward compat) ──────────────────

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
    monthlyCredits: 100,
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
    monthlyCredits: 300,
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

export function getModulePrice(moduleId: ModuleId, tier: ModuleTier, interval: BillingInterval): number {
  const config = MODULES[moduleId].tiers[tier];
  return interval === "yearly" ? config.yearly : config.monthly;
}

export function getModuleAnnualSavingsKr(moduleId: ModuleId, tier: ModuleTier): number {
  const config = MODULES[moduleId].tiers[tier];
  return config.monthly * 2; // 2 months free
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
