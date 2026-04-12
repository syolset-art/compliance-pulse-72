import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Database, Workflow, Shield, AlertTriangle } from "lucide-react";
import { VendorTPRMStatus } from "@/components/trust-controls/VendorTPRMStatus";

interface VendorUsageTabProps {
  assetId: string;
}

export const VendorUsageTab = ({ assetId }: VendorUsageTabProps) => {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";

  const { data: asset } = useQuery({
    queryKey: ["asset-usage", assetId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assets")
        .select("*, work_areas(id, name, responsible_person)")
        .eq("id", assetId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: dataCategories = [] } = useQuery({
    queryKey: ["asset-data-categories", assetId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("asset_data_categories")
        .select("*")
        .eq("asset_id", assetId);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: processors = [] } = useQuery({
    queryKey: ["asset-processors", assetId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("asset_data_processors")
        .select("*")
        .eq("asset_id", assetId);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: processes = [] } = useQuery({
    queryKey: ["system-processes", assetId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("system_processes")
        .select("*")
        .eq("system_id", assetId);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: relations = [] } = useQuery({
    queryKey: ["asset-relations-usage", assetId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("asset_relationships")
        .select("*, source:assets!asset_relationships_source_asset_id_fkey(id,name), target:assets!asset_relationships_target_asset_id_fkey(id,name)")
        .or(`source_asset_id.eq.${assetId},target_asset_id.eq.${assetId}`);
      if (error) throw error;
      return data || [];
    },
  });

  const criticality = asset?.criticality || (isNb ? "Ikke satt" : "Not set");
  const riskLevel = asset?.risk_level || (isNb ? "Ikke vurdert" : "Not assessed");
  const gdprRole = asset?.gdpr_role || (isNb ? "Ikke definert" : "Not defined");

  return (
    <div className="space-y-5">
      {/* Context badge */}
      <Badge variant="outline" className="gap-1.5 border-primary/30 text-primary">
        <Building2 className="h-3.5 w-3.5" />
        {isNb ? "Vår organisasjon" : "Our organization"}
      </Badge>

      {/* TPRM Status */}
      <VendorTPRMStatus assetId={assetId} />

      {/* Criticality & Role */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <AlertTriangle className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
            <p className="text-xs text-muted-foreground">{isNb ? "Kritikalitet" : "Criticality"}</p>
            <p className="font-semibold text-sm capitalize">{criticality}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Shield className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
            <p className="text-xs text-muted-foreground">{isNb ? "Risikonivå" : "Risk level"}</p>
            <p className="font-semibold text-sm capitalize">{riskLevel}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Database className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
            <p className="text-xs text-muted-foreground">{isNb ? "GDPR-rolle" : "GDPR role"}</p>
            <p className="font-semibold text-sm capitalize">{gdprRole}</p>
          </CardContent>
        </Card>
      </div>

      {/* Data categories */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Database className="h-4 w-4" />
            {isNb ? "Datatyper som behandles" : "Data types processed"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {dataCategories.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {dataCategories.map(dc => (
                <Badge key={dc.id} variant="secondary" className="text-xs">{dc.data_type_name}</Badge>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">{isNb ? "Ingen datatyper registrert" : "No data types registered"}</p>
          )}
        </CardContent>
      </Card>

      {/* Processes */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Workflow className="h-4 w-4" />
            {isNb ? "Prosesser som bruker denne leverandøren" : "Processes using this vendor"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {processes.length > 0 ? (
            <div className="space-y-2">
              {processes.map(p => (
                <div key={p.id} className="flex items-center justify-between p-2 bg-muted/50 rounded text-sm">
                  <span className="font-medium">{p.name}</span>
                  <Badge variant={p.status === "active" ? "default" : "secondary"} className="text-[10px]">{p.status}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">{isNb ? "Ingen prosesser koblet" : "No processes linked"}</p>
          )}
        </CardContent>
      </Card>

      {/* Integrations / Relations */}
      {relations.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{isNb ? "Integrasjoner" : "Integrations"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {relations.map(r => {
                const other = r.source_asset_id === assetId ? (r as any).target : (r as any).source;
                return (
                  <div key={r.id} className="flex items-center gap-2 text-sm p-1.5">
                    <Badge variant="outline" className="text-[10px]">{r.relationship_type}</Badge>
                    <span>{other?.name || "—"}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sub-processors */}
      {processors.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{isNb ? "Underdatabehandlere" : "Sub-processors"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {processors.map(p => (
                <div key={p.id} className="flex items-center justify-between text-sm p-1.5">
                  <span className="font-medium">{p.name}</span>
                  {p.eu_eos_compliant !== null && (
                    <Badge variant={p.eu_eos_compliant ? "default" : "destructive"} className="text-[10px]">
                      {p.eu_eos_compliant ? "EU/EØS" : (isNb ? "Utenfor EU" : "Non-EU")}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
