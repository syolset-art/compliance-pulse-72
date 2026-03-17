import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, XCircle, AlertTriangle, Shield, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTrustControlEvaluation } from "@/hooks/useTrustControlEvaluation";

interface ControlsTabProps {
  assetId: string;
}

const AREA_LABELS: Record<string, { en: string; nb: string }> = {
  governance: { en: "Governance", nb: "Styring" },
  risk_compliance: { en: "Operations", nb: "Drift" },
  security_posture: { en: "Identity & Access", nb: "Identitet og tilgang" },
  supplier_governance: { en: "Supplier & Ecosystem", nb: "Leverandør og økosystem" },
};

export function ControlsTab({ assetId }: ControlsTabProps) {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";
  const evaluation = useTrustControlEvaluation(assetId);

  if (!evaluation) {
    return (
      <div className="text-sm text-muted-foreground italic p-8 text-center">
        {isNb ? "Laster kontroller…" : "Loading controls…"}
      </div>
    );
  }

  const { allControls, implementedCount, partialCount, missingCount } = evaluation;
  const total = allControls.length;
  const score = total > 0 ? Math.round(((implementedCount + partialCount * 0.5) / total) * 100) : 0;

  const missing = allControls.filter(c => c.status === "missing");
  const partial = allControls.filter(c => c.status === "partial");
  const implemented = allControls.filter(c => c.status === "implemented");

  // Group by area
  const areas = Object.keys(AREA_LABELS);
  const areaStats = areas.map(area => {
    const controls = allControls.filter(c => c.area === area);
    if (controls.length === 0) return null;
    const ok = controls.filter(c => c.status === "implemented").length;
    const part = controls.filter(c => c.status === "partial").length;
    const pct = Math.round(((ok + part * 0.5) / controls.length) * 100);
    return { area, controls, pct, label: isNb ? AREA_LABELS[area].nb : AREA_LABELS[area].en };
  }).filter(Boolean) as { area: string; controls: any[]; pct: number; label: string }[];

  return (
    <div className="space-y-4">
      {/* Summary Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shield className="h-5 w-5 text-primary" />
              {isNb ? "Kontrollstatus" : "Control Status"}
            </CardTitle>
            <span className="text-sm text-muted-foreground">
              {total} {isNb ? "kontroller totalt" : "controls total"}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <span className={`text-3xl font-bold ${score >= 80 ? "text-success" : score >= 50 ? "text-warning" : "text-destructive"}`}>
              {score}%
            </span>
            <div className="flex-1">
              <Progress value={score} className="h-3" />
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5">
              <XCircle className="h-4 w-4 text-destructive" />
              <span className="font-medium text-destructive">{missingCount}</span>
              <span className="text-muted-foreground">{isNb ? "Mangler" : "Missing"}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <span className="font-medium text-warning">{partialCount}</span>
              <span className="text-muted-foreground">{isNb ? "Delvis" : "Partial"}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <span className="font-medium text-success">{implementedCount}</span>
              <span className="text-muted-foreground">OK</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Area breakdown */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">
            {isNb ? "Kontrollområder" : "Control Areas"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {areaStats.map(a => (
            <div key={a.area} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium">{a.label}</span>
                <span className={`font-semibold tabular-nums ${a.pct >= 80 ? "text-success" : a.pct >= 50 ? "text-warning" : "text-destructive"}`}>
                  {a.pct}%
                </span>
              </div>
              <Progress value={a.pct} className="h-1.5" />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Missing controls */}
      {missing.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-destructive">
              <XCircle className="h-4 w-4" />
              {isNb ? "Mangler" : "Missing"} ({missing.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 p-0">
            {missing.map(c => (
              <div key={c.key} className="flex items-center justify-between px-5 py-2.5 border-b last:border-b-0">
                <div className="flex items-center gap-2 min-w-0">
                  <XCircle className="h-4 w-4 text-destructive shrink-0" />
                  <span className="text-sm font-medium">{isNb ? c.labelNb : c.labelEn}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-mono">
                    {c.area.replace("_", " ")}
                  </Badge>
                  <Button size="sm" variant="ghost" className="h-6 text-[10px] gap-1 text-primary">
                    <Send className="h-3 w-3" />
                    {isNb ? "Be om" : "Request"}
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Partial controls */}
      {partial.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-warning">
              <AlertTriangle className="h-4 w-4" />
              {isNb ? "Delvis" : "Partial"} ({partial.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 p-0">
            {partial.map(c => (
              <div key={c.key} className="flex items-center justify-between px-5 py-2.5 border-b last:border-b-0">
                <div className="flex items-center gap-2 min-w-0">
                  <AlertTriangle className="h-4 w-4 text-warning shrink-0" />
                  <span className="text-sm font-medium">{isNb ? c.labelNb : c.labelEn}</span>
                </div>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-mono shrink-0">
                  {c.area.replace("_", " ")}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Passing controls */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2 text-success">
            <CheckCircle2 className="h-4 w-4" />
            OK ({implemented.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 p-0">
          {implemented.map(c => (
            <div key={c.key} className="flex items-center justify-between px-5 py-2.5 border-b last:border-b-0">
              <div className="flex items-center gap-2 min-w-0">
                <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                <span className="text-sm text-muted-foreground">{isNb ? c.labelNb : c.labelEn}</span>
              </div>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-mono shrink-0">
                {c.area.replace("_", " ")}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
