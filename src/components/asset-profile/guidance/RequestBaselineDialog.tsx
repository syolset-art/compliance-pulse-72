import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  SOURCING_METHOD_META,
  SOURCING_METHOD_ORDER,
  recommendSourcingMethod,
  type SourcingMethod,
  type SourcingSignals,
} from "@/lib/vendorSourcingMethod";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendorName: string;
  /** Signaler Lara har utledet fra leverandørdata. */
  signals: SourcingSignals;
  /** Kort segment-etikett Lara har utledet (f.eks. «Offentlig virksomhet»). */
  segmentLabel?: string;
  /** Kalles med valgt innhentingsmetode når brukeren bekrefter. */
  onConfirm: (method: SourcingMethod) => void;
  /** Alltid tilgjengelig: last opp dokumentasjon kunden allerede har (ROS/DPIA/DPA). */
  onUploadExisting: () => void;
}

/**
 * Valg av innhentingsmetode. «Be om grunnlag» er ikke én handling — brukeren
 * velger hvem som gjør jobben. Laras anbefaling ligger øverst med begrunnelse.
 */
export function RequestBaselineDialog({
  open,
  onOpenChange,
  vendorName,
  signals,
  segmentLabel,
  onConfirm,
  onUploadExisting,
}: Props) {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";

  const recommendation = recommendSourcingMethod(signals);
  const [selected, setSelected] = useState<SourcingMethod>(recommendation.primary);

  // Anbefalingen først, deretter resten i fast rekkefølge.
  const ordered: SourcingMethod[] = [
    recommendation.primary,
    ...SOURCING_METHOD_ORDER.filter((m) => m !== recommendation.primary),
  ];

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (o) setSelected(recommendation.primary);
        onOpenChange(o);
      }}
    >
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {isNb ? `Be om grunnlag fra ${vendorName}` : `Request evidence from ${vendorName}`}
          </DialogTitle>
          <DialogDescription>
            {segmentLabel && (
              <span className="block text-foreground/80 font-medium mb-1">{segmentLabel}</span>
            )}
            {isNb ? recommendation.rationale.nb : recommendation.rationale.en}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          {ordered.map((key) => {
            const meta = SOURCING_METHOD_META[key];
            const isRecommended = key === recommendation.primary;
            const isSelected = key === selected;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelected(key)}
                className={cn(
                  "w-full text-left rounded-lg border p-3 transition-colors",
                  isSelected ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50",
                )}
              >
                <div className="flex items-start gap-2">
                  <span
                    className={cn(
                      "mt-0.5 h-4 w-4 rounded-full border flex items-center justify-center shrink-0",
                      isSelected ? "border-primary bg-primary" : "border-border",
                    )}
                  >
                    {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium text-foreground">
                        {isNb ? meta.label.nb : meta.label.en}
                      </span>
                      {isRecommended && (
                        <Badge variant="secondary" className="gap-1 text-[10px]">
                          <Sparkles className="h-3 w-3" />
                          {isNb ? "Laras anbefaling" : "Lara's recommendation"}
                        </Badge>
                      )}
                    </div>
                    <p className="text-[12px] text-muted-foreground mt-1 leading-relaxed">
                      {isNb ? meta.description.nb : meta.description.en}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      {isNb ? meta.vendorEffortLabel.nb : meta.vendorEffortLabel.en}
                      {" · "}
                      {isNb ? "Bevisnivå: " : "Evidence level: "}
                      {isNb ? meta.evidenceLabel.nb : meta.evidenceLabel.en}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="rounded-lg border border-dashed border-border p-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground">
              {isNb ? "Jeg har allerede dokumentasjon" : "I already have documentation"}
            </p>
            <p className="text-[12px] text-muted-foreground mt-0.5 leading-relaxed">
              {isNb
                ? "ROS-analyse, DPIA, databehandleravtale eller sertifikater du har fått tidligere — last opp og la Lara koble det mot kravene."
                : "Risk assessment, DPIA, DPA or certificates you already received — upload and let Lara map it to the requirements."}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="shrink-0"
            onClick={() => {
              onOpenChange(false);
              onUploadExisting();
            }}
          >
            {isNb ? "Last opp" : "Upload"}
          </Button>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {isNb ? "Avbryt" : "Cancel"}
          </Button>
          <Button
            onClick={() => {
              onConfirm(selected);
              onOpenChange(false);
            }}
          >
            {isNb ? SOURCING_METHOD_META[selected].cta.nb : SOURCING_METHOD_META[selected].cta.en}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
