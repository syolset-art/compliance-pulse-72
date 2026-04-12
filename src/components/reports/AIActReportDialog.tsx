import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, FileText, Download, Bot, AlertTriangle, CheckCircle, Shield, Server, Settings, Users } from "lucide-react";
import { useAIActReportData } from "@/hooks/useAIActReportData";
import { generateAIActReport } from "@/lib/generateAIActReport";
import { toast } from "sonner";

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

interface AIActReportDialogProps {
  trigger?: React.ReactNode;
}

export function AIActReportDialog({ trigger }: AIActReportDialogProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const { data: reportData, isLoading, error } = useAIActReportData();

  const handleGenerateReport = async () => {
    if (!reportData) return;

    setIsGenerating(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500)); // Brief delay for UX
      generateAIActReport(reportData);
      toast.success('AI Act-rapport generert', {
        description: 'PDF-filen er lastet ned til din enhet.',
      });
    } catch (err) {
      console.error('Failed to generate report:', err);
      toast.error('Kunne ikke generere rapport', {
        description: 'Prøv igjen senere.',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const systemsWithAI = reportData?.systems.filter(s => s.hasAI) || [];
  const processesWithAI = reportData?.processes.filter(p => p.hasAI) || [];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline">
            <Bot className="h-4 w-4 mr-2" />
            AI Act Rapport
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            AI Act – Etterlevelsesrapport
          </DialogTitle>
          <DialogDescription>
            Generer en komplett PDF-rapport over all AI-bruk i virksomheten
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="text-center py-8 text-destructive">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
            <p>Kunne ikke laste data</p>
          </div>
        ) : reportData ? (
          <div className="space-y-6">
            {/* Company Info */}
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{reportData.companyName}</h3>
                    <p className="text-sm text-muted-foreground">{reportData.companyIndustry}</p>
                  </div>
                  <Badge variant="outline">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    {reportData.summary.complianceRate}% compliance
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Server className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{reportData.summary.systemsWithAI}</p>
                      <p className="text-xs text-muted-foreground">
                        av {reportData.summary.totalSystems} systemer med AI
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Settings className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{reportData.summary.processesWithAI}</p>
                      <p className="text-xs text-muted-foreground">
                        av {reportData.summary.totalProcesses} prosesser med AI
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Risk Distribution */}
            <Card>
              <CardContent className="pt-4">
                <h4 className="text-sm font-medium mb-3">Risikofordeling</h4>
                <div className="space-y-2">
                  {Object.entries(reportData.summary.riskDistribution).map(([risk, count]) => {
                    const total = Object.values(reportData.summary.riskDistribution).reduce((a, b) => a + b, 0);
                    const percentage = total > 0 ? (count / total) * 100 : 0;
                    return (
                      <div key={risk} className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${RISK_COLORS[risk]}`} />
                        <span className="text-sm flex-1">{RISK_LABELS[risk]}</span>
                        <span className="text-sm font-medium">{count}</span>
                        <div className="w-24">
                          <Progress value={percentage} className="h-2" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Systems with AI Preview */}
            {systemsWithAI.length > 0 && (
              <Card>
                <CardContent className="pt-4">
                  <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <Server className="h-4 w-4" />
                    Systemer med AI ({systemsWithAI.length})
                  </h4>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {systemsWithAI.slice(0, 5).map(system => (
                      <div key={system.systemId} className="flex items-center justify-between text-sm">
                        <span>{system.systemName}</span>
                        <Badge variant="outline" className="text-xs">
                          {RISK_LABELS[system.riskCategory || 'unknown']}
                        </Badge>
                      </div>
                    ))}
                    {systemsWithAI.length > 5 && (
                      <p className="text-xs text-muted-foreground">
                        +{systemsWithAI.length - 5} flere...
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Processes with AI Preview */}
            {processesWithAI.length > 0 && (
              <Card>
                <CardContent className="pt-4">
                  <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Prosesser med AI ({processesWithAI.length})
                  </h4>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {processesWithAI.slice(0, 5).map(process => (
                      <div key={process.processId} className="flex items-center justify-between text-sm">
                        <span>{process.processName}</span>
                        <Badge variant="outline" className="text-xs">
                          {RISK_LABELS[process.riskCategory || 'unknown']}
                        </Badge>
                      </div>
                    ))}
                    {processesWithAI.length > 5 && (
                      <p className="text-xs text-muted-foreground">
                        +{processesWithAI.length - 5} flere...
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* No AI Message */}
            {systemsWithAI.length === 0 && processesWithAI.length === 0 && (
              <Card>
                <CardContent className="pt-4 text-center py-8">
                  <Bot className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground">
                    Ingen AI-bruk registrert i systemer eller prosesser.
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Rapporten vil inneholde en oversikt over alle systemer og prosesser.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Generate Button */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Avbryt
              </Button>
              <Button onClick={handleGenerateReport} disabled={isGenerating}>
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Genererer...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Last ned PDF
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
