import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Wrench, TrendingUp, Clock, Zap, ShoppingCart } from "lucide-react";
import { type DeviceControl } from "./DeviceTrustProfile";

interface DeviceActionPlansProps {
  controls: DeviceControl[];
  meta: Record<string, any>;
  totalControls: number;
}

export function DeviceActionPlans({ controls, meta, totalControls }: DeviceActionPlansProps) {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";

  // Sort failed controls by scoreImpact desc, then warn
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

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Wrench className="h-5 w-5 text-primary" />
            {isNb ? "Prioriterte tiltak" : "Prioritized Actions"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 p-0">
          {actionable.map((c) => {
            const priority = c.status === "fail" && c.scoreImpact >= 7 ? "HIGH" : c.status === "fail" ? "MEDIUM" : "LOW";
            const priorityColor = priority === "HIGH"
              ? "bg-destructive text-destructive-foreground"
              : priority === "MEDIUM"
                ? "bg-warning text-warning-foreground"
                : "bg-muted text-muted-foreground";

            return (
              <div
                key={c.id}
                className="px-5 py-4 border-b last:border-b-0 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 min-w-0 flex-1">
                    <Badge className={`text-[9px] shrink-0 ${priorityColor}`}>{priority}</Badge>
                    <div className="min-w-0">
                      <span className="text-sm font-semibold">{isNb ? c.label : c.labelEn}</span>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {isNb ? c.recommendation : c.recommendationEn}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-wrap text-[11px]">
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
                    <Badge variant="outline" className="text-[9px] gap-1 text-primary border-primary/30">
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
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
