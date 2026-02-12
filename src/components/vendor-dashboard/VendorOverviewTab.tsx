import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { QuickActionsBar } from "./QuickActionsBar";
import { VendorMetricsRow } from "./VendorMetricsRow";
import { NeedsAttentionSection } from "./NeedsAttentionSection";
import { VendorCard } from "./VendorCard";

interface Asset {
  id: string;
  name: string;
  asset_type: string;
  category: string | null;
  compliance_score: number | null;
  risk_level: string | null;
  country?: string | null;
  region?: string | null;
  vendor?: string | null;
  next_review_date?: string | null;
}

interface VendorOverviewTabProps {
  vendors: Asset[];
  relationships: { source_asset_id: string; target_asset_id: string }[];
  onAddVendor: () => void;
  onDiscoverAI: () => void;
}

export function VendorOverviewTab({ vendors, relationships, onAddVendor, onDiscoverAI }: VendorOverviewTabProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { data: inboxCounts = {} } = useQuery({
    queryKey: ["lara-inbox-counts"],
    queryFn: async () => {
      const { data } = await supabase
        .from("lara_inbox")
        .select("matched_asset_id, id")
        .in("status", ["new", "auto_matched"]);
      const counts: Record<string, number> = {};
      data?.forEach(item => {
        if (item.matched_asset_id) {
          counts[item.matched_asset_id] = (counts[item.matched_asset_id] || 0) + 1;
        }
      });
      return counts;
    },
  });

  const metrics = useMemo(() => {
    const total = vendors.length;
    const compliant = vendors.filter(v => (v.compliance_score || 0) >= 80).length;
    const compliantPercent = total > 0 ? Math.round((compliant / total) * 100) : 0;
    // Simulate missing DPA based on low compliance
    const missingDPA = vendors.filter(v => (v.compliance_score || 0) < 30).length;
    const highRisk = vendors.filter(v => v.risk_level === "high").length;
    return { total, compliantPercent, missingDPA, highRisk };
  }, [vendors]);

  const attentionItems = useMemo(() => {
    const now = new Date();
    return [
      {
        type: "missing_dpa" as const,
        vendors: vendors.filter(v => (v.compliance_score || 0) < 30).map(v => ({ id: v.id, name: v.name })),
      },
      {
        type: "overdue_review" as const,
        vendors: vendors
          .filter(v => v.next_review_date && new Date(v.next_review_date) < now)
          .map(v => ({ id: v.id, name: v.name })),
      },
      {
        type: "high_risk_unaudited" as const,
        vendors: vendors
          .filter(v => v.risk_level === "high" && (v.compliance_score || 0) < 50)
          .map(v => ({ id: v.id, name: v.name })),
      },
    ];
  }, [vendors]);

  const vendorsByCategory = useMemo(() => {
    const groups: Record<string, Asset[]> = {};
    vendors.forEach(v => {
      const cat = v.category || t("vendorDashboard.uncategorized", "Uncategorized");
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(v);
    });
    return groups;
  }, [vendors, t]);

  const getConnectedCount = (vendorId: string) =>
    relationships.filter(r => r.source_asset_id === vendorId || r.target_asset_id === vendorId).length;

  const pendingReview = vendors.filter(v => v.next_review_date && new Date(v.next_review_date) < new Date()).length;

  return (
    <div className="space-y-6">
      <QuickActionsBar onAddVendor={onAddVendor} onDiscoverAI={onDiscoverAI} pendingReviewCount={pendingReview} />
      <VendorMetricsRow {...metrics} />
      <NeedsAttentionSection items={attentionItems} />

      {/* Vendors by Category */}
      {Object.entries(vendorsByCategory).map(([category, categoryVendors]) => (
        <div key={category}>
          <h3 className="text-sm font-semibold text-foreground mb-3">{category}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {categoryVendors.map(v => (
              <VendorCard
                key={v.id}
                vendor={v}
                connectedSystemsCount={getConnectedCount(v.id)}
                hasDPA={(v.compliance_score || 0) >= 30}
                inboxCount={inboxCounts[v.id] || 0}
                onClick={() => navigate(`/assets/${v.id}`)}
              />
            ))}
          </div>
        </div>
      ))}

      {vendors.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg mb-2">{t("vendorDashboard.noVendors", "No vendors yet")}</p>
          <p className="text-sm">{t("vendorDashboard.noVendorsDesc", "Add your first vendor to get started")}</p>
        </div>
      )}
    </div>
  );
}
