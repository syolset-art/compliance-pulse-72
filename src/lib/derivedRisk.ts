// Risiko = avledet vurdering Mynder/Lara gjør basert på data.
// Aldri direkte satt av brukeren.
export type RiskGrade = "low" | "medium" | "high";

export interface DerivedRisk {
  grade: RiskGrade;
  score: number;        // 0-100
  labelNb: string;
  labelEn: string;
  toneClass: string;    // tekst-/dot-farge
  pillClass: string;    // bakgrunn for liten pille
  reasons: string[];    // forklaringer Lara har brukt
}

export interface RiskInputs {
  criticality?: string | null;
  complianceScore?: number | null;
  vendorRiskGrade?: RiskGrade | null;
  openDeviations?: number | null;
  hasDPA?: boolean | null;
  hasISO27001?: boolean | null;
  hasSOC2?: boolean | null;
  country?: string | null;
  /** Allerede beregnet score fra DB (0-100). Hvis satt brukes denne direkte. */
  precomputedScore?: number | null;
}

const SAFE_COUNTRIES = new Set(["NO", "SE", "DK", "FI", "IS", "DE", "FR", "NL", "EU"]);

export function computeRisk(input: RiskInputs): DerivedRisk {
  const reasons: string[] = [];
  let score = 0;

  if (typeof input.precomputedScore === "number") {
    score = input.precomputedScore;
    reasons.push("Forhåndsberegnet av Mynder");
  } else {
    const crit = (input.criticality || "").toLowerCase();
    if (crit === "critical") { score += 35; reasons.push("Vurdert som kritisk for virksomheten"); }
    else if (crit === "high") { score += 25; reasons.push("Høy kritikalitet"); }
    else if (crit === "medium") { score += 12; }

    const cs = input.complianceScore ?? null;
    if (cs !== null) {
      if (cs < 40)      { score += 25; reasons.push(`Lav modenhet (${cs}%)`); }
      else if (cs < 60) { score += 15; reasons.push(`Moderat modenhet (${cs}%)`); }
      else if (cs < 75) { score += 8; }
    }

    if (input.openDeviations && input.openDeviations > 0) {
      const add = Math.min(20, input.openDeviations * 5);
      score += add;
      reasons.push(`${input.openDeviations} åpne avvik`);
    }

    if (input.hasDPA === false) { score += 12; reasons.push("Mangler databehandleravtale"); }
    if (input.hasISO27001 === false && input.hasSOC2 === false) {
      score += 8;
      reasons.push("Ingen sertifiseringer registrert");
    }

    if (input.country && !SAFE_COUNTRIES.has(input.country.toUpperCase())) {
      score += 10;
      reasons.push(`Lokasjon utenfor EU/EØS (${input.country})`);
    }

    if (input.vendorRiskGrade) {
      if (input.vendorRiskGrade === "high")   { score += 15; reasons.push("Leverandøren har høy risiko"); }
      if (input.vendorRiskGrade === "medium") { score += 8; }
    }
  }

  score = Math.max(0, Math.min(100, Math.round(score)));
  const grade: RiskGrade = score >= 55 ? "high" : score >= 25 ? "medium" : "low";

  if (reasons.length === 0) reasons.push("Ingen tydelige risikosignaler");

  return {
    grade,
    score,
    labelNb: grade === "high" ? "Høy risiko" : grade === "medium" ? "Moderat risiko" : "Lav risiko",
    labelEn: grade === "high" ? "High risk"   : grade === "medium" ? "Moderate risk"  : "Low risk",
    toneClass:
      grade === "high"   ? "text-destructive" :
      grade === "medium" ? "text-warning" :
                           "text-success",
    pillClass:
      grade === "high"   ? "bg-destructive/10 text-destructive border-destructive/20" :
      grade === "medium" ? "bg-warning/10 text-warning border-warning/20" :
                           "bg-success/10 text-success border-success/20",
    reasons,
  };
}
