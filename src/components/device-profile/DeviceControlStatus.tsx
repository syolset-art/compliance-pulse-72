import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, XCircle, AlertTriangle, Shield } from "lucide-react";
import { type DeviceControl } from "./DeviceTrustProfile";

interface DeviceControlStatusProps {
  controls: DeviceControl[];
}

export function DeviceControlStatus({ controls }: DeviceControlStatusProps) {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";

  const passControls = controls.filter(c => c.status === "pass");
  const warnControls = controls.filter(c => c.status === "warn");
  const failControls = controls.filter(c => c.status === "fail");
  const score = Math.round(((passControls.length + warnControls.length * 0.5) / controls.length) * 100);

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
              <span className="text-muted-foreground">{isNb ? "Mangler" : "Missing"}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <span className="font-medium text-warning">{warnControls.length}</span>
              <span className="text-muted-foreground">{isNb ? "Delvis" : "Partial"}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <span className="font-medium text-success">{passControls.length}</span>
              <span className="text-muted-foreground">OK</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Failed controls */}
      {failControls.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-destructive">
              <XCircle className="h-4 w-4" />
              {isNb ? "Mangler" : "Missing"} ({failControls.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 p-0">
            {failControls.map(c => (
              <div key={c.id} className="flex items-center justify-between px-5 py-2.5 border-b last:border-b-0">
                <div className="flex items-center gap-2 min-w-0">
                  <XCircle className="h-4 w-4 text-destructive shrink-0" />
                  <span className="text-sm font-medium">{isNb ? c.label : c.labelEn}</span>
                </div>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-mono shrink-0">
                  {c.isoRef}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Partial controls */}
      {warnControls.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-warning">
              <AlertTriangle className="h-4 w-4" />
              {isNb ? "Delvis" : "Partial"} ({warnControls.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 p-0">
            {warnControls.map(c => (
              <div key={c.id} className="flex items-center justify-between px-5 py-2.5 border-b last:border-b-0">
                <div className="flex items-center gap-2 min-w-0">
                  <AlertTriangle className="h-4 w-4 text-warning shrink-0" />
                  <span className="text-sm font-medium">{isNb ? c.label : c.labelEn}</span>
                </div>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-mono shrink-0">
                  {c.isoRef}
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
            OK ({passControls.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 p-0">
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
      </Card>
    </div>
  );
}
