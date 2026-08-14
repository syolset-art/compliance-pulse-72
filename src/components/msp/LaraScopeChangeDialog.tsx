import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sparkles, Plus, Wand2, AlertTriangle } from "lucide-react";
import type { ScopeRecommendations, ScopeDiff } from "@/lib/laraScopeDiff";
import { summarizeDiff } from "@/lib/laraScopeDiff";

export interface ScopeChangeSelection {
  addTemplateIds: string[];
  extendExtraIds: string[];
  reviewExtraIds: string[];
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  diff: ScopeDiff;
  recs: ScopeRecommendations;
  onApply: (sel: ScopeChangeSelection) => void;
}

export function LaraScopeChangeDialog({ open, onOpenChange, diff, recs, onApply }: Props) {
  const summary = useMemo(() => summarizeDiff(diff), [diff]);

  const [addSel, setAddSel] = useState<Set<string>>(new Set(recs.toAdd.map((r) => r.templateId)));
  const [extendSel, setExtendSel] = useState<Set<string>>(new Set(recs.toExtend.map((r) => r.extraId)));
  const [reviewSel, setReviewSel] = useState<Set<string>>(new Set(recs.toReview.map((r) => r.extraId)));

  const toggle = (s: Set<string>, setter: (s: Set<string>) => void, id: string) => {
    const next = new Set(s);
    if (next.has(id)) next.delete(id); else next.add(id);
    setter(next);
  };

  const nothingToDo = recs.toAdd.length + recs.toExtend.length + recs.toReview.length === 0;
  const selectedTotal = addSel.size + extendSel.size + reviewSel.size;

  const handleApply = () => {
    onApply({
      addTemplateIds: Array.from(addSel),
      extendExtraIds: Array.from(extendSel),
      reviewExtraIds: Array.from(reviewSel),
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <span className="h-7 w-7 rounded-full bg-primary/15 flex items-center justify-center">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
            </span>
            Lara har oppdaget endringer i scope
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {summary && (
            <div className="rounded-md border border-primary/20 bg-primary/5 px-3 py-2 text-sm text-foreground/80">
              <span className="font-medium text-foreground">Endring i kartlegging: </span>{summary}
            </div>
          )}

          {nothingToDo ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              Ingen endringer i tjenestekatalogen ser ut til å være nødvendige.
            </p>
          ) : (
            <ScrollArea className="max-h-[52vh] pr-2">
              <div className="space-y-5">
                {recs.toExtend.length > 0 && (
                  <section className="space-y-2">
                    <header className="flex items-center gap-2 text-sm font-medium text-foreground">
                      <Wand2 className="h-3.5 w-3.5 text-primary" />
                      Utvid eksisterende tjenester ({recs.toExtend.length})
                    </header>
                    <div className="rounded-md border border-border divide-y divide-border">
                      {recs.toExtend.map((r) => (
                        <label
                          key={r.extraId}
                          className="flex items-start gap-3 px-3 py-2.5 cursor-pointer hover:bg-muted/40"
                        >
                          <Checkbox
                            checked={extendSel.has(r.extraId)}
                            onCheckedChange={() => toggle(extendSel, setExtendSel, r.extraId)}
                            className="mt-0.5"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium text-foreground">{r.extraName}</div>
                            <div className="text-xs text-muted-foreground mt-0.5">{r.reason}</div>
                          </div>
                          <div className="flex flex-wrap gap-1 shrink-0 max-w-[40%] justify-end">
                            {r.addedFrameworkLabels.map((l) => (
                              <span key={l} className="text-[11px] px-1.5 py-0.5 rounded bg-primary/10 text-primary whitespace-nowrap">+{l}</span>
                            ))}
                          </div>
                        </label>
                      ))}
                    </div>
                  </section>
                )}

                {recs.toAdd.length > 0 && (
                  <section className="space-y-2">
                    <header className="flex items-center gap-2 text-sm font-medium text-foreground">
                      <Plus className="h-3.5 w-3.5 text-primary" />
                      Legg til nye tjenester ({recs.toAdd.length})
                    </header>
                    <div className="rounded-md border border-border divide-y divide-border">
                      {recs.toAdd.map((r) => (
                        <label
                          key={r.templateId}
                          className="flex items-start gap-3 px-3 py-2.5 cursor-pointer hover:bg-muted/40"
                        >
                          <Checkbox
                            checked={addSel.has(r.templateId)}
                            onCheckedChange={() => toggle(addSel, setAddSel, r.templateId)}
                            className="mt-0.5"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium text-foreground">{r.name}</div>
                            <div className="text-xs text-muted-foreground mt-0.5">{r.reason}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </section>
                )}

                {recs.toReview.length > 0 && (
                  <section className="space-y-2">
                    <header className="flex items-center gap-2 text-sm font-medium text-foreground">
                      <AlertTriangle className="h-3.5 w-3.5 text-warning" />
                      Marker for gjennomgang ({recs.toReview.length})
                    </header>
                    <div className="rounded-md border border-border divide-y divide-border">
                      {recs.toReview.map((r) => (
                        <label
                          key={r.extraId}
                          className="flex items-start gap-3 px-3 py-2.5 cursor-pointer hover:bg-muted/40"
                        >
                          <Checkbox
                            checked={reviewSel.has(r.extraId)}
                            onCheckedChange={() => toggle(reviewSel, setReviewSel, r.extraId)}
                            className="mt-0.5"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium text-foreground">{r.extraName}</div>
                            <div className="text-xs text-muted-foreground mt-0.5">{r.reason}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Lara flagger tjenesten — du bestemmer selv om du vil beholde eller avslutte den.
                    </p>
                  </section>
                )}
              </div>
            </ScrollArea>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Avvis
          </Button>
          <Button onClick={handleApply} disabled={selectedTotal === 0 || nothingToDo} className="gap-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            Bruk valgte endringer{selectedTotal > 0 ? ` (${selectedTotal})` : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
