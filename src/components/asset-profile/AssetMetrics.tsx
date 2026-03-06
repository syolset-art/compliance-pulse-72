import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertTriangle, CheckCircle2, Calendar, ListTodo, Shield, Send, TrendingUp, ShieldCheck, Layers, Target, Clock } from "lucide-react";
import { CERTIFICATION_PHASES } from "@/lib/certificationPhases";
import { GOVERNANCE_LEVELS, type GovernanceLevel } from "@/lib/governanceLevelEngine";
import { RequestUpdateDialog } from "./RequestUpdateDialog";

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

// Each criterion contributes points — total = 100%
const COMPLIANCE_CRITERIA = [
  { key: "owner", points: 15, labelNb: "Eier tilordnet", labelEn: "Owner assigned" },
  { key: "manager", points: 10, labelNb: "Ansvarlig person", labelEn: "Responsible person" },
  { key: "description", points: 5, labelNb: "Beskrivelse utfylt", labelEn: "Description filled" },
  { key: "risk_level", points: 10, labelNb: "Risikonivå satt", labelEn: "Risk level set" },
  { key: "criticality", points: 5, labelNb: "Kritikalitet satt", labelEn: "Criticality set" },
  { key: "gdpr_role", points: 10, labelNb: "GDPR-rolle definert", labelEn: "GDPR role defined" },
  { key: "contact", points: 5, labelNb: "Kontaktperson", labelEn: "Contact person" },
  { key: "review_date", points: 5, labelNb: "Neste gjennomgang", labelEn: "Next review date" },
  { key: "documents", points: 25, labelNb: "Dokumenter lastet opp", labelEn: "Documents uploaded" },
  { key: "relations", points: 10, labelNb: "Relasjoner definert", labelEn: "Relations defined" },
];

const TOTAL_POINTS = COMPLIANCE_CRITERIA.reduce((s, c) => s + c.points, 0);

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

  // Dynamic compliance calculation
  const fulfilled: string[] = [];
  if (asset.work_area_id) fulfilled.push("owner");
  if (asset.asset_manager) fulfilled.push("manager");
  if (asset.description) fulfilled.push("description");
  if (asset.risk_level) fulfilled.push("risk_level");
  if (asset.criticality) fulfilled.push("criticality");
  if (asset.gdpr_role) fulfilled.push("gdpr_role");
  if (asset.contact_person || asset.contact_email) fulfilled.push("contact");
  if (asset.next_review_date) fulfilled.push("review_date");
  if (docsCount > 0) fulfilled.push("documents");
  if (relationsCount > 0) fulfilled.push("relations");

  const earnedPoints = COMPLIANCE_CRITERIA
    .filter((c) => fulfilled.includes(c.key))
    .reduce((s, c) => s + c.points, 0);
  const complianceScore = Math.round((earnedPoints / TOTAL_POINTS) * 100);

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
  const complianceColor = complianceScore >= 80 ? "text-success" : complianceScore >= 50 ? "text-warning" : complianceScore > 0 ? "text-primary" : "text-muted-foreground";
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
    const phase = companyProfile?.maturity;
    if (!phase) return isNb ? "Ikke satt" : "Not set";
    // Map maturity values to phase names
    const maturityMap: Record<string, string> = {
      beginner: isNb ? "Fundament" : "Foundation",
      intermediate: isNb ? "Implementering" : "Implementation",
      advanced: isNb ? "Drift" : "Operational",
    };
    return maturityMap[phase] || phase;
  };

  const getGovernanceLevelLabel = () => {
    const level = companyProfile?.governance_level as GovernanceLevel | null;
    const def = GOVERNANCE_LEVELS.find((g) => g.id === level);
    if (!def) return isNb ? "Ikke satt" : "Not set";
    return isNb ? def.name_no.replace(/Nivå \d – /, "") : def.name_en.replace(/Level \d – /, "");
  };

  const getScopeLabel = () => {
    if (!assetCounts) return "–";
    const parts: string[] = [];
    if (assetCounts.systems > 0) parts.push(`${assetCounts.systems} ${isNb ? "systemer" : "systems"}`);
    if (assetCounts.vendors > 0) parts.push(`${assetCounts.vendors} ${isNb ? "leverandører" : "vendors"}`);
    if (assetCounts.hardware > 0) parts.push(`${assetCounts.hardware} ${isNb ? "enheter" : "devices"}`);
    return parts.join(", ") || (isNb ? "Ingen registrert" : "None registered");
  };

  const getLastUpdated = () => {
    const date = companyProfile?.updated_at || asset.next_review_date;
    if (!date) return "–";
    return new Date(date).toLocaleDateString(isNb ? "nb-NO" : "en-US", { month: "long", year: "numeric" });
  };

  return (
    <div className="space-y-3">
      {/* Trust Profile Summary — only for self */}
      {isSelf && (
        <Card className="p-5 bg-gradient-to-br from-primary/5 via-background to-accent/5 border-primary/20">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {/* Trust Score */}
            <div className="flex flex-col items-center text-center col-span-2 md:col-span-1">
              <div className="relative h-20 w-20 mb-2">
                <svg className="h-20 w-20 -rotate-90" viewBox="0 0 80 80">
                  <circle cx="40" cy="40" r="34" fill="none" stroke="hsl(var(--muted))" strokeWidth="6" />
                  <circle
                    cx="40" cy="40" r="34" fill="none"
                    stroke="hsl(var(--primary))"
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={`${(complianceScore / 100) * 213.6} 213.6`}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xl font-bold text-foreground">{complianceScore}</span>
                </div>
              </div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Trust Score</span>
            </div>

            {/* Foundation Status */}
            <div className="flex flex-col gap-1.5 justify-center">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Layers className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                    {isNb ? "Grunnlagsstatus" : "Foundation Status"}
                  </p>
                  <p className="text-sm font-semibold text-foreground">{getGovernanceLevelLabel()}</p>
                </div>
              </div>
            </div>

            {/* Compliance Maturity */}
            <div className="flex flex-col gap-1.5 justify-center">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-success/10 flex items-center justify-center shrink-0">
                  <ShieldCheck className="h-4 w-4 text-success" />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                    {isNb ? "Samsvarsmodenhet" : "Compliance Maturity"}
                  </p>
                  <p className="text-sm font-semibold text-foreground">{getMaturityLabel()}</p>
                </div>
              </div>
            </div>

            {/* Scope */}
            <div className="flex flex-col gap-1.5 justify-center">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-accent/20 flex items-center justify-center shrink-0">
                  <Target className="h-4 w-4 text-accent-foreground" />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                    {isNb ? "Omfang" : "Scope"}
                  </p>
                  <p className="text-sm font-semibold text-foreground">{getScopeLabel()}</p>
                </div>
              </div>
            </div>

            {/* Last Updated */}
            <div className="flex flex-col gap-1.5 justify-center">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                    {isNb ? "Sist oppdatert" : "Last Updated"}
                  </p>
                  <p className="text-sm font-semibold text-foreground">{getLastUpdated()}</p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Security Domains — only for self */}
      {isSelf && (
        <Card className="p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            {isNb ? "Sikkerhetsdomener" : "Security Domains"}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { key: "governance", icon: Shield, label: "Governance", labelNb: "Governance", desc: isNb ? "Styring, ansvar og risikostyring" : "Governance, responsibility & risk", color: "text-primary", bg: "bg-primary/10" },
              { key: "operations", icon: Layers, label: "Operations", labelNb: "Operations", desc: isNb ? "Systemer, prosesser og drift" : "Systems, processes & operations", color: "text-success", bg: "bg-success/10" },
              { key: "identity_access", icon: ShieldCheck, label: "Identity & Access", labelNb: "Identity & Access", desc: isNb ? "Brukere, roller og tilgangskontroll" : "Users, roles & access control", color: "text-warning", bg: "bg-warning/10" },
              { key: "supplier_ecosystem", icon: Target, label: "Supplier & Ecosystem", labelNb: "Supplier & Ecosystem", desc: isNb ? "Leverandører og tredjepartsrisiko" : "Vendors & third-party risk", color: "text-accent-foreground", bg: "bg-accent/20" },
            ].map((domain) => (
              <div key={domain.key} className="flex items-start gap-2.5 p-3 rounded-lg border border-border hover:border-primary/30 transition-colors">
                <div className={`h-8 w-8 rounded-lg ${domain.bg} flex items-center justify-center shrink-0`}>
                  <domain.icon className={`h-4 w-4 ${domain.color}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">{isNb ? domain.labelNb : domain.label}</p>
                  <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">{domain.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
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
