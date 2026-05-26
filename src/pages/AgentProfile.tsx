import { useNavigate, useParams } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Bot, ShieldCheck } from "lucide-react";
import { getAgent } from "@/lib/agentMacf";
import { AgentTypePill } from "@/components/agents/AgentTypePill";
import { AgentStatusBadge } from "@/components/agents/AgentStatusBadge";
import { MacfLevelBadge } from "@/components/agents/MacfLevelBadge";
import { AgentTrustBar } from "@/components/agents/AgentTrustBar";

export default function AgentProfile() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const agent = getAgent(id);

  if (!agent) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <div className="flex-1 p-6 pt-16">
          <div className="max-w-3xl mx-auto">
            <Button variant="ghost" size="sm" onClick={() => navigate("/agents")}>
              <ArrowLeft className="h-4 w-4 mr-1.5" /> Tilbake til registeret
            </Button>
            <Card className="mt-4"><CardContent className="py-12 text-center">
              <Bot className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">Fant ikke agenten.</p>
            </CardContent></Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <main className="flex-1 p-6 overflow-y-auto pt-16">
          <div className="max-w-5xl mx-auto space-y-5">
            <Button variant="ghost" size="sm" onClick={() => navigate("/agents")} className="-ml-2">
              <ArrowLeft className="h-4 w-4 mr-1.5" /> Tilbake
            </Button>

            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold">{agent.name}</h1>
                  <AgentTypePill kind={agent.kind} />
                </div>
                <p className="text-sm text-muted-foreground mt-1">{agent.subtitle}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <AgentStatusBadge status={agent.status} />
                <MacfLevelBadge level={agent.macf_level} />
              </div>
            </div>

            <Card>
              <CardContent className="p-4 flex items-center justify-between flex-wrap gap-4">
                <div>
                  <div className="text-xs text-muted-foreground">Tillit-score</div>
                  <div className="mt-1"><AgentTrustBar score={agent.trust_score} /></div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Leverandør</div>
                  <div className="text-sm font-medium mt-1">{agent.provider}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Eier-team</div>
                  <div className="text-sm font-medium mt-1">{agent.owner_team}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Audit-logging</div>
                  <div className="text-sm font-medium mt-1">{agent.audit_logging ? "Aktivert" : "Ikke aktivert"}</div>
                </div>
              </CardContent>
            </Card>

            <Tabs defaultValue="overview">
              <TabsList>
                <TabsTrigger value="overview">Oversikt</TabsTrigger>
                <TabsTrigger value="macf">MACF</TabsTrigger>
                <TabsTrigger value="risk">Risikovurdering</TabsTrigger>
                <TabsTrigger value="audit">Audit-logg</TabsTrigger>
                <TabsTrigger value="connections">Tilkoblinger</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4 mt-4">
                <Card>
                  <CardHeader><CardTitle className="text-base">Formål</CardTitle></CardHeader>
                  <CardContent className="text-sm text-foreground/90">
                    {agent.purpose || "Ingen beskrivelse registrert."}
                  </CardContent>
                </Card>
                <div className="grid md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader><CardTitle className="text-base">Datatilfang</CardTitle></CardHeader>
                    <CardContent className="text-sm">
                      {agent.data_scope?.length ? (
                        <ul className="list-disc pl-5 space-y-1 text-foreground/90">
                          {agent.data_scope.map((d) => <li key={d}>{d}</li>)}
                        </ul>
                      ) : <p className="text-muted-foreground">Ikke registrert.</p>}
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader><CardTitle className="text-base">Tool-sett</CardTitle></CardHeader>
                    <CardContent className="text-sm">
                      {agent.tools?.length ? (
                        <div className="flex flex-wrap gap-1.5">
                          {agent.tools.map((t) => (
                            <code key={t} className="text-xs bg-muted px-1.5 py-0.5 rounded">{t}</code>
                          ))}
                        </div>
                      ) : <p className="text-muted-foreground">Ingen tools registrert.</p>}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="macf" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-primary" />
                      MACF-rammeverket
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-3 text-foreground/90">
                    <p>
                      MACF (Mynder Agent Compliance Framework) klassifiserer agenter etter autonomi,
                      datatilgang og risikoeksponering. Lara vurderer agenten kontinuerlig mot:
                    </p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Runtime-grenser (MAX_TURNS, timeout, context-budsjett)</li>
                      <li>RBAC og privilegerte roller</li>
                      <li>Prompt injection-deteksjon</li>
                      <li>Audit-logging og sporbarhet</li>
                      <li>Regelverkskobling (NIS2, GDPR, EU AI Act)</li>
                    </ul>
                    <p className="text-muted-foreground">
                      Detaljert MACF-evaluering aktiveres i neste iterasjon.
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>

              {(["risk","audit","connections"] as const).map((tab) => (
                <TabsContent key={tab} value={tab} className="mt-4">
                  <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">
                    Kommer i neste iterasjon.
                  </CardContent></Card>
                </TabsContent>
              ))}
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}
