import { Link, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bot, ChevronRight, Plus, Map } from "lucide-react";
import { AgentsPageShell } from "@/components/agents/AgentsPageShell";
import { AgentCostCard } from "@/components/agents/AgentCostCard";
import { AgentGovernanceControls } from "@/components/agents/AgentGovernanceControls";
import { useAgents } from "@/hooks/useAgents";

export default function AgentsOverview() {
  const navigate = useNavigate();
  const { agents } = useAgents();
  const active = agents.filter((a) => a.status === "active").length;

  return (
    <AgentsPageShell
      title="Agents"
      actions={
        <Button size="sm" onClick={() => navigate("/agents/new")}>
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          Ny agent
        </Button>
      }
    >
      <Card className="p-5">
        <div className="flex items-start gap-3">
          <Bot className="h-5 w-5 text-primary mt-0.5 shrink-0" />
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold">Bygg agenter som gjør reelt arbeid</h2>
              <Badge variant="outline" className="text-[10px]">Beta</Badge>
            </div>
            <p className="text-sm text-muted-foreground max-w-2xl">
              Agenter er digitale kolleger i HR, salg, kommunikasjon, økonomi og drift — ikke bare
              etterlevelse. Mynder holder styr på hva de får lov til, hvem som eier dem og hva de
              har gjort.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <Button size="sm" variant="outline" asChild>
                <Link to="/agents/mapping">
                  <Map className="h-3.5 w-3.5 mr-1.5" />
                  Kom i gang med kartlegging
                </Link>
              </Button>
              <Button size="sm" variant="ghost" asChild>
                <Link to="/agents/suggestions">Se forslag</Link>
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <AgentCostCard />

      <Link
        to="/agents/all"
        className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3 hover:bg-accent/40 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Bot className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">Alle agenter</p>
            <p className="text-xs text-muted-foreground">
              {agents.length} registrert · {active} aktive
            </p>
          </div>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </Link>

      <AgentGovernanceControls />

      <p className="text-xs text-muted-foreground">
        Prototype: agentene er dokumentert og styrt i Mynder, men kjører ikke ennå. Fullmakter og
        kontrollpunkter håndheves ikke automatisk.
      </p>
    </AgentsPageShell>
  );
}
