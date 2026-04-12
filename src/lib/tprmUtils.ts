/**
 * Shared TPRM calculation utilities used by LaraInboxTab, UploadDocumentDialog, and VendorTPRMStatus.
 */

export type TPRMLevel = "approved" | "under_review" | "action_required" | "not_assessed";

export function getRiskLevel(criticality?: string | null, riskLevel?: string | null): "high" | "medium" | "low" | null {
  if (!criticality && !riskLevel) return null;
  const crit = criticality?.toLowerCase();
  const risk = riskLevel?.toLowerCase();
  if (crit === "critical" || crit === "high" || risk === "high") return "high";
  if (crit === "medium" || risk === "medium") return "medium";
  if (crit === "low" || risk === "low") return "low";
  return null;
}

export function getTPRMLevel(risk: "high" | "medium" | "low" | null, controlsMet: number, totalControls: number): TPRMLevel {
  if (risk === null) return "not_assessed";
  const controlRatio = controlsMet / totalControls;
  if (risk === "high" && controlRatio < 0.75) return "action_required";
  if (controlRatio >= 0.75) return "approved";
  return "under_review";
}

export interface TPRMControlCheck {
  hasDPA: boolean;
  hasSLA: boolean;
  hasRiskAssessment: boolean;
  hasAudit: boolean;
}

export function countTPRMControls(checks: TPRMControlCheck): number {
  return [checks.hasDPA, checks.hasSLA, checks.hasRiskAssessment, checks.hasAudit].filter(Boolean).length;
}

export const TPRM_TOTAL_CONTROLS = 4;

/** Check if a document type maps to one of the 4 TPRM controls */
export function isTPRMDocType(docType: string): boolean {
  return ["dpa", "sla", "risk_assessment"].includes(docType);
}

/** Calculate before/after TPRM state given existing docs and a new doc type */
export function calculateTPRMImpact(
  existingDocTypes: string[],
  hasAudit: boolean,
  newDocType: string,
  criticality?: string | null,
  riskLevel?: string | null,
) {
  const before: TPRMControlCheck = {
    hasDPA: existingDocTypes.includes("dpa"),
    hasSLA: existingDocTypes.includes("sla"),
    hasRiskAssessment: existingDocTypes.includes("risk_assessment"),
    hasAudit,
  };

  const afterTypes = [...new Set([...existingDocTypes, newDocType])];
  const after: TPRMControlCheck = {
    hasDPA: afterTypes.includes("dpa"),
    hasSLA: afterTypes.includes("sla"),
    hasRiskAssessment: afterTypes.includes("risk_assessment"),
    hasAudit,
  };

  const controlsBefore = countTPRMControls(before);
  const controlsAfter = countTPRMControls(after);
  const risk = getRiskLevel(criticality, riskLevel);
  const tprmLevelBefore = getTPRMLevel(risk, controlsBefore, TPRM_TOTAL_CONTROLS);
  const tprmLevelAfter = getTPRMLevel(risk, controlsAfter, TPRM_TOTAL_CONTROLS);

  return {
    controlsBefore,
    controlsAfter,
    controlsTotal: TPRM_TOTAL_CONTROLS,
    tprmLevelBefore,
    tprmLevelAfter,
    riskLevel: risk,
  };
}
