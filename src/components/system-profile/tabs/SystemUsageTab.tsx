import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, FileText, Users, Workflow } from "lucide-react";

interface SystemUsageTabProps {
  systemId: string;
}

export const SystemUsageTab = ({ systemId }: SystemUsageTabProps) => {
  const { t } = useTranslation();

  const { data: processes } = useQuery({
    queryKey: ["system-processes", systemId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("system_processes")
        .select("*")
        .eq("system_id", systemId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: system } = useQuery({
    queryKey: ["system-with-workarea", systemId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("systems")
        .select(`
          *,
          work_areas (
            id,
            name,
            description,
            responsible_person
          )
        `)
        .eq("id", systemId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Work Areas */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5" />
            {t("trustProfile.workAreas")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {system?.work_areas ? (
            <div className="p-4 bg-muted/50 rounded-lg space-y-2">
              <p className="font-medium">{system.work_areas.name}</p>
              {system.work_areas.description && (
                <p className="text-sm text-muted-foreground">{system.work_areas.description}</p>
              )}
              {system.work_areas.responsible_person && (
                <p className="text-sm">
                  <span className="text-muted-foreground">{t("trustProfile.responsible")}:</span>{" "}
                  {system.work_areas.responsible_person}
                </p>
              )}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">{t("trustProfile.noWorkArea")}</p>
          )}
        </CardContent>
      </Card>

      {/* Protocols */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {t("trustProfile.protocols")}
          </CardTitle>
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-1" />
            {t("common.add")}
          </Button>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">{t("trustProfile.noProtocols")}</p>
        </CardContent>
      </Card>

      {/* Processes */}
      <Card className="lg:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Workflow className="h-5 w-5" />
            {t("trustProfile.processes")}
          </CardTitle>
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-1" />
            {t("common.add")}
          </Button>
        </CardHeader>
        <CardContent>
          {processes && processes.length > 0 ? (
            <div className="space-y-3">
              {processes.map((process) => (
                <div key={process.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium">{process.name}</p>
                    {process.description && (
                      <p className="text-sm text-muted-foreground">{process.description}</p>
                    )}
                  </div>
                  <Badge variant={process.status === "active" ? "default" : "secondary"}>
                    {process.status}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">{t("trustProfile.noProcesses")}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
