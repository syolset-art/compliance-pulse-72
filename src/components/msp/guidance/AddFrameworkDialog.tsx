import { useMemo, useState } from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Check, Plus, Scale, ShieldCheck, BookOpen } from "lucide-react";
import {
  MANUAL_FRAMEWORKS,
  FRAMEWORK_CATEGORY_LABELS,
  getManualFrameworkPrice,
  buildManualFrameworkSuggestion,
  buildCustomFrameworkSuggestion,
  type FrameworkCategory,
  type OfferSuggestion,
} from "@/lib/offerSuggestions";
import { formatKr } from "@/lib/planConstants";

/** Partnerens lagrede regelverkspakker (fra «Produkter og tjenester») som kan velges direkte. */
export interface PackagePickerItem {
  frameworkId: string;
  /** Pakkens visningsnavn (partnerens egendefinerte navn). */
  name: string;
  /** Rådgivningstimer som inngår i pakken. */
  totalHours: number;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Labels som allerede er aktivert hos kunden — kan ikke velges. */
  activatedLabels: string[];
  /** Id-er som allerede ligger i listen (anbefalt eller manuelt valgt). */
  existingIds: string[];
  onAdd: (item: OfferSuggestion) => void;
  /** Skjul pris (f.eks. i leverandørmodulen der regelverk kun styrer dokumentasjonskrav). */
  hidePrice?: boolean;
  /** Partnerens egne pakker — vises øverst med pakkens navn (lisens + timer er pakket inn). */
  packages?: PackagePickerItem[];
}

const CATEGORY_ICON: Record<FrameworkCategory, typeof Scale> = {
  regulation: Scale,
  standard: ShieldCheck,
  guideline: BookOpen,
};

const CATEGORY_ORDER: FrameworkCategory[] = ["regulation", "standard", "guideline"];

/**
 * Lar partneren overstyre KI-anbefalingen ved å legge til et hvilket som helst
 * regelverk, en standard eller en retningslinje.
 */
export function AddFrameworkDialog({
  open,
  onOpenChange,
  activatedLabels,
  existingIds,
  onAdd,
  hidePrice = false,
  packages = [],
}: Props) {
  const [query, setQuery] = useState("");
  const activated = useMemo(() => new Set(activatedLabels), [activatedLabels]);
  const existing = useMemo(() => new Set(existingIds), [existingIds]);

  const pick = (item: OfferSuggestion | null) => {
    if (!item) return;
    onAdd(item);
    setQuery("");
    onOpenChange(false);
  };

  /** Velger en av partnerens pakker — regelverket arver pakkens navn, lisens og timer. */
  const pickPackage = (p: PackagePickerItem) => {
    const fromCatalog = buildManualFrameworkSuggestion(p.frameworkId);
    pick(
      fromCatalog ?? {
        id: `fw-${p.frameworkId}`,
        label: p.name,
        kind: "framework",
        hours: p.totalHours > 0 ? p.totalHours : 8,
        activatable: true,
        frameworkId: p.frameworkId,
        price: null,
      },
    );
  };

  const trimmed = query.trim();
  const hasExactMatch = MANUAL_FRAMEWORKS.some(
    (f) => f.label.toLowerCase() === trimmed.toLowerCase(),
  );

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Søk etter regelverk, standard eller retningslinje…"
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>Ingen treff i katalogen.</CommandEmpty>
        {hidePrice && (
          <div className="px-3 py-2 text-[11px] text-muted-foreground border-b">
            Velg hvilke regelverk leverandøren skal måles på. Valget styrer hvilken dokumentasjon
            du trenger fra leverandøren.
          </div>
        )}

        {CATEGORY_ORDER.map((cat) => {
          const items = MANUAL_FRAMEWORKS.filter((f) => f.category === cat);
          if (items.length === 0) return null;
          const Icon = CATEGORY_ICON[cat];
          return (
            <CommandGroup key={cat} heading={FRAMEWORK_CATEGORY_LABELS[cat]}>
              {items.map((f) => {
                const isActivated = activated.has(f.label);
                const isAdded = existing.has(`fw-${f.id}`);
                const price = getManualFrameworkPrice(f);
                return (
                  <CommandItem
                    key={f.id}
                    value={f.label}
                    disabled={isActivated || isAdded}
                    onSelect={() => pick(buildManualFrameworkSuggestion(f.id))}
                    className="gap-2"
                  >
                    <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="flex-1 truncate">{f.label}</span>
                    {isActivated ? (
                      <span className="text-[11px] text-success flex items-center gap-1">
                        <Check className="h-3 w-3" /> Aktivert
                      </span>
                    ) : isAdded ? (
                      <span className="text-[11px] text-muted-foreground">Allerede i listen</span>
                    ) : hidePrice ? null : (
                      <span className="text-[11px] text-muted-foreground tabular-nums">
                        {price === null
                          ? "Ingen lisenskostnad"
                          : price === 0
                            ? "Inkludert"
                            : `${formatKr(price)}/mnd`}
                      </span>
                    )}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          );
        })}

        {trimmed.length > 1 && !hasExactMatch && (
          <CommandGroup heading="Egendefinert">
            <CommandItem
              value={`custom-${trimmed}`}
              onSelect={() => pick(buildCustomFrameworkSuggestion(trimmed))}
              className="gap-2"
            >
              <Plus className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="flex-1 truncate">Bruk «{trimmed}»</span>
              <span className="text-[11px] text-muted-foreground">Egen retningslinje</span>
            </CommandItem>
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
