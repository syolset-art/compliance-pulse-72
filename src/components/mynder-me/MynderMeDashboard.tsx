import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MetricCard } from "@/components/widgets/MetricCard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, BookOpen, Bell, TrendingUp, AlertTriangle, ArrowRight } from "lucide-react";
import { CoursesTab } from "./CoursesTab";
import { NotificationsTab } from "./NotificationsTab";
import { ConnectionsTab } from "./ConnectionsTab";
import { SharedContentTab } from "./SharedContentTab";
import { ActivityTab } from "./ActivityTab";

export function MynderMeDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    connections: 0,
    activeConnections: 0,
    courses: 0,
    completions: 0,
    notifications: 0,
    deviationReports: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      const [connRes, courseRes, complRes, notifRes, devRes] = await Promise.all([
        supabase.from("employee_connections").select("id, status"),
        supabase.from("security_micro_courses").select("id").eq("is_active", true),
        supabase.from("course_completions").select("id"),
        supabase.from("employee_notifications").select("id"),
        supabase.from("employee_deviation_reports").select("id").eq("status", "new"),
      ]);

      const connections = connRes.data || [];
      setStats({
        connections: connections.length,
        activeConnections: connections.filter((c: any) => c.status === "active").length,
        courses: courseRes.data?.length || 0,
        completions: complRes.data?.length || 0,
        notifications: notifRes.data?.length || 0,
        deviationReports: devRes.data?.length || 0,
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

      {/* Employee deviation reports banner */}
      {stats.deviationReports > 0 && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/15 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground">{stats.deviationReports} nye avviksmeldinger fra ansatte</p>
                <p className="text-sm text-muted-foreground">Behandles i det felles avviksregisteret</p>
              </div>
            </div>
            <Button variant="outline" onClick={() => navigate("/deviations")} className="gap-2">
              Gå til avviksregister
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="courses" className="w-full">
        <TabsList>
          <TabsTrigger value="courses">Kurs</TabsTrigger>
          <TabsTrigger value="notifications">Varsler</TabsTrigger>
          <TabsTrigger value="activity">Aktivitet</TabsTrigger>
          <TabsTrigger value="shared-content">Delt innhold</TabsTrigger>
          <TabsTrigger value="connections">Tilkoblinger</TabsTrigger>
        </TabsList>

        <TabsContent value="courses">
          <CoursesTab />
        </TabsContent>
        <TabsContent value="notifications">
          <NotificationsTab />
        </TabsContent>
        <TabsContent value="activity">
          <ActivityTab />
        </TabsContent>
        <TabsContent value="shared-content">
          <SharedContentTab />
        </TabsContent>
        <TabsContent value="connections">
          <ConnectionsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
