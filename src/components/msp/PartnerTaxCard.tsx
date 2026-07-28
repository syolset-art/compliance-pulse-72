import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Receipt, Save } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { usePartnerBranding } from "@/hooks/usePartnerBranding";
import { formatTaxNote, type PartnerTaxSettings, type TaxMode } from "@/lib/partnerTax";

const QUICK_RATES = [0, 12, 15, 20, 25];

export function PartnerTaxCard() {
  const { branding, save } = usePartnerBranding();
  const [draft, setDraft] = useState<PartnerTaxSettings>(branding.tax);

  useEffect(() => {
    setDraft(branding.tax);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branding.tax.enabled, branding.tax.rate, branding.tax.label, branding.tax.mode]);

  const handleSave = () => {
    save({ tax: draft });
    toast.success("Mva/tax-innstillinger lagret", {
      description: formatTaxNote(draft),
    });
  };

  const update = <K extends keyof PartnerTaxSettings>(k: K, v: PartnerTaxSettings[K]) =>
    setDraft((prev) => ({ ...prev, [k]: v }));

  return (
    <Card className="p-5">
      <div className="flex items-start gap-3 mb-4">
        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Receipt className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1">
          <h2 className="text-base font-semibold text-foreground">Mva / Tax i tilbud</h2>
          <p className="text-base text-muted-foreground mt-0.5">
            Bestem hvordan mva eller tax vises i tilbud og priskataloger. Innstillingen brukes
            automatisk i totalsummer og prisnotater.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2.5">
          <div>
            <p className="text-base font-medium text-foreground">Vis mva/tax i tilbud</p>
            <p className="text-sm text-muted-foreground">
              Skru av hvis du ikke opererer med mva (f.eks. eksporttjenester).
            </p>
          </div>
          <Switch checked={draft.enabled} onCheckedChange={(v) => update("enabled", v)} />
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="tax-label" className="text-base">Etikett</Label>
            <Input
              id="tax-label"
              value={draft.label}
              onChange={(e) => update("label", e.target.value)}
              placeholder="mva / VAT / GST"
              disabled={!draft.enabled}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tax-rate" className="text-base">Sats (%)</Label>
            <Input
              id="tax-rate"
              type="number"
              min={0}
              max={100}
              step={0.5}
              value={draft.rate}
              onChange={(e) => update("rate", Number(e.target.value) || 0)}
              disabled={!draft.enabled}
            />
            <div className="flex flex-wrap gap-1 pt-0.5">
              {QUICK_RATES.map((r) => (
                <button
                  key={r}
                  type="button"
                  disabled={!draft.enabled}
                  onClick={() => update("rate", r)}
                  className="text-xs rounded-md border border-border px-2 py-0.5 text-muted-foreground hover:bg-muted disabled:opacity-40"
                >
                  {r}%
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-base">Visning</Label>
            <Select
              value={draft.mode}
              onValueChange={(v) => update("mode", v as TaxMode)}
              disabled={!draft.enabled}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="exclusive">Eksklusiv (legges til totalen)</SelectItem>
                <SelectItem value="inclusive">Inklusiv (inkludert i pris)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="rounded-lg border border-dashed border-border bg-muted/20 px-3 py-2.5">
          <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold mb-1">
            Slik vises det i tilbudet
          </p>
          <p className="text-sm text-foreground">{formatTaxNote(draft)}</p>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSave} className="gap-1.5">
            <Save className="h-4 w-4" /> Lagre
          </Button>
        </div>
      </div>
    </Card>
  );
}
