import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Shield, AlertTriangle, CheckCircle2, HelpCircle, Bot, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
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
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
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
            const summary = computeNIS2Summary(nis2Requirements, assessment, meta);
            const hasAssessment = Object.keys(assessment).length > 0 || summary.autoCheckedCount > 0;
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

  const handleUpload = async (file: File) => {
    setUploading(true);
    const path = `nis2/reports/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("documents").upload(path, file, { upsert: true });
    setUploading(false);
    if (error) {
      toast.error("Opplasting feilet: " + error.message);
    } else {
      toast.success(`"${file.name}" lastet opp som NIS2-rapport`);
    }
  };

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
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            NIS2-vurdering
          </CardTitle>
          <Badge variant="outline" className="text-xs gap-1.5">
            <Bot className="h-3.5 w-3.5" />
            {assessed.length} av {devices.length} vurdert
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 rounded-lg bg-emerald-500/10">
            <div className="text-2xl font-bold text-emerald-600">{assessed.length}</div>
            <div className="text-xs text-muted-foreground">Vurdert</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-amber-500/10">
            <div className="text-2xl font-bold text-amber-600">{notAssessed.length}</div>
            <div className="text-xs text-muted-foreground">Mangler</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-primary/10">
            <div className="text-2xl font-bold text-primary">{avgPercent}%</div>
            <div className="text-xs text-muted-foreground">Snitt</div>
          </div>
        </div>

        {/* Per-device mini list */}
        <div className="space-y-1.5">
          {devices.slice(0, 5).map((d) => (
            <button
              key={d.id}
              onClick={() => navigate(`/assets/${d.id}`)}
              className="w-full flex items-center gap-2.5 text-left p-2.5 rounded-lg hover:bg-muted/50 transition-colors"
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
              <span className="text-sm font-medium truncate flex-1">{d.name}</span>
              {d.hasAssessment ? (
                <div className="flex items-center gap-2 shrink-0">
                  <Progress value={d.percent} className="w-20 h-2" />
                  <span className="text-xs text-muted-foreground w-8 text-right">{d.percent}%</span>
                </div>
              ) : (
                <span className="text-xs text-muted-foreground">Ikke vurdert</span>
              )}
            </button>
          ))}
          {devices.length > 5 && (
            <p className="text-xs text-muted-foreground text-center pt-1">
              + {devices.length - 5} enheter til
            </p>
          )}
        </div>

        {/* Upload report */}
        <div className="pt-2 border-t">
          <input
            ref={fileRef}
            type="file"
            className="hidden"
            accept=".pdf,.docx,.xlsx,.doc,.xls"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleUpload(file);
              e.target.value = "";
            }}
          />
          <Button
            variant="outline"
            size="sm"
            className="w-full text-sm gap-2"
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
          >
            <Upload className="h-4 w-4" />
            {uploading ? "Laster opp…" : "Last opp NIS2-rapport"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
