export const UNIT_PRICE_ORE = 4200000; // 42 000 kr in øre
export const UNIT_PRICE_KR = 42000;

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
