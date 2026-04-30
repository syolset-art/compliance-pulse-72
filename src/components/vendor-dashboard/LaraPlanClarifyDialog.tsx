import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles } from "lucide-react";
import type { PlanProposal } from "./LaraPlanProposal";

export type ClarifyAnswer = string;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isNb: boolean;
  proposals: PlanProposal[];
  onSubmit: (answers: Record<string, ClarifyAnswer>) => void;
}

export function LaraPlanClarifyDialog({ open, onOpenChange, isNb, proposals, onSubmit }: Props) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (open) {
      setStep(0);
      setAnswers({});
    }
  }, [open]);

  if (proposals.length === 0) return null;

  const current = proposals[step];
  const isLast = step === proposals.length - 1;
  const canNext = (answers[current.id] ?? "").trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            {isNb ? "Lara trenger litt mer info" : "Lara needs a bit more info"}
          </DialogTitle>
          <DialogDescription>
            {isNb
              ? `Spørsmål ${step + 1} av ${proposals.length}`
              : `Question ${step + 1} of ${proposals.length}`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="rounded-md bg-muted/40 p-3 border border-border">
            <p className="text-xs text-muted-foreground mb-1">
              {isNb ? "Tiltak" : "Action"}
            </p>
            <p className="text-sm font-medium text-foreground">
              {isNb ? current.titleNb : current.titleEn}
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="clarify-input" className="text-sm">
              {isNb ? current.needsClarification?.questionNb : current.needsClarification?.questionEn}
            </Label>
            <Input
              id="clarify-input"
              autoFocus
              value={answers[current.id] ?? ""}
              onChange={(e) => setAnswers((a) => ({ ...a, [current.id]: e.target.value }))}
              placeholder={current.needsClarification?.placeholder ?? ""}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          {step > 0 && (
            <Button variant="outline" onClick={() => setStep((s) => s - 1)}>
              {isNb ? "Tilbake" : "Back"}
            </Button>
          )}
          <Button
            onClick={() => {
              if (isLast) {
                onSubmit(answers);
              } else {
                setStep((s) => s + 1);
              }
            }}
            disabled={!canNext}
          >
            {isLast ? (isNb ? "Godkjenn plan" : "Approve plan") : isNb ? "Neste" : "Next"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
