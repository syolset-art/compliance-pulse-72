import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, ArrowLeft, FileText, Sparkles, Upload, TrendingUp, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { frameworks as ALL_FRAMEWORKS } from "@/lib/frameworkDefinitions";
import { getPartnerEvidence, DOC_TYPE_LABEL, type PartnerEvidence } from "@/lib/partnerEvidence";
import { markOfferDelivered, deriveFrameworkIdsFromTemplates, type SavedOffer } from "@/lib/customerOffers";
import { computeDeliveryImpact, totalMaturityDelta } from "@/lib/deliveryImpact";
import { PartnerEvidenceUploadDialog } from "@/components/msp/PartnerEvidenceUploadDialog";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  offer: SavedOffer;
  customerId: string;
  customerName: string;
  activeFrameworkIds: string[];
  onDelivered?: (offerId: string) => void;
}

export function CompleteDeliveryDialog({
  open,
  onOpenChange,
  offer,
  customerId,
  customerName,
  activeFrameworkIds,
  onDelivered,
}: Props) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [uploadOpen, setUploadOpen] = useState(false);

  // Regelverk — forhåndsvalgt fra tilbudets tjenester
  const suggestedFrameworks = useMemo(() => {
    const derived = deriveFrameworkIdsFromTemplates(offer.templateIds || []);
    // Prioriter regelverk kunden faktisk har aktivert
    const active = new Set(activeFrameworkIds);
    const intersect = derived.filter((id) => active.has(id));
    return intersect.length > 0 ? intersect : derived;
  }, [offer.templateIds, activeFrameworkIds]);

  const availableFrameworks = useMemo(() => {
    const set = new Set<string>([...activeFrameworkIds, ...suggestedFrameworks]);
    return Array.from(set);
  }, [activeFrameworkIds, suggestedFrameworks]);

  const [selectedFw, setSelectedFw] = useState<Set<string>>(new Set());
  const [evidence, setEvidence] = useState<PartnerEvidence[]>([]);
  const [selectedEv, setSelectedEv] = useState<Set<string>>(new Set());

  const refreshEvidence = () => setEvidence(getPartnerEvidence(customerId));

  useEffect(() => {
    if (!open) return;
    setStep(1);
    setSelectedFw(new Set(suggestedFrameworks));
    refreshEvidence();
  }, [open, suggestedFrameworks, customerId]);

  useEffect(() => {
    if (!open) return;
    refreshEvidence();
  }, [uploadOpen, open]);

  const toggleFw = (id: string) => {
    setSelectedFw((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
  const toggleEv = (id: string) => {
    setSelectedEv((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const impact = useMemo(
    () => computeDeliveryImpact(customerId, Array.from(selectedEv)),
    [customerId, selectedEv],
  );
  const totalDelta = totalMaturityDelta(impact);

  const confirm = () => {
    if (selectedFw.size === 0) {
      toast.error("Velg minst ett regelverk");
      return;
    }
    markOfferDelivered(offer.id, {
      frameworkIds: Array.from(selectedFw),
      evidenceIds: Array.from(selectedEv),
      impact: {
        maturityBefore: Object.fromEntries(impact.map((r) => [r.area, r.before])),
        maturityAfter: Object.fromEntries(impact.map((r) => [r.area, r.after])),
      },
    });
    toast.success("Leveranse fullført", {
      description: `${offer.name} er registrert som levert. Modenhet +${totalDelta}%.`,
    });
    onDelivered?.(offer.id);
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col p-0">
          <DialogHeader className="p-5 pb-3 border-b border-border">
            <DialogTitle>Fullfør leveranse</DialogTitle>
            <div className="flex items-center gap-1.5 mt-1">
              <StepPill n={1} active={step === 1} done={step > 1} label="Regelverk" />
              <StepPill n={2} active={step === 2} done={step > 2} label="Bevis" />
              <StepPill n={3} active={step === 3} done={false} label="Bekreft" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {offer.name} · Tilbud {offer.offerNumber}
            </p>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-5">
            {step === 1 && (
              <div className="space-y-4">
                <div className="rounded-md border border-primary/20 bg-primary/5 p-3 flex items-start gap-2">
                  <Sparkles className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <p className="text-xs text-foreground/85">
                    Lara har foreslått regelverk basert på tjenestene i tilbudet.
                    Juster utvalget om nødvendig.
                  </p>
                </div>
                <div className="space-y-2">
                  {availableFrameworks.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Kunden har ikke aktivert noen regelverk enda.
                    </p>
                  ) : (
                    availableFrameworks.map((id) => {
                      const fw = ALL_FRAMEWORKS.find((f) => f.id === id);
                      const isSuggested = suggestedFrameworks.includes(id);
                      return (
                        <label
                          key={id}
                          className="flex items-center gap-3 rounded-lg border border-border/60 p-3 hover:bg-muted/30 cursor-pointer"
                        >
                          <Checkbox
                            checked={selectedFw.has(id)}
                            onCheckedChange={() => toggleFw(id)}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground">
                              {fw?.name || id.toUpperCase()}
                            </p>
                            {fw?.description && (
                              <p className="text-xs text-muted-foreground line-clamp-1">
                                {fw.description}
                              </p>
                            )}
                          </div>
                          {isSuggested && (
                            <Badge variant="outline" className="text-[10px] gap-1 border-primary/40 text-primary">
                              <Sparkles className="h-2.5 w-2.5" /> Foreslått
                            </Badge>
                          )}
                        </label>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-foreground/85">
                    Velg bevis som er del av leveransen.
                  </p>
                  <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setUploadOpen(true)}>
                    <Upload className="h-3.5 w-3.5" /> Last opp nytt
                  </Button>
                </div>
                {evidence.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border p-6 text-center">
                    <FileText className="h-5 w-5 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-foreground">Ingen bevis lastet opp enda</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Last opp dokumenter og la Lara koble dem til kravene.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {evidence.map((e) => {
                      const totalControls = e.frameworks.reduce((s, f) => s + f.controlIds.length, 0);
                      return (
                        <label
                          key={e.id}
                          className="flex items-start gap-3 rounded-lg border border-border/60 p-3 hover:bg-muted/30 cursor-pointer"
                        >
                          <Checkbox
                            checked={selectedEv.has(e.id)}
                            onCheckedChange={() => toggleEv(e.id)}
                            className="mt-0.5"
                          />
                          <FileText className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {e.fileName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {DOC_TYPE_LABEL[e.docType]} · {totalControls}{" "}
                              {totalControls === 1 ? "kontroll" : "kontroller"}
                            </p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {e.frameworks.map((f) => (
                                <Badge key={f.framework} variant="outline" className="text-[10px] py-0">
                                  {f.label}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <div className="rounded-lg border border-success/25 bg-success/5 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="h-4 w-4 text-success" />
                    <p className="text-sm font-semibold text-foreground">Forventet effekt</p>
                    <Badge className="ml-auto bg-success/20 text-success border-success/30 tabular-nums">
                      +{totalDelta}%
                    </Badge>
                  </div>
                  <div className="space-y-2.5">
                    {impact.map((r) => (
                      <div key={r.area}>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-foreground/80">{r.label}</span>
                          <span className="tabular-nums text-muted-foreground">
                            {r.before}% →{" "}
                            <span className="font-semibold text-success">{r.after}%</span>
                          </span>
                        </div>
                        <div className="relative h-1.5 rounded-full bg-muted overflow-hidden">
                          <div className="absolute inset-y-0 left-0 bg-muted-foreground/40" style={{ width: `${r.before}%` }} />
                          <div className="absolute inset-y-0 bg-success" style={{ left: `${r.before}%`, width: `${r.after - r.before}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-lg border border-border/60 p-3">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Regelverk</p>
                    <p className="text-lg font-semibold text-foreground tabular-nums">{selectedFw.size}</p>
                  </div>
                  <div className="rounded-lg border border-border/60 p-3">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Bevis</p>
                    <p className="text-lg font-semibold text-foreground tabular-nums">{selectedEv.size}</p>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground text-center">
                  Etter fullføring kan du sende leveranserapporten til {customerName}.
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="p-4 border-t border-border bg-muted/20">
            {step > 1 ? (
              <Button variant="outline" onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3)} className="gap-1">
                <ArrowLeft className="h-4 w-4" /> Tilbake
              </Button>
            ) : (
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Avbryt
              </Button>
            )}
            {step < 3 ? (
              <Button onClick={() => setStep((s) => (s + 1) as 1 | 2 | 3)} className="gap-1">
                Neste <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={confirm} className="gap-1.5">
                <CheckCircle2 className="h-4 w-4" /> Fullfør og generer rapport
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PartnerEvidenceUploadDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        customerId={customerId}
        presetFrameworkIds={Array.from(selectedFw)}
      />
    </>
  );
}

function StepPill({ n, active, done, label }: { n: number; active: boolean; done: boolean; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span
        className={`inline-flex items-center justify-center h-5 w-5 rounded-full text-[10px] font-semibold ${
          done
            ? "bg-success text-success-foreground"
            : active
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground"
        }`}
      >
        {done ? "✓" : n}
      </span>
      <span className={`text-xs ${active ? "text-foreground font-medium" : "text-muted-foreground"}`}>
        {label}
      </span>
      {n < 3 && <span className="text-muted-foreground/40 mx-1">·</span>}
    </div>
  );
}
