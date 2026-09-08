import { Button } from "@/components/ui/button";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AgentChip } from "@/components/agents/AgentChip";
import type { WorkAreaAgent } from "@/lib/agentWorkAreas";
import { Sparkles, Bot, User } from "lucide-react";

interface WorkAreaOverviewCardProps {
  workAreaName: string;
  workAreaId: string;
  responsiblePerson: string | null;
  description: string | null;
  counts: { systems: number; assets: number; processes: number };
  agents: WorkAreaAgent[];
  onMapAi: () => void;
  onShowProcesses: () => void;
}

/**
 * Kompakt handlingsstripe for valgt arbeidsområde: tellere i løpende tekst,
 * agent-chips og én tydelig inngang til å kartlegge KI-muligheter.
 */
export function WorkAreaOverviewCard({
  workAreaId,
  responsiblePerson,
  counts,
  agents,
  onMapAi,
  onShowProcesses,
}: WorkAreaOverviewCardProps) {
  const stats = `${counts.systems} systemer · ${counts.assets} eiendeler · ${counts.processes} prosesser`;

  return (
    <div className="mb-4 sm:mb-6 rounded-lg border bg-muted/30 px-4 py-3 flex flex-wrap items-center gap-x-6 gap-y-3">
      <div className="min-w-0 flex-1 flex flex-wrap items-center gap-x-6 gap-y-2">
        <p className="text-sm text-muted-foreground">
          {stats}
          {responsiblePerson && <span className="hidden sm:inline"> · Ansvarlig: {responsiblePerson}</span>}
        </p>

        <div className="flex items-center gap-1.5 min-w-0">
          <Bot className="h-3.5 w-3.5 text-muted-foreground shrink-0" aria-hidden="true" />
          {agents.length === 0 ? (
            <span className="text-sm text-muted-foreground">Ingen KI-agenter i arbeid ennå</span>
          ) : (
            <TooltipProvider delayDuration={150}>
              <div className="flex flex-wrap gap-1.5">
                {agents.map((a) => (
                  <AgentChip key={a.id} agent={a} currentWorkAreaId={workAreaId} />
                ))}
              </div>
            </TooltipProvider>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <Button variant="ghost" size="sm" onClick={onShowProcesses} className="text-muted-foreground">
          Se prosesser
        </Button>
        <Button size="sm" onClick={onMapAi} className="gap-1.5">
          <Sparkles className="h-4 w-4" aria-hidden="true" />
          Kartlegg KI-muligheter
        </Button>
      </div>
    </div>
  );
}
