import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Shield, AlertTriangle, HelpCircle, Mail, Clock, CheckCircle2, AlertCircle, Timer, ArrowRight, ChevronDown, ClipboardList, Activity } from "lucide-react";
import { RequestUpdateDialog } from "@/components/asset-profile/RequestUpdateDialog";
import { toast } from "sonner";
import { generateDemoActivities, formatRelativeDate, PHASE_CONFIG, OUTCOME_COLORS } from "@/utils/vendorActivityData";

interface OpenTask {
  id: string;
  title: string;
  type?: string;
  status: string;
  priority?: string;
  action?: string | null;
  targetTab?: string | null;
  ctaLabel?: string | null;
  isControlTask?: boolean;
}

interface VendorTPRMStatusProps {
  assetId: string;
  assetName?: string;
  vendorName?: string;
  contactPerson?: string | null;
  contactEmail?: string | null;
  tasks?: Array<{ id: string; title: string; type: string; status: string; priority: string }>;
  maturityStats?: {
    implementedCount: number;
    partialCount: number;
    missingCount: number;
    totalControls: number;
    trustScore: number;
  } | null;
  onNavigateToTab?: (tab: string) => void;
  openTasks?: OpenTask[];
  highlightedTaskId?: string | null;
  responsiblePerson?: string;
}

type TPRMLevel = "approved" | "under_review" | "action_required" | "not_assessed";

function getRiskLevel(criticality?: string | null, riskLevel?: string | null): "high" | "medium" | "low" | null {
  if (!criticality && !riskLevel) return null;
  const crit = criticality?.toLowerCase();
  const risk = riskLevel?.toLowerCase();
  if (crit === "critical" || crit === "high" || risk === "high") return "high";
  if (crit === "medium" || risk === "medium") return "medium";
  if (crit === "low" || risk === "low") return "low";
  return null;
}

function getTPRMLevel(
  risk: "high" | "medium" | "low" | null,
  controlsMet: number,
  totalControls: number,
  maturity?: { implementedCount: number; totalControls: number; trustScore: number } | null,
): TPRMLevel {
  const maturityStarted = maturity && maturity.implementedCount > 0;
  const maturityScore = maturity?.trustScore ?? 0;
  const controlRatio = totalControls > 0 ? controlsMet / totalControls : 0;
  if (!maturityStarted && controlsMet === 0 && risk === null) return "not_assessed";
  if (risk === "high" && maturityScore < 50 && controlRatio < 0.75) return "action_required";
  if (maturityScore >= 75 && controlRatio >= 0.5) return "approved";
  if (maturityStarted || controlsMet > 0) return "under_review";
  return "not_assessed";
}

interface ControlItem {
  key: string;
  label: string;
  met: boolean;
  requestType?: string;
  requestLabel: string;
  isAudit?: boolean;
  taskKeywords: string[];
}

export const VendorTPRMStatus = ({
  assetId,
  assetName = "",
  vendorName,
  contactPerson,
  contactEmail,
  tasks = [],
  maturityStats,
  onNavigateToTab,
  openTasks = [],
  highlightedTaskId,
  responsiblePerson,
}: VendorTPRMStatusProps) => {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";
  const [requestOpen, setRequestOpen] = useState(false);
  const [expanded, setExpanded] = useState<boolean | null>(null);
  const [requestType, setRequestType] = useState<string | undefined>();
  const [innerTab, setInnerTab] = useState<"remaining" | "completed">("remaining");
  const queryClient = useQueryClient();

  const allDemoActivities = useMemo(() => generateDemoActivities(assetId), [assetId]);
  const pendingActivities = useMemo(() => allDemoActivities.filter(a => a.outcomeStatus === "warning"), [allDemoActivities]);
  const completedActivities = useMemo(() => allDemoActivities.filter(a => a.outcomeStatus !== "warning").slice(0, 3), [allDemoActivities]);

  const OUTCOME_ICON_MAP = { success: CheckCircle2, warning: AlertCircle, info: Timer } as const;

  // Auto-expand when there are open tasks (first load only)
  const effectiveExpanded = expanded === null ? (openTasks.length > 0 || pendingActivities.length > 0) : expanded;

  const { data: asset } = useQuery({
    queryKey: ["asset-tprm", assetId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assets")
        .select("criticality, risk_level, next_review_date, tprm_status")
        .eq("id", assetId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus: TPRMLevel) => {
      const { error } = await supabase
        .from("assets")
        .update({ tprm_status: newStatus })
        .eq("id", assetId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["asset-tprm", assetId] });
      toast.success(isNb ? "Status oppdatert" : "Status updated");
    },
  });

  const { data: documents = [] } = useQuery({
    queryKey: ["vendor-documents-tprm", assetId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vendor_documents")
        .select("id, document_type")
        .eq("asset_id", assetId);
      if (error) throw error;
      return data || [];
    },
  });

  const hasDPA = documents.some((d) => d.document_type === "dpa");
  const hasSLA = documents.some((d) => d.document_type === "sla");
  const hasRiskAssessment = documents.some((d) => d.document_type === "risk_assessment");
  const hasAudit = !!asset?.next_review_date;

  const controls: ControlItem[] = [
    { key: "dpa", label: isNb ? "Databehandleravtale (DPA)" : "Data Processing Agreement", met: hasDPA, taskKeywords: ["dpa", "databehandleravtale"], requestType: "dpa", requestLabel: isNb ? "Be om DPA" : "Request DPA" },
    { key: "sla", label: isNb ? "Tjenestenivåavtale (SLA)" : "Service Level Agreement", met: hasSLA, taskKeywords: ["sla", "tjenestenivå"], requestType: "sla", requestLabel: isNb ? "Be om SLA" : "Request SLA" },
    { key: "risk_assessment", label: isNb ? "Risikovurdering" : "Risk Assessment", met: hasRiskAssessment, taskKeywords: ["risikovurdering", "risk assessment"], requestType: "risk_assessment", requestLabel: isNb ? "Be om vurdering" : "Request assessment" },
    { key: "audit", label: isNb ? "Revisjon satt opp" : "Audit scheduled", met: hasAudit, taskKeywords: ["revisjon", "audit", "review"], requestLabel: isNb ? "Sett opp i Revisjon →" : "Set up in Audit →", isAudit: true },
  ];

  const controlsMet = controls.filter((c) => c.met).length;
  const risk = getRiskLevel(asset?.criticality, asset?.risk_level);
  const autoLevel = getTPRMLevel(risk, controlsMet, controls.length, maturityStats);
  const effectiveLevel: TPRMLevel = (asset?.tprm_status as TPRMLevel) || autoLevel;

  useEffect(() => {
    if (!asset) return;
    const stored = asset.tprm_status as TPRMLevel | null;
    if (autoLevel !== "not_assessed" && stored !== autoLevel && (!stored || stored === "not_assessed")) {
      updateStatusMutation.mutate(autoLevel);
    }
  }, [autoLevel, asset?.tprm_status]);

  const tprmConfig: Record<TPRMLevel, { label: string; bg: string; border: string; text: string; emoji: string; badgeBg: string }> = {
    approved: { label: isNb ? "Godkjent" : "Approved", bg: "bg-card", border: "border-border", text: "text-success", emoji: "🟢", badgeBg: "bg-success/10 text-success border-success/30" },
    under_review: { label: isNb ? "Under oppfølging" : "Under review", bg: "bg-card", border: "border-border", text: "text-warning", emoji: "🟡", badgeBg: "bg-warning/10 text-warning border-warning/30" },
    action_required: { label: isNb ? "Krever tiltak" : "Action required", bg: "bg-card", border: "border-border", text: "text-destructive", emoji: "🔴", badgeBg: "bg-destructive/10 text-destructive border-destructive/30" },
    not_assessed: { label: isNb ? "Ikke vurdert" : "Not assessed", bg: "bg-card", border: "border-border", text: "text-muted-foreground", emoji: "⚪", badgeBg: "bg-muted/40 text-muted-foreground border-border" },
  };

  const tprmOptions: TPRMLevel[] = ["approved", "under_review", "action_required", "not_assessed"];
  const cfg = tprmConfig[effectiveLevel];

  const riskLabels: Record<string, string> = { high: isNb ? "Høy" : "High", medium: isNb ? "Middels" : "Medium", low: isNb ? "Lav" : "Low" };
  const riskColors: Record<string, string> = { high: "text-destructive", medium: "text-warning", low: "text-success" };
  const riskDots: Record<string, string> = { high: "bg-destructive", medium: "bg-warning", low: "bg-success" };

  const handleRequest = (docType: string) => {
    setRequestType(docType);
    setRequestOpen(true);
  };

  const handleGoToAudit = () => {
    onNavigateToTab?.("vendor-audit");
  };

  return (
    <>
      <Card className={`${cfg.bg} border ${cfg.border} overflow-hidden`}>
        <CardContent className="p-0">
          <Collapsible open={effectiveExpanded} onOpenChange={setExpanded}>
            {/* Always-visible compact header */}
            <div className="p-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <Activity className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="text-sm font-semibold text-foreground">{isNb ? "Aktiviteter" : "Activities"}</span>
                <Badge variant="outline" className={`text-[13px] font-bold px-2 py-0.5 ${cfg.badgeBg}`}>
                  {cfg.emoji} {cfg.label}
                </Badge>
                {asset?.criticality && (
                  <>
                    <span className="text-border">·</span>
                    <Badge variant="outline" className={`text-[13px] px-2 py-0.5 ${
                      asset.criticality.toLowerCase() === "critical" || asset.criticality.toLowerCase() === "high"
                        ? "bg-destructive/10 text-destructive border-destructive/30"
                        : asset.criticality.toLowerCase() === "medium"
                        ? "bg-warning/10 text-warning border-warning/30"
                        : "bg-success/10 text-success border-success/30"
                    }`}>
                      {asset.criticality.toLowerCase() === "critical" || asset.criticality.toLowerCase() === "high"
                        ? (isNb ? "Høy" : "High")
                        : asset.criticality.toLowerCase() === "medium"
                        ? (isNb ? "Middels" : "Medium")
                        : (isNb ? "Lav" : "Low")}
                    </Badge>
                  </>
                )}
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <Select
                  value={effectiveLevel}
                  onValueChange={(val) => updateStatusMutation.mutate(val as TPRMLevel)}
                >
                  <SelectTrigger className="h-7 text-xs border border-border bg-background/60 px-2 w-auto min-w-[120px] shadow-none">
                    <SelectValue>
                      <span className="text-xs">{isNb ? "Endre" : "Change"}</span>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {tprmOptions.map((opt) => (
                      <SelectItem key={opt} value={opt} className="text-xs">
                        {tprmConfig[opt].emoji} {tprmConfig[opt].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                    <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${effectiveExpanded ? "rotate-180" : ""}`} />
                  </Button>
                </CollapsibleTrigger>
              </div>
            </div>

            {/* Expandable detail section */}
            <CollapsibleContent>
              <div className="px-3 pb-3 border-t border-border/50 pt-3">
                {/* Inner tab filter */}
                <div className="flex items-center gap-1 mb-3">
                  <button
                    onClick={() => setInnerTab("remaining")}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                      innerTab === "remaining"
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                  >
                    {isNb ? "Gjenstår" : "Remaining"}
                    {openTasks.length > 0 && (
                      <Badge variant="outline" className="ml-1.5 text-[13px] px-1 py-0 h-4">
                        {openTasks.length + pendingActivities.length}
                      </Badge>
                    )}
                  </button>
                  <button
                    onClick={() => setInnerTab("completed")}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                      innerTab === "completed"
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                  >
                    {isNb ? "Utført" : "Completed"}
                    <Badge variant="outline" className="ml-1.5 text-[13px] px-1 py-0 h-4">
                      {completedActivities.length}
                    </Badge>
                  </button>
                </div>

                {/* ── GJENSTÅR (Remaining Tasks) ── */}
                {innerTab === "remaining" && (
                  <div className="space-y-2">
                    {responsiblePerson && (
                      <span className="text-[13px] text-muted-foreground block">
                        {isNb ? "Ansvarlig:" : "Responsible:"} {responsiblePerson}
                      </span>
                    )}
                    {openTasks.length > 0 ? (
                      <div className="space-y-1.5">
                        {openTasks.map((task) => {
                          const isHighlighted = highlightedTaskId === task.id;
                          return (
                            <div
                              key={task.id}
                              id={`task-${task.id}`}
                              className={`flex items-start sm:items-center justify-between gap-3 p-2.5 rounded-lg transition-all duration-500 ${
                                isHighlighted ? "bg-primary/10 ring-2 ring-primary/40" : "bg-background/60 border border-border"
                              }`}
                            >
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <div className={`h-2 w-2 rounded-full shrink-0 ${
                                    task.status === "in_progress" ? "bg-warning" : "bg-muted-foreground/40"
                                  }`} />
                                  <span className="text-xs font-medium text-foreground">{task.title}</span>
                                  {task.isControlTask && (
                                    <Shield className="h-3 w-3 text-primary/60 shrink-0" />
                                  )}
                                  {task.priority === "high" && (
                                    <Badge variant="destructive" className="text-[13px] shrink-0 h-4">
                                      {isNb ? "Høy" : "High"}
                                    </Badge>
                                  )}
                                </div>
                                {task.action && (
                                  <p className="text-[13px] text-muted-foreground mt-0.5 ml-4">
                                    {task.action}
                                  </p>
                                )}
                              </div>
                              {task.ctaLabel && task.targetTab && onNavigateToTab && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-6 text-[13px] gap-1 shrink-0 whitespace-nowrap"
                                  onClick={() => onNavigateToTab(task.targetTab!)}
                                >
                                  {task.ctaLabel}
                                  <ArrowRight className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : null}
                    {/* Pending activities (waiting/deviation) */}
                    {pendingActivities.length > 0 && (
                      <div className="space-y-1.5">
                        {pendingActivities.map((act) => {
                          const OutIcon = OUTCOME_ICON_MAP[act.outcomeStatus];
                          const outcomeColor = OUTCOME_COLORS[act.outcomeStatus];
                          return (
                            <div
                              key={act.id}
                              className="flex items-start gap-2 p-2.5 rounded-lg bg-warning/5 border border-warning/20"
                            >
                              <div className={`mt-0.5 ${outcomeColor}`}>
                                <OutIcon className="h-3.5 w-3.5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <span className="text-xs font-medium text-foreground">
                                  {isNb ? act.titleNb : act.titleEn}
                                </span>
                                <p className="text-[13px] text-muted-foreground mt-0.5">
                                  {act.actor} — {formatRelativeDate(act.date, isNb)}
                                </p>
                              </div>
                              <Badge variant="outline" className="text-[13px] px-1.5 py-0 h-4 bg-warning/10 text-warning border-warning/30 shrink-0">
                                {isNb ? "Venter svar" : "Awaiting response"}
                              </Badge>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {openTasks.length === 0 && pendingActivities.length === 0 && (
                      <p className="text-xs text-muted-foreground italic">
                        {isNb ? "Ingen åpne aktiviteter — godt jobbet! 🎉" : "No open activities — great work! 🎉"}
                      </p>
                    )}
                  </div>
                )}

                {/* ── UTFØRT (Completed) — Recent Activities ── */}
                {innerTab === "completed" && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-xs text-primary gap-1 px-2"
                        onClick={() => onNavigateToTab?.("vendor-activity")}
                      >
                        {isNb ? "Se alle" : "View all"}
                        <ArrowRight className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="space-y-1.5">
                      {completedActivities.map((act) => {
                        const OutIcon = OUTCOME_ICON_MAP[act.outcomeStatus];
                        const outcomeColor = OUTCOME_COLORS[act.outcomeStatus];
                        const phaseConf = PHASE_CONFIG[act.phase];
                        return (
                          <button
                            key={act.id}
                            onClick={() => onNavigateToTab?.("vendor-activity")}
                            className="w-full text-left flex items-start gap-2 p-2 rounded-lg bg-background/60 border border-border hover:border-primary/30 transition-colors"
                          >
                            <div className={`mt-0.5 ${outcomeColor}`}>
                              <OutIcon className="h-3.5 w-3.5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-xs font-medium text-foreground truncate">
                                  {isNb ? act.titleNb : act.titleEn}
                                </span>
                                <Badge variant="outline" className={`text-[13px] px-1 py-0 border-0 ${phaseConf.color}`}>
                                  {isNb ? phaseConf.nb : phaseConf.en}
                                </Badge>
                              </div>
                              <p className="text-[13px] text-muted-foreground mt-0.5">
                                {act.actor}, {act.actorRole} — {formatRelativeDate(act.date, isNb)}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>

      <RequestUpdateDialog
        open={requestOpen}
        onOpenChange={setRequestOpen}
        assetId={assetId}
        assetName={assetName}
        vendorName={vendorName}
        preselectedType={requestType}
        contactPerson={contactPerson}
        contactEmail={contactEmail}
      />
    </>
  );
};
