import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, FileText, Send, Sparkles, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { frameworks as ALL_FRAMEWORKS } from "@/lib/frameworkDefinitions";
import { computeDeliveryImpact, findEvidenceByIds, totalMaturityDelta } from "@/lib/deliveryImpact";
import { markReportSent, type SavedOffer } from "@/lib/customerOffers";
import { DOC_TYPE_LABEL } from "@/lib/partnerEvidence";
import {
  pickDeliveryFormTemplate,
  loadDeliveryForm,
} from "@/lib/deliveryFormTemplates";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  offer: SavedOffer;
  customerName: string;
  partnerName?: string;
}

export function DeliveryReport({ open, onOpenChange, offer, customerName, partnerName = "MSSP Partner" }: Props) {
  const evidenceIds = offer.evidenceIds ?? [];
  const frameworkIds = offer.frameworkIds ?? [];
  const rows = computeDeliveryImpact(offer.customerId ?? "", evidenceIds);
  const total = totalMaturityDelta(rows);
  const evidence = findEvidenceByIds(offer.customerId ?? "", evidenceIds);

  const dateLabel = new Date(offer.deliveredAt ?? offer.createdAt).toLocaleDateString("nb-NO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const sendToCustomer = () => {
    markReportSent(offer.id);
    toast.success("Rapport sendt til kunden", {
      description: `${customerName} har mottatt leveranserapporten på e-post.`,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="p-6 pb-4 border-b border-border">
          <div className="flex items-start justify-between gap-4">
            <div>
              <DialogTitle className="text-lg">Leveranserapport</DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {offer.name} · Tilbud {offer.offerNumber}
              </p>
            </div>
            {offer.reportSentAt ? (
              <Badge className="bg-success/15 text-success border-success/30 gap-1">
                <CheckCircle2 className="h-3 w-3" /> Sendt til kunde
              </Badge>
            ) : (
              <Badge variant="outline" className="gap-1">
                <FileText className="h-3 w-3" /> Utkast
              </Badge>
            )}
          </div>
        </DialogHeader>

        <div className="p-6 space-y-6">
          {/* Header info */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Kunde</p>
              <p className="font-medium text-foreground">{customerName}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Levert</p>
              <p className="font-medium text-foreground">{dateLabel}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Levert av</p>
              <p className="font-medium text-foreground">{partnerName}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Regelverk dekket</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {frameworkIds.length > 0 ? (
                  frameworkIds.map((id) => {
                    const fw = ALL_FRAMEWORKS.find((f) => f.id === id);
                    return (
                      <Badge key={id} variant="outline" className="text-xs">
                        {fw?.name || id.toUpperCase()}
                      </Badge>
                    );
                  })
                ) : (
                  <span className="text-xs text-muted-foreground">Ingen registrert</span>
                )}
              </div>
            </div>
          </div>

          {/* Modenhet før/etter */}
          <div className="rounded-lg border border-success/25 bg-success/5 p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-4 w-4 text-success" />
              <p className="text-sm font-semibold text-foreground">
                Modenhet før og etter leveranse
              </p>
              <Badge className="ml-auto bg-success/20 text-success border-success/30 tabular-nums">
                +{total}%
              </Badge>
            </div>
            <div className="space-y-3">
              {rows.map((r) => (
                <div key={r.area}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-foreground/80">{r.label}</span>
                    <span className="tabular-nums text-muted-foreground">
                      {r.before}% →{" "}
                      <span className="font-semibold text-success">{r.after}%</span>
                      {r.delta > 0 && <span className="text-success ml-1">(+{r.delta})</span>}
                    </span>
                  </div>
                  <div className="relative h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="absolute inset-y-0 left-0 bg-muted-foreground/40"
                      style={{ width: `${r.before}%` }}
                    />
                    <div
                      className="absolute inset-y-0 bg-success"
                      style={{ left: `${r.before}%`, width: `${r.after - r.before}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Vedlagt dokumentasjon */}
          <div>
            <p className="text-sm font-semibold text-foreground mb-2">
              Vedlagt dokumentasjon ({evidence.length})
            </p>
            {evidence.length === 0 ? (
              <p className="text-xs text-muted-foreground">Ingen bevis koblet til leveransen.</p>
            ) : (
              <div className="rounded-lg border border-border/60 divide-y divide-border/50">
                {evidence.map((e) => {
                  const totalControls = e.frameworks.reduce((s, f) => s + f.controlIds.length, 0);
                  return (
                    <div key={e.id} className="flex items-start gap-3 p-3">
                      <FileText className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {e.fileName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {DOC_TYPE_LABEL[e.docType]} · dekker {totalControls}{" "}
                          {totalControls === 1 ? "kontrollpunkt" : "kontrollpunkter"}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {e.frameworks.map((f) => (
                            <Badge key={f.framework} variant="outline" className="text-[10px] py-0">
                              {f.label}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* AI disclaimer */}
          <div className="flex items-start gap-2 rounded-md bg-muted/40 border border-border/60 p-3">
            <Sparkles className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Mapping mellom dokumentasjon og krav er foreslått av Lara. Anbefalingene
              baseres på dokumentets innhold og skal verifiseres av en menneskelig
              revisor før publisering utenfor plattformen.
            </p>
          </div>
        </div>

        <div className="p-4 border-t border-border flex justify-between items-center bg-muted/20">
          <p className="text-xs text-muted-foreground">
            Signert: <span className="font-medium text-foreground">{partnerName}</span>
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Lukk
            </Button>
            <Button onClick={sendToCustomer} className="gap-1.5">
              <Send className="h-3.5 w-3.5" />
              {offer.reportSentAt ? "Send på nytt" : "Send til kunde"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
