import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Shield } from "lucide-react";

export interface RetireFrameworkOption {
  id: string;
  name: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerName: string;
  frameworks: RetireFrameworkOption[];
  /** Månedspris per regelverk, brukt til å vise hva som bortfaller. */
  pricePerFramework: number;
  onConfirm: (selectedIds: string[]) => void;
}

/** Velger hvilke regelverk som skal avsluttes før den vanlige avslutningsdialogen. */
export function RetireFrameworksDialog({
  open,
  onOpenChange,
  customerName,
  frameworks,
  pricePerFramework,
  onConfirm,
}: Props) {
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    if (!open) setSelected([]);
  }, [open]);

  const toggle = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const allSelected = selected.length === frameworks.length && frameworks.length > 0;
  const savings = selected.length * pricePerFramework;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">Avslutt regelverk</DialogTitle>
          <DialogDescription>
            Velg hvilke regelverk hos {customerName} som skal avsluttes. Krav og
            dokumentasjonsstatus beholdes i 90 dager.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-1.5 max-h-72 overflow-y-auto">
          {frameworks.map((f) => (
            <label
              key={f.id}
              className="flex items-center gap-2.5 rounded-lg border border-border p-2.5 cursor-pointer hover:border-primary/40 transition-colors"
            >
              <Checkbox
                checked={selected.includes(f.id)}
                onCheckedChange={() => toggle(f.id)}
              />
              <Shield className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="text-sm text-foreground flex-1 min-w-0 truncate">{f.name}</span>
              <span className="text-xs text-muted-foreground tabular-nums shrink-0">
                {pricePerFramework} kr/mnd
              </span>
            </label>
          ))}
        </div>

        <div className="flex items-center justify-between gap-3 text-xs">
          <button
            type="button"
            className="text-muted-foreground hover:text-foreground underline underline-offset-2"
            onClick={() => setSelected(allSelected ? [] : frameworks.map((f) => f.id))}
          >
            {allSelected ? "Fjern alle" : "Velg alle"}
          </button>
          {selected.length > 0 && (
            <span className="text-muted-foreground">
              Bortfaller: <span className="font-medium text-foreground">{savings} kr/mnd</span> eks. mva
            </span>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Avbryt
          </Button>
          <Button
            size="sm"
            disabled={selected.length === 0}
            onClick={() => onConfirm(selected)}
          >
            Fortsett ({selected.length})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
