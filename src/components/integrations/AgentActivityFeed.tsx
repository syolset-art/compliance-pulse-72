import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, CheckCircle2, Clock } from "lucide-react";

export interface AgentActivityItem {
  id: string;
  source: string;
  summary: string;
  at: string;
  status: "pending" | "approved";
}

interface AgentActivityFeedProps {
  items: AgentActivityItem[];
}

/** Kompakt logg over hva agentene har oppdaget og hva som venter på godkjenning. */
export function AgentActivityFeed({ items }: AgentActivityFeedProps) {
  return (
    <section className="mt-8">
      <div className="flex items-baseline gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">
          Agentaktivitet
        </h2>
        <span className="text-xs text-muted-foreground">Siste funn fra kildene dine.</span>
      </div>

      <Card className="mt-3 divide-y divide-border">
        {items.length === 0 ? (
          <div className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
            <Activity className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
            Ingen funn ennå — koble til en kilde eller start Sara.
          </div>
        ) : (
          items.slice(0, 8).map((item) => (
            <div key={item.id} className="flex items-center gap-3 px-4 py-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Activity className="h-3.5 w-3.5" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-foreground">{item.summary}</p>
                <p className="text-xs text-muted-foreground">
                  {item.source} ·{" "}
                  {new Date(item.at).toLocaleString("nb-NO", {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                </p>
              </div>
              <Badge
                variant="outline"
                className={
                  item.status === "approved"
                    ? "border-success/30 bg-success/15 text-[10px] text-success"
                    : "border-warning/30 bg-warning/15 text-[10px] text-warning"
                }
              >
                {item.status === "approved" ? (
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                ) : (
                  <Clock className="mr-1 h-3 w-3" />
                )}
                {item.status === "approved" ? "Godkjent" : "Venter på godkjenning"}
              </Badge>
            </div>
          ))
        )}
      </Card>
    </section>
  );
}
