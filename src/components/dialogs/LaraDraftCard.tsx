import { Sparkles } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export interface LaraDraftField {
  key: string;
  label: string;
  value: string;
  options: { value: string; label: string; dotClass?: string }[];
  onChange: (value: string) => void;
  /** Kort begrunnelse fra Lara — vises ved hover. */
  rationale?: string;
  /** True når verdien kommer fra Laras forslag (ikke endret av bruker). */
  fromLara?: boolean;
  placeholder?: string;
}

/**
 * Kompakt rad med redigerbare «chips» som viser hva Lara har utledet.
 * Brukeren trenger ikke røre noe — alt har allerede en verdi.
 */
export function LaraDraftCard({ fields }: { fields: LaraDraftField[] }) {
  return (
    <TooltipProvider delayDuration={200}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {fields.map((field) => {
          const selected = field.options.find((o) => o.value === field.value);
          return (
            <div
              key={field.key}
              className={cn(
                "rounded-lg border px-3 py-2 transition-colors",
                field.fromLara ? "border-primary/20 bg-primary/[0.03]" : "border-border bg-background",
              )}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  {field.label}
                </span>
                {field.fromLara && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="inline-flex" aria-label="Foreslått av Lara">
                        <Sparkles className="h-3 w-3 text-primary" />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs text-xs">
                      {field.rationale || "Foreslått av Lara basert på offentlig tilgjengelig informasjon."}
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="h-8 border-0 bg-transparent px-0 text-sm font-medium shadow-none focus:ring-0">
                  <SelectValue placeholder={field.placeholder ?? "Velg"}>
                    <span className="flex items-center gap-2">
                      {selected?.dotClass && (
                        <span className={cn("h-2 w-2 rounded-full", selected.dotClass)} aria-hidden />
                      )}
                      <span className="truncate">{selected?.label ?? field.placeholder ?? "Velg"}</span>
                    </span>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {field.options.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      <span className="flex items-center gap-2">
                        {o.dotClass && <span className={cn("h-2 w-2 rounded-full", o.dotClass)} aria-hidden />}
                        {o.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
