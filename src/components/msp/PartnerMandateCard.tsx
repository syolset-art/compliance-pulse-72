import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldCheck, FileSignature, Send, Check } from "lucide-react";
import { toast } from "sonner";
import { logPartnerActivity } from "@/lib/partnerActivityLog";

type Mandate = "none" | "confirmed" | "requested";

const KEY = (id: string) => `msp.partnerMandate.${id}`;

interface Props {
  customerId: string;
  customerName: string;
  contactName?: string | null;
  contactEmail?: string | null;
}

export function PartnerMandateCard({ customerId, customerName, contactName, contactEmail }: Props) {
  const [state, setState] = useState<Mandate>("none");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY(customerId));
      if (raw === "confirmed" || raw === "requested") setState(raw);
    } catch {}
  }, [customerId]);

  const save = (next: Mandate) => {
    setState(next);
    try { localStorage.setItem(KEY(customerId), next); } catch {}
  };

  if (state === "confirmed") {
    return (
      <Card className="p-4 border-success/30 bg-success/5">
        <div className="flex items-start gap-3">
          <div className="h-9 w-9 rounded-full bg-success/15 flex items-center justify-center shrink-0">
            <Check className="h-4.5 w-4.5 text-success" aria-hidden="true" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">Avtale bekreftet</p>
            <p className="text-sm text-muted-foreground mt-0.5">
              Du har bekreftet at dere har avtale om å forvalte sikkerhet og etterlevelse for {customerName}.
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs"
            onClick={() => save("none")}
          >
            Endre
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 border-warning/30 bg-warning/5">
      <div className="flex items-start gap-3">
        <div className="h-9 w-9 rounded-full bg-warning/15 flex items-center justify-center shrink-0">
          <ShieldCheck className="h-4.5 w-4.5 text-warning" aria-hidden="true" />
        </div>
        <div className="flex-1 min-w-0 space-y-2">
          <div>
            <p className="text-sm font-semibold text-foreground">Lara trenger at du bekrefter mandatet</p>
            <p className="text-sm text-foreground/80 mt-0.5 leading-relaxed">
              Før Lara kan handle på vegne av {customerName}, må du bekrefte at dere har en avtale —
              eller be kunden om en fullmakt. Dette sikrer at all dokumentasjon og berikelse skjer på riktig grunnlag.
            </p>
            {state === "requested" && (
              <p className="text-xs text-muted-foreground mt-1.5 italic">
                Fullmakt sendt{contactName ? ` til ${contactName}` : ""}{contactEmail ? ` (${contactEmail})` : ""} — venter på svar.
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              className="h-9 text-sm gap-1.5"
              onClick={() => {
                save("confirmed");
                logPartnerActivity(customerId, "offer_created", "Avtale bekreftet av partner");
                toast.success("Avtale bekreftet", { description: "Lara kan nå handle på vegne av kunden." });
              }}
            >
              <FileSignature className="h-4 w-4" aria-hidden="true" />
              Bekreft at vi har avtale
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-9 text-sm gap-1.5"
              onClick={() => {
                save("requested");
                logPartnerActivity(customerId, "document_requested", "Fullmakt etterspurt fra kunde");
                toast.success("Fullmakt sendt", {
                  description: contactEmail
                    ? `Forespørsel sendt til ${contactEmail}.`
                    : "Forespørsel klargjort.",
                });
              }}
            >
              <Send className="h-4 w-4" aria-hidden="true" />
              Be kunden om fullmakt
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
