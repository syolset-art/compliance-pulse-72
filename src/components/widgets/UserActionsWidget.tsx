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
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-primary" />
            Your actions required
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            {actions.length} pending
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">To improve compliance</p>
      </CardHeader>
      <CardContent className="space-y-2">
        {actions.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <CheckCircle2 className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm font-medium">All caught up!</p>
          </div>
        ) : (
          <>
            {actions.map((action, i) => (
              <button
                key={action.id}
                onClick={() => navigate(action.route)}
                className="w-full flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/30 hover:bg-primary/5 transition-all text-left group"
              >
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                    {action.title}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{action.subtitle}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary shrink-0" />
              </button>
            ))}
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-muted-foreground hover:text-foreground mt-1"
              onClick={() => navigate("/tasks")}
            >
              View all actions <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
