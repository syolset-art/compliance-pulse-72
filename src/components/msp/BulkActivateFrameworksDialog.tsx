import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { TermsAcceptRow } from "@/components/legal/TermsAcceptRow";
import { useTerms } from "@/hooks/useTerms";

const FRAMEWORK_PRICE = 490;

export interface BulkActivationCustomer {
  id: string;
  name: string;
  /** Regelverk som allerede er aktive (navn). */
  activeFrameworks: string[];
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  customers: BulkActivationCustomer[];
  /** Regelverk som skal aktiveres (navn). */
  frameworkNames: string[];
  onActivated?: () => void;
}

/**
 * Aktiverer valgte regelverk hos flere kunder i én operasjon, med vilkår og
 * driftspartner-bekreftelse for hele bulk-operasjonen.
 */
export function BulkActivateFrameworksDialog({
  open,
  onOpenChange,
  customers,
  frameworkNames,
  onActivated,
}: Props) {
  const { current: currentTerms, hasAcceptedCurrent, acceptances, acceptTerms } = useTerms();
  const [termsChecked, setTermsChecked] = useState(false);
  const [operatorRole, setOperatorRole] = useState(false);
  const [operatorScope, setOperatorScope] = useState<"customer" | "global">("customer");
  const [saving, setSaving] = useState(false);

  const hasOperatorRole = acceptances.some((a) => a.operator_role);
  const termsOk = termsChecked || hasAcceptedCurrent;
  const canActivate = termsOk && (hasOperatorRole || operatorRole) && customers.length > 0;

  useEffect(() => {
    if (!open) return;
    setTermsChecked(false);
    setOperatorRole(false);
  }, [open]);

  const rows = customers.map((c) => {
    const missing = frameworkNames.filter((f) => !c.activeFrameworks.includes(f));
    return { ...c, missing, monthly: missing.length * FRAMEWORK_PRICE };
  });
  const totalMonthly = rows.reduce((s, r) => s + r.monthly, 0);
  const affected = rows.filter((r) => r.missing.length > 0);

  const handleActivate = async () => {
    setSaving(true);
    let ok = 0;
    let failed = 0;
    for (const r of affected) {
      const next = Array.from(new Set([...r.activeFrameworks, ...r.missing]));
      const { error } = await supabase
        .from("msp_customers" as any)
        .update({ active_frameworks: next } as any)
        .eq("id", r.id);
      if (error) failed++;
      else ok++;
    }
    await acceptTerms("framework_activation", `bulk:${affected.length}`, {
      operatorRole: hasOperatorRole || operatorRole,
      operatorScope,
    });
    setSaving(false);

    if (ok > 0) {
      toast.success(`Regelverk aktivert hos ${ok} kunde${ok === 1 ? "" : "r"}`, {
        description: `${frameworkNames.join(", ")} · ${totalMonthly} kr per måned eks. mva.`,
      });
    }
    if (failed > 0) toast.error(`Kunne ikke aktivere hos ${failed} kunde(r)`);
    onActivated?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base">Aktiver regelverk hos valgte kunder</DialogTitle>
          <DialogDescription className="text-xs">
            {frameworkNames.join(", ")} aktiveres hos {affected.length} kunde
            {affected.length === 1 ? "" : "r"}. {FRAMEWORK_PRICE} kr per regelverk per måned eks. mva. Tjenesten aktiveres umiddelbart, og faktureres på neste faktura.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-56 pr-3">
          <div className="space-y-1.5">
            {rows.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-border p-2.5 text-xs"
              >
                <div className="min-w-0">
                  <div className="font-medium text-foreground truncate">{r.name}</div>
                  <div className="text-muted-foreground truncate">
                    {r.missing.length > 0 ? r.missing.join(", ") : "Alt allerede aktivert"}
                  </div>
                </div>
                <span className="shrink-0 tabular-nums text-muted-foreground">
                  {r.missing.length > 0 ? `${r.monthly} kr/mnd` : <CheckCircle2 className="h-3.5 w-3.5 text-success" />}
                </span>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="flex items-center justify-between text-xs border-t border-border pt-3">
          <span className="text-muted-foreground">Samlet månedspris (eks. mva.)</span>
          <span className="font-semibold text-foreground tabular-nums">{totalMonthly} kr</span>
        </div>

        <TermsAcceptRow
          id="bulk-framework-terms"
          checked={termsOk}
          onCheckedChange={setTermsChecked}
          disabled={hasAcceptedCurrent}
          version={currentTerms?.version}
        />

        {hasOperatorRole ? (
          <p className="text-xs text-muted-foreground flex items-start gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-success mt-0.5 shrink-0" />
            Driftspartner-rollen er allerede bekreftet.
          </p>
        ) : (
          <div className="flex flex-wrap items-start gap-2 rounded-lg border border-border bg-muted/30 p-3">
            <Checkbox
              id="bulk-operator"
              checked={operatorRole}
              onCheckedChange={(v) => setOperatorRole(v === true)}
              className="mt-0.5"
            />
            <label htmlFor="bulk-operator" className="text-xs text-muted-foreground leading-relaxed cursor-pointer">
              <span className="text-foreground font-medium">Vi tar rollen som driftspartner.</span> Da kan vi arbeide
              med compliance i kundenes egne virksomhetsprofiler på deres vegne.
            </label>
                {operatorRole && (
                  <div className="mt-2 basis-full ml-6 flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] text-muted-foreground">Gjelder:</span>
                    {([{ value: "customer" as const, label: "Kun valgte kunder" }, { value: "global" as const, label: "Alle kunder (globalt)" }]).map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setOperatorScope(opt.value)}
                        aria-pressed={operatorScope === opt.value}
                        className={`rounded-full border px-2.5 py-0.5 text-[11px] transition-colors ${
                          operatorScope === opt.value
                            ? "border-primary bg-primary/10 text-foreground font-medium"
                            : "border-border text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}

          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Avbryt
          </Button>
          <Button onClick={handleActivate} disabled={!canActivate || saving}>
            {saving ? "Aktiverer…" : `Aktiver (${affected.length})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
