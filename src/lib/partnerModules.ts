// Partner module activation state (localStorage-backed).
// Lets a partner re-enable modules that are hidden by default in the
// "Compliance og styring" workspace mode.

export type PartnerModuleKey = "core" | "registries" | "vendors" | "more" | "become_partner";

export interface PartnerModuleDef {
  key: PartnerModuleKey;
  labelNb: string;
  labelEn: string;
  descNb: string;
  descEn: string;
}

export const PARTNER_MODULES: PartnerModuleDef[] = [
  {
    key: "core",
    labelNb: "Mynder Core",
    labelEn: "Mynder Core",
    descNb: "Aktivitet, kontroller, avvik og styringsoppgaver.",
    descEn: "Activity, controls, deviations and governance tasks.",
  },
  {
    key: "registries",
    labelNb: "Registre",
    labelEn: "Registries",
    descNb: "Systemer, aktiva og agenter.",
    descEn: "Systems, assets and agents.",
  },
  {
    key: "vendors",
    labelNb: "Leverandørmodul",
    labelEn: "Vendor module",
    descNb: "Tredjeparts­leverandører og TPRM.",
    descEn: "Third-party vendors and TPRM.",
  },
  {
    key: "more",
    labelNb: "Moduler",
    labelEn: "Modules",
    descNb: "Utforsk og legg til tilleggsmoduler.",
    descEn: "Explore and add extra modules.",
  },
  {
    key: "become_partner",
    labelNb: "Bli Partner-snarvei",
    labelEn: "Become partner shortcut",
    descNb: "Snarvei i menyen for å bli MSP-partner.",
    descEn: "Menu shortcut to become an MSP partner.",
  },
];

const STORAGE_KEY = "mynder_partner_modules_enabled";

export function getEnabledPartnerModules(): PartnerModuleKey[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as PartnerModuleKey[]) : [];
  } catch {
    return [];
  }
}

export function isPartnerModuleEnabled(key: PartnerModuleKey): boolean {
  return getEnabledPartnerModules().includes(key);
}

export function setPartnerModuleEnabled(key: PartnerModuleKey, enabled: boolean): void {
  if (typeof window === "undefined") return;
  const current = new Set(getEnabledPartnerModules());
  if (enabled) current.add(key);
  else current.delete(key);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(current)));
  window.dispatchEvent(new Event("storage"));
  window.dispatchEvent(new Event("partner-modules-changed"));
}
