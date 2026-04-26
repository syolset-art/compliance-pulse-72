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
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

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

function ScoreCircle({ score }: { score: number }) {
  const size = 32;
  const strokeWidth = 3;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 70 ? "hsl(var(--success))" : score >= 40 ? "hsl(var(--warning))" : "hsl(var(--destructive))";

  return (
    <svg width={size} height={size} className="flex-shrink-0">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="hsl(var(--border))"
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text
        x={size / 2}
        y={size / 2}
        textAnchor="middle"
        dominantBaseline="central"
        className="fill-foreground"
        fontSize="9"
        fontWeight="600"
      >
        {score}%
      </text>
    </svg>
  );
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
  const [selectedFrameworks, setSelectedFrameworks] = useState<Set<string>>(new Set());

  useEffect(() => {
    supabase.from("company_profile").select("name").limit(1).maybeSingle()
      .then(({ data }) => { if (data?.name) setCompanyName(data.name); });
  }, []);

  // Initialize all frameworks as selected when dialog opens
  useEffect(() => {
    if (open && reportData.frameworks.length > 0) {
      setSelectedFrameworks(new Set(reportData.frameworks.map(f => f.id)));
    }
  }, [open, reportData.frameworks]);

  const toggleFramework = (id: string) => {
    setSelectedFrameworks(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedFrameworks.size === reportData.frameworks.length) {
      setSelectedFrameworks(new Set());
    } else {
      setSelectedFrameworks(new Set(reportData.frameworks.map(f => f.id)));
    }
  };

  const handleDownload = async () => {
    if (selectedFrameworks.size === 0) {
      toast({ title: "Velg minst ett regelverk", variant: "destructive" });
      return;
    }
    setGenerating(true);
    try {
      await new Promise((r) => setTimeout(r, 100));
      const filteredData: ReportData = {
        ...reportData,
        frameworks: reportData.frameworks.filter(f => selectedFrameworks.has(f.id)),
        improvements: reportData.improvements.filter(i => {
          const fw = reportData.frameworks.find(f => f.name === i.framework);
          return fw ? selectedFrameworks.has(fw.id) : true;
        }),
      };
      generateFullComplianceReport(filteredData, { includeRequirements, includeEvaluators }, companyName);
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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Last ned rapport</DialogTitle>
          <DialogDescription>
            Velg hvilke regelverk som skal inkluderes i rapporten for{" "}
            <span className="font-medium text-foreground">{reportName}</span>.
          </DialogDescription>
        </DialogHeader>

        {done ? (
          <div className="flex flex-col items-center py-8 gap-3">
            <CheckCircle2 className="h-12 w-12 text-status-closed" />
            <p className="font-medium text-foreground">PDF generert!</p>
          </div>
        ) : (
          <div className="space-y-4 py-1">
            {/* Framework selector */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-foreground">Regelverk</p>
                <button
                  type="button"
                  onClick={toggleAll}
                  className="text-xs text-primary hover:underline"
                  disabled={generating}
                >
                  {selectedFrameworks.size === reportData.frameworks.length ? "Fjern alle" : "Velg alle"}
                </button>
              </div>
              <div className="space-y-1 max-h-[280px] overflow-y-auto rounded-lg border p-1.5">
                {reportData.frameworks.map((fw) => {
                  const isSelected = selectedFrameworks.has(fw.id);
                  return (
                    <button
                      key={fw.id}
                      type="button"
                      disabled={generating}
                      onClick={() => toggleFramework(fw.id)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2 rounded-md text-left transition-colors",
                        isSelected
                          ? "bg-primary/8 border border-primary/20"
                          : "hover:bg-muted/50 border border-transparent"
                      )}
                    >
                      <Checkbox
                        checked={isSelected}
                        className="pointer-events-none"
                        tabIndex={-1}
                      />
                      <ScoreCircle score={fw.score} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{fw.name}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {fw.fulfilled}/{fw.total} krav
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] text-muted-foreground mt-1.5">
                {selectedFrameworks.size} av {reportData.frameworks.length} valgt
              </p>
            </div>

            {/* Extra options */}
            <div className="space-y-3 pt-1 border-t">
              <div className="flex items-center gap-3">
                <Checkbox
                  id="include-requirements"
                  checked={includeRequirements}
                  onCheckedChange={(v) => setIncludeRequirements(!!v)}
                  disabled={generating}
                />
                <Label htmlFor="include-requirements" className="text-sm">
                  Inkluder alle krav per regelverk
                </Label>
              </div>
              <div className="flex items-center gap-3">
                <Checkbox
                  id="include-evaluators"
                  checked={includeEvaluators}
                  onCheckedChange={(v) => setIncludeEvaluators(!!v)}
                  disabled={generating}
                />
                <Label htmlFor="include-evaluators" className="text-sm">
                  Inkluder evaluatorer og vurderinger
                </Label>
              </div>
            </div>
          </div>
        )}

        {!done && (
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={generating}>
              Avbryt
            </Button>
            <Button onClick={handleDownload} disabled={generating || selectedFrameworks.size === 0} className="gap-2">
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
