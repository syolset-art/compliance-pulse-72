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
import { Shield, AlertTriangle, HelpCircle, Mail, Clock, CheckCircle2, AlertCircle, Timer, ArrowRight, ChevronDown, ClipboardList } from "lucide-react";
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
  const queryClient = useQueryClient();

  const recentActivities = useMemo(() => generateDemoActivities(assetId).slice(0, 3), [assetId]);

  const OUTCOME_ICON_MAP = { success: CheckCircle2, warning: AlertCircle, info: Timer } as const;

  // Auto-expand when there are open tasks (first load only)
  const effectiveExpanded = expanded === null ? openTasks.length > 0 : expanded;

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
                <ClipboardList className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="text-sm font-semibold text-foreground">{isNb ? "Oppgaver" : "Tasks"}</span>
                <Badge variant="outline" className={`text-[11px] font-bold px-2 py-0.5 ${cfg.badgeBg}`}>
                  {cfg.emoji} {cfg.label}
                </Badge>
                {asset?.criticality && (
                  <>
                    <span className="text-border">·</span>
                    <Badge variant="outline" className={`text-[11px] px-2 py-0.5 ${
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
              <div className="px-3 pb-3 space-y-3 border-t border-border/50 pt-3">
                {/* Module title + tooltip */}
                <div className="flex items-center gap-1.5">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {isNb ? "Oppfølgingsstatus (TPRM)" : "Follow-up Status (TPRM)"}
                  </h2>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="max-w-xs text-xs leading-relaxed p-3 space-y-1.5">
                        <p className="font-semibold text-foreground">TPRM – Third-Party Risk Management</p>
                        <p>{isNb ? "Kombinerer risiko ved bruk av leverandøren med grad av kontroll (dokumentasjon og oppfølging)." : "Combines vendor risk with degree of control (documentation and follow-up)."}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>

                {/* Metrics row */}
                <div className="flex items-center gap-4 flex-wrap text-sm">
                  <span className="flex items-center gap-1.5">
                    <span className="text-muted-foreground text-xs">{isNb ? "Risiko:" : "Risk:"}</span>
                    {risk ? (
                      <span className={`font-semibold flex items-center gap-1 ${riskColors[risk]}`}>
                        <span className={`h-2 w-2 rounded-full ${riskDots[risk]}`} />
                        {riskLabels[risk]}
                      </span>
                    ) : (
                      <span className="text-muted-foreground italic text-xs">{isNb ? "Ikke satt" : "Not set"}</span>
                    )}
                  </span>
                  {maturityStats && (
                    <>
                      <span className="text-border">|</span>
                      <button
                        onClick={() => {
                          const el = document.getElementById("maturity-controls-section");
                          if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                        }}
                        className="flex items-center gap-1.5 hover:text-primary transition-colors"
                      >
                        <span className="text-muted-foreground text-xs">{isNb ? "Kontroll:" : "Control:"}</span>
                        <span className="font-semibold text-foreground">
                          {maturityStats.implementedCount}/{maturityStats.totalControls}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          ({maturityStats.trustScore}%)
                        </span>
                      </button>
                    </>
                  )}
                </div>

                {/* ── UTFØRT (Completed) — Recent Activities ── */}
                <div className="border-t border-border pt-3 mt-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {isNb ? "Utført" : "Completed"}
                      </span>
                      <Badge variant="outline" className="text-[9px] px-1 py-0 h-4">
                        {recentActivities.length}
                      </Badge>
                    </div>
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
                    {recentActivities.map((act) => {
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
                              <Badge variant="outline" className={`text-[9px] px-1 py-0 border-0 ${phaseConf.color}`}>
                                {isNb ? phaseConf.nb : phaseConf.en}
                              </Badge>
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              {act.actor}, {act.actorRole} — {formatRelativeDate(act.date, isNb)}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* ── GJENSTÅR (Remaining Tasks) ── */}
                <div className="border-t border-border pt-3 mt-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <ClipboardList className="h-3.5 w-3.5 text-warning" />
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {isNb ? "Gjenstår" : "Remaining"} ({openTasks.length})
                      </span>
                    </div>
                    {responsiblePerson && (
                      <span className="text-[10px] text-muted-foreground">
                        {isNb ? "Ansvarlig:" : "Responsible:"} {responsiblePerson}
                      </span>
                    )}
                  </div>
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
                                  <Badge variant="destructive" className="text-[9px] shrink-0 h-4">
                                    {isNb ? "Høy" : "High"}
                                  </Badge>
                                )}
                              </div>
                              {task.action && (
                                <p className="text-[10px] text-muted-foreground mt-0.5 ml-4">
                                  {task.action}
                                </p>
                              )}
                            </div>
                            {task.ctaLabel && task.targetTab && onNavigateToTab && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-6 text-[10px] gap-1 shrink-0 whitespace-nowrap"
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
                  ) : (
                    <p className="text-xs text-muted-foreground italic">
                      {isNb ? "Ingen åpne oppgaver — godt jobbet! 🎉" : "No open tasks — great work! 🎉"}
                    </p>
                  )}
                </div>
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
