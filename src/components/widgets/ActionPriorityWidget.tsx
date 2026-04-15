import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  Clock,
  Shield,
  ChevronRight,
  ArrowRight,
  Zap,
  CalendarClock,
  ClipboardList,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useComplianceRequirements } from "@/hooks/useComplianceRequirements";

interface ActionItem {
  id: string;
  title: string;
  subtitle?: string;
  icon: React.ElementType;
  route: string;
  priority: "critical" | "high" | "medium";
}

export function ActionPriorityWidget() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isNorwegian = i18n.language === "nb" || i18n.language === "no";
  const { grouped } = useComplianceRequirements({});

  // Fetch open incidents
  const { data: openIncidents = [] } = useQuery({
    queryKey: ["action-open-incidents"],
    queryFn: async () => {
      const { data } = await supabase
        .from("system_incidents")
        .select("id, title, criticality")
        .not("status", "in", '("resolved","closed")')
        .order("created_at", { ascending: false })
        .limit(3);
      return data || [];
    },
  });

  // Fetch overdue reviews
  const { data: overdueReviews = [] } = useQuery({
    queryKey: ["action-overdue-reviews"],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const { data } = await supabase
        .from("systems")
        .select("id, name, next_review_date")
        .lt("next_review_date", today)
        .not("next_review_date", "is", null)
        .limit(3);
      return data || [];
    },
  });

  // Fetch upcoming tasks
  const { data: upcomingTasks = [] } = useQuery({
    queryKey: ["action-upcoming-tasks"],
    queryFn: async () => {
      const { data } = await supabase
        .from("tasks")
        .select("id, title, priority, status")
        .eq("status", "pending")
        .order("priority", { ascending: true })
        .limit(3);
      return data || [];
    },
  });

  // Build critical items
  const criticalItems: ActionItem[] = [
    ...openIncidents.map((inc) => ({
      id: `inc-${inc.id}`,
      title: inc.title,
      subtitle: isNorwegian ? "Åpen hendelse" : "Open incident",
      icon: AlertTriangle,
      route: "/tasks?filter=open_incidents",
      priority: "critical" as const,
    })),
    ...overdueReviews.map((rev) => ({
      id: `rev-${rev.id}`,
      title: rev.name,
      subtitle: isNorwegian ? "Forfalt gjennomgang" : "Overdue review",
      icon: Clock,
      route: "/systems",
      priority: "high" as const,
    })),
  ].slice(0, 3);

  // Build next actions from manual compliance requirements
  const nextActions: ActionItem[] = grouped.incompleteManual
    .filter((r) => r.priority === "critical" || r.priority === "high")
    .slice(0, 3)
    .map((req) => ({
      id: `req-${req.requirement_id}`,
      title: isNorwegian ? (req.name_no || req.name) : req.name,
      subtitle: isNorwegian
        ? (req.description_no || req.description || "")
        : (req.description || ""),
      icon: ClipboardList,
      route: "/compliance-checklist",
      priority: req.priority as "critical" | "high",
    }));

  // Build upcoming from tasks
  const upcoming: ActionItem[] = upcomingTasks.map((task) => ({
    id: `task-${task.id}`,
    title: task.title,
    subtitle: isNorwegian ? "Ventende oppgave" : "Pending task",
    icon: CalendarClock,
    route: "/tasks",
    priority: "medium" as const,
  }));

  const priorityColor = {
    critical: "bg-destructive/10 text-destructive border-destructive/20",
    high: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
    medium: "bg-muted text-muted-foreground border-border",
  };

  const priorityLabel = {
    critical: isNorwegian ? "Kritisk" : "Critical",
    high: isNorwegian ? "Høy" : "High",
    medium: isNorwegian ? "Normal" : "Normal",
  };

  const sections = [
    {
      key: "critical",
      label: isNorwegian ? "Krever handling nå" : "Requires action now",
      icon: Zap,
      items: criticalItems,
      color: "text-destructive",
    },
    {
      key: "next",
      label: isNorwegian ? "Neste prioriterte handlinger" : "Next priority actions",
      icon: Shield,
      items: nextActions,
      color: "text-primary",
    },
    {
      key: "upcoming",
      label: isNorwegian ? "Kommende oppgaver" : "Upcoming tasks",
      icon: CalendarClock,
      items: upcoming,
      color: "text-muted-foreground",
    },
  ].filter((s) => s.items.length > 0);

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-foreground">
            {isNorwegian ? "Hva må jeg gjøre nå?" : "What should I do now?"}
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            {criticalItems.length + nextActions.length + upcoming.length}{" "}
            {isNorwegian ? "handlinger" : "actions"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {sections.map((section) => {
          const SectionIcon = section.icon;
          return (
            <div key={section.key} className="space-y-2">
              <div className={cn("flex items-center gap-2 text-xs font-semibold uppercase tracking-wider", section.color)}>
                <SectionIcon className="h-3.5 w-3.5" />
                {section.label}
              </div>
              <div className="space-y-1.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => navigate(item.route)}
                      className="w-full flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/30 hover:bg-primary/5 transition-all text-left group"
                    >
                      <div className={cn("p-2 rounded-lg border", priorityColor[item.priority])}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate">
                          {item.title}
                        </p>
                        {item.subtitle && (
                          <p className="text-xs text-muted-foreground truncate">
                            {item.subtitle}
                          </p>
                        )}
                      </div>
                      <Badge variant="outline" className={cn("text-[13px] shrink-0 border", priorityColor[item.priority])}>
                        {priorityLabel[item.priority]}
                      </Badge>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}

        {sections.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Shield className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm font-medium">
              {isNorwegian ? "Ingen ventende handlinger!" : "No pending actions!"}
            </p>
            <p className="text-xs mt-1">
              {isNorwegian ? "Alt er under kontroll" : "Everything is under control"}
            </p>
          </div>
        )}

        <Button
          variant="ghost"
          className="w-full text-primary hover:text-primary/80 hover:bg-primary/10"
          onClick={() => navigate("/tasks")}
        >
          {isNorwegian ? "Se alle oppgaver" : "View all tasks"}
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </CardContent>
    </Card>
  );
}
