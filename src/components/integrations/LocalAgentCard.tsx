import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Bot, Download, HelpCircle, CalendarClock, Shield } from "lucide-react";
import { SaraOnboardingDialog } from "@/components/agents/SaraOnboardingDialog";
import { useSaraAgent } from "@/lib/saraAgent";
import saraAgentPng from "@/assets/sara-agent.png";

const DOC_SOURCES: { name: string; available: boolean }[] = [
  { name: "Notion", available: true },
];

/**
 * Lokal agent (Sara) – annonsepreget seksjon øverst på Datakilder og agenter.
 * Illustrasjon til venstre, informasjon og CTA til høyre.
 */
export function LocalAgentCard() {
  const [open, setOpen] = useState(false);
  const { installed, markInstalled } = useSaraAgent();

  return (
    <Card className="mt-6 overflow-hidden border-primary/20">
      <div className="flex flex-col md:flex-row">
        {/* Illustrasjon */}
        <div className="relative flex items-center justify-center bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 p-6 md:w-2/5 md:p-8">
          <div className="relative w-full max-w-[240px]">
            <img
              src={saraAgentPng}
              alt="Sara – lokal Mynder compliance agent"
              loading="lazy"
              width={1024}
              height={1024}
              className="w-full rounded-lg"
            />
            <div className="absolute -bottom-2 -right-2 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg">
              <Bot className="h-5 w-5" aria-hidden="true" />
            </div>
          </div>
        </div>

        {/* Informasjon og CTA */}
        <div className="flex flex-1 flex-col justify-between p-6 md:p-8">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-foreground">Sara – lokal compliance agent</h2>
              <Badge variant="outline" className="text-[10px]">
                Kommer snart
              </Badge>
            </div>

            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Sara kjører i din egen infrastruktur og leser dokumentkildene dine der de er. Alt
              prosesseres lokalt — dokumentene forlater aldri din server, og bare verifiserte funn
              sendes til Mynder.
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs text-primary">
                <Shield className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="font-medium">Personvern og sikkerhet fra bunnen</span>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              {DOC_SOURCES.map((s) => (
                <Badge key={s.name} variant="default" className="text-[10px] font-normal">
                  {s.name}
                </Badge>
              ))}
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
              <span>
                Status:{" "}
                <span className="font-medium text-foreground">
                  {installed ? "Installert" : "Ikke installert"}
                </span>
              </span>
              <span className="flex items-center gap-1">
                <CalendarClock className="h-3.5 w-3.5" aria-hidden="true" />
                Kjøring:{" "}
                <span className="font-medium text-foreground">Manuell start</span>
              </span>
              <span>
                Sist kjørt:{" "}
                <span className="font-medium text-foreground">
                  {installed ? "I dag 09:12" : "—"}
                </span>
              </span>
            </div>
          </div>

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
              {installed ? "Lastet ned" : "Last ned Sara"}
            </Button>

            <Button variant="outline" onClick={() => setOpen(true)} className="h-10 gap-2">
              <HelpCircle className="h-4 w-4" aria-hidden="true" />
              Slik kommer du i gang
            </Button>
          </div>
        </div>
      </div>

      <SaraOnboardingDialog open={open} onOpenChange={setOpen} />
    </Card>
  );
}
