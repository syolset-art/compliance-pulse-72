import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { CheckCircle2, Circle, HelpCircle } from "lucide-react";
import { toast } from "sonner";
import { getQuestionnaire } from "@/lib/questionnaireRegistry";
import {
  useQuestionnaireDeliveries,
  type QuestionnaireDelivery,
  type AnswerValue,
} from "@/hooks/useQuestionnaireDeliveries";

interface Props {
  delivery: QuestionnaireDelivery | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ANSWER_OPTIONS: Array<{ value: AnswerValue; label: string; icon: typeof CheckCircle2; cls: string }> = [
  { value: "yes", label: "Ja", icon: CheckCircle2, cls: "text-success border-success/40 bg-success/5 hover:bg-success/10" },
  { value: "no", label: "Nei", icon: Circle, cls: "text-destructive border-destructive/40 bg-destructive/5 hover:bg-destructive/10" },
  { value: "unsure", label: "Usikker", icon: HelpCircle, cls: "text-muted-foreground border-border bg-muted/30 hover:bg-muted/60" },
];

export function AnswerQuestionnaireDialog({ delivery, open, onOpenChange }: Props) {
  const { saveAnswers } = useQuestionnaireDeliveries();
  const def = delivery ? getQuestionnaire(delivery.questionnaireId) : null;
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>(() => delivery?.answers ?? {});

  // Reset when delivery changes
  useMemo(() => {
    if (delivery) setAnswers(delivery.answers ?? {});
  }, [delivery?.id]);

  if (!delivery || !def) return null;

  const answered = Object.keys(answers).length;
  const total = def.totalQuestions;
  const pct = total > 0 ? Math.round((answered / total) * 100) : 0;
  const isComplete = answered === total;

  const setAnswer = (key: string, value: AnswerValue) =>
    setAnswers((prev) => ({ ...prev, [key]: value }));

  const handleSaveDraft = () => {
    saveAnswers(delivery.id, answers, false);
    toast.success("Lagret som utkast", { description: "Du kan fortsette senere." });
    onOpenChange(false);
  };

  const handleSubmit = () => {
    saveAnswers(delivery.id, answers, true);
    toast.success("Skjema sendt", {
      description: `${delivery.partnerName} mottar svar og lager tiltaksrapport.`,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{def.title}</DialogTitle>
          <DialogDescription>
            {delivery.intro || def.intro}
          </DialogDescription>
        </DialogHeader>

        <div className="sticky top-0 z-10 -mx-6 px-6 py-2 bg-background/95 backdrop-blur border-b">
          <div className="flex items-center justify-between text-[12px]">
            <span className="text-muted-foreground">
              {answered} av {total} besvart
            </span>
            <span className="font-medium tabular-nums text-foreground">{pct}%</span>
          </div>
          <Progress value={pct} className="h-1.5 mt-1" />
        </div>

        <div className="space-y-6 py-2">
          {def.sections.map((section) => (
            <section key={section.id} className="space-y-3">
              <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {section.title}
              </h4>
              <div className="space-y-2.5">
                {section.items.map((q) => (
                  <div key={q.key} className="rounded-lg border border-border p-3 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-[13px] text-foreground leading-snug">{q.text}</p>
                      {q.reference && (
                        <Badge variant="outline" className="text-[10px] shrink-0">
                          {q.reference}
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {ANSWER_OPTIONS.map((opt) => {
                        const Icon = opt.icon;
                        const active = answers[q.key] === opt.value;
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setAnswer(q.key, opt.value)}
                            className={cn(
                              "inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md border text-[12px] transition-colors",
                              active ? opt.cls + " ring-1 ring-current" : "border-border text-muted-foreground hover:bg-muted/40",
                            )}
                          >
                            <Icon className="h-3.5 w-3.5" />
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={handleSaveDraft}>
            Lagre utkast
          </Button>
          <Button onClick={handleSubmit} disabled={!isComplete}>
            {isComplete ? "Send svar" : `Mangler ${total - answered} svar`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
