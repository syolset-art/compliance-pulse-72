import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessagesSquare, Plug, ShieldCheck, SlidersHorizontal, Zap } from "lucide-react";
import { ByoaConnectWizard } from "@/components/integrations/ByoaConnectWizard";
import { AgentAccessCenter } from "@/components/integrations/AgentAccessCenter";
import byoaHero from "@/assets/byoa-agent-hero.png";

const VALUE_POINTS = [
  {
    icon: MessagesSquare,
    title: "Spør Mynder fra agenten din",
    body: "Få svar fra virksomhetens compliance-grunnlag.",
  },
  {
    icon: Zap,
    title: "La agenten utføre arbeid",
    body: "Opprett aktiviteter, innhent dokumentasjon og start Playbooks.",
  },
  {
    icon: SlidersHorizontal,
    title: "Du bestemmer mandatet",
    body: "Velg hva agenten får lese, gjøre selv og hva du må godkjenne.",
  },
];

/**
 * BYOA – «La AI-agenten din jobbe i Mynder».
 * Toppseksjon på Datakilder og agenter, med Agent Access Center rett under.
 */
export function ByoaAgentHero() {
  const [wizardOpen, setWizardOpen] = useState(false);
  const [showAccess, setShowAccess] = useState(false);

  return (
    <>
      <Card className="mt-6 overflow-hidden border-border">
        <div className="flex flex-col md:flex-row">
          <div className="flex items-center justify-center bg-muted/50 p-6 md:w-1/2 md:p-10">
            <img
              src={byoaHero}
              alt="Din egen AI-agent koblet til Mynder"
              width={1024}
              height={1024}
              className="w-full max-w-[320px]"
            />
          </div>

          <div className="flex flex-1 flex-col justify-center p-6 md:p-10">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                La AI-agenten din jobbe i Mynder
              </h2>
              <Badge variant="outline" className="text-[10px]">
                Tilgjengelig nå
              </Badge>
            </div>

            <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
              Koble ChatGPT, Claude eller din egen AI-agent til Mynder. Spør om compliance-status,
              leverandører og krav – eller la agenten opprette aktiviteter og starte Playbooks for
              deg.
            </p>

            <ul className="mt-4 space-y-2">
              {VALUE_POINTS.map(({ icon: Icon, title, body }) => (
                <li key={title} className="flex gap-2">
                  <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                  <div>
                    <p className="text-[13px] font-medium text-foreground">{title}</p>
                    <p className="text-xs text-muted-foreground">{body}</p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Button className="h-10 gap-2" onClick={() => setWizardOpen(true)}>
                <Plug className="h-4 w-4" aria-hidden="true" />
                Koble til en agent
              </Button>
              <Button
                variant="outline"
                className="h-10 gap-2"
                onClick={() => setShowAccess((s) => !s)}
                aria-expanded={showAccess}
              >
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                Se og styre agenttilgang
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {showAccess && <AgentAccessCenter onConnectNew={() => setWizardOpen(true)} />}

      <ByoaConnectWizard open={wizardOpen} onOpenChange={setWizardOpen} />
    </>
  );
}
