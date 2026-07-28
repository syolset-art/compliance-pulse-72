import { useEffect, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Pencil, Check } from "lucide-react";
import { toast } from "sonner";

const STORAGE_KEY = "msp-setup-fees-v1";

function readAll(): Record<string, number> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeAll(map: Record<string, number>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
    window.dispatchEvent(new Event("msp-setup-fees-updated"));
  } catch {
    /* noop */
  }
}

export function useSetupFee(productId: string): number | undefined {
  const [fee, setFee] = useState<number | undefined>(() => readAll()[productId]);
  useEffect(() => {
    const sync = () => setFee(readAll()[productId]);
    window.addEventListener("msp-setup-fees-updated", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("msp-setup-fees-updated", sync);
      window.removeEventListener("storage", sync);
    };
  }, [productId]);
  return fee;
}

interface Props {
  productId: string;
  productName: string;
  currencySymbol: string;
  trailing: boolean;
  format: (n: number) => string;
}

export function SetupFeeCell({ productId, productName, currencySymbol, trailing, format }: Props) {
  const fee = useSetupFee(productId);
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState<string>(fee != null ? String(fee) : "");

  useEffect(() => {
    if (open) setValue(fee != null ? String(fee) : "");
  }, [open, fee]);

  const save = () => {
    const trimmed = value.trim();
    if (trimmed === "") {
      // Fjern
      const all = readAll();
      delete all[productId];
      writeAll(all);
      toast.success(`Etableringsgebyr fjernet for ${productName}`);
      setOpen(false);
      return;
    }
    const parsed = Number(trimmed.replace(/\s|,/g, (m) => (m === "," ? "." : "")));
    if (!Number.isFinite(parsed) || parsed < 0 || parsed > 10_000_000) {
      toast.error("Ugyldig beløp");
      return;
    }
    const rounded = Math.round(parsed);
    const all = readAll();
    all[productId] = rounded;
    writeAll(all);
    toast.success(`Etableringsgebyr lagret: ${format(rounded)}`);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {fee != null ? (
          <button
            type="button"
            className="inline-flex items-center gap-1.5 text-sm text-foreground hover:text-primary tabular-nums"
            aria-label={`Rediger etableringsgebyr for ${productName}`}
          >
            <span className="font-medium">
              {trailing ? format(fee) : `${currencySymbol} ${fee}`}
            </span>
            <Pencil className="h-3 w-3 text-muted-foreground" />
          </button>
        ) : (
          <button
            type="button"
            className="text-sm text-primary hover:underline"
          >
            Sett pris
          </button>
        )}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 p-3 space-y-2">
        <div>
          <p className="text-sm font-medium text-foreground">Etableringsgebyr</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Engangspris kunden betaler ved oppstart. Valgfritt.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            inputMode="decimal"
            min={0}
            max={10_000_000}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                save();
              }
            }}
            placeholder="0"
            className="h-9"
            autoFocus
          />
          <span className="text-sm text-muted-foreground shrink-0">{currencySymbol}</span>
        </div>
        <div className="flex items-center justify-end gap-2 pt-1">
          <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
            Avbryt
          </Button>
          <Button size="sm" onClick={save} className="gap-1.5">
            <Check className="h-3.5 w-3.5" /> Lagre
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
