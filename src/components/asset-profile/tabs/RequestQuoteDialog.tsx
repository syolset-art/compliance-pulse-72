import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, Clock, CheckCircle, Send, PartyPopper, FileText, Inbox } from "lucide-react";
import type { AcronisModule, MSPProduct, SecurityServiceCategory, MSPPartnerInfo } from "@/lib/securityServiceCatalog";

type ActivatableProduct =
  | { type: "acronis"; product: AcronisModule }
  | { type: "msp-product"; product: MSPProduct };

interface RequestQuoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: ActivatableProduct | null;
  service: SecurityServiceCategory | null;
  effectivePartner: MSPPartnerInfo | null;
  onQuoteRequested: (id: string) => void;
}

export function RequestQuoteDialog({
  open, onOpenChange, item, service, effectivePartner, onQuoteRequested,
}: RequestQuoteDialogProps) {
  const [confirmed, setConfirmed] = useState(false);

  if (!item || !service) return null;

  const productName = item.product.name;
  const partnerName = effectivePartner?.name || "MSP-partner";

  const handleRequestQuote = () => {
    const id = item.product.id;
    onQuoteRequested(id);
    setConfirmed(true);
  };

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => setConfirmed(false), 300);
  };

  if (confirmed) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center text-center py-6 space-y-4">
            <div className="h-16 w-16 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
              <Send className="h-8 w-8 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-foreground flex items-center justify-center gap-2">
                Tilbudsforespørsel sendt! <PartyPopper className="h-5 w-5 text-amber-500" />
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
                <strong className="text-foreground">{partnerName}</strong> har mottatt din forespørsel om tilbud på <strong className="text-foreground">{productName}</strong>.
              </p>
            </div>

            <div className="rounded-lg border border-border bg-muted/30 p-4 w-full text-left space-y-3">
              <div className="flex items-start gap-3">
                <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-foreground">Hva skjer nå?</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {partnerName} vil sende deg et tilbud innen <strong>1–3 virkedager</strong>. Tilbudet vil dukke opp i din <strong>innboks</strong>.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Inbox className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-foreground">Godkjenn i innboksen</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Når tilbudet er mottatt, kan du gjennomgå og godkjenne det direkte fra innboksen din. Tjenesten aktiveres først etter din godkjenning.
                  </p>
                </div>
              </div>
            </div>

            {/* ISO controls covered */}
            <div className="w-full text-left">
              <p className="text-[10px] font-medium text-muted-foreground mb-1.5">ISO 27001-kontroller som vil dekkes</p>
              <div className="flex gap-1.5 flex-wrap">
                {service.linkedControls.map((ctrl) => (
                  <Badge key={ctrl} variant="outline" className="text-[10px] px-1.5 py-0">{ctrl}</Badge>
                ))}
              </div>
            </div>

            <Button onClick={handleClose} className="w-full mt-2">
              Lukk
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Be om tilbud — {productName}
          </DialogTitle>
          <DialogDescription>
            Send en tilbudsforespørsel til {partnerName} for denne sikkerhetstjenesten.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Product info */}
          <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">Leverandør</span>
              <span className="text-sm text-muted-foreground">
                {item.type === "acronis" ? "Acronis" : item.product.vendor}
              </span>
            </div>
            {item.type === "acronis" && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">Acronis-pakke</span>
                  <Badge variant="outline" className="text-xs">{item.product.acronisPackage}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">Prismodell</span>
                  <Badge variant={item.product.priceIndicator === "included" ? "default" : "secondary"} className="text-xs">
                    {item.product.priceIndicator === "included" ? "Inkludert i pakke" : "Tilleggstjeneste"}
                  </Badge>
                </div>
              </>
            )}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">Kategori</span>
              <span className="text-sm text-muted-foreground">{service.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">MSP-partner</span>
              <span className="text-sm text-muted-foreground">{partnerName}</span>
            </div>
          </div>

          {/* ISO controls */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">ISO 27001-kontroller som dekkes</p>
            <div className="flex gap-1.5 flex-wrap">
              {service.linkedControls.map((ctrl) => (
                <Badge key={ctrl} variant="outline" className="text-[10px] px-1.5 py-0">{ctrl}</Badge>
              ))}
            </div>
          </div>

          {/* Process explanation */}
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-2">
            <p className="text-xs font-medium text-foreground flex items-center gap-1.5">
              <Send className="h-3.5 w-3.5 text-primary" />
              Slik fungerer det
            </p>
            <ol className="text-xs text-muted-foreground leading-relaxed space-y-1.5 list-decimal list-inside">
              <li><strong>Be om tilbud</strong> — forespørselen sendes til {partnerName}</li>
              <li><strong>Motta tilbud</strong> — tilbudet dukker opp i innboksen din innen 1–3 virkedager</li>
              <li><strong>Godkjenn</strong> — gjennomgå og godkjenn tilbudet for å aktivere tjenesten</li>
            </ol>
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button onClick={handleRequestQuote} className="w-full gap-2">
            <Send className="h-4 w-4" />
            Send tilbudsforespørsel til {partnerName}
          </Button>
          <Button onClick={handleClose} variant="ghost" className="w-full text-xs text-muted-foreground">
            Avbryt
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
