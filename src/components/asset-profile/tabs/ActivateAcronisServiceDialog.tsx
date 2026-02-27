import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Shield, Clock, CheckCircle, Zap, PartyPopper, UserCheck, Building2, Mail } from "lucide-react";
import type { AcronisModule, MSPProduct, SecurityServiceCategory, MSPPartnerInfo } from "@/lib/securityServiceCatalog";

type ActivatableProduct =
  | { type: "acronis"; product: AcronisModule }
  | { type: "msp-product"; product: MSPProduct };

interface ActivateServiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: ActivatableProduct | null;
  service: SecurityServiceCategory | null;
  effectivePartner: MSPPartnerInfo | null;
  onActivate: (id: string, activatedBy: string) => void;
}

const ACTIVATED_BY_OPTIONS = [
  { value: "self", label: "Jeg aktiverte selv", icon: UserCheck, description: "Du har selv satt opp eller bestilt tjenesten" },
  { value: "msp", label: "MSP-partner aktiverte", icon: Building2, description: "Partneren din har aktivert tjenesten via Acronis eller annet" },
  { value: "agreed", label: "Allerede avtalt via e-post/annet", icon: Mail, description: "Dere har avtalt aktivering utenfor plattformen" },
];

export function ActivateServiceDialog({
  open, onOpenChange, item, service, effectivePartner, onActivate,
}: ActivateServiceDialogProps) {
  const [confirmed, setConfirmed] = useState(false);
  const [activatedBy, setActivatedBy] = useState("self");

  if (!item || !service) return null;

  const productName = item.product.name;
  const partnerName = effectivePartner?.name || "MSP-partner";

  const selectedOption = ACTIVATED_BY_OPTIONS.find(o => o.value === activatedBy)!;
  const displayActivatedBy = activatedBy === "msp" ? partnerName : activatedBy === "self" ? "deg" : "avtale";

  const handleActivate = () => {
    const id = item.product.id;
    const byLabel = activatedBy === "msp" ? partnerName : activatedBy === "self" ? "deg" : "avtale (e-post/annet)";
    onActivate(id, byLabel);
    setConfirmed(true);
  };

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => { setConfirmed(false); setActivatedBy("self"); }, 300);
  };

  if (confirmed) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center text-center py-6 space-y-4">
            <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-foreground flex items-center justify-center gap-2">
                Tjenesten er aktivert! <PartyPopper className="h-5 w-5 text-amber-500" />
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
                <strong className="text-foreground">{productName}</strong> er nå registrert som aktiv for din organisasjon.
              </p>
            </div>

            <div className="rounded-lg border border-border bg-muted/30 p-4 w-full text-left space-y-3">
              <div className="flex items-start gap-3">
                <selectedOption.icon className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-foreground">Aktivert av {displayActivatedBy}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Denne tjenesten vil nå vises som aktiv i din sikkerhetsoversikt og dekke relevante ISO 27001-kontroller.
                  </p>
                </div>
              </div>
            </div>

            {/* ISO controls covered */}
            <div className="w-full text-left">
              <p className="text-[10px] font-medium text-muted-foreground mb-1.5">ISO 27001-kontroller som nå dekkes</p>
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
            <Shield className="h-5 w-5 text-primary" />
            Aktiver {productName}
          </DialogTitle>
          <DialogDescription>
            Registrer denne tjenesten som aktiv for din organisasjon.
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
          </div>

          {/* Who activated */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">Hvem aktiverte tjenesten?</p>
            <RadioGroup value={activatedBy} onValueChange={setActivatedBy} className="space-y-2">
              {ACTIVATED_BY_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-all ${
                    activatedBy === opt.value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/30"
                  }`}
                >
                  <RadioGroupItem value={opt.value} className="mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground flex items-center gap-1.5">
                      <opt.icon className="h-3.5 w-3.5 text-muted-foreground" />
                      {opt.label}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">{opt.description}</p>
                  </div>
                </label>
              ))}
            </RadioGroup>
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
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button onClick={handleActivate} className="w-full gap-2">
            <Zap className="h-4 w-4" />
            Aktiver tjeneste
          </Button>
          <Button onClick={handleClose} variant="ghost" className="w-full text-xs text-muted-foreground">
            Avbryt
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
