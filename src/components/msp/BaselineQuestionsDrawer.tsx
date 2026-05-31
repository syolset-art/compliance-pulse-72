import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Info, Sparkles, ShieldCheck, ArrowRight } from "lucide-react";
import { MATURITY_AREAS, deriveLaraSources, type MaturityAnswer, type MaturityAnswers } from "@/lib/trustMaturityQuestions";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerName: string;
  answers: MaturityAnswers;
  onAnswer: (questionId: string, value: MaturityAnswer) => void;
  /** When provided, the drawer opens on the first area with Lara suggestions that are not yet confirmed. */
  reviewMode?: boolean;
  /** Optional Lara scan to derive suggested-source labels. */
  laraScan?: Parameters<typeof deriveLaraSources>[0];
}

const ANSWER_OPTIONS: { value: MaturityAnswer; label: string }[] = [
  { value: "yes", label: "Ja" },
  { value: "no", label: "Nei" },
  { value: "n_a", label: "Ikke aktuelt" },
  { value: "unsure", label: "Usikker" },
];

export function BaselineQuestionsDrawer({
  open,
  onOpenChange,
  customerName,
  answers,
  onAnswer,
  reviewMode = false,
  laraScan,
}: Props) {
  const laraSources = deriveLaraSources(laraScan ?? null);

  const initialArea = (() => {
    if (reviewMode) {
      const firstWithSuggestion = MATURITY_AREAS.find((a) =>
        a.questions.some((q) => laraSources[q.id] && !(answers[q.id] === "yes" || answers[q.id] === "no")),
      );
      if (firstWithSuggestion) return firstWithSuggestion.id;
    }
    return MATURITY_AREAS[0].id;
  })();

  const [tab, setTab] = useState(initialArea);
  // Draft buffer — endringer commit'es først ved "Gå videre"/"Ferdig".
  const [draft, setDraft] = useState<MaturityAnswers>(answers);

  // Synk når drawer åpnes på nytt eller eksterne svar endres.
  useEffect(() => {
    if (open) setDraft(answers);
  }, [open, answers]);

  const setDraftAnswer = (qid: string, val: MaturityAnswer) =>
    setDraft((prev) => ({ ...prev, [qid]: val }));

  const commit = () => {
    Object.entries(draft).forEach(([qid, val]) => {
      if (answers[qid] !== val) onAnswer(qid, val);
    });
  };

  const currentIndex = MATURITY_AREAS.findIndex((a) => a.id === tab);
  const isLastArea = currentIndex === MATURITY_AREAS.length - 1;

  const handleNext = () => {
    if (isLastArea) {
      commit();
      onOpenChange(false);
    } else {
      setTab(MATURITY_AREAS[currentIndex + 1].id);
    }
  };

  const handleDiscard = () => {
    setDraft(answers); // forkast endringer
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            {reviewMode ? "Se over baseline" : "Fyll ut baseline"}
          </SheetTitle>
          <SheetDescription>
            Spørsmålene under er de samme som kunden får ved opprettelse av Trust Profile,
            fordelt på fire kontrollområder.
          </SheetDescription>
        </SheetHeader>

        <Card className="mt-4 p-3 bg-primary/5 border-primary/20 flex items-start gap-3">
          <div className="h-7 w-7 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
            <Info className="h-3.5 w-3.5 text-primary" />
          </div>
          <p className="text-sm text-foreground flex-1">
            Du svarer på vegne av <span className="font-medium">{customerName}</span>.
            Svarene lagres som partner-bekreftet og brukes som baseline når du kjører gap-analysen.
          </p>
        </Card>

        <Tabs value={tab} onValueChange={setTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-4 h-auto">
            {MATURITY_AREAS.map((a) => {
              const answered = a.questions.filter((q) => draft[q.id] === "yes" || draft[q.id] === "no").length;
              return (
                <TabsTrigger key={a.id} value={a.id} className="flex-col gap-0.5 py-2 text-xs">
                  <span className="font-medium truncate max-w-full">{a.title}</span>
                  <span className="text-xs text-muted-foreground">
                    {answered}/{a.questions.length}
                  </span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {MATURITY_AREAS.map((area) => (
            <TabsContent key={area.id} value={area.id} className="space-y-3 mt-4">
              <p className="text-sm text-muted-foreground">{area.subtitle}</p>

              {area.questions.map((q) => {
                const current = draft[q.id];
                const laraSource = laraSources[q.id];
                return (
                  <Card key={q.id} className="p-3 space-y-2.5">
                    <div className="flex items-start gap-2">
                      <p className="text-sm text-foreground flex-1">{q.text}</p>
                      <TooltipProvider delayDuration={150}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              className="text-muted-foreground hover:text-foreground shrink-0 mt-0.5"
                              aria-label={`Mer info: ${q.article}`}
                            >
                              <Info className="h-3.5 w-3.5" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <span className="text-xs">{q.article}</span>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>

                    {laraSource && (
                      <div className="flex items-center gap-1.5 text-xs text-primary">
                        <Sparkles className="h-3 w-3" />
                        <span>Lara foreslår: {laraSource}</span>
                      </div>
                    )}

                    <div className="flex gap-1.5">
                      {ANSWER_OPTIONS.map((opt) => (
                        <Button
                          key={opt.value}
                          size="sm"
                          variant={current === opt.value ? "default" : "outline"}
                          className="h-8 flex-1"
                          onClick={() => setDraftAnswer(q.id, opt.value)}
                        >
                          {opt.label}
                        </Button>
                      ))}
                    </div>
                  </Card>
                );
              })}
            </TabsContent>
          ))}
        </Tabs>

        <div className="flex items-center justify-between gap-4 mt-6 pt-4 border-t border-border">
          <button
            type="button"
            onClick={handleDiscard}
            className="text-sm text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
          >
            Avslutt uten å lagre
          </button>
          <Button onClick={handleNext} className="gap-1.5">
            {isLastArea ? "Ferdig" : (<>Gå videre <ArrowRight className="h-4 w-4" /></>)}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
