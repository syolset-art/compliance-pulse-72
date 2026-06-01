import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  type EvaluatedControl,
  type TrustControlStatus,
  type ControlArea,
  GENERIC_CONTROLS,
  getTypeSpecificControls,
  calculateTrustScore,
  calculateConfidenceScore,
  deriveKeyRisks,
  inferVerificationSource,
  groupControlsByArea,
  applyEvidencePenalties,
} from "@/lib/trustControlDefinitions";

interface AssetLike {
  id: string;
  asset_type?: string;
  asset_owner?: string | null;
  asset_manager?: string | null;
  description?: string | null;
  risk_level?: string | null;
  criticality?: string | null;
  next_review_date?: string | null;
  gdpr_role?: string | null;
  contact_person?: string | null;
  contact_email?: string | null;
  work_area_id?: string | null;
  metadata?: Record<string, any> | null;
  updated_at?: string | null;
}

function evaluateGenericControl(key: string, asset: AssetLike, docsCount: number): TrustControlStatus {
  const meta = (asset.metadata || {}) as Record<string, any>;
  switch (key) {
    case "risk_level_defined": return asset.risk_level ? "implemented" : "missing";
    case "criticality_defined": return asset.criticality ? "implemented" : "missing";
    case "risk_assessment": return asset.risk_level ? "partial" : "missing";
    case "documentation_available": return docsCount >= 3 ? "implemented" : docsCount > 0 ? "partial" : "missing";
    default: return "missing";
  }
}

/**
 * For "self"-type assets, many control keys are not directly stored on the asset.metadata.
 * Onboarding writes data into `company_profile` (key personnel, governance level, compliance org).
 * This function derives a partial/implemented fallback for self-controls based on that profile,
 * so the Trust Profile maturity-per-area widget is populated immediately after onboarding instead
 * of showing zeros for every domain.
 */
function deriveSelfFromProfile(key: string, profile: Record<string, any> | null): TrustControlStatus | null {
  if (!profile) return null;
  const level: string | null = profile.governance_level || null;
  const isStructuredOrUp = level === "structured" || level === "certification_ready";
  const isCertReady = level === "certification_ready";
  const hasDpo = !!(profile.dpo_name && profile.dpo_email);
  const hasCiso = !!(profile.ciso_name && profile.ciso_email);
  const hasCompliance = !!(profile.compliance_officer && profile.compliance_officer_email);
  const hasComplianceOrg = !!profile.compliance_organization;

  switch (key) {
    // Governance — anchored on key personnel + governance level
    case "security_responsibility":
      if (hasCiso && hasDpo) return "implemented";
      if (hasCiso || hasDpo || hasCompliance) return "partial";
      return null;
    case "documented_policies":
      if (isCertReady) return "implemented";
      if (isStructuredOrUp || hasComplianceOrg) return "partial";
      return level === "foundation" ? "partial" : null;
    case "risk_assessment_recent":
      if (isCertReady) return "implemented";
      if (isStructuredOrUp) return "partial";
      return null;
    case "incident_handling":
      if (isCertReady && hasCiso) return "implemented";
      if (isStructuredOrUp || hasCiso) return "partial";
      return null;
    // Security posture — proxied by governance level
    case "access_control":
    case "mfa_org":
    case "encryption_org":
      if (isCertReady) return "implemented";
      if (isStructuredOrUp) return "partial";
      return level === "foundation" ? "partial" : null;
    case "logging_monitoring":
    case "security_testing":
      if (isCertReady) return "partial";
      return null;
    // Privacy & data — anchored on DPO + governance level
    case "ropa":
      if (hasDpo && isStructuredOrUp) return "implemented";
      if (hasDpo) return "partial";
      return null;
    case "dpa_org":
      if (isCertReady) return "implemented";
      if (isStructuredOrUp || hasDpo) return "partial";
      return null;
    case "dpia":
    case "data_subject_rights":
      if (hasDpo && isCertReady) return "implemented";
      if (hasDpo || isStructuredOrUp) return "partial";
      return null;
    case "data_storage_control":
      if (isCertReady) return "implemented";
      if (isStructuredOrUp) return "partial";
      return null;
    // Supplier governance — proxied by governance level
    case "vendor_inventory":
      if (isCertReady) return "implemented";
      if (isStructuredOrUp) return "partial";
      return level === "foundation" ? "partial" : null;
    case "vendor_risk_assessment":
      if (isCertReady) return "implemented";
      if (isStructuredOrUp) return "partial";
      return null;
    case "vendor_followup":
      if (isCertReady) return "partial";
      return null;
    default:
      return null;
  }
}

function evaluateTypeControl(
  key: string,
  assetType: string,
  asset: AssetLike,
  docsCount: number,
  profile: Record<string, any> | null,
): TrustControlStatus {
  const meta = (asset.metadata || {}) as Record<string, any>;
  const maps: Record<string, Record<string, () => TrustControlStatus>> = {
    vendor: {
      dpa_verified: () => meta.dpa_verified ? "implemented" : docsCount > 0 ? "partial" : "missing",
      security_contact: () => asset.contact_email ? "implemented" : asset.contact_person ? "partial" : "missing",
      sub_processors_disclosed: () => meta.sub_processors_disclosed ? "implemented" : "missing",
      vendor_security_review: () => meta.vendor_security_review ? "implemented" : "missing",
      // Privacy & Data Handling
      vendor_privacy_policy: () => meta.vendor_privacy_policy ? "implemented" : meta.privacy_policy_url ? "implemented" : "missing",
      vendor_data_location: () => meta.vendor_data_location ? "implemented" : meta.data_locations ? "partial" : "missing",
      vendor_data_retention: () => meta.vendor_data_retention ? "implemented" : "missing",
      vendor_data_portability: () => meta.vendor_data_portability ? "implemented" : "missing",
      vendor_gdpr_compliant: () => meta.vendor_gdpr_compliant ? "implemented" : meta.gdpr_status === "partial" ? "partial" : "missing",
    },
    system: {
      mfa_enabled: () => meta.mfa_enabled ? "implemented" : "missing",
      encryption_enabled: () => meta.encryption_enabled ? "implemented" : "missing",
      backup_configured: () => meta.backup_configured ? "implemented" : "missing",
      security_logging: () => meta.security_logging ? "implemented" : "missing",
      // Privacy & Data Handling
      system_personal_data_mapped: () => meta.system_personal_data_mapped ? "implemented" : meta.personal_data_mapped ? "implemented" : "missing",
      system_legal_basis: () => meta.system_legal_basis ? "implemented" : "missing",
      system_data_retention: () => meta.system_data_retention ? "implemented" : meta.retention_defined ? "partial" : "missing",
      system_access_logging: () => meta.system_access_logging ? "implemented" : "missing",
      system_data_minimization: () => meta.system_data_minimization ? "implemented" : "missing",
    },
    hardware: {
      device_encryption: () => meta.disk_encrypted ? "implemented" : "missing",
      endpoint_protection: () => meta.antivirus ? "implemented" : "missing",
      patch_management: () => meta.patch_management ? "implemented" : "missing",
    },
    self: {
      security_responsibility: () => {
        const val = meta.security_responsibility;
        if (val === "yes") return "implemented";
        if (val === "partial") return "partial";
        // Registered contact information signals responsibility/accountability
        const contacts = (meta.contacts || {}) as Record<string, any>;
        const hasSecurityContact = !!(contacts.security && String(contacts.security).trim());
        const hasPrivacyContact = !!(contacts.privacy && String(contacts.privacy).trim());
        if (hasSecurityContact && hasPrivacyContact) return "implemented";
        if (hasSecurityContact || hasPrivacyContact) return "partial";
        if (asset.asset_manager || meta.security_responsibility_defined) return "implemented";
        return deriveSelfFromProfile("security_responsibility", profile) ?? "missing";
      },
      documented_policies: () => {
        const val = meta.documented_policies;
        if (val === "yes") return "implemented";
        if (val === "partial") return "partial";
        return deriveSelfFromProfile("documented_policies", profile) ?? "missing";
      },
      risk_assessment_recent: () => {
        const val = meta.risk_assessment_recent;
        if (val === "yes") return "implemented";
        if (val === "partial") return "partial";
        return deriveSelfFromProfile("risk_assessment_recent", profile) ?? "missing";
      },
      incident_handling: () => {
        const val = meta.incident_handling;
        if (val === "yes") return "implemented";
        if (val === "partial") return "partial";
        if (meta.incident_reporting_defined) return "implemented";
        return deriveSelfFromProfile("incident_handling", profile) ?? "missing";
      },
      access_control: () => {
        const val = meta.access_control;
        if (val === "yes") return "implemented";
        if (val === "partial") return "partial";
        return deriveSelfFromProfile("access_control", profile) ?? "missing";
      },
      mfa_org: () => {
        const val = meta.mfa_org;
        if (val === "yes") return "implemented";
        if (val === "partial") return "partial";
        return deriveSelfFromProfile("mfa_org", profile) ?? "missing";
      },
      encryption_org: () => {
        const val = meta.encryption_org;
        if (val === "yes") return "implemented";
        if (val === "partial") return "partial";
        return deriveSelfFromProfile("encryption_org", profile) ?? "missing";
      },
      logging_monitoring: () => {
        const val = meta.logging_monitoring;
        if (val === "yes") return "implemented";
        if (val === "partial") return "partial";
        return deriveSelfFromProfile("logging_monitoring", profile) ?? "missing";
      },
      security_testing: () => {
        const val = meta.security_testing;
        if (val === "yes") return "implemented";
        if (val === "partial") return "partial";
        return deriveSelfFromProfile("security_testing", profile) ?? "missing";
      },
      ropa: () => {
        const val = meta.ropa;
        if (val === "yes") return "implemented";
        if (val === "partial") return "partial";
        return deriveSelfFromProfile("ropa", profile) ?? "missing";
      },
      dpa_org: () => {
        const val = meta.dpa_org;
        if (val === "yes") return "implemented";
        if (val === "partial") return "partial";
        return deriveSelfFromProfile("dpa_org", profile) ?? "missing";
      },
      dpia: () => {
        const val = meta.dpia;
        if (val === "yes") return "implemented";
        if (val === "partial") return "partial";
        return deriveSelfFromProfile("dpia", profile) ?? "missing";
      },
      data_subject_rights: () => {
        const val = meta.data_subject_rights;
        if (val === "yes") return "implemented";
        if (val === "partial") return "partial";
        return deriveSelfFromProfile("data_subject_rights", profile) ?? "missing";
      },
      data_storage_control: () => {
        const val = meta.data_storage_control;
        if (val === "yes") return "implemented";
        if (val === "partial") return "partial";
        return deriveSelfFromProfile("data_storage_control", profile) ?? "missing";
      },
      vendor_inventory: () => {
        const val = meta.vendor_inventory;
        if (val === "yes") return "implemented";
        if (val === "partial") return "partial";
        return deriveSelfFromProfile("vendor_inventory", profile) ?? "missing";
      },
      vendor_risk_assessment: () => {
        const val = meta.vendor_risk_assessment;
        if (val === "yes") return "implemented";
        if (val === "partial") return "partial";
        return deriveSelfFromProfile("vendor_risk_assessment", profile) ?? "missing";
      },
      vendor_followup: () => {
        const val = meta.vendor_followup;
        if (val === "yes") return "implemented";
        if (val === "partial") return "partial";
        return deriveSelfFromProfile("vendor_followup", profile) ?? "missing";
      },
    },
  };
  return maps[assetType]?.[key]?.() ?? "missing";
}

export function useTrustControlEvaluation(assetId: string) {
  const { data: asset } = useQuery({
    queryKey: ["asset-for-trust-eval", assetId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assets")
        .select("*")
        .eq("id", assetId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!assetId,
  });

  const { data: docsCount = 0 } = useQuery({
    queryKey: ["asset-docs-count", assetId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("framework_documents")
        .select("*", { count: "exact", head: true })
        .eq("framework_id", assetId);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!assetId,
  });

  const { data: evidenceChecks = [] } = useQuery({
    queryKey: ["evidence-checks", assetId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("evidence_checks")
        .select("control_key, status, check_type, last_verified_at, expires_at, staleness_days")
        .eq("asset_id", assetId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!assetId,
  });

  // Company profile is used to derive partial/implemented fallbacks for "self"-type assets
  // when the asset metadata does not yet store explicit answers (e.g. straight after onboarding).
  const { data: companyProfile = null } = useQuery({
    queryKey: ["company-profile-for-trust-eval"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("company_profile" as any)
        .select("governance_level, compliance_organization, compliance_officer, compliance_officer_email, dpo_name, dpo_email, ciso_name, ciso_email")
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return (data as any) || null;
    },
  });

  return useMemo(() => {
    if (!asset) return null;

    const effectiveType = asset.asset_type || "";
    const assetLike: AssetLike = {
      ...asset,
      metadata: (asset.metadata as Record<string, any>) || null,
    };

    // For "self" type, use only ORG_CONTROLS (all 17 trust controls); skip generic controls
    const isSelf = effectiveType === "self";
    const meta = (asset.metadata as Record<string, any>) || {};
    const applyNotApplicable = (c: EvaluatedControl): EvaluatedControl =>
      meta[c.key] === "n_a" ? { ...c, status: "not_applicable" as const } : c;

    const evaluatedGeneric: EvaluatedControl[] = isSelf ? [] : GENERIC_CONTROLS.map((c) => applyNotApplicable({
      ...c,
      status: evaluateGenericControl(c.key, assetLike, docsCount),
      verificationSource: inferVerificationSource(c.key, assetLike, docsCount),
    }));
    const typeDefinitions = getTypeSpecificControls(effectiveType);
    const evaluatedType: EvaluatedControl[] = typeDefinitions.map((c) => applyNotApplicable({
      ...c,
      status: evaluateTypeControl(c.key, effectiveType, assetLike, docsCount, companyProfile),
      verificationSource: inferVerificationSource(c.key, assetLike, docsCount),
    }));
    
    // Apply evidence-based penalties before scoring
    const rawControls = [...evaluatedGeneric, ...evaluatedType];
    const allControls = applyEvidencePenalties(rawControls, evidenceChecks);

    const trustScore = calculateTrustScore(allControls);
    const confidenceScore = calculateConfidenceScore(allControls);
    const risks = deriveKeyRisks(allControls);
    const grouped = groupControlsByArea(allControls);

    const implementedCount = allControls.filter(c => c.status === "implemented").length;
    const partialCount = allControls.filter(c => c.status === "partial").length;
    const missingCount = allControls.filter(c => c.status === "missing").length;

    const areaScore = (area: ControlArea) => {
      const controls = grouped[area];
      if (!controls || controls.length === 0) return 0;
      // Exclude "not_applicable" from both numerator and denominator.
      const scored = controls.filter(c => c.status !== "not_applicable");
      if (scored.length === 0) return 0;
      const impl = scored.filter(c => c.status === "implemented").length;
      const partial = scored.filter(c => c.status === "partial").length;
      return Math.round(((impl + partial * 0.5) / scored.length) * 100);
    };

    // Derive evidence summary per area
    const evidenceSummary = Object.entries(grouped).reduce((acc, [area, controls]) => {
      const controlKeys = controls.map(c => c.key);
      const areaChecks = evidenceChecks.filter(ec => controlKeys.includes(ec.control_key));
      const statuses = areaChecks.map(ec => ec.status as "fresh" | "stale" | "expired" | "missing");
      const worst = statuses.includes("expired") ? "expired"
        : statuses.includes("stale") ? "stale"
        : statuses.length > 0 ? "fresh" : null;
      acc[area as ControlArea] = {
        worst,
        staleCount: statuses.filter(s => s === "stale").length,
        expiredCount: statuses.filter(s => s === "expired").length,
        lastChecked: areaChecks.length > 0
          ? areaChecks.reduce((latest, ec) => {
              const t = ec.last_verified_at || "";
              return t > latest ? t : latest;
            }, "")
          : null,
      };
      return acc;
    }, {} as Record<ControlArea, { worst: string | null; staleCount: number; expiredCount: number; lastChecked: string | null }>);

    return {
      allControls,
      trustScore,
      confidenceScore,
      risks,
      grouped,
      implementedCount,
      partialCount,
      missingCount,
      areaScore,
      evidenceSummary,
      evidenceChecks,
    };
  }, [asset, docsCount, evidenceChecks, companyProfile]);
}
