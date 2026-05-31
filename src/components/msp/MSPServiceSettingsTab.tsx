import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Clock, FileText } from "lucide-react";
import { toast } from "sonner";
import { useServiceDefaults } from "@/hooks/useServiceDefaults";
import { PartnerBrandingCard } from "./PartnerBrandingCard";

export function MSPServiceSettingsTab() {
  const { defaultHourlyRate, setDefaultHourlyRate } = useServiceDefaults();
  const [rate, setRate] = useState<string>(String(defaultHourlyRate));

  useEffect(() => {
    setRate(String(defaultHourlyRate));
  }, [defaultHourlyRate]);

  const handleSave = () => {
    const num = Number(rate);
    if (!Number.isFinite(num) || num <= 0) {
      toast.error("Ugyldig timepris", { description: "Skriv inn et positivt tall." });
      return;
    }
    setDefaultHourlyRate(num);
    toast.success("Standard timepris lagret");
  };

  return (
    <div className="space-y-6">
      <Card className="p-5 space-y-4">
        <div className="flex items-start gap-3">
          <div className="h-9 w-9 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Clock className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-foreground">Standard timepris</h3>
            <p className="text-xs text-muted-foreground">
              Brukes som utgangspunkt for alle nye tjenester og tilbud. Du kan overstyre timeprisen pr tjeneste senere.
            </p>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-[200px_1fr] md:items-end">
          <div className="space-y-1.5">
            <Label htmlFor="default-hourly-rate" className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">
              Timepris (kr)
            </Label>
            <div className="relative">
              <Input
                id="default-hourly-rate"
                type="number"
                min={0}
                step={50}
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                className="h-9 text-sm tabular-nums pr-12"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">kr/t</span>
            </div>
          </div>
          <div>
            <Button type="button" size="sm" className="h-9 text-xs" onClick={handleSave}>
              Lagre standard timepris
            </Button>
          </div>
        </div>
      </Card>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <FileText className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Tilbudsmal</h3>
            <p className="text-xs text-muted-foreground">
              Logo, partnernavn og slagord som vises i tilbud du sender til kunder.
            </p>
          </div>
        </div>
        <PartnerBrandingCard />
      </div>
    </div>
  );
}
