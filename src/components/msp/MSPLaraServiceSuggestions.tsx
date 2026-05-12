import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Sparkles, CheckSquare, Shield, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PartnerService } from "@/lib/serviceCatalog";

interface Props {
  suggestions: PartnerService[];
  onAdd: (services: PartnerService[]) => void;
  onDismiss: () => void;
}

export function MSPLaraServiceSuggestions({ suggestions, onAdd, onDismiss }: Props) {
  const [selected, setSelected] = useState<Set<string>>(
    new Set(suggestions.map((s) => s.id)),
  );

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAdd = () => {
    const chosen = suggestions
      .filter((s) => selected.has(s.id))
      // Gi unike id-er så de ikke kolliderer med eksisterende katalog-ids
      .map((s) => ({ ...s, id: `svc-${Date.now()}-${s.id}` }));
    onAdd(chosen);
  };

  return (
    <Card className="p-4 border-primary/30 bg-primary/5 space-y-3">
      <div className="flex items-start gap-3">
        <div className="h-9 w-9 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
          <Sparkles className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">
            Lara foreslår {suggestions.length} tjenester
          </p>
          <p className="text-[13px] text-muted-foreground mt-0.5">
            Velg dem du vil legge til. Du kan tilpasse hver tjeneste etter at de er lagt til
            katalogen.
          </p>
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0 shrink-0"
          onClick={onDismiss}
          aria-label="Lukk forslag"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-2">
        {suggestions.map((s) => {
          const isSelected = selected.has(s.id);
          return (
            <button
              key={s.id}
              onClick={() => toggle(s.id)}
              className={cn(
                "w-full text-left rounded-lg border p-3 transition-colors flex items-start gap-3",
                isSelected
                  ? "bg-background border-primary/50"
                  : "bg-background/40 border-border hover:border-primary/30",
              )}
            >
              <Checkbox checked={isSelected} className="mt-0.5" tabIndex={-1} />
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Shield className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-foreground">{s.name}</span>
                  <Badge variant="outline" className="text-[10px] gap-1">
                    <CheckSquare className="h-3 w-3" />
                    {s.defaultChecklist.length} sjekkpunkter
                  </Badge>
                </div>
                <p className="text-[13px] text-muted-foreground leading-snug">
                  {s.description}
                </p>
                <div className="flex flex-wrap items-center gap-1.5">
                  {s.frameworkMappings.map((m) => (
                    <Badge
                      key={m.frameworkId}
                      variant="outline"
                      className="text-[10px] bg-primary/5 text-primary border-primary/30"
                    >
                      {m.frameworkLabel} · {m.controlIds.length} kontroller
                    </Badge>
                  ))}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between pt-1">
        <span className="text-[12px] text-muted-foreground">
          {selected.size} av {suggestions.length} valgt
        </span>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={onDismiss}>
            Avbryt
          </Button>
          <Button size="sm" onClick={handleAdd} disabled={selected.size === 0}>
            Legg til valgte ({selected.size})
          </Button>
        </div>
      </div>
    </Card>
  );
}
