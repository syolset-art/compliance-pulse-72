import { useEffect, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import {
  Info,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  Circle,
  CircleDashed,
  CheckCircle2,
  MinusCircle,
  type LucideIcon,
  Paperclip,
} from "lucide-react";

import { MATURITY_AREAS, deriveLaraSources, type MaturityAnswer, type MaturityAnswers } from "@/lib/trustMaturityQuestions";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BaselineAreaDocuments } from "@/components/msp/BaselineAreaDocuments";
import { useBaselineDocuments } from "@/hooks/useBaselineDocuments";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerName: string;
  /** Used to persist per-area documentation. */
  customerId?: string;
  answers: MaturityAnswers;
  onAnswer: (questionId: string, value: MaturityAnswer) => void;

  /** When provided, the drawer opens on the first area with Lara suggestions that are not yet confirmed. */
  reviewMode?: boolean;
  /** Optional Lara scan to derive suggested-source labels. */
  laraScan?: Parameters<typeof deriveLaraSources>[0];
  /** Per-question rationales from Laras LLM-suggestion. Takes precedence over scan source. */
  laraRationales?: Record<string, string>;
  /** Whether the drawer is filled by the partner alone or used together with the customer in a meeting. */
  mode?: "partner" | "meeting";
}

interface AnswerMeta {
  value: MaturityAnswer;
  label: string;
  icon: LucideIcon;
  className: string;
}

const ANSWER_META: AnswerMeta[] = [
  { value: "not_started", label: "Ikke startet", icon: Circle, className: "text-muted-foreground/60" },
  { value: "in_progress", label: "Pågår", icon: CircleDashed, className: "text-warning" },
  { value: "done", label: "Fullført", icon: CheckCircle2, className: "text-success" },
  { value: "not_relevant", label: "Ikke relevant", icon: MinusCircle, className: "text-muted-foreground/40" },
];

const META_BY_VALUE = Object.fromEntries(ANSWER_META.map((m) => [m.value, m])) as Record<MaturityAnswer, AnswerMeta>;

const isAnsweredVal = (a: MaturityAnswer | undefined) =>
  a === "done" || a === "in_progress" || a === "not_relevant";

export function BaselineQuestionsDrawer({
  open,
  onOpenChange,
  customerName,
  customerId,
  answers,
  onAnswer,
  reviewMode = false,
  laraScan,
  laraRationales,
  mode = "partner",
}: Props) {
  const { t } = useTranslation();
  const laraSources = deriveLaraSources(laraScan ?? null);
  const { docsForArea, docsForQuestion, addDocument, linkDocument, removeDocument } =
    useBaselineDocuments(customerId);


  const initialArea = (() => {
    if (reviewMode) {
      const firstWithSuggestion = MATURITY_AREAS.find((a) =>
        a.questions.some((q) => laraSources[q.id] && !isAnsweredVal(answers[q.id])),
      );
      if (firstWithSuggestion) return firstWithSuggestion.id;
    }
    return MATURITY_AREAS[0].id;
  })();

  const [tab, setTab] = useState<string>(initialArea);
  const [draft, setDraft] = useState<MaturityAnswers>(answers);

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
    setDraft(answers);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            {reviewMode
              ? t("baselineDrawer.reviewTitle", "Se over baseline")
              : mode === "meeting"
                ? t("baselineDrawer.meetingTitle", "Fyll ut baseline sammen med kunden")
                : t("baselineDrawer.partnerTitle", "Fyll ut baseline")}
          </SheetTitle>
          <SheetDescription>
            {t(
              "baselineDrawer.description",
              "Baseline er kundens utgangspunkt: en kort kartlegging av om sentrale GDPR- og sikkerhetstiltak er på plass, fordelt på fem kontrollområder. Svarene blir startpunktet for kundens Trust Profile og gap-analysen.",
            )}
          </SheetDescription>
        </SheetHeader>

        <Card className="mt-4 p-3 bg-primary/5 border-primary/20 flex items-start gap-3">
          <div className="h-7 w-7 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
            {reviewMode ? (
              <Sparkles className="h-3.5 w-3.5 text-primary" />
            ) : (
              <Info className="h-3.5 w-3.5 text-primary" />
            )}
          </div>
          <p className="text-sm text-foreground flex-1">
            {reviewMode ? (
              <Trans
                i18nKey="baselineDrawer.reviewInfo"
                values={{ customerName }}
                components={{ strong: <span className="font-medium" /> }}
              />
            ) : mode === "meeting" ? (
              <Trans
                i18nKey="baselineDrawer.meetingInfo"
                values={{ customerName }}
                components={{ strong: <span className="font-medium" /> }}
              />
            ) : (
              <Trans
                i18nKey="baselineDrawer.partnerInfo"
                values={{ customerName }}
                components={{ strong: <span className="font-medium" /> }}
              />
            )}
          </p>
        </Card>

        <TooltipProvider delayDuration={150}>
          <Tabs value={tab} onValueChange={setTab} className="mt-4">
            <TabsList className="grid w-full grid-cols-5 h-auto">
              {MATURITY_AREAS.map((a) => {
                const answered = a.questions.filter((q) => isAnsweredVal(draft[q.id])).length;
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
              <TabsContent key={area.id} value={area.id} className="mt-4">
                <p className="text-sm text-muted-foreground mb-2">{area.subtitle}</p>

                <BaselineAreaDocuments
                  areaId={area.id}
                  questions={area.questions}
                  documents={docsForArea(area.id)}
                  onAdd={addDocument}
                  onLink={linkDocument}
                  onRemove={removeDocument}
                />

                <div className="divide-y divide-border/60">

                  {area.questions.map((q) => {
                    const current = draft[q.id] ?? "not_started";
                    const meta = META_BY_VALUE[current];
                    const Icon = meta.icon;
                    const rationale = laraRationales?.[q.id];
                    const laraSource = laraSources[q.id];
                    const explanation = rationale ?? laraSource;
                    return (
                      <div key={q.id} className="group flex items-start gap-3 py-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground leading-snug">{q.text}</p>
                          {explanation && (
                            <p className="mt-1 text-xs text-muted-foreground flex items-start gap-1">
                              <Sparkles className="h-3 w-3 mt-0.5 shrink-0" />
                              <span>Lara: {explanation}</span>
                            </p>
                          )}
                          {docsForQuestion(q.id).length > 0 && (
                            <div className="mt-1 flex flex-wrap items-center gap-1">
                              {docsForQuestion(q.id).map((d) => (
                                <span
                                  key={d.id}
                                  className="inline-flex items-center gap-1 rounded border border-border bg-muted/40 px-1.5 py-0.5 text-xs text-muted-foreground max-w-[200px]"
                                  title={d.fileName}
                                >
                                  <Paperclip className="h-3 w-3 shrink-0" />
                                  <span className="truncate">{d.fileName}</span>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>


                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              className="mt-0.5 text-muted-foreground/50 hover:text-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              aria-label={`GDPR ${q.article}`}
                            >
                              <Info className="h-3.5 w-3.5" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="text-xs">
                            GDPR {q.article}
                          </TooltipContent>
                        </Tooltip>

                        <DropdownMenu>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <DropdownMenuTrigger asChild>
                                <button
                                  type="button"
                                  className="shrink-0 h-7 w-7 rounded-md flex items-center justify-center hover:bg-muted transition"
                                  aria-label={`Status: ${meta.label}`}
                                >
                                  <Icon className={`h-4 w-4 ${meta.className}`} />
                                </button>
                              </DropdownMenuTrigger>
                            </TooltipTrigger>
                            <TooltipContent side="left" className="text-xs">
                              {meta.label}
                            </TooltipContent>
                          </Tooltip>
                          <DropdownMenuContent align="end" className="w-44">
                            {ANSWER_META.map((opt) => {
                              const OptIcon = opt.icon;
                              return (
                                <DropdownMenuItem
                                  key={opt.value}
                                  onSelect={() => setDraftAnswer(q.id, opt.value)}
                                  className="gap-2 text-sm"
                                >
                                  <OptIcon className={`h-4 w-4 ${opt.className}`} />
                                  {opt.label}
                                </DropdownMenuItem>
                              );
                            })}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    );
                  })}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </TooltipProvider>

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
