import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMaturityScore } from "@/hooks/useMaturityScore";
import { Award, CheckCircle2, Shield, FileText, Settings, Users, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { nb } from "date-fns/locale";

const milestoneIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  framework_activated: Shield,
  task_completed: CheckCircle2,
  system_documented: Settings,
  process_documented: FileText,
  role_created: Users,
  default: Award,
};

const milestoneLabels: Record<string, string> = {
  framework_activated: "Regelverk aktivert",
  task_completed: "Oppgave fullført",
  system_documented: "System dokumentert",
  process_documented: "Prosess dokumentert",
  role_created: "Rolle opprettet",
};

export function MilestoneTimeline() {
  const { data: maturity, isLoading } = useMaturityScore();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const milestones = maturity?.milestones || [];

  if (milestones.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            Dine compliance-milepæler
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <Award className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-sm">
              Ingen milepæler ennå. Aktiver regelverk og fullfør oppgaver for å se fremgangen din her.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show only the last 5 milestones
  const recentMilestones = milestones.slice(0, 5);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Award className="h-5 w-5 text-primary" />
          Dine compliance-milepæler
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
          
          <div className="space-y-4">
            {recentMilestones.map((milestone, index) => {
              const Icon = milestoneIcons[milestone.type] || milestoneIcons.default;
              const label = milestoneLabels[milestone.type] || milestone.type;
              
              return (
                <div key={milestone.id} className="relative flex gap-4 pl-10">
                  {/* Timeline dot */}
                  <div className="absolute left-2 top-1 w-5 h-5 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-primary flex-shrink-0" />
                      <span className="text-sm font-medium text-foreground truncate">
                        {milestone.description || label}
                      </span>
                      <span className="text-xs text-green-600 flex-shrink-0">
                        +{milestone.points}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatDistanceToNow(milestone.achievedAt, { 
                        addSuffix: true, 
                        locale: nb 
                      })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {milestones.length > 5 && (
          <p className="text-xs text-muted-foreground text-center mt-4 pt-4 border-t">
            Viser de {recentMilestones.length} siste av totalt {milestones.length} milepæler
          </p>
        )}
      </CardContent>
    </Card>
  );
}
