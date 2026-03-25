import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { CheckCircle2, XCircle, AlertTriangle, Shield, ChevronDown, Zap, ShoppingCart, TrendingUp, Clock } from "lucide-react";
import { type DeviceControl } from "./DeviceTrustProfile";

type ActionStatus = "not_started" | "in_progress" | "done";

interface DeviceControlStatusProps {
  controls: DeviceControl[];
}

export function DeviceControlStatus({ controls }: DeviceControlStatusProps) {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";
  const [statuses, setStatuses] = useState<Record<string, ActionStatus>>({});
  const [showPassed, setShowPassed] = useState(false);

  const passControls = controls.filter(c => c.status === "pass");
  const warnControls = controls.filter(c => c.status === "warn");
  const failControls = controls.filter(c => c.status === "fail");
  const score = Math.round(((passControls.length + warnControls.length * 0.5) / controls.length) * 100);

  const cycleStatus = (id: string) => {
    setStatuses(prev => {
      const current = prev[id] || "not_started";
      const next: ActionStatus = current === "not_started" ? "in_progress" : current === "in_progress" ? "done" : "not_started";
      return { ...prev, [id]: next };
    });
  };

  const statusLabel = (s: ActionStatus) => {
    if (s === "in_progress") return isNb ? "Pågår" : "In progress";
    if (s === "done") return isNb ? "Fullført" : "Done";
    return isNb ? "Ikke startet" : "Not started";
  };

  const statusVariant = (s: ActionStatus) => {
    if (s === "done") return "action" as const;
    if (s === "in_progress") return "warning" as const;
    return "outline" as const;
  };

  const actionableControls = [...failControls, ...warnControls];
  const doneControls = actionableControls.filter(c => (statuses[c.id] || "not_started") === "done");
  const activeControls = actionableControls.filter(c => (statuses[c.id] || "not_started") !== "done");

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
              {controls.length} {isNb ? "kontroller totalt" : "controls total"}
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
              <span className="font-medium text-destructive">{failControls.length}</span>
              <span className="text-muted-foreground">{isNb ? "Krever tiltak" : "Requires action"}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <span className="font-medium text-warning">{warnControls.length}</span>
              <span className="text-muted-foreground">{isNb ? "Trenger oppfølging" : "Needs follow-up"}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <span className="font-medium text-success">{passControls.length}</span>
              <span className="text-muted-foreground">OK</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actionable controls (fail + warn, not done) */}
      {activeControls.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <XCircle className="h-4 w-4 text-destructive" />
              {isNb ? "Krever tiltak" : "Requires action"} ({activeControls.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-0 p-0">
            {activeControls.map(c => {
              const st = statuses[c.id] || "not_started";
              const isFail = c.status === "fail";
              return (
                <div key={c.id} className="px-5 py-3 border-b last:border-b-0 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 min-w-0 flex-1">
                      {isFail
                        ? <XCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                        : <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                      }
                      <div className="min-w-0">
                        <span className="text-sm font-semibold">{isNb ? c.label : c.labelEn}</span>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {isNb ? c.recommendation : c.recommendationEn}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-mono shrink-0">
                      {c.isoRef}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-3 flex-wrap text-[11px]">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {isNb ? c.fixEffort : c.fixEffortEn}
                    </div>
                    {c.scoreImpact > 0 && (
                      <div className="flex items-center gap-1 text-success font-medium">
                        <TrendingUp className="h-3 w-3" />
                        +{c.scoreImpact}%
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-0.5">
                    <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5">
                      <Zap className="h-3 w-3" />
                      {isNb ? "Fiks dette" : "Fix this"}
                    </Button>
                    {c.serviceAvailable && (
                      <Button size="sm" className="h-7 text-xs gap-1.5">
                        <ShoppingCart className="h-3 w-3" />
                        {isNb ? "Aktiver tjeneste" : "Activate service"}
                      </Button>
                    )}
                    <Badge
                      variant={statusVariant(st)}
                      className="text-[10px] cursor-pointer ml-auto"
                      onClick={() => cycleStatus(c.id)}
                    >
                      {statusLabel(st)}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Done controls */}
      {doneControls.length > 0 && (
        <Collapsible>
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader className="pb-2 cursor-pointer hover:bg-muted/50 transition-colors">
                <CardTitle className="text-sm flex items-center gap-2 text-success">
                  <CheckCircle2 className="h-4 w-4" />
                  {isNb ? "Fullført" : "Completed"} ({doneControls.length})
                  <ChevronDown className="h-3.5 w-3.5 ml-auto text-muted-foreground" />
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-0 p-0">
                {doneControls.map(c => (
                  <div key={c.id} className="flex items-center justify-between px-5 py-2.5 border-b last:border-b-0">
                    <div className="flex items-center gap-2 min-w-0 line-through text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                      <span className="text-sm">{isNb ? c.label : c.labelEn}</span>
                    </div>
                    <Badge
                      variant="action"
                      className="text-[10px] cursor-pointer"
                      onClick={() => cycleStatus(c.id)}
                    >
                      {statusLabel("done")}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}

      {/* Passed controls - collapsed */}
      <Collapsible open={showPassed} onOpenChange={setShowPassed}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="pb-2 cursor-pointer hover:bg-muted/50 transition-colors">
              <CardTitle className="text-sm flex items-center gap-2 text-success">
                <CheckCircle2 className="h-4 w-4" />
                {passControls.length} {isNb ? "av" : "of"} {controls.length} {isNb ? "kontroller OK" : "controls OK"}
                <ChevronDown className={`h-3.5 w-3.5 ml-auto text-muted-foreground transition-transform ${showPassed ? "rotate-180" : ""}`} />
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-0 p-0">
              {passControls.map(c => (
                <div key={c.id} className="flex items-center justify-between px-5 py-2.5 border-b last:border-b-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                    <span className="text-sm text-muted-foreground">{isNb ? c.label : c.labelEn}</span>
                  </div>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-mono shrink-0">
                    {c.isoRef}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </div>
  );
}
