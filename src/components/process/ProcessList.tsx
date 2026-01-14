import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Workflow, Bot, ChevronRight, AlertCircle } from "lucide-react";
import { ProcessAITab } from "./ProcessAITab";

interface ProcessListProps {
  workAreaId: string;
}

export const ProcessList = ({ workAreaId }: ProcessListProps) => {
  const { t } = useTranslation();
  const [selectedProcessId, setSelectedProcessId] = useState<string | null>(null);

  // Fetch processes for this work area (via systems)
  const { data: processes, isLoading } = useQuery({
    queryKey: ["work-area-processes", workAreaId],
    queryFn: async () => {
      // First get systems in this work area
      const { data: systems, error: systemsError } = await supabase
        .from("systems")
        .select("id")
        .eq("work_area_id", workAreaId);
      
      if (systemsError) throw systemsError;
      
      if (!systems || systems.length === 0) return [];
      
      const systemIds = systems.map(s => s.id);
      
      // Then get processes for those systems
      const { data: processData, error: processError } = await supabase
        .from("system_processes")
        .select("*")
        .in("system_id", systemIds)
        .order("created_at", { ascending: false });
      
      if (processError) throw processError;
      return processData || [];
    },
  });

  // Fetch AI usage for all processes
  const { data: processAIUsage } = useQuery({
    queryKey: ["process-ai-usage-list", workAreaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("process_ai_usage")
        .select("process_id, has_ai, risk_category, compliance_status")
        .eq("work_area_id", workAreaId);
      
      if (error) throw error;
      return data || [];
    },
  });

  const getAIInfo = (processId: string) => {
    return processAIUsage?.find(p => p.process_id === processId);
  };

  const getRiskBadgeVariant = (risk: string | null) => {
    switch (risk) {
      case 'unacceptable': return 'destructive';
      case 'high': return 'destructive';
      case 'limited': return 'secondary';
      default: return 'outline';
    }
  };

  const selectedProcess = processes?.find(p => p.id === selectedProcessId);

  if (isLoading) {
    return (
      <Card className="p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </Card>
    );
  }

  if (!processes || processes.length === 0) {
    return (
      <Card className="p-8">
        <div className="text-center">
          <Workflow className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">
            {t("processList.noProcesses", "Ingen prosesser registrert")}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            {t("processList.noProcessesDesc", "Legg til prosesser for å dokumentere AI-bruk og sikre compliance.")}
          </p>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            {t("processList.addProcess", "Legg til prosess")}
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Process List */}
      <div className="lg:col-span-1 space-y-2">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium">{t("processList.processes", "Prosesser")}</h3>
          <Button size="sm" variant="outline">
            <Plus className="h-4 w-4 mr-1" />
            {t("common.add", "Legg til")}
          </Button>
        </div>
        
        {processes.map((process) => {
          const aiInfo = getAIInfo(process.id);
          const isSelected = selectedProcessId === process.id;
          
          return (
            <Card
              key={process.id}
              className={`cursor-pointer transition-colors ${
                isSelected ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
              }`}
              onClick={() => setSelectedProcessId(process.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{process.name}</p>
                    {process.description && (
                      <p className="text-sm text-muted-foreground truncate mt-1">
                        {process.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {aiInfo?.has_ai && (
                      <Badge 
                        variant={getRiskBadgeVariant(aiInfo.risk_category)}
                        className="text-xs"
                      >
                        <Bot className="h-3 w-3 mr-1" />
                        AI
                      </Badge>
                    )}
                    {!aiInfo && (
                      <Badge variant="outline" className="text-xs text-muted-foreground">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        {t("processList.notAssessed", "Ikke vurdert")}
                      </Badge>
                    )}
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Process Detail */}
      <div className="lg:col-span-2">
        {selectedProcess ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Workflow className="h-5 w-5" />
                {selectedProcess.name}
              </CardTitle>
              {selectedProcess.description && (
                <p className="text-sm text-muted-foreground">
                  {selectedProcess.description}
                </p>
              )}
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="ai">
                <TabsList>
                  <TabsTrigger value="ai" className="gap-2">
                    <Bot className="h-4 w-4" />
                    {t("processList.aiUsage", "AI-bruk")}
                  </TabsTrigger>
                  <TabsTrigger value="details">
                    {t("processList.details", "Detaljer")}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="ai" className="mt-4">
                  <ProcessAITab
                    processId={selectedProcess.id}
                    processName={selectedProcess.name}
                    processDescription={selectedProcess.description || undefined}
                    workAreaId={workAreaId}
                  />
                </TabsContent>

                <TabsContent value="details" className="mt-4">
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        {t("processList.status", "Status")}
                      </p>
                      <Badge variant={selectedProcess.status === 'active' ? 'default' : 'secondary'}>
                        {selectedProcess.status}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        {t("processList.createdAt", "Opprettet")}
                      </p>
                      <p className="text-sm">
                        {new Date(selectedProcess.created_at).toLocaleDateString('nb-NO')}
                      </p>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        ) : (
          <Card className="h-full min-h-[400px] flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <Workflow className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{t("processList.selectProcess", "Velg en prosess for å se detaljer")}</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};
