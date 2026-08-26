// Prioritet på system/leverandør (P0–P4).
// Lara foreslår basert på risiko + kritikalitet, eier kan overstyre.
import type { CriticalityKey } from "./criticality";
import type { RiskGrade } from "./derivedRisk";

export type PriorityKey = "P0" | "P1" | "P2" | "P3" | "P4";

export interface PriorityMeta {
  key: PriorityKey;
  rank: 0 | 1 | 2 | 3 | 4;
  labelNb: string;
  labelEn: string;
  shortNb: string;
  shortEn: string;
  pillClass: string;
  dotClass: string;
}

export const PRIORITY_META: Record<PriorityKey, PriorityMeta> = {
  P0: {
    key: "P0", rank: 0,
    labelNb: "P0 – Kritisk", labelEn: "P0 – Critical",
    shortNb: "Kritisk", shortEn: "Critical",
    pillClass: "bg-destructive/10 text-destructive border-destructive/20",
    dotClass: "bg-destructive",
  },
  P1: {
    key: "P1", rank: 1,
    labelNb: "P1 – Høy", labelEn: "P1 – High",
    shortNb: "Høy", shortEn: "High",
    pillClass: "bg-warning/10 text-warning border-warning/20",
    dotClass: "bg-warning",
  },
  P2: {
    key: "P2", rank: 2,
    labelNb: "P2 – Medium", labelEn: "P2 – Medium",
    shortNb: "Medium", shortEn: "Medium",
    pillClass: "bg-secondary text-secondary-foreground border-border",
    dotClass: "bg-foreground/50",
  },
  P3: {
    key: "P3", rank: 3,
    labelNb: "P3 – Lav", labelEn: "P3 – Low",
    shortNb: "Lav", shortEn: "Low",
    pillClass: "bg-muted text-muted-foreground border-border",
    dotClass: "bg-muted-foreground/40",
  },
  P4: {
    key: "P4", rank: 4,
    labelNb: "P4 – Minimale", labelEn: "P4 – Minimal",
    shortNb: "Minimale", shortEn: "Minimal",
    pillClass: "bg-muted/60 text-muted-foreground border-border",
    dotClass: "bg-muted-foreground/30",
  },
};

export const PRIORITY_KEYS: PriorityKey[] = ["P0", "P1", "P2", "P3", "P4"];

/**
 * Foreslår prioritet basert på risiko og kritikalitet.
 * Risiko (3 nivå) × Kritikalitet (4 nivå) → P0–P3.
 * Hvis risiko ikke finnes, utledes en proxy fra kritikalitet.
 */
export function suggestPriority(
  criticality: CriticalityKey | string | null | undefined,
  risk?: RiskGrade | null,
): PriorityKey {
  const c = (criticality || "medium").toLowerCase() as CriticalityKey;
  const r: RiskGrade =
    risk ??
    (c === "critical" || c === "high" ? "high" : c === "medium" ? "medium" : "low");

  // Matrise: rader = risiko, kolonner = kritikalitet
  const matrix: Record<RiskGrade, Record<CriticalityKey, PriorityKey>> = {
    low:    { low: "P3", medium: "P3", high: "P2", critical: "P1" },
    medium: { low: "P3", medium: "P2", high: "P1", critical: "P0" },
    high:   { low: "P2", medium: "P1", high: "P0", critical: "P0" },
  };

  const col = (["low", "medium", "high", "critical"] as CriticalityKey[]).includes(c)
    ? c
    : "medium";
  return matrix[r][col];
}

export function getPriorityMeta(value: string | null | undefined): PriorityMeta | null {
  if (!value) return null;
  const key = value.toUpperCase() as PriorityKey;
  return PRIORITY_META[key] ?? null;
}

export function priorityLabel(value: string | null | undefined, lang: "nb" | "en" = "nb"): string {
  const m = getPriorityMeta(value);
  if (!m) return lang === "nb" ? "Ikke satt" : "Not set";
  return lang === "nb" ? m.labelNb : m.labelEn;
}

/** Sann hvis faktisk avviker fra forslag med ≥2 nivåer. */
export function isPriorityDeviation(
  actual: string | null | undefined,
  suggested: string | null | undefined,
): boolean {
  const a = getPriorityMeta(actual);
  const s = getPriorityMeta(suggested);
  if (!a || !s) return false;
  return Math.abs(a.rank - s.rank) >= 2;
}

export function suggestionRationale(
  criticality: CriticalityKey | string | null | undefined,
  risk?: RiskGrade | null,
  lang: "nb" | "en" = "nb",
): string {
  const c = (criticality || "medium").toLowerCase();
  const r = risk ?? (c === "critical" || c === "high" ? "high" : c === "medium" ? "medium" : "low");
  if (lang === "en") return `Based on ${r} risk and ${c} criticality`;
  const cnb = c === "critical" ? "kritisk" : c === "high" ? "høy" : c === "medium" ? "medium" : "lav";
  const rnb = r === "high" ? "høy" : r === "medium" ? "medium" : "lav";
  return `Basert på ${rnb} risiko og ${cnb} kritikalitet`;
}
