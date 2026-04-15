import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useComplianceRequirements } from "@/hooks/useComplianceRequirements";
import { useMemo } from "react";

const STAGES = [
  { key: "foundation", label: "Foundation", min: 0 },
  { key: "implementation", label: "Implementation", min: 20 },
  { key: "operation", label: "Operation", min: 50 },
  { key: "audit", label: "Internal Audit", min: 75 },
  { key: "certification", label: "Certification", min: 90 },
];

export function ComplianceMaturityWidget() {
  const navigate = useNavigate();
  const { stats } = useComplianceRequirements({});
  const score = stats.progressPercent;

  const currentStage = useMemo(() => {
    return [...STAGES].reverse().find((s) => score >= s.min) || STAGES[0];
  }, [score]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Compliance maturity
          </CardTitle>
          <Badge variant="outline" className="text-xs">{score}%</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-foreground">
              Current stage: <span className="font-semibold">{currentStage.label}</span>
            </p>
          </div>
          <Progress value={score} className="h-2.5" />
          <div className="flex justify-between mt-2">
            {STAGES.map((stage) => (
              <span
                key={stage.key}
                className={`text-[13px] ${
                  stage.key === currentStage.key
                    ? "text-primary font-semibold"
                    : "text-muted-foreground"
                }`}
              >
                {stage.label.split(" ")[0]}
              </span>
            ))}
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-primary hover:text-primary/80"
          onClick={() => navigate("/tasks?view=iso-readiness")}
        >
          View maturity model <ArrowRight className="h-3.5 w-3.5 ml-1" />
        </Button>
      </CardContent>
    </Card>
  );
}
