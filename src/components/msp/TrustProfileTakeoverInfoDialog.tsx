import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Repeat, AlertTriangle } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TrustProfileTakeoverInfoDialog({ open, onOpenChange }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="h-4 w-4 text-primary" />
            Hvorfor bør kunden overta sin Trust Profile?
          </DialogTitle>
          <DialogDescription className="text-[13px]">
            En kort forklaring du kan dele med kunden.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-1">
          <div className="rounded-md border border-border bg-muted/30 p-3 flex items-start gap-3">
            <div className="h-8 w-8 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
              <Repeat className="h-4 w-4 text-primary" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">Lages én gang — gjenbrukes mange ganger</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Trust Profile lages én gang og kan gjenbrukes overfor leverandører, kunder, ansatte og myndigheter.
                Den blir kundens felles kilde til sannhet for sikkerhet, personvern og compliance.
              </p>
            </div>
          </div>

          <div className="rounded-md border border-warning/30 bg-warning/5 p-3 flex items-start gap-3">
            <div className="h-8 w-8 rounded-full bg-warning/15 flex items-center justify-center shrink-0">
              <AlertTriangle className="h-4 w-4 text-warning" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">Hvis kunden ikke overtar profilen</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Konsekvensen kan være at kunden blir spurt om å oppgi den samme informasjonen flere ganger —
                hver gang en leverandør, kunde eller myndighet ber om dokumentasjon.
              </p>
            </div>
          </div>

          <p className="text-xs text-muted-foreground pt-1">
            Det er opp til kunden å avgjøre om de vil overta profilen selv eller la deg som partner forvalte den
            videre på deres vegne.
          </p>
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Lukket</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
