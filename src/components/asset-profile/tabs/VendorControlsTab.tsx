import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, XCircle, AlertTriangle, Shield, ChevronDown, ChevronUp, FileText } from "lucide-react";
import { useTrustControlEvaluation } from "@/hooks/useTrustControlEvaluation";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface VendorControlsTabProps {
  assetId: string;
}

const AREA_META: Record<string, { labelNb: string; labelEn: string; color: string }> = {
  governance: { labelNb: "Styring", labelEn: "Governance", color: "text-blue-600" },
  risk_compliance: { labelNb: "Drift og sikkerhet", labelEn: "Operations & Security", color: "text-emerald-600" },
  security_posture: { labelNb: "Personvern og datahåndtering", labelEn: "Privacy & Data Handling", color: "text-violet-600" },
  supplier_governance: { labelNb: "Tredjepartstyring og verdikjede", labelEn: "Third-Party & Value Chain", color: "text-amber-600" },
};

const StatusIcon = ({ status }: { status: string }) => {
  if (status === "implemented") return <CheckCircle2 className="h-4 w-4 text-success shrink-0" />;
  if (status === "partial") return <AlertTriangle className="h-4 w-4 text-warning shrink-0" />;
  return <XCircle className="h-4 w-4 text-destructive shrink-0" />;
};

export const VendorControlsTab = ({ assetId }: VendorControlsTabProps) => {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";
  const evaluation = useTrustControlEvaluation(assetId);
  const [openAreas, setOpenAreas] = useState<Record<string, boolean>>({});

  if (!evaluation) {
    return <p className="text-sm text-muted-foreground italic p-4">{isNb ? "Laster…" : "Loading…"}</p>;
  }

  const { allControls, trustScore, implementedCount, partialCount, missingCount } = evaluation;
  const total = allControls.length;

  const areas = Object.keys(AREA_META);
  const areaGroups = areas.map(area => {
    const controls = allControls.filter(c => c.area === area);
    if (controls.length === 0) return null;
    const score = evaluation.areaScore(area as any);
    return { area, controls, score, ...AREA_META[area] };
  }).filter(Boolean) as { area: string; controls: any[]; score: number; labelNb: string; labelEn: string; color: string }[];

  const toggle = (area: string) => setOpenAreas(prev => ({ ...prev, [area]: !prev[area] }));

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">{isNb ? "Total score" : "Overall score"}</span>
            </div>
            <span className="text-2xl font-bold">{trustScore}%</span>
            <Progress value={trustScore} className="flex-1 h-2" />
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-success" />{implementedCount}</span>
              <span className="flex items-center gap-1"><AlertTriangle className="h-3 w-3 text-warning" />{partialCount}</span>
              <span className="flex items-center gap-1"><XCircle className="h-3 w-3 text-destructive" />{missingCount}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Domain sections */}
      {areaGroups.map(({ area, controls, score, labelNb: lNb, labelEn: lEn, color }) => (
        <Collapsible key={area} open={openAreas[area] ?? false} onOpenChange={() => toggle(area)}>
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors py-3 px-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`font-semibold text-sm ${color}`}>{isNb ? lNb : lEn}</span>
                    <Badge variant="outline" className="text-xs">{controls.length} {isNb ? "kontroller" : "controls"}</Badge>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold">{score}%</span>
                    <Progress value={score} className="w-20 h-1.5" />
                    {openAreas[area] ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </div>
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0 px-0 pb-0">
                {controls.map((c: any) => (
                  <div key={c.key} className="flex items-center justify-between px-4 py-2.5 border-t">
                    <div className="flex items-center gap-2 min-w-0">
                      <StatusIcon status={c.status} />
                      <span className="text-sm">{isNb ? c.labelNb : c.labelEn}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant={c.status === "implemented" ? "default" : c.status === "partial" ? "secondary" : "destructive"} className="text-[13px] px-1.5">
                        {c.status === "implemented" ? "OK" : c.status === "partial" ? (isNb ? "Delvis" : "Partial") : (isNb ? "Mangler" : "Missing")}
                      </Badge>
                      {c.verificationSource && (
                        <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      ))}
    </div>
  );
};
