import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Sparkles,
  CalendarDays,
  Edit,
  ChevronDown,
  AlertTriangle,
  AlertOctagon,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { useTrustControlEvaluation } from "@/hooks/useTrustControlEvaluation";

interface VendorAuditTabProps {
  assetId: string;
}

export function VendorAuditTab({ assetId }: VendorAuditTabProps) {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";
  const evaluation = useTrustControlEvaluation(assetId);
  const [descOpen, setDescOpen] = useState(false);

  const { data: asset } = useQuery({
    queryKey: ["asset-audit-info", assetId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assets")
        .select("name, risk_level, next_review_date, metadata")
        .eq("id", assetId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  // Derive risk data from controls
  const riskScore = evaluation ? evaluation.trustScore : 0;
  const invertedRisk = evaluation ? 100 - evaluation.trustScore : 0;

  // Count risks by severity from the evaluation
  const criticalCount = evaluation
    ? evaluation.risks.filter((r) => r.severity === "high" && evaluation.allControls.find((c) => c.key === r.triggerControlKey && c.status === "missing")).length
    : 0;
  const highCount = evaluation
    ? evaluation.risks.filter((r) => r.severity === "high" && evaluation.allControls.find((c) => c.key === r.triggerControlKey && c.status === "partial")).length
    : 0;
  const mediumCount = evaluation
    ? evaluation.risks.filter((r) => r.severity === "medium").length
    : 0;
  const lowCount = evaluation
    ? evaluation.risks.filter((r) => r.severity === "low").length
    : 0;

  // Next review
  const nextReview = asset?.next_review_date;
  const reviewDate = nextReview ? new Date(nextReview) : null;
  const today = new Date();
  const daysUntilReview = reviewDate
    ? Math.ceil((reviewDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const getReviewStatus = () => {
    if (!daysUntilReview) return { label: isNb ? "Ikke planlagt" : "Not planned", color: "text-muted-foreground" };
    if (daysUntilReview < 0) return { label: isNb ? "Forfalt" : "Overdue", color: "text-destructive" };
    if (daysUntilReview <= 7) return { label: isNb ? "Snart forfall" : "Due soon", color: "text-warning" };
    if (daysUntilReview <= 30) return { label: isNb ? "Snart forfall" : "Due soon", color: "text-warning" };
    return { label: isNb ? "Planlagt" : "Planned", color: "text-success" };
  };

  const reviewStatus = getReviewStatus();

  const getRiskLabel = (score: number) => {
    if (score >= 70) return { label: isNb ? "Lav risiko" : "Low risk", color: "text-success" };
    if (score >= 40) return { label: isNb ? "Moderat risiko" : "Moderate risk", color: "text-warning" };
    return { label: isNb ? "Høy risiko" : "High risk", color: "text-destructive" };
  };

  const riskLabel = getRiskLabel(riskScore);

  // Risk circle
  const circleSize = 100;
  const strokeWidth = 10;
  const radius = (circleSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (invertedRisk / 100) * circumference;
  const circleColor = invertedRisk >= 60 ? "stroke-destructive" : invertedRisk >= 30 ? "stroke-warning" : "stroke-success";

  // AI justification (mock for now from metadata)
  const meta = (asset?.metadata || {}) as Record<string, any>;
  const justification = meta.risk_justification ||
    (isNb
      ? "Det mangler grunnleggende styringstiltak (ansvarlige, prosesser, sletterutiner). Disse kan etableres raskt, men krever lett oppfølging. En ny revisjon om ca. 2 måneder sikrer at fremdriften måles og at forbedringer justeres før videre utrulling."
      : "Basic governance measures are missing (responsibilities, processes, deletion routines). These can be established quickly but require light follow-up. A new audit in approx. 2 months ensures progress is measured and improvements adjusted.");

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: Risk overview */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">
                    {isNb ? "Overordnet risikobilde (ROS)" : "Overall Risk Assessment"}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {isNb ? "Samlet risikovurdering av systemet" : "Combined risk assessment of the system"}
                  </p>
                </div>
                <Button size="sm" className="gap-1.5 bg-primary">
                  <Sparkles className="h-4 w-4" />
                  {isNb ? "Kjør ny revisjon" : "Run new audit"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-6">
                {/* Risk Score Circle */}
                <div className="flex flex-col items-center gap-1">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {isNb ? "RISIKO SCORE" : "RISK SCORE"}
                  </p>
                  <div className="relative" style={{ width: circleSize, height: circleSize }}>
                    <svg width={circleSize} height={circleSize} className="-rotate-90">
                      <circle
                        cx={circleSize / 2}
                        cy={circleSize / 2}
                        r={radius}
                        fill="none"
                        stroke="hsl(var(--muted))"
                        strokeWidth={strokeWidth}
                      />
                      <circle
                        cx={circleSize / 2}
                        cy={circleSize / 2}
                        r={radius}
                        fill="none"
                        className={circleColor}
                        strokeWidth={strokeWidth}
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        style={{ transition: "stroke-dashoffset 0.5s ease" }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-2xl font-bold">{invertedRisk}%</span>
                    </div>
                  </div>
                  <span className={`text-xs font-medium ${riskLabel.color}`}>{riskLabel.label}</span>
                </div>

                {/* Risk Distribution */}
                <div className="flex-1">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                    {isNb ? "RISIKOFORDELING" : "RISK DISTRIBUTION"}
                  </p>
                  <div className="grid grid-cols-4 gap-2">
                    <RiskCard
                      count={criticalCount}
                      label={isNb ? "KRITISK RISIKO" : "CRITICAL RISK"}
                      sublabel={isNb ? "Umiddelbar handling" : "Immediate action"}
                      color="border-destructive/30 bg-destructive/5"
                      textColor="text-destructive"
                    />
                    <RiskCard
                      count={highCount}
                      label={isNb ? "HØY RISIKO" : "HIGH RISK"}
                      sublabel={isNb ? "Kritiske områder" : "Critical areas"}
                      color="border-orange-300/50 bg-orange-50 dark:bg-orange-900/10"
                      textColor="text-orange-600 dark:text-orange-400"
                    />
                    <RiskCard
                      count={mediumCount}
                      label={isNb ? "MODERAT RISIKO" : "MODERATE RISK"}
                      sublabel={isNb ? "Oppmerksomhet kreves" : "Attention needed"}
                      color="border-warning/30 bg-warning/5"
                      textColor="text-warning"
                    />
                    <RiskCard
                      count={lowCount}
                      label={isNb ? "LAV RISIKO" : "LOW RISK"}
                      sublabel={isNb ? "God kontroll" : "Good control"}
                      color="border-success/30 bg-success/5"
                      textColor="text-success"
                    />
                  </div>
                </div>
              </div>

              {/* Risk description collapsible */}
              <Collapsible open={descOpen} onOpenChange={setDescOpen} className="mt-4">
                <CollapsibleTrigger asChild>
                  <button className="flex items-center justify-between w-full px-3 py-2 border rounded-md text-sm hover:bg-muted/50 transition-colors">
                    <span className="font-medium text-sm">{isNb ? "RISIKOBESKRIVELSE" : "RISK DESCRIPTION"}</span>
                    <ChevronDown className={`h-4 w-4 transition-transform ${descOpen ? "rotate-180" : ""}`} />
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2">
                  <div className="rounded-md border p-4 text-sm text-muted-foreground space-y-2">
                    {evaluation?.risks.filter(r => {
                      const ctrl = evaluation.allControls.find(c => c.key === r.triggerControlKey);
                      return ctrl && ctrl.status !== "implemented";
                    }).map((risk) => (
                      <div key={risk.id} className="flex items-start gap-2">
                        {risk.severity === "high" ? (
                          <AlertOctagon className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                        ) : risk.severity === "medium" ? (
                          <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                        ) : (
                          <ShieldCheck className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                        )}
                        <span>{isNb ? risk.titleNb : risk.titleEn}</span>
                      </div>
                    ))}
                    {evaluation?.risks.filter(r => {
                      const ctrl = evaluation.allControls.find(c => c.key === r.triggerControlKey);
                      return ctrl && ctrl.status !== "implemented";
                    }).length === 0 && (
                      <p>{isNb ? "Ingen åpne risikoer identifisert." : "No open risks identified."}</p>
                    )}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </CardContent>
          </Card>
        </div>

        {/* Right: Next review */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{isNb ? "Neste revisjon" : "Next Audit"}</CardTitle>
                <Button variant="outline" size="sm" className="gap-1 h-7 text-xs">
                  <Edit className="h-3 w-3" />
                  {isNb ? "Rediger" : "Edit"}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {reviewDate ? (
                <>
                  <p className="text-2xl font-bold">
                    {reviewDate.toLocaleDateString(isNb ? "nb-NO" : "en-GB", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                  {daysUntilReview !== null && (
                    <Badge
                      variant="outline"
                      className={`text-xs font-semibold uppercase ${
                        daysUntilReview < 0
                          ? "border-destructive/30 text-destructive"
                          : daysUntilReview <= 14
                            ? "border-warning/30 text-warning"
                            : "border-success/30 text-success"
                      }`}
                    >
                      {daysUntilReview < 0
                        ? `${Math.abs(daysUntilReview)} ${isNb ? "dager over forfall" : "days overdue"}`
                        : `${daysUntilReview} ${isNb ? "dager igjen" : "days remaining"}`}
                    </Badge>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Status: <span className={reviewStatus.color}>{reviewStatus.label}</span>
                  </p>
                </>
              ) : (
                <div className="text-center py-4">
                  <CalendarDays className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {isNb ? "Ingen revisjon planlagt" : "No audit planned"}
                  </p>
                </div>
              )}

              {/* AI Justification */}
              <div className="rounded-md border p-3 space-y-2 mt-4">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  <span className="text-xs font-semibold">{isNb ? "Begrunnelse" : "Justification"}</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{justification}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function RiskCard({
  count,
  label,
  sublabel,
  color,
  textColor,
}: {
  count: number;
  label: string;
  sublabel: string;
  color: string;
  textColor: string;
}) {
  return (
    <div className={`rounded-lg border p-3 text-center ${color}`}>
      <span className={`text-2xl font-bold ${textColor}`}>{count}</span>
      <p className={`text-[9px] font-bold uppercase tracking-wider mt-1 ${textColor}`}>{label}</p>
      <p className="text-[9px] text-muted-foreground mt-0.5">{sublabel}</p>
    </div>
  );
}
