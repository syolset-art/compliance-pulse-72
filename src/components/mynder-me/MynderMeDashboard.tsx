import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MetricCard } from "@/components/widgets/MetricCard";
import { Users, BookOpen, Bell, TrendingUp } from "lucide-react";
import { CoursesTab } from "./CoursesTab";
import { NotificationsTab } from "./NotificationsTab";
import { ConnectionsTab } from "./ConnectionsTab";

export function MynderMeDashboard() {
  const [stats, setStats] = useState({
    connections: 0,
    activeConnections: 0,
    courses: 0,
    completions: 0,
    notifications: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      const [connRes, courseRes, complRes, notifRes] = await Promise.all([
        supabase.from("employee_connections").select("id, status"),
        supabase.from("security_micro_courses").select("id").eq("is_active", true),
        supabase.from("course_completions").select("id"),
        supabase.from("employee_notifications").select("id"),
      ]);

      const connections = connRes.data || [];
      setStats({
        connections: connections.length,
        activeConnections: connections.filter((c: any) => c.status === "active").length,
        courses: courseRes.data?.length || 0,
        completions: complRes.data?.length || 0,
        notifications: notifRes.data?.length || 0,
      });
    };
    fetchStats();
  }, []);

  const completionRate = stats.connections > 0 && stats.courses > 0
    ? Math.round((stats.completions / (stats.activeConnections * stats.courses)) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Tilkoblede ansatte"
          value={stats.connections}
          subtitle={`${stats.activeConnections} aktive`}
          icon={Users}
        />
        <MetricCard
          title="Aktive kurs"
          value={stats.courses}
          subtitle="Tilgjengelig i appen"
          icon={BookOpen}
        />
        <MetricCard
          title="Fullføringer"
          value={stats.completions}
          subtitle={`${completionRate}% fullføringsrate`}
          icon={TrendingUp}
        />
        <MetricCard
          title="Sendte varsler"
          value={stats.notifications}
          subtitle="Til ansatte"
          icon={Bell}
        />
      </div>

      <Tabs defaultValue="courses" className="w-full">
        <TabsList>
          <TabsTrigger value="courses">Kurs</TabsTrigger>
          <TabsTrigger value="notifications">Varsler</TabsTrigger>
          <TabsTrigger value="connections">Tilkoblinger</TabsTrigger>
        </TabsList>

        <TabsContent value="courses">
          <CoursesTab />
        </TabsContent>
        <TabsContent value="notifications">
          <NotificationsTab />
        </TabsContent>
        <TabsContent value="connections">
          <ConnectionsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
