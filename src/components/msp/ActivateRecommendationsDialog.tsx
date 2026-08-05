import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { TermsAcceptRow } from "@/components/legal/TermsAcceptRow";
import { useTerms } from "@/hooks/useTerms";
import { Zap } from "lucide-react";

export interface ActivatableItem {
  id: string;
  label: string;
  kind: "framework" | "service" | "module";
  activatable: boolean;
  frameworkId?: string;
  moduleKey?: string;
  price?: number | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId: string;
  customerName: string;
  items: ActivatableItem[];
  activeFrameworks: string[];
  activeModules: string[];
  onActivated: () => void;
  onMoveToOffer: () => void;
}

function formatPrice(n: number) {
  return `${n.toLocaleString("nb-NO")} kr/mnd`;
}

export function ActivateRecommendationsDialog({
  open,
  onOpenChange,
  customerId,
  customerName,
  items,
  activeFrameworks,
  activeModules,
  onActivated,
  onMoveToOffer,
}: Props) {
  const [saving, setSaving] = useState(false);
  const [termsChecked, setTermsChecked] = useState(false);
  const { current: currentTerms, hasAcceptedCurrent, acceptTerms } = useTerms();
  const termsOk = termsChecked || hasAcceptedCurrent;

  const activatable = useMemo(() => items.filter((i) => i.activatable), [items]);
  const serviceItems = useMemo(() => items.filter((i) => !i.activatable), [items]);
  const monthlyTotal = activatable.reduce((sum, i) => sum + (i.price ?? 0), 0);

  const handleActivate = async () => {
    if (activatable.length === 0) return;
    setSaving(true);

    const nextFrameworks = Array.from(
      new Set([
        ...activeFrameworks,
        ...activatable.filter((i) => i.frameworkId).map((i) => i.frameworkId as string),
      ]),
    );
    const nextModules = Array.from(
      new Set([
        ...activeModules,
        ...activatable.filter((i) => i.moduleKey).map((i) => i.moduleKey as string),
      ]),
    );

    const { error } = await supabase
      .from("msp_customers" as any)
      .update({ active_frameworks: nextFrameworks, active_modules: nextModules } as any)
      .eq("id", customerId);

    if (error) {
      setSaving(false);
      toast.error("Kunne ikke aktivere", { description: error.message });
      return;
    }

    await acceptTerms("module_activation", `msp-customer:${customerId}`);
    setSaving(false);
    toast.success(
      activatable.length === 1
        ? `${activatable[0].label} aktivert hos ${customerName}`
        : `${activatable.length} valg aktivert hos ${customerName}`,
    );
    onActivated();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-medium">
            <Zap className="h-4 w-4 text-primary" />
            Aktiver hos {customerName}
          </DialogTitle>
          <DialogDescription className="text-xs">
            Dette slås på med én gang. Priser er eks. mva.
          </DialogDescription>
        </DialogHeader>

        {activatable.length > 0 && (
          <ul className="rounded-lg border divide-y">
            {activatable.map((i) => (
              <li key={i.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                <span className="text-foreground">{i.label}</span>
                <span className="text-xs text-muted-foreground tabular-nums shrink-0">
                  {i.price ? formatPrice(i.price) : "Inkludert"}
                </span>
              </li>
            ))}
            {monthlyTotal > 0 && (
              <li className="flex items-center justify-between gap-3 px-3 py-2 text-sm bg-muted/40">
                <span className="font-medium text-foreground">Sum</span>
                <span className="font-medium text-foreground tabular-nums">
                  {formatPrice(monthlyTotal)}
                </span>
              </li>
            )}
          </ul>
        )}

        {serviceItems.length > 0 && (
          <div className="rounded-lg border border-dashed p-3">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Leveres som oppdrag og kan ikke slås på:{" "}
              <span className="text-foreground">{serviceItems.map((i) => i.label).join(", ")}</span>.
            </p>
            <button
              type="button"
              onClick={() => {
                onOpenChange(false);
                onMoveToOffer();
              }}
              className="mt-2 text-xs font-medium text-primary hover:underline"
            >
              Legg i tilbud i stedet
            </button>
          </div>
        )}

        {activatable.length > 0 && (
          <TermsAcceptRow
            id={`terms-activate-${customerId}`}
            checked={termsOk}
            onCheckedChange={setTermsChecked}
            version={currentTerms?.version}
          />
        )}

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            Avbryt
          </Button>
          <Button
            size="sm"
            onClick={handleActivate}
            disabled={saving || !termsOk || activatable.length === 0}
          >
            {saving ? "Aktiverer…" : "Aktiver"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
