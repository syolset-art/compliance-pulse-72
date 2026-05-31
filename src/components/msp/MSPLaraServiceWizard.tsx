import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, ChevronLeft, ChevronRight, Loader2, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  WIZARD_QUESTIONS,
  suggestServices,
  type WizardAnswers,
  type PartnerService,
} from "@/lib/serviceCatalog";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: (suggestions: PartnerService[]) => void;
  onSkip?: () => void;
}

const EMPTY: WizardAnswers = { segments: [], domains: [], model: "", maturity: "" };

export function MSPLaraServiceWizard({ open, onOpenChange, onComplete, onSkip }: Props) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<WizardAnswers>(EMPTY);
  const [generating, setGenerating] = useState(false);

  const q = WIZARD_QUESTIONS[step];
  const isLast = step === WIZARD_QUESTIONS.length - 1;
  const currentValue = answers[q.id];
  const hasAnswer = q.multi
    ? (currentValue as string[]).length > 0
    : Boolean(currentValue);

  const reset = () => {
    setStep(0);
    setAnswers(EMPTY);
    setGenerating(false);
  };

  const close = () => {
    onOpenChange(false);
    setTimeout(reset, 200);
  };

  const toggleOption = (id: string) => {
    setAnswers((prev) => {
      if (q.multi) {
        const arr = prev[q.id] as string[];
        const next = arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id];
        return { ...prev, [q.id]: next };
      }
      return { ...prev, [q.id]: id };
    });
  };

  const isSelected = (id: string) => {
    if (q.multi) return (currentValue as string[]).includes(id);
    return currentValue === id;
  };

  const handleNext = async () => {
    if (!isLast) {
      setStep((s) => s + 1);
      return;
    }
    setGenerating(true);
    // Liten kunstig delay så Lara føles "smart"
    await new Promise((r) => setTimeout(r, 900));
    const suggestions = suggestServices(answers);
    setGenerating(false);
    onComplete(suggestions);
    close();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? onOpenChange(true) : close())}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <span className="h-7 w-7 rounded-full bg-primary/15 flex items-center justify-center">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
            </span>
            Lara setter opp tjenestekatalogen din
          </DialogTitle>
        </DialogHeader>

        {generating ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Lara skreddersyr forslag …</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Progress */}
            <div className="flex items-center gap-1.5">
              {WIZARD_QUESTIONS.map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "h-1 flex-1 rounded-full transition-colors",
                    i <= step ? "bg-primary" : "bg-muted",
                  )}
                />
              ))}
            </div>

            <div className="space-y-1">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Steg {step + 1} av {WIZARD_QUESTIONS.length}
              </p>
              <p className="text-base font-semibold text-foreground">{q.title}</p>
              <p className="text-[13px] text-muted-foreground">{q.subtitle}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              {q.options.map((opt) => {
                const selected = isSelected(opt.id);
                return (
                  <button
                    key={opt.id}
                    onClick={() => toggleOption(opt.id)}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] transition-colors",
                      selected
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background text-foreground border-border hover:border-primary/40",
                    )}
                  >
                    {selected && <Check className="h-3 w-3" />}
                    {opt.label}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => (step === 0 ? close() : setStep((s) => s - 1))}
                className="gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
                {step === 0 ? "Avbryt" : "Tilbake"}
              </Button>

              <div className="flex items-center gap-2">
                {onSkip && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      onSkip();
                      close();
                    }}
                  >
                    Hopp over
                  </Button>
                )}
                <Button size="sm" onClick={handleNext} disabled={!hasAnswer} className="gap-1">
                  {isLast ? "Vis forslag" : "Neste"}
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
