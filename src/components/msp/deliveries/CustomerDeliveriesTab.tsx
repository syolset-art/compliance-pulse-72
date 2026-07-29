import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, PackageCheck, Send, CheckCircle2, Circle, Clock, TrendingUp, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { frameworks as ALL_FRAMEWORKS } from "@/lib/frameworkDefinitions";
import { useCustomerOffers, markOfferSent, type SavedOffer } from "@/lib/customerOffers";
import { CompleteDeliveryDialog } from "./CompleteDeliveryDialog";
import { DeliveryReport } from "./DeliveryReport";

interface Props {
  customerId: string;
  customerName: string;
  activeFrameworkIds: string[];
}

const STATUS_META: Record<
  NonNullable<SavedOffer["status"]>,
  { label: string; className: string; icon: any }
> = {
  draft: { label: "Utkast", className: "bg-muted text-muted-foreground border-border", icon: Circle },
  sent: { label: "Sendt", className: "bg-primary/10 text-primary border-primary/30", icon: Clock },
  delivered: { label: "Levert", className: "bg-success/15 text-success border-success/30", icon: CheckCircle2 },
};

export function CustomerDeliveriesTab({ customerId, customerName, activeFrameworkIds }: Props) {
  const offers = useCustomerOffers(customerId);
  const [completing, setCompleting] = useState<SavedOffer | null>(null);
  const [reportFor, setReportFor] = useState<SavedOffer | null>(null);

  const sorted = [...offers].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  const stats = {
    total: offers.length,
    delivered: offers.filter((o) => o.status === "delivered").length,
    pending: offers.filter((o) => (o.status ?? "draft") !== "delivered").length,
  };

  if (offers.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold text-foreground">Leveranser</h2>
        </div>
        <Card className="p-8 border-dashed border-border text-center">
          <div className="mx-auto h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
            <PackageCheck className="h-5 w-5 text-muted-foreground" />
          </div>
          <h3 className="text-sm font-semibold text-foreground mb-1.5">
            Ingen tilbud enda
          </h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Når du oppretter et tilbud fra tjenestekatalogen kommer det opp her —
            klart til å fullføres som leveranse og sendes til {customerName} som rapport.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold text-foreground">Leveranser</h2>
          <span className="text-xs text-muted-foreground">
            {stats.delivered} levert · {stats.pending} pågår
          </span>
        </div>
      </div>

      <div className="rounded-md border border-primary/20 bg-primary/5 p-3 flex items-start gap-2">
        <Sparkles className="h-4 w-4 text-primary mt-0.5 shrink-0" />
        <p className="text-xs text-foreground/85 leading-relaxed">
          Fullfør et tilbud som leveranse for å koble bevis til regelverkene og
          generere en rapport som viser hvor mye modenheten har økt.
        </p>
      </div>

      <div className="space-y-2.5">
        {sorted.map((offer) => {
          const status = offer.status ?? "draft";
          const meta = STATUS_META[status];
          const StatusIcon = meta.icon;
          const fwIds = offer.frameworkIds ?? [];
          const evCount = offer.evidenceIds?.length ?? 0;
          const deltaTotal =
            offer.impact && offer.impact.maturityAfter && offer.impact.maturityBefore
              ? Object.keys(offer.impact.maturityAfter).reduce(
                  (s, k) =>
                    s +
                    ((offer.impact!.maturityAfter![k] ?? 0) -
                      (offer.impact!.maturityBefore![k] ?? 0)),
                  0,
                )
              : 0;

          return (
            <Card key={offer.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="text-sm font-semibold text-foreground truncate">
                      {offer.name}
                    </h3>
                    <Badge variant="outline" className={`text-[10px] gap-1 ${meta.className}`}>
                      <StatusIcon className="h-2.5 w-2.5" />
                      {meta.label}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      · {offer.offerNumber}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1 mb-2">
                    {fwIds.length > 0 ? (
                      fwIds.map((id) => {
                        const fw = ALL_FRAMEWORKS.find((f) => f.id === id);
                        return (
                          <Badge key={id} variant="outline" className="text-[10px]">
                            {fw?.name || id.toUpperCase()}
                          </Badge>
                        );
                      })
                    ) : (
                      <span className="text-[11px] text-muted-foreground italic">
                        Ingen regelverk koblet enda
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <FileText className="h-3 w-3" /> {evCount} bevis
                    </span>
                    {status === "delivered" && deltaTotal > 0 && (
                      <span className="inline-flex items-center gap-1 text-success font-medium">
                        <TrendingUp className="h-3 w-3" /> +{deltaTotal}% modenhet
                      </span>
                    )}
                    <span>·</span>
                    <span>
                      {new Date(offer.createdAt).toLocaleDateString("nb-NO", {
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                    {offer.reportSentAt && (
                      <span className="inline-flex items-center gap-1 text-success">
                        <Send className="h-3 w-3" /> Rapport sendt
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 shrink-0">
                  {status === "draft" && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          markOfferSent(offer.id);
                          toast.success("Markert som sendt", {
                            description: `${offer.offerNumber} er markert som sendt til ${customerName}.`,
                          });
                        }}
                      >
                        Markér som sendt
                      </Button>
                      <Button size="sm" onClick={() => setCompleting(offer)}>
                        Fullfør leveranse
                      </Button>
                    </>
                  )}
                  {status === "sent" && (
                    <Button size="sm" onClick={() => setCompleting(offer)} className="gap-1.5">
                      <PackageCheck className="h-3.5 w-3.5" />
                      Fullfør leveranse
                    </Button>
                  )}
                  {status === "delivered" && (
                    <>
                      <Button size="sm" variant="outline" onClick={() => setReportFor(offer)}>
                        Se rapport
                      </Button>
                      <Button size="sm" onClick={() => setReportFor(offer)} className="gap-1.5">
                        <Send className="h-3.5 w-3.5" />
                        {offer.reportSentAt ? "Send på nytt" : "Send til kunde"}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {completing && (
        <CompleteDeliveryDialog
          open={!!completing}
          onOpenChange={(o) => !o && setCompleting(null)}
          offer={completing}
          customerId={customerId}
          customerName={customerName}
          activeFrameworkIds={activeFrameworkIds}
          onDelivered={(id) => {
            const updated = offers.find((o) => o.id === id);
            if (updated) setReportFor({ ...updated, status: "delivered" });
          }}
        />
      )}

      {reportFor && (
        <DeliveryReport
          open={!!reportFor}
          onOpenChange={(o) => !o && setReportFor(null)}
          offer={reportFor}
          customerName={customerName}
        />
      )}
    </div>
  );
}
