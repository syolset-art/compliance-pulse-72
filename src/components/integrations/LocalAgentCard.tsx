import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Bell, HelpCircle, Laptop } from "lucide-react";
import { SaraOnboardingDialog } from "@/components/agents/SaraOnboardingDialog";

/**
 * Sara – lokal agent hos kunden. Ikke lansert ennå, så dette er
 * et nedtonet «kommer senere»-kort som ligger nederst på siden.
 */
export function LocalAgentCard() {
  const [open, setOpen] = useState(false);

  return (
    <Card className="mt-8 border-dashed bg-muted/20 p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Laptop className="h-5 w-5" aria-hidden="true" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-foreground">Sara jobber hos deg</h3>
            <Badge variant="outline" className="text-[10px]">
              Kommer senere
            </Badge>
          </div>
          <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-muted-foreground">
            Sara skal kjøre i din egen infrastruktur og lese dokumentene dine lokalt. Bare et kort,
            strukturert funn sendes til Mynder — og et menneske hos dere godkjenner det alltid
            først. Vi jobber med den nå.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-9 gap-2"
            onClick={() =>
              toast.success("Vi sier fra når Sara er klar", {
                description: "Interessen din er registrert hos Mynder.",
              })
            }
          >
            <Bell className="h-3.5 w-3.5" aria-hidden="true" />
            Hold meg oppdatert
          </Button>
          <Button variant="ghost" size="sm" className="h-9 gap-2" onClick={() => setOpen(true)}>
            <HelpCircle className="h-3.5 w-3.5" aria-hidden="true" />
            Les mer
          </Button>
        </div>
      </div>

      <SaraOnboardingDialog open={open} onOpenChange={setOpen} />
    </Card>
  );
}
