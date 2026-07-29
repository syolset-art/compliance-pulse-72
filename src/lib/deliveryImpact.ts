import {
  AREA_LABEL,
  enrichmentByArea,
  getPartnerEvidence,
  type MaturityDelta,
  type PartnerEvidence,
} from "@/lib/partnerEvidence";

export type Area = MaturityDelta["area"];
export const AREAS: Area[] = ["governance", "operations", "identityAccess", "vendor"];

/** Baseline pr kontrollområde — brukt som "før"-verdi i rapporten. */
const DEFAULT_BASELINE: Record<Area, number> = {
  governance: 45,
  operations: 40,
  identityAccess: 42,
  vendor: 38,
};

/** Sum delta per område for de bevisene som er valgt (evidenceIds). */
export function deltaFromSelectedEvidence(
  customerId: string,
  evidenceIds: string[],
): Record<Area, number> {
  const items = getPartnerEvidence(customerId).filter((e) => evidenceIds.includes(e.id));
  const out: Record<Area, number> = { governance: 0, operations: 0, identityAccess: 0, vendor: 0 };
  for (const e of items) {
    for (const d of e.maturityDelta) {
      out[d.area] = (out[d.area] ?? 0) + d.delta;
    }
  }
  return out;
}

export interface ImpactRow {
  area: Area;
  label: string;
  before: number;
  after: number;
  delta: number;
}

export function computeDeliveryImpact(
  customerId: string,
  evidenceIds: string[],
  baseline: Partial<Record<Area, number>> = {},
): ImpactRow[] {
  const delta = deltaFromSelectedEvidence(customerId, evidenceIds);
  return AREAS.map((area) => {
    const before = baseline[area] ?? DEFAULT_BASELINE[area];
    const d = delta[area] ?? 0;
    const after = Math.min(100, before + d);
    return { area, label: AREA_LABEL[area], before, after, delta: d };
  });
}

export function totalMaturityDelta(rows: ImpactRow[]): number {
  return rows.reduce((s, r) => s + r.delta, 0);
}

export function findEvidenceByIds(customerId: string, ids: string[]): PartnerEvidence[] {
  const all = getPartnerEvidence(customerId);
  const set = new Set(ids);
  return all.filter((e) => set.has(e.id));
}
