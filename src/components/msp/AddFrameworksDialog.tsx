import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { frameworks as ALL_FRAMEWORKS, type Framework } from "@/lib/frameworkDefinitions";

const CATEGORY_LABEL: Record<Framework["category"], string> = {
  privacy: "Personvern",
  security: "Sikkerhet",
  ai: "Kunstig intelligens",
  guideline: "Veiledning",
  other: "Annet",
};

const CATEGORY_ORDER: Framework["category"][] = ["privacy", "security", "ai", "guideline", "other"];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerName: string;
  /** Regelverk som allerede er aktive (eller inkludert) — skjules i listen. */
  activeIds: string[];
  pricePerFramework: number;
  onConfirm: (selectedIds: string[]) => void;
}

const fmt = (n: number) => n.toLocaleString("nb-NO");

/** Velger for å legge til regelverk hos en kunde — bekreftelse/aktivering skjer i neste steg. */
export function AddFrameworksDialog({
  open,
  onOpenChange,
  customerName,
  activeIds,
  pricePerFramework,
  onConfirm,
}: Props) {
  const [selected, setSelected] = useState<string[]>([]);

  const available = useMemo(() => {
    const active = new Set(activeIds);
    return CATEGORY_ORDER.map((cat) => ({
      category: cat,
      label: CATEGORY_LABEL[cat],
      items: ALL_FRAMEWORKS.filter((f) => f.category === cat && !active.has(f.id)),
    })).filter((g) => g.items.length > 0);
  }, [activeIds]);

  const toggle = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const handleConfirm = () => {
    onConfirm(selected);
    setSelected([]);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) setSelected([]); onOpenChange(o); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Legg til regelverk</DialogTitle>
          <DialogDescription>
            Velg regelverk {customerName} skal etterleve. Hvert regelverk koster{" "}
            {fmt(pricePerFramework)} kr/mnd og aktiveres når du bekrefter i neste steg.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[50vh] -mx-1 px-1">
          <div className="space-y-4 py-1">
            {available.map((group) => (
              <div key={group.category}>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
                  {group.label}
                </p>
                <div className="space-y-1">
                  {group.items.map((f) => {
                    const checked = selected.includes(f.id);
                    return (
                      <label
                        key={f.id}
                        className="flex items-start gap-3 rounded-lg border border-border px-3 py-2.5 cursor-pointer hover:bg-muted/40 transition-colors"
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={() => toggle(f.id)}
                          className="mt-0.5"
                          aria-label={`Velg ${f.name}`}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-sm font-medium text-foreground">{f.name}</span>
                            {f.isMandatory && (
                              <Badge variant="outline" className="text-[10px] font-normal">
                                Obligatorisk
                              </Badge>
                            )}
                            {!f.isMandatory && f.isRecommended && (
                              <Badge variant="outline" className="text-[10px] font-normal">
                                Anbefalt
                              </Badge>
                            )}
                          </span>
                          <span className="block text-xs text-muted-foreground leading-snug mt-0.5 line-clamp-2">
                            {f.description}
                          </span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
            {available.length === 0 && (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Alle tilgjengelige regelverk er allerede aktive hos {customerName}.
              </p>
            )}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Avbryt
          </Button>
          <Button disabled={selected.length === 0} onClick={handleConfirm}>
            {selected.length > 0
              ? `Legg til (${selected.length}) · ${fmt(selected.length * pricePerFramework)} kr/mnd`
              : "Legg til"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
