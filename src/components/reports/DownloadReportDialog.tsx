import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Download, Loader2, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { generateFullComplianceReport } from "./generateFullComplianceReport";
import { supabase } from "@/integrations/supabase/client";

export interface PillarData {
  name: string;
  score: number;
  level: string;
  measures: number;
}

export interface ImprovementData {
  title: string;
  pillar: string;
  severity: string;
  framework: string;
}

export interface MeasureData {
  title: string;
  pillar: string;
  status: string;
}

export interface FrameworkScoreData {
  id: string;
  name: string;
  score: number;
  level: string;
  fulfilled: number;
  total: number;
}

export interface ReportData {
  overallScore: number;
  pillars: PillarData[];
  improvements: ImprovementData[];
  measures: MeasureData[];
  frameworks: FrameworkScoreData[];
}

interface DownloadReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reportName: string;
  reportData: ReportData;
}

export const DownloadReportDialog = ({
  open,
  onOpenChange,
  reportName,
  reportData,
}: DownloadReportDialogProps) => {
  const { toast } = useToast();
  const [includeRequirements, setIncludeRequirements] = useState(false);
  const [includeEvaluators, setIncludeEvaluators] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [done, setDone] = useState(false);
  const [companyName, setCompanyName] = useState("");

  useEffect(() => {
    supabase.from("company_profile").select("name").limit(1).maybeSingle()
      .then(({ data }) => { if (data?.name) setCompanyName(data.name); });
  }, []);

  const handleDownload = async () => {
    setGenerating(true);
    try {
      await new Promise((r) => setTimeout(r, 100));
      generateFullComplianceReport(reportData, { includeRequirements, includeEvaluators }, companyName);
      setDone(true);
      toast({ title: "PDF generert", description: "Rapporten er lastet ned." });
      setTimeout(() => {
        setDone(false);
        onOpenChange(false);
      }, 1200);
    } catch {
      toast({ title: "Feil", description: "Kunne ikke generere PDF.", variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Last ned rapport</DialogTitle>
          <DialogDescription>
            Generer en samlet PDF-rapport for{" "}
            <span className="font-medium text-foreground">{reportName}</span>.
            Velg hva som skal inkluderes.
          </DialogDescription>
        </DialogHeader>

        {done ? (
          <div className="flex flex-col items-center py-8 gap-3">
            <CheckCircle2 className="h-12 w-12 text-emerald-500" />
            <p className="font-medium text-foreground">PDF generert!</p>
          </div>
        ) : (
          <div className="space-y-5 py-2">
            <div className="rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground">
              Rapporten inkluderer alltid modenhetsoversikt, forbedringspunkter og målepunkter.
              <br />
              <span className="font-medium text-foreground">{reportData.frameworks.length} regelverk</span> er aktive.
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="include-requirements"
                  checked={includeRequirements}
                  onCheckedChange={(v) => setIncludeRequirements(!!v)}
                  disabled={generating}
                />
                <div className="space-y-0.5">
                  <Label htmlFor="include-requirements" className="text-sm font-medium">
                    Inkluder alle krav per regelverk
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Legger til detaljerte kravtabeller for hvert regelverk i rapporten.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Checkbox
                  id="include-evaluators"
                  checked={includeEvaluators}
                  onCheckedChange={(v) => setIncludeEvaluators(!!v)}
                  disabled={generating}
                />
                <div className="space-y-0.5">
                  <Label htmlFor="include-evaluators" className="text-sm font-medium">
                    Inkluder evaluatorer og vurderinger
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Viser hvem som har vurdert hvert krav og eventuelle kommentarer.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {!done && (
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={generating}>
              Avbryt
            </Button>
            <Button onClick={handleDownload} disabled={generating} className="gap-2">
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Genererer...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Last ned PDF
                </>
              )}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};
