// Regelbasert risikoforslag (v1) for leverandører/systemer.
// Brukeren setter risiko selv — dette er kun et forslag fra Lara.

export type SuggestedRiskLevel = "low" | "medium" | "high" | "critical";

export interface VendorRiskSuggestionInput {
  criticality?: string | null;
  priority?: string | null;
  gdprRole?: string | null;
  sensitive?: boolean | null;
}

export interface VendorRiskSuggestion {
  level: SuggestedRiskLevel;
  score: number;
  reasons: string[];
  reasonsEn: string[];
  needsRosDpia: boolean;
}

export function suggestVendorRisk(input: VendorRiskSuggestionInput): VendorRiskSuggestion {
  const reasons: string[] = [];
  const reasonsEn: string[] = [];
  let score = 0;

  const crit = (input.criticality || "").toLowerCase();
  if (crit === "critical") { score += 3; reasons.push("Kritisk for virksomheten"); reasonsEn.push("Business critical"); }
  else if (crit === "high") { score += 2; reasons.push("Høy kritikalitet"); reasonsEn.push("High criticality"); }
  else if (crit === "medium") { score += 1; }

  const prio = (input.priority || "").toLowerCase();
  if (prio === "critical" || prio === "p0") { score += 2; reasons.push("Høyeste prioritet"); reasonsEn.push("Highest priority"); }
  else if (prio === "high") { score += 1; reasons.push("Høy prioritet"); reasonsEn.push("High priority"); }

  const role = (input.gdprRole || "").toLowerCase();
  if (role === "databehandler" || role === "underdatabehandler") {
    score += 1;
    reasons.push(role === "databehandler" ? "Databehandler" : "Underdatabehandler");
    reasonsEn.push(role === "databehandler" ? "Data processor" : "Sub-processor");
  }

  if (input.sensitive) {
    score += 2;
    reasons.push("Behandler sensitive personopplysninger");
    reasonsEn.push("Processes sensitive personal data");
  }

  const level: SuggestedRiskLevel = score >= 5 ? "high" : score >= 3 ? "medium" : "low";

  if (reasons.length === 0) {
    reasons.push("Ingen tydelige risikodrivere registrert");
    reasonsEn.push("No clear risk drivers registered");
  }

  return {
    level,
    score,
    reasons,
    reasonsEn,
    needsRosDpia: level === "high" || !!input.sensitive,
  };
}
