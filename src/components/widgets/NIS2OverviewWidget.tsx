import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Shield, AlertTriangle, CheckCircle2, HelpCircle, Bot } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { nis2Requirements, computeNIS2Summary, type NIS2AssessmentMap } from "@/lib/nis2Requirements";

interface DeviceNIS2Info {
  id: string;
  name: string;
  percent: number;
  hasAssessment: boolean;
}

export function NIS2OverviewWidget() {
  const [devices, setDevices] = useState<DeviceNIS2Info[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase
        .from("assets")
        .select("id, name, metadata")
        .eq("asset_type", "hardware")
        .eq("lifecycle_status", "active");

      if (data) {
        setDevices(
          data.map((d) => {
            const meta = (d.metadata as Record<string, any>) || {};
            const assessment: NIS2AssessmentMap = meta.nis2_assessment || {};
            const hasAssessment = Object.keys(assessment).length > 0;
            const summary = computeNIS2Summary(nis2Requirements, assessment, meta);
            return { id: d.id, name: d.name, percent: summary.percent, hasAssessment };
          })
        );
      }
      setLoading(false);
    }
    fetch();
  }, []);

  const assessed = devices.filter((d) => d.hasAssessment);
  const notAssessed = devices.filter((d) => !d.hasAssessment);
  const avgPercent = assessed.length > 0
    ? Math.round(assessed.reduce((s, d) => s + d.percent, 0) / assessed.length)
    : 0;

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          Laster NIS2-oversikt…
        </CardContent>
      </Card>
    );
  }

  if (devices.length === 0) return null;

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            NIS2-vurdering
          </CardTitle>
          <Badge variant="outline" className="text-[10px] gap-1">
            <Bot className="h-3 w-3" />
            {assessed.length} av {devices.length} vurdert
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-2 rounded-lg bg-emerald-500/10">
            <div className="text-xl font-bold text-emerald-600">{assessed.length}</div>
            <div className="text-[10px] text-muted-foreground">Vurdert</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-amber-500/10">
            <div className="text-xl font-bold text-amber-600">{notAssessed.length}</div>
            <div className="text-[10px] text-muted-foreground">Mangler</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-primary/10">
            <div className="text-xl font-bold text-primary">{avgPercent}%</div>
            <div className="text-[10px] text-muted-foreground">Snitt</div>
          </div>
        </div>

        {/* Per-device mini list */}
        <div className="space-y-2">
          {devices.slice(0, 5).map((d) => (
            <button
              key={d.id}
              onClick={() => navigate(`/assets/${d.id}`)}
              className="w-full flex items-center gap-2 text-left p-2 rounded-lg hover:bg-muted/50 transition-colors"
            >
              {d.hasAssessment ? (
                d.percent >= 70 ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                )
              ) : (
                <HelpCircle className="h-4 w-4 text-muted-foreground shrink-0" />
              )}
              <span className="text-xs font-medium truncate flex-1">{d.name}</span>
              {d.hasAssessment ? (
                <div className="flex items-center gap-2 shrink-0">
                  <Progress value={d.percent} className="w-16 h-1.5" />
                  <span className="text-[10px] text-muted-foreground w-7 text-right">{d.percent}%</span>
                </div>
              ) : (
                <span className="text-[10px] text-muted-foreground">Ikke vurdert</span>
              )}
            </button>
          ))}
          {devices.length > 5 && (
            <p className="text-[10px] text-muted-foreground text-center">
              + {devices.length - 5} enheter til
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
