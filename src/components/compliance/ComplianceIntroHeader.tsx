import { Bot, Sparkles, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslation } from "react-i18next";

interface ComplianceIntroHeaderProps {
  stats: {
    total: number;
    completed: number;
    inProgress: number;
    aiHandling: number;
    byCapability: {
      full: number;
      assisted: number;
      manual: number;
    };
    completedByCapability: {
      full: number;
      assisted: number;
      manual: number;
    };
  };
  frameworkName?: string;
}

export function ComplianceIntroHeader({ stats, frameworkName = "ISO 27001" }: ComplianceIntroHeaderProps) {
  const { i18n } = useTranslation();
  const isNorwegian = i18n.language === 'nb';

  const capabilityCards = [
    {
      icon: Bot,
      label: "AI Ready",
      count: stats.byCapability.full,
      completed: stats.completedByCapability.full,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
      borderColor: "border-emerald-500/20",
      desc: isNorwegian ? "Lara håndterer automatisk" : "Lara handles automatically",
    },
    {
      icon: Sparkles,
      label: "Hybrid",
      count: stats.byCapability.assisted,
      completed: stats.completedByCapability.assisted,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/20",
      desc: isNorwegian ? "Lara forbereder, du godkjenner" : "Lara prepares, you approve",
    },
    {
      icon: User,
      label: isNorwegian ? "Manuell" : "Manual",
      count: stats.byCapability.manual,
      completed: stats.completedByCapability.manual,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
      borderColor: "border-orange-500/20",
      desc: isNorwegian ? "Krever din handling" : "Requires your action",
    }
  ];

  return (
    <Card className="mb-6 border-primary/10 bg-gradient-to-br from-card to-primary/5">
      <CardContent className="pt-5 pb-5">
        {/* Compact header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-full bg-primary/10 shrink-0">
            <Bot className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              {isNorwegian
                ? `${stats.total} ${frameworkName}-krav fordelt på tre nivåer`
                : `${stats.total} ${frameworkName} requirements across three levels`}
            </p>
            <p className="text-xs text-muted-foreground">
              {isNorwegian
                ? `${stats.completed} fullført · ${stats.inProgress} pågår`
                : `${stats.completed} completed · ${stats.inProgress} in progress`}
            </p>
          </div>
        </div>

        {/* Capability cards */}
        <div className="grid grid-cols-3 gap-3">
          {capabilityCards.map((cap) => {
            const Icon = cap.icon;
            const pct = cap.count > 0 ? Math.round((cap.completed / cap.count) * 100) : 0;

            return (
              <div
                key={cap.label}
                className={`p-3 rounded-lg border ${cap.borderColor} ${cap.bgColor}`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <Icon className={`h-4 w-4 ${cap.color}`} />
                  <span className="font-semibold text-sm text-foreground">{cap.count}</span>
                  <span className="text-xs text-muted-foreground">{cap.label}</span>
                </div>
                <p className="text-[11px] text-muted-foreground mb-1.5">{cap.desc}</p>
                <div className="h-1 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full ${cap.color.replace('text-', 'bg-')} transition-all duration-500`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {cap.completed}/{cap.count} {isNorwegian ? "fullført" : "done"}
                </p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
