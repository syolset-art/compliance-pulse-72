import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  FileText,
  Edit2,
  HelpCircle,
  Settings,
  AlertTriangle,
  Shield,
  Users,
  Database,
  Workflow,
} from "lucide-react";
import { ProcessAITab } from "./ProcessAITab";
import { ProcessSystemsTab } from "./tabs/ProcessSystemsTab";
import { ProcessDataTypesTab } from "./tabs/ProcessDataTypesTab";
import { ProcessCriticalityTab } from "./tabs/ProcessCriticalityTab";
import { ProcessRiskTab } from "./tabs/ProcessRiskTab";
import { getSystemIcon } from "@/lib/systemIcons";

interface ProcessCardProps {
  processId: string;
  workAreaId?: string;
  onEdit?: () => void;
}

export const ProcessCard = ({ processId, workAreaId, onEdit }: ProcessCardProps) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("systems");

  // Fetch process details
  const { data: process, isLoading: processLoading } = useQuery({
    queryKey: ["process-detail", processId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("system_processes")
        .select("*, systems(id, name, vendor, work_area_id, work_areas(name))")
        .eq("id", processId)
        .single();
      if (error) throw error;
      return data;
    },
  });

  // Fetch AI usage data
  const { data: aiUsage } = useQuery({
    queryKey: ["process-ai-usage", processId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("process_ai_usage")
        .select("*")
        .eq("process_id", processId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  // Mock data for metrics - in a real app, these would come from the database
  const metrics = {
    dataTypes: 4,
    systems: 2,
    riskScenarios: 3,
    criticalSystems: 0,
    totalSystems: 2,
    criticalScenarios: 1,
    totalCriticalityScore: "high" as const,
  };

  const getCriticalityLabel = (score: string) => {
    switch (score) {
      case "high": return "Høy";
      case "medium": return "Moderat";
      case "low": return "Lav";
      default: return "Ikke vurdert";
    }
  };

  const getCriticalityColor = (score: string) => {
    switch (score) {
      case "high": return "text-red-600 bg-red-50 border-red-200";
      case "medium": return "text-orange-600 bg-orange-50 border-orange-200";
      case "low": return "text-green-600 bg-green-50 border-green-200";
      default: return "text-muted-foreground bg-muted border-border";
    }
  };

  const getProgressColor = (score: string) => {
    switch (score) {
      case "high": return "bg-red-500";
      case "medium": return "bg-orange-500";
      case "low": return "bg-green-500";
      default: return "bg-muted";
    }
  };

  if (processLoading) {
    return (
      <Card className="p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </Card>
    );
  }

  if (!process) {
    return (
      <Card className="p-8 text-center text-muted-foreground">
        Prosess ikke funnet
      </Card>
    );
  }

  const workAreaName = (process.systems as any)?.work_areas?.name || "Ukjent";
  const processOwner = workAreaName;
  const processResponsible = "Ikke tildelt";

  return (
    <div className="space-y-4">
      {/* Header Card */}
      <Card className="bg-gradient-to-r from-primary/5 via-primary/3 to-transparent border-primary/20">
        <CardContent className="p-4 sm:p-6">
          {/* Top row */}
          <div className="flex items-start justify-between mb-3 sm:mb-4">
            <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
              <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span>Prosesskort</span>
            </div>
            <Button variant="outline" size="sm" onClick={onEdit} className="h-8 text-xs sm:text-sm">
              <Edit2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1" />
              Rediger
            </Button>
          </div>

          {/* Title */}
          <h1 className="text-xl sm:text-2xl font-semibold mb-2 sm:mb-3">{process.name}</h1>

          {/* Metadata dots */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm mb-2 sm:mb-3">
            <div className="flex items-center gap-1 sm:gap-1.5">
              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-blue-500" />
              <span>{metrics.dataTypes} datatyper</span>
            </div>
            <div className="flex items-center gap-1 sm:gap-1.5">
              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-green-500" />
              <span>{metrics.systems} systemer</span>
            </div>
            <div className="flex items-center gap-1 sm:gap-1.5">
              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-orange-500" />
              <span>{metrics.riskScenarios} risikoscenarioer</span>
            </div>
          </div>

          {/* Owner info */}
          <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-1.5 sm:gap-6 text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
            <div className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span>Prosesseier: {processOwner}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span>Prosessansvar: {processResponsible}</span>
            </div>
          </div>

          {/* Description */}
          {process.description && (
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed line-clamp-3 sm:line-clamp-none">
              {process.description}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {/* Total Criticality */}
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Total kritikalitet</span>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    Samlet kritikalitetsvurdering for prosessen
                  </TooltipContent>
                </Tooltip>
              </div>
              <Badge 
                variant="outline" 
                className={getCriticalityColor(metrics.totalCriticalityScore)}
              >
                {getCriticalityLabel(metrics.totalCriticalityScore)}
              </Badge>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className={`h-full ${getProgressColor(metrics.totalCriticalityScore)} transition-all`}
                style={{ width: metrics.totalCriticalityScore === 'high' ? '90%' : metrics.totalCriticalityScore === 'medium' ? '60%' : '30%' }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Critical Systems */}
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Kritiske systemer</span>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    Antall systemer med kritisk status
                  </TooltipContent>
                </Tooltip>
              </div>
              <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">
                {Math.round((metrics.criticalSystems / metrics.totalSystems) * 100)}%
              </Badge>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-muted-foreground/30 transition-all"
                style={{ width: `${(metrics.criticalSystems / metrics.totalSystems) * 100}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1.5">
              {metrics.criticalSystems}/{metrics.totalSystems}
            </p>
          </CardContent>
        </Card>

        {/* Critical Scenarios */}
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Kritiske scenarioer</span>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    Antall risikoscenarioer med kritisk vurdering
                  </TooltipContent>
                </Tooltip>
              </div>
              <Badge variant="outline" className="bg-orange-50 text-orange-600 border-orange-200">
                {Math.round((metrics.criticalScenarios / metrics.riskScenarios) * 100)}%
              </Badge>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-orange-500 transition-all"
                style={{ width: `${(metrics.criticalScenarios / metrics.riskScenarios) * 100}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1.5">
              {metrics.criticalScenarios}/{metrics.riskScenarios}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Card>
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="border-b px-2 sm:px-4 pt-2 overflow-x-auto">
              <TabsList className="bg-transparent h-auto p-0 gap-0 w-max sm:w-auto">
                <TabsTrigger 
                  value="systems" 
                  className="data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none px-2.5 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm"
                >
                  Systemer
                </TabsTrigger>
                <TabsTrigger 
                  value="datatypes" 
                  className="data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none px-2.5 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm"
                >
                  Datatyper
                </TabsTrigger>
                <TabsTrigger 
                  value="criticality" 
                  className="data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none px-2.5 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm"
                >
                  Kritikalitet
                </TabsTrigger>
                <TabsTrigger 
                  value="risk" 
                  className="data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none px-2.5 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm"
                >
                  Risiko
                </TabsTrigger>
                <TabsTrigger 
                  value="ai" 
                  className="data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none px-2.5 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm"
                >
                  AI-bruk
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="p-3 sm:p-6">
              <TabsContent value="systems" className="mt-0">
                <ProcessSystemsTab 
                  processId={processId} 
                  systemId={process.system_id} 
                />
              </TabsContent>

              <TabsContent value="datatypes" className="mt-0">
                <ProcessDataTypesTab 
                  processId={processId} 
                  systemId={process.system_id} 
                />
              </TabsContent>

              <TabsContent value="criticality" className="mt-0">
                <ProcessCriticalityTab processId={processId} />
              </TabsContent>

              <TabsContent value="risk" className="mt-0">
                <ProcessRiskTab processId={processId} />
              </TabsContent>

              <TabsContent value="ai" className="mt-0">
                <ProcessAITab
                  processId={processId}
                  processName={process.name}
                  processDescription={process.description || undefined}
                  workAreaId={workAreaId}
                  systemId={process.system_id}
                />
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
