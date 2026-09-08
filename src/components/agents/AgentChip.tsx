import { Link } from "react-router-dom";
import { Bot, Share2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { agentWorkAreas, isSharedAgent, type WorkAreaAgent } from "@/lib/agentWorkAreas";

interface AgentChipProps {
  agent: WorkAreaAgent;
  /** Arbeidsområdet chipen vises i – brukes til «her: prosess X» og «også i …». */
  currentWorkAreaId?: string;
  className?: string;
}

/**
 * Felles notasjon for KI-agenter: navn + «Delt (n)» når agenten jobber i flere
 * arbeidsområder. Tooltip viser alltid arbeidsområde → prosess.
 */
export function AgentChip({ agent, currentWorkAreaId, className }: AgentChipProps) {
  const areas = agentWorkAreas(agent);
  const shared = isSharedAgent(agent);
  const here = currentWorkAreaId ? agent.links.filter((l) => l.workAreaId === currentWorkAreaId) : [];
  const elsewhere = currentWorkAreaId ? areas.filter((a) => a.id !== currentWorkAreaId) : [];

  const body = (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border bg-background px-2.5 py-1 text-xs font-medium text-foreground",
        shared && "border-primary/40 bg-primary/5",
        agent.href && "hover:bg-muted transition-colors",
        className
      )}
    >
      <Bot className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
      <span className="truncate max-w-[180px]">{agent.name}</span>
      {shared && (
        <span className="inline-flex items-center gap-0.5 text-[10px] uppercase tracking-wide text-primary">
          <Share2 className="h-3 w-3" aria-hidden="true" />
          Delt ({areas.length})
        </span>
      )}
      {agent.source === "recruited" && (
        <span className="text-[10px] text-muted-foreground">Satt i arbeid</span>
      )}
    </span>
  );

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {agent.href ? (
          <Link to={agent.href} aria-label={`${agent.name}${shared ? ", delt agent" : ""}`}>
            {body}
          </Link>
        ) : (
          <button type="button" className="cursor-default" aria-label={`${agent.name}${shared ? ", delt agent" : ""}`}>
            {body}
          </button>
        )}
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-xs text-xs space-y-1.5">
        {here.length > 0 && (
          <p>
            <span className="text-muted-foreground">Her:</span>{" "}
            {here.map((l) => l.processName).join(", ")}
          </p>
        )}
        {elsewhere.length > 0 && (
          <p>
            <span className="text-muted-foreground">Også i:</span>{" "}
            {elsewhere.map((a) => a.name).join(", ")}
          </p>
        )}
        <div className="border-t border-border/60 pt-1.5">
          <p className="text-muted-foreground mb-0.5">Jobber i</p>
          <ul className="space-y-0.5">
            {agent.links.map((l) => (
              <li key={l.processId}>
                {l.workAreaName} → {l.processName}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-[10px] text-muted-foreground pt-1">
          Agenten hører til prosessene – arbeidsområdene er avledet.
        </p>
      </TooltipContent>
    </Tooltip>
  );
}
