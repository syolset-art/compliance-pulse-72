import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Send } from "lucide-react";
import { RequestUpdateDialog } from "./RequestUpdateDialog";
import { TrustControlsPanel } from "@/components/trust-controls/TrustControlsPanel";

interface AssetMetricsProps {
  asset: {
    id: string;
    name: string;
    vendor?: string | null;
    risk_level: string | null;
    compliance_score: number | null;
    next_review_date: string | null;
    criticality: string | null;
    asset_type?: string;
    work_area_id?: string | null;
    asset_manager?: string | null;
    asset_owner?: string | null;
    description?: string | null;
    gdpr_role?: string | null;
    contact_person?: string | null;
    contact_email?: string | null;
    updated_at?: string | null;
    metadata?: Record<string, any> | null;
  };
  tasksCount: number;
}

export function AssetMetrics({ asset, tasksCount }: AssetMetricsProps) {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);

  const { data: expiredCount = 0 } = useQuery({
    queryKey: ["expired-docs-count", asset.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vendor_documents")
        .select("id, valid_to")
        .eq("asset_id", asset.id)
        .not("valid_to", "is", null);
      if (error) throw error;
      const now = new Date();
      return (data || []).filter((d: any) => new Date(d.valid_to) < now).length;
    },
  });

  const { data: docsCount = 0 } = useQuery({
    queryKey: ["vendor-documents-count", asset.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vendor_documents")
        .select("id")
        .eq("asset_id", asset.id);
      if (error) return 0;
      return (data || []).length;
    },
  });

  const { data: relationsCount = 0 } = useQuery({
    queryKey: ["asset-relations-count", asset.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("asset_relationships")
        .select("id")
        .or(`source_asset_id.eq.${asset.id},target_asset_id.eq.${asset.id}`);
      if (error) return 0;
      return (data || []).length;
    },
  });

  // Fetch coverage counts
  const isSelf = asset.asset_type === "self";

  const { data: coverageCounts } = useQuery({
    queryKey: ["coverage-counts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assets")
        .select("asset_type")
        .neq("asset_type", "self");
      if (error) return { systems: 0, vendors: 0 };
      const items = data || [];
      return {
        systems: items.filter((a: any) => a.asset_type === "system").length,
        vendors: items.filter((a: any) => a.asset_type === "vendor").length,
      };
    },
    enabled: isSelf,
  });

  return (
    <div className="space-y-3">
      {/* Expired documents warning */}
      {expiredCount > 0 && asset.asset_type !== "self" && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3 p-3 rounded-lg bg-destructive/5 border border-destructive/20">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive shrink-0" aria-hidden="true" />
            <span className="text-sm font-medium text-destructive">
              {isNb
                ? `${expiredCount} dokument${expiredCount > 1 ? "er" : ""} er utløpt`
                : `${expiredCount} document${expiredCount > 1 ? "s" : ""} expired`}
            </span>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs gap-1.5 border-destructive/30 text-destructive hover:bg-destructive/10 w-full sm:w-auto"
            onClick={() => setRequestDialogOpen(true)}
          >
            <Send className="h-3 w-3" aria-hidden="true" />
            {isNb ? "Be om oppdatering" : "Request update"}
          </Button>
        </div>
      )}

      {/* Trust Snapshot Panel */}
      <TrustControlsPanel
        asset={asset}
        docsCount={docsCount}
        relationsCount={relationsCount}
        systemsCount={coverageCounts?.systems || 0}
        vendorsCount={coverageCounts?.vendors || 0}
        processesCount={0}
      />

      <RequestUpdateDialog
        open={requestDialogOpen}
        onOpenChange={setRequestDialogOpen}
        assetId={asset.id}
        assetName={asset.name}
        vendorName={asset.vendor || undefined}
      />
    </div>
  );
}
