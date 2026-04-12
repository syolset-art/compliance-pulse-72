import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Shield, AlertTriangle, HelpCircle, Mail, ArrowDown, CheckCircle2, Circle, AlertCircle } from "lucide-react";
import { RequestUpdateDialog } from "@/components/asset-profile/RequestUpdateDialog";
import { toast } from "sonner";

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

function getTPRMLevel(risk: "high" | "medium" | "low" | null, controlsMet: number, totalControls: number): TPRMLevel {
  if (risk === null) return "not_assessed";
  const controlRatio = controlsMet / totalControls;
  if (risk === "high" && controlRatio < 0.75) return "action_required";
  if (controlRatio >= 0.75) return "approved";
  return "under_review";
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
  const [requestType, setRequestType] = useState<string | undefined>();
  const queryClient = useQueryClient();

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
  const tprmLevel = getTPRMLevel(risk, controlsMet, controls.length);
  const effectiveLevel: TPRMLevel = (asset?.tprm_status as TPRMLevel) || tprmLevel;

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
          {/* Executive Summary Banner */}
          <div className="p-4 space-y-3">
            {/* Status header row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Shield className={`h-5 w-5 ${cfg.text}`} />
                <span className={`text-base font-bold ${cfg.text}`}>
                  {cfg.emoji} {cfg.label}
                </span>
              </div>
              <div className="flex items-center gap-2">
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
                <Select
                  value={effectiveLevel}
                  onValueChange={(val) => updateStatusMutation.mutate(val as TPRMLevel)}
                >
                  <SelectTrigger className="h-7 text-xs border border-border bg-background/60 px-2 w-auto min-w-[120px] shadow-none">
                    <SelectValue>
                      <span className="text-xs">{isNb ? "Endre status" : "Change status"}</span>
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
              </div>
            </div>

            {/* Metrics row: Risk · Control · Maturity */}
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
              <span className="text-border">|</span>
              <span className="flex items-center gap-1.5">
                <span className="text-muted-foreground text-xs">{isNb ? "Kontroll:" : "Control:"}</span>
                <span className="font-semibold text-foreground">{controlsMet}/{controls.length}</span>
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
                    <span className="text-muted-foreground text-xs">{isNb ? "Modenhet:" : "Maturity:"}</span>
                    <span className="font-semibold text-primary">{maturityStats.trustScore}%</span>
                    <span className="text-[10px] text-muted-foreground">
                      ({maturityStats.implementedCount}/{maturityStats.totalControls})
                    </span>
                  </button>
                </>
              )}
            </div>

            {/* Remaining tasks summary */}
            {missingControls.length > 0 && (
              <div className="flex items-start gap-2 p-2.5 rounded-lg bg-background/60 border border-border">
                <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-foreground">
                    {missingControls.length} {isNb ? "oppgaver gjenstår for å nå" : "tasks remaining to reach"} «{tprmConfig.approved.label}»
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {missingControls.map(c => c.label.split(" (")[0]).join(" · ")}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Control Checklist */}
          <div className="border-t border-border/50 px-4 py-3 space-y-1.5">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-2">
              {isNb ? "Oppfølgingskrav" : "Follow-up requirements"} ({controlsMet}/{controls.length})
            </p>
            {controls.map((ctrl) => {
              const matchingTask = findMatchingTask(ctrl.taskKeywords);
              return (
                <div
                  key={ctrl.key}
                  className={`flex items-center justify-between py-2 px-2.5 rounded-lg transition-colors ${
                    ctrl.met ? "bg-success/5" : "bg-destructive/5"
                  }`}
                >
                  <span className="flex items-center gap-2 text-sm">
                    {ctrl.met ? (
                      <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                    ) : (
                      <Circle className="h-4 w-4 text-destructive/50 shrink-0" />
                    )}
                    <span className={ctrl.met ? "text-foreground" : "text-muted-foreground"}>
                      {ctrl.label}
                    </span>
                  </span>
                  {ctrl.met ? (
                    <Badge variant="secondary" className="text-[10px] bg-success/10 text-success border-success/20">
                      {isNb ? "Oppfylt" : "Met"}
                    </Badge>
                  ) : matchingTask ? (
                    <Badge variant="secondary" className="text-[10px]">
                      {isNb ? "Oppgave opprettet" : "Task created"}
                    </Badge>
                  ) : ctrl.isAudit ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-6 text-[11px] gap-1"
                      onClick={handleGoToAudit}
                    >
                      {ctrl.requestLabel}
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-6 text-[11px] gap-1 text-destructive border-destructive/30 hover:bg-destructive/10"
                      onClick={() => handleRequest(ctrl.requestType!)}
                    >
                      <Mail className="h-3 w-3" />
                      {ctrl.requestLabel}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>

          {/* All met banner */}
          {controlsMet === controls.length && (
            <div className="border-t border-success/20 px-4 py-3">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-success" />
                <span className="text-success font-medium">
                  {isNb ? "Alle oppfølgingskrav er oppfylt" : "All follow-up requirements met"}
                </span>
              </div>
            </div>
          )}
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
