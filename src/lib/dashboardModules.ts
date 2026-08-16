/**
 * Modul-oppløser for det dynamiske dashbordet (Dashboard v2).
 *
 * Kilder:
 *  - moduleActivationState (Produkter under Innstillinger)
 *  - demo-overstyringer (kun prototype, lagres i localStorage)
 *
 * Avledningsregler:
 *  - Regelverk aktivt  => Trust Center tilgjengelig
 *  - Trust Center aktivt => Regelverk tilgjengelig
 */

import { getModuleStatus } from "@/lib/moduleActivationState";

export type DashboardModuleKey =
  | "frameworks"
  | "trust"
  | "vendors"
  | "core"
  | "assets";

export const DASHBOARD_MODULES: {
  key: DashboardModuleKey;
  label_no: string;
  label_en: string;
  route: string;
}[] = [
  { key: "frameworks", label_no: "Regelverk", label_en: "Regulations", route: "/regulations" },
  { key: "trust", label_no: "Trust Center", label_en: "Trust Center", route: "/trust-center/profile" },
  { key: "vendors", label_no: "Leverandører", label_en: "Vendors", route: "/vendors" },
  { key: "core", label_no: "Core", label_en: "Core", route: "/systems" },
  { key: "assets", label_no: "Eiendeler", label_en: "Assets", route: "/assets" },
];

const DEMO_KEY = "mynder_dashboard_v2_demo_modules";
export const DASHBOARD_DEMO_EVENT = "dashboard-v2:demo-modules-changed";

export type DemoOverrides = Partial<Record<DashboardModuleKey, boolean>>;

export function getDemoOverrides(): DemoOverrides {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(DEMO_KEY);
    return raw ? (JSON.parse(raw) as DemoOverrides) : {};
  } catch {
    return {};
  }
}

export function setDemoOverrides(next: DemoOverrides) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(DEMO_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new CustomEvent(DASHBOARD_DEMO_EVENT));
}

export function toggleDemoModule(key: DashboardModuleKey, value: boolean) {
  setDemoOverrides({ ...getDemoOverrides(), [key]: value });
}

export function clearDemoOverrides() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(DEMO_KEY);
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new CustomEvent(DASHBOARD_DEMO_EVENT));
}

function isLive(key: DashboardModuleKey): boolean {
  const status = getModuleStatus(key === "trust" ? "trust" : key);
  return status === "active" || status === "pending_cancellation";
}

/**
 * Beregner hvilke moduler dashbordet skal bygges av.
 * Demo-overstyringer vinner over faktisk modulstatus.
 */
export function resolveActiveModules(overrides: DemoOverrides = {}): Set<DashboardModuleKey> {
  const active = new Set<DashboardModuleKey>();

  for (const { key } of DASHBOARD_MODULES) {
    const override = overrides[key];
    const on = override === undefined ? isLive(key) : override;
    if (on) active.add(key);
  }

  // Avledning: regelverk ⇄ Trust Center
  if (active.has("frameworks")) active.add("trust");
  if (active.has("trust")) active.add("frameworks");

  return active;
}
