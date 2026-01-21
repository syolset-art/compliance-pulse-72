import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, Users, FileText, Bot, Clock } from "lucide-react";
import { useMaturityScore } from "@/hooks/useMaturityScore";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface KPICardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  subtitle?: string;
}

function KPICard({ title, value, change, icon, trend, subtitle }: KPICardProps) {
  return (
    <div className="bg-card border rounded-lg p-4">
      <div className="flex items-start justify-between">
        <div className="p-2 bg-primary/10 rounded-lg">
          {icon}
        </div>
        {change !== undefined && (
          <div className={`flex items-center gap-1 text-xs ${
            trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-muted-foreground'
          }`}>
            {trend === 'up' ? <TrendingUp className="h-3 w-3" /> : trend === 'down' ? <TrendingDown className="h-3 w-3" /> : null}
            {change > 0 ? '+' : ''}{change}%
          </div>
        )}
      </div>
      <div className="mt-3">
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-sm text-muted-foreground">{title}</p>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
      </div>
    </div>
  );
}

export function ExecutiveSummaryWidget() {
  const { t } = useTranslation();
  const { data: maturity, isLoading: maturityLoading } = useMaturityScore();

  // Fetch key metrics
  const { data: metrics } = useQuery({
    queryKey: ['executive-metrics'],
    queryFn: async () => {
      const [tasksResult, assetsResult, processesResult, incidentsResult] = await Promise.all([
        supabase.from('tasks').select('id, status, priority').eq('status', 'pending'),
        supabase.from('assets').select('id, risk_level'),
        supabase.from('system_processes').select('id'),
        supabase.from('system_incidents').select('id, status, risk_level').eq('status', 'open')
      ]);

      const criticalTasks = tasksResult.data?.filter(t => t.priority === 'critical').length || 0;
      const highRiskAssets = assetsResult.data?.filter(a => a.risk_level === 'high').length || 0;
      const openIncidents = incidentsResult.data?.length || 0;
      const criticalIncidents = incidentsResult.data?.filter(i => i.risk_level === 'critical').length || 0;

      return {
        totalAssets: assetsResult.data?.length || 0,
        totalProcesses: processesResult.data?.length || 0,
        criticalTasks,
        highRiskAssets,
        openIncidents,
        criticalIncidents,
        pendingTasks: tasksResult.data?.length || 0
      };
    }
  });

  // Fetch AI usage stats
  const { data: aiStats } = useQuery({
    queryKey: ['ai-executive-stats'],
    queryFn: async () => {
      const [registryResult, usageResult] = await Promise.all([
        supabase.from('ai_system_registry').select('id, risk_category, status').eq('status', 'active'),
        supabase.from('ai_usage_metrics').select('total_decisions, affected_persons_count')
      ]);

      const highRiskAI = registryResult.data?.filter(
        s => s.risk_category === 'high' || s.risk_category === 'unacceptable'
      ).length || 0;

      const totalDecisions = usageResult.data?.reduce((sum, m) => sum + (m.total_decisions || 0), 0) || 0;

      return {
        activeAISystems: registryResult.data?.length || 0,
        highRiskAI,
        totalAIDecisions: totalDecisions
      };
    }
  });

  const complianceScore = maturity?.currentScore || 0;
  const compliancePercentage = Math.min(100, Math.round((complianceScore / 100) * 100));

  // Decision points that need attention
  const decisionPoints = [];
  if ((metrics?.criticalTasks || 0) > 0) {
    decisionPoints.push({
      type: 'warning',
      text: `${metrics?.criticalTasks} kritiske oppgaver venter på handling`
    });
  }
  if ((aiStats?.highRiskAI || 0) > 0) {
    decisionPoints.push({
      type: 'warning',
      text: `${aiStats?.highRiskAI} høyrisiko AI-systemer krever godkjenning`
    });
  }
  if ((metrics?.criticalIncidents || 0) > 0) {
    decisionPoints.push({
      type: 'error',
      text: `${metrics?.criticalIncidents} kritiske hendelser er åpne`
    });
  }

  return (
    <Card className="col-span-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              📊 Lederoversikt
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Nøkkeltall og beslutningspunkter
            </p>
          </div>
          <Badge variant={compliancePercentage >= 70 ? "default" : "destructive"}>
            {maturity?.level === 'mature' ? 'Moden' : 
             maturity?.level === 'established' ? 'Etablert' :
             maturity?.level === 'developing' ? 'Under utvikling' : 'Nybegynner'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {/* KPI Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <KPICard
            title="Compliance Score"
            value={`${compliancePercentage}%`}
            icon={<CheckCircle2 className="h-5 w-5 text-primary" />}
            change={5}
            trend="up"
          />
          <KPICard
            title="Kritiske oppgaver"
            value={metrics?.criticalTasks || 0}
            icon={<Clock className="h-5 w-5 text-primary" />}
            subtitle={`av ${metrics?.pendingTasks || 0} ventende`}
          />
          <KPICard
            title="Høyrisiko AI"
            value={aiStats?.highRiskAI || 0}
            icon={<Bot className="h-5 w-5 text-primary" />}
            subtitle={`av ${aiStats?.activeAISystems || 0} aktive`}
          />
          <KPICard
            title="Åpne hendelser"
            value={metrics?.openIncidents || 0}
            icon={<AlertTriangle className="h-5 w-5 text-primary" />}
            trend={metrics?.openIncidents === 0 ? 'up' : 'down'}
          />
        </div>

        {/* Compliance Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Total modenhetsprogresjon</span>
            <span className="text-sm text-muted-foreground">{compliancePercentage}%</span>
          </div>
          <Progress value={compliancePercentage} className="h-2" />
        </div>

        {/* Decision Points */}
        {decisionPoints.length > 0 && (
          <div className="bg-muted/50 rounded-lg p-4">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Krever beslutning
            </h4>
            <div className="space-y-2">
              {decisionPoints.map((point, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <span className={`w-2 h-2 rounded-full ${
                    point.type === 'error' ? 'bg-red-500' : 'bg-amber-500'
                  }`} />
                  {point.text}
                </div>
              ))}
            </div>
          </div>
        )}

        {decisionPoints.length === 0 && (
          <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-4">
            <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-sm font-medium">Ingen kritiske beslutningspunkter</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
