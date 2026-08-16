/**
 * Neste steg for en leverandør.
 *
 * Bygger en konkret tiltaksliste fra hull i leverandørdataen (bruk og kontekst,
 * GDPR-rolle, risiko, kritikalitet, manglende grunnlag) og fra regelverkstiltak.
 * Hvert steg vet om Lara kan utføre det agentisk, eller om det krever brukerens
 * beslutning.
 */

import type { VendorFrameworkAction } from "@/lib/vendorFrameworkSuggestions";

export type NextStepOwner = "lara" | "user";
export type NextStepSeverity = "critical" | "high" | "normal";

export type NextStepActionKey =
  | "usage_purpose"
  | "gdpr_role"
  | "risk_level"
  | "criticality"
  | "baseline"
  | "framework_action";

export interface NextStep {
  id: string;
  actionKey: NextStepActionKey;
  owner: NextStepOwner;
  severity: NextStepSeverity;
  titleNb: string;
  titleEn: string;
  /** Kort begrunnelse: hvorfor dette gjelder. */
  reasonNb: string;
  reasonEn: string;
  /** Hvilket krav / kilde steget henger på, f.eks. "GDPR art. 28". */
  contextLabel?: string;
  /** Kun for framework_action — brukes til å åpne riktig dialog. */
  action?: VendorFrameworkAction;
}

export interface VendorNextStepsInput {
  usagePurpose?: string | null;
  usageTags?: string[] | null;
  gdprRole?: string | null;
  riskLevel?: string | null;
  criticality?: string | null;
  /** Manuelt satt risiko (metadata.risk_set_by) — da regnes risiko som bekreftet. */
  riskSetBy?: string | null;
  /** Grunnlag er etterspurt eller Trust Profile er invitert. */
  baselineRequested?: boolean;
  /** Lara har et forslag klart for bruk og kontekst. */
  hasContextSuggestion?: boolean;
  frameworkActions?: VendorFrameworkAction[];
}

const isBlank = (v?: string | null) => !v || v.trim() === "" || v === "not_set";

const severityFromCriticality = (c: VendorFrameworkAction["criticality"]): NextStepSeverity =>
  c === "kritisk" ? "critical" : c === "hoy" ? "high" : "normal";

export function buildVendorNextSteps(input: VendorNextStepsInput): NextStep[] {
  const steps: NextStep[] = [];
  const hasUsage = !isBlank(input.usagePurpose) || (input.usageTags?.length ?? 0) > 0;

  if (!hasUsage) {
    steps.push({
      id: "usage_purpose",
      actionKey: "usage_purpose",
      owner: input.hasContextSuggestion ? "lara" : "user",
      severity: "high",
      titleNb: "Registrer hva leverandøren brukes til",
      titleEn: "Register what the vendor is used for",
      reasonNb:
        "Uten bruk og kontekst kan verken GDPR-rolle, risiko eller regelverk vurderes riktig.",
      reasonEn:
        "Without usage and context we cannot assess GDPR role, risk or applicable regulations.",
      contextLabel: "Bruk og kontekst",
    });
  }

  if (isBlank(input.gdprRole)) {
    steps.push({
      id: "gdpr_role",
      actionKey: "gdpr_role",
      owner: "lara",
      severity: "high",
      titleNb: "Bekreft GDPR-rolle",
      titleEn: "Confirm GDPR role",
      reasonNb:
        "Rollen avgjør om databehandleravtale (art. 28) er påkrevd for denne leverandøren.",
      reasonEn: "The role decides whether a processor agreement (art. 28) is required.",
      contextLabel: "GDPR art. 28",
    });
  }

  if (isBlank(input.riskLevel) || !input.riskSetBy) {
    steps.push({
      id: "risk_level",
      actionKey: "risk_level",
      owner: "lara",
      severity: "normal",
      titleNb: "Sett risikonivå",
      titleEn: "Set risk level",
      reasonNb:
        "Lara kan foreslå nivå ut fra kritikalitet, GDPR-rolle og om sensitive data behandles.",
      reasonEn:
        "Lara can suggest a level from criticality, GDPR role and whether sensitive data is processed.",
      contextLabel: "Risiko",
    });
  }

  if (isBlank(input.criticality)) {
    steps.push({
      id: "criticality",
      actionKey: "criticality",
      owner: "user",
      severity: "normal",
      titleNb: "Sett kritikalitet",
      titleEn: "Set criticality",
      reasonNb: "Kritikalitet er ditt valg og styrer oppfølgingsnivå og rapportering.",
      reasonEn: "Criticality is your choice and drives follow-up level and reporting.",
      contextLabel: "Kritikalitet",
    });
  }

  if (!input.baselineRequested) {
    steps.push({
      id: "baseline",
      actionKey: "baseline",
      owner: "lara",
      severity: "critical",
      titleNb: "Hent inn grunnlag fra leverandøren",
      titleEn: "Collect evidence from the vendor",
      reasonNb:
        "Lara kan kartlegge offentlige kilder eller invitere leverandøren til Agentisk Trust Profile.",
      reasonEn:
        "Lara can map public sources or invite the vendor to the Agentic Trust Profile.",
      contextLabel: "Grunnlag",
    });
  }

  for (const a of input.frameworkActions ?? []) {
    steps.push({
      id: `fw-${a.id}`,
      actionKey: "framework_action",
      owner: a.documentType ? "lara" : "user",
      severity: severityFromCriticality(a.criticality),
      titleNb: a.titleNb,
      titleEn: a.titleEn,
      reasonNb: a.reasonNb,
      reasonEn: a.reasonEn,
      contextLabel: a.requirement,
      action: a,
    });
  }

  const rank: Record<NextStepSeverity, number> = { critical: 0, high: 1, normal: 2 };
  return steps.sort((a, b) => rank[a.severity] - rank[b.severity]);
}

export const SEVERITY_DOT: Record<NextStepSeverity, string> = {
  critical: "bg-destructive",
  high: "bg-warning",
  normal: "bg-muted-foreground/50",
};
