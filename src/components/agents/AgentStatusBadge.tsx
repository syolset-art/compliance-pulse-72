import { Badge } from "@/components/ui/badge";
import { AgentStatus, statusBadgeClass, statusLabel } from "@/lib/agentMacf";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export function AgentStatusBadge({ status }: { status: AgentStatus }) {
  return (
    <Badge variant="outline" className={cn("gap-1 font-medium", statusBadgeClass(status))}>
      {status === "review" || status === "pending" ? <Clock className="h-3 w-3" /> : null}
      {statusLabel(status)}
    </Badge>
  );
}
