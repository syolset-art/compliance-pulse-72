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
import { toast } from "sonner";
import { CheckCircle2, Mail, ShieldCheck, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { TermsAcceptRow } from "@/components/legal/TermsAcceptRow";
import { useTerms } from "@/hooks/useTerms";
import { useCustomerBaseline } from "@/hooks/useCustomerBaseline";
import { activateModule } from "@/lib/moduleActivationState";
import { markClaimSent } from "@/lib/trustCenterStatus";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId: string;
  customerName: string;
  customerOrgNumber?: string | null;
  customerEmail?: string;
  activeModules: string[];
  onActivated?: () => void;
  /** Åpner veiledningspanelet etter aktivering. */
  onOpenGuide?: () => void;
}

/** Anbefalt modenhet før kunden bør claime Trust Profilen. */
const CLAIM_THRESHOLD = 55;

/**
 * Tre-stegs aktivering av Trust Center hos en kunde:
 * vilkår (+ driftspartnerrolle) → praktisk oppsett/claim → hva nå.
 */
export function ActivateTrustCenterDialog({
  open,
  onOpenChange,
  customerId,
  customerName,
  customerOrgNumber,
  customerEmail,
  activeModules,
  onActivated,
  onOpenGuide,
}: Props) {
  const { current: currentTerms, hasAcceptedCurrent, acceptances, acceptTerms } = useTerms();
  const { totalAnswered, totalQuestions } = useCustomerBaseline(customerId);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [termsChecked, setTermsChecked] = useState(false);
  const [operatorRole, setOperatorRole] = useState(false);
  const [sendClaim, setSendClaim] = useState(true);
  const [saving, setSaving] = useState(false);

  const hasOperatorRole = acceptances.some((a) => a.operator_role);
  const termsOk = termsChecked || hasAcceptedCurrent;
  const canContinue = termsOk && (hasOperatorRole || operatorRole);

  const maturity = totalQuestions > 0 ? Math.round((totalAnswered / totalQuestions) * 100) : 0;
  const claimRecommended = maturity >= CLAIM_THRESHOLD;

  useEffect(() => {
    if (!open) return;
    setStep(1);
    setTermsChecked(false);
    setOperatorRole(false);
    setSendClaim(true);
  }, [open]);

  const handleActivate = async () => {
    setSaving(true);
    const nextModules = Array.from(new Set([...activeModules, "trust"]));
    const { error } = await supabase
      .from("msp_customers" as any)
      .update({ active_modules: nextModules } as any)
      .eq("id", customerId);

    if (error) {
      setSaving(false);
      toast.error("Kunne ikke aktivere Trust Center", { description: error.message });
      return;
    }

    activateModule("trust");
    await acceptTerms("module_activation", `msp-customer:${customerId}`, {
      operatorRole: hasOperatorRole || operatorRole,
    });

    if (sendClaim) {
      markClaimSent(customerId);
      toast.success(`Claim-e-post sendt til ${customerEmail ?? customerName}`);
    }

    setSaving(false);
    toast.success(`Trust Center aktivert hos ${customerName}`);
    onActivated?.();
    setStep(3);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            {step === 3 ? "Trust Center er aktivert" : `Aktiver Trust Center hos ${customerName}`}
          </DialogTitle>
          <DialogDescription className="text-xs">
            {step === 1 && "490 kr per måned eks. mva. Alle priser er eks. mva. Tjenesten aktiveres umiddelbart, og faktureres på neste faktura. Bekreft vilkår for å fortsette."}
            {step === 2 && "Slik settes Trust Center opp hos kunden."}
            {step === 3 && "Velg hvor du vil jobbe videre."}
          </DialogDescription>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-3">
            <TermsAcceptRow
              id="trust-activate"
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
              <div className="flex items-start gap-2 rounded-lg border border-border bg-muted/30 p-3">
                <Checkbox
                  id="trust-operator"
                  checked={operatorRole}
                  onCheckedChange={(v) => setOperatorRole(v === true)}
                  className="mt-0.5"
                />
                <label htmlFor="trust-operator" className="text-xs text-muted-foreground leading-relaxed cursor-pointer">
                  <span className="text-foreground font-medium">Vi tar rollen som driftspartner.</span>{" "}
                  Da kan vi arbeide med compliance i kundens egen virksomhetsprofil på deres vegne.
                </label>
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3 text-xs text-muted-foreground leading-relaxed">
            <ul className="space-y-2">
              <li className="flex gap-2">
                <span className="text-primary">1.</span>
                Kunden må claime sin Trust Profil. Det sendes en e-post til
                {" "}
                <span className="text-foreground">{customerEmail ?? "kundens kontaktperson"}</span>{" "}
                som må godkjenne.
              </li>
              <li className="flex gap-2">
                <span className="text-primary">2.</span>
                Inntil kunden har claimet, kan dere som driftspartner arbeide med Trust Profilen i kundens
                organisasjonsprofil.
              </li>
            </ul>

            <div
              className={cn(
                "rounded-lg border p-3 flex items-start gap-2",
                claimRecommended ? "border-success/30 bg-success/5" : "border-warning/30 bg-warning/5",
              )}
            >
              <Info className="h-3.5 w-3.5 mt-0.5 shrink-0 text-foreground/70" />
              <span>
                Modenhet i dag: <span className="text-foreground font-medium">{maturity} %</span>.{" "}
                {claimRecommended
                  ? "Over anbefalt nivå (55 %) — claim kan sendes nå."
                  : "Under anbefalt nivå (55 %). Dere vurderer selv om claim skal sendes nå."}
              </span>
            </div>

            <div className="flex items-start gap-2 rounded-lg border border-border p-3">
              <Checkbox
                id="trust-send-claim"
                checked={sendClaim}
                onCheckedChange={(v) => setSendClaim(v === true)}
                className="mt-0.5"
              />
              <label htmlFor="trust-send-claim" className="cursor-pointer">
                <span className="text-foreground font-medium flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" /> Send claim-e-post nå
                </span>
                Kan også sendes senere fra kundens profil.
              </label>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Trust Center er aktivert hos {customerName}
              {sendClaim ? " og claim-e-posten er sendt" : ""}. Neste steg er at kunden claimer
              profilen. Du kan åpne veiledningen nå, eller fortsette senere – aktiveringen er
              allerede fullført.
            </p>
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={dontAskAgain}
                onCheckedChange={(v) => setDontAskAgain(v === true)}
              />
              <span className="text-xs text-muted-foreground">Ikke spør meg om dette igjen</span>
            </label>
          </div>
        )}


        <DialogFooter className="gap-2 sm:gap-2">
          {step === 1 && (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Avbryt
              </Button>
              <Button disabled={!canContinue} onClick={() => setStep(2)}>
                Neste
              </Button>
            </>
          )}
          {step === 2 && (
            <>
              <Button variant="outline" onClick={() => setStep(1)}>
                Tilbake
              </Button>
              <Button onClick={handleActivate} disabled={saving}>
                {saving ? "Aktiverer…" : "Aktiver Trust Center"}
              </Button>
            </>
          )}
          {step === 3 && (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Bli her
              </Button>
              <Button
                onClick={() => {
                  onOpenChange(false);
                  onOpenGuide?.();
                }}
              >
                Åpne veiledning
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
