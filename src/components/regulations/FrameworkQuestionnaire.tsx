import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  CheckCircle2,
  XCircle,
  CircleAlert,
  HelpCircle,
  MinusCircle,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  FileBarChart,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type {
  FrameworkQuestionnaireDefinition,
  GapAnswer,
} from "@/lib/frameworkQuestionnaires";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Props {
  definition: FrameworkQuestionnaireDefinition;
  answers: Record<string, GapAnswer>;
  comments: Record<string, string>;
  onAnswer: (id: string, a: GapAnswer) => void;
  onComment: (id: string, c: string) => void;
  onComplete: () => void;
  onReset: () => void;
  onShowReport: () => void;
}

const OPTIONS: Array<{ value: GapAnswer; label: string; icon: typeof CheckCircle2; cls: string }> = [
  { value: "yes", label: "Ja", icon: CheckCircle2, cls: "border-success/50 text-success bg-success/5 hover:bg-success/10" },
  { value: "partial", label: "Delvis", icon: CircleAlert, cls: "border-warning/50 text-warning bg-warning/5 hover:bg-warning/10" },
  { value: "no", label: "Nei", icon: XCircle, cls: "border-destructive/50 text-destructive bg-destructive/5 hover:bg-destructive/10" },
  { value: "unsure", label: "Vet ikke", icon: HelpCircle, cls: "border-border text-muted-foreground hover:bg-muted/40" },
  { value: "n_a", label: "Ikke aktuelt", icon: MinusCircle, cls: "border-border text-muted-foreground hover:bg-muted/40" },
];

export function FrameworkQuestionnaire({
  definition,
  answers,
  comments,
  onAnswer,
  onComment,
  onComplete,
  onReset,
  onShowReport,
}: Props) {
  // Flatten questions with section info for linear navigation.
  const flat = useMemo(() => {
    return definition.sections.flatMap((s) =>
      s.questions.map((q) => ({ sectionId: s.id, sectionTitle: s.title, question: q })),
    );
  }, [definition]);

  const [index, setIndex] = useState(0);
  const [showComment, setShowComment] = useState(false);

  const current = flat[index];
  const total = flat.length;
  const answeredCount = flat.filter((f) => answers[f.question.id]).length;
  const pct = total > 0 ? Math.round(((index + 1) / total) * 100) : 0;
  const isLast = index === total - 1;
  const allAnswered = answeredCount === total;

  if (!current) {
    return (
      <div className="rounded-lg border border-border p-8 text-center text-muted-foreground">
        Ingen spørsmål tilgjengelig.
      </div>
    );
  }

  const currentAnswer = answers[current.question.id];

  const goNext = () => {
    if (isLast) {
      if (allAnswered) {
        onComplete();
        onShowReport();
      } else {
        toast.info(`Du har ${total - answeredCount} ubesvart`, {
          description: "Du kan likevel se gap-rapporten — den oppdateres når du svarer mer.",
        });
        onShowReport();
      }
    } else {
      setIndex((i) => Math.min(total - 1, i + 1));
      setShowComment(false);
    }
  };

  const goPrev = () => {
    setIndex((i) => Math.max(0, i - 1));
    setShowComment(false);
  };

  const handleAnswer = (a: GapAnswer) => {
    onAnswer(current.question.id, a);
    // Auto-advance after a tiny delay so the user sees the selection.
    if (!isLast) {
      setTimeout(() => {
        setIndex((i) => Math.min(total - 1, i + 1));
        setShowComment(false);
      }, 180);
    }
  };

  return (
    <TooltipProvider delayDuration={200}>
      <div className="space-y-6">
        {/* Top bar */}
        <div>
          <div className="flex items-center justify-between mb-2 text-sm">
            <span className="text-muted-foreground">
              Spørsmål {index + 1} av {total} · <span className="font-medium text-foreground">{current.sectionTitle}</span>
            </span>
            <span className="tabular-nums text-muted-foreground">
              {answeredCount}/{total} besvart
            </span>
          </div>
          <Progress value={pct} className="h-1.5" />
        </div>

        {/* Question card */}
        <div className="rounded-xl border border-border bg-card p-6 space-y-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-lg font-semibold text-foreground leading-snug flex-1">
              {current.question.text}
            </h3>
            {current.question.reference && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline" className="gap-1 shrink-0 cursor-help">
                    <Info className="h-3 w-3" />
                    {current.question.reference}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-xs">
                  Referanse: {current.question.reference}
                  {current.question.suggestedAction && (
                    <div className="mt-1 text-xs opacity-80">
                      Anbefalt tiltak ved gap: {current.question.suggestedAction}
                    </div>
                  )}
                </TooltipContent>
              </Tooltip>
            )}
          </div>

          {/* Answer buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const active = currentAnswer === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleAnswer(opt.value)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-lg border-2 px-3 py-3 text-sm font-medium transition-all",
                    active ? opt.cls + " ring-2 ring-current/30" : "border-border bg-background hover:bg-muted/30 text-foreground",
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {opt.label}
                </button>
              );
            })}
          </div>

          {/* Comment toggle */}
          <div>
            {!showComment && !comments[current.question.id] ? (
              <button
                type="button"
                onClick={() => setShowComment(true)}
                className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
              >
                Legg til kommentar (valgfritt)
              </button>
            ) : (
              <Textarea
                value={comments[current.question.id] || ""}
                onChange={(e) => onComment(current.question.id, e.target.value)}
                placeholder="Eventuelle merknader, kontekst eller dokumentreferanser…"
                className="text-sm"
                rows={2}
              />
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={goPrev} disabled={index === 0} className="gap-1">
            <ChevronLeft className="h-4 w-4" />
            Forrige
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onReset} className="gap-1 text-muted-foreground">
              <RotateCcw className="h-3.5 w-3.5" />
              Start på nytt
            </Button>
            {answeredCount > 0 && (
              <Button variant="outline" size="sm" onClick={onShowReport} className="gap-1">
                <FileBarChart className="h-3.5 w-3.5" />
                Se gap-rapport
              </Button>
            )}
            <Button onClick={goNext} className="gap-1">
              {isLast ? "Fullfør" : "Neste"}
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
