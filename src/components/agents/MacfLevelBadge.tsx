import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { MacfLevel, macfBadgeClass, macfLabel } from "@/lib/agentMacf";
import { cn } from "@/lib/utils";

export function MacfLevelBadge({ level }: { level: MacfLevel }) {
  const Icon =
    level === "not_assessed" ? AlertTriangle :
    level === "L3_pending" ? Clock : CheckCircle2;
  return (
    <Badge variant="outline" className={cn("gap-1 font-medium", macfBadgeClass(level))}>
      <Icon className="h-3 w-3" />
      {macfLabel(level)}
    </Badge>
  );
}
