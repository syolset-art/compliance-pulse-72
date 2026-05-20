import { frameworks } from "@/lib/frameworkDefinitions";

export interface SupportedCountry {
  code: string;
  flag: string;
  name: string;
  /** framework ids available in our catalog that are relevant for this country */
  frameworkIds: string[];
}

export const SUPPORTED_COUNTRIES: SupportedCountry[] = [
  { code: "NO", flag: "🇳🇴", name: "Norge", frameworkIds: ["gdpr", "personopplysningsloven", "nis2", "iso27001", "apenhetsloven", "internkontroll"] },
  { code: "SE", flag: "🇸🇪", name: "Sverige", frameworkIds: ["gdpr", "nis2", "iso27001"] },
  { code: "NL", flag: "🇳🇱", name: "Nederland", frameworkIds: ["gdpr", "nis2", "iso27001"] },
  { code: "UK", flag: "🇬🇧", name: "Storbritannia", frameworkIds: ["gdpr", "iso27001", "soc2"] },
  { code: "AU", flag: "🇦🇺", name: "Australia", frameworkIds: ["iso27001", "soc2"] },
];

export const DEFAULT_COUNTRY_CODE = "NO";

export interface ScopeAnswers {
  health: boolean;
  finance: boolean;
  criticalInfra: boolean;
}

export type ScopeMode = "single" | "multi";

export interface CountryScope {
  mode: ScopeMode;
  countries: string[]; // ISO codes
  answers?: ScopeAnswers;
}

export const STORAGE_KEY = "regulations.countryScope";

export function loadCountryScope(): CountryScope {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { mode: "single", countries: [DEFAULT_COUNTRY_CODE] };
}

export function saveCountryScope(scope: CountryScope) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(scope));
  } catch {}
}

export function getCountry(code: string): SupportedCountry | undefined {
  return SUPPORTED_COUNTRIES.find((c) => c.code === code);
}

/** Compute suggested framework ids based on selected countries + answers. Only returns ids that exist in our catalog. */
export function suggestFrameworks(countries: string[], answers?: ScopeAnswers): string[] {
  const set = new Set<string>();
  countries.forEach((code) => {
    getCountry(code)?.frameworkIds.forEach((id) => set.add(id));
  });
  if (answers?.health) {
    ["normen", "iso27701"].forEach((id) => set.add(id));
  }
  if (answers?.finance) {
    ["dora", "hvitvasking"].forEach((id) => set.add(id));
  }
  if (answers?.criticalInfra) {
    ["nis2", "cra"].forEach((id) => set.add(id));
  }
  const valid = new Set(frameworks.map((f) => f.id));
  return Array.from(set).filter((id) => valid.has(id));
}
