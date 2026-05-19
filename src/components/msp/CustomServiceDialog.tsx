import { useEffect, useMemo, useState } from "react";
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
import { Sparkles, Link2 } from "lucide-react";
import { suggestControlPoints, type ControlSuggestion } from "@/lib/serviceMappingSuggester";
import { cn } from "@/lib/utils";

export interface ServiceMapping {
  frameworkId: string;
  frameworkShortName: string;
  controlId: string;
  controlLabel: string;
}

export interface CustomServiceDraft {
  name: string;
  description?: string;
  pricingKind: "hourly" | "fixed";
  hours?: number;
  fixedPrice?: number;
  mappings: ServiceMapping[];
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (draft: CustomServiceDraft) => void;
  defaultHourlyRate: number;
}

function suggestionKey(s: { frameworkId: string; controlId: string }): string {
  return `${s.frameworkId}::${s.controlId}`;
}

export function CustomServiceDialog({ open, onOpenChange, onSave, defaultHourlyRate }: Props) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [pricingKind, setPricingKind] = useState<"hourly" | "fixed">("hourly");
  const [hours, setHours] = useState<number>(8);
  const [fixedPrice, setFixedPrice] = useState<number>(10000);
  const [selectedMappings, setSelectedMappings] = useState<Set<string>>(new Set());
  const [userTouchedMappings, setUserTouchedMappings] = useState(false);

  const suggestions: ControlSuggestion[] = useMemo(
    () => suggestControlPoints({ name, description }),
    [name, description],
  );

  // Auto-velg topp 3 forslag når brukeren ikke har overstyrt
  useEffect(() => {
    if (userTouchedMappings) return;
    const top = suggestions.slice(0, 3).map(suggestionKey);
    setSelectedMappings(new Set(top));
  }, [suggestions, userTouchedMappings]);

  const reset = () => {
    setName("");
    setDescription("");
    setPricingKind("hourly");
    setHours(8);
    setFixedPrice(10000);
    setSelectedMappings(new Set());
    setUserTouchedMappings(false);
  };

  const toggleMapping = (s: ControlSuggestion) => {
    setUserTouchedMappings(true);
    const key = suggestionKey(s);
    setSelectedMappings((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const submit = () => {
    if (!name.trim()) return;
    const mappings: ServiceMapping[] = suggestions
      .filter((s) => selectedMappings.has(suggestionKey(s)))
      .map((s) => ({
        frameworkId: s.frameworkId,
        frameworkShortName: s.frameworkShortName,
        controlId: s.controlId,
        controlLabel: s.controlLabel,
      }));
    onSave({
      name: name.trim(),
      description: description.trim() || undefined,
      pricingKind,
      hours: pricingKind === "hourly" ? hours : undefined,
      fixedPrice: pricingKind === "fixed" ? fixedPrice : undefined,
      mappings,
    });
    reset();
    onOpenChange(false);
  };

  const estimate =
    pricingKind === "hourly" ? hours * defaultHourlyRate : fixedPrice;

  const selectedCount = selectedMappings.size;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Legg til egen tjeneste</DialogTitle>
          <DialogDescription>
            Lara foreslår automatisk hvilke regelverk og kontrollpunkter tjenesten treffer.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="cs-name">Navn på tjenesten</Label>
            <Input
              id="cs-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="F.eks. Phishing-simulering og opplæring"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cs-desc">Beskrivelse (valgfritt)</Label>
            <Textarea
              id="cs-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Kort beskrivelse — jo mer detalj, desto bedre forslag fra Lara"
              rows={2}
            />
          </div>

          {/* Lara-forslag for kontrollpunkter */}
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-primary inline-flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" />
                Lara foreslår kontrollpunkter
              </span>
              {selectedCount > 0 && (
                <span className="text-[10px] text-muted-foreground tabular-nums">
                  {selectedCount} valgt
                </span>
              )}
            </div>

            {suggestions.length === 0 ? (
              <p className="text-[11px] text-muted-foreground italic">
                Skriv inn et navn — så finner Lara aktuelle regelverk og kontrollpunkter.
              </p>
            ) : (
              <ul className="space-y-1">
                {suggestions.map((s) => {
                  const key = suggestionKey(s);
                  const checked = selectedMappings.has(key);
                  return (
                    <li key={key}>
                      <label
                        className={cn(
                          "flex items-start gap-2 rounded-md border bg-background px-2 py-1.5 cursor-pointer transition-colors",
                          checked ? "border-primary/40" : "border-border hover:border-foreground/30",
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleMapping(s)}
                          className="mt-0.5 h-4 w-4 rounded border-border accent-primary"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="inline-flex items-center rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                              {s.frameworkShortName}
                            </span>
                            <span className="text-[12px] text-foreground">
                              <span className="text-muted-foreground mr-1">{s.controlId}</span>
                              {s.controlLabel}
                            </span>
                          </div>
                          {s.matchedTerms.length > 0 && (
                            <div className="text-[10px] text-muted-foreground mt-0.5">
                              Treff: {s.matchedTerms.join(", ")}
                            </div>
                          )}
                        </div>
                      </label>
                    </li>
                  );
                })}
              </ul>
            )}
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
            <span className="text-muted-foreground inline-flex items-center gap-1.5">
              <Link2 className="h-3.5 w-3.5" /> Estimert verdi
            </span>
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
