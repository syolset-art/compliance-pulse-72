import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, AlertTriangle, ShieldCheck, ArrowRight } from "lucide-react";
import { useTrustControlEvaluation } from "@/hooks/useTrustControlEvaluation";
import type { EvaluatedControl } from "@/lib/trustControlDefinitions";

interface RiskInfluenceDiagramProps {
  assetId: string;
}

interface InfluenceFactor {
  label: string;
  direction: "up" | "down" | "neutral";
  impact: "high" | "medium" | "low";
  controlKey: string;
}

export function RiskInfluenceDiagram({ assetId }: RiskInfluenceDiagramProps) {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";
  const evaluation = useTrustControlEvaluation(assetId);

  if (!evaluation) return null;

  const { allControls, trustScore, risks } = evaluation;

  // Derive influence factors from controls
  const factors: InfluenceFactor[] = allControls
    .map((c: EvaluatedControl): InfluenceFactor | null => {
      if (c.status === "implemented") {
        return {
          label: isNb ? c.labelNb : c.labelEn,
          direction: "down",
          impact: c.weight >= 3 ? "high" : c.weight >= 2 ? "medium" : "low",
          controlKey: c.key,
        };
      }
      if (c.status === "missing") {
        return {
          label: isNb ? c.labelNb : c.labelEn,
          direction: "up",
          impact: c.weight >= 3 ? "high" : c.weight >= 2 ? "medium" : "low",
          controlKey: c.key,
        };
      }
      if (c.status === "partial") {
        return {
          label: isNb ? c.labelNb : c.labelEn,
          direction: "neutral",
          impact: c.weight >= 3 ? "medium" : "low",
          controlKey: c.key,
        };
      }
      return null;
    })
    .filter(Boolean) as InfluenceFactor[];

  // Sort: risk-increasing first (up), then neutral, then risk-reducing (down)
  const sortOrder = { up: 0, neutral: 1, down: 2 };
  const impactOrder = { high: 0, medium: 1, low: 2 };
  factors.sort((a, b) => sortOrder[a.direction] - sortOrder[b.direction] || impactOrder[a.impact] - impactOrder[b.impact]);

  const increasing = factors.filter(f => f.direction === "up");
  const decreasing = factors.filter(f => f.direction === "down");
  const neutral = factors.filter(f => f.direction === "neutral");

  const riskScore = 100 - trustScore;
  const riskLevel = riskScore >= 60 ? "high" : riskScore >= 30 ? "medium" : "low";
  const riskColor = riskLevel === "high" ? "text-destructive" : riskLevel === "medium" ? "text-warning" : "text-status-closed dark:text-status-closed";
  const riskBg = riskLevel === "high" ? "bg-destructive/10" : riskLevel === "medium" ? "bg-warning/10" : "bg-status-closed/10";

  const DirectionIcon = ({ dir }: { dir: "up" | "down" | "neutral" }) => {
    if (dir === "up") return <TrendingUp className="h-3.5 w-3.5 text-destructive" />;
    if (dir === "down") return <TrendingDown className="h-3.5 w-3.5 text-status-closed dark:text-status-closed" />;
    return <Minus className="h-3.5 w-3.5 text-warning" />;
  };

  const ImpactBadge = ({ impact }: { impact: "high" | "medium" | "low" }) => {
    const variant = impact === "high" ? "destructive" : impact === "medium" ? "warning" : "outline";
    const label = isNb
      ? (impact === "high" ? "Høy" : impact === "medium" ? "Middels" : "Lav")
      : (impact === "high" ? "High" : impact === "medium" ? "Medium" : "Low");
    return <Badge variant={variant} className="text-[13px] px-1.5 py-0">{label}</Badge>;
  };

  const FactorList = ({ items, emptyMsg }: { items: InfluenceFactor[]; emptyMsg: string }) => (
    <div className="space-y-1.5">
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground italic">{emptyMsg}</p>
      ) : (
        items.slice(0, 5).map((f) => (
          <div key={f.controlKey} className="flex items-center gap-2 rounded-md px-2.5 py-1.5 bg-muted/40">
            <DirectionIcon dir={f.direction} />
            <span className="text-xs flex-1 truncate">{f.label}</span>
            <ImpactBadge impact={f.impact} />
          </div>
        ))
      )}
    </div>
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">
          {isNb ? "Risikopåvirkning" : "Risk Influence"}
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          {isNb
            ? "Oversikt over hva som øker og reduserer risikonivået for denne eiendelen"
            : "Overview of what increases and decreases the risk level for this asset"}
        </p>
      </CardHeader>
      <CardContent>
        {/* Central risk gauge */}
        <div className={`flex items-center justify-center gap-3 rounded-lg p-4 mb-5 ${riskBg}`}>
          <div className="relative h-16 w-16 shrink-0">
            <svg className="h-16 w-16 -rotate-90" viewBox="0 0 36 36">
              <path className="stroke-muted" strokeWidth="4" fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              <path
                className={riskLevel === "high" ? "stroke-destructive" : riskLevel === "medium" ? "stroke-warning" : "stroke-green-500"}
                strokeWidth="4" strokeLinecap="round" fill="none"
                strokeDasharray={`${riskScore}, 100`}
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-lg font-bold ${riskColor}`}>{riskScore}</span>
            </div>
          </div>
          <div>
            <p className={`text-sm font-semibold ${riskColor}`}>
              {isNb
                ? (riskLevel === "high" ? "Høy risiko" : riskLevel === "medium" ? "Middels risiko" : "Lav risiko")
                : (riskLevel === "high" ? "High risk" : riskLevel === "medium" ? "Medium risk" : "Low risk")}
            </p>
            <p className="text-[13px] text-muted-foreground">
              {isNb ? `Basert på ${allControls.length} kontroller` : `Based on ${allControls.length} controls`}
            </p>
          </div>
        </div>

        {/* Two-column: increasing vs decreasing */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Risk increasing */}
          <div>
            <div className="flex items-center gap-2 mb-2.5">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <h4 className="text-xs font-semibold uppercase tracking-wider text-destructive">
                {isNb ? "Øker risiko" : "Increases risk"}
              </h4>
              <Badge variant="destructive" className="text-[13px] px-1.5 py-0 ml-auto">{increasing.length}</Badge>
            </div>
            <FactorList
              items={increasing}
              emptyMsg={isNb ? "Ingen risikodrivere identifisert" : "No risk drivers identified"}
            />
          </div>

          {/* Risk decreasing */}
          <div>
            <div className="flex items-center gap-2 mb-2.5">
              <ShieldCheck className="h-4 w-4 text-status-closed dark:text-status-closed" />
              <h4 className="text-xs font-semibold uppercase tracking-wider text-status-closed dark:text-status-closed">
                {isNb ? "Reduserer risiko" : "Reduces risk"}
              </h4>
              <Badge variant="outline" className="text-[13px] px-1.5 py-0 ml-auto text-status-closed dark:text-status-closed">{decreasing.length}</Badge>
            </div>
            <FactorList
              items={decreasing}
              emptyMsg={isNb ? "Ingen risikoreduserende tiltak" : "No risk-reducing measures"}
            />
          </div>
        </div>

        {/* Partial / neutral factors */}
        {neutral.length > 0 && (
          <div className="mt-5 pt-4 border-t border-border">
            <div className="flex items-center gap-2 mb-2.5">
              <Minus className="h-4 w-4 text-warning" />
              <h4 className="text-xs font-semibold uppercase tracking-wider text-warning">
                {isNb ? "Delvis implementert" : "Partially implemented"}
              </h4>
              <Badge variant="warning" className="text-[13px] px-1.5 py-0 ml-auto">{neutral.length}</Badge>
            </div>
            <FactorList
              items={neutral}
              emptyMsg=""
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
