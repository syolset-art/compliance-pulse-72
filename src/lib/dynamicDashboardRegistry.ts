/**
 * Register over blokkene i det dynamiske dashbordet.
 * Hver blokk beskriver hvilke moduler den krever, en basisprioritet
 * og hvor mye åpent arbeid den representerer (brukes til sortering).
 */

import type { DashboardModuleKey } from "@/lib/dashboardModules";

export type DashboardBlockKey =
  | "lara-greeting"
  | "maturity"
  | "work-queue"
  | "frameworks"
  | "trust"
  | "vendors"
  | "core"
  | "assets";

export interface DashboardBlockDef {
  key: DashboardBlockKey;
  title_no: string;
  title_en: string;
  /** Tom liste = alltid synlig. Blokken vises hvis minst én modul er aktiv. */
  requires: DashboardModuleKey[];
  /** Lavere = høyere opp (før arbeidsmengde vektes inn). */
  priority: number;
  /** Full bredde i grid. */
  fullWidth?: boolean;
}

export const DASHBOARD_BLOCKS: DashboardBlockDef[] = [
  { key: "lara-greeting", title_no: "Lara", title_en: "Lara", requires: [], priority: 0, fullWidth: true },
  { key: "maturity", title_no: "Samlet modenhet", title_en: "Overall maturity", requires: [], priority: 1, fullWidth: true },
  { key: "work-queue", title_no: "Laras arbeidskø", title_en: "Lara's work queue", requires: [], priority: 2, fullWidth: true },
  { key: "frameworks", title_no: "Regelverk i scope", title_en: "Regulations in scope", requires: ["frameworks"], priority: 10 },
  { key: "trust", title_no: "Trust Center", title_en: "Trust Center", requires: ["trust"], priority: 11 },
  { key: "vendors", title_no: "Leverandører", title_en: "Vendors", requires: ["vendors"], priority: 12 },
  { key: "core", title_no: "Core", title_en: "Core", requires: ["core"], priority: 13 },
  { key: "assets", title_no: "Eiendeler", title_en: "Assets", requires: ["assets"], priority: 14 },
];

/** Antall åpne punkter per blokk — styrer rekkefølgen innenfor modulblokkene. */
export type OpenWorkMap = Partial<Record<DashboardBlockKey, number>>;

export function getVisibleBlocks(
  active: Set<DashboardModuleKey>,
  openWork: OpenWorkMap = {}
): DashboardBlockDef[] {
  return DASHBOARD_BLOCKS.filter(
    (b) => b.requires.length === 0 || b.requires.some((m) => active.has(m))
  ).sort((a, b) => {
    if (a.priority < 10 || b.priority < 10) return a.priority - b.priority;
    const openDiff = (openWork[b.key] ?? 0) - (openWork[a.key] ?? 0);
    if (openDiff !== 0) return openDiff;
    return a.priority - b.priority;
  });
}
