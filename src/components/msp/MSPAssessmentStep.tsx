import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  MSP_ASSESSMENT_QUESTIONS,
  type AssessmentAnswer,
  type AssessmentResponse,
} from "@/lib/mspAssessmentQuestions";
import { CheckCircle2, XCircle, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface MSPAssessmentStepProps {
  responses: AssessmentResponse[];
  onChange: (responses: AssessmentResponse[]) => void;
}

const ANSWER_OPTIONS: { value: AssessmentAnswer; label: string; icon: React.ElementType; color: string }[] = [
  { value: "yes", label: "Ja", icon: CheckCircle2, color: "border-green-500 bg-green-500/10 text-green-700 dark:text-green-400" },
  { value: "no", label: "Nei", icon: XCircle, color: "border-red-500 bg-red-500/10 text-red-700 dark:text-red-400" },
  { value: "unsure", label: "Usikker", icon: HelpCircle, color: "border-yellow-500 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400" },
];

export function MSPAssessmentStep({ responses, onChange }: MSPAssessmentStepProps) {
  const answered = responses.filter((r) => r.answer).length;

  const getResponse = (key: string) => responses.find((r) => r.question_key === key);

  const setAnswer = (key: string, answer: AssessmentAnswer) => {
    const existing = responses.filter((r) => r.question_key !== key);
    onChange([...existing, { question_key: key, answer }]);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Compliance-kartlegging – still disse spørsmålene til kunden
        </p>
        <Badge variant="outline">
          {answered}/{MSP_ASSESSMENT_QUESTIONS.length} besvart
        </Badge>
      </div>

      <div className="space-y-3">
        {MSP_ASSESSMENT_QUESTIONS.map((q) => {
          const current = getResponse(q.key);
          return (
            <div
              key={q.key}
              className="rounded-lg border border-border p-3 space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{q.question_no}</p>
                  {q.iso_reference && (
                    <p className="text-[10px] text-muted-foreground mt-0.5">{q.iso_reference}</p>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                {ANSWER_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  const isSelected = current?.answer === opt.value;
                  return (
                    <Button
                      key={opt.value}
                      type="button"
                      variant="outline"
                      size="sm"
                      className={cn(
                        "flex-1 gap-1.5 transition-all",
                        isSelected && opt.color
                      )}
                      onClick={() => setAnswer(q.key, opt.value)}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {opt.label}
                    </Button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
