import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertTriangle, CheckCircle2, Calendar, ListTodo, Shield, Send, TrendingUp, ShieldCheck, Layers, Target, Clock } from "lucide-react";
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
  };
  tasksCount: number;
}


export function AssetMetrics({ asset, tasksCount }: AssetMetricsProps) {
  const { t, i18n } = useTranslation();
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

  // complianceScore is no longer calculated here — TrustControlsPanel handles it

  const getRiskBadge = (level: string | null) => {
    switch (level) {
      case "high": return { color: "text-destructive", bg: "bg-destructive/10", label: t("trustProfile.riskHigh") };
      case "medium": return { color: "text-warning", bg: "bg-warning/10", label: t("trustProfile.riskMedium") };
      case "low": return { color: "text-success", bg: "bg-success/10", label: t("trustProfile.riskLow") };
      default: return { color: "text-muted-foreground", bg: "bg-muted", label: t("trustProfile.notSet") };
    }
  };

  const getCriticalityBadge = (level: string | null) => {
    switch (level) {
      case "critical": return { color: "text-destructive", bg: "bg-destructive/10", label: t("assets.criticalityCritical") };
      case "high": return { color: "text-warning", bg: "bg-warning/10", label: t("assets.criticalityHigh") };
      case "medium": return { color: "text-primary", bg: "bg-primary/10", label: t("assets.criticalityMedium") };
      case "low": return { color: "text-success", bg: "bg-success/10", label: t("assets.criticalityLow") };
      default: return { color: "text-muted-foreground", bg: "bg-muted", label: t("trustProfile.notSet") };
    }
  };

  const risk = getRiskBadge(asset.risk_level);
  const crit = getCriticalityBadge(asset.criticality);
  const complianceScore = 0; // placeholder for metric cards; real score is in TrustControlsPanel
  const complianceColor = "text-muted-foreground";
  const formattedReviewDate = asset.next_review_date
    ? new Date(asset.next_review_date).toLocaleDateString()
    : t("trustProfile.notSet");

  const smallMetrics = [
    { icon: AlertTriangle, label: t("trustProfile.riskLevel"), value: risk.label, valueClass: risk.color, bgClass: risk.bg },
    { icon: Shield, label: t("assets.criticality"), value: crit.label, valueClass: crit.color, bgClass: crit.bg },
    { icon: Calendar, label: t("trustProfile.nextReview"), value: formattedReviewDate, valueClass: "text-foreground", bgClass: "" },
    { icon: ListTodo, label: t("trustProfile.tasks"), value: String(tasksCount), valueClass: "text-foreground", bgClass: "" },
  ];

  const isSelf = asset.asset_type === "self";

  // Fetch company profile for Trust Profile summary
  const { data: companyProfile } = useQuery({
    queryKey: ["company_profile_trust_summary"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("company_profile")
        .select("governance_level, maturity, employees, updated_at")
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: isSelf,
  });

  // Fetch asset counts for scope
  const { data: assetCounts } = useQuery({
    queryKey: ["asset_type_counts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assets")
        .select("asset_type")
        .neq("asset_type", "self");
      if (error) return { systems: 0, vendors: 0, hardware: 0 };
      const items = data || [];
      return {
        systems: items.filter((a: any) => a.asset_type === "system").length,
        vendors: items.filter((a: any) => a.asset_type === "vendor").length,
        hardware: items.filter((a: any) => a.asset_type === "hardware").length,
      };
    },
    enabled: isSelf,
  });

  const getMaturityLabel = () => {
    // Map from scoring engine process step
    const avgMaturity = complianceScore >= 75 ? 3 : complianceScore >= 50 ? 2 : complianceScore >= 25 ? 1 : 0;
    if (avgMaturity >= 3) return isNb ? "Drift" : "Operational";
    if (avgMaturity >= 2) return isNb ? "Implementering" : "Implementing";
    return isNb ? "Fundament" : "Foundation";
  };

  const getGovernanceLevelLabel = () => {
    // In V1, Foundation is derived from compliance coverage
    // Full Foundation calculation would use FOUNDATION_CONTROLS from scoringEngine
    const hasBasics = complianceScore >= 30;
    return hasBasics ? (isNb ? "Etablert" : "Established") : (isNb ? "Pågår" : "In progress");
  };

  const getScopeLabel = () => {
    const sys = assetCounts?.systems || 0;
    const ven = assetCounts?.vendors || 0;
    if (sys + ven === 0) return isNb ? "Ikke kartlagt ennå" : "Not mapped yet";
    return isNb ? `${sys} systemer, ${ven} leverandører i scope` : `${sys} systems, ${ven} vendors in scope`;
  };

  const getLastUpdated = () => {
    const date = companyProfile?.updated_at || asset.next_review_date;
    if (!date) return "–";
    return new Date(date).toLocaleDateString(isNb ? "nb-NO" : "en-US", { month: "long", year: "numeric" });
  };

  return (
    <div className="space-y-3">
      {/* Trust Profile Summary + Security Domains side by side */}
      {isSelf && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
              {isNb ? "Sammendrag" : "Summary"}
            </h3>
            <div className="space-y-1">
              {[
                { label: "Trust Score", value: `${complianceScore}%` },
                { label: isNb ? "Grunnlagsstatus" : "Foundation Status", value: getGovernanceLevelLabel() },
                { label: isNb ? "Samsvarsmodenhet" : "Compliance Maturity", value: getMaturityLabel() },
                { label: isNb ? "Omfang" : "Scope", value: getScopeLabel() },
                { label: isNb ? "Sist oppdatert" : "Last Updated", value: getLastUpdated() },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <span className="text-sm text-muted-foreground">{row.label}</span>
                  <span className="text-sm font-semibold text-foreground">{row.value}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
              {isNb ? "Sikkerhetsdomener" : "Security Domains"}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { key: "governance", icon: Shield, label: "Governance", desc: isNb ? "Styring, ansvar og risikostyring" : "Governance, responsibility & risk", color: "text-primary", bg: "bg-primary/10" },
                { key: "operations", icon: Layers, label: "Operations", desc: isNb ? "Systemer, prosesser og drift" : "Systems, processes & operations", color: "text-success", bg: "bg-success/10" },
                { key: "identity_access", icon: ShieldCheck, label: "Identity & Access", desc: isNb ? "Brukere, roller og tilgangskontroll" : "Users, roles & access control", color: "text-warning", bg: "bg-warning/10" },
                { key: "supplier_ecosystem", icon: Target, label: "Supplier & Ecosystem", desc: isNb ? "Leverandører og tredjepartsrisiko" : "Vendors & third-party risk", color: "text-accent-foreground", bg: "bg-accent/20" },
              ].map((domain) => (
                <div key={domain.key} className="flex items-start gap-2.5 p-3 rounded-lg border border-border hover:border-primary/30 transition-colors">
                  <div className={`h-8 w-8 rounded-lg ${domain.bg} flex items-center justify-center shrink-0`}>
                    <domain.icon className={`h-4 w-4 ${domain.color}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">{domain.label}</p>
                    <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">{domain.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {expiredCount > 0 && asset.asset_type !== "self" && (
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
            onClick={() => setRequestDialogOpen(true)}
          >
            <Send className="h-3 w-3" />
            {isNb ? "Be om oppdatering" : "Request update"}
          </Button>
        </div>
      )}

      {/* Compliance Score — prominent card with checklist */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{isNb ? "Samsvar" : "Compliance"}</span>
          </div>
          <span className={`text-2xl font-bold ${complianceColor}`}>{complianceScore}%</span>
        </div>
        <Progress value={complianceScore} className="h-2 mb-3" />
        <TooltipProvider>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-1.5">
            {COMPLIANCE_CRITERIA.map((c) => {
              const done = fulfilled.includes(c.key);
              return (
                <Tooltip key={c.key}>
                  <TooltipTrigger asChild>
                    <div
                      className={`flex items-center gap-1.5 rounded-md px-2 py-1 text-[10px] transition-colors ${
                        done ? "bg-success/10 text-success" : "bg-muted/50 text-muted-foreground"
                      }`}
                    >
                      <CheckCircle2
                        className={`h-3 w-3 shrink-0 ${done ? "text-success" : "text-muted-foreground/30"}`}
                      />
                      <span className="truncate">{isNb ? c.labelNb : c.labelEn}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">
                    {done
                      ? `✓ ${isNb ? c.labelNb : c.labelEn} (+${c.points}%)`
                      : `${isNb ? "Mangler" : "Missing"}: ${isNb ? c.labelNb : c.labelEn} (+${c.points}%)`}
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </TooltipProvider>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {smallMetrics.map((m) => (
          <Card key={m.label} className="p-3.5">
            <div className="flex items-center gap-1.5 mb-2">
              <m.icon className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">
                {m.label}
              </span>
            </div>
            {m.bgClass ? (
              <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-semibold ${m.valueClass} ${m.bgClass}`}>
                {m.value}
              </span>
            ) : (
              <p className={`text-xl font-bold ${m.valueClass}`}>{m.value}</p>
            )}
          </Card>
        ))}
      </div>

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
