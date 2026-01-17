import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Activity, 
  CheckCircle2, 
  FileEdit, 
  Plus, 
  Shield, 
  AlertTriangle,
  Clock,
  TrendingUp,
  Users
} from "lucide-react";

// Syntetiske data for prototypen
const MOCK_CURRENT_USER_ROLE = "compliance_leder"; // Endre til "bruker" for å skjule widgeten

const MOCK_TEAM_MEMBERS = [
  { id: "1", name: "Kari Nordmann", initials: "KN", role: "Compliance Leder" },
  { id: "2", name: "Ole Hansen", initials: "OH", role: "IT-ansvarlig" },
  { id: "3", name: "Mari Olsen", initials: "MO", role: "Personvernombud" },
  { id: "4", name: "Per Johansen", initials: "PJ", role: "Sikkerhetsrådgiver" },
];

const MOCK_ACTIVITIES_WEEK = [
  { id: "1", user: "Kari Nordmann", initials: "KN", action: "Fullførte risikovurdering", target: "Microsoft 365", type: "completed", time: "I dag, 14:32" },
  { id: "2", user: "Ole Hansen", initials: "OH", action: "La til nytt system", target: "Slack", type: "created", time: "I dag, 11:15" },
  { id: "3", user: "Mari Olsen", initials: "MO", action: "Oppdaterte personvernerklæring", target: "GDPR-dokumentasjon", type: "updated", time: "I går, 16:45" },
  { id: "4", user: "Per Johansen", initials: "PJ", action: "Godkjente leverandøravtale", target: "AWS", type: "approved", time: "I går, 10:20" },
  { id: "5", user: "Kari Nordmann", initials: "KN", action: "Lukket avvik", target: "Manglende tilgangskontroll", type: "completed", time: "Mandag, 09:00" },
  { id: "6", user: "Ole Hansen", initials: "OH", action: "Startet AI-vurdering", target: "ChatGPT Enterprise", type: "started", time: "Mandag, 14:30" },
  { id: "7", user: "Mari Olsen", initials: "MO", action: "Registrerte behandlingsaktivitet", target: "Kundeanalyse", type: "created", time: "Søndag, 11:00" },
];

const MOCK_ACTIVITIES_MONTH = [
  ...MOCK_ACTIVITIES_WEEK,
  { id: "8", user: "Per Johansen", initials: "PJ", action: "Gjennomførte internrevisjon", target: "ISO 27001", type: "completed", time: "For 2 uker siden" },
  { id: "9", user: "Kari Nordmann", initials: "KN", action: "Oppdaterte beredskapsplan", target: "Katastrofegjenoppretting", type: "updated", time: "For 2 uker siden" },
  { id: "10", user: "Ole Hansen", initials: "OH", action: "Fjernet utdatert system", target: "Legacy CRM", type: "deleted", time: "For 3 uker siden" },
  { id: "11", user: "Mari Olsen", initials: "MO", action: "Sendte DPIA til godkjenning", target: "Ny rekrutteringsløsning", type: "submitted", time: "For 3 uker siden" },
  { id: "12", user: "Per Johansen", initials: "PJ", action: "Oppdaterte sikkerhetspolicy", target: "Passordpolicy", type: "updated", time: "For 4 uker siden" },
];

const MOCK_STATS_WEEK = {
  tasksCompleted: 12,
  systemsAdded: 3,
  risksAssessed: 5,
  documentsUpdated: 8,
  activeUsers: 4,
};

const MOCK_STATS_MONTH = {
  tasksCompleted: 47,
  systemsAdded: 11,
  risksAssessed: 18,
  documentsUpdated: 32,
  activeUsers: 4,
};

const getActionIcon = (type: string) => {
  switch (type) {
    case "completed":
    case "approved":
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    case "created":
      return <Plus className="h-4 w-4 text-blue-500" />;
    case "updated":
      return <FileEdit className="h-4 w-4 text-amber-500" />;
    case "started":
      return <Clock className="h-4 w-4 text-purple-500" />;
    case "deleted":
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
    case "submitted":
      return <Shield className="h-4 w-4 text-primary" />;
    default:
      return <Activity className="h-4 w-4 text-muted-foreground" />;
  }
};

interface ActivityReportWidgetProps {
  className?: string;
}

export function ActivityReportWidget({ className }: ActivityReportWidgetProps) {
  const [period, setPeriod] = useState<"week" | "month">("week");
  
  // Sjekk om bruker har riktig rolle (syntetisk for prototype)
  const hasAccess = ["leder", "compliance_leder"].includes(MOCK_CURRENT_USER_ROLE);
  
  if (!hasAccess) {
    return null; // Skjul widgeten for andre roller
  }

  const activities = period === "week" ? MOCK_ACTIVITIES_WEEK : MOCK_ACTIVITIES_MONTH;
  const stats = period === "week" ? MOCK_STATS_WEEK : MOCK_STATS_MONTH;

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Teamaktivitet
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            <Shield className="h-3 w-3 mr-1" />
            Kun ledere
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs value={period} onValueChange={(v) => setPeriod(v as "week" | "month")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="week">Siste uke</TabsTrigger>
            <TabsTrigger value="month">Siste måned</TabsTrigger>
          </TabsList>

          <TabsContent value={period} className="space-y-4 mt-4">
            {/* Statistikk-kort */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-primary">{stats.tasksCompleted}</div>
                <div className="text-xs text-muted-foreground">Oppgaver fullført</div>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-green-600">{stats.systemsAdded}</div>
                <div className="text-xs text-muted-foreground">Systemer lagt til</div>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-amber-600">{stats.risksAssessed}</div>
                <div className="text-xs text-muted-foreground">Risikoer vurdert</div>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.documentsUpdated}</div>
                <div className="text-xs text-muted-foreground">Dokumenter oppdatert</div>
              </div>
            </div>

            {/* Aktive teammedlemmer */}
            <div className="flex items-center gap-2 py-2 border-b">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Aktive teammedlemmer:</span>
              <div className="flex -space-x-2">
                {MOCK_TEAM_MEMBERS.map((member) => (
                  <Avatar key={member.id} className="h-7 w-7 border-2 border-background">
                    <AvatarFallback className="text-xs bg-primary/10 text-primary">
                      {member.initials}
                    </AvatarFallback>
                  </Avatar>
                ))}
              </div>
              <span className="text-sm font-medium">{stats.activeUsers} personer</span>
            </div>

            {/* Aktivitetslogg */}
            <div className="space-y-1">
              <h4 className="text-sm font-medium flex items-center gap-2 mb-3">
                <TrendingUp className="h-4 w-4" />
                Siste aktiviteter
              </h4>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {activities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <Avatar className="h-8 w-8 mt-0.5">
                      <AvatarFallback className="text-xs bg-primary/10 text-primary">
                        {activity.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {getActionIcon(activity.type)}
                        <span className="text-sm font-medium truncate">{activity.user}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {activity.action}: <span className="font-medium text-foreground">{activity.target}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <Button variant="outline" className="w-full" size="sm">
          Se fullstendig aktivitetsrapport
        </Button>
      </CardContent>
    </Card>
  );
}
