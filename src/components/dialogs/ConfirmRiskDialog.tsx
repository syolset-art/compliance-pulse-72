import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Sparkles, ShieldCheck, ArrowRight, ArrowLeft, Check, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ConfirmRiskScenario {
  id: string;
  title: string;
  description?: string | null;
  risk_level: string;
  frameworks?: string[];
  lara_state?: "recommended" | "uncertain" | "updated" | null;
  lara_note?: string | null;
}

interface Question {
  id: string;
  label: string;
  helper?: string;
  options?: { value: string; label: string }[]; // chips
  placeholder?: string; // free text
}

interface ConfirmRiskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scenario: ConfirmRiskScenario | null;
  onConfirm: (answers?: Record<string, string>) => void;
}

const RISK_TONE: Record<string, string> = {
  critical: "text-destructive",
  high: "text-destructive",
  medium: "text-warning",
  low: "text-success",
  acceptable: "text-success",
};

// Decide whether scenario needs more input from user before confirming.
function buildQuestions(s: ConfirmRiskScenario): Question[] {
  // Lara is uncertain → ask clarifying questions
  if (s.lara_state === "uncertain") {
    return [
      {
        id: "data_types",
        label: "Hvilke persondata behandles i dette scenariet?",
        helper: "Velg det viktigste — Lara bruker dette til å beregne risiko.",
        options: [
          { value: "navn_kontakt", label: "Navn / kontakt" },
          { value: "cv_soknad", label: "CV / søknad" },
          { value: "demografi", label: "Demografi" },
          { value: "sensitivt", label: "Særlige kategorier" },
          { value: "ingen", label: "Ingen persondata" },
        ],
      },
      {
        id: "control",
        label: "Hvor mye menneskelig kontroll er det i dag?",
        options: [
          { value: "full", label: "Full — mennesker beslutter" },
          { value: "delvis", label: "Delvis — stikkprøver" },
          { value: "ingen", label: "Ingen — helautomatisk" },
        ],
      },
    ];
  }
  // High/critical risk → ask owner & deadline before confirming
  if (s.risk_level === "high" || s.risk_level === "critical") {
    return [
      {
        id: "owner",
        label: "Hvem eier oppfølgingen av dette scenariet?",
        placeholder: "F.eks. Anne Hansen (HR-leder)",
      },
    ];
  }
  // Otherwise → no questions, just a soft confirmation
  return [];
}

export const ConfirmRiskDialog = ({
  open,
  onOpenChange,
  scenario,
  onConfirm,
}: ConfirmRiskDialogProps) => {
  const questions = useMemo(() => (scenario ? buildQuestions(scenario) : []), [scenario]);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  // Reset on open
  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setStep(0);
      setAnswers({});
    }
    onOpenChange(next);
  };

  if (!scenario) return null;

  const totalSteps = questions.length;
  const isWizard = totalSteps > 0;
  const currentQ = isWizard ? questions[step] : null;
  const isLast = step === totalSteps - 1;
  const tone = RISK_TONE[scenario.risk_level] ?? "text-warning";

  const canProceed = !currentQ || (answers[currentQ.id] && answers[currentQ.id].trim().length > 0);

  const handleNext = () => {
    if (!isWizard) {
      onConfirm();
      handleOpenChange(false);
      return;
    }
    if (isLast) {
      onConfirm(answers);
      handleOpenChange(false);
    } else {
      setStep((s) => s + 1);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg p-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 space-y-3">
          <div className="flex items-center gap-2">
            {isWizard ? (
              <Badge variant="secondary" className="gap-1.5">
                <Sparkles className="h-3 w-3" />
                Lara trenger litt mer innsikt
              </Badge>
            ) : (
              <Badge variant="secondary" className="gap-1.5">
                <ShieldCheck className="h-3 w-3" />
                Bekreft scenario
              </Badge>
            )}
            <span className={cn("text-xs font-semibold uppercase tracking-wide", tone)}>
              {scenario.risk_level}
            </span>
          </div>
          <DialogTitle className="text-lg leading-snug">{scenario.title}</DialogTitle>
          {scenario.description && (
            <DialogDescription className="text-sm leading-relaxed">
              {scenario.description}
            </DialogDescription>
          )}
        </DialogHeader>

        {/* Body */}
        <div className="px-6 pb-2 space-y-4">
          {!isWizard && (
            <div className="rounded-xl border bg-muted/30 p-4 space-y-2">
              <div className="flex items-start gap-2 text-sm">
                <Sparkles className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                <p className="text-foreground">
                  Lara har vurdert dette scenariet og foreslår å bekrefte det som det er. Ved bekreftelse
                  legges scenariet til i risikoregisteret og varsles til ansvarlig.
                </p>
              </div>
              {scenario.frameworks && scenario.frameworks.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {scenario.frameworks.map((f) => (
                    <Badge key={f} variant="outline" className="text-xs">
                      {f}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}

          {isWizard && currentQ && (
            <div className="space-y-4">
              {/* progress */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    Spørsmål {step + 1} av {totalSteps}
                  </span>
                  {scenario.lara_state === "uncertain" && (
                    <span className="inline-flex items-center gap-1 text-warning">
                      <AlertTriangle className="h-3 w-3" />
                      Lara er usikker
                    </span>
                  )}
                </div>
                <div className="h-1 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-300 rounded-full"
                    style={{ width: `${((step + 1) / totalSteps) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <h4 className="text-base font-semibold mb-1">{currentQ.label}</h4>
                {currentQ.helper && (
                  <p className="text-sm text-muted-foreground">{currentQ.helper}</p>
                )}
              </div>

              {currentQ.options ? (
                <div className="flex flex-wrap gap-2">
                  {currentQ.options.map((opt) => {
                    const selected = answers[currentQ.id] === opt.value;
                    return (
                      <button
                        key={opt.value}
                        onClick={() =>
                          setAnswers((a) => ({ ...a, [currentQ.id]: opt.value }))
                        }
                        className={cn(
                          "px-3.5 py-2 rounded-full text-sm border transition-all",
                          selected
                            ? "bg-primary text-primary-foreground border-primary shadow-sm"
                            : "bg-background hover:bg-muted border-border"
                        )}
                      >
                        <span className="inline-flex items-center gap-1.5">
                          {selected && <Check className="h-3.5 w-3.5" />}
                          {opt.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <Textarea
                  placeholder={currentQ.placeholder}
                  value={answers[currentQ.id] || ""}
                  onChange={(e) =>
                    setAnswers((a) => ({ ...a, [currentQ.id]: e.target.value }))
                  }
                  rows={3}
                  className="resize-none"
                />
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 mt-2 bg-muted/20 border-t flex items-center gap-2">
          {isWizard && step > 0 ? (
            <Button variant="ghost" onClick={() => setStep((s) => s - 1)}>
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Tilbake
            </Button>
          ) : (
            <Button variant="ghost" onClick={() => handleOpenChange(false)}>
              Avbryt
            </Button>
          )}
          <div className="flex-1" />
          <Button onClick={handleNext} disabled={!canProceed}>
            {!isWizard ? (
              <>
                <Check className="h-4 w-4 mr-1.5" />
                Bekreft scenario
              </>
            ) : isLast ? (
              <>
                <Check className="h-4 w-4 mr-1.5" />
                Bekreft med svar
              </>
            ) : (
              <>
                Neste
                <ArrowRight className="h-4 w-4 ml-1.5" />
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
