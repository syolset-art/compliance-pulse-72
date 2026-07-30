import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  FileText,
  PackageCheck,
  Send,
  CheckCircle2,
  TrendingUp,
  Sparkles,
  ArrowRight,
  ClipboardList,
} from "lucide-react";
import { toast } from "sonner";
import { frameworks as ALL_FRAMEWORKS } from "@/lib/frameworkDefinitions";
import { useCustomerOffers, markOfferSent, type SavedOffer } from "@/lib/customerOffers";
import {
  pickDeliveryFormTemplate,
  loadDeliveryForm,
  deliveryFormProgress,
} from "@/lib/deliveryFormTemplates";
import { DeliveryWorkspaceDrawer } from "./DeliveryWorkspaceDrawer";
import { DeliveryReport } from "./DeliveryReport";

interface Props {
  customerId: string;
  customerName: string;
  activeFrameworkIds: string[];
}

function FrameworkChips({ ids }: { ids: string[] }) {
  if (ids.length === 0) {
    return <span className="text-[11px] text-muted-foreground italic">Ingen regelverk koblet</span>;
  }
  return (
    <>
      {ids.map((id) => {
        const fw = ALL_FRAMEWORKS.find((f) => f.id === id);
        return (
          <Badge key={id} variant="outline" className="text-[10px] py-0">
            {fw?.name || id.toUpperCase()}
          </Badge>
        );
      })}
    </>
  );
}

export function CustomerDeliveriesTab({ customerId, customerName, activeFrameworkIds }: Props) {
  const offers = useCustomerOffers(customerId);
  const [working, setWorking] = useState<SavedOffer | null>(null);
  const [reportFor, setReportFor] = useState<SavedOffer | null>(null);

  const byDate = (a: SavedOffer, b: SavedOffer) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();

  const ongoing = offers.filter((o) => (o.status ?? "draft") !== "delivered").sort(byDate);
  const completed = offers.filter((o) => o.status === "delivered").sort(byDate);

  if (offers.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-base font-semibold text-foreground">Oppdrag</h2>
        <Card className="p-8 border-dashed border-border text-center">
          <div className="mx-auto h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
            <PackageCheck className="h-5 w-5 text-muted-foreground" />
          </div>
          <h3 className="text-sm font-semibold text-foreground mb-1.5">Ingen oppdrag enda</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Når du oppretter et tilbud fra tjenestekatalogen kommer det opp her som et
            oppdrag du kan jobbe med, dokumentere og levere til {customerName}.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pågående */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <h2 className="text-base font-semibold text-foreground">Pågående oppdrag</h2>
            <span className="text-xs text-muted-foreground tabular-nums">{ongoing.length}</span>
          </div>
        </div>

        {ongoing.length === 0 ? (
          <Card className="p-5 border-dashed text-center">
            <p className="text-sm text-muted-foreground">
              Ingen pågående oppdrag — alt er levert.
            </p>
          </Card>
        ) : (
          <div className="space-y-2">
            {ongoing.map((offer) => {
              const template = pickDeliveryFormTemplate({
                name: offer.name,
                templateIds: offer.templateIds,
              });
              const state = loadDeliveryForm(offer.id);
              const prog = deliveryFormProgress(template, state);
              const pct = prog.total ? Math.round((prog.done / prog.total) * 100) : 0;
              const started = prog.done > 0;

              return (
                <Card key={offer.id} className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <ClipboardList className="h-3.5 w-3.5 text-primary shrink-0" />
                        <h3 className="text-sm font-semibold text-foreground truncate">
                          {offer.name}
                        </h3>
                        <span className="text-[11px] text-muted-foreground">
                          {template.label} · {offer.offerNumber}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-1">
                        <FrameworkChips ids={offer.frameworkIds ?? []} />
                      </div>

                      <div className="flex items-center gap-2.5 pt-0.5 max-w-sm">
                        <Progress value={pct} className="h-1.5 flex-1" />
                        <span className="text-[11px] tabular-nums text-muted-foreground shrink-0">
                          {prog.done}/{prog.total} steg
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <Button size="sm" onClick={() => setWorking(offer)} className="gap-1.5">
                        {started ? "Fortsett" : "Åpne oppdrag"}
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                      {(offer.status ?? "draft") === "draft" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 text-[11px] text-muted-foreground"
                          onClick={() => {
                            markOfferSent(offer.id);
                            toast.success("Markert som sendt", {
                              description: `${offer.offerNumber} er sendt til ${customerName}.`,
                            });
                          }}
                        >
                          Markér tilbud som sendt
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* Fullførte */}
      {completed.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-baseline gap-2">
            <h2 className="text-base font-semibold text-foreground">Fullførte leveranser</h2>
            <span className="text-xs text-muted-foreground tabular-nums">{completed.length}</span>
          </div>

          <div className="space-y-2">
            {completed.map((offer) => {
              const evCount = offer.evidenceIds?.length ?? 0;
              const deltaTotal =
                offer.impact?.maturityAfter && offer.impact?.maturityBefore
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
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0" />
                        <h3 className="text-sm font-semibold text-foreground truncate">
                          {offer.name}
                        </h3>
                        <span className="text-[11px] text-muted-foreground">
                          {offer.offerNumber}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        <FrameworkChips ids={offer.frameworkIds ?? []} />
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <FileText className="h-3 w-3" /> {evCount} bevis
                        </span>
                        {deltaTotal > 0 && (
                          <span className="inline-flex items-center gap-1 text-success font-medium">
                            <TrendingUp className="h-3 w-3" /> +{deltaTotal}% modenhet
                          </span>
                        )}
                        {offer.reportSentAt && (
                          <span className="inline-flex items-center gap-1 text-success">
                            <Send className="h-3 w-3" /> Rapport sendt
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 shrink-0">
                      <Button size="sm" variant="outline" onClick={() => setReportFor(offer)}>
                        Se rapport
                      </Button>
                      <Button size="sm" onClick={() => setReportFor(offer)} className="gap-1.5">
                        <Send className="h-3.5 w-3.5" />
                        {offer.reportSentAt ? "Send på nytt" : "Send til kunde"}
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      <div className="rounded-md border border-primary/20 bg-primary/5 p-3 flex items-start gap-2">
        <Sparkles className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
        <p className="text-[11px] text-foreground/80 leading-relaxed">
          Hvert oppdrag åpnes som et kort skjema. Fyll det ut, eller last opp dokumentet
          om det allerede finnes — Lara genererer rapporten som blir bevis på kravene og
          løfter kundens modenhet.
        </p>
      </div>

      {working && (
        <DeliveryWorkspaceDrawer
          open={!!working}
          onOpenChange={(o) => !o && setWorking(null)}
          offer={working}
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
