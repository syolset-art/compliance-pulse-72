// Kritikalitet = bruker-satt forretningsverdi.
// Skiller seg fra Risiko (avledet — se derivedRisk.ts).
export type CriticalityKey = "low" | "medium" | "high" | "critical";

export interface CriticalityMeta {
  key: CriticalityKey;
  labelNb: string;
  labelEn: string;
  /** Pille-klasse — nøytral, fordi dette er et brukervalg, ikke en alarm. */
  pillClass: string;
  dotClass: string;
}

export const CRITICALITY_META: Record<CriticalityKey, CriticalityMeta> = {
  low:      { key: "low",      labelNb: "Lav",      labelEn: "Low",      pillClass: "bg-crit-low-soft text-crit-low-fg border border-crit-low",                            dotClass: "bg-crit-low" },
  medium:   { key: "medium",   labelNb: "Moderat",  labelEn: "Moderate", pillClass: "bg-crit-moderate-soft text-crit-moderate-fg border border-crit-moderate",            dotClass: "bg-crit-moderate" },
  high:     { key: "high",     labelNb: "Høy",      labelEn: "High",     pillClass: "bg-crit-high-soft text-crit-high-fg border border-crit-high",                        dotClass: "bg-crit-high" },
  critical: { key: "critical", labelNb: "Kritisk",  labelEn: "Critical", pillClass: "bg-crit-critical-soft text-crit-critical-fg border border-crit-critical font-semibold", dotClass: "bg-crit-critical" },
};

/** Leser brukervalg uavhengig av om feltet heter `criticality` eller `risk_level` (legacy). */
export function getCriticality(entity: { criticality?: string | null; risk_level?: string | null } | null | undefined): CriticalityMeta | null {
  const raw = (entity?.criticality || entity?.risk_level || "").toLowerCase();
  if (raw === "critical") return CRITICALITY_META.critical;
  if (raw === "high")     return CRITICALITY_META.high;
  if (raw === "medium")   return CRITICALITY_META.medium;
  if (raw === "low")      return CRITICALITY_META.low;
  return null;
}

export function criticalityLabel(value: string | null | undefined, lang: "nb" | "en" = "nb"): string {
  const meta = getCriticality({ criticality: value });
  if (!meta) return lang === "nb" ? "Ikke satt" : "Not set";
  return lang === "nb" ? meta.labelNb : meta.labelEn;
}
