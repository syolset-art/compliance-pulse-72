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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Send, CheckCircle2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ShareReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  frameworkName: string;
  frameworkId: string;
}

export const ShareReportDialog = ({
  open,
  onOpenChange,
  frameworkName,
  frameworkId,
}: ShareReportDialogProps) => {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    if (!email.trim()) {
      toast({ title: "Mangler e-post", description: "Vennligst oppgi en e-postadresse", variant: "destructive" });
      return;
    }
    setSending(true);
    // Simulate sending — in production this would call an edge function
    await new Promise((r) => setTimeout(r, 1200));
    setSending(false);
    setSent(true);
    toast({
      title: "Rapport delt",
      description: `En invitasjon er sendt til ${email}`,
    });
    setTimeout(() => {
      setSent(false);
      setEmail("");
      setMessage("");
      onOpenChange(false);
    }, 1500);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Del etterlevelsesrapport</DialogTitle>
          <DialogDescription>
            Send en invitasjon til å se etterlevelsesrapporten for{" "}
            <span className="font-medium text-foreground">{frameworkName}</span>.
            Mottakeren vil kunne logge inn og se rapporten.
          </DialogDescription>
        </DialogHeader>

        {sent ? (
          <div className="flex flex-col items-center py-8 gap-3">
            <CheckCircle2 className="h-12 w-12 text-emerald-500" />
            <p className="font-medium text-foreground">Invitasjon sendt!</p>
            <p className="text-sm text-muted-foreground text-center">
              {email} vil motta en e-post med lenke til rapporten.
            </p>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="share-email">E-postadresse</Label>
              <Input
                id="share-email"
                type="email"
                placeholder="navn@firma.no"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={sending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="share-message">Melding (valgfritt)</Label>
              <Textarea
                id="share-message"
                placeholder="Legg til en personlig melding..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                disabled={sending}
              />
            </div>
            <div className="rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground">
              Mottakeren vil få en e-post med innloggingslenke. Etter innlogging får de
              lesetilgang til denne etterlevelsesrapporten.
            </div>
          </div>
        )}

        {!sent && (
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={sending}>
              Avbryt
            </Button>
            <Button onClick={handleSend} disabled={sending} className="gap-2">
              {sending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sender...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Send invitasjon
                </>
              )}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};
