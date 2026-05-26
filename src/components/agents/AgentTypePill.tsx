import { Badge } from "@/components/ui/badge";
import { AgentKind } from "@/lib/agentMacf";
import { cn } from "@/lib/utils";

export function AgentTypePill({ kind }: { kind: AgentKind }) {
  if (kind === "mynder") {
    return (
      <Badge variant="outline" className={cn("bg-primary/15 text-primary border-primary/30 font-medium")}>
        Mynder
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className={cn("bg-warning/15 text-warning border-warning/30 font-medium")}>
      BYOA
    </Badge>
  );
}
