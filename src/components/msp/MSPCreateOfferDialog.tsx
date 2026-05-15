import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Send, Trash2, FileText, Eye, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { MSPGapAnalysisDialog } from "./MSPGapAnalysisDialog";
import type { TaskEstimate, TaskOwner } from "./MSPMaturityServiceMatrix";

export interface CreateOfferDialogProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  domainName?: string;
  serviceTitle?: string;
  variant?: "Full leveranse" | "Co-delivery" | "Tjeneste";
  partnerName?: string;
  customerContactName?: string;
  defaultTasks?: TaskEstimate[];
  hourlyRate?: number;
  defaultMessage?: string;
  attachGap?: boolean;
  gapFrameworkId?: string;
}

interface EditableTask extends TaskEstimate {
  owner: TaskOwner;
}

const OWNERS: TaskOwner[] = ["Partner", "Kunde"];

const ownerRowClass: Record<TaskOwner, string> = {
  Partner: "bg-muted/30",
  Kunde: "bg-success/10",
};

export function MSPCreateOfferDialog({
  open,
  onOpenChange,
  domainName = "tjenesten",
  serviceTitle,
  variant = "Tjeneste",
  partnerName = "Dintero AS",
  customerContactName = "Truls",
  defaultTasks,
  hourlyRate = 1500,
  defaultMessage,
  attachGap: attachGapProp = true,
  gapFrameworkId,
}: CreateOfferDialogProps) {
  const [tasks, setTasks] = useState<EditableTask[]>(
    (defaultTasks || []).map(t => ({ ...t, owner: t.owner ?? "Partner" })),
  );
  const [message, setMessage] = useState(defaultMessage || "");
  const [attachGap, setAttachGap] = useState(attachGapProp);
  const [gapPreviewOpen, setGapPreviewOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTasks((defaultTasks || []).map(t => ({ ...t, owner: t.owner ?? "Partner" })));
    setMessage(defaultMessage || "");
    setAttachGap(attachGapProp);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const totalHours = tasks.reduce((s, t) => s + (Number(t.hours) || 0), 0);
  const totalPrice = totalHours * hourlyRate;

  const updateTask = (i: number, patch: Partial<EditableTask>) => {
    setTasks(p => p.map((t, idx) => (idx === i ? { ...t, ...patch } : t)));
  };
  const removeTask = (i: number) => setTasks(p => p.filter((_, idx) => idx !== i));
  const addTask = () =>
    setTasks(p => [...p, { label: "Ny oppgave", hours: 8, owner: "Partner", weeks: "" }]);

  const offerName = serviceTitle || domainName;
  const gapCount = 9; // demo

  const handleSend = () => {
    const toastId = toast.loading("Sender tilbud…", {
      description: `Sender «${offerName}» til ${customerContactName}.`,
    });
    setTimeout(() => {
      if (tasks.length === 0) {
        toast.error("Kunne ikke sende tilbud", {
          id: toastId,
          description: "Tilbudet mangler oppgaver.",
        });
        return;
      }
      onOpenChange(false);
      toast.success("Tilbud sendt", {
        id: toastId,
        description: attachGap
          ? `«${offerName}» er sendt til ${customerContactName} med gap-analyse vedlagt.`
          : `«${offerName}» er sendt til ${customerContactName}.`,
        duration: 6000,
      });
    }, 700);
  };

  const handleDraft = () => {
    onOpenChange(false);
    toast.success("Lagret som utkast", { description: "Du finner utkastet under Meldinger." });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 gap-0 max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="p-5 pb-3 border-b border-border space-y-1.5">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 text-[10px] gap-1">
              <Sparkles className="h-2.5 w-2.5" /> Utkast fra Lara
            </Badge>
            <span className="text-xs text-muted-foreground">{partnerName}</span>
          </div>
          <DialogTitle className="text-lg">{offerName}</DialogTitle>
          <DialogDescription className="text-[13px]">
            Rediger linjene og sett antall timer per oppgave før du sender.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Lara intro */}
          <div className="flex items-start gap-2.5 rounded-md border border-primary/30 bg-primary/5 p-3">
            <Sparkles className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
            <p className="text-[12px] text-foreground leading-snug">
              Jeg har satt opp et standardløp basert på din tjenestekatalog. Juster timene per oppgave og send til {customerContactName}.
            </p>
          </div>

          {/* Aktiviteter table */}
          <div className="space-y-2">
            <Label className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">
              Aktiviteter
            </Label>
            <div className="rounded-md border border-border overflow-hidden">
              <div className="grid grid-cols-[1fr_90px_32px] gap-2 px-3 py-2 bg-muted/40 text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">
                <span>Oppgave</span>
                <span className="text-right">Timer</span>
                <span />
              </div>
              <div className="divide-y divide-border">
                {tasks.map((t, i) => (
                  <div
                    key={i}
                    className="grid grid-cols-[1fr_90px_32px] gap-2 px-3 py-2 items-center"
                  >
                    <div className="min-w-0">
                      <Input
                        value={t.label}
                        onChange={e => updateTask(i, { label: e.target.value })}
                        className="h-7 text-[13px] font-medium border-0 bg-transparent px-0 focus-visible:ring-0"
                      />
                      {t.note && (
                        <p className="text-[11px] text-muted-foreground -mt-0.5">{t.note}</p>
                      )}
                    </div>
                    <Input
                      type="number"
                      value={t.hours}
                      onChange={e => updateTask(i, { hours: Number(e.target.value) })}
                      className="h-7 text-[13px] text-right tabular-nums"
                    />
                    <button
                      type="button"
                      onClick={() => removeTask(i)}
                      className="text-muted-foreground hover:text-destructive flex items-center justify-center"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full h-8 text-xs border-dashed gap-1 text-muted-foreground"
              onClick={addTask}
            >
              <Plus className="h-3 w-3" /> Legg til oppgave
            </Button>

            {/* Total */}
            <div className="flex items-baseline justify-between pt-2 px-1">
              <span className="text-[12px] text-muted-foreground">
                Timepris {hourlyRate.toLocaleString("nb-NO")} kr
              </span>
              <span className="text-sm font-semibold text-foreground tabular-nums">
                {totalHours} timer · {totalPrice.toLocaleString("nb-NO")} kr
              </span>
            </div>
          </div>

          {/* Vedlegg */}
          {gapFrameworkId && (
            <div className="space-y-2">
              <Label className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">
                Vedlegg
              </Label>
              <div className={`rounded-md border p-3 transition-colors ${attachGap ? "border-primary/40 bg-primary/5" : "border-border"}`}>
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <FileText className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-[13px] font-medium text-foreground truncate">
                        Gap-analyse {gapFrameworkId.toUpperCase()}
                      </p>
                      <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/30">
                        Anbefalt
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground">{gapCount} gap dokumentert</p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs gap-1 text-primary"
                    onClick={() => setGapPreviewOpen(true)}
                  >
                    <Eye className="h-3 w-3" /> Forhåndsvis
                  </Button>
                  <Switch checked={attachGap} onCheckedChange={setAttachGap} />
                </div>
              </div>
            </div>
          )}

          {/* Melding */}
          <div className="space-y-2">
            <Label className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">
              Melding til {customerContactName} (valgfritt)
            </Label>
            <Textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              rows={3}
              placeholder={`Hei ${customerContactName}, basert på modenhetsbildet ditt foreslår jeg følgende løp.`}
              className="text-[13px] resize-none"
            />
          </div>
        </div>

        <DialogFooter className="p-4 border-t border-border bg-muted/20 sm:justify-between gap-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Avbryt
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleDraft}>
              Lagre som utkast
            </Button>
            <Button size="sm" onClick={handleSend} className="gap-1.5">
              Send tilbud <Send className="h-3.5 w-3.5" />
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>

      <MSPGapAnalysisDialog
        open={gapPreviewOpen}
        onOpenChange={setGapPreviewOpen}
        customerName={customerContactName}
        initialFrameworkId={gapFrameworkId}
      />
    </Dialog>
  );
}
