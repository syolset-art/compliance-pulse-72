import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export interface CustomServiceDraft {
  name: string;
  description?: string;
  pricingKind: "hourly" | "fixed";
  hours?: number;
  fixedPrice?: number;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (draft: CustomServiceDraft) => void;
  defaultHourlyRate: number;
}

export function CustomServiceDialog({ open, onOpenChange, onSave, defaultHourlyRate }: Props) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [pricingKind, setPricingKind] = useState<"hourly" | "fixed">("hourly");
  const [hours, setHours] = useState<number>(8);
  const [fixedPrice, setFixedPrice] = useState<number>(10000);

  const reset = () => {
    setName("");
    setDescription("");
    setPricingKind("hourly");
    setHours(8);
    setFixedPrice(10000);
  };

  const submit = () => {
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      description: description.trim() || undefined,
      pricingKind,
      hours: pricingKind === "hourly" ? hours : undefined,
      fixedPrice: pricingKind === "fixed" ? fixedPrice : undefined,
    });
    reset();
    onOpenChange(false);
  };

  const estimate =
    pricingKind === "hourly" ? hours * defaultHourlyRate : fixedPrice;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Legg til egen tjeneste</DialogTitle>
          <DialogDescription>
            Legg til en tjeneste manuelt i katalogen din — f.eks. workshops, on-prem-arbeid eller spesialleveranser.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="cs-name">Navn på tjenesten</Label>
            <Input
              id="cs-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="F.eks. ISO 27001 forberedelses-workshop"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cs-desc">Beskrivelse (valgfritt)</Label>
            <Textarea
              id="cs-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Kort beskrivelse av hva tjenesten dekker"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>Prismodell</Label>
            <RadioGroup value={pricingKind} onValueChange={(v) => setPricingKind(v as "hourly" | "fixed")}>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="hourly" id="cs-hourly" />
                <Label htmlFor="cs-hourly" className="font-normal cursor-pointer">Timebasert</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="fixed" id="cs-fixed" />
                <Label htmlFor="cs-fixed" className="font-normal cursor-pointer">Fast pris</Label>
              </div>
            </RadioGroup>
          </div>

          {pricingKind === "hourly" ? (
            <div className="space-y-1.5">
              <Label htmlFor="cs-hours">Antall timer</Label>
              <Input
                id="cs-hours"
                type="number"
                min={0}
                value={hours}
                onChange={(e) => setHours(Math.max(0, Number(e.target.value) || 0))}
              />
              <p className="text-[11px] text-muted-foreground">
                Bruker din standard timepris ({defaultHourlyRate.toLocaleString("nb-NO")} kr/t)
              </p>
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label htmlFor="cs-fixed-price">Fast pris (kr)</Label>
              <Input
                id="cs-fixed-price"
                type="number"
                min={0}
                step={500}
                value={fixedPrice}
                onChange={(e) => setFixedPrice(Math.max(0, Number(e.target.value) || 0))}
              />
            </div>
          )}

          <div className="rounded-md border border-border bg-muted/30 px-3 py-2 text-sm flex items-center justify-between">
            <span className="text-muted-foreground">Estimert verdi</span>
            <span className="font-semibold tabular-nums">
              {new Intl.NumberFormat("nb-NO").format(estimate)} kr
            </span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Avbryt</Button>
          <Button onClick={submit} disabled={!name.trim()}>Legg til</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
