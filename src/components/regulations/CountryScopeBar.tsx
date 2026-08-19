import { Plus } from "lucide-react";
import { getCountry, type CountryScope } from "./countryScopeData";

interface Props {
  scope: CountryScope;
  onEdit: () => void;
  onRequest?: () => void;
}

export function CountryScopeBar({ scope, onEdit, onRequest }: Props) {
  const countries = scope.countries.map(getCountry).filter(Boolean) as NonNullable<ReturnType<typeof getCountry>>[];

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-1.5">
        {countries.map((c) => (
          <div
            key={c.code}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2 py-1"
          >
            <span aria-hidden className="text-[13px] leading-none">{c.flag}</span>
            <span className="text-[13px] font-medium text-foreground">{c.name}</span>
            <span className="text-[12px] text-muted-foreground">· {c.frameworkIds.length} regler</span>
          </div>
        ))}

        <button
          type="button"
          onClick={onEdit}
          className="inline-flex items-center gap-1 rounded-md border border-dashed border-border px-2 py-1 text-[12px] font-medium text-primary transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Plus className="h-3 w-3" aria-hidden />
          Legg til land
        </button>
      </div>

    </div>
  );
}

