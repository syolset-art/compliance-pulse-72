import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Lock, Shield, AlertTriangle, Server, CheckCircle2, ExternalLink, Activity } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

export function SecurityPostureWidget() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Fetch security metrics
  const { data: securityMetrics, isLoading } = useQuery({
    queryKey: ['security-posture-metrics'],
    queryFn: async () => {
      const [incidentsResult, assetsResult, systemsResult, riskResult] = await Promise.all([
        supabase.from('system_incidents').select('id, status, risk_level, criticality'),
        supabase.from('assets').select('id, risk_level, next_review_date, compliance_score'),
        supabase.from('systems').select('id, risk_level, next_review_date, compliance_score'),
        supabase.from('system_risk_assessments').select('id, status, risk_score')
      ]);

      // Active incidents by severity
      const activeIncidents = incidentsResult.data?.filter(i => i.status === 'open') || [];
      const criticalIncidents = activeIncidents.filter(i => 
        i.risk_level === 'critical' || i.criticality === 'critical'
      ).length;
      const highIncidents = activeIncidents.filter(i => 
        i.risk_level === 'high' || i.criticality === 'high'
      ).length;

      // Systems needing review
      const today = new Date();
      const systemsNeedingReview = systemsResult.data?.filter(s => {
        if (!s.next_review_date) return true;
        return new Date(s.next_review_date) <= today;
      }).length || 0;

      // High risk systems
      const highRiskSystems = systemsResult.data?.filter(s => s.risk_level === 'high').length || 0;

      // Average compliance score
      const allItems = [...(assetsResult.data || []), ...(systemsResult.data || [])];
      const avgCompliance = allItems.length > 0 
        ? Math.round(allItems.reduce((sum, item) => sum + (item.compliance_score || 0), 0) / allItems.length)
        : 0;

      // Pending risk assessments
      const pendingAssessments = riskResult.data?.filter(r => r.status === 'pending').length || 0;

      // Calculate security score
      const incidentPenalty = criticalIncidents * 15 + highIncidents * 8;
      const reviewPenalty = Math.min(systemsNeedingReview * 5, 20);
      const riskPenalty = highRiskSystems * 5;
      
      const securityScore = Math.max(0, Math.min(100, 
        avgCompliance - incidentPenalty - reviewPenalty - riskPenalty + 20
      ));

      return {
        securityScore,
        activeIncidents: activeIncidents.length,
        criticalIncidents,
        highIncidents,
        systemsNeedingReview,
        highRiskSystems,
        pendingAssessments,
        totalSystems: systemsResult.data?.length || 0,
        avgCompliance
      };
    }
  });

  const score = securityMetrics?.securityScore || 0;

  return (
    <Card className="col-span-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Lock className="h-5 w-5 text-red-600" />
              Sikkerhetsstatus
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Hendelser, risikoer og systemsikkerhet
            </p>
          </div>
          <Badge variant={score >= 70 ? "default" : score >= 50 ? "secondary" : "destructive"}>
            {score >= 80 ? 'Sterk' : score >= 60 ? 'Moderat' : 'Svak'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {/* Main KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-card border rounded-lg p-4 text-center">
            <p className={`text-3xl font-bold ${score >= 70 ? 'text-green-600' : score >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
              {score}%
            </p>
            <p className="text-sm text-muted-foreground">Sikkerhetsscore</p>
          </div>
          <div className="bg-card border rounded-lg p-4 text-center">
            <p className={`text-3xl font-bold ${(securityMetrics?.activeIncidents || 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {securityMetrics?.activeIncidents || 0}
            </p>
            <p className="text-sm text-muted-foreground">Aktive hendelser</p>
          </div>
          <div className="bg-card border rounded-lg p-4 text-center">
            <p className={`text-3xl font-bold ${(securityMetrics?.systemsNeedingReview || 0) > 0 ? 'text-amber-600' : 'text-green-600'}`}>
              {securityMetrics?.systemsNeedingReview || 0}
            </p>
            <p className="text-sm text-muted-foreground">Trenger review</p>
          </div>
          <div className="bg-card border rounded-lg p-4 text-center">
            <p className={`text-3xl font-bold ${(securityMetrics?.highRiskSystems || 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {securityMetrics?.highRiskSystems || 0}
            </p>
            <p className="text-sm text-muted-foreground">Høyrisiko systemer</p>
          </div>
        </div>

        {/* Security Score Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Overordnet sikkerhetsnivå
            </span>
            <span className="text-sm text-muted-foreground">{score}%</span>
          </div>
          <Progress 
            value={score} 
            className="h-2"
          />
        </div>

        {/* Incident Summary */}
        {(securityMetrics?.activeIncidents || 0) > 0 && (
          <div className="bg-muted/50 rounded-lg p-4 mb-4">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Hendelsesfordeling
            </h4>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xl font-bold text-red-600">{securityMetrics?.criticalIncidents || 0}</p>
                <p className="text-xs text-muted-foreground">Kritiske</p>
              </div>
              <div>
                <p className="text-xl font-bold text-amber-600">{securityMetrics?.highIncidents || 0}</p>
                <p className="text-xs text-muted-foreground">Høy</p>
              </div>
              <div>
                <p className="text-xl font-bold text-blue-600">
                  {(securityMetrics?.activeIncidents || 0) - (securityMetrics?.criticalIncidents || 0) - (securityMetrics?.highIncidents || 0)}
                </p>
                <p className="text-xs text-muted-foreground">Andre</p>
              </div>
            </div>
          </div>
        )}

        {/* Alerts */}
        <div className="space-y-3">
          {(securityMetrics?.criticalIncidents || 0) > 0 && (
            <div className="flex items-center justify-between bg-red-50 dark:bg-red-950/20 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <span className="text-sm">
                  {securityMetrics?.criticalIncidents} kritiske hendelser krever umiddelbar handling
                </span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate('/deviations')}>
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          )}

          {(securityMetrics?.systemsNeedingReview || 0) > 0 && (
            <div className="flex items-center justify-between bg-amber-50 dark:bg-amber-950/20 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <Server className="h-4 w-4 text-amber-600" />
                <span className="text-sm">
                  {securityMetrics?.systemsNeedingReview} systemer trenger sikkerhetsgjennomgang
                </span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate('/assets')}>
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          )}

          {score >= 80 && (securityMetrics?.activeIncidents || 0) === 0 && (
            <div className="flex items-center gap-2 bg-green-50 dark:bg-green-950/20 rounded-lg p-3">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-700 dark:text-green-400">
                Sterk sikkerhetsposisjon. Ingen aktive hendelser.
              </span>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2 mt-4 pt-4 border-t">
          <Button variant="outline" size="sm" onClick={() => navigate('/deviations')}>
            <AlertTriangle className="h-4 w-4 mr-2" />
            Hendelseslogg
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate('/assets')}>
            <Server className="h-4 w-4 mr-2" />
            Systemoversikt
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
