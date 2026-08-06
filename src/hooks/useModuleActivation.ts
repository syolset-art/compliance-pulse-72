import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { activateModule } from "@/lib/moduleActivationState";
import { getActivationTarget } from "@/lib/moduleActivationTargets";
import type { ModuleChangeReceipt } from "@/components/subscriptions/ModuleChangeReceiptSheet";
import { useTerms } from "@/hooks/useTerms";

export interface PendingActivation {
  key: string;
  title: string;
  monthlyPriceKr: number;
  /** Nivåetikett når produktet har nivåer. */
  tierLabel?: string;
}

/**
 * Én felles aktiveringsflyt: Aktiver → vilkårsdialog → kvittering.
 * Etter at vilkårene er bekreftet skal det ikke komme flere dialoger —
 * kvitteringen gir lenken rett inn i modulen.
 */
export function useModuleActivation(onActivated?: (key: string) => void) {
  const navigate = useNavigate();
  const { current: currentTerms } = useTerms();
  const [pending, setPending] = useState<PendingActivation | null>(null);
  const [receipt, setReceipt] = useState<ModuleChangeReceipt | null>(null);

  const requestActivation = useCallback(
    (key: string, overrides?: Partial<PendingActivation>) => {
      const target = getActivationTarget(key, overrides?.title);
      setPending({
        key,
        title: overrides?.title ?? target.title,
        monthlyPriceKr: overrides?.monthlyPriceKr ?? target.monthlyPriceKr ?? 0,
        tierLabel: overrides?.tierLabel,
      });
    },
    [],
  );

  const buildReceipt = useCallback(
    (activation: PendingActivation): ModuleChangeReceipt => {
      const target = getActivationTarget(activation.key, activation.title);
      return {
        moduleId: activation.key,
        moduleTitle: activation.title,
        kind: "activation",
        toLabel: activation.tierLabel ?? "Aktivert",
        monthlyPriceKr: activation.monthlyPriceKr,
        termsVersion: currentTerms?.version,
        acceptedAt: new Date().toISOString(),
        nextSteps: target.nextSteps.map((s) => ({
          label: s.label,
          description: s.description,
          onClick: () => {
            setReceipt(null);
            navigate(s.route);
          },
        })),
      };
    },
    [currentTerms?.version, navigate],
  );

  /** Kalles når vilkårene er bekreftet i TermsGateDialog. */
  const confirmActivation = useCallback(() => {
    if (!pending) return;
    activateModule(pending.key);
    onActivated?.(pending.key);
    setReceipt(buildReceipt(pending));
    setPending(null);
  }, [pending, buildReceipt, onActivated]);

  return {
    pending,
    setPending,
    requestActivation,
    confirmActivation,
    receipt,
    setReceipt,
    buildReceipt,
    termsVersion: currentTerms?.version,
  };
}
