import { useState, KeyboardEvent } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { LifeBuoy, Plus, X } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}

export function RequestCountrySupportDialog({ open, onOpenChange }: Props) {
  const { toast } = useToast();
  const [country, setCountry] = useState("");
  const [note, setNote] = useState("");
  const [frameworks, setFrameworks] = useState<string[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

  const addFramework = () => {
    const v = draft.trim();
    if (!v) return;
    if (!frameworks.includes(v)) setFrameworks((f) => [...f, v]);
    setDraft("");
  };

  const onDraftKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addFramework();
    }
  };

  const removeFramework = (v: string) => setFrameworks((f) => f.filter((x) => x !== v));

  const send = async () => {
    if (!country.trim()) return;
    setSending(true);
    // No backend yet — log + toast. Can be wired to support_requests later.
    console.info("[country-support-request]", { country, note, frameworks });
    await new Promise((r) => setTimeout(r, 400));
    setSending(false);
    toast({
      title: "Forespørsel sendt",
      description: `Vi legger til ${country}${frameworks.length ? ` med ${frameworks.length} regelverk` : ""} for deg. Du hører fra oss innen noen dager.`,
    });
    setCountry("");
    setNote("");
    setFrameworks([]);
    setDraft("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LifeBuoy className="h-5 w-5 text-primary" />
            Be om støtte for nytt land
          </DialogTitle>
          <DialogDescription>
            Vi støtter foreløpig Norge, Sverige, Nederland, Storbritannia og Australia. Andre land kan legges til – leveres på noen dager.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="country">Land</Label>
            <Input id="country" placeholder="F.eks. Tyskland" value={country} onChange={(e) => setCountry(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="frameworks">Spesifikke regelverk (valgfritt)</Label>
            <p className="text-xs text-muted-foreground">
              Vet dere allerede hvilke regelverk dere trenger i dette landet? Legg dem til så prioriterer vi dem.
            </p>
            <div className="flex gap-2">
              <Input
                id="frameworks"
                placeholder="F.eks. BDSG, IT-Sicherheitsgesetz"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={onDraftKey}
              />
              <Button type="button" variant="outline" onClick={addFramework} disabled={!draft.trim()}>
                <Plus className="h-4 w-4 mr-1" /> Legg til
              </Button>
            </div>
            {frameworks.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {frameworks.map((f) => (
                  <Badge key={f} variant="secondary" className="gap-1 pr-1">
                    {f}
                    <button
                      type="button"
                      onClick={() => removeFramework(f)}
                      className="rounded-full p-0.5 hover:bg-muted-foreground/20"
                      aria-label={`Fjern ${f}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="note">Kontekst (valgfritt)</Label>
            <Textarea id="note" placeholder="Hvorfor trenger dere dette landet?" value={note} onChange={(e) => setNote(e.target.value)} rows={3} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Avbryt</Button>
          <Button onClick={send} disabled={!country.trim() || sending}>
            {sending ? "Sender…" : "Send forespørsel"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
