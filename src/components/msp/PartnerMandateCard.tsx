import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileSignature, Send } from "lucide-react";
import { toast } from "sonner";
import { logPartnerActivity } from "@/lib/partnerActivityLog";

export type MandateState = "none" | "confirmed" | "requested";

const KEY = (id: string) => `msp.partnerMandate.${id}`;

export function getMandate(customerId: string): MandateState {
  try {
    const raw = localStorage.getItem(KEY(customerId));
    if (raw === "confirmed" || raw === "requested") return raw;
  } catch {}
  return "none";
}

export function setMandate(customerId: string, next: MandateState) {
  try { localStorage.setItem(KEY(customerId), next); } catch {}
  try { window.dispatchEvent(new CustomEvent("msp:mandate-change", { detail: { customerId, next } })); } catch {}
}

export function useMandate(customerId: string): MandateState {
  const [state, setState] = useState<MandateState>(() => getMandate(customerId));
  useEffect(() => {
    setState(getMandate(customerId));
    const onChange = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.customerId === customerId) setState(detail.next);
    };
    window.addEventListener("msp:mandate-change", onChange);
    return () => window.removeEventListener("msp:mandate-change", onChange);
  }, [customerId]);
  return state;
}

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId: string;
  customerName: string;
  contactName?: string | null;
  contactEmail?: string | null;
}

export function MandateConfirmDialog({ open, onOpenChange, customerId, customerName, contactName, contactEmail }: DialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Bekreft mandat for {customerName}</DialogTitle>
          <DialogDescription>
            Før Lara kan handle på vegne av {customerName}, må du bekrefte at dere har en avtale — eller be kunden om en fullmakt.
            Dette sikrer at all dokumentasjon og berikelse skjer på riktig grunnlag.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm text-foreground/85 space-y-1.5">
          <p><span className="font-medium">Avtale</span> — bekreft at dere har en signert leveranseavtale som dekker sikkerhet og etterlevelse.</p>
          <p><span className="font-medium">Fullmakt</span> — sender en e-post til kundens kontaktperson{contactName ? ` (${contactName})` : ""} med en lenke for å bekrefte direkte.</p>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            variant="outline"
            className="gap-1.5"
            onClick={() => {
              setMandate(customerId, "requested");
              logPartnerActivity(customerId, "document_requested", "Fullmakt etterspurt fra kunde");
              toast.success("Fullmakt sendt", {
                description: contactEmail ? `Forespørsel sendt til ${contactEmail}.` : "Forespørsel klargjort.",
              });
              onOpenChange(false);
            }}
          >
            <Send className="h-4 w-4" aria-hidden="true" />
            Be kunden om fullmakt
          </Button>
          <Button
            className="gap-1.5"
            onClick={() => {
              setMandate(customerId, "confirmed");
              logPartnerActivity(customerId, "offer_created", "Avtale bekreftet av partner");
              toast.success("Avtale bekreftet", { description: "Lara kan nå handle på vegne av kunden." });
              onOpenChange(false);
            }}
          >
            <FileSignature className="h-4 w-4" aria-hidden="true" />
            Bekreft at vi har avtale
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
