import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Clock, FileText, Pencil } from "lucide-react";
import { toast } from "sonner";
import { useServiceDefaults, SUPPORTED_CURRENCIES } from "@/hooks/useServiceDefaults";
import { PartnerBrandingCard } from "./PartnerBrandingCard";
import { PartnerTaxCard } from "./PartnerTaxCard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function MSPServiceSettingsTab() {
  const { defaultHourlyRate, setDefaultHourlyRate, currency, setCurrency } = useServiceDefaults();
  const [rate, setRate] = useState<string>(String(defaultHourlyRate));
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    setRate(String(defaultHourlyRate));
  }, [defaultHourlyRate]);

  const currentCurrencyLabel =
    SUPPORTED_CURRENCIES.find((c) => c.code === currency)?.label ?? currency;

  const handleSave = () => {
    const num = Number(rate);
    if (!Number.isFinite(num) || num <= 0) {
      toast.error("Ugyldig timepris", { description: "Skriv inn et positivt tall." });
      return;
    }
    setDefaultHourlyRate(num);
    toast.success("Standard timepris lagret");
    setEditing(false);
  };

  const handleCancel = () => {
    setRate(String(defaultHourlyRate));
    setEditing(false);
  };

  const handleCurrencyChange = (code: string) => {
    setCurrency(code);
    toast.success("Valuta oppdatert", { description: `Bruker nå ${code}.` });
  };

  return (
    <div className="space-y-6">
      <Card className="p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="h-9 w-9 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Clock className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-semibold text-foreground">Standard timepris</h3>
              <p className="text-base text-muted-foreground">
                Brukes som utgangspunkt for alle nye tjenester og tilbud. Du kan overstyre timeprisen pr tjeneste senere.
              </p>
            </div>
          </div>
          {!editing && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="gap-1.5 shrink-0"
              onClick={() => setEditing(true)}
            >
              <Pencil className="h-3.5 w-3.5" /> Rediger
            </Button>
          )}
        </div>

        {!editing ? (
          <div className="grid gap-3 md:grid-cols-2 rounded-lg border border-border bg-muted/20 px-4 py-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">Valuta</p>
              <p className="text-base text-foreground mt-0.5">{currentCurrencyLabel}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">Timepris</p>
              <p className="text-base text-foreground mt-0.5 tabular-nums">
                {Number(defaultHourlyRate).toLocaleString("nb-NO")} {currency}
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="grid gap-3 md:grid-cols-[200px_200px_1fr] md:items-end">
              <div className="space-y-1.5">
                <Label htmlFor="currency-select" className="text-base text-foreground font-medium">
                  Valuta
                </Label>
                <Select value={currency} onValueChange={handleCurrencyChange}>
                  <SelectTrigger id="currency-select" className="h-10 text-base">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SUPPORTED_CURRENCIES.map((c) => (
                      <SelectItem key={c.code} value={c.code} className="text-base">
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="default-hourly-rate" className="text-base text-foreground font-medium">
                  Timepris
                </Label>
                <Input
                  id="default-hourly-rate"
                  type="number"
                  min={0}
                  step={50}
                  value={rate}
                  onChange={(e) => setRate(e.target.value)}
                  className="h-10 text-base tabular-nums"
                  autoFocus
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" size="sm" variant="ghost" className="h-9" onClick={handleCancel}>
                Avbryt
              </Button>
              <Button type="button" size="sm" className="h-9" onClick={handleSave}>
                Lagre
              </Button>
            </div>
          </>
        )}
      </Card>
      <PartnerTaxCard />


      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <FileText className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground">Tilbudsmal</h3>
            <p className="text-base text-muted-foreground">
              Logo, partnernavn og slagord som vises i tilbud du sender til kunder.
            </p>
          </div>
        </div>
        <PartnerBrandingCard />
      </div>
    </div>
  );
}

