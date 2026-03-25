import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ExternalLink, Building2, User, Edit2, Check, X, Mail } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { getSystemIcon } from "@/lib/systemIcons";

interface SystemHeaderProps {
  system: {
    id: string;
    name: string;
    description?: string | null;
    vendor?: string | null;
    category?: string | null;
    status?: string | null;
    url?: string | null;
    work_area_id?: string | null;
    system_manager?: string | null;
    contact_person?: string | null;
    contact_email?: string | null;
    work_areas?: {
      id: string;
      name: string;
      responsible_person?: string | null;
    } | null;
  };
}

export const SystemHeader = ({ system }: SystemHeaderProps) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditingManager, setIsEditingManager] = useState(false);
  const [managerValue, setManagerValue] = useState(system.system_manager || "");

  const { data: workAreas } = useQuery({
    queryKey: ["work-areas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("work_areas")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (updates: { work_area_id?: string; system_manager?: string }) => {
      const { error } = await supabase
        .from("systems")
        .update(updates)
        .eq("id", system.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["system", system.id] });
      toast({
        title: t("common.success"),
        description: t("trustProfile.updateSuccess"),
      });
    },
    onError: () => {
      toast({
        title: t("common.error"),
        description: t("trustProfile.updateError"),
        variant: "destructive",
      });
    },
  });

  const handleWorkAreaChange = (value: string) => {
    updateMutation.mutate({ work_area_id: value === "none" ? undefined : value });
  };

  const handleManagerSave = () => {
    updateMutation.mutate({ system_manager: managerValue });
    setIsEditingManager(false);
  };

  const IconComponent = getSystemIcon(system.name, system.vendor);

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* System icon and basic info */}
          <div className="flex items-start gap-4 flex-1">
            <div className="h-16 w-16 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <IconComponent className="h-8 w-8 text-primary" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold">{system.name}</h1>
                {system.vendor && (
                  <Badge variant="secondary">{system.vendor}</Badge>
                )}
                {system.status && (
                  <Badge variant={system.status === "active" ? "default" : "outline"}>
                    {system.status}
                  </Badge>
                )}
              </div>
              
              {system.url && (
                <a 
                  href={system.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline flex items-center gap-1 mt-1"
                >
                  {system.url}
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
              
              {system.description && (
                <p className="text-muted-foreground mt-2 text-sm">{system.description}</p>
              )}
            </div>
          </div>

          {/* Owner, manager & contact section */}
          <div className="flex flex-col gap-4 lg:w-[28rem]">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Owner (Work Area) */}
              <div className="flex-1 space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  {t("trustProfile.owner")}
                </label>
                <Select 
                  value={system.work_area_id || "none"} 
                  onValueChange={handleWorkAreaChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("trustProfile.selectOwner")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{t("trustProfile.noOwner")}</SelectItem>
                    {workAreas?.map((area) => (
                      <SelectItem key={area.id} value={area.id}>
                        {area.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Internal System Manager */}
              <div className="flex-1 space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  {t("trustProfile.systemManager")}
                </label>
                {isEditingManager ? (
                  <div className="flex gap-2">
                    <Input
                      value={managerValue}
                      onChange={(e) => setManagerValue(e.target.value)}
                      placeholder={t("trustProfile.enterManager")}
                      className="flex-1"
                    />
                    <Button size="icon" variant="ghost" onClick={handleManagerSave}>
                      <Check className="h-4 w-4 text-green-600" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => setIsEditingManager(false)}>
                      <X className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => setIsEditingManager(true)}
                  >
                    {system.system_manager || t("trustProfile.assignManager")}
                    <Edit2 className="h-3 w-3 ml-auto" />
                  </Button>
                )}
              </div>
            </div>

            {/* Vendor Contact Person */}
            {(system.contact_person || system.contact_email) && (
              <div className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/30 border border-border text-sm">
                <User className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{system.contact_person || "—"}</p>
                  {system.contact_email && (
                    <a href={`mailto:${system.contact_email}`} className="text-xs text-primary hover:underline flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {system.contact_email}
                    </a>
                  )}
                </div>
                <Badge variant="outline" className="text-xs shrink-0">Leverandørkontakt</Badge>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
