import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AgentChip } from "@/components/agents/AgentChip";
import type { WorkAreaAgent } from "@/lib/agentWorkAreas";
import { Sparkles, Server, Package, Workflow, Bot, ArrowRight, User } from "lucide-react";

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
 * «Slik er {arbeidsområde} satt opp» – landingsblokken for et valgt
 * arbeidsområde: hvem eier det, hva er koblet til, og én tydelig inngang til
 * å kartlegge KI-muligheter.
 */
export function WorkAreaOverviewCard({
  workAreaName,
  workAreaId,
  responsiblePerson,
  description,
  counts,
  agents,
  onMapAi,
  onShowProcesses,
}: WorkAreaOverviewCardProps) {
  const stats = [
    { icon: Server, label: "Systemer", value: counts.systems },
    { icon: Package, label: "Eiendeler", value: counts.assets },
    { icon: Workflow, label: "Prosesser", value: counts.processes },
    { icon: Bot, label: "KI-agenter", value: agents.length },
  ];

  return (
    <Card className="p-5 sm:p-6 mb-4 sm:mb-6">
      <div className="flex flex-col lg:flex-row lg:items-start gap-5">
        <div className="flex-1 min-w-0">
          <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Slik er arbeidsområdet satt opp</p>
          <h2 className="text-lg sm:text-xl font-semibold text-foreground truncate">{workAreaName}</h2>
          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
            <User className="h-3.5 w-3.5" aria-hidden="true" />
            {responsiblePerson ? `Ansvarlig: ${responsiblePerson}` : "Ingen ansvarlig valgt ennå"}
          </p>
          {description && (
            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{description}</p>
          )}

          <dl className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
            {stats.map((s) => (
              <div key={s.label} className="rounded-lg border bg-muted/30 px-3 py-2">
                <dt className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <s.icon className="h-3 w-3" aria-hidden="true" />
                  {s.label}
                </dt>
                <dd className="text-lg font-semibold text-foreground leading-tight">{s.value}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-4">
            <p className="text-xs font-medium text-muted-foreground mb-1.5">KI-agenter i arbeid her</p>
            {agents.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Ingen agenter i arbeid ennå – start med å kartlegge KI-muligheter.
              </p>
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

        <div className="flex flex-col gap-2 lg:w-56 shrink-0">
          <Button onClick={onMapAi} className="gap-2 justify-center">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            Kartlegg KI-muligheter
          </Button>
          <Button variant="outline" onClick={onShowProcesses} className="gap-2 justify-center">
            Se prosesser
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Button>
          <p className="text-[11px] text-muted-foreground text-center lg:text-left">
            Lara foreslår – du bestemmer. Kartleggingen gir også RoPA og risiko.
          </p>
        </div>
      </div>
    </Card>
  );
}
