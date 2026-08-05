import { useMemo, useState } from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Check, Package, Wrench, Zap } from "lucide-react";
import { SERVICE_LIBRARY } from "@/lib/serviceLibrary";
import {
  MANUAL_PRODUCTS,
  buildManualProductSuggestion,
  buildManualServiceSuggestion,
  type OfferSuggestion,
} from "@/lib/offerSuggestions";
import { formatKr } from "@/lib/planConstants";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Labels som allerede er aktivert hos kunden — kan ikke velges. */
  activatedLabels: string[];
  /** Id-er som allerede ligger i listen (anbefalt eller manuelt valgt). */
  existingIds: string[];
  onAdd: (item: OfferSuggestion) => void;
}

/**
 * Lar partneren overstyre KI-anbefalingen ved å legge til et hvilket som helst
 * Mynder-produkt eller en tjeneste fra tjenestekatalogen.
 */
export function AddOfferItemDialog({
  open,
  onOpenChange,
  activatedLabels,
  existingIds,
  onAdd,
}: Props) {
  const [query, setQuery] = useState("");
  const activated = useMemo(() => new Set(activatedLabels), [activatedLabels]);
  const existing = useMemo(() => new Set(existingIds), [existingIds]);

  const services = useMemo(() => {
    const seen = new Set<string>();
    return SERVICE_LIBRARY.filter((t) => {
      if (seen.has(t.name)) return false;
      seen.add(t.name);
      return true;
    });
  }, []);

  const pick = (item: OfferSuggestion | null) => {
    if (!item) return;
    onAdd(item);
    setQuery("");
    onOpenChange(false);
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Søk etter produkt eller tjeneste…"
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>Ingen treff.</CommandEmpty>

        <CommandGroup heading="Mynder-produkter">
          {MANUAL_PRODUCTS.map((p) => {
            const isActivated = activated.has(p.label);
            const isAdded = existing.has(`mod-${p.moduleKey}`);
            return (
              <CommandItem
                key={p.moduleKey}
                value={p.label}
                disabled={isActivated || isAdded}
                onSelect={() => pick(buildManualProductSuggestion(p.moduleKey))}
                className="gap-2"
              >
                <Package className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="flex-1 truncate">{p.label}</span>
                {isActivated ? (
                  <span className="text-[11px] text-success flex items-center gap-1">
                    <Check className="h-3 w-3" /> Aktivert
                  </span>
                ) : isAdded ? (
                  <span className="text-[11px] text-muted-foreground">Allerede i listen</span>
                ) : (
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1 tabular-nums">
                    <Zap className="h-3 w-3" />
                    {formatKr(p.price)}/mnd
                  </span>
                )}
              </CommandItem>
            );
          })}
        </CommandGroup>

        <CommandGroup heading="Min tjenestekatalog">
          {services.map((t) => {
            const isActivated = activated.has(t.name);
            const hours = t.estimatedHours?.min ?? 8;
            const isAdded = existing.has(
              `svc-${t.name.toLowerCase().replace(/\s+/g, "-")}`,
            );
            return (
              <CommandItem
                key={t.id}
                value={`${t.name} ${t.shortDescription}`}
                disabled={isActivated}
                onSelect={() => pick(buildManualServiceSuggestion(t.name, hours))}
                className="gap-2"
              >
                <Wrench className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="flex-1 truncate">{t.name}</span>
                {isActivated ? (
                  <span className="text-[11px] text-success flex items-center gap-1">
                    <Check className="h-3 w-3" /> Aktivert
                  </span>
                ) : isAdded ? (
                  <span className="text-[11px] text-muted-foreground">Allerede i listen</span>
                ) : (
                  <span className="text-[11px] text-muted-foreground tabular-nums">
                    ca. {hours} t
                  </span>
                )}
              </CommandItem>
            );
          })}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
