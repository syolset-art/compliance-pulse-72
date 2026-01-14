import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Bot, AlertTriangle, CheckCircle, ArrowRight, Shield, Loader2 } from "lucide-react";
import { useAIActReportData } from "@/hooks/useAIActReportData";

const RISK_LABELS: Record<string, string> = {
  unacceptable: 'Uakseptabel',
  high: 'Høyrisiko',
  limited: 'Begrenset',
  minimal: 'Minimal',
  unknown: 'Ikke vurdert',
};

const RISK_COLORS: Record<string, string> = {
  unacceptable: 'bg-red-500',
  high: 'bg-orange-500',
  limited: 'bg-yellow-500',
  minimal: 'bg-green-500',
  unknown: 'bg-gray-400',
};

export function AIActComplianceWidget() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: reportData, isLoading } = useAIActReportData();

  const totalAIItems = reportData 
    ? reportData.summary.systemsWithAI + reportData.summary.processesWithAI 
    : 0;

  const hasHighRisk = reportData?.summary.riskDistribution.high || 0;
  const hasUnacceptable = reportData?.summary.riskDistribution.unacceptable || 0;

  const getComplianceColor = () => {
    if (hasUnacceptable > 0) return 'text-red-500';
    if (hasHighRisk > 0) return 'text-orange-500';
    if (reportData?.summary.complianceRate === 100) return 'text-green-500';
    return 'text-primary';
  };

  const getStatusBadge = () => {
    if (hasUnacceptable > 0) {
      return (
        <Badge variant="destructive" className="gap-1">
          <AlertTriangle className="h-3 w-3" />
          Kritisk
        </Badge>
      );
    }
    if (hasHighRisk > 0) {
      return (
        <Badge className="bg-orange-500/10 text-orange-600 border-orange-500/20 gap-1">
          <AlertTriangle className="h-3 w-3" />
          Høyrisiko
        </Badge>
      );
    }
    if (reportData?.summary.complianceRate === 100) {
      return (
        <Badge className="bg-green-500/10 text-green-600 border-green-500/20 gap-1">
          <CheckCircle className="h-3 w-3" />
          Compliant
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="gap-1">
        <Shield className="h-3 w-3" />
        Under vurdering
      </Badge>
    );
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            AI Act Compliance
          </CardTitle>
          {!isLoading && getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Compliance Rate */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Compliance-rate</span>
                <span className={`font-semibold ${getComplianceColor()}`}>
                  {reportData?.summary.complianceRate || 0}%
                </span>
              </div>
              <Progress 
                value={reportData?.summary.complianceRate || 0} 
                className="h-2"
              />
            </div>

            {/* AI Usage Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold">{reportData?.summary.systemsWithAI || 0}</p>
                <p className="text-xs text-muted-foreground">Systemer med AI</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold">{reportData?.summary.processesWithAI || 0}</p>
                <p className="text-xs text-muted-foreground">Prosesser med AI</p>
              </div>
            </div>

            {/* Risk Distribution */}
            {totalAIItems > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Risikofordeling</p>
                <div className="flex gap-1 h-2 rounded-full overflow-hidden bg-muted">
                  {Object.entries(reportData?.summary.riskDistribution || {}).map(([risk, count]) => {
                    if (count === 0) return null;
                    const percentage = (count / totalAIItems) * 100;
                    return (
                      <div
                        key={risk}
                        className={`${RISK_COLORS[risk]} transition-all`}
                        style={{ width: `${percentage}%` }}
                        title={`${RISK_LABELS[risk]}: ${count}`}
                      />
                    );
                  })}
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  {Object.entries(reportData?.summary.riskDistribution || {}).map(([risk, count]) => {
                    if (count === 0) return null;
                    return (
                      <div key={risk} className="flex items-center gap-1">
                        <div className={`w-2 h-2 rounded-full ${RISK_COLORS[risk]}`} />
                        <span className="text-muted-foreground">{RISK_LABELS[risk]}: {count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Warning Messages */}
            {hasUnacceptable > 0 && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <p className="text-xs text-red-600 font-medium flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {hasUnacceptable} system(er) har uakseptabel risiko
                </p>
              </div>
            )}

            {hasHighRisk > 0 && !hasUnacceptable && (
              <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                <p className="text-xs text-orange-600 font-medium flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {hasHighRisk} høyrisiko-system(er) krever conformity assessment
                </p>
              </div>
            )}

            {totalAIItems === 0 && (
              <div className="p-3 rounded-lg bg-muted/50 text-center">
                <Bot className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                <p className="text-xs text-muted-foreground">
                  Ingen AI-bruk registrert
                </p>
              </div>
            )}

            {/* Action Button */}
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full mt-2"
              onClick={() => navigate('/reports')}
            >
              Se AI Act-rapport
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
