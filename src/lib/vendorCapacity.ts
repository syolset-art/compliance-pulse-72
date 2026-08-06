// Sentral kapasitetslogikk for Leverandørmodulen.
// Gjeldende nivå leses fra modulstatusen, slik at "gratis" alltid betyr
// maks 5 registrerte leverandører — uansett hvor leverandøren legges til.

import { getModuleTier, setModuleTier } from "./moduleActivationState";
import {
  DEFAULT_VENDOR_TIER_ID,
  VENDOR_TIERS,
  getNextVendorTier,
  getVendorTier,
  type VendorTier,
  type VendorTierId,
} from "./planConstants";

export interface VendorCapacity {
  tier: VendorTier;
  tierId: VendorTierId;
  used: number;
  limit: number;
  remaining: number;
  atCap: boolean;
  isFree: boolean;
  nextTier: VendorTier | null;
}

export function getCurrentVendorTierId(): VendorTierId {
  return (getModuleTier("vendors") as VendorTierId) ?? DEFAULT_VENDOR_TIER_ID;
}

/** Minste nivå som rommer det faktiske antallet leverandører. */
export function getRequiredVendorTierId(used: number): VendorTierId {
  const fitting = VENDOR_TIERS.find((t) => used <= t.vendorLimit);
  return (fitting ?? VENDOR_TIERS[VENDOR_TIERS.length - 1]).id;
}

export function getVendorCapacity(used: number, tierId?: VendorTierId): VendorCapacity {
  const id = tierId ?? getCurrentVendorTierId();
  const tier = getVendorTier(id);
  const limit = tier.vendorLimit;
  return {
    tier,
    tierId: tier.id,
    used,
    limit,
    remaining: Math.max(0, limit - used),
    atCap: used >= limit,
    isFree: !!tier.isFree,
    nextTier: getNextVendorTier(tier.id),
  };
}

/**
 * Kapasitet basert på faktisk bruk. Lagret nivå løftes automatisk til
 * det minste nivået som rommer bruken, slik at forbruket aldri kan
 * overstige grensen (aldri «26 av 5»).
 */
export function resolveVendorCapacity(used: number, tierId?: VendorTierId): VendorCapacity {
  const currentId = tierId ?? getCurrentVendorTierId();
  const requiredId = getRequiredVendorTierId(used);
  const currentLimit = getVendorTier(currentId).vendorLimit;
  const requiredLimit = getVendorTier(requiredId).vendorLimit;
  if (requiredLimit > currentLimit) {
    setModuleTier("vendors", requiredId);
    return getVendorCapacity(used, requiredId);
  }
  return getVendorCapacity(used, currentId);
}
