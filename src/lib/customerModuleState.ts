// Modulstatus, nivå og forbruk **per kunde** (MSP-partnerens kunder).
//
// Den globale `moduleActivationState` gjelder partnerens egen organisasjon.
// Her holder vi kundens tilstand adskilt slik at aktivering, nivåendring og
// oppsigelse på én kunde ikke smitter over på de andre.
//
// Kilden til sannhet for *hva som er aktivert* er `active_modules` på kunden
// i databasen. Nivå, planlagt nedgradering og forbruk lagres lokalt (demo).

import {
  CORE_TIERS,
  VENDOR_TIERS,
  type CoreTierId,
  type VendorTierId,
} from "./planConstants";
import type { ModuleLifecycle, ModuleState, ModuleStateMap, CancellationMeta } from "./moduleActivationState";
import { getPeriodEnd, getRetentionUntil } from "./moduleActivationState";

export type { ModuleLifecycle, ModuleState, ModuleStateMap };

const PREFIX = "mynder_customer_module_state:";
const USAGE_PREFIX = "mynder_customer_usage:";

export const CUSTOMER_MODULES_EVENT = "customer-modules:changed";

function emit(customerId: string) {
  window.dispatchEvent(new CustomEvent(CUSTOMER_MODULES_EVENT, { detail: { customerId } }));
  window.dispatchEvent(new CustomEvent("modules:changed"));
}

function read(customerId: string): ModuleStateMap {
  try {
    const raw = localStorage.getItem(PREFIX + customerId);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return parsed as ModuleStateMap;
    }
  } catch {
    /* ignore */
  }
  return {};
}

function write(customerId: string, map: ModuleStateMap) {
  try {
    localStorage.setItem(PREFIX + customerId, JSON.stringify(map));
  } catch {
    /* ignore */
  }
  emit(customerId);
}

function patch(customerId: string, moduleId: string, next: Partial<ModuleState>) {
  const map = read(customerId);
  map[moduleId] = { ...(map[moduleId] ?? { status: "inactive" }), ...next };
  write(customerId, map);
}

// ─── Forbruk per kunde (demo) ────────────────────────────────────────

export interface CustomerUsage {
  systems: number;
  vendors: number;
}

/** Faste demotall slik at hver kunde viser en gjenkjennelig situasjon. */
const DEMO_USAGE: Record<string, CustomerUsage> = {
  "Bergen Energi AS": { systems: 42, vendors: 5 },
  "Fjordtech Solutions": { systems: 6, vendors: 3 },
  "Vest Helse Klinikk": { systems: 9, vendors: 4 },
  "Kystbygg Entreprenør": { systems: 0, vendors: 0 },
  "NordFinans Rådgivning": { systems: 8, vendors: 17 },
  "Stavanger Logistikk": { systems: 18, vendors: 6 },
  "Larvik Handel AS": { systems: 0, vendors: 0 },
  "Digitale Løsninger Nord": { systems: 27, vendors: 12 },
  "Tromsø Utdanning": { systems: 3, vendors: 2 },
};

function hash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

/** Forbruk for kunden — demotall, men stabile og lagret slik at de kan endres. */
export function getCustomerUsage(customerId: string, customerName?: string): CustomerUsage {
  try {
    const raw = localStorage.getItem(USAGE_PREFIX + customerId);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.systems === "number") return parsed as CustomerUsage;
    }
  } catch {
    /* ignore */
  }
  const seeded =
    (customerName && DEMO_USAGE[customerName]) ||
    ({ systems: hash(customerId) % 24, vendors: hash(customerId + "v") % 12 } as CustomerUsage);
  try {
    localStorage.setItem(USAGE_PREFIX + customerId, JSON.stringify(seeded));
  } catch {
    /* ignore */
  }
  return seeded;
}

export function setCustomerUsage(customerId: string, usage: Partial<CustomerUsage>) {
  const current = getCustomerUsage(customerId);
  const next = { ...current, ...usage };
  try {
    localStorage.setItem(USAGE_PREFIX + customerId, JSON.stringify(next));
  } catch {
    /* ignore */
  }
  emit(customerId);
}

// ─── Nivå som passer forbruket ───────────────────────────────────────

export function requiredCoreTierId(systems: number): CoreTierId {
  return (CORE_TIERS.find((t) => systems <= t.systemLimit) ?? CORE_TIERS[CORE_TIERS.length - 1]).id;
}

export function requiredVendorTierId(vendors: number): VendorTierId {
  return (VENDOR_TIERS.find((t) => vendors <= t.vendorLimit) ?? VENDOR_TIERS[VENDOR_TIERS.length - 1]).id;
}

// ─── Synk mot databasen ──────────────────────────────────────────────

/**
 * Sørger for at lokal tilstand speiler kundens `active_modules`.
 * Moduler i lista blir aktive (med et nivå som rommer forbruket) dersom de
 * ikke allerede har en lokal tilstand. Moduler som ikke ligger i lista og
 * heller ikke har lokal tilstand, regnes som inaktive.
 */
export function syncCustomerModules(
  customerId: string,
  activeModules: string[],
  usage: CustomerUsage,
) {
  const map = read(customerId);
  let changed = false;
  for (const key of activeModules) {
    const existing = map[key];
    if (existing && existing.status !== "inactive") continue;
    map[key] = {
      status: "active",
      tierId:
        key === "core"
          ? requiredCoreTierId(usage.systems)
          : key === "vendors"
            ? requiredVendorTierId(usage.vendors)
            : existing?.tierId,
    };
    changed = true;
  }
  if (changed) {
    try {
      localStorage.setItem(PREFIX + customerId, JSON.stringify(map));
    } catch {
      /* ignore */
    }
  }
}

// ─── Oppslag og endringer ────────────────────────────────────────────

export function getCustomerModuleState(customerId: string, moduleId: string): ModuleState {
  return read(customerId)[moduleId] ?? { status: "inactive" };
}

export function getCustomerModuleStatus(customerId: string, moduleId: string): ModuleLifecycle {
  return getCustomerModuleState(customerId, moduleId).status;
}

export function activateCustomerModule(customerId: string, moduleId: string, tierId?: string) {
  patch(customerId, moduleId, { status: "active", cancelAt: undefined, cancellation: undefined, ...(tierId ? { tierId } : {}) });
}

export function deactivateCustomerModule(customerId: string, moduleId: string) {
  patch(customerId, moduleId, { status: "inactive", cancelAt: undefined });
}

export function cancelCustomerModule(customerId: string, moduleId: string, meta?: CancellationMeta): string {
  const cancelAt = getPeriodEnd().toISOString();
  patch(customerId, moduleId, {
    status: "pending_cancellation",
    cancelAt,
    cancellation: meta
      ? { ...meta, retentionUntil: meta.retentionUntil ?? getRetentionUntil(cancelAt).toISOString() }
      : undefined,
  });
  return cancelAt;
}

export function resumeCustomerModule(customerId: string, moduleId: string) {
  patch(customerId, moduleId, { status: "active", cancelAt: undefined, cancellation: undefined });
}

export function getCustomerModuleTier(customerId: string, moduleId: string): string | undefined {
  return getCustomerModuleState(customerId, moduleId).tierId;
}

export function setCustomerModuleTier(customerId: string, moduleId: string, tierId: string) {
  patch(customerId, moduleId, { tierId, scheduledTierId: undefined, scheduledAt: undefined });
}

export function scheduleCustomerModuleTier(
  customerId: string,
  moduleId: string,
  tierId: string,
  effectiveAt?: string,
): string {
  const scheduledAt = effectiveAt ?? getPeriodEnd().toISOString();
  patch(customerId, moduleId, { scheduledTierId: tierId, scheduledAt });
  return scheduledAt;
}

export function clearCustomerScheduledTier(customerId: string, moduleId: string) {
  patch(customerId, moduleId, { scheduledTierId: undefined, scheduledAt: undefined });
}

/** Moduler kunden faktisk har tilgang til nå (aktive eller under oppsigelse). */
export function getCustomerActiveModules(customerId: string): string[] {
  const map = read(customerId);
  const now = Date.now();
  return Object.entries(map)
    .filter(([, s]) => {
      if (s.status === "active") return true;
      if (s.status === "pending_cancellation") return !s.cancelAt || new Date(s.cancelAt).getTime() > now;
      return false;
    })
    .map(([id]) => id);
}
