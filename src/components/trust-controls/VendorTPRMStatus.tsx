import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Shield, AlertCircle, HelpCircle, Mail, ArrowDown, CheckCircle2 } from "lucide-react";
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
}

type TPRMLevel = "approved" | "under_review" | "action_required" | "not_assessed";

interface ControlRequirement {
  key: string;
  label: string;
  met: boolean;
  taskKeywords: string[];
  requestType?: string;
  requestLabel: string;
  isAudit?: boolean;
}

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

function findMatchingTask(
  tasks: VendorTPRMStatusProps["tasks"],
  keywords: string[]
): VendorTPRMStatusProps["tasks"] extends (infer T)[] ? T | undefined : undefined {
  if (!tasks || tasks.length === 0) return undefined;
  return tasks.find((t) => {
    if (t.status === "completed") return false;
    const titleLower = t.title.toLowerCase();
    const typeLower = t.type?.toLowerCase() || "";
    return keywords.some((kw) => titleLower.includes(kw) || typeLower.includes(kw));
  });
}

export const VendorTPRMStatus = ({
  assetId,
  assetName = "",
  vendorName,
  contactPerson,
  contactEmail,
  tasks = [],
  maturityStats,
}: VendorTPRMStatusProps) => {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";
  const [requestOpen, setRequestOpen] = useState(false);
  const [requestType, setRequestType] = useState<string | undefined>();

  const { data: asset } = useQuery({
    queryKey: ["asset-tprm", assetId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assets")
        .select("criticality, risk_level, next_review_date")
        .eq("id", assetId)
        .maybeSingle();
      if (error) throw error;
      return data;
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

  const controls: ControlRequirement[] = [
    {
      key: "dpa",
      label: isNb ? "Databehandleravtale (DPA)" : "Data Processing Agreement",
      met: hasDPA,
      taskKeywords: ["dpa", "databehandleravtale", "data processing"],
      requestType: "dpa",
      requestLabel: isNb ? "Be om DPA" : "Request DPA",
    },
    {
      key: "sla",
      label: isNb ? "Tjenestenivåavtale (SLA)" : "Service Level Agreement",
      met: hasSLA,
      taskKeywords: ["sla", "tjenestenivå", "service level"],
      requestType: "sla",
      requestLabel: isNb ? "Be om SLA" : "Request SLA",
    },
    {
      key: "risk_assessment",
      label: isNb ? "Risikovurdering" : "Risk Assessment",
      met: hasRiskAssessment,
      taskKeywords: ["risikovurdering", "risk assessment", "risk_assessment"],
      requestType: "risk_assessment",
      requestLabel: isNb ? "Be om vurdering" : "Request assessment",
    },
    {
      key: "audit",
      label: isNb ? "Revisjon satt opp" : "Audit scheduled",
      met: hasAudit,
      taskKeywords: ["revisjon", "audit", "review"],
      requestLabel: isNb ? "Sett opp i Revisjon →" : "Set up in Audit →",
      isAudit: true,
    },
  ];

  const controlsMet = controls.filter((c) => c.met).length;
  const risk = getRiskLevel(asset?.criticality, asset?.risk_level);
  const tprmLevel = getTPRMLevel(risk, controlsMet, controls.length);

  const tprmConfig: Record<TPRMLevel, { label: string; variant: "default" | "warning" | "destructive" | "secondary"; emoji: string }> = {
    approved: { label: isNb ? "Godkjent" : "Approved", variant: "default", emoji: "🟢" },
    under_review: { label: isNb ? "Under oppfølging" : "Under review", variant: "warning", emoji: "🟡" },
    action_required: { label: isNb ? "Krever tiltak" : "Action required", variant: "destructive", emoji: "🔴" },
    not_assessed: { label: isNb ? "Ikke vurdert" : "Not assessed", variant: "secondary", emoji: "⚪" },
  };

  const riskLabels: Record<string, string> = {
    high: isNb ? "Høy" : "High",
    medium: isNb ? "Middels" : "Medium",
    low: isNb ? "Lav" : "Low",
  };

  const riskColors: Record<string, string> = {
    high: "text-destructive",
    medium: "text-warning",
    low: "text-primary",
  };

  const missingControls = controls.filter((c) => !c.met);

  const handleRequest = (docType: string) => {
    setRequestType(docType);
    setRequestOpen(true);
  };

  const handleScrollToTask = (taskId: string) => {
    window.dispatchEvent(new CustomEvent("scroll-to-tasks"));
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent("highlight-task", { detail: { taskId } }));
    }, 300);
  };

  const handleGoToAudit = () => {
    window.dispatchEvent(new CustomEvent("switch-to-tab", { detail: { tab: "vendor-audit" } }));
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              {isNb ? "Oppfølgingsstatus" : "Follow-up Status"}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs text-xs leading-relaxed p-3 space-y-1.5">
                    <p className="font-semibold text-foreground">TPRM – Third-Party Risk Management</p>
                    <p>
                      {isNb
                        ? "Kombinerer risiko ved bruk av leverandøren med grad av kontroll (dokumentasjon og oppfølging). Risiko = hvor farlig er dette? Kontroll = har vi gjort jobben vår?"
                        : "Combines the risk of using this vendor with the degree of control (documentation and follow-up). Risk = how dangerous is this? Control = have we done our job?"}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </span>
            <Badge variant={tprmConfig[tprmLevel].variant} className="text-[10px]">
              {tprmConfig[tprmLevel].emoji} {tprmConfig[tprmLevel].label}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          {/* Risk × Control summary */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-2.5 rounded-lg bg-muted/40">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1">
                {isNb ? "Risiko" : "Risk"}
              </p>
              {risk ? (
                <p className={`text-sm font-semibold ${riskColors[risk]}`}>
                  ● {riskLabels[risk]}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  {isNb ? "Ikke vurdert" : "Not assessed"}
                </p>
              )}
            </div>
            <div className="p-2.5 rounded-lg bg-muted/40">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1">
                {isNb ? "Kontroll" : "Control"}
              </p>
              <p className="text-sm font-semibold text-foreground">
                {controlsMet} {isNb ? "av" : "of"} {controls.length} {isNb ? "krav oppfylt" : "requirements met"}
              </p>
            </div>
          </div>

          {/* Maturity overview — links to control areas section below */}
          {maturityStats && (
            <button
              onClick={() => {
                const el = document.getElementById("maturity-controls-section");
                if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className="w-full p-2.5 rounded-lg bg-muted/40 hover:bg-muted/60 transition-colors text-left group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-0.5">
                    {isNb ? "Modenhet per kontrollområde" : "Maturity by control areas"}
                  </p>
                  <p className="text-sm font-semibold text-foreground">
                    {maturityStats.implementedCount} {isNb ? "av" : "of"} {maturityStats.totalControls} {isNb ? "kontroller oppfylt" : "controls met"}
                    {maturityStats.partialCount > 0 && (
                      <span className="text-xs font-normal text-muted-foreground ml-1">
                        ({maturityStats.partialCount} {isNb ? "delvis" : "partial"})
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-primary">{maturityStats.trustScore}%</span>
                  <ArrowDown className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </div>
              {/* Mini progress bar */}
              <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${maturityStats.trustScore}%` }}
                />
              </div>
            </button>
          )}


          {/* All met */}
          {controlsMet === controls.length && (
            <div className="flex items-center gap-2 p-2 rounded bg-primary/5 text-sm">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <span className="text-foreground font-medium">
                {isNb ? "Alle krav er oppfylt" : "All requirements met"}
              </span>
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
