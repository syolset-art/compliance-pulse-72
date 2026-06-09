/**
 * Dokument-samsvar (eier-side, rådgivende)
 *
 * Beregner om et `vendor_documents`-dokument fortsatt holder den kadensen
 * et rammeverk forventer. Dette er en ren UI-vurdering — den endrer ALDRI
 * Trust Score. Score drives av `supplier_evidence_items` og motorens egen
 * `isEvidenceStale`. Hard-frist for engine-typer er låst til motorens
 * terskler slik at vi ikke gir motstridende beskjed til eieren.
 */

export type ComplianceState = "compliant" | "review_soon" | "out_of_date";
export type ComplianceSource = "engine" | "advisory" | "valid_to" | "permanent";

export type ComplianceResult = {
  show: boolean;
  state: ComplianceState;
  reasonNb: string;
  reasonEn: string;
  ageDays: number;
  daysUntilHardLimit: number | null;
  standard: string | null;
  source: ComplianceSource;
  scoreImpact: "none";
  canMarkReviewed: boolean;
};

type Rule = {
  reviewMonths: number | null;
  hardMonths: number | null;
  standardNb: string;
  standardEn: string;
  source: ComplianceSource;
  canMarkReviewed: boolean;
};

const RULES: Record<string, Rule> = {
  policy:                 { reviewMonths: 12, hardMonths: 18, standardNb: "ISO 27001 A.5.1 (årlig gjennomgang)", standardEn: "ISO 27001 A.5.1 (annual review)", source: "advisory", canMarkReviewed: true },
  privacy_policy:         { reviewMonths: 12, hardMonths: 18, standardNb: "GDPR art. 24 (årlig gjennomgang)",     standardEn: "GDPR art. 24 (annual review)",     source: "advisory", canMarkReviewed: true },
  security_policy:        { reviewMonths: 12, hardMonths: 18, standardNb: "ISO 27001 A.5.1 (årlig gjennomgang)",  standardEn: "ISO 27001 A.5.1 (annual review)",  source: "advisory", canMarkReviewed: true },
  acceptable_use:         { reviewMonths: 12, hardMonths: 18, standardNb: "ISO 27001 A.5.10 (årlig gjennomgang)", standardEn: "ISO 27001 A.5.10 (annual review)", source: "advisory", canMarkReviewed: true },
  incident_response:      { reviewMonths: 12, hardMonths: 18, standardNb: "ISO 27001 A.5.24 (årlig gjennomgang)", standardEn: "ISO 27001 A.5.24 (annual review)", source: "advisory", canMarkReviewed: true },
  data_protection_policy: { reviewMonths: 12, hardMonths: 18, standardNb: "GDPR art. 24 (årlig gjennomgang)",     standardEn: "GDPR art. 24 (annual review)",     source: "advisory", canMarkReviewed: true },
  pentest:      { reviewMonths: 12, hardMonths: 15, standardNb: "Årlig pentest-praksis (motor: 15 mnd)",         standardEn: "Annual pentest practice (engine: 15 mo)",     source: "engine", canMarkReviewed: false },
  audit_report: { reviewMonths: 12, hardMonths: 36, standardNb: "ISO 27001 sertifiseringssyklus (motor: 36 mnd)", standardEn: "ISO 27001 certification cycle (engine: 36 mo)", source: "engine", canMarkReviewed: false },
  soc2_report:  { reviewMonths: 12, hardMonths: 36, standardNb: "SOC 2 / ISO 27001-syklus (motor: 36 mnd)",       standardEn: "SOC 2 / ISO 27001 cycle (engine: 36 mo)",       source: "engine", canMarkReviewed: false },
  report:       { reviewMonths: 12, hardMonths: 36, standardNb: "Revisjonssyklus (motor: 36 mnd)",                standardEn: "Audit cycle (engine: 36 mo)",                   source: "engine", canMarkReviewed: false },
  dpa:          { reviewMonths: 24, hardMonths: 30, standardNb: "GDPR art. 28 (motor: 30 mnd)",                    standardEn: "GDPR art. 28 (engine: 30 mo)",                  source: "engine", canMarkReviewed: true },
  agreement:    { reviewMonths: 24, hardMonths: 30, standardNb: "GDPR art. 28 (motor: 30 mnd)",                    standardEn: "GDPR art. 28 (engine: 30 mo)",                  source: "engine", canMarkReviewed: true },
  certification: { reviewMonths: null, hardMonths: null, standardNb: "Følger sertifikatets gyldighet (valid_to)", standardEn: "Follows the certificate's validity (valid_to)", source: "valid_to",  canMarkReviewed: false },
  incident:      { reviewMonths: null, hardMonths: null, standardNb: "Historisk hendelse — utløper aldri",         standardEn: "Historical incident — never expires",            source: "permanent", canMarkReviewed: false },
  evidence:      { reviewMonths: 12, hardMonths: 18, standardNb: "God praksis (12 mnd)",                           standardEn: "Good practice (12 mo)",                          source: "advisory",  canMarkReviewed: false },
};

const DAY = 86_400_000;
const monthsToDays = (m: number) => Math.round(m * 30.44);

function newest(values: (string | null | undefined)[]): Date | null {
  let best: Date | null = null;
  for (const v of values) {
    if (!v) continue;
    const d = new Date(v);
    if (isNaN(d.getTime())) continue;
    if (!best || d.getTime() > best.getTime()) best = d;
  }
  return best;
}

function ageLabel(days: number, isNb: boolean): string {
  const months = Math.floor(days / 30.44);
  if (months < 1) {
    return isNb ? `${days} dager` : `${days} days`;
  }
  return isNb ? `${months} mnd` : `${months} mo`;
}

function hidden(rule: Rule | null): ComplianceResult {
  return {
    show: false,
    state: "compliant",
    reasonNb: "",
    reasonEn: "",
    ageDays: 0,
    daysUntilHardLimit: null,
    standard: rule?.standardNb ?? null,
    source: rule?.source ?? "permanent",
    scoreImpact: "none",
    canMarkReviewed: false,
  };
}

export function computeDocumentCompliance(
  doc: {
    document_type: string;
    valid_from?: string | null;
    valid_to?: string | null;
    created_at?: string | null;
    updated_at?: string | null;
    reviewed_at?: string | null;
    status?: string | null;
  },
  now: Date = new Date(),
): ComplianceResult {
  const rule = RULES[doc.document_type] ?? null;

  if (rule?.source === "permanent" || doc.status === "superseded") {
    return hidden(rule);
  }

  // Beregningsgrunnlag: nyeste av reviewed_at, valid_from, updated_at, created_at.
  const basis = newest([doc.reviewed_at, doc.valid_from, doc.updated_at, doc.created_at]) ?? now;
  const ageDays = Math.max(0, Math.floor((now.getTime() - basis.getTime()) / DAY));

  const validTo = doc.valid_to ? new Date(doc.valid_to) : null;
  const validToValid = validTo && !isNaN(validTo.getTime());
  const daysToValidTo = validToValid ? Math.floor((validTo!.getTime() - now.getTime()) / DAY) : null;

  const hardDays = rule?.hardMonths != null ? monthsToDays(rule.hardMonths) : null;
  const reviewDays = rule?.reviewMonths != null ? monthsToDays(rule.reviewMonths) : null;
  const daysUntilHardLimit = hardDays != null ? hardDays - ageDays : null;

  let state: ComplianceState = "compliant";

  if (daysToValidTo != null) {
    if (daysToValidTo < 0) state = "out_of_date";
    else if (daysToValidTo < 60) state = "review_soon";
  }

  if (hardDays != null) {
    if (ageDays > hardDays) state = "out_of_date";
    else if (state === "compliant" && reviewDays != null && ageDays > reviewDays) state = "review_soon";
    else if (state === "compliant" && ageDays > hardDays - 60) state = "review_soon";
  }

  // 'other' uten valid_to og uten regel: nøytral (vi viser likevel panelet).
  const hasAnyRule = hardDays != null || daysToValidTo != null;

  const reason = buildReason({
    state,
    docType: doc.document_type,
    rule,
    ageDays,
    daysToValidTo,
    hasAnyRule,
  });

  return {
    show: true,
    state,
    reasonNb: reason.nb,
    reasonEn: reason.en,
    ageDays,
    daysUntilHardLimit,
    standard: rule?.standardNb ?? null,
    source: rule?.source ?? "valid_to",
    scoreImpact: "none",
    canMarkReviewed: rule?.canMarkReviewed ?? false,
  };
}

function buildReason(args: {
  state: ComplianceState;
  docType: string;
  rule: Rule | null;
  ageDays: number;
  daysToValidTo: number | null;
  hasAnyRule: boolean;
}): { nb: string; en: string } {
  const { state, rule, ageDays, daysToValidTo, hasAnyRule } = args;
  const ageNb = ageLabel(ageDays, true);
  const ageEn = ageLabel(ageDays, false);

  if (!hasAnyRule) {
    return {
      nb: "Ingen utløpsregel satt for denne typen. Vurder å legge inn en utløpsdato hvis dokumentet har en gyldighet.",
      en: "No expiry rule set for this type. Consider adding an expiry date if the document has a validity.",
    };
  }

  if (state === "out_of_date") {
    if (daysToValidTo != null && daysToValidTo < 0) {
      const overdue = Math.abs(daysToValidTo);
      return {
        nb: `Utløpsdatoen passerte for ${overdue} dager siden. ${rule?.standardNb ?? ""}`.trim(),
        en: `The expiry date passed ${overdue} days ago. ${rule?.standardEn ?? ""}`.trim(),
      };
    }
    if (rule?.hardMonths != null) {
      return {
        nb: `Dokumentet er ${ageNb} gammelt og teller ikke lenger som oppdatert (grense ${rule.hardMonths} mnd). ${rule.standardNb}`,
        en: `The document is ${ageEn} old and no longer counts as up to date (limit ${rule.hardMonths} mo). ${rule.standardEn}`,
      };
    }
  }

  if (state === "review_soon") {
    if (daysToValidTo != null && daysToValidTo >= 0 && daysToValidTo < 60) {
      return {
        nb: `Utløper om ${daysToValidTo} dager. Forbered en ny versjon i god tid.`,
        en: `Expires in ${daysToValidTo} days. Prepare a new version in good time.`,
      };
    }
    if (rule?.reviewMonths != null) {
      return {
        nb: `Dokumentet er ${ageNb} gammelt. ${rule.standardNb} — vurder å gjennomgå det nå.`,
        en: `The document is ${ageEn} old. ${rule.standardEn} — consider reviewing it now.`,
      };
    }
  }

  // compliant
  if (rule?.reviewMonths != null) {
    return {
      nb: `Dokumentet er ${ageNb} gammelt og innenfor anbefalt kadens. ${rule.standardNb}.`,
      en: `The document is ${ageEn} old and within the recommended cadence. ${rule.standardEn}.`,
    };
  }
  if (daysToValidTo != null) {
    return {
      nb: `Gyldig i ${daysToValidTo} dager til.`,
      en: `Valid for another ${daysToValidTo} days.`,
    };
  }
  return { nb: "I tråd.", en: "In compliance." };
}
