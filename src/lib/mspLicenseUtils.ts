export interface LicenseTier {
  id: string;
  name: string;
  maxSystems: number;
  priceKr: number;
  priceOre: number;
  extraSystemKr: number;
}

export const LICENSE_TIERS: LicenseTier[] = [
  { id: "basis", name: "Basis", maxSystems: 20, priceKr: 42000, priceOre: 4200000, extraSystemKr: 75 },
  { id: "premium", name: "Premium", maxSystems: 50, priceKr: 76000, priceOre: 7600000, extraSystemKr: 75 },
];

export const DEFAULT_TIER = LICENSE_TIERS[0];

// Legacy exports for backward compat
export const UNIT_PRICE_ORE = DEFAULT_TIER.priceOre;
export const UNIT_PRICE_KR = DEFAULT_TIER.priceKr;

export function getDiscountPercent(quantity: number): number {
  if (quantity >= 5) return 50;
  if (quantity === 4) return 40;
  if (quantity === 3) return 30;
  return 20;
}

export function formatKr(ore: number): string {
  return new Intl.NumberFormat("nb-NO", {
    style: "currency",
    currency: "NOK",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(ore / 100);
}
