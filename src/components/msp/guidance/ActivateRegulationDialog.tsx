import { useMemo, useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Package, ShieldCheck } from "lucide-react";
import { PARTNER_SERVICES } from "@/lib/serviceCatalog";
import { SERVICE_LIBRARY } from "@/lib/serviceLibrary";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  frameworkId: string;
  frameworkLabel: string;
  customerName: string;
  onConfirm: () => Promise<void> | void;
}

export function ActivateRegulationDialog({
  open,
  onOpenChange,
  frameworkId,
  frameworkLabel,
  customerName,
  onConfirm,
}: Props) {
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setConfirmed(false);
      setBusy(false);
    }
  }, [open]);

  const catalogServices = useMemo(
    () =>
      PARTNER_SERVICES.filter((s) =>
        s.frameworkMappings.some((m) => m.frameworkId === frameworkId),
      ).slice(0, 6),
    [frameworkId],
  );

  const mynderServices = useMemo(
    () =>
      SERVICE_LIBRARY.filter((s) =>
        s.frameworkMappings.some((m) => m.frameworkId === frameworkId),
      ).slice(0, 6),
    [frameworkId],
  );

  const handleConfirm = async () => {
    setBusy(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            Aktiver {frameworkLabel} for {customerName}
          </DialogTitle>
          <DialogDescription>
            Regelverket legges i Produkter-fanen, kravene blir tilgjengelige for
            kunden, og månedsprisen oppdateres.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {catalogServices.length > 0 && (
            <div className="rounded-md border border-border p-3">
              <div className="flex items-center gap-1.5 text-xs font-medium text-foreground mb-2">
                <Package className="h-3.5 w-3.5 text-primary" />
                Tjenester i katalogen din som dekker dette regelverket
              </div>
              <div className="flex flex-wrap gap-1.5">
                {catalogServices.map((s) => (
                  <Badge
                    key={s.id}
                    variant="secondary"
                    className="text-[11px] font-normal"
                  >
                    {s.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {mynderServices.length > 0 && (
            <div className="rounded-md border border-dashed border-border p-3">
              <div className="flex items-center gap-1.5 text-xs font-medium text-foreground mb-2">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                Mynder foreslår også
              </div>
              <div className="flex flex-wrap gap-1.5">
                {mynderServices.map((s) => (
                  <Badge
                    key={s.id}
                    variant="outline"
                    className="text-[11px] font-normal border-dashed"
                  >
                    {s.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <label className="flex items-start gap-2.5 rounded-md border border-border p-3 cursor-pointer hover:bg-muted/40 transition-colors">
            <Checkbox
              checked={confirmed}
              onCheckedChange={(v) => setConfirmed(v === true)}
              className="mt-0.5"
            />
            <div className="text-sm text-foreground">
              <div className="font-medium flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                Jeg bekrefter at kunden har godkjent aktivering
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Ved aktivering starter fakturering og regelverket blir synlig for
                kunden i deres Trust Profile.
              </p>
            </div>
          </label>
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={busy}
          >
            Avbryt
          </Button>
          <Button onClick={handleConfirm} disabled={!confirmed || busy}>
            {busy ? "Aktiverer…" : "Aktiver regelverk"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
