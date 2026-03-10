import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, Clock, CheckCircle, Send, PartyPopper, FileText, Inbox } from "lucide-react";
import type { AcronisModule, MSPProduct, SecurityServiceCategory, MSPPartnerInfo } from "@/lib/securityServiceCatalog";
import { useTranslation } from "react-i18next";

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
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";

  if (!item || !service) return null;

  const productName = item.product.name;
  const partnerName = effectivePartner?.name || (isNb ? "MSP-partner" : "MSP partner");
  const serviceName = isNb ? service.name : service.nameEn;

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
                {isNb ? "Tilbudsforespørsel sendt!" : "Quote request sent!"} <PartyPopper className="h-5 w-5 text-amber-500" />
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
                {isNb ? (
                  <><strong className="text-foreground">{partnerName}</strong> har mottatt din forespørsel om tilbud på <strong className="text-foreground">{productName}</strong>.</>
                ) : (
                  <><strong className="text-foreground">{partnerName}</strong> has received your quote request for <strong className="text-foreground">{productName}</strong>.</>
                )}
              </p>
            </div>

            <div className="rounded-lg border border-border bg-muted/30 p-4 w-full text-left space-y-3">
              <div className="flex items-start gap-3">
                <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-foreground">{isNb ? "Hva skjer nå?" : "What happens next?"}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {isNb
                      ? <>{partnerName} vil sende deg et tilbud innen <strong>1–3 virkedager</strong>. Tilbudet vil dukke opp i din <strong>innboks</strong>.</>
                      : <>{partnerName} will send you a quote within <strong>1–3 business days</strong>. The quote will appear in your <strong>inbox</strong>.</>}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Inbox className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-foreground">{isNb ? "Godkjenn i innboksen" : "Approve in inbox"}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {isNb
                      ? "Når tilbudet er mottatt, kan du gjennomgå og godkjenne det direkte fra innboksen din. Tjenesten aktiveres først etter din godkjenning."
                      : "Once the quote is received, you can review and approve it directly from your inbox. The service will only be activated after your approval."}
                  </p>
                </div>
              </div>
            </div>

            {/* ISO controls covered */}
            <div className="w-full text-left">
              <p className="text-[10px] font-medium text-muted-foreground mb-1.5">{isNb ? "ISO 27001-kontroller som vil dekkes" : "ISO 27001 controls that will be covered"}</p>
              <div className="flex gap-1.5 flex-wrap">
                {service.linkedControls.map((ctrl) => (
                  <Badge key={ctrl} variant="outline" className="text-[10px] px-1.5 py-0">{ctrl}</Badge>
                ))}
              </div>
            </div>

            <Button onClick={handleClose} className="w-full mt-2">
              {isNb ? "Lukk" : "Close"}
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
            {isNb ? `Be om tilbud — ${productName}` : `Request quote — ${productName}`}
          </DialogTitle>
          <DialogDescription>
            {isNb
              ? `Send en tilbudsforespørsel til ${partnerName} for denne sikkerhetstjenesten.`
              : `Send a quote request to ${partnerName} for this security service.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Product info */}
          <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">{isNb ? "Leverandør" : "Vendor"}</span>
              <span className="text-sm text-muted-foreground">
                {item.type === "acronis" ? "Acronis" : item.product.vendor}
              </span>
            </div>
            {item.type === "acronis" && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">{isNb ? "Acronis-pakke" : "Acronis package"}</span>
                  <Badge variant="outline" className="text-xs">{item.product.acronisPackage}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">{isNb ? "Prismodell" : "Pricing model"}</span>
                  <Badge variant={item.product.priceIndicator === "included" ? "default" : "secondary"} className="text-xs">
                    {item.product.priceIndicator === "included" ? (isNb ? "Inkludert i pakke" : "Included in package") : (isNb ? "Tilleggstjeneste" : "Add-on service")}
                  </Badge>
                </div>
              </>
            )}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">{isNb ? "Kategori" : "Category"}</span>
              <span className="text-sm text-muted-foreground">{serviceName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">{isNb ? "MSP-partner" : "MSP partner"}</span>
              <span className="text-sm text-muted-foreground">{partnerName}</span>
            </div>
          </div>

          {/* ISO controls */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">{isNb ? "ISO 27001-kontroller som dekkes" : "ISO 27001 controls covered"}</p>
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
              {isNb ? "Slik fungerer det" : "How it works"}
            </p>
            <ol className="text-xs text-muted-foreground leading-relaxed space-y-1.5 list-decimal list-inside">
              {isNb ? (
                <>
                  <li><strong>Be om tilbud</strong> — forespørselen sendes til {partnerName}</li>
                  <li><strong>Motta tilbud</strong> — tilbudet dukker opp i innboksen din innen 1–3 virkedager</li>
                  <li><strong>Godkjenn</strong> — gjennomgå og godkjenn tilbudet for å aktivere tjenesten</li>
                </>
              ) : (
                <>
                  <li><strong>Request quote</strong> — the request is sent to {partnerName}</li>
                  <li><strong>Receive quote</strong> — the quote will appear in your inbox within 1–3 business days</li>
                  <li><strong>Approve</strong> — review and approve the quote to activate the service</li>
                </>
              )}
            </ol>
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button onClick={handleRequestQuote} className="w-full gap-2">
            <Send className="h-4 w-4" />
            {isNb ? `Send tilbudsforespørsel til ${partnerName}` : `Send quote request to ${partnerName}`}
          </Button>
          <Button onClick={handleClose} variant="ghost" className="w-full text-xs text-muted-foreground">
            {isNb ? "Avbryt" : "Cancel"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
