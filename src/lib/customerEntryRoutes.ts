/**
 * Hvor partneren skal lande når de går inn i en kundes organisasjon
 * for å jobbe med et nettopp aktivert produkt eller regelverk.
 */

export interface CustomerEntryTarget {
  /** Nøkkel for modul (f.eks. "core", "vendors") eller regelverk-id. */
  id: string;
  label: string;
  kind: "framework" | "module" | "service";
  moduleKey?: string;
  frameworkId?: string;
}

const MODULE_ROUTES: Record<string, string> = {
  core: "/systems",
  systems: "/systems",
  vendors: "/vendors",
  assets: "/assets",
  quality: "/quality",
  deviations: "/deviations",
  ropa: "/processing-activities",
};

export function entryRouteFor(target: CustomerEntryTarget): string {
  if (target.frameworkId) {
    return `/compliance?framework=${encodeURIComponent(target.frameworkId)}`;
  }
  if (target.moduleKey && MODULE_ROUTES[target.moduleKey]) {
    return MODULE_ROUTES[target.moduleKey];
  }
  return "/";
}
