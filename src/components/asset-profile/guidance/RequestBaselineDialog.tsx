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
  archetypeByKey,
  recommendSourcingMethod,
  type SourcingMethod,
  type VendorArchetype,
} from "@/lib/vendorSourcingMethod";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendorName: string;
  archetype: VendorArchetype;
  /** Kalles med valgt innhentingsmetode når brukeren bekrefter. */
  onConfirm: (method: SourcingMethod) => void;
}

/**
 * Valg av innhentingsmetode. «Be om grunnlag» er ikke én handling — brukeren
 * velger hvem som gjør jobben. Laras anbefaling ligger øverst med begrunnelse.
 */
export function RequestBaselineDialog({
  open,
  onOpenChange,
  vendorName,
  archetype,
  onConfirm,
}: Props) {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";

  const recommendation = recommendSourcingMethod(archetypeByKey(archetype).signals);
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
