import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Activity, CheckCircle, Award, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { nb } from "date-fns/locale";
import { useTranslation } from "react-i18next";

interface ActivityItem {
  id: string;
  type: "requirement" | "milestone" | "incident";
  label: string;
  time: string;
  initials: string;
}

export function RecentActivityWidget() {
  const { i18n } = useTranslation();
  const [items, setItems] = useState<ActivityItem[]>([]);
  const isNorwegian = i18n.language === "nb";

  useEffect(() => {
    const fetch = async () => {
      const [reqRes, mileRes, incRes] = await Promise.all([
        supabase
          .from("requirement_status")
          .select("id, status, completed_by, updated_at")
          .order("updated_at", { ascending: false })
          .limit(3),
        supabase
          .from("maturity_milestones")
          .select("id, description, achieved_at")
          .order("achieved_at", { ascending: false })
          .limit(3),
        supabase
          .from("system_incidents")
          .select("id, title, responsible, last_updated")
          .order("last_updated", { ascending: false })
          .limit(3),
      ]);

      const all: ActivityItem[] = [];

      (reqRes.data || []).forEach((r) =>
        all.push({
          id: r.id,
          type: "requirement",
          label: isNorwegian
            ? `Oppdaterte krav (${r.status})`
            : `Updated requirement (${r.status})`,
          time: r.updated_at,
          initials: (r.completed_by || "?").substring(0, 2).toUpperCase(),
        })
      );

      (mileRes.data || []).forEach((m) =>
        all.push({
          id: m.id,
          type: "milestone",
          label: m.description || (isNorwegian ? "Oppnådd milepæl" : "Milestone achieved"),
          time: m.achieved_at || "",
          initials: "MP",
        })
      );

      (incRes.data || []).forEach((i) =>
        all.push({
          id: i.id,
          type: "incident",
          label: i.title,
          time: i.last_updated || "",
          initials: (i.responsible || "?").substring(0, 2).toUpperCase(),
        })
      );

      all.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
      setItems(all.slice(0, 3));
    };
    fetch();
  }, [isNorwegian]);

  const iconMap = {
    requirement: <CheckCircle className="h-4 w-4 text-primary" />,
    milestone: <Award className="h-4 w-4 text-primary" />,
    incident: <AlertTriangle className="h-4 w-4 text-destructive" />,
  };

  return (
    <Card variant="flat" className="h-full">
      <CardHeader className="pb-3 pt-4 px-4">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Activity className="h-4 w-4 text-muted-foreground" />
          {isNorwegian ? "Siste aktivitet" : "Recent activity"}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-0">
        {items.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            {isNorwegian ? "Ingen aktivitet ennå" : "No activity yet"}
          </p>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="flex items-start gap-2.5">
                <Avatar className="h-7 w-7 text-[13px]">
                  <AvatarFallback className="bg-muted text-muted-foreground text-[13px]">
                    {item.initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    {iconMap[item.type]}
                    <span className="text-xs font-medium truncate">{item.label}</span>
                  </div>
                  <p className="text-[13px] text-muted-foreground mt-0.5">
                    {item.time
                      ? formatDistanceToNow(new Date(item.time), {
                          addSuffix: true,
                          locale: isNorwegian ? nb : undefined,
                        })
                      : "—"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
