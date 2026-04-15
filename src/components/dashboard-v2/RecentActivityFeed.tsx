import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Activity, CheckCircle, AlertTriangle, Mail, ClipboardList } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { nb } from "date-fns/locale";

interface ActivityItem {
  id: string;
  type: "task" | "deviation" | "inbox";
  title: string;
  time: string;
  icon: typeof Activity;
  iconColor: string;
}

export function RecentActivityFeed() {
  const { i18n } = useTranslation();
  const isNorwegian = i18n.language === "nb" || i18n.language === "no";
  const [items, setItems] = useState<ActivityItem[]>([]);

  useEffect(() => {
    const fetchActivity = async () => {
      const [taskRes, devRes, inboxRes] = await Promise.all([
        supabase.from("user_tasks").select("id, title, status, updated_at").order("updated_at", { ascending: false }).limit(5),
        supabase.from("employee_deviation_reports").select("id, title, severity, created_at").order("created_at", { ascending: false }).limit(5),
        supabase.from("lara_inbox").select("id, subject, sender_name, received_at").order("received_at", { ascending: false }).limit(5),
      ]);

      const all: ActivityItem[] = [];

      (taskRes.data || []).forEach((t) =>
        all.push({
          id: t.id,
          type: "task",
          title: t.title,
          time: t.updated_at,
          icon: t.status === "done" ? CheckCircle : ClipboardList,
          iconColor: t.status === "done" ? "text-green-500" : "text-yellow-500",
        })
      );

      (devRes.data || []).forEach((d) =>
        all.push({
          id: d.id,
          type: "deviation",
          title: d.title,
          time: d.created_at,
          icon: AlertTriangle,
          iconColor: d.severity === "critical" ? "text-destructive" : "text-yellow-500",
        })
      );

      (inboxRes.data || []).forEach((i) =>
        all.push({
          id: i.id,
          type: "inbox",
          title: i.subject || (isNorwegian ? "Ny hendelse" : "New event"),
          time: i.received_at || "",
          icon: Mail,
          iconColor: "text-blue-500",
        })
      );

      all.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
      setItems(all.slice(0, 8));
    };
    fetchActivity();
  }, [isNorwegian]);

  return (
    <div className="rounded-2xl border border-border bg-card p-5 h-full">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
        <Activity className="h-4 w-4" />
        {isNorwegian ? "Siste aktiviteter" : "Recent activity"}
      </h3>
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground">{isNorwegian ? "Ingen aktivitet ennå" : "No activity yet"}</p>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.id} className="flex items-start gap-2.5">
                <div className="mt-0.5">
                  <Icon className={`h-4 w-4 ${item.iconColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{item.title}</p>
                  <p className="text-[13px] text-muted-foreground">
                    {item.time
                      ? formatDistanceToNow(new Date(item.time), {
                          addSuffix: true,
                          locale: isNorwegian ? nb : undefined,
                        })
                      : "—"}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
