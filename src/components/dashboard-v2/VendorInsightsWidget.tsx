import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Building2, ShieldAlert, Users, ArrowRight, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

type ViewMode = "priority" | "risk" | "roles";

const PRIORITY_ORDER: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
const RISK_ORDER: Record<string, number> = { high: 0, medium: 1, low: 2 };

const PRIORITY_LABELS: Record<string, { no: string; en: string; color: string }> = {
  critical: { no: "Kritisk", en: "Critical", color: "bg-destructive/10 text-destructive border-destructive/20" },
  high: { no: "Høy", en: "High", color: "bg-warning/10 text-warning border-warning/20" },
  medium: { no: "Middels", en: "Medium", color: "bg-accent text-accent-foreground border-border" },
  low: { no: "Lav", en: "Low", color: "bg-success/10 text-success border-success/20" },
};

const RISK_LABELS: Record<string, { no: string; en: string; color: string }> = {
  high: { no: "Høy risiko", en: "High risk", color: "bg-destructive/10 text-destructive border-destructive/20" },
  medium: { no: "Middels risiko", en: "Medium risk", color: "bg-warning/10 text-warning border-warning/20" },
  low: { no: "Lav risiko", en: "Low risk", color: "bg-success/10 text-success border-success/20" },
};

const GDPR_LABELS: Record<string, { no: string; en: string }> = {
  databehandler: { no: "Databehandler", en: "Data Processor" },
  underdatabehandler: { no: "Underdatabehandler", en: "Sub-Processor" },
  felles_behandlingsansvarlig: { no: "Felles behandlingsansvarlig", en: "Joint Controller" },
  ingen: { no: "Ingen persondata", en: "No Personal Data" },
};

export function VendorInsightsWidget() {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb" || i18n.language === "no";
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>("priority");

  const { data: vendors = [] } = useQuery({
    queryKey: ["vendor-insights"],
    queryFn: async () => {
      const { data } = await supabase
        .from("assets")
        .select("id, name, priority, risk_level, risk_score, compliance_score, gdpr_role, vendor_category")
        .eq("asset_type", "vendor")
        .eq("lifecycle_status", "active");
      return data || [];
    },
  });

  const stats = useMemo(() => {
    const criticalHigh = vendors.filter((v) => v.priority === "critical" || v.priority === "high").length;
    const noGdpr = vendors.filter((v) => !v.gdpr_role).length;
    return { total: vendors.length, criticalHigh, noGdpr };
  }, [vendors]);

  const sortedByPriority = useMemo(
    () => [...vendors].sort((a, b) => (PRIORITY_ORDER[a.priority || ""] ?? 4) - (PRIORITY_ORDER[b.priority || ""] ?? 4)).slice(0, 6),
    [vendors]
  );

  const sortedByRisk = useMemo(
    () =>
      [...vendors]
        .sort((a, b) => {
          const rl = (RISK_ORDER[a.risk_level || ""] ?? 3) - (RISK_ORDER[b.risk_level || ""] ?? 3);
          if (rl !== 0) return rl;
          return (b.risk_score || 0) - (a.risk_score || 0);
        })
        .slice(0, 6),
    [vendors]
  );

  const groupedByRole = useMemo(() => {
    const groups: Record<string, typeof vendors> = {};
    vendors.forEach((v) => {
      const role = v.gdpr_role || "ingen";
      if (!groups[role]) groups[role] = [];
      groups[role].push(v);
    });
    return Object.entries(groups).sort((a, b) => b[1].length - a[1].length);
  }, [vendors]);

  const scoreColor = (s: number) => (s >= 80 ? "text-success" : s >= 50 ? "text-warning" : "text-destructive");

  const views: { key: ViewMode; label_no: string; label_en: string; icon: React.ReactNode }[] = [
    { key: "priority", label_no: "Prioritet", label_en: "Priority", icon: <AlertTriangle className="h-3 w-3" /> },
    { key: "risk", label_no: "Risiko", label_en: "Risk", icon: <ShieldAlert className="h-3 w-3" /> },
    { key: "roles", label_no: "GDPR-roller", label_en: "GDPR Roles", icon: <Users className="h-3 w-3" /> },
  ];

  const renderVendorRow = (v: (typeof vendors)[0], badge: React.ReactNode) => (
    <div
      key={v.id}
      onClick={() => navigate(`/vendors/${v.id}`)}
      className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg hover:bg-accent/50 cursor-pointer transition-colors"
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="h-7 w-7 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
          <Building2 className="h-3 w-3 text-primary" />
        </div>
        <span className="text-sm font-medium text-foreground truncate">{v.name}</span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {badge}
        <div className="flex items-center gap-1.5 w-20">
          <Progress value={v.compliance_score || 0} className="h-1.5 flex-1" />
          <span className={cn("text-xs font-semibold tabular-nums", scoreColor(v.compliance_score || 0))}>
            {v.compliance_score || 0}%
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <Card>
      <CardContent className="p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">
              {isNb ? "Leverandørinnsikt" : "Vendor Insights"}
            </h3>
          </div>
          <button
            onClick={() => navigate("/vendors")}
            className="text-xs text-primary hover:underline flex items-center gap-1"
          >
            {isNb ? "Se alle" : "View all"} <ArrowRight className="h-3 w-3" />
          </button>
        </div>

        {/* Summary */}
        <div className="flex items-center gap-3 text-[13px] text-muted-foreground mb-3">
          <span>{stats.total} {isNb ? "leverandører" : "vendors"}</span>
          {stats.criticalHigh > 0 && (
            <span className="text-destructive font-medium">
              {stats.criticalHigh} {isNb ? "kritisk/høy" : "critical/high"}
            </span>
          )}
          {stats.noGdpr > 0 && (
            <span className="text-warning font-medium">
              {stats.noGdpr} {isNb ? "uten GDPR-rolle" : "no GDPR role"}
            </span>
          )}
        </div>

        {/* Segmented control */}
        <div className="flex gap-1 p-0.5 bg-muted rounded-lg mb-3">
          {views.map((v) => (
            <button
              key={v.key}
              onClick={() => setViewMode(v.key)}
              className={cn(
                "flex-1 flex items-center justify-center gap-1 text-xs py-1.5 rounded-md transition-all font-medium",
                viewMode === v.key
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {v.icon}
              {isNb ? v.label_no : v.label_en}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="space-y-0.5">
          {viewMode === "priority" &&
            sortedByPriority.map((v) => {
              const p = PRIORITY_LABELS[v.priority || ""];
              return renderVendorRow(
                v,
                p ? (
                  <Badge variant="outline" className={cn("text-[13px] px-1.5 py-0", p.color)}>
                    {isNb ? p.no : p.en}
                  </Badge>
                ) : null
              );
            })}

          {viewMode === "risk" &&
            sortedByRisk.map((v) => {
              const r = RISK_LABELS[v.risk_level || ""];
              return renderVendorRow(
                v,
                r ? (
                  <Badge variant="outline" className={cn("text-[13px] px-1.5 py-0", r.color)}>
                    {isNb ? r.no : r.en}
                  </Badge>
                ) : null
              );
            })}

          {viewMode === "roles" &&
            groupedByRole.map(([role, items]) => {
              const label = GDPR_LABELS[role] || { no: role, en: role };
              return (
                <div key={role} className="px-3 py-2.5">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-medium text-foreground">{isNb ? label.no : label.en}</span>
                    <Badge variant="secondary" className="text-[13px] px-1.5 py-0">
                      {items.length}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {items.slice(0, 4).map((v) => (
                      <button
                        key={v.id}
                        onClick={() => navigate(`/vendors/${v.id}`)}
                        className="text-[13px] text-muted-foreground hover:text-primary transition-colors truncate max-w-[140px]"
                      >
                        {v.name}
                      </button>
                    ))}
                    {items.length > 4 && (
                      <span className="text-[13px] text-muted-foreground">+{items.length - 4}</span>
                    )}
                  </div>
                </div>
              );
            })}

          {vendors.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-6">
              {isNb ? "Ingen leverandører registrert ennå" : "No vendors registered yet"}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
