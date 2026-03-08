/**
 * Mynder Scoring Engine
 * 
 * Implements the scoring methodology from the compliance maturity document.
 * All scores are derived from a single data point: maturity_level (0-4) per requirement/control.
 * 
 * Maturity levels:
 *   0 – Not started: No defined practice or documentation
 *   1 – Planned: Requirement understood, owner assigned, measures defined
 *   2 – Documented: Policy/procedure exists and is available
 *   3 – Implemented: Practice is carried out in operations (not just on paper)
 *   4 – Verified: Evidence exists (logs, audit, test) and is recently updated
 * 
 * score_per_requirement = maturity_level / 4
 * score_aggregate = avg(score_per_requirement) for all in-scope requirements
 */

import type { SLACategory } from "./certificationPhases";

// ─── Types ────────────────────────────────────────────────────

export type MaturityLevel = 0 | 1 | 2 | 3 | 4;

export const MATURITY_LEVEL_LABELS = {
  0: { en: "Not started", no: "Ikke startet" },
  1: { en: "Planned", no: "Planlagt" },
  2: { en: "Documented", no: "Dokumentert" },
  3: { en: "Implemented", no: "Implementert" },
  4: { en: "Verified", no: "Verifisert" },
} as const;

export interface ScoredRequirement {
  requirement_id: string;
  framework_id: string;
  domain: string;           // privacy | security | ai
  sla_category?: string;    // governance | operations | identity_access | supplier_ecosystem
  maturity_level: MaturityLevel;
  is_relevant: boolean;
  weight: number;           // default 1, range 1-3
  has_evidence: boolean;
}

export interface ScoreResult {
  score: number;            // 0-100
  assessed: number;         // count with maturity_level > 0
  total: number;            // total in scope
  avgMaturity: number;      // 0-4 average
}

export interface FoundationDomainResult {
  domain: SLACategory;
  controls: { id: string; label: string; level: MaturityLevel; ok: boolean }[];
  fulfilled: boolean;
}

export interface FoundationResult {
  status: "established" | "in_progress";
  domains: FoundationDomainResult[];
  allFulfilled: boolean;
}

export interface TrustScoreResult {
  total: number;            // 0-100
  compliance: number;       // 0-100
  riskExposure: number;     // 0-100
  coverage: number;         // 0-100
}

// ─── Foundation Controls (4 per domain) ───────────────────────

export interface FoundationControlDef {
  id: string;
  label_en: string;
  label_no: string;
  domain: SLACategory;
}

export const FOUNDATION_CONTROLS: FoundationControlDef[] = [
  // Governance
  { id: "gov_1", label_en: "Security policy defined", label_no: "Sikkerhetspolicy definert", domain: "governance" },
  { id: "gov_2", label_en: "Risk management process", label_no: "Risikostyringsprosess", domain: "governance" },
  { id: "gov_3", label_en: "Management commitment", label_no: "Ledelsesforankring", domain: "governance" },
  { id: "gov_4", label_en: "Compliance officer assigned", label_no: "Samsvarsansvarlig utpekt", domain: "governance" },
  // Operations
  { id: "ops_1", label_en: "System inventory", label_no: "Systemoversikt", domain: "operations" },
  { id: "ops_2", label_en: "Backup routines", label_no: "Backup-rutiner", domain: "operations" },
  { id: "ops_3", label_en: "Incident management", label_no: "Hendelseshåndtering", domain: "operations" },
  { id: "ops_4", label_en: "Change management", label_no: "Endringshåndtering", domain: "operations" },
  // Identity & Access
  { id: "iam_1", label_en: "Access control policy", label_no: "Tilgangskontrollpolicy", domain: "identity_access" },
  { id: "iam_2", label_en: "User provisioning", label_no: "Brukeradministrasjon", domain: "identity_access" },
  { id: "iam_3", label_en: "Authentication requirements", label_no: "Autentiseringskrav", domain: "identity_access" },
  { id: "iam_4", label_en: "Access review process", label_no: "Tilgangsgjennomgang", domain: "identity_access" },
  // Supplier & Ecosystem
  { id: "sup_1", label_en: "Vendor inventory", label_no: "Leverandøroversikt", domain: "supplier_ecosystem" },
  { id: "sup_2", label_en: "DPA management", label_no: "Databehandleravtaler", domain: "supplier_ecosystem" },
  { id: "sup_3", label_en: "Vendor risk assessment", label_no: "Leverandørrisikovurdering", domain: "supplier_ecosystem" },
  { id: "sup_4", label_en: "Subprocessor oversight", label_no: "Underleverandørkontroll", domain: "supplier_ecosystem" },
];

// ─── Core Scoring Functions ───────────────────────────────────

/**
 * Calculate score for a set of requirements.
 * score = avg(maturity_level / 4) * 100, only for in-scope items.
 * When weight is used: sum(score * weight) / sum(weight)
 */
export function calculateScore(requirements: ScoredRequirement[]): ScoreResult {
  const inScope = requirements.filter(r => r.is_relevant);
  if (inScope.length === 0) return { score: 0, assessed: 0, total: 0, avgMaturity: 0 };

  const totalWeight = inScope.reduce((s, r) => s + r.weight, 0);
  const weightedSum = inScope.reduce((s, r) => s + (r.maturity_level / 4) * r.weight, 0);
  const assessed = inScope.filter(r => r.maturity_level > 0).length;
  const avgMaturity = inScope.reduce((s, r) => s + r.maturity_level, 0) / inScope.length;

  return {
    score: Math.round((weightedSum / totalWeight) * 100),
    assessed,
    total: inScope.length,
    avgMaturity: Math.round(avgMaturity * 10) / 10,
  };
}

/**
 * Calculate score per framework (regulation).
 */
export function calculateScoreByFramework(
  requirements: ScoredRequirement[]
): Record<string, ScoreResult> {
  const byFw: Record<string, ScoredRequirement[]> = {};
  for (const r of requirements) {
    if (!byFw[r.framework_id]) byFw[r.framework_id] = [];
    byFw[r.framework_id].push(r);
  }
  const result: Record<string, ScoreResult> = {};
  for (const [fw, reqs] of Object.entries(byFw)) {
    result[fw] = calculateScore(reqs);
  }
  return result;
}

/**
 * Calculate score per domain (SLA category).
 */
export function calculateScoreByDomain(
  requirements: ScoredRequirement[]
): Record<string, ScoreResult> {
  const byDomain: Record<string, ScoredRequirement[]> = {};
  for (const r of requirements) {
    const cat = r.sla_category || "governance";
    if (!byDomain[cat]) byDomain[cat] = [];
    byDomain[cat].push(r);
  }
  const result: Record<string, ScoreResult> = {};
  for (const [domain, reqs] of Object.entries(byDomain)) {
    result[domain] = calculateScore(reqs);
  }
  return result;
}

/**
 * Calculate score per regulation domain (privacy/security/ai).
 */
export function calculateScoreByRegulationDomain(
  requirements: ScoredRequirement[]
): Record<string, ScoreResult> {
  const byDomain: Record<string, ScoredRequirement[]> = {};
  for (const r of requirements) {
    if (!byDomain[r.domain]) byDomain[r.domain] = [];
    byDomain[r.domain].push(r);
  }
  const result: Record<string, ScoreResult> = {};
  for (const [domain, reqs] of Object.entries(byDomain)) {
    result[domain] = calculateScore(reqs);
  }
  return result;
}

// ─── Foundation Calculation ───────────────────────────────────

/**
 * Calculate Foundation status.
 * 4 domains x 4 controls. Control "OK" when level >= 2.
 * Domain fulfilled when >= 3 of 4 controls are OK.
 * Foundation Established when all 4 domains are fulfilled.
 */
export function calculateFoundation(
  controlLevels: Record<string, MaturityLevel>
): FoundationResult {
  const domains: SLACategory[] = ["governance", "operations", "identity_access", "supplier_ecosystem"];
  
  const domainResults: FoundationDomainResult[] = domains.map(domain => {
    const domainControls = FOUNDATION_CONTROLS.filter(c => c.domain === domain);
    const controls = domainControls.map(c => ({
      id: c.id,
      label: c.label_en,
      level: controlLevels[c.id] ?? 0 as MaturityLevel,
      ok: (controlLevels[c.id] ?? 0) >= 2,
    }));
    const okCount = controls.filter(c => c.ok).length;
    return {
      domain,
      controls,
      fulfilled: okCount >= 3,
    };
  });

  const allFulfilled = domainResults.every(d => d.fulfilled);

  return {
    status: allFulfilled ? "established" : "in_progress",
    domains: domainResults,
    allFulfilled,
  };
}

// ─── Trust Score Calculation ──────────────────────────────────

/**
 * Trust Score = Compliance (60%) + Risk Exposure (30%) + Coverage (10%)
 * 
 * compliance: avg maturity score across all in-scope requirements
 * riskExposure: inverse of risk (100 = no risk, 0 = all high risk)
 * coverage: % of items that have been assessed (maturity_level > 0)
 */
export function calculateTrustScore(
  complianceScore: number,
  riskExposureScore: number,
  coveragePercent: number
): TrustScoreResult {
  const total = Math.round(
    complianceScore * 0.6 +
    riskExposureScore * 0.3 +
    coveragePercent * 0.1
  );

  return {
    total: Math.min(100, Math.max(0, total)),
    compliance: complianceScore,
    riskExposure: riskExposureScore,
    coverage: coveragePercent,
  };
}

/**
 * Calculate a simplified risk exposure score (V1).
 * Based on process risk scenarios: fewer high/critical risks = higher score.
 */
export function calculateRiskExposure(
  riskScenarios: Array<{ risk_level: string; mitigation_status: string }>
): number {
  if (riskScenarios.length === 0) return 50; // neutral when no data

  const weights: Record<string, number> = {
    critical: 4,
    high: 3,
    medium: 2,
    low: 1,
  };

  let totalRisk = 0;
  let maxRisk = 0;

  for (const s of riskScenarios) {
    const w = weights[s.risk_level] || 2;
    maxRisk += w;
    // Mitigated risks reduce exposure
    if (s.mitigation_status === "completed" || s.mitigation_status === "implemented") {
      totalRisk += 0; // fully mitigated
    } else if (s.mitigation_status === "in_progress") {
      totalRisk += w * 0.5;
    } else {
      totalRisk += w;
    }
  }

  if (maxRisk === 0) return 50;
  // Invert: high risk = low score
  return Math.round((1 - totalRisk / maxRisk) * 100);
}

/**
 * Map process step from average maturity level.
 */
export function getProcessStep(avgMaturity: number): "foundation" | "implementation" | "operation" {
  if (avgMaturity < 2) return "foundation";
  if (avgMaturity < 3) return "implementation";
  return "operation";
}

/**
 * Map legacy status to maturity level.
 */
export function statusToMaturityLevel(status: string): MaturityLevel {
  switch (status) {
    case "completed": return 4;
    case "in_progress": return 2;
    case "not_applicable": return 0;
    default: return 0;
  }
}
