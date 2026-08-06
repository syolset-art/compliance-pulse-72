// Sentral kapasitetslogikk for Leverandørmodulen.
// Gjeldende nivå leses fra modulstatusen, slik at "gratis" alltid betyr
// maks 5 registrerte leverandører — uansett hvor leverandøren legges til.

import { getModuleTier } from "./moduleActivationState";
import {
  DEFAULT_VENDOR_TIER_ID,
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
