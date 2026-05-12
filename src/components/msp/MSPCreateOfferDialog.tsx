import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Check, Plus, Send, Trash2, Info, FileText, Eye } from "lucide-react";
import { toast } from "sonner";
import { MSPGapAnalysisDialog } from "./MSPGapAnalysisDialog";

export interface CreateOfferDialogProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  domainName?: string;
  serviceTitle?: string;
  variant?: "Full leveranse" | "Co-delivery" | "Tjeneste";
  partnerName?: string;
  customerContactName?: string;
  defaultItems?: string[];
  defaultDuration?: string;
  defaultEffort?: string;
  defaultPrice?: string;
  defaultMessage?: string;
}

export function MSPCreateOfferDialog({
  open,
  onOpenChange,
  domainName = "tjenesten",
  serviceTitle,
  variant = "Tjeneste",
  partnerName = "Dintero AS",
  customerContactName = "Truls",
  defaultItems,
  defaultDuration = "10–12 uker",
  defaultEffort = "120 timer",
  defaultPrice = "180 000 kr",
  defaultMessage,
}: CreateOfferDialogProps) {
  const [items, setItems] = useState<string[]>(defaultItems || [
    `Gap-analyse mot ${domainName}-kravene`,
    "Risiko- og sårbarhetsvurdering",
    "Policy- og dokumentpakke",
    "Hendelsesrapporteringsrutiner",
    "Ledelsesgjennomgang og opplæring",
  ]);
  const [newItem, setNewItem] = useState("");
  const [duration, setDuration] = useState(defaultDuration);
  const [effort, setEffort] = useState(defaultEffort);
  const [price, setPrice] = useState(defaultPrice);
  const [message, setMessage] = useState(
    defaultMessage ||
      `Hei ${customerContactName}, basert på modenhetsbildet ditt på 18 % og at kunden faller inn under ${domainName}, foreslår jeg et strukturert klargjøringsløp. Vi har gjort dette for flere lignende selskaper og kan starte i mai.`,
  );

  // Reset when reopened with new context
  useEffect(() => {
    if (open && defaultItems) setItems(defaultItems);
    if (open && defaultMessage) setMessage(defaultMessage);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const addItem = () => {
    const v = newItem.trim();
    if (!v) return;
    setItems(p => [...p, v]);
    setNewItem("");
  };

  const removeItem = (i: number) => setItems(p => p.filter((_, idx) => idx !== i));

  const handleSend = () => {
    const offerName = serviceTitle || domainName;
    const toastId = toast.loading("Sender tilbud…", {
      description: `Sender «${offerName}» til ${customerContactName}.`,
    });

    // Simulert sending — i produksjon: kall edge-funksjon her
    setTimeout(() => {
      // Enkle valideringer som kan utløse "feilet"
      if (!message.trim()) {
        toast.error("Kunne ikke sende tilbud", {
          id: toastId,
          description: "Meldingen til kunden er tom. Skriv noen ord før du sender.",
          duration: 7000,
        });
        return;
      }
      if (items.length === 0) {
        toast.error("Kunne ikke sende tilbud", {
          id: toastId,
          description: "Tilbudet mangler innhold. Legg til minst ett element under «Hva inngår».",
          duration: 7000,
        });
        return;
      }

      onOpenChange(false);
      toast.success("Tilbud sendt", {
        id: toastId,
        description: `«${offerName}» er sendt til ${customerContactName}. Du finner det under Meldinger.`,
        duration: 6000,
      });
    }, 700);
  };

  const handleDraft = () => {
    onOpenChange(false);
    toast.success("Lagret som utkast", {
      description: "Du finner utkastet under Meldinger.",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl p-0 gap-0 max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="p-5 pb-3 border-b border-border space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 text-[10px]">
              {variant}
            </Badge>
            <span className="text-xs text-muted-foreground">{partnerName}</span>
          </div>
          <DialogTitle className="text-lg">
            {serviceTitle ? `Tilby ${serviceTitle}` : `Tilby ${domainName}`}
          </DialogTitle>
          <DialogDescription className="text-[13px]">
            {variant === "Co-delivery"
              ? "Dere deler leveransen. Kunden gjør deler selv, du leverer resten."
              : "Du leverer hele løpet. Kunden gjennomgår og signerer tilbudet."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Hva inngår */}
          <div className="space-y-2">
            <Label className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">
              Hva inngår
            </Label>
            <div className="space-y-1.5">
              {items.map((item, i) => (
                <div key={i} className="group flex items-center gap-2 rounded-md bg-muted/40 px-3 py-2">
                  <Check className="h-3.5 w-3.5 text-success shrink-0" />
                  <span className="text-[13px] text-foreground flex-1">{item}</span>
                  <button
                    type="button"
                    onClick={() => removeItem(i)}
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 pt-1">
              <Input
                value={newItem}
                onChange={e => setNewItem(e.target.value)}
                onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addItem())}
                placeholder="Legg til element"
                className="h-8 text-[13px]"
              />
              <Button type="button" size="sm" variant="ghost" className="h-8 text-xs gap-1 text-primary" onClick={addItem}>
                <Plus className="h-3 w-3" /> Legg til
              </Button>
            </div>
          </div>

          {/* Estimat */}
          <div className="space-y-2">
            <Label className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">
              Estimat
            </Label>
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-md border border-border p-3 space-y-1">
                <p className="text-[11px] text-muted-foreground">Varighet</p>
                <Input value={duration} onChange={e => setDuration(e.target.value)} className="h-7 text-[13px] font-semibold border-0 px-0 focus-visible:ring-0" />
              </div>
              <div className="rounded-md border border-border p-3 space-y-1">
                <p className="text-[11px] text-muted-foreground">Arbeidsmengde</p>
                <Input value={effort} onChange={e => setEffort(e.target.value)} className="h-7 text-[13px] font-semibold border-0 px-0 focus-visible:ring-0" />
              </div>
              <div className="rounded-md border border-border p-3 space-y-1">
                <p className="text-[11px] text-muted-foreground">Estimert pris</p>
                <Input value={price} onChange={e => setPrice(e.target.value)} className="h-7 text-[13px] font-semibold border-0 px-0 focus-visible:ring-0" />
              </div>
            </div>
          </div>

          {/* Melding */}
          <div className="space-y-2">
            <Label className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">
              Melding til {customerContactName}
            </Label>
            <Textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              rows={4}
              className="text-[13px] resize-none"
            />
          </div>

          <div className="flex items-start gap-2 rounded-md border border-primary/30 bg-primary/5 p-3">
            <Send className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
            <p className="text-[12px] text-foreground">
              Tilbudet sendes til {customerContactName} (kontakt hos kunden). Kunden kan godta, avvise eller be om endringer.
            </p>
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
    </Dialog>
  );
}
