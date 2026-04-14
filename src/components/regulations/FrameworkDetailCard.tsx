import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { FileText, Bot, Users, CheckCircle2, CircleAlert, Circle, Share2, Loader2 } from "lucide-react";
import { getCategoryById, type Framework } from "@/lib/frameworkDefinitions";
import { exportCompliancePdf } from "./ExportCompliancePdf";
import { ShareReportDialog } from "./ShareReportDialog";
import { supabase } from "@/integrations/supabase/client";

interface FrameworkDetailCardProps {
  framework: Framework;
  counts: {
    met: number;
    partial: number;
    notMet: number;
    auto: number;
    manual: number;
    total: number;
  };
}

export const FrameworkDetailCard = ({ framework, counts }: FrameworkDetailCardProps) => {
  const category = getCategoryById(framework.category);
  const CategoryIcon = category?.icon;
  const pct = counts.total > 0 ? Math.round((counts.met / counts.total) * 100) : 0;
  const [exporting, setExporting] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [companyName, setCompanyName] = useState<string>("");

  useEffect(() => {
    supabase.from("company_profile").select("name").limit(1).maybeSingle()
      .then(({ data }) => { if (data?.name) setCompanyName(data.name); });
  }, []);

  const handleExport = async () => {
    setExporting(true);
    try {
      exportCompliancePdf(framework, counts, companyName);
    } finally {
      setTimeout(() => setExporting(false), 600);
    }
  };

  return (
    <>
      <Card>
        <CardContent className="p-5">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              {CategoryIcon && (
                <div className={`p-2.5 rounded-xl shrink-0 ${category?.bgColor}`}>
                  <CategoryIcon className={`h-5 w-5 ${category?.color}`} />
                </div>
              )}
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-foreground">{framework.name}</h2>
                <p className="text-sm text-muted-foreground mt-0.5">{framework.description}</p>
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button variant="outline" size="sm" className="gap-2" onClick={() => setShowShare(true)}>
                <Share2 className="h-4 w-4" />
                Del
              </Button>
              <Button variant="outline" size="sm" className="gap-2" onClick={handleExport} disabled={exporting}>
                {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                Eksporter PDF
              </Button>
            </div>
          </div>

          {/* Summary */}
          <div className="mt-4 bg-muted/40 rounded-xl p-4 border border-border/50">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Sammendrag</span>
            <div className="grid grid-cols-2 gap-4 mt-3">
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">Samlet samsvar</span>
                <span className={`text-3xl font-bold ${pct >= 67 ? "text-emerald-600 dark:text-emerald-400" : pct >= 34 ? "text-amber-600 dark:text-amber-400" : "text-destructive"}`}>
                  {pct}%
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">Krav oppfylt</span>
                <span className="text-3xl font-bold text-foreground">
                  {counts.met} <span className="text-lg text-muted-foreground font-normal">/ {counts.total}</span>
                </span>
              </div>
            </div>
            <Progress value={pct} className="h-2 mt-3" />
          </div>

          {/* Status row */}
          <div className="flex flex-wrap gap-3 mt-4">
            <div className="flex items-center gap-1.5 text-xs">
              <Circle className="h-3.5 w-3.5 text-destructive/60" />
              <span className="text-muted-foreground">Ikke oppfylt</span>
              <span className="font-semibold text-foreground">{counts.notMet}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <CircleAlert className="h-3.5 w-3.5 text-amber-500" />
              <span className="text-muted-foreground">Delvis</span>
              <span className="font-semibold text-foreground">{counts.partial}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              <span className="text-muted-foreground">Oppfylt</span>
              <span className="font-semibold text-foreground">{counts.met}</span>
            </div>
            <div className="border-l border-border pl-3 flex items-center gap-1.5 text-xs">
              <Bot className="h-3.5 w-3.5 text-emerald-500" />
              <span className="text-muted-foreground">Automatisk</span>
              <span className="font-semibold text-foreground">{counts.auto}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <Users className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">Manuell</span>
              <span className="font-semibold text-foreground">{counts.manual}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <ShareReportDialog
        open={showShare}
        onOpenChange={setShowShare}
        frameworkName={framework.name}
        frameworkId={framework.id}
      />
    </>
  );
};
