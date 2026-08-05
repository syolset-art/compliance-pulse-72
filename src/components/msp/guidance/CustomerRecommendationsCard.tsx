import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Info, Zap } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { deriveProductSuggestions, deriveActivatedProducts, type OfferSuggestion } from "@/lib/offerSuggestions";

interface Props {
  customer: any;
  onOffer: (items: OfferSuggestion[]) => void;
  onActivate: (items: OfferSuggestion[]) => void;
}

export function CustomerRecommendationsCard({ customer, onOffer, onActivate }: Props) {
  const [picked, setPicked] = useState<string[]>([]);
  const suggestions = deriveProductSuggestions(customer);
  const activated = deriveActivatedProducts(customer);

  const toggle = (id: string) =>
    setPicked((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));

  const pickedItems = suggestions.filter((s) => picked.includes(s.id));
  const activatableItems = pickedItems.filter((s) => s.activatable);

  return (
    <Card className="p-5 flex flex-col">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-foreground">Anbefalte produkter og tjenester</h3>
          <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
            <Sparkles className="h-3 w-3 text-primary shrink-0" />
            Mynder-produkter og egne tjenester fra tjenestekatalogen som kan selges inn til denne kunden. Forslagene er utarbeidet av en KI-agent.
          </p>
        </div>
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button type="button" className="text-muted-foreground hover:text-foreground shrink-0" aria-label="Om anbefalingene">
                <Info className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="left" className="max-w-xs">
              Velg det du vil selge inn, og lag et tilbud — eller aktiver produkter direkte for kunden.
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="mt-4">
        {suggestions.length === 0 ? (
          <p className="text-sm text-muted-foreground">Ingen nye anbefalinger akkurat nå.</p>
        ) : (
          <div className="flex flex-wrap items-center gap-1.5">
            {suggestions.map((s) => {
              const on = picked.includes(s.id);
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => toggle(s.id)}
                  title={s.activatable ? "Kan aktiveres direkte" : "Tjeneste – leveres som oppdrag"}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-recommend focus-visible:ring-offset-1",
                    on
                      ? "border-recommend bg-recommend text-recommend-foreground"
                      : s.activatable
                        ? "border-recommend/60 bg-recommend/15 text-recommend hover:bg-recommend/25 hover:border-recommend"
                        : "border-dashed border-recommend/50 text-recommend/90 hover:bg-recommend/10",
                  )}
                >
                  {s.activatable && <Zap className="h-2.5 w-2.5 shrink-0" />}
                  {s.label}
                </button>
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
      </div>

      <div className="mt-auto pt-4 border-t border-border/60">
        <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Aktivert</p>
        <div className="flex flex-wrap items-center gap-1.5 mt-2">
          {activated.length === 0 ? (
            <span className="text-sm text-muted-foreground">Ingenting aktivert ennå</span>
          ) : (
            activated.map((label) => (
              <Badge
                key={label}
                variant="outline"
                className="font-normal bg-success/10 text-foreground border-success/30 text-[11px]"
              >
                {label}
              </Badge>
            ))
          )}
        </div>
      </div>
    </Card>
  );
}
