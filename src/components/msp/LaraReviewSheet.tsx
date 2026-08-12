import { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Sparkles, Check, X, ChevronLeft, Wand2, AlertTriangle } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  LARA_KIND_LABELS,
  LARA_RISK_LABELS,
  type LaraQueueItem,
  type LaraQueueRisk,
} from "@/lib/laraWorkQueue";

export type ReviewDecision =
  | { type: "approve"; comment: string }
  | { type: "reject"; comment: string }
  | { type: "revise"; comment: string };

interface Props {
  item: LaraQueueItem | null;
  onOpenChange: (open: boolean) => void;
  onDecision: (item: LaraQueueItem, decision: ReviewDecision) => void;
}

export const riskBadgeClass = (risk: LaraQueueRisk) =>
  risk === "critical"
    ? "border-destructive/30 bg-destructive/10 text-destructive"
    : risk === "medium"
    ? "border-warning/30 bg-warning/10 text-warning"
    : "border-border bg-muted text-muted-foreground";

type Step = "summary" | "details" | "approve" | "reject" | "revise";

export function LaraReviewSheet({ item, onOpenChange, onDecision }: Props) {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb" || i18n.language === "no";
  const [step, setStep] = useState<Step>("summary");
  const [comment, setComment] = useState("");

  useEffect(() => {
    if (item) {
      setStep("summary");
      setComment("");
    }
  }, [item]);

  if (!item) return null;

  const isCritical = item.risk === "critical";
  const commentRequired = step === "reject" || step === "revise" || (step === "approve" && isCritical);
  const canSubmit = !commentRequired || comment.trim().length > 0;

  const submit = (type: ReviewDecision["type"]) => {
    onDecision(item, { type, comment: comment.trim() } as ReviewDecision);
  };

  return (
    <Sheet open={!!item} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-4 sm:max-w-md">
        <SheetHeader className="space-y-2 text-left">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="gap-1 text-xs">
              <Sparkles className="h-3 w-3 text-primary" />
              {isNb ? LARA_KIND_LABELS[item.kind].nb : LARA_KIND_LABELS[item.kind].en}
            </Badge>
            <Badge variant="outline" className={`text-xs ${riskBadgeClass(item.risk)}`}>
              {isCritical && <AlertTriangle className="mr-1 h-3 w-3" />}
              {isNb ? LARA_RISK_LABELS[item.risk].nb : LARA_RISK_LABELS[item.risk].en}
            </Badge>
          </div>
          <SheetTitle className="text-base">{item.customer}</SheetTitle>
          <SheetDescription className="text-sm text-foreground/90">
            {isNb ? item.action : item.actionEn}
          </SheetDescription>
        </SheetHeader>

        {step === "summary" && (
          <div className="flex-1 space-y-3 text-sm">
            <p className="text-muted-foreground">{isNb ? item.rationale : item.rationaleEn}</p>
            <p className="text-xs text-muted-foreground">
              {isNb ? "Kilde" : "Source"}: {isNb ? item.source : item.sourceEn} ·{" "}
              {isNb ? item.riskReason : item.riskReasonEn}
            </p>
            <button
              type="button"
              onClick={() => setStep("details")}
              className="text-xs font-medium text-primary underline-offset-2 hover:underline"
            >
              {isNb ? "Se detaljer" : "See details"}
            </button>
          </div>
        )}

        {step === "details" && (
          <div className="flex-1 space-y-3 text-sm">
            <p className="text-xs font-medium text-muted-foreground">
              {isNb ? "Dette skjer ved godkjenning" : "This happens on approval"}
            </p>
            <ul className="space-y-1.5">
              {(isNb ? item.impact : item.impactEn).map((line) => (
                <li key={line} className="flex gap-2 text-sm text-foreground/90">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-muted-foreground" />
                  {line}
                </li>
              ))}
            </ul>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setStep("revise")}>
              <Wand2 className="h-3.5 w-3.5" />
              {isNb ? "Be Lara om å justere" : "Ask Lara to adjust"}
            </Button>
          </div>
        )}

        {(step === "approve" || step === "reject" || step === "revise") && (
          <div className="flex-1 space-y-2">
            <Label htmlFor="lara-review-comment" className="text-xs">
              {step === "approve"
                ? isNb
                  ? isCritical
                    ? "Begrunnelse (påkrevd for kritisk arbeid)"
                    : "Kommentar (valgfritt)"
                  : isCritical
                  ? "Reason (required for critical work)"
                  : "Comment (optional)"
                : step === "reject"
                ? isNb
                  ? "Hvorfor avvises dette?"
                  : "Why is this rejected?"
                : isNb
                ? "Hva skal Lara rette?"
                : "What should Lara correct?"}
            </Label>
            <Textarea
              id="lara-review-comment"
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              autoFocus
            />
          </div>
        )}

        <div className="mt-auto flex items-center gap-2 border-t border-border pt-3">
          {step === "summary" ? (
            <>
              <Button className="flex-1 gap-1.5" onClick={() => setStep("approve")}>
                <Check className="h-4 w-4" />
                {isNb ? "Godkjenn" : "Approve"}
              </Button>
              <Button variant="ghost" className="gap-1.5" onClick={() => setStep("reject")}>
                <X className="h-4 w-4" />
                {isNb ? "Avvis" : "Reject"}
              </Button>
            </>
          ) : step === "details" ? (
            <>
              <Button variant="ghost" size="sm" className="gap-1" onClick={() => setStep("summary")}>
                <ChevronLeft className="h-4 w-4" />
                {isNb ? "Tilbake" : "Back"}
              </Button>
              <div className="flex-1" />
              <Button size="sm" className="gap-1.5" onClick={() => setStep("approve")}>
                <Check className="h-4 w-4" />
                {isNb ? "Godkjenn" : "Approve"}
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" className="gap-1" onClick={() => setStep("summary")}>
                <ChevronLeft className="h-4 w-4" />
                {isNb ? "Tilbake" : "Back"}
              </Button>
              <div className="flex-1" />
              <Button
                size="sm"
                variant={step === "reject" ? "destructive" : "default"}
                disabled={!canSubmit}
                onClick={() => submit(step)}
              >
                {step === "approve"
                  ? isNb
                    ? "Bekreft godkjenning"
                    : "Confirm approval"
                  : step === "reject"
                  ? isNb
                    ? "Bekreft avvisning"
                    : "Confirm rejection"
                  : isNb
                  ? "Send til Lara"
                  : "Send to Lara"}
              </Button>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
