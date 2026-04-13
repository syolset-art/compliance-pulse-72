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
import { Shield, AlertTriangle, HelpCircle, Mail, Clock, CheckCircle2, AlertCircle, Timer, ArrowRight, ChevronDown } from "lucide-react";
import { RequestUpdateDialog } from "@/components/asset-profile/RequestUpdateDialog";
import { toast } from "sonner";
import { generateDemoActivities, formatRelativeDate, PHASE_CONFIG, OUTCOME_COLORS } from "@/utils/vendorActivityData";

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

  // Nothing done at all
  if (!maturityStarted && controlsMet === 0 && risk === null) return "not_assessed";

  // High risk with low maturity or few controls → action required
  if (risk === "high" && maturityScore < 50 && controlRatio < 0.75) return "action_required";

  // Good maturity + good controls → approved
  if (maturityScore >= 75 && controlRatio >= 0.5) return "approved";

  // Any work started → under review
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
}: VendorTPRMStatusProps) => {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";
  const [requestOpen, setRequestOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [requestType, setRequestType] = useState<string | undefined>();
  const queryClient = useQueryClient();

  const recentActivities = useMemo(() => generateDemoActivities(assetId).slice(0, 3), [assetId]);

  const OUTCOME_ICON_MAP = { success: CheckCircle2, warning: AlertCircle, info: Timer } as const;

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
  const missingControls = controls.filter((c) => !c.met);
  const risk = getRiskLevel(asset?.criticality, asset?.risk_level);
  const autoLevel = getTPRMLevel(risk, controlsMet, controls.length, maturityStats);
  const effectiveLevel: TPRMLevel = (asset?.tprm_status as TPRMLevel) || autoLevel;

  // Auto-persist status when calculated level changes and differs from stored
  useEffect(() => {
    if (!asset) return;
    const stored = asset.tprm_status as TPRMLevel | null;
    if (autoLevel !== "not_assessed" && stored !== autoLevel && (!stored || stored === "not_assessed")) {
      updateStatusMutation.mutate(autoLevel);
    }
  }, [autoLevel, asset?.tprm_status]);

  const tprmConfig: Record<TPRMLevel, { label: string; bg: string; border: string; text: string; emoji: string }> = {
    approved: { label: isNb ? "Godkjent" : "Approved", bg: "bg-success/10", border: "border-success/30", text: "text-success", emoji: "🟢" },
    under_review: { label: isNb ? "Under oppfølging" : "Under review", bg: "bg-warning/10", border: "border-warning/30", text: "text-warning", emoji: "🟡" },
    action_required: { label: isNb ? "Krever tiltak" : "Action required", bg: "bg-destructive/10", border: "border-destructive/30", text: "text-destructive", emoji: "🔴" },
    not_assessed: { label: isNb ? "Ikke vurdert" : "Not assessed", bg: "bg-muted/40", border: "border-border", text: "text-muted-foreground", emoji: "⚪" },
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

  const findMatchingTask = (keywords: string[]) => {
    return tasks.find((t) => {
      if (t.status === "completed") return false;
      const titleLower = t.title.toLowerCase();
      const typeLower = t.type?.toLowerCase() || "";
      return keywords.some((kw) => titleLower.includes(kw) || typeLower.includes(kw));
    });
  };

  return (
    <>
      <Card className={`${cfg.bg} border ${cfg.border} overflow-hidden`}>
        <CardContent className="p-0">
          <Collapsible open={expanded} onOpenChange={setExpanded}>
            {/* Always-visible compact header */}
            <div className="p-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <Shield className={`h-4 w-4 shrink-0 ${cfg.text}`} />
                <span className={`text-sm font-bold ${cfg.text}`}>
                  {cfg.emoji} {cfg.label}
                </span>
                {risk && (
                  <>
                    <span className="text-border">·</span>
                    <span className={`text-xs font-medium flex items-center gap-1 ${riskColors[risk]}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${riskDots[risk]}`} />
                      {riskLabels[risk]}
                    </span>
                  </>
                )}
                {maturityStats && (
                  <>
                    <span className="text-border">·</span>
                    <span className="text-xs text-muted-foreground">
                      {maturityStats.implementedCount}/{maturityStats.totalControls} <span className="text-[10px]">({maturityStats.trustScore}%)</span>
                    </span>
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
                    <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${expanded ? "rotate-180" : ""}`} />
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
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-3 w-3 text-muted-foreground/60 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="max-w-[220px] text-xs leading-relaxed p-2.5">
                          <p className="font-semibold mb-1">{isNb ? "Risikonivå" : "Risk level"}</p>
                          <p>{isNb
                            ? "Risikonivået settes basert på leverandørens kritikalitet, datatyper og land."
                            : "Risk level is based on the vendor's criticality, data types, and country."
                          }</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
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
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="h-3 w-3 text-muted-foreground/60 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent side="bottom" className="max-w-[220px] text-xs leading-relaxed p-2.5">
                            <p className="font-semibold mb-1">{isNb ? "Kontroll og modenhet" : "Control & maturity"}</p>
                            <p>{isNb
                              ? "Viser hvor mange kontroller som er oppfylt. Klikk for å se detaljene."
                              : "Shows how many controls are met. Click to view details."
                            }</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </>
                  )}
                </div>

                {/* Remaining tasks summary */}
                {maturityStats && maturityStats.totalControls - maturityStats.implementedCount > 0 && (
                  <button
                    onClick={() => {
                      const el = document.getElementById("vendor-tasks-section");
                      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                    }}
                    className="flex items-start gap-2 p-2.5 rounded-lg bg-background/60 border border-border hover:border-primary/30 transition-colors w-full text-left"
                  >
                    <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-medium text-foreground">
                        {maturityStats.totalControls - maturityStats.implementedCount} {isNb ? "kontroller gjenstår for å nå" : "controls remaining to reach"} «{tprmConfig.approved.label}»
                      </p>
                      <span className="text-[10px] text-primary mt-1 inline-block">
                        {isNb ? "Se i oppgaver ↓" : "View in tasks ↓"}
                      </span>
                    </div>
                  </button>
                )}

                {/* Recent Activities */}
                <div className="border-t border-border pt-3 mt-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {isNb ? "Siste aktiviteter" : "Recent activities"}
                      </span>
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
