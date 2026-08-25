/**
 * Bygger en komplett oppgavepakke for ett regelverk — alle oppgaver partneren
 * må levere for å dekke kravene, med foreslåtte timer og pris.
 *
 * Kilder (alle eksisterende):
 *  - krav fra `compliance_requirements` (hentes av kalleren)
 *  - dokumentnavn per krav fra `requirementDocumentationHints.ts`
 *  - type, timespenn og notat fra `documentDeliverables.ts`
 *
 * Rene funksjoner — ingen UI, ingen nettverk.
 */

import { getTypicalDocumentation } from "./requirementDocumentationHints";
import {
  getDeliverableProfile,
  estimateDocumentPrice,
  type DeliverableKind,
} from "./documentDeliverables";
import { toCanonicalArea, type ControlAreaKey } from "./controlAreas";

export interface RequirementRow {
  framework_id: string;
  requirement_id: string;
  name?: string | null;
  name_no?: string | null;
  category?: string | null;
  sla_category?: string | null;
}

export interface FrameworkTask {
  id: string;
  name: string;
  kind: DeliverableKind;
  /** Foreslåtte timer — ett tall, aldri et spenn. */
  hours: number;
  note: string;
  /** Kan Lara lage et førsteutkast? */
  laraDraft: boolean;
  /** Kontrollområde / kategori oppgaven hører til. */
  category: string;
  /** Mynders fem kontrollområder oppgaven treffer (kan være flere). */
  controlAreas: ControlAreaKey[];
  /** Kravene oppgaven dekker, f.eks. ["A.5.1", "A.5.4"]. */
  requirements: string[];
  /** True når partneren selv har lagt til oppgaven. */
  custom?: boolean;
}

/** Fallback fra ISO-kategori til kontrollområde når `sla_category` mangler. */
const CATEGORY_AREA_FALLBACK: Record<string, ControlAreaKey> = {
  organizational: "governance",
  legal: "governance",
  governance: "governance",
  technological: "operations",
  physical: "operations",
  people: "identityAccess",
};

export function requirementControlArea(row: RequirementRow): ControlAreaKey {
  if (row.sla_category) return toCanonicalArea(row.sla_category);
  return CATEGORY_AREA_FALLBACK[row.category ?? ""] ?? "governance";
}


export interface TaskOverride {
  removed?: boolean;
  disabled?: boolean;
  name?: string;
  kind?: DeliverableKind;
  hours?: number;
  priceOverride?: number;
  /** True når timene kommer fra et grovt Lara-estimat (ikke manuelt endret). */
  estimated?: boolean;
  /** Laras korte begrunnelse for estimatet. */
  estimateNote?: string;
}

export interface FrameworkPackageState {
  overrides: Record<string, TaskOverride>;
  custom: FrameworkTask[];
  /** Egendefinert pakkenavn valgt av partneren (visningsnavn i salgsporteføljen). */
  customName?: string;
}

export const EMPTY_PACKAGE_STATE: FrameworkPackageState = { overrides: {}, custom: [] };

const CATEGORY_LABELS: Record<string, string> = {
  organizational: "Organisatoriske kontroller",
  people: "Personellkontroller",
  physical: "Fysiske kontroller",
  technological: "Teknologiske kontroller",
};

export function categoryLabel(category: string): string {
  return CATEGORY_LABELS[category] ?? (category ? category : "Øvrige krav");
}

export function slugifyTaskName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Slår sammen krav til unike oppgaver. Flere krav peker ofte på samme dokument
 * (f.eks. «Risikovurdering») — da blir det én oppgave som dekker alle kravene.
 */
export function buildFrameworkTasks(rows: RequirementRow[]): FrameworkTask[] {
  const byName = new Map<string, FrameworkTask>();

  for (const row of rows) {
    const reqId = (row.requirement_id ?? "").trim();
    const hint = getTypicalDocumentation(reqId, row.framework_id);
    const category = categoryLabel(row.category ?? "");
    const area = requirementControlArea(row);

    for (const docName of hint.typicalDocs) {
      const id = slugifyTaskName(docName);
      const existing = byName.get(id);
      if (existing) {
        if (reqId && !existing.requirements.includes(reqId)) existing.requirements.push(reqId);
        if (!existing.controlAreas.includes(area)) existing.controlAreas.push(area);
        continue;
      }
      const profile = getDeliverableProfile(docName);
      byName.set(id, {
        id,
        name: docName,
        kind: profile.kind,
        // Nødfallback: 1 time per kontrollpunkt inntil Lara har estimert
        // (estimate-package-hours) eller partneren justerer selv.
        hours: { min: 1, max: 1 },
        note: profile.note,
        laraDraft: profile.laraDraft,
        category,
        controlAreas: [area],
        requirements: reqId ? [reqId] : [],
      });
    }
  }


  return Array.from(byName.values()).sort(
    (a, b) => a.category.localeCompare(b.category, "nb") || a.name.localeCompare(b.name, "nb"),
  );
}

export interface ResolvedTask extends FrameworkTask {
  enabled: boolean;
  edited: boolean;
  /** True når timene er et grovt Lara-estimat som ikke er manuelt endret. */
  estimated: boolean;
  /** Laras korte begrunnelse for estimatet. */
  estimateNote?: string;
  price: { min: number; max: number };
}

export function resolveTasks(
  base: FrameworkTask[],
  state: FrameworkPackageState,
  hourlyRate: number,
): ResolvedTask[] {
  const all = [...base, ...state.custom];
  return all
    .filter((t) => !state.overrides[t.id]?.removed)
    .map((t) => {
      const o = state.overrides[t.id] ?? {};
      const hours = {
        min: o.hoursMin ?? t.hours.min,
        max: o.hoursMax ?? t.hours.max,
      };
      const name = o.name ?? t.name;
      const price =
        o.priceOverride != null
          ? { min: o.priceOverride, max: o.priceOverride }
          : {
              min: Math.round((hours.min * hourlyRate) / 100) * 100,
              max: Math.round((hours.max * hourlyRate) / 100) * 100,
            };
      // Manuelle timeendringer nuller ut estimated-flagget — rene Lara-estimater
      // skal ikke markeres som «endret av partneren».
      const manualHours = !o.estimated && (o.hoursMin != null || o.hoursMax != null);
      return {
        ...t,
        name,
        kind: o.kind ?? t.kind,
        hours,
        price,
        enabled: o.disabled !== true,
        edited: Boolean(o.name || o.kind || o.priceOverride != null || manualHours),
        estimated: o.estimated === true,
        estimateNote: o.estimateNote,
      };
    });
}

export interface PackageTotals {
  tasks: number;
  hours: { min: number; max: number };
  price: { min: number; max: number };
}

export function summarizePackage(tasks: ResolvedTask[]): PackageTotals {
  return tasks
    .filter((t) => t.enabled)
    .reduce<PackageTotals>(
      (acc, t) => ({
        tasks: acc.tasks + 1,
        hours: { min: acc.hours.min + t.hours.min, max: acc.hours.max + t.hours.max },
        price: { min: acc.price.min + t.price.min, max: acc.price.max + t.price.max },
      }),
      { tasks: 0, hours: { min: 0, max: 0 }, price: { min: 0, max: 0 } },
    );
}

export const TASK_KIND_LABEL: Record<DeliverableKind, string> = {
  "ai-draft": "AI-utkast",
  advisory: "Rådgivning",
  technical: "Teknisk leveranse",
};

export type { DeliverableKind };

/** Foreslått pris for hele pakken, brukt når den lagres som tjeneste. */
export function packagePrice(totals: PackageTotals): number {
  return Math.round((totals.price.min + totals.price.max) / 2);
}

export function packageHours(totals: PackageTotals): number {
  return Math.round((totals.hours.min + totals.hours.max) / 2);
}

// ── Lagring ──────────────────────────────────────────────────────────────
const STORAGE_KEY = "msp-framework-task-packages-v1";

type Store = Record<string, FrameworkPackageState>;

function readStore(): Store {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}") as Store;
  } catch {
    return {};
  }
}

export function loadPackageState(frameworkId: string): FrameworkPackageState {
  const s = readStore()[frameworkId];
  return s
    ? { overrides: s.overrides ?? {}, custom: s.custom ?? [], customName: s.customName }
    : { ...EMPTY_PACKAGE_STATE };
}

export function savePackageState(frameworkId: string, state: FrameworkPackageState): void {
  if (typeof window === "undefined") return;
  try {
    const store = readStore();
    store[frameworkId] = state;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    /* ignore */
  }
}

export function clearPackageState(frameworkId: string): void {
  if (typeof window === "undefined") return;
  try {
    const store = readStore();
    delete store[frameworkId];
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    /* ignore */
  }
}
