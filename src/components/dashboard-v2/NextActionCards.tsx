import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Zap, AlertTriangle, FileText, Shield, BookOpen, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { RequirementWithStatus } from "@/hooks/useComplianceRequirements";

const XP_MAP: Record<string, number> = { critical: 50, high: 30, medium: 20, low: 10 };

const CATEGORY_ICON: Record<string, typeof Shield> = {
  organizational: Shield,
  people: Users,
  legal: FileText,
  technological: Shield,
  governance: Shield,
  physical: Shield,
};

const CATEGORY_ROUTE: Record<string, string> = {
  organizational: "/compliance-checklist",
  people: "/mynder-me",
  legal: "/assets",
  technological: "/assets",
  governance: "/regulations",
  physical: "/compliance-checklist",
};

interface NextActionCardsProps {
  actions: RequirementWithStatus[];
}

export function NextActionCards({ actions }: NextActionCardsProps) {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const isNorwegian = i18n.language === "nb" || i18n.language === "no";
  const top = actions.slice(0, 5);

  if (top.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 flex items-center justify-center text-muted-foreground text-sm">
        {isNorwegian ? "🎉 Ingen ventende handlinger!" : "🎉 No pending actions!"}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">
        {isNorwegian ? "Neste handling" : "Next actions"}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {top.map((action) => {
          const xp = XP_MAP[action.priority] || 10;
          const Icon = CATEGORY_ICON[action.category] || Shield;
          const route = CATEGORY_ROUTE[action.category] || "/tasks";

          return (
            <div
              key={`${action.framework_id}-${action.requirement_id}`}
              className="rounded-xl border border-border bg-card p-4 flex flex-col gap-3 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-muted p-2">
                  {action.priority === "critical" ? (
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                  ) : (
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground line-clamp-2">
                    {isNorwegian ? action.name_no : action.name}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                    {action.framework_id.toUpperCase()} · {action.requirement_id}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between mt-auto pt-1">
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-warning dark:text-warning">
                  <Zap className="h-3 w-3" />
                  +{xp} XP
                </span>
                <Button
                  size="sm"
                  className="h-8 text-xs gap-1.5 px-3"
                  onClick={() => navigate(route)}
                >
                  {isNorwegian ? "Start" : "Start"}
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
