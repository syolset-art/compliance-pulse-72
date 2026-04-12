import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  TrendingUp, TrendingDown,
  Send, CheckCircle2, XCircle,
  Shield, Users, Server, Link2, AlertTriangle,
} from "lucide-react";
import { useTrustControlEvaluation } from "@/hooks/useTrustControlEvaluation";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { RequestUpdateDialog } from "../RequestUpdateDialog";
import { TrustControlsPanel } from "@/components/trust-controls/TrustControlsPanel";

interface VendorOverviewTabProps {
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
    metadata?: any;
  };
  tasksCount: number;
  onTrustMetrics?: (metrics: { trustScore: number; confidenceScore: number; lastUpdated: string }) => void;
  onNavigateToTab?: (tab: string) => void;
}

const DOMAIN_CARDS = [
  { area: "governance", icon: Shield, labelNb: "Styring", labelEn: "Governance", color: "text-blue-600" },
  { area: "risk_compliance", icon: Server, labelNb: "Drift og sikkerhet", labelEn: "Operations & Security", color: "text-emerald-600" },
  { area: "security_posture", icon: Users, labelNb: "Personvern og datahåndtering", labelEn: "Privacy & Data Handling", color: "text-violet-600" },
  { area: "supplier_governance", icon: Link2, labelNb: "Tredjepartstyring og verdikjede", labelEn: "Third-Party & Value Chain", color: "text-amber-600" },
];

export const VendorOverviewTab = ({ asset, tasksCount, onTrustMetrics, onNavigateToTab }: VendorOverviewTabProps) => {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";
  const evaluation = useTrustControlEvaluation(asset.id);
  const [requestOpen, setRequestOpen] = useState(false);

  const trustScore = evaluation?.trustScore ?? 0;
  const confidenceScore = evaluation?.confidenceScore ?? 0;

  const strengths: string[] = [];
  const concerns: string[] = [];

  if (evaluation) {
    const { allControls } = evaluation;
    const implemented = allControls.filter(c => c.status === "implemented");
    const missing = allControls.filter(c => c.status === "missing");
    implemented.slice(0, 3).forEach(c => strengths.push(isNb ? c.labelNb : c.labelEn));
    missing.slice(0, 3).forEach(c => concerns.push(isNb ? c.labelNb : c.labelEn));
  }

  // Fetch data needed by TrustControlsPanel
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

  return (
    <div className="space-y-6">
      {/* Expired documents warning */}
      {expiredCount > 0 && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3 p-3 rounded-lg bg-destructive/5 border border-destructive/20">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
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
            onClick={() => setRequestOpen(true)}
          >
            <Send className="h-3 w-3" />
            {isNb ? "Be om oppdatering" : "Request update"}
          </Button>
        </div>
      )}

      {/* Trust Controls Panel — same as shown above tabs for self assets */}
      <TrustControlsPanel
        asset={asset}
        docsCount={docsCount}
        relationsCount={relationsCount}
        onTrustMetrics={onTrustMetrics}
        frameworks={frameworks}
        onNavigateToTab={onNavigateToTab}
      />

      {/* Strengths / Concerns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-success">
              <TrendingUp className="h-4 w-4" />
              {isNb ? "Styrker" : "Strengths"}
            </div>
            {strengths.length > 0 ? strengths.map((s, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0" />
                <span>{s}</span>
              </div>
            )) : (
              <p className="text-xs text-muted-foreground italic">{isNb ? "Ingen data ennå" : "No data yet"}</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-destructive">
              <TrendingDown className="h-4 w-4" />
              {isNb ? "Bekymringer" : "Concerns"}
            </div>
            {concerns.length > 0 ? concerns.map((c, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <XCircle className="h-3.5 w-3.5 text-destructive shrink-0" />
                <span>{c}</span>
              </div>
            )) : (
              <p className="text-xs text-muted-foreground italic">{isNb ? "Ingen bekymringer" : "No concerns"}</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Domain cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {DOMAIN_CARDS.map(({ area, icon: Icon, labelNb: lNb, labelEn: lEn, color }) => {
          const score = evaluation?.areaScore(area as any) ?? 0;
          const scoreClr = score >= 70 ? "text-success" : score >= 40 ? "text-warning" : "text-destructive";
          return (
            <Card
              key={area}
              className="cursor-pointer hover:border-primary/40 transition-colors"
              onClick={() => onNavigateToTab?.("controls")}
            >
              <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                <Icon className={`h-6 w-6 ${color}`} />
                <span className="text-xs font-medium">{isNb ? lNb : lEn}</span>
                <span className={`text-xl font-bold ${scoreClr}`}>{score}%</span>
                <Progress value={score} className="h-1.5 w-full" />
              </CardContent>
            </Card>
          );
        })}
      </div>

      {requestOpen && (
        <RequestUpdateDialog
          assetId={asset.id}
          assetName={asset.name || ""}
          vendorName={asset.vendor || undefined}
          open={requestOpen}
          onOpenChange={setRequestOpen}
        />
      )}
    </div>
  );
};
