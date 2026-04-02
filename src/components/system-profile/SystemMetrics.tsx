import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TrustControlsPanel } from "@/components/trust-controls/TrustControlsPanel";

interface SystemMetricsProps {
  systemAsAsset: {
    id: string;
    name: string;
    vendor?: string | null;
    risk_level: string | null;
    compliance_score: number | null;
    next_review_date: string | null;
    criticality: string | null;
    work_area_id?: string | null;
    asset_manager?: string | null;
    asset_owner?: string | null;
    description?: string | null;
    gdpr_role?: string | null;
    contact_person?: string | null;
    contact_email?: string | null;
    updated_at?: string | null;
    asset_type?: string;
  };
  tasksCount: number;
  onTrustMetrics?: (metrics: { trustScore: number; confidenceScore: number; lastUpdated: string }) => void;
  onNavigateToTab?: (target: string) => void;
}

export const SystemMetrics = ({ systemAsAsset, tasksCount, onTrustMetrics, onNavigateToTab }: SystemMetricsProps) => {
  const { data: docsCount = 0 } = useQuery({
    queryKey: ["vendor-documents-count", systemAsAsset.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vendor_documents")
        .select("id")
        .eq("asset_id", systemAsAsset.id);
      if (error) return 0;
      return (data || []).length;
    },
  });

  const { data: relationsCount = 0 } = useQuery({
    queryKey: ["asset-relations-count", systemAsAsset.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("asset_relationships")
        .select("id")
        .or(`source_asset_id.eq.${systemAsAsset.id},target_asset_id.eq.${systemAsAsset.id}`);
      if (error) return 0;
      return (data || []).length;
    },
  });

  const { data: frameworks = [] } = useQuery({
    queryKey: ["selected-frameworks-active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("selected_frameworks")
        .select("framework_id, framework_name")
        .eq("is_selected", true);
      if (error) return [];
      return (data || []).map((fw: any) => ({
        framework_id: fw.framework_id,
        framework_name: fw.framework_name,
      }));
    },
  });

  return (
    <div className="space-y-3">
      <TrustControlsPanel
        asset={systemAsAsset}
        docsCount={docsCount}
        relationsCount={relationsCount}
        onTrustMetrics={onTrustMetrics}
        frameworks={frameworks}
      />
    </div>
  );
};
