import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Clock, FileText, Info, Pencil, Receipt } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import { toast } from "sonner";
import { useServiceDefaults, SUPPORTED_CURRENCIES } from "@/hooks/useServiceDefaults";
import { PartnerBrandingCard } from "./PartnerBrandingCard";
import { PartnerTaxCard } from "./PartnerTaxCard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { usePartnerBranding } from "@/hooks/usePartnerBranding";
import { formatTaxNote } from "@/lib/partnerTax";

export function MSPServiceSettingsTab() {
  const { defaultHourlyRate, setDefaultHourlyRate, currency, setCurrency } = useServiceDefaults();
  const { branding } = usePartnerBranding();
  const [rate, setRate] = useState<string>(String(defaultHourlyRate));
  const [editing, setEditing] = useState(false);
  const [openItem, setOpenItem] = useState<string>("");

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

  const rateSummary = `${Number(defaultHourlyRate).toLocaleString("nb-NO")} ${currency} · ${currentCurrencyLabel}`;
  const taxSummary = branding.tax.enabled
    ? `${branding.tax.label} ${branding.tax.rate}% · ${branding.tax.mode === "inclusive" ? "inkl." : "eks."}`
    : "Ikke aktivert";
  const brandingSummary = branding.name || branding.tagline || "Ikke satt opp";

  return (
    <Accordion
      type="single"
      collapsible
      value={openItem}
      onValueChange={setOpenItem}
      className="space-y-3"
    >
      <AccordionItem
        value="rate"
        className="border border-border rounded-lg bg-card px-4"
      >
        <AccordionTrigger className="hover:no-underline py-4">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="h-9 w-9 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Clock className="h-4 w-4" />
            </div>
            <div className="min-w-0 text-left">
              <h3 className="text-base font-semibold text-foreground">Standard timepris</h3>
              <p className="text-sm text-muted-foreground truncate">{rateSummary}</p>
            </div>
          </div>
        </AccordionTrigger>
        <AccordionContent className="pb-4 space-y-4">
          <p className="text-sm text-muted-foreground">
            Brukes som utgangspunkt for alle nye tjenester og tilbud. Du kan overstyre timeprisen pr tjeneste senere.
          </p>
          {!editing ? (
            <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/20 px-4 py-3">
              <div className="grid gap-3 md:grid-cols-2 flex-1">
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
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="gap-1.5 shrink-0"
                onClick={() => setEditing(true)}
              >
                <Pencil className="h-3.5 w-3.5" /> Rediger
              </Button>
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
        </AccordionContent>
      </AccordionItem>

      <AccordionItem
        value="tax"
        className="border border-border rounded-lg bg-card px-4"
      >
        <AccordionTrigger className="hover:no-underline py-4">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="h-9 w-9 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Receipt className="h-4 w-4" />
            </div>
            <div className="min-w-0 text-left">
              <h3 className="text-base font-semibold text-foreground">Mva / Tax i tilbud</h3>
              <p className="text-sm text-muted-foreground truncate">{taxSummary}</p>
            </div>
          </div>
        </AccordionTrigger>
        <AccordionContent className="pb-4">
          <PartnerTaxCard />
        </AccordionContent>
      </AccordionItem>

      <AccordionItem
        value="branding"
        className="border border-border rounded-lg bg-card px-4"
      >
        <AccordionTrigger className="hover:no-underline py-4">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="h-9 w-9 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <FileText className="h-4 w-4" />
            </div>
            <div className="min-w-0 text-left">
              <div className="flex items-center gap-1.5">
                <h3 className="text-base font-semibold text-foreground">Tilbudsmal</h3>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => e.stopPropagation()}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <Info className="h-3.5 w-3.5" />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    Navn, organisasjonsnummer, webadresse og logo hentes automatisk fra
                    organisasjonsprofilen. Du kan overstyre feltene og laste opp en egen logo
                    som bare brukes i tilbud.
                  </TooltipContent>
                </Tooltip>
              </div>
              <p className="text-sm text-muted-foreground truncate">{brandingSummary}</p>
            </div>

          </div>
        </AccordionTrigger>
        <AccordionContent className="pb-4">
          <PartnerBrandingCard />
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
