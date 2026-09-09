import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { AgentDomain, domainBadgeClass, domainLabel } from "@/lib/agentMacf";

export function AgentDomainBadge({ domain, className }: { domain?: AgentDomain; className?: string }) {
  if (!domain) return null;
  return (
    <Badge variant="outline" className={cn("text-[11px] font-medium", domainBadgeClass(domain), className)}>
      {domainLabel(domain)}
    </Badge>
  );
}
