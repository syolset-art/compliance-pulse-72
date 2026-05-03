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
  low:      { key: "low",      labelNb: "Lav kritikalitet",      labelEn: "Low criticality",      pillClass: "bg-muted text-muted-foreground border-border",                       dotClass: "bg-muted-foreground/40" },
  medium:   { key: "medium",   labelNb: "Middels kritikalitet",  labelEn: "Medium criticality",   pillClass: "bg-secondary text-secondary-foreground border-border",              dotClass: "bg-foreground/50" },
  high:     { key: "high",     labelNb: "Høy kritikalitet",      labelEn: "High criticality",     pillClass: "bg-primary/10 text-primary border-primary/20",                      dotClass: "bg-primary" },
  critical: { key: "critical", labelNb: "Kritisk",               labelEn: "Critical",             pillClass: "bg-primary/15 text-primary border-primary/30 font-semibold",        dotClass: "bg-primary" },
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
