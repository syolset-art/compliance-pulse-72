import { Globe2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getCountry, type CountryScope } from "./countryScopeData";

interface Props {
  scope: CountryScope;
  onEdit: () => void;
}

export function CountryScopeBar({ scope, onEdit }: Props) {
  const countries = scope.countries.map(getCountry).filter(Boolean);
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2">
      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <Globe2 className="h-3.5 w-3.5" />
        Jurisdiksjon
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        {countries.map((c) => (
          <Badge key={c!.code} variant="secondary" className="gap-1 font-normal">
            <span aria-hidden>{c!.flag}</span>
            <span className="text-[10px] uppercase tracking-wide opacity-60">{c!.code}</span>
            <span>{c!.name}</span>
          </Badge>
        ))}
        {scope.mode === "multi" && (
          <Badge variant="outline" className="text-[10px] uppercase tracking-wide">Ekspansjon</Badge>
        )}
      </div>
      <Button variant="ghost" size="sm" className="ml-auto h-7 gap-1.5 text-xs" onClick={onEdit}>
        <Pencil className="h-3.5 w-3.5" />
        Endre land
      </Button>
    </div>
  );
}
