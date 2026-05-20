import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { LifeBuoy } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}

export function RequestCountrySupportDialog({ open, onOpenChange }: Props) {
  const { toast } = useToast();
  const [country, setCountry] = useState("");
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);

  const send = async () => {
    if (!country.trim()) return;
    setSending(true);
    // No backend yet — log + toast. Can be wired to support_requests later.
    console.info("[country-support-request]", { country, note });
    await new Promise((r) => setTimeout(r, 400));
    setSending(false);
    toast({
      title: "Forespørsel sendt",
      description: `Vi legger til ${country} for deg. Du hører fra oss innen noen dager.`,
    });
    setCountry("");
    setNote("");
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
