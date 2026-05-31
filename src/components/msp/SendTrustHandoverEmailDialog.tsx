import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Send, Sparkles } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  recipientEmail?: string;
  recipientName?: string;
  customerName: string;
  onSend: () => void;
}

export function SendTrustHandoverEmailDialog({
  open,
  onOpenChange,
  recipientEmail,
  recipientName,
  customerName,
  onSend,
}: Props) {
  const [to, setTo] = useState(recipientEmail || "");
  const [subject, setSubject] = useState(`Overta Trust Profile for ${customerName}`);
  const [body, setBody] = useState(
    `Hei ${recipientName || "kollega"},\n\nVi har satt opp en Trust Profile for ${customerName} som dokumenterer sikkerhets- og compliance-arbeidet deres. Nå er det klart for at dere overtar og signerer profilen selv, slik at den representerer dere som virksomhet.\n\nKlikk på lenken i e-posten for å logge inn, gjennomgå innholdet og bekrefte profilen.\n\nGi gjerne beskjed om dere har spørsmål.\n\nVennlig hilsen\nDintero AS`,
  );

  useEffect(() => {
    if (open) {
      setTo(recipientEmail || "");
      setSubject(`Overta Trust Profile for ${customerName}`);
    }
  }, [open, recipientEmail, customerName]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Send e-post til kunde</DialogTitle>
          <DialogDescription className="flex items-center gap-1.5 text-xs">
            <Sparkles className="h-3 w-3 text-primary" />
            Lara har laget et utkast. Gå gjennom og bekreft før du sender.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Til</Label>
            <Input value={to} onChange={(e) => setTo(e.target.value)} className="h-9 text-[13px]" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Emne</Label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} className="h-9 text-[13px]" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Melding</Label>
            <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={10} className="text-[13px] resize-none" />
          </div>
        </div>

        <DialogFooter className="sm:justify-between gap-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Avbryt
          </Button>
          <Button size="sm" className="gap-1.5" onClick={onSend} disabled={!to.trim()}>
            <Send className="h-3.5 w-3.5" /> Send e-post
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
