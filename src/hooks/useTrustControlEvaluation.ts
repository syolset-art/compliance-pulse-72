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

function evaluateTypeControl(key: string, assetType: string, asset: AssetLike, docsCount: number): TrustControlStatus {
  const meta = (asset.metadata || {}) as Record<string, any>;
  const maps: Record<string, Record<string, () => TrustControlStatus>> = {
    vendor: {
      dpa_verified: () => meta.dpa_verified ? "implemented" : docsCount > 0 ? "partial" : "missing",
      security_contact: () => asset.contact_email ? "implemented" : asset.contact_person ? "partial" : "missing",
      sub_processors_disclosed: () => meta.sub_processors_disclosed ? "implemented" : "missing",
      vendor_security_review: () => meta.vendor_security_review ? "implemented" : "missing",
    },
    system: {
      mfa_enabled: () => meta.mfa_enabled ? "implemented" : "missing",
      encryption_enabled: () => meta.encryption_enabled ? "implemented" : "missing",
      backup_configured: () => meta.backup_configured ? "implemented" : "missing",
      security_logging: () => meta.security_logging ? "implemented" : "missing",
    },
    hardware: {
      device_encryption: () => meta.disk_encrypted ? "implemented" : "missing",
      endpoint_protection: () => meta.antivirus ? "implemented" : "missing",
      patch_management: () => meta.patch_management ? "implemented" : "missing",
    },
    self: {
      security_responsibility: () => {
        const val = meta.security_responsibility;
        return val === "yes" ? "implemented" : val === "partial" ? "partial" : (asset.asset_manager || meta.security_responsibility_defined) ? "implemented" : "missing";
      },
      documented_policies: () => {
        const val = meta.documented_policies;
        return val === "yes" ? "implemented" : val === "partial" ? "partial" : "missing";
      },
      risk_assessment_recent: () => {
        const val = meta.risk_assessment_recent;
        return val === "yes" ? "implemented" : val === "partial" ? "partial" : "missing";
      },
      incident_handling: () => {
        const val = meta.incident_handling;
        return val === "yes" ? "implemented" : val === "partial" ? "partial" : (meta.incident_reporting_defined ? "implemented" : "missing");
      },
      access_control: () => {
        const val = meta.access_control;
        return val === "yes" ? "implemented" : val === "partial" ? "partial" : "missing";
      },
      mfa_org: () => {
        const val = meta.mfa_org;
        return val === "yes" ? "implemented" : val === "partial" ? "partial" : "missing";
      },
      encryption_org: () => {
        const val = meta.encryption_org;
        return val === "yes" ? "implemented" : val === "partial" ? "partial" : "missing";
      },
      logging_monitoring: () => {
        const val = meta.logging_monitoring;
        return val === "yes" ? "implemented" : val === "partial" ? "partial" : "missing";
      },
      security_testing: () => {
        const val = meta.security_testing;
        return val === "yes" ? "implemented" : val === "partial" ? "partial" : "missing";
      },
      ropa: () => {
        const val = meta.ropa;
        return val === "yes" ? "implemented" : val === "partial" ? "partial" : "missing";
      },
      dpa_org: () => {
        const val = meta.dpa_org;
        return val === "yes" ? "implemented" : val === "partial" ? "partial" : "missing";
      },
      dpia: () => {
        const val = meta.dpia;
        return val === "yes" ? "implemented" : val === "partial" ? "partial" : "missing";
      },
      data_subject_rights: () => {
        const val = meta.data_subject_rights;
        return val === "yes" ? "implemented" : val === "partial" ? "partial" : "missing";
      },
      data_storage_control: () => {
        const val = meta.data_storage_control;
        return val === "yes" ? "implemented" : val === "partial" ? "partial" : "missing";
      },
      vendor_inventory: () => {
        const val = meta.vendor_inventory;
        return val === "yes" ? "implemented" : val === "partial" ? "partial" : "missing";
      },
      vendor_risk_assessment: () => {
        const val = meta.vendor_risk_assessment;
        return val === "yes" ? "implemented" : val === "partial" ? "partial" : "missing";
      },
      vendor_followup: () => {
        const val = meta.vendor_followup;
        return val === "yes" ? "implemented" : val === "partial" ? "partial" : "missing";
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

  return useMemo(() => {
    if (!asset) return null;

    const effectiveType = asset.asset_type || "";
    const assetLike: AssetLike = {
      ...asset,
      metadata: (asset.metadata as Record<string, any>) || null,
    };

    // For "self" type, use only ORG_CONTROLS (all 17 trust controls); skip generic controls
    const isSelf = effectiveType === "self";
    const evaluatedGeneric: EvaluatedControl[] = isSelf ? [] : GENERIC_CONTROLS.map((c) => ({
      ...c,
      status: evaluateGenericControl(c.key, assetLike, docsCount),
      verificationSource: inferVerificationSource(c.key, assetLike, docsCount),
    }));
    const typeDefinitions = getTypeSpecificControls(effectiveType);
    const evaluatedType: EvaluatedControl[] = typeDefinitions.map((c) => ({
      ...c,
      status: evaluateTypeControl(c.key, effectiveType, assetLike, docsCount),
      verificationSource: inferVerificationSource(c.key, assetLike, docsCount),
    }));
    const allControls = [...evaluatedGeneric, ...evaluatedType];

    const trustScore = calculateTrustScore(allControls);
    const confidenceScore = calculateConfidenceScore(allControls);
    const risks = deriveKeyRisks(allControls);
    const grouped = groupControlsByArea(allControls);

    const implementedCount = allControls.filter(c => c.status === "implemented").length;
    const partialCount = allControls.filter(c => c.status === "partial").length;
    const missingCount = allControls.filter(c => c.status === "missing").length;

    const areaScore = (area: ControlArea) => {
      const controls = grouped[area];
      if (controls.length === 0) return 0;
      const impl = controls.filter(c => c.status === "implemented").length;
      const partial = controls.filter(c => c.status === "partial").length;
      return Math.round(((impl + partial * 0.5) / controls.length) * 100);
    };

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
    };
  }, [asset, docsCount]);
}
