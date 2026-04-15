import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Wrench, TrendingUp, Clock, Zap, ShoppingCart, ChevronDown, CheckCircle2 } from "lucide-react";
import { type DeviceControl } from "./DeviceTrustProfile";

type ActionStatus = "not_started" | "in_progress" | "done";

interface DeviceActionPlansProps {
  controls: DeviceControl[];
  meta: Record<string, any>;
  totalControls: number;
}

export function DeviceActionPlans({ controls, meta, totalControls }: DeviceActionPlansProps) {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";
  const [statuses, setStatuses] = useState<Record<string, ActionStatus>>({});

  const actionable = controls
    .filter(c => c.status !== "pass")
    .sort((a, b) => {
      if (a.status === "fail" && b.status !== "fail") return -1;
      if (a.status !== "fail" && b.status === "fail") return 1;
      return b.scoreImpact - a.scoreImpact;
    });

  if (actionable.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-sm text-muted-foreground">
          {isNb ? "Alle kontroller er oppfylt — ingen tiltak nødvendig" : "All controls met — no actions needed"}
        </p>
      </Card>
    );
  }

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

  const activeItems = actionable.filter(c => (statuses[c.id] || "not_started") !== "done");
  const doneItems = actionable.filter(c => (statuses[c.id] || "not_started") === "done");

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Wrench className="h-5 w-5 text-primary" />
            {isNb ? "Prioriterte tiltak" : "Prioritized Actions"}
            {activeItems.length > 0 && (
              <Badge variant="destructive" className="text-[13px] ml-1">{activeItems.length}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-0 p-0">
          {activeItems.map((c) => {
            const st = statuses[c.id] || "not_started";
            const priority = c.status === "fail" && c.scoreImpact >= 7 ? "HIGH" : c.status === "fail" ? "MEDIUM" : "LOW";
            const priorityColor = priority === "HIGH"
              ? "bg-destructive text-destructive-foreground"
              : priority === "MEDIUM"
                ? "bg-warning text-warning-foreground"
                : "bg-muted text-muted-foreground";

            return (
              <div key={c.id} className="px-5 py-4 border-b last:border-b-0 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 min-w-0 flex-1">
                    <Badge className={`text-[13px] shrink-0 ${priorityColor}`}>{priority}</Badge>
                    <div className="min-w-0">
                      <span className="text-sm font-semibold">{isNb ? c.label : c.labelEn}</span>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {isNb ? c.recommendation : c.recommendationEn}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-wrap text-[13px]">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {isNb ? c.fixEffort : c.fixEffortEn}
                  </div>
                  {c.scoreImpact > 0 && (
                    <div className="flex items-center gap-1 text-success font-medium">
                      <TrendingUp className="h-3 w-3" />
                      {isNb ? "Forbedrer Trust Score med" : "Improves Trust Score by"} +{c.scoreImpact}%
                    </div>
                  )}
                  {c.serviceAvailable && (
                    <Badge variant="outline" className="text-[13px] gap-1 text-primary border-primary/30">
                      <ShoppingCart className="h-2.5 w-2.5" />
                      {isNb ? "Tilgjengelig som tjeneste" : "Available as service"}
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-1">
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
                    className="text-[13px] cursor-pointer ml-auto"
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

      {/* Done items - collapsed */}
      {doneItems.length > 0 && (
        <Collapsible>
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader className="pb-2 cursor-pointer hover:bg-muted/50 transition-colors">
                <CardTitle className="text-sm flex items-center gap-2 text-success">
                  <CheckCircle2 className="h-4 w-4" />
                  {isNb ? "Fullførte tiltak" : "Completed actions"} ({doneItems.length})
                  <ChevronDown className="h-3.5 w-3.5 ml-auto text-muted-foreground" />
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-0 p-0">
                {doneItems.map(c => (
                  <div key={c.id} className="flex items-center justify-between px-5 py-2.5 border-b last:border-b-0">
                    <div className="flex items-center gap-2 min-w-0 line-through text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                      <span className="text-sm">{isNb ? c.label : c.labelEn}</span>
                    </div>
                    <Badge
                      variant="action"
                      className="text-[13px] cursor-pointer"
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
    </div>
  );
}
