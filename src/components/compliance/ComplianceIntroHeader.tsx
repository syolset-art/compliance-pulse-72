import { Bot, Sparkles, User, Lightbulb } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
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
  const { t, i18n } = useTranslation();
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
      description: isNorwegian 
        ? "Lara fullfører dette automatisk basert på dine systemer og prosesser"
        : "Lara completes these automatically based on your systems and processes"
    },
    {
      icon: Sparkles,
      label: "Hybrid",
      count: stats.byCapability.assisted,
      completed: stats.completedByCapability.assisted,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/20",
      description: isNorwegian
        ? "Lara forbereder dokumentasjon og forslag - du godkjenner eller justerer"
        : "Lara prepares documentation and proposals - you approve or adjust"
    },
    {
      icon: User,
      label: isNorwegian ? "Manuell" : "Manual",
      count: stats.byCapability.manual,
      completed: stats.completedByCapability.manual,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
      borderColor: "border-orange-500/20",
      description: isNorwegian
        ? "Krever din direkte handling - Lara gir veiledning og maler"
        : "Requires your direct action - Lara provides guidance and templates"
    }
  ];

  return (
    <Card className="mb-6 border-primary/10 bg-gradient-to-br from-card to-primary/5">
      <CardContent className="pt-6">
        {/* Header with Lara's message */}
        <div className="flex items-start gap-4 mb-6">
          <div className="p-3 rounded-full bg-primary/10 shrink-0">
            <Bot className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-lg text-foreground mb-1">
              {isNorwegian ? "Lara jobber for deg" : "Lara is working for you"}
            </h3>
            <p className="text-muted-foreground">
              {isNorwegian ? (
                <>
                  Jeg har analysert dine systemer og prosesser. Av {stats.total} {frameworkName}-kontroller 
                  kan jeg håndtere <span className="font-medium text-emerald-500">{stats.byCapability.full} autonomt</span>, 
                  <span className="font-medium text-blue-500"> {stats.byCapability.assisted} med din godkjenning</span>, og 
                  <span className="font-medium text-orange-500"> {stats.byCapability.manual} krever din direkte innsats</span>. 
                  La oss ta det stegvis.
                </>
              ) : (
                <>
                  I've analyzed your systems and processes. Of {stats.total} {frameworkName} controls, 
                  I can handle <span className="font-medium text-emerald-500">{stats.byCapability.full} autonomously</span>, 
                  <span className="font-medium text-blue-500"> {stats.byCapability.assisted} with your approval</span>, and 
                  <span className="font-medium text-orange-500"> {stats.byCapability.manual} require your direct effort</span>. 
                  Let's take it step by step.
                </>
              )}
            </p>
          </div>
        </div>

        {/* Capability cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {capabilityCards.map((cap) => {
            const Icon = cap.icon;
            const progressPercent = cap.count > 0 ? Math.round((cap.completed / cap.count) * 100) : 0;
            
            return (
              <div 
                key={cap.label}
                className={`p-4 rounded-lg border ${cap.borderColor} ${cap.bgColor} transition-all hover:scale-[1.02]`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Icon className={`h-5 w-5 ${cap.color}`} />
                  <span className="font-semibold text-foreground">{cap.count}</span>
                  <span className="text-sm text-muted-foreground">{cap.label}</span>
                </div>
                <div className="text-xs text-muted-foreground mb-2">
                  {cap.completed} {isNorwegian ? "fullført" : "completed"}
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${cap.color.replace('text-', 'bg-')} transition-all duration-500`}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <Separator className="mb-4" />

        {/* Tip section */}
        <div className="flex items-center gap-3 text-sm">
          <Lightbulb className="h-4 w-4 text-amber-500 shrink-0" />
          <p className="text-muted-foreground">
            {isNorwegian 
              ? "Tips: Filtrer på \"Manuell\" for å se hva som krever din handling først"
              : "Tip: Filter by \"Manual\" to see what requires your action first"}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
