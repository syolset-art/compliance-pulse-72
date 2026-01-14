import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Workflow, Bot, ChevronRight, AlertCircle } from "lucide-react";
import { ProcessAITab } from "./ProcessAITab";
import { AddProcessDialog } from "@/components/dialogs/AddProcessDialog";

interface ProcessListProps {
  workAreaId: string;
  workAreaName?: string;
}

export const ProcessList = ({ workAreaId, workAreaName = "Arbeidsområde" }: ProcessListProps) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [selectedProcessId, setSelectedProcessId] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

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
      <>
        <Card className="p-8">
          <div className="text-center">
            <Workflow className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {t("processList.noProcesses", "Ingen prosesser registrert")}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {t("processList.noProcessesDesc", "Legg til prosesser for å dokumentere AI-bruk og sikre compliance.")}
            </p>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              {t("processList.addProcess", "Legg til prosess")}
            </Button>
          </div>
        </Card>
        <AddProcessDialog
          open={isAddDialogOpen}
          onOpenChange={setIsAddDialogOpen}
          workAreaId={workAreaId}
          workAreaName={workAreaName}
          onProcessAdded={() => queryClient.invalidateQueries({ queryKey: ["work-area-processes", workAreaId] })}
        />
      </>
    );
  }

  return (
    <div className="flex flex-col lg:grid lg:grid-cols-3 gap-4 lg:gap-6">
      {/* Process List */}
      <div className="lg:col-span-1 space-y-2">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h3 className="font-medium text-sm sm:text-base">{t("processList.processes", "Prosesser")}</h3>
          <Button size="sm" variant="outline" className="text-xs sm:text-sm" onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
            <span className="hidden sm:inline">{t("common.add", "Legg til")}</span>
            <span className="sm:hidden">Ny</span>
          </Button>
        </div>
        
        {/* Horizontal scroll on mobile, vertical list on desktop */}
        <div className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:overflow-x-visible lg:pb-0 -mx-3 px-3 lg:mx-0 lg:px-0">
          {processes.map((process) => {
            const aiInfo = getAIInfo(process.id);
            const isSelected = selectedProcessId === process.id;
            
            return (
              <Card
                key={process.id}
                className={`cursor-pointer transition-colors flex-shrink-0 w-[200px] sm:w-[240px] lg:w-auto ${
                  isSelected ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                }`}
                onClick={() => setSelectedProcessId(process.id)}
              >
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate text-sm sm:text-base">{process.name}</p>
                      {process.description && (
                        <p className="text-xs sm:text-sm text-muted-foreground truncate mt-1">
                          {process.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                      {aiInfo?.has_ai && (
                        <Badge 
                          variant={getRiskBadgeVariant(aiInfo.risk_category)}
                          className="text-[10px] sm:text-xs px-1.5 sm:px-2"
                        >
                          <Bot className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
                          AI
                        </Badge>
                      )}
                      {!aiInfo && (
                        <Badge variant="outline" className="text-[10px] sm:text-xs text-muted-foreground px-1.5 sm:px-2 hidden sm:flex">
                          <AlertCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
                          {t("processList.notAssessed", "Ikke vurdert")}
                        </Badge>
                      )}
                      <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground hidden lg:block" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Process Detail */}
      <div className="lg:col-span-2">
        {selectedProcess ? (
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Workflow className="h-4 w-4 sm:h-5 sm:w-5" />
                {selectedProcess.name}
              </CardTitle>
              {selectedProcess.description && (
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {selectedProcess.description}
                </p>
              )}
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
              <Tabs defaultValue="ai">
                <TabsList className="w-full sm:w-auto">
                  <TabsTrigger value="ai" className="gap-1 sm:gap-2 text-xs sm:text-sm flex-1 sm:flex-none">
                    <Bot className="h-3 w-3 sm:h-4 sm:w-4" />
                    {t("processList.aiUsage", "AI-bruk")}
                  </TabsTrigger>
                  <TabsTrigger value="details" className="text-xs sm:text-sm flex-1 sm:flex-none">
                    {t("processList.details", "Detaljer")}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="ai" className="mt-3 sm:mt-4">
                  <ProcessAITab
                    processId={selectedProcess.id}
                    processName={selectedProcess.name}
                    processDescription={selectedProcess.description || undefined}
                    workAreaId={workAreaId}
                  />
                </TabsContent>

                <TabsContent value="details" className="mt-3 sm:mt-4">
                  <div className="space-y-3 sm:space-y-4">
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                        {t("processList.status", "Status")}
                      </p>
                      <Badge variant={selectedProcess.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                        {selectedProcess.status}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                        {t("processList.createdAt", "Opprettet")}
                      </p>
                      <p className="text-xs sm:text-sm">
                        {new Date(selectedProcess.created_at).toLocaleDateString('nb-NO')}
                      </p>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        ) : (
          <Card className="min-h-[200px] lg:min-h-[400px] flex items-center justify-center">
            <div className="text-center text-muted-foreground p-4">
              <Workflow className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 opacity-50" />
              <p className="text-sm sm:text-base">{t("processList.selectProcess", "Velg en prosess for å se detaljer")}</p>
            </div>
          </Card>
        )}
      </div>
      <AddProcessDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        workAreaId={workAreaId}
        workAreaName={workAreaName}
        onProcessAdded={() => queryClient.invalidateQueries({ queryKey: ["work-area-processes", workAreaId] })}
      />
    </div>
  );
};
