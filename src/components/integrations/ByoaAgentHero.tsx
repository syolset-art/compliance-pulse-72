import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Plug, ShieldCheck, ListChecks, PenLine } from "lucide-react";
import { ByoaConnectWizard } from "@/components/integrations/ByoaConnectWizard";
import { MCP_EXPOSED_TOOLS } from "@/lib/mcpAgentConnections";
import byoaHero from "@/assets/byoa-agent-hero.png";

/**
 * BYOA – «Bruk din egen agent i Mynder».
 * Toppseksjon på Datakilder og agenter: illustrasjon til venstre,
 * forklaring og CTA til høyre.
 */
export function ByoaAgentHero() {
  const [wizardOpen, setWizardOpen] = useState(false);
  const [showTools, setShowTools] = useState(false);

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
                Bruk din egen agent i Mynder
              </h2>
              <Badge variant="outline" className="text-[10px]">
                Tilgjengelig nå
              </Badge>
            </div>

            <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
              Har du Claude eller ChatGPT? Koble den til Mynder én gang, så kan du spørre den om
              leverandører, krav og dokumentasjon — og be den opprette aktiviteter for deg. Du
              trenger ikke logge inn i Mynder.
            </p>

            <ul className="mt-4 space-y-1.5">
              {[
                { icon: BookOpen, text: "Les leverandører og krav" },
                { icon: PenLine, text: "Opprett aktiviteter" },
                {
                  icon: ShieldCheck,
                  text: "Du styrer tilgangen, og kan trekke den tilbake når som helst",
                },
              ].map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-2 text-[13px] text-foreground">
                  <Icon className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />
                  {text}
                </li>
              ))}
            </ul>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Button className="h-10 gap-2" onClick={() => setWizardOpen(true)}>
                <Plug className="h-4 w-4" aria-hidden="true" />
                Koble til agenten min
              </Button>
              <Button
                variant="outline"
                className="h-10 gap-2"
                onClick={() => setShowTools((s) => !s)}
                aria-expanded={showTools}
              >
                <ListChecks className="h-4 w-4" aria-hidden="true" />
                Hva agenten får se
              </Button>
            </div>
          </div>
        </div>

        {showTools && (
          <div className="border-t border-border bg-muted/20 px-6 py-4 md:px-10">
            <p className="text-[13px] font-medium text-foreground">Dette kan agenten din gjøre</p>
            <ul className="mt-2 space-y-1.5">
              {MCP_EXPOSED_TOOLS.map((tool) => {
                const writes = tool.name === "create_activity";
                return (
                  <li key={tool.name} className="flex flex-wrap items-center gap-2 text-[13px]">
                    <span className={writes ? "font-medium text-foreground" : "text-foreground"}>
                      {tool.nb}
                    </span>
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${writes ? "border-primary/40 text-primary" : "text-muted-foreground"}`}
                    >
                      {writes ? "Endrer noe" : "Kun lesing"}
                    </Badge>
                  </li>
                );
              })}
            </ul>
            <p className="mt-3 text-xs text-muted-foreground">
              Agenten ser bare det du selv har tilgang til i Mynder. Ingenting slettes, og du kan
              trekke tilbake koden når som helst.
            </p>
          </div>
        )}
      </Card>

      <ByoaConnectWizard open={wizardOpen} onOpenChange={setWizardOpen} />
    </>
  );
}
