/**
 * Egnethetsscore for KI-agenter per prosess.
 *
 * Prototype: scoren finnes ikke i databasen. Den regnes ut her av det vi
 * allerede har kartlagt, og skal ALLTID vises sammen med begrunnelsen —
 * aldri som et tall alene.
 */

export type Recommendation = "autonomous" | "copilot" | "manual";

export interface SuitabilityInput {
  recommendation: Recommendation;
  hoursSavedPerMonth?: number | null;
  hasPersonalData?: boolean;
  riskCategory?: string | null;
}

export interface SuitabilityResult {
  score: number;
  parts: { label: string; value: number }[];
  explanation: string;
}

const BASE: Record<Recommendation, number> = {
  autonomous: 60,
  copilot: 40,
  manual: 10,
};

export function isHighRisk(riskCategory?: string | null): boolean {
  const c = (riskCategory || "").toLowerCase();
  return c.includes("high") || c.includes("høy") || c.includes("unacceptable") || c.includes("uakseptabel");
}

export function recommendationLabel(rec: Recommendation): string {
  if (rec === "autonomous") return "Autonom";
  if (rec === "copilot") return "Co-pilot";
  return "Manuell";
}

export function computeSuitability(input: SuitabilityInput): SuitabilityResult {
  const parts: { label: string; value: number }[] = [];

  const base = BASE[input.recommendation];
  parts.push({ label: `Laras anbefaling: ${recommendationLabel(input.recommendation).toLowerCase()}`, value: base });

  const hours = Math.max(0, Number(input.hoursSavedPerMonth || 0));
  const hourPoints = Math.min(30, Math.round(hours));
  if (hourPoints > 0) {
    parts.push({ label: `Anslått ${Math.round(hours)} timer spart i måneden`, value: hourPoints });
  }

  if (input.hasPersonalData) {
    parts.push({ label: "Behandler personopplysninger", value: -15 });
  }

  if (isHighRisk(input.riskCategory)) {
    parts.push({ label: "Høy risikokategori", value: -15 });
  }

  const raw = parts.reduce((sum, p) => sum + p.value, 0);
  const score = Math.max(0, Math.min(100, raw));

  const explanation = parts
    .map((p) => `${p.value > 0 ? "+" : ""}${p.value} ${p.label}`)
    .join(", ");

  return { score, parts, explanation };
}
