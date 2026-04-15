import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  ChevronRight,
  ArrowRight,
  ClipboardCheck,
} from "lucide-react";
import { useComplianceRequirements } from "@/hooks/useComplianceRequirements";

export function UserActionsWidget() {
  const navigate = useNavigate();
  const { grouped } = useComplianceRequirements({});

  const { data: pendingTasks = [] } = useQuery({
    queryKey: ["user-actions-tasks"],
    queryFn: async () => {
      const { data } = await supabase
        .from("tasks")
        .select("id, title, priority")
        .eq("status", "pending")
        .order("priority", { ascending: true })
        .limit(5);
      return data || [];
    },
  });

  // Combine manual compliance actions + pending tasks
  const actions = [
    ...grouped.incompleteManual
      .filter((r) => r.priority === "high" || r.priority === "critical")
      .slice(0, 2)
      .map((r) => ({
        id: `req-${r.requirement_id}`,
        title: r.name,
        route: "/compliance-checklist",
      })),
    ...pendingTasks.slice(0, 1).map((t) => ({
      id: `task-${t.id}`,
      title: t.title,
      route: "/tasks",
    })),
  ].slice(0, 3);

  return (
    <Card>
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4 text-primary" />
            Your actions
          </CardTitle>
          <Badge variant="outline" className="text-[13px] h-5">
            {actions.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-1.5 px-4 pb-3 pt-0">
        {actions.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            <CheckCircle2 className="h-6 w-6 mx-auto mb-1 opacity-40" />
            <p className="text-xs font-medium">All caught up!</p>
          </div>
        ) : (
          actions.map((action, i) => (
            <button
              key={action.id}
              onClick={() => navigate(action.route)}
              className="w-full flex items-center gap-2.5 p-2 rounded-lg border border-border hover:border-primary/30 hover:bg-primary/5 transition-all text-left group"
            >
              <div className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-[13px] font-bold shrink-0">
                {i + 1}
              </div>
              <p className="flex-1 min-w-0 text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                {action.title}
              </p>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary shrink-0" />
            </button>
          ))
        )}
      </CardContent>
    </Card>
  );
}
