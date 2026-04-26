import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  MSP_ASSESSMENT_QUESTIONS,
  ASSESSMENT_CATEGORIES,
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
  { value: "yes", label: "Ja", icon: CheckCircle2, color: "border-status-closed bg-status-closed/10 text-status-closed dark:text-status-closed" },
  { value: "no", label: "Nei", icon: XCircle, color: "border-destructive bg-destructive/10 text-destructive dark:text-destructive" },
  { value: "unsure", label: "Usikker", icon: HelpCircle, color: "border-warning bg-warning/10 text-warning dark:text-warning" },
];

const categoryOrder: Array<keyof typeof ASSESSMENT_CATEGORIES> = [
  "governance",
  "operations",
  "privacy",
  "thirdparty",
];

export function MSPAssessmentStep({ responses, onChange }: MSPAssessmentStepProps) {
  const answered = responses.filter((r) => r.answer).length;

  const getResponse = (key: string) => responses.find((r) => r.question_key === key);

  const setAnswer = (key: string, answer: AssessmentAnswer) => {
    const existing = responses.filter((r) => r.question_key !== key);
    onChange([...existing, { question_key: key, answer }]);
  };

  const questionsByCategory = categoryOrder.map((cat) => ({
    category: cat,
    ...ASSESSMENT_CATEGORIES[cat],
    questions: MSP_ASSESSMENT_QUESTIONS.filter((q) => q.category === cat),
  }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Still disse spørsmålene til kunden for å kartlegge compliance-status
        </p>
        <Badge variant="outline" className="text-sm">
          {answered}/{MSP_ASSESSMENT_QUESTIONS.length}
        </Badge>
      </div>

      {questionsByCategory.map(({ category, label, questions }) => (
        <div key={category} className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide pt-1">
            {label}
          </p>
          {questions.map((q) => {
            const current = getResponse(q.key);
            return (
              <div
                key={q.key}
                className="rounded-lg border border-border p-3 space-y-2"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">{q.question_no}</p>
                  {q.iso_reference && (
                    <p className="text-[13px] text-muted-foreground mt-0.5">{q.iso_reference}</p>
                  )}
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
                          "flex-1 gap-1.5 transition-all text-sm",
                          isSelected && opt.color
                        )}
                        onClick={() => setAnswer(q.key, opt.value)}
                      >
                        <Icon className="h-4 w-4" />
                        {opt.label}
                      </Button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
