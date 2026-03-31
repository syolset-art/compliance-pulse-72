import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Bell, ShieldAlert, FileText, Server, AlertTriangle, CalendarClock, Lock, ClipboardList, FileCheck, CheckCircle, Wrench, Unplug, Building2, MessageSquareReply, Inbox } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";

interface NotificationSetting {
  id: string;
  icon: React.ElementType;
  titleNb: string;
  titleEn: string;
  descNb: string;
  descEn: string;
  defaultOn: boolean;
}

const categories: { titleNb: string; titleEn: string; icon: React.ElementType; items: NotificationSetting[] }[] = [
  {
    titleNb: "Sikkerhet & Compliance",
    titleEn: "Security & Compliance",
    icon: ShieldAlert,
    items: [
      { id: "new_deviation", icon: AlertTriangle, titleNb: "Nye avvik", titleEn: "New deviations", descNb: "Varsel når et nytt avvik registreres", descEn: "Alert when a new deviation is registered", defaultOn: true },
      { id: "compliance_deadline", icon: CalendarClock, titleNb: "Compliance-frister", titleEn: "Compliance deadlines", descNb: "Påminnelse om kommende frister for regelverk", descEn: "Reminder about upcoming regulatory deadlines", defaultOn: true },
      { id: "security_breach", icon: Lock, titleNb: "Sikkerhetsbrudd", titleEn: "Security breaches", descNb: "Umiddelbart varsel ved sikkerhetsbrudd", descEn: "Immediate alert on security breaches", defaultOn: true },
    ],
  },
  {
    titleNb: "Dokumenter & Oppgaver",
    titleEn: "Documents & Tasks",
    icon: FileText,
    items: [
      { id: "new_task", icon: ClipboardList, titleNb: "Nye oppgaver", titleEn: "New tasks", descNb: "Varsel når en oppgave blir tildelt", descEn: "Alert when a task is assigned", defaultOn: true },
      { id: "document_update", icon: FileCheck, titleNb: "Dokumentoppdateringer", titleEn: "Document updates", descNb: "Varsel når et dokument oppdateres", descEn: "Alert when a document is updated", defaultOn: false },
      { id: "approval_request", icon: CheckCircle, titleNb: "Godkjenningsforespørsler", titleEn: "Approval requests", descNb: "Varsel ved nye godkjenningsforespørsler", descEn: "Alert on new approval requests", defaultOn: true },
    ],
  },
  {
    titleNb: "System & Integrasjoner",
    titleEn: "System & Integrations",
    icon: Server,
    items: [
      { id: "system_change", icon: Server, titleNb: "Systemendringer", titleEn: "System changes", descNb: "Varsel når systemer endres eller legges til", descEn: "Alert when systems are changed or added", defaultOn: false },
      { id: "integration_error", icon: Unplug, titleNb: "Integrasjonsfeil", titleEn: "Integration errors", descNb: "Varsel ved feil i tilkoblede integrasjoner", descEn: "Alert on errors in connected integrations", defaultOn: true },
      { id: "maintenance", icon: Wrench, titleNb: "Vedlikeholdsvarsler", titleEn: "Maintenance alerts", descNb: "Planlagt vedlikehold og nedetid", descEn: "Planned maintenance and downtime", defaultOn: false },
    ],
  },
];

export default function AdminNotifications() {
  const { i18n } = useTranslation();
  const isMobile = useIsMobile();
  const isNb = i18n.language === "nb";

  const [settings, setSettings] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    categories.forEach(c => c.items.forEach(i => { init[i.id] = i.defaultOn; }));
    return init;
  });

  const handleToggle = (id: string, label: string) => {
    setSettings(prev => {
      const next = { ...prev, [id]: !prev[id] };
      toast.success(next[id]
        ? (isNb ? `${label} er aktivert` : `${label} enabled`)
        : (isNb ? `${label} er deaktivert` : `${label} disabled`)
      );
      return next;
    });
  };

  const content = (
    <div className="container max-w-3xl mx-auto p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          {isNb ? "Varslinger" : "Notifications"}
        </h1>
        <p className="text-muted-foreground mt-1">
          {isNb
            ? "Administrer hvilke varsler som sendes til ansatte og administratorer."
            : "Manage which alerts are sent to employees and administrators."}
        </p>
      </div>

      {categories.map(cat => {
        const CatIcon = cat.icon;
        return (
          <Card key={cat.titleEn}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <CatIcon className="h-5 w-5 text-primary" />
                {isNb ? cat.titleNb : cat.titleEn}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {cat.items.map(item => {
                const Icon = item.icon;
                const label = isNb ? item.titleNb : item.titleEn;
                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-4 rounded-lg px-3 py-3 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <Icon className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium text-foreground">{label}</p>
                        <p className="text-xs text-muted-foreground">
                          {isNb ? item.descNb : item.descEn}
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={settings[item.id]}
                      onCheckedChange={() => handleToggle(item.id, label)}
                    />
                  </div>
                );
              })}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );

  if (isMobile) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">{content}</main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen max-h-screen bg-background overflow-hidden">
      <div className="w-64 flex-shrink-0"><Sidebar /></div>
      <main className="flex-1 h-screen overflow-y-auto">{content}</main>
    </div>
  );
}
