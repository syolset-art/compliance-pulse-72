import { useEffect, useMemo, useState } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ArrowLeft,
  CheckCircle2,
  FileText,
  ClipboardList,
  Sparkles,
  TrendingUp,
  Upload,
  Loader2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { frameworks as ALL_FRAMEWORKS } from "@/lib/frameworkDefinitions";
import {
  markOfferDelivered,
  deriveFrameworkIdsFromTemplates,
  type SavedOffer,
} from "@/lib/customerOffers";
import { computeDeliveryImpact, totalMaturityDelta } from "@/lib/deliveryImpact";
import {
  getPartnerEvidence,
  addPartnerEvidence,
  laraSuggestForDocType,
  DOC_TYPE_LABEL,
  type PartnerEvidence,
} from "@/lib/partnerEvidence";
import { PartnerEvidenceUploadDialog } from "@/components/msp/PartnerEvidenceUploadDialog";
import {
  pickDeliveryFormTemplate,
  loadDeliveryForm,
  saveDeliveryForm,
  deliveryFormProgress,
  type DeliveryFormState,
} from "@/lib/deliveryFormTemplates";
import { DeliveryFormStepper } from "./DeliveryFormStepper";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  offer: SavedOffer;
  customerId: string;
  customerName: string;
  activeFrameworkIds: string[];
  onDelivered?: (offerId: string) => void;
}

type Mode = "choose" | "form" | "upload";

export function DeliveryWorkspaceDrawer({
  open,
  onOpenChange,
  offer,
  customerId,
  customerName,
  activeFrameworkIds,
  onDelivered,
}: Props) {
  const template = useMemo(
    () => pickDeliveryFormTemplate({ name: offer.name, templateIds: offer.templateIds }),
    [offer.name, offer.templateIds],
  );

  const [mode, setMode] = useState<Mode>("choose");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [evidence, setEvidence] = useState<PartnerEvidence[]>([]);
  const [selectedEv, setSelectedEv] = useState<Set<string>>(new Set());

  const [form, setForm] = useState<DeliveryFormState>(() => ({
    templateId: template.id,
    values: {},
    skipped: {},
    updatedAt: new Date().toISOString(),
  }));

  // Regelverk oppdraget skal styrke
  const suggestedFrameworks = useMemo(() => {
    const derived = deriveFrameworkIdsFromTemplates(offer.templateIds || []);
    const active = new Set(activeFrameworkIds);
    const intersect = derived.filter((id) => active.has(id));
    return intersect.length > 0 ? intersect : derived;
  }, [offer.templateIds, activeFrameworkIds]);

  const [selectedFw, setSelectedFw] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!open) return;
    const stored = loadDeliveryForm(offer.id);
    setForm(
      stored && stored.templateId === template.id
        ? stored
        : { templateId: template.id, values: {}, skipped: {}, updatedAt: new Date().toISOString() },
    );
    setSelectedFw(new Set(suggestedFrameworks));
    setEvidence(getPartnerEvidence(customerId));
    setSelectedEv(new Set());
    setMode(stored && Object.keys(stored.values).length > 0 ? "form" : "choose");
  }, [open, offer.id, template.id, suggestedFrameworks, customerId]);

  useEffect(() => {
    if (!open) return;
    setEvidence(getPartnerEvidence(customerId));
  }, [uploadOpen, open, customerId]);

  const updateForm = (next: DeliveryFormState) => {
    setForm(next);
    saveDeliveryForm(offer.id, next);
  };

  const progress = deliveryFormProgress(template, form);
  const pct = progress.total ? Math.round((progress.done / progress.total) * 100) : 0;

  const availableFrameworks = useMemo(() => {
    return Array.from(new Set([...activeFrameworkIds, ...suggestedFrameworks]));
  }, [activeFrameworkIds, suggestedFrameworks]);

  const previewEvidenceIds = useMemo(() => Array.from(selectedEv), [selectedEv]);
  const impact = useMemo(
    () => computeDeliveryImpact(customerId, previewEvidenceIds),
    [customerId, previewEvidenceIds],
  );
  const totalDelta = totalMaturityDelta(impact);

  const toggleFw = (id: string) =>
    setSelectedFw((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  const toggleEv = (id: string) =>
    setSelectedEv((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  const canFinish =
    selectedFw.size > 0 && (progress.done > 0 || selectedEv.size > 0);

  /** Autogenerer rapport fra skjemaet, registrer som bevis og marker levert. */
  const generateAndFinish = () => {
    if (selectedFw.size === 0) {
      toast.error("Velg minst ett regelverk leveransen skal styrke");
      return;
    }
    setGenerating(true);
    setTimeout(() => {
      const evidenceIds = new Set(selectedEv);

      if (progress.done > 0) {
        const suggestion = laraSuggestForDocType(template.docType);
        const fwFilter = new Set(Array.from(selectedFw).map((s) => s.toLowerCase()));
        const mapped = suggestion.frameworks.filter((f) =>
          fwFilter.size ? fwFilter.has(f.framework.toLowerCase()) : true,
        );
        const generated: PartnerEvidence = {
          id: crypto.randomUUID(),
          customerId,
          fileName: `${template.label} – ${customerName} (${new Date().toLocaleDateString("nb-NO")}).pdf`,
          docType: template.docType,
          note: `Autogenerert rapport fra leveranseskjema for ${offer.name} (${offer.offerNumber}).`,
          uploadedAt: new Date().toISOString(),
          uploadedByName: "Lara",
          uploadedByPartner: "MSSP Partner",
          frameworks: mapped.length > 0 ? mapped : suggestion.frameworks,
          maturityDelta: suggestion.maturityDelta,
        };
        addPartnerEvidence(generated);
        evidenceIds.add(generated.id);
      }

      const ids = Array.from(evidenceIds);
      const finalImpact = computeDeliveryImpact(customerId, ids);
      markOfferDelivered(offer.id, {
        frameworkIds: Array.from(selectedFw),
        evidenceIds: ids,
        impact: {
          maturityBefore: Object.fromEntries(finalImpact.map((r) => [r.area, r.before])),
          maturityAfter: Object.fromEntries(finalImpact.map((r) => [r.area, r.after])),
        },
      });
      setGenerating(false);
      toast.success("Leveransen er dokumentert", {
        description: `Rapport generert som bevis. Modenhet +${totalMaturityDelta(finalImpact)}%.`,
      });
      onDelivered?.(offer.id);
      onOpenChange(false);
    }, 800);
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-2xl p-0 flex flex-col gap-0"
        >
          {/* Header */}
          <header className="border-b border-border p-5 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                  Pågående oppdrag
                </p>
                <h2 className="text-base font-semibold text-foreground truncate">
                  {offer.name}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {customerName} · Tilbud {offer.offerNumber} · {template.label}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0"
                onClick={() => onOpenChange(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex flex-wrap gap-1">
              {availableFrameworks.map((id) => {
                const fw = ALL_FRAMEWORKS.find((f) => f.id === id);
                const on = selectedFw.has(id);
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => toggleFw(id)}
                    className={cn(
                      "rounded-full border px-2.5 py-0.5 text-[11px] transition-colors",
                      on
                        ? "border-primary/40 bg-primary/10 text-primary font-medium"
                        : "border-border/70 text-muted-foreground hover:bg-muted/50",
                    )}
                  >
                    {fw?.name || id.toUpperCase()}
                  </button>
                );
              })}
              {availableFrameworks.length === 0 && (
                <span className="text-[11px] text-muted-foreground italic">
                  Ingen regelverk aktivert enda
                </span>
              )}
            </div>

            {mode === "form" && (
              <div className="flex items-center gap-3">
                <Progress value={pct} className="h-1.5 flex-1" />
                <span className="text-[11px] tabular-nums text-muted-foreground shrink-0">
                  {progress.done} av {progress.total} steg
                </span>
              </div>
            )}
          </header>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {mode === "choose" && (
              <div className="space-y-3">
                <p className="text-sm text-foreground/80">
                  Hvordan vil du dokumentere denne leveransen?
                </p>

                <button
                  type="button"
                  onClick={() => setMode("form")}
                  className="w-full text-left rounded-xl border border-border/70 hover:border-primary/40 hover:bg-primary/[0.03] transition-colors p-4 flex items-start gap-3"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                    <ClipboardList className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-foreground">
                      Fyll ut skjema
                    </span>
                    <span className="block text-xs text-muted-foreground mt-0.5">
                      {template.steps.length} korte steg tilpasset «{template.label}». Lagres
                      automatisk, og Lara genererer rapporten for deg til slutt.
                    </span>
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMode("upload");
                    setUploadOpen(true);
                  }}
                  className="w-full text-left rounded-xl border border-border/70 hover:border-primary/40 hover:bg-primary/[0.03] transition-colors p-4 flex items-start gap-3"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-foreground/70 shrink-0">
                    <Upload className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-foreground">
                      Jeg har allerede dokumentet
                    </span>
                    <span className="block text-xs text-muted-foreground mt-0.5">
                      Last opp rapporten eller kursbeviset. Lara leser dokumentet og
                      foreslår hvilke krav det dekker.
                    </span>
                  </span>
                </button>
              </div>
            )}

            {mode === "form" && (
              <>
                <div className="rounded-md border border-primary/20 bg-primary/5 p-3 flex items-start gap-2">
                  <Sparkles className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                  <p className="text-xs text-foreground/85 leading-relaxed">
                    Fyll ut det du har. Steg du ikke trenger kan merkes «Ikke aktuelt».
                    Når du er ferdig genererer Lara en rapport som blir bevis på kravene.
                  </p>
                </div>
                <DeliveryFormStepper template={template} state={form} onChange={updateForm} />
              </>
            )}

            {mode === "upload" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">
                    Dokumenter på {customerName}
                  </p>
                  <Button size="sm" variant="outline" className="gap-1.5 h-7 text-xs" onClick={() => setUploadOpen(true)}>
                    <Upload className="h-3.5 w-3.5" /> Last opp
                  </Button>
                </div>
                {evidence.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border p-6 text-center">
                    <FileText className="h-5 w-5 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-foreground">Ingen dokumenter enda</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Last opp rapporten så kobler Lara den til kravene.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {evidence.map((e) => {
                      const n = e.frameworks.reduce((s, f) => s + f.controlIds.length, 0);
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
                            <p className="text-sm font-medium text-foreground truncate">{e.fileName}</p>
                            <p className="text-xs text-muted-foreground">
                              {DOC_TYPE_LABEL[e.docType]} · {n} {n === 1 ? "kontroll" : "kontroller"}
                            </p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {(selectedEv.size > 0 || progress.done > 0) && mode !== "choose" && (
              <div className="rounded-lg border border-success/25 bg-success/5 p-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-3.5 w-3.5 text-success" />
                  <p className="text-xs font-medium text-foreground">Forventet modenhetsløft</p>
                  <Badge className="ml-auto bg-success/20 text-success border-success/30 text-[11px] tabular-nums">
                    +{totalDelta}%
                  </Badge>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <footer className="border-t border-border p-4 bg-muted/20 flex items-center justify-between gap-3">
            {mode === "choose" ? (
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Lukk
              </Button>
            ) : (
              <Button variant="ghost" className="gap-1.5" onClick={() => setMode("choose")}>
                <ArrowLeft className="h-4 w-4" /> Endre metode
              </Button>
            )}
            {mode !== "choose" && (
              <Button onClick={generateAndFinish} disabled={!canFinish || generating} className="gap-1.5">
                {generating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Lara genererer rapport…
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" /> Generer rapport og marker levert
                  </>
                )}
              </Button>
            )}
          </footer>
        </SheetContent>
      </Sheet>

      <PartnerEvidenceUploadDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        customerId={customerId}
        presetFrameworkIds={Array.from(selectedFw)}
      />
    </>
  );
}
