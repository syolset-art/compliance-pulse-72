import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import {
  AlertTriangle,
  CheckCircle2,
  Shield,
  Lock,
  Brain,
  Scale,
} from "lucide-react";
import {
  type AssessmentResponse,
  calculateAssessmentScore,
  getAssessmentGaps,
  getRecommendedFrameworks,
  ASSESSMENT_CATEGORIES,
} from "@/lib/mspAssessmentQuestions";
import { frameworks as allFrameworks } from "@/lib/frameworkDefinitions";
import { cn } from "@/lib/utils";

interface MSPGapAnalysisStepProps {
  responses: AssessmentResponse[];
  industry?: string | null;
  selectedFrameworks: string[];
  onFrameworksChange: (frameworks: string[]) => void;
}

export function MSPGapAnalysisStep({
  responses,
  industry,
  selectedFrameworks,
  onFrameworksChange,
}: MSPGapAnalysisStepProps) {
  const score = calculateAssessmentScore(responses);
  const gaps = getAssessmentGaps(responses);
  const recommended = useMemo(
    () => getRecommendedFrameworks(responses, industry),
    [responses, industry]
  );

  const gapsByCategory = useMemo(() => {
    const map: Record<string, typeof gaps> = {};
    for (const g of gaps) {
      if (!map[g.category]) map[g.category] = [];
      map[g.category].push(g);
    }
    return map;
  }, [gaps]);

  const toggleFramework = (id: string) => {
    if (selectedFrameworks.includes(id)) {
      onFrameworksChange(selectedFrameworks.filter((f) => f !== id));
    } else {
      onFrameworksChange([...selectedFrameworks, id]);
    }
  };

  const getScoreColor = () => {
    if (score >= 70) return "text-status-closed";
    if (score >= 40) return "text-warning";
    return "text-destructive";
  };

  const getProgressColor = () => {
    if (score >= 70) return "bg-status-closed";
    if (score >= 40) return "bg-warning";
    return "bg-destructive";
  };

  return (
    <div className="space-y-5">
      {/* Score summary */}
      <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-base font-semibold text-foreground">
            Compliance-score
          </p>
          <span className={cn("text-2xl font-bold", getScoreColor())}>
            {score}%
          </span>
        </div>
        <div className="relative h-2.5 rounded-full bg-muted overflow-hidden">
          <div
            className={cn("h-full rounded-full transition-all", getProgressColor())}
            style={{ width: `${score}%` }}
          />
        </div>
        <p className="text-sm text-muted-foreground">
          {gaps.length === 0
            ? "Ingen gap identifisert – god etterlevelse!"
            : `${gaps.length} gap identifisert som bør adresseres`}
        </p>
      </div>

      {/* Gaps by category */}
      {gaps.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-foreground">
            Identifiserte gap
          </p>
          {Object.entries(gapsByCategory).map(([cat, items]) => (
            <div key={cat} className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {ASSESSMENT_CATEGORIES[cat as keyof typeof ASSESSMENT_CATEGORIES]?.label || cat}
              </p>
              {items.map((g) => (
                <div
                  key={g.key}
                  className="flex items-start gap-2 rounded-md border border-destructive/20 bg-destructive/5 p-2.5"
                >
                  <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm text-foreground">{g.question_no}</p>
                    {g.iso_reference && (
                      <p className="text-xs text-muted-foreground">
                        {g.iso_reference}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Recommended frameworks */}
      <div className="space-y-3">
        <p className="text-sm font-semibold text-foreground">
          Anbefalte regelverk
        </p>
        <p className="text-xs text-muted-foreground">
          Basert på svarene og bransje ({industry || "ukjent"}). Du kan
          justere før kunden opprettes.
        </p>
        <div className="space-y-2">
          {allFrameworks
            .filter((f) => recommended.includes(f.id))
            .map((fw) => {
              const isSelected = selectedFrameworks.includes(fw.id);
              return (
                <div
                  key={fw.id}
                  className={cn(
                    "flex items-center justify-between rounded-lg border p-3 transition-colors",
                    isSelected
                      ? "border-primary/40 bg-primary/5"
                      : "border-border"
                  )}
                >
                  <div className="flex-1 min-w-0 mr-3">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground">
                        {fw.name}
                      </p>
                      {fw.isMandatory && (
                        <Badge
                          variant="outline"
                          className="text-[13px] border-status-closed/40 text-status-closed dark:text-status-closed"
                        >
                          Obligatorisk
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {fw.description}
                    </p>
                  </div>
                  <Switch
                    checked={isSelected}
                    onCheckedChange={() => toggleFramework(fw.id)}
                    disabled={fw.isMandatory}
                  />
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
