import { Globe2, Plus } from "lucide-react";
import { getCountry, type CountryScope } from "./countryScopeData";

interface Props {
  scope: CountryScope;
  onEdit: () => void;
  onRequest?: () => void;
}

export function CountryScopeBar({ scope, onEdit, onRequest }: Props) {
  const countries = scope.countries.map(getCountry).filter(Boolean);

  return (
    <div
      className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-muted/40 p-3"
      role="group"
      aria-label="Aktiv jurisdiksjon"
    >
      <div className="flex min-w-0 items-center gap-3">
        {/* Category label */}
        <div className="flex shrink-0 items-center gap-1.5 border-r border-border/70 pr-3">
          <Globe2 className="h-3.5 w-3.5 text-muted-foreground/70" aria-hidden />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Jurisdiksjon
          </span>
        </div>

        {/* Active country chips */}
        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
          {countries.map((c) => (
            <div
              key={c!.code}
              className="flex items-center gap-1.5 rounded-md border border-border bg-background px-2 py-1 shadow-sm"
            >
              <span aria-hidden className="text-[13px] leading-none">
                {c!.flag}
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                {c!.code}
              </span>
              <span className="text-[13px] font-medium text-foreground">
                {c!.name}
              </span>
            </div>
          ))}

          {scope.mode === "multi" && (
            <div className="flex h-6 items-center rounded-md border border-primary/30 bg-primary/10 px-2">
              <span className="text-[10px] font-bold uppercase tracking-wide text-primary">
                Ekspansjon
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Action */}
      <button
        type="button"
        onClick={onEdit}
        className="shrink-0 rounded-md px-1.5 py-1 text-[13px] font-semibold text-primary transition-colors hover:text-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        Endre land
      </button>
    </div>
  );
}
