import { useEffect, useState } from "react";
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
import { TermsAcceptRow } from "@/components/legal/TermsAcceptRow";
import { useTerms } from "@/hooks/useTerms";
import type { Framework } from "@/lib/frameworkDefinitions";
import { isFrameworkFree, getFrameworkYearlyPrice, formatKr } from "@/lib/planConstants";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  frameworks: Framework[];
  onConfirm: () => void;
  isLoading?: boolean;
}

/** Aktiverer flere regelverk og standarder i én operasjon, med vilkår. */
export function BulkFrameworkActivationDialog({
  open,
  onOpenChange,
  frameworks,
  onConfirm,
  isLoading,
}: Props) {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb" || i18n.language === "no";
  const L = (nb: string, en: string) => (isNb ? nb : en);
  const { hasAcceptedCurrent, acceptTerms } = useTerms();
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    if (!open) setAccepted(false);
  }, [open]);

  if (!frameworks.length) return null;

  const monthlyTotal = frameworks.reduce((sum, fw) => {
    const yearly = getFrameworkYearlyPrice(fw.id);
    return sum + (yearly > 0 ? Math.round(yearly / 12) : 0);
  }, 0);
  const checked = accepted || hasAcceptedCurrent;

  const handleConfirm = async () => {
    await acceptTerms("license_purchase", frameworks.map((f) => f.id).join(","));
    onConfirm();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">
            {L("Aktiver valgte regelverk og standarder", "Activate selected regulations and standards")}
          </DialogTitle>
          <DialogDescription className="text-xs">
            {L(
              "Tjenesten aktiveres umiddelbart, og faktureres på neste faktura.",
              "The service is activated immediately and billed on the next invoice.",
            )}
          </DialogDescription>
        </DialogHeader>

        <ul className="max-h-56 space-y-1.5 overflow-y-auto">
          {frameworks.map((fw) => {
            const yearly = getFrameworkYearlyPrice(fw.id);
            const monthly = yearly > 0 ? Math.round(yearly / 12) : 0;
            return (
              <li
                key={fw.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-border p-2.5 text-sm"
              >
              <span className="flex min-w-0 items-center gap-1.5 text-foreground">
                  <span className="truncate">{fw.name}</span>
                </span>
                <span className="shrink-0 text-muted-foreground">
                  {isFrameworkFree(fw.id) || monthly === 0
                    ? L("Inkludert", "Included")
                    : `${formatKr(monthly)} ${L("per måned", "per month")}`}
                </span>
              </li>
            );
          })}
        </ul>

        <p className="text-sm text-foreground">
          {L("Totalt", "Total")}: {formatKr(monthlyTotal)}{" "}
          {L("per måned eks. mva.", "per month excl. VAT.")}
        </p>

        <TermsAcceptRow checked={checked} onCheckedChange={setAccepted} />

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {L("Avbryt", "Cancel")}
          </Button>
          <Button onClick={handleConfirm} disabled={!checked || isLoading}>
            {L(`Aktiver ${frameworks.length}`, `Activate ${frameworks.length}`)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
