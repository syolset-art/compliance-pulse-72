import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Bot, AlertTriangle, CheckCircle2, ExternalLink, Users, FileText, Activity } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

const RISK_LABELS: Record<string, string> = {
  unacceptable: 'Uakseptabel',
  high: 'Høy',
  limited: 'Begrenset',
  minimal: 'Minimal',
  not_assessed: 'Ikke vurdert'
};

const RISK_COLORS: Record<string, string> = {
  unacceptable: 'bg-destructive',
  high: 'bg-warning',
  limited: 'bg-warning',
  minimal: 'bg-status-closed',
  not_assessed: 'bg-gray-400'
};

export function AIGovernanceWidget() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Fetch AI governance metrics
  const { data: aiMetrics, isLoading } = useQuery({
    queryKey: ['ai-governance-metrics'],
    queryFn: async () => {
      const [registryResult, usageResult, incidentsResult, processResult] = await Promise.all([
        supabase.from('ai_system_registry').select('*').eq('status', 'active'),
        supabase.from('ai_usage_metrics').select('total_decisions, affected_persons_count, overridden_decisions, incidents, complaints'),
        supabase.from('system_incidents').select('id, status').eq('is_ai_related', true).eq('status', 'open'),
        supabase.from('process_ai_usage').select('id, risk_category, compliance_status').eq('has_ai', true)
      ]);

      const systems = registryResult.data || [];
      
      // Risk distribution
      const riskDistribution = {
        unacceptable: systems.filter(s => s.risk_category === 'unacceptable').length,
        high: systems.filter(s => s.risk_category === 'high').length,
        limited: systems.filter(s => s.risk_category === 'limited').length,
        minimal: systems.filter(s => s.risk_category === 'minimal').length,
        not_assessed: systems.filter(s => !s.risk_category || s.risk_category === 'not_assessed').length
      };

      // Aggregate usage metrics
      const metrics = usageResult.data || [];
      const totalDecisions = metrics.reduce((sum, m) => sum + (m.total_decisions || 0), 0);
      const totalAffected = metrics.reduce((sum, m) => sum + (m.affected_persons_count || 0), 0);
      const totalOverrides = metrics.reduce((sum, m) => sum + (m.overridden_decisions || 0), 0);
      const totalIncidents = metrics.reduce((sum, m) => sum + (m.incidents || 0), 0);
      const totalComplaints = metrics.reduce((sum, m) => sum + (m.complaints || 0), 0);

      // Compliance status
      const compliantSystems = systems.filter(s => s.compliance_status === 'compliant').length;
      const pendingAssessments = systems.filter(s => s.compliance_status === 'not_assessed').length;

      // Calculate governance score
      const assessmentCoverage = systems.length > 0 ? ((systems.length - riskDistribution.not_assessed) / systems.length) * 100 : 0;
      const complianceRate = systems.length > 0 ? (compliantSystems / systems.length) * 100 : 0;
      const riskPenalty = riskDistribution.unacceptable * 20 + riskDistribution.high * 10;
      const incidentPenalty = Math.min(totalIncidents * 5 + totalComplaints * 3, 30);
      
      const governanceScore = Math.max(0, Math.min(100, 
        Math.round((assessmentCoverage * 0.3 + complianceRate * 0.5 + 20) - riskPenalty - incidentPenalty)
      ));

      return {
        governanceScore,
        totalSystems: systems.length,
        compliantSystems,
        pendingAssessments,
        riskDistribution,
        totalDecisions,
        totalAffected,
        overrideRate: totalDecisions > 0 ? Math.round((totalOverrides / totalDecisions) * 100) : 0,
        aiRelatedIncidents: incidentsResult.data?.length || 0,
        totalIncidents,
        totalComplaints,
        processesWithAI: processResult.data?.length || 0
      };
    }
  });

  const score = aiMetrics?.governanceScore || 0;
  const totalRisked = Object.values(aiMetrics?.riskDistribution || {}).reduce((a, b) => a + b, 0);

  return (
    <Card className="col-span-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Bot className="h-5 w-5 text-accent" />
              AI Governance
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              AI-systemer, risikovurdering og AI Act-etterlevelse
            </p>
          </div>
          <Badge variant={score >= 70 ? "default" : score >= 50 ? "secondary" : "destructive"}>
            {score}% Governance Score
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {/* Main KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-card border rounded-lg p-4 text-center">
            <p className="text-3xl font-bold text-accent">{aiMetrics?.totalSystems || 0}</p>
            <p className="text-sm text-muted-foreground">AI-systemer</p>
          </div>
          <div className="bg-card border rounded-lg p-4 text-center">
            <p className={`text-3xl font-bold ${(aiMetrics?.riskDistribution?.high || 0) + (aiMetrics?.riskDistribution?.unacceptable || 0) > 0 ? 'text-destructive' : 'text-status-closed'}`}>
              {(aiMetrics?.riskDistribution?.high || 0) + (aiMetrics?.riskDistribution?.unacceptable || 0)}
            </p>
            <p className="text-sm text-muted-foreground">Høyrisiko</p>
          </div>
          <div className="bg-card border rounded-lg p-4 text-center">
            <p className="text-3xl font-bold">{aiMetrics?.totalDecisions?.toLocaleString() || 0}</p>
            <p className="text-sm text-muted-foreground">AI-beslutninger</p>
          </div>
          <div className="bg-card border rounded-lg p-4 text-center">
            <p className={`text-3xl font-bold ${(aiMetrics?.pendingAssessments || 0) > 0 ? 'text-warning' : 'text-status-closed'}`}>
              {aiMetrics?.pendingAssessments || 0}
            </p>
            <p className="text-sm text-muted-foreground">Venter vurdering</p>
          </div>
        </div>

        {/* Risk Distribution */}
        {totalRisked > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Risikofordeling</span>
              <span className="text-sm text-muted-foreground">{totalRisked} systemer vurdert</span>
            </div>
            <div className="flex h-3 rounded-full overflow-hidden bg-muted">
              {Object.entries(aiMetrics?.riskDistribution || {}).map(([level, count]) => {
                const percentage = totalRisked > 0 ? (count / totalRisked) * 100 : 0;
                if (percentage === 0) return null;
                return (
                  <div
                    key={level}
                    className={`${RISK_COLORS[level]} transition-all`}
                    style={{ width: `${percentage}%` }}
                    title={`${RISK_LABELS[level]}: ${count}`}
                  />
                );
              })}
            </div>
            <div className="flex flex-wrap gap-3 mt-2">
              {Object.entries(aiMetrics?.riskDistribution || {}).map(([level, count]) => (
                count > 0 && (
                  <div key={level} className="flex items-center gap-1.5 text-xs">
                    <span className={`w-2 h-2 rounded-full ${RISK_COLORS[level]}`} />
                    <span>{RISK_LABELS[level]}: {count}</span>
                  </div>
                )
              ))}
            </div>
          </div>
        )}

        {/* Usage Metrics */}
        <div className="bg-muted/50 rounded-lg p-4 mb-4">
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Bruksstatistikk
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-lg font-bold">{aiMetrics?.totalAffected?.toLocaleString() || 0}</p>
              <p className="text-xs text-muted-foreground">Berørte personer</p>
            </div>
            <div>
              <p className="text-lg font-bold">{aiMetrics?.overrideRate || 0}%</p>
              <p className="text-xs text-muted-foreground">Override-rate</p>
            </div>
            <div>
              <p className="text-lg font-bold">{aiMetrics?.totalIncidents || 0}</p>
              <p className="text-xs text-muted-foreground">Hendelser</p>
            </div>
            <div>
              <p className="text-lg font-bold">{aiMetrics?.processesWithAI || 0}</p>
              <p className="text-xs text-muted-foreground">Prosesser med AI</p>
            </div>
          </div>
        </div>

        {/* Alerts */}
        <div className="space-y-3">
          {(aiMetrics?.riskDistribution?.unacceptable || 0) > 0 && (
            <div className="flex items-center justify-between bg-destructive/10 dark:bg-red-950/20 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <span className="text-sm">
                  {aiMetrics?.riskDistribution?.unacceptable} AI-systemer med uakseptabel risiko må stoppes
                </span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate('/ai-registry')}>
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          )}

          {(aiMetrics?.riskDistribution?.high || 0) > 0 && (
            <div className="flex items-center justify-between bg-warning/10 dark:bg-orange-950/20 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-warning" />
                <span className="text-sm">
                  {aiMetrics?.riskDistribution?.high} høyrisiko AI-systemer krever ekstra dokumentasjon
                </span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate('/ai-registry')}>
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          )}

          {(aiMetrics?.pendingAssessments || 0) > 0 && (
            <div className="flex items-center justify-between bg-warning/10 dark:bg-amber-950/20 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-warning" />
                <span className="text-sm">
                  {aiMetrics?.pendingAssessments} AI-systemer mangler risikovurdering
                </span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate('/ai-registry')}>
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          )}

          {score >= 80 && (aiMetrics?.riskDistribution?.unacceptable || 0) === 0 && (aiMetrics?.pendingAssessments || 0) === 0 && (
            <div className="flex items-center gap-2 bg-status-closed/10 dark:bg-green-950/20 rounded-lg p-3">
              <CheckCircle2 className="h-4 w-4 text-status-closed" />
              <span className="text-sm text-status-closed dark:text-status-closed">
                God AI-governance. Alle systemer er vurdert og dokumentert.
              </span>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2 mt-4 pt-4 border-t">
          <Button variant="outline" size="sm" onClick={() => navigate('/ai-registry')}>
            <Bot className="h-4 w-4 mr-2" />
            AI-register
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate('/reports')}>
            <FileText className="h-4 w-4 mr-2" />
            AI Act-rapport
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
