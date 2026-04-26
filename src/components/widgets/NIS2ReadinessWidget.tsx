import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Shield, ArrowRight, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { nis2Requirements, computeNIS2Summary, type NIS2AssessmentMap } from "@/lib/nis2Requirements";

export function NIS2ReadinessWidget() {
  const [devices, setDevices] = useState<{ id: string; hasAssessment: boolean; percent: number }[]>([]);
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
            return { id: d.id, percent: summary.percent, hasAssessment };
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
    if (error) toast.error("Upload failed: " + error.message);
    else toast.success(`"${file.name}" uploaded as NIS2 report`);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          Loading NIS2 readiness…
        </CardContent>
      </Card>
    );
  }

  if (devices.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            NIS2 readiness
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            {assessed.length}/{devices.length} evaluated
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 rounded-lg bg-status-closed/10">
            <div className="text-2xl font-bold text-status-closed dark:text-status-closed">{assessed.length}</div>
            <div className="text-xs text-muted-foreground">Evaluated</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-warning/10">
            <div className="text-2xl font-bold text-warning dark:text-warning">{notAssessed.length}</div>
            <div className="text-xs text-muted-foreground">Missing</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-primary/10">
            <div className="text-2xl font-bold text-primary">{avgPercent}%</div>
            <div className="text-xs text-muted-foreground">Readiness</div>
          </div>
        </div>

        <div>
          <Progress value={avgPercent} className="h-2" />
        </div>

        <div className="flex gap-2">
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
            className="flex-1 text-xs gap-1.5"
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
          >
            <Upload className="h-3.5 w-3.5" />
            {uploading ? "Uploading…" : "Upload report"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-primary text-xs"
            onClick={() => navigate("/tasks?view=iso-readiness")}
          >
            Details <ArrowRight className="h-3.5 w-3.5 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
