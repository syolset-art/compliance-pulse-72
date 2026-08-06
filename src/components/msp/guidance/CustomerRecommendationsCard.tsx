import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Info, Zap, Plus, X, ArrowRight, Briefcase } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  deriveProductSuggestions,
  deriveActivatedProducts,
  deriveActivatedProductTargets,
  salesPotentialFor,
  customerLicenseSummary,
  type OfferSuggestion,
} from "@/lib/offerSuggestions";
import { AddOfferItemDialog } from "./AddOfferItemDialog";
import { formatKr } from "@/lib/planConstants";
import type { CustomerEntryTarget } from "@/lib/customerEntryRoutes";

interface Props {
  customer: any;
  onOffer: (items: OfferSuggestion[]) => void;
  onActivate: (items: OfferSuggestion[]) => void;
  /** Gå inn i kundens organisasjon for å jobbe med det som er aktivert. */
  onEnterCustomer?: (items: CustomerEntryTarget[]) => void;
}

export function CustomerRecommendationsCard({ customer, onOffer, onActivate, onEnterCustomer }: Props) {
  const [picked, setPicked] = useState<string[]>([]);
  const [manual, setManual] = useState<OfferSuggestion[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const recommended = deriveProductSuggestions(customer);
  const activated = deriveActivatedProducts(customer);
  const activatedTargets = deriveActivatedProductTargets(customer);
  const manualIds = new Set(manual.map((m) => m.id));
  const suggestions = [...recommended.filter((r) => !manualIds.has(r.id)), ...manual];
  const potential = salesPotentialFor(suggestions);
  const license = customerLicenseSummary(customer);

  const removeManual = (id: string) => {
    setManual((prev) => prev.filter((m) => m.id !== id));
    setPicked((prev) => prev.filter((p) => p !== id));
  };

  const toggle = (id: string) =>
    setPicked((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));

  const pickedItems = suggestions.filter((s) => picked.includes(s.id));
  const activatableItems = pickedItems.filter((s) => s.activatable);

  return (
    <Card className="p-5 flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <h3 className="text-sm font-semibold text-foreground">Anbefalte produkter og tjenester</h3>
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" className="text-muted-foreground hover:text-foreground" aria-label="Om anbefalingene">
                    <Info className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  <p>Mynder-produkter og egne tjenester fra tjenestekatalogen som kan selges inn til denne kunden. Forslagene er utarbeidet av en KI-agent.</p>
                  <p className="mt-1">Velg det du vil selge inn, og lag et tilbud — eller aktiver produkter direkte for kunden.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        <div className="flex items-start gap-3 sm:shrink-0">
          {potential.total > 0 && (
            <div className="text-left sm:text-right">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                Salgspotensial
              </p>
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="mt-1 block text-sm font-medium tabular-nums text-foreground cursor-help">
                      {formatKr(potential.total)}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="max-w-[240px] text-xs">
                    <p>Estimert førsteårs potensial eks. mva.</p>
                    <p className="mt-1">Tjenester: {formatKr(potential.services)} (1 500 kr/t)</p>
                    <p>Produkter og regelverk: {formatKr(potential.recurring)} (12 mnd)</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4">
        {suggestions.length === 0 ? (
          <p className="text-sm text-muted-foreground">Ingen nye anbefalinger akkurat nå.</p>
        ) : (
          <div className="flex flex-wrap items-center gap-1.5">
            {suggestions.map((s) => {
              const on = picked.includes(s.id);
              const isManual = manualIds.has(s.id);
              return (
                <span
                  key={s.id}
                  className={cn(
                    "inline-flex items-center rounded-full border text-[11px] font-medium transition-colors",
                    on
                      ? isManual
                        ? "border-foreground/40 bg-foreground/10 text-foreground"
                        : "border-recommend bg-recommend text-recommend-foreground"
                      : isManual
                        ? "border-border bg-muted/40 text-foreground hover:bg-muted"
                        : s.activatable
                          ? "border-recommend/60 bg-recommend/15 text-recommend hover:bg-recommend/25 hover:border-recommend"
                          : "border-dashed border-recommend/50 text-recommend/90 hover:bg-recommend/10",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => toggle(s.id)}
                    title={
                      isManual
                        ? "Lagt til av deg — ikke foreslått av KI-agenten"
                        : s.activatable
                          ? "Kan aktiveres direkte"
                          : "Tjeneste – leveres som oppdrag"
                    }
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-recommend focus-visible:ring-offset-1"
                  >
                    {s.activatable && <Zap className="h-2.5 w-2.5 shrink-0" />}
                    {s.label}
                    {isManual && (
                      <span className="text-[9px] uppercase tracking-wide opacity-70">
                        Manuelt valgt
                      </span>
                    )}
                  </button>
                  {isManual && (
                    <button
                      type="button"
                      onClick={() => removeManual(s.id)}
                      aria-label={`Fjern ${s.label}`}
                      className="pr-2 pl-0.5 py-1 opacity-60 hover:opacity-100"
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  )}
                </span>
              );
            })}
            {pickedItems.length > 0 && (
              <button
                type="button"
                onClick={() => onOffer(pickedItems)}
                className="inline-flex items-center rounded-full bg-primary px-2.5 py-1 text-[11px] font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Tilbud ({pickedItems.length})
              </button>
            )}
            {activatableItems.length > 0 && (
              <button
                type="button"
                onClick={() => onActivate(activatableItems)}
                className="inline-flex items-center rounded-full bg-warning px-2.5 py-1 text-[11px] font-medium text-warning-foreground hover:bg-warning/90 transition-colors"
              >
                Aktiver ({activatableItems.length})
              </button>
            )}
            {pickedItems.length === 0 && suggestions.some((s) => s.activatable) && (
              <button
                type="button"
                onClick={() => setPicked(suggestions.filter((s) => s.activatable).map((s) => s.id))}
                className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
              >
                <Zap className="h-3 w-3" />
                Aktiver direkte
              </button>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={() => setAddOpen(true)}
          className="mt-3 inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
        >
          <Plus className="h-3 w-3" />
          Legg til tjeneste eller produkt
        </button>
      </div>

      <AddOfferItemDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        activatedLabels={activated}
        existingIds={suggestions.map((s) => s.id)}
        onAdd={(item) => {
          setManual((prev) => (prev.some((m) => m.id === item.id) ? prev : [...prev, item]));
          setPicked((prev) => (prev.includes(item.id) ? prev : [...prev, item.id]));
        }}
      />

      <div className="mt-auto pt-4 border-t border-border/60">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                Aktivert – jobb som driftspartner
              </p>
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="text-muted-foreground hover:text-foreground"
                      aria-label="Om aktiverte produkter"
                    >
                      <Info className="h-3.5 w-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[260px] text-xs">
                    Klikk på et aktivert produkt for å gå inn i kundens organisasjon og jobbe med
                    etterlevelsen på vegne av kunden.
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              {activatedTargets.length > 0 && onEnterCustomer && (
                <button
                  type="button"
                  onClick={() => onEnterCustomer(activatedTargets)}
                  className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline underline-offset-2"
                >
                  <Briefcase className="h-3 w-3" />
                  Åpne kundens virksomhetsprofil
                </button>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              {activated.length === 0 ? (
                <span className="text-sm text-muted-foreground">Ingenting aktivert ennå</span>
              ) : (
                activatedTargets.map((target) => (
                  <button
                    key={target.id}
                    type="button"
                    onClick={() => onEnterCustomer?.([target])}
                    disabled={!onEnterCustomer}
                    title={`Jobb med ${target.label} hos kunden`}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-normal transition-colors",
                      "bg-success/10 text-foreground border-success/30",
                      onEnterCustomer
                        ? "hover:bg-success/20 hover:border-success/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 cursor-pointer"
                        : "cursor-default",
                    )}
                  >
                    {target.label}
                    {onEnterCustomer && <ArrowRight className="h-2.5 w-2.5 opacity-70" />}
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="text-left sm:text-right sm:shrink-0 sm:min-w-[140px]">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
              Månedlig lisens
            </p>
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="mt-1 block text-sm font-medium tabular-nums text-foreground cursor-help">
                    {formatKr(license.monthly)}<span className="text-[11px] font-normal text-muted-foreground">/mnd</span>
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[260px] text-xs">
                  <p className="font-medium text-foreground">Aktive lisenser eks. mva.</p>
                  {license.lines.length === 0 ? (
                    <p className="mt-1">Ingen betalte lisenser aktivert ennå.</p>
                  ) : (
                    <ul className="mt-1 space-y-0.5">
                      {license.lines.map((l) => (
                        <li key={l.label} className="flex justify-between gap-3">
                          <span>{l.label}</span>
                          <span className="tabular-nums">{formatKr(l.price)}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mt-3">
              Fakturert hittil
            </p>
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="mt-1 block text-sm font-medium tabular-nums text-foreground cursor-help">
                    {formatKr(license.billedToDate)}
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[260px] text-xs">
                  <p>
                    Beregnet fra aktiveringstidspunktet: {license.months}{" "}
                    {license.months === 1 ? "måned" : "måneder"} à {formatKr(license.monthly)} eks. mva.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>
    </Card>
  );
}
