import { useEffect, useState, KeyboardEvent } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, ChevronLeft, ChevronRight, Loader2, Check, X, Plus } from "lucide-react";
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
  onComplete: (suggestions: PartnerService[], answers: WizardAnswers) => void;
  onSkip?: () => void;
  initialAnswers?: WizardAnswers | null;
  /** When provided, dialog runs in "profile" mode: show all questions on one page and just save. */
  onSaveProfile?: (answers: WizardAnswers) => void;
}


const EMPTY: WizardAnswers = {
  markets: [],
  segments: [],
  domains: [],
  models: [],
  maturity: [],
};

export function MSPLaraServiceWizard({ open, onOpenChange, onComplete, onSkip, initialAnswers, onSaveProfile }: Props) {
  const profileMode = !!onSaveProfile && !!initialAnswers;
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<WizardAnswers>(initialAnswers ?? EMPTY);
  const [freeText, setFreeText] = useState<Record<string, string>>({});
  const [generating, setGenerating] = useState(false);


  // Forhåndsutfyll svar hver gang wizarden åpnes på nytt.
  useEffect(() => {
    if (open) {
      setAnswers(initialAnswers ?? EMPTY);
      setStep(0);
      setFreeText("");
      setGenerating(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const q = WIZARD_QUESTIONS[step];
  const isLast = step === WIZARD_QUESTIONS.length - 1;
  const currentValues = answers[q.id];
  const hasAnswer = currentValues.length > 0;
  const canProceed = hasAnswer || q.optional;

  const reset = () => {
    setStep(0);
    setAnswers(EMPTY);
    setFreeText("");
    setGenerating(false);
  };

  const close = () => {
    onOpenChange(false);
    setTimeout(reset, 200);
  };

  const toggleOption = (id: string) => {
    setAnswers((prev) => {
      const arr = prev[q.id];
      const next = arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id];
      return { ...prev, [q.id]: next };
    });
  };

  const selectAll = () => {
    setAnswers((prev) => ({ ...prev, [q.id]: q.options.map((o) => o.id) }));
  };

  const clearAll = () => {
    setAnswers((prev) => ({ ...prev, [q.id]: [] }));
    if (q.allowFreeText) setFreeText("");
  };

  const addFreeText = () => {
    const v = freeText.trim();
    if (!v) return;
    setAnswers((prev) => {
      if (prev[q.id].includes(v)) return prev;
      return { ...prev, [q.id]: [...prev[q.id], v] };
    });
    setFreeText("");
  };

  const handleFreeTextKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addFreeText();
    }
  };

  const isSelected = (id: string) => currentValues.includes(id);

  const knownIds = new Set(q.options.map((o) => o.id));
  const customValues = currentValues.filter((v) => !knownIds.has(v));

  const allSelected = q.options.every((o) => currentValues.includes(o.id));

  const handleNext = async () => {
    if (!isLast) {
      setStep((s) => s + 1);
      return;
    }
    setGenerating(true);
    await new Promise((r) => setTimeout(r, 900));
    const suggestions = suggestServices(answers);
    setGenerating(false);
    onComplete(suggestions, answers);
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
                {q.optional && <span className="ml-1 normal-case text-muted-foreground/70">· valgfritt</span>}
              </p>
              <p className="text-base font-semibold text-foreground">{q.title}</p>
              <p className="text-[13px] text-muted-foreground">{q.subtitle}</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={allSelected ? clearAll : selectAll}
                className="text-xs font-medium text-primary hover:underline"
              >
                {allSelected ? "Fjern alle" : "Velg alle"}
              </button>
              {currentValues.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  · {currentValues.length} valgt
                </span>
              )}
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
              {customValues.map((v) => (
                <button
                  key={v}
                  onClick={() => toggleOption(v)}
                  className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] bg-primary text-primary-foreground border-primary"
                >
                  <Check className="h-3 w-3" />
                  {v}
                  <X className="h-3 w-3 opacity-70" />
                </button>
              ))}
            </div>

            {q.allowFreeText && (
              <div className="flex items-center gap-2">
                <Input
                  value={freeText}
                  onChange={(e) => setFreeText(e.target.value)}
                  onKeyDown={handleFreeTextKey}
                  placeholder={q.freeTextPlaceholder ?? "Legg til eget"}
                  className="h-9 text-sm"
                />
                <Button type="button" size="sm" variant="outline" onClick={addFreeText} disabled={!freeText.trim()} className="gap-1">
                  <Plus className="h-3.5 w-3.5" />
                  Legg til
                </Button>
              </div>
            )}

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
                <Button size="sm" onClick={handleNext} disabled={!canProceed} className="gap-1">
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
