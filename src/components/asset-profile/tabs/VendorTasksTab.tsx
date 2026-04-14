import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Shield, CheckCircle2, ClipboardList } from "lucide-react";
import { useTrustControlEvaluation } from "@/hooks/useTrustControlEvaluation";
import { CONTROL_NAV_MAP } from "@/lib/trustControlDefinitions";

interface VendorTasksTabProps {
  asset: {
    id: string;
    name: string;
    risk_level: string | null;
    criticality: string | null;
    tprm_status?: string | null;
  };
}

export const VendorTasksTab = ({ asset }: VendorTasksTabProps) => {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";
  const evaluation = useTrustControlEvaluation(asset.id);

  const { data: assetData } = useQuery({
    queryKey: ["asset-tprm-tasks-tab", asset.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assets")
        .select("tprm_status, criticality, risk_level")
        .eq("id", asset.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: dbTasks = [] } = useQuery({
    queryKey: ["asset-tasks", asset.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .contains("relevant_for", [asset.id])
        .order("created_at", { ascending: false });
      if (error) return [];
      return data || [];
    },
  });

  const tprmStatus = assetData?.tprm_status || asset.tprm_status || "not_assessed";
  const criticality = assetData?.criticality || asset.criticality;

  const statusConfig: Record<string, { label: string; emoji: string; className: string }> = {
    approved: { label: isNb ? "Godkjent" : "Approved", emoji: "🟢", className: "bg-success/10 text-success border-success/30" },
    under_review: { label: isNb ? "Under oppfølging" : "Under review", emoji: "🟡", className: "bg-warning/10 text-warning border-warning/30" },
    action_required: { label: isNb ? "Krever tiltak" : "Action required", emoji: "🔴", className: "bg-destructive/10 text-destructive border-destructive/30" },
    not_assessed: { label: isNb ? "Ikke vurdert" : "Not assessed", emoji: "⚪", className: "bg-muted/40 text-muted-foreground border-border" },
  };

  const criticalityConfig: Record<string, { label: string; className: string }> = {
    critical: { label: isNb ? "Kritisk" : "Critical", className: "bg-destructive/10 text-destructive border-destructive/30" },
    high: { label: isNb ? "Høy" : "High", className: "bg-destructive/10 text-destructive border-destructive/30" },
    medium: { label: isNb ? "Middels" : "Medium", className: "bg-warning/10 text-warning border-warning/30" },
    low: { label: isNb ? "Lav" : "Low", className: "bg-success/10 text-success border-success/30" },
  };

  const controlTasks = useMemo(() => {
    if (!evaluation) return [];
    return evaluation.allControls
      .filter(c => c.status === "missing" || c.status === "partial")
      .map(c => ({
        id: `ctrl-${c.key}`,
        title: isNb ? c.labelNb : c.labelEn,
        status: c.status === "partial" ? "in_progress" : "open",
        isControlTask: true,
      }));
  }, [evaluation, isNb]);

  const openDbTasks = dbTasks.filter((t: any) => t.status !== "completed");
  const completedDbTasks = dbTasks.filter((t: any) => t.status === "completed");

  const allOpenTasks = useMemo(() => {
    const merged: any[] = [...openDbTasks];
    const existingTitles = new Set(openDbTasks.map((t: any) => t.title?.toLowerCase()));
    for (const ct of controlTasks) {
      if (!existingTitles.has(ct.title.toLowerCase())) {
        merged.push(ct);
      }
    }
    const priorityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
    merged.sort((a, b) => (priorityOrder[a.priority] ?? 4) - (priorityOrder[b.priority] ?? 4));
    return merged.slice(0, 15);
  }, [openDbTasks, controlTasks]);

  const scfg = statusConfig[tprmStatus] || statusConfig.not_assessed;
  const ccfg = criticality ? criticalityConfig[criticality.toLowerCase()] : null;

  return (
    <div className="space-y-6">
      {/* Status + Criticality header */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{isNb ? "Status:" : "Status:"}</span>
          <Badge variant="outline" className={`text-xs font-semibold ${scfg.className}`}>
            {scfg.emoji} {scfg.label}
          </Badge>
        </div>
        {ccfg && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{isNb ? "Kritikalitet:" : "Criticality:"}</span>
            <Badge variant="outline" className={`text-xs font-semibold ${ccfg.className}`}>
              {ccfg.label}
            </Badge>
          </div>
        )}
      </div>

      {/* Open tasks */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5">
          <ClipboardList className="h-3.5 w-3.5 text-warning" />
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {isNb ? "Gjenstår" : "Remaining"} ({allOpenTasks.length})
          </span>
        </div>
        {allOpenTasks.length > 0 ? (
          <div className="space-y-1.5">
            {allOpenTasks.map((task: any) => (
              <div
                key={task.id}
                className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/50 border border-border"
              >
                <div className={`h-2 w-2 rounded-full shrink-0 ${
                  task.status === "in_progress" ? "bg-warning" : "bg-muted-foreground/40"
                }`} />
                <span className="text-sm text-foreground">{task.title}</span>
                {task.isControlTask && <Shield className="h-3 w-3 text-primary/60 shrink-0" />}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic">
            {isNb ? "Ingen åpne oppgaver 🎉" : "No open tasks 🎉"}
          </p>
        )}
      </div>

      {/* Completed tasks */}
      {completedDbTasks.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-success" />
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {isNb ? "Utført" : "Completed"} ({completedDbTasks.length})
            </span>
          </div>
          <div className="space-y-1.5">
            {completedDbTasks.slice(0, 5).map((task: any) => (
              <div
                key={task.id}
                className="flex items-center gap-3 p-2.5 rounded-lg bg-success/5 border border-success/20"
              >
                <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0" />
                <span className="text-sm text-muted-foreground line-through">{task.title}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
