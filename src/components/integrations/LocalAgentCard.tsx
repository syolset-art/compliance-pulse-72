import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Download, HelpCircle } from "lucide-react";
import { SaraOnboardingDialog } from "@/components/agents/SaraOnboardingDialog";
import { useSaraAgent } from "@/lib/saraAgent";
import saraAgentHero from "@/assets/sara-agent-hero.png";

/**
 * Lokal agent (Sara) – annonsepreget seksjon øverst på Datakilder og agenter.
 * Illustrasjon til venstre, informasjon og CTA til høyre.
 */
export function LocalAgentCard() {
  const [open, setOpen] = useState(false);
  const { installed, markInstalled } = useSaraAgent();

  return (
    <Card className="mt-6 overflow-hidden border-border">
      <div className="flex flex-col md:flex-row">
        {/* Illustrasjon */}
        <div className="relative flex items-center justify-center bg-muted/50 p-6 md:w-1/2 md:p-10">
          <div className="relative w-full max-w-[320px]">
            <img
              src={saraAgentHero}
              alt="Sara – lokal Mynder compliance agent"
              loading="lazy"
              width={1024}
              height={1024}
              className="w-full"
            />
          </div>
        </div>

        {/* Informasjon og CTA */}
        <div className="flex flex-1 flex-col justify-center p-6 md:p-10">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">
              Sara jobber hos deg
            </h2>
            <Badge variant="outline" className="text-[10px]">
              Kommer snart
            </Badge>
          </div>

          <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
            Dokumentene dine forlater aldri deg. Bare et kort, strukturert funn sendes til
            Mynder — og et menneske hos dere godkjenner det alltid først.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button
              disabled={installed}
              onClick={() => {
                markInstalled();
                toast.success(
                  "Sara er registrert som installert. Funn fra dokumentkildene dine vises nå i kravlistene.",
                );
              }}
              className="h-10 gap-2"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              {installed ? "Lastet ned" : "Kom i gang"}
            </Button>

            <Button
              variant="outline"
              onClick={() => setOpen(true)}
              className="h-10 gap-2"
            >
              <HelpCircle className="h-4 w-4" aria-hidden="true" />
              Hva Sara aldri gjør
            </Button>
          </div>
        </div>
      </div>

      <SaraOnboardingDialog open={open} onOpenChange={setOpen} />
    </Card>
  );
}
