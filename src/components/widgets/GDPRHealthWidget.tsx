import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Shield, FileText, Users, AlertTriangle, ExternalLink, CheckCircle2, Clock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

export function GDPRHealthWidget() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Fetch GDPR-related metrics
  const { data: gdprMetrics, isLoading } = useQuery({
    queryKey: ['gdpr-health-metrics'],
    queryFn: async () => {
      const [processesResult, assetsResult, incidentsResult, tasksResult] = await Promise.all([
        supabase.from('system_processes').select('id, status'),
        supabase.from('assets').select('id, asset_type, compliance_score'),
        supabase.from('system_incidents').select('id, status, category').eq('status', 'open'),
        supabase.from('tasks').select('id, status, type').eq('status', 'pending').eq('type', 'gdpr')
      ]);

      const totalProcesses = processesResult.data?.length || 0;
      const documentedProcesses = processesResult.data?.filter(p => p.status === 'active').length || 0;

      // Calculate vendors without DPA (simplified - in real app would check DPA status)
      const vendorAssets = assetsResult.data?.filter(a => a.asset_type === 'vendor') || [];
      const vendorsWithoutDPA = vendorAssets.filter(v => (v.compliance_score || 0) < 50).length;

      // Privacy incidents
      const privacyIncidents = incidentsResult.data?.filter(i => 
        i.category === 'privacy' || i.category === 'data_breach'
      ).length || 0;

      // Pending GDPR tasks
      const pendingGdprTasks = tasksResult.data?.length || 0;

      // Calculate overall GDPR score
      const documentationScore = totalProcesses > 0 ? (documentedProcesses / totalProcesses) * 100 : 0;
      const vendorScore = vendorAssets.length > 0 ? ((vendorAssets.length - vendorsWithoutDPA) / vendorAssets.length) * 100 : 100;
      const incidentPenalty = Math.min(privacyIncidents * 10, 30);
      
      const overallScore = Math.max(0, Math.round((documentationScore * 0.4 + vendorScore * 0.4 + (100 - incidentPenalty) * 0.2)));

      return {
        overallScore,
        totalProcesses,
        documentedProcesses,
        vendorAssets: vendorAssets.length,
        vendorsWithoutDPA,
        privacyIncidents,
        pendingGdprTasks,
        documentationPercentage: totalProcesses > 0 ? Math.round((documentedProcesses / totalProcesses) * 100) : 0
      };
    }
  });

  const score = gdprMetrics?.overallScore || 0;

  return (
    <Card className="col-span-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              GDPR-helse
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Personvernstatus og compliance-oversikt
            </p>
          </div>
          <Badge variant={score >= 70 ? "default" : score >= 50 ? "secondary" : "destructive"}>
            {score}% compliant
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {/* Main KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-card border rounded-lg p-4 text-center">
            <p className="text-3xl font-bold text-primary">{score}%</p>
            <p className="text-sm text-muted-foreground">GDPR Score</p>
          </div>
          <div className="bg-card border rounded-lg p-4 text-center">
            <p className="text-3xl font-bold">{gdprMetrics?.documentedProcesses || 0}</p>
            <p className="text-sm text-muted-foreground">Behandlinger dok.</p>
          </div>
          <div className="bg-card border rounded-lg p-4 text-center">
            <p className={`text-3xl font-bold ${(gdprMetrics?.vendorsWithoutDPA || 0) > 0 ? 'text-warning' : 'text-status-closed'}`}>
              {gdprMetrics?.vendorsWithoutDPA || 0}
            </p>
            <p className="text-sm text-muted-foreground">Mangler DPA</p>
          </div>
          <div className="bg-card border rounded-lg p-4 text-center">
            <p className={`text-3xl font-bold ${(gdprMetrics?.privacyIncidents || 0) > 0 ? 'text-destructive' : 'text-status-closed'}`}>
              {gdprMetrics?.privacyIncidents || 0}
            </p>
            <p className="text-sm text-muted-foreground">Aktive avvik</p>
          </div>
        </div>

        {/* ROPA Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Behandlingsoversikt (ROPA)
            </span>
            <span className="text-sm text-muted-foreground">
              {gdprMetrics?.documentedProcesses || 0} / {gdprMetrics?.totalProcesses || 0}
            </span>
          </div>
          <Progress value={gdprMetrics?.documentationPercentage || 0} className="h-2" />
        </div>

        {/* Alerts */}
        <div className="space-y-3">
          {(gdprMetrics?.vendorsWithoutDPA || 0) > 0 && (
            <div className="flex items-center justify-between bg-warning/10 dark:bg-amber-950/20 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-warning" />
                <span className="text-sm">
                  {gdprMetrics?.vendorsWithoutDPA} leverandører mangler databehandleravtale
                </span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate('/assets')}>
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          )}
          
          {(gdprMetrics?.privacyIncidents || 0) > 0 && (
            <div className="flex items-center justify-between bg-destructive/10 dark:bg-red-950/20 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <span className="text-sm">
                  {gdprMetrics?.privacyIncidents} personvernavvik krever handling
                </span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate('/deviations')}>
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          )}

          {(gdprMetrics?.pendingGdprTasks || 0) > 0 && (
            <div className="flex items-center justify-between bg-primary/10 dark:bg-blue-950/20 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <span className="text-sm">
                  {gdprMetrics?.pendingGdprTasks} GDPR-oppgaver venter
                </span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate('/tasks')}>
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          )}

          {score >= 80 && (gdprMetrics?.vendorsWithoutDPA || 0) === 0 && (gdprMetrics?.privacyIncidents || 0) === 0 && (
            <div className="flex items-center gap-2 bg-status-closed/10 dark:bg-green-950/20 rounded-lg p-3">
              <CheckCircle2 className="h-4 w-4 text-status-closed" />
              <span className="text-sm text-status-closed dark:text-status-closed">
                God GDPR-helse! Ingen kritiske mangler.
              </span>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2 mt-4 pt-4 border-t">
          <Button variant="outline" size="sm" onClick={() => navigate('/protocols')}>
            <FileText className="h-4 w-4 mr-2" />
            Se behandlingsoversikt
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate('/assets')}>
            <Users className="h-4 w-4 mr-2" />
            Leverandøroversikt
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
