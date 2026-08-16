import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles } from "lucide-react";
import { isModuleDeactivated } from "@/lib/moduleActivationState";
import { getActivationTarget } from "@/lib/moduleActivationTargets";
import { MODULE_INFO, type ModuleKey } from "@/lib/moduleInfo";
import { useModuleActivation } from "@/hooks/useModuleActivation";
import { TermsGateDialog } from "@/components/legal/TermsGateDialog";
import { ModuleChangeReceiptSheet } from "@/components/subscriptions/ModuleChangeReceiptSheet";

interface ModuleActivationGateProps {
  moduleKey: ModuleKey;
  /** Vises når modulen er aktiv. */
  children: React.ReactNode;
}

/**
 * Skjuler modulinnholdet til produktet er aktivert. Aktiveringen følger samme
 * flyt som de andre produktene: Aktiver → vilkår → kvittering.
 */
export function ModuleActivationGate({ moduleKey, children }: ModuleActivationGateProps) {
  const [active, setActive] = useState(() => !isModuleDeactivated(moduleKey));
  const { pending, setPending, requestActivation, confirmActivation, receipt, setReceipt } =
    useModuleActivation();

  useEffect(() => {
    const sync = () => setActive(!isModuleDeactivated(moduleKey));
    sync();
    window.addEventListener("modules:changed", sync);
    return () => window.removeEventListener("modules:changed", sync);
  }, [moduleKey]);

  if (active) return <>{children}</>;

  const info = MODULE_INFO[moduleKey];
  const target = getActivationTarget(moduleKey, info.title);
  const priceKr = target.monthlyPriceKr ?? 0;

  return (
    <>
      <div className="container max-w-2xl mx-auto px-4 py-12">
        <Card>
          <CardContent className="p-6 space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-xl font-bold text-foreground">{info.title}</h1>
                <p className="text-sm text-muted-foreground mt-1">{info.tagline}</p>
              </div>
              <Badge variant="secondary">
                {priceKr === 0 ? "0 kr/mnd" : `${priceKr} kr/mnd`}
              </Badge>
            </div>

            <p className="text-sm text-muted-foreground">{info.description}</p>

            <ul className="space-y-2">
              {info.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-foreground">
                  <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
              Tjenesten aktiveres umiddelbart, og faktureres på neste faktura
              {priceKr === 0 ? " (0 kr — inkludert)." : " (eks. mva)."}
            </div>

            <Button
              className="w-full gap-2"
              onClick={() => requestActivation(moduleKey, { monthlyPriceKr: priceKr })}
            >
              <Sparkles className="h-4 w-4" />
              Aktiver {info.title}
            </Button>
          </CardContent>
        </Card>
      </div>

      <TermsGateDialog
        open={!!pending}
        onOpenChange={(open) => !open && setPending(null)}
        title={`Aktiver ${pending?.title ?? info.title}`}
        description="Bekreft vilkårene for å aktivere produktet."
        monthlyPriceKr={pending?.monthlyPriceKr}
        priceLabel="Månedspris"
        context="module_activation"
        contextRef={pending?.key}
        onConfirmed={confirmActivation}
      />

      <ModuleChangeReceiptSheet
        receipt={receipt}
        onOpenChange={(open) => !open && setReceipt(null)}
      />
    </>
  );
}
