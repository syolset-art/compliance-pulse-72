import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import { getSystemIcon } from "@/lib/systemIcons";

interface ProcessSystemsTabProps {
  processId: string;
  systemId?: string;
}

export const ProcessSystemsTab = ({ processId, systemId }: ProcessSystemsTabProps) => {
  // Fetch the system this process belongs to
  const { data: systems, isLoading } = useQuery({
    queryKey: ["process-systems", processId, systemId],
    queryFn: async () => {
      if (!systemId) return [];
      
      const { data, error } = await supabase
        .from("systems")
        .select("*")
        .eq("id", systemId);
      
      if (error) throw error;
      return data || [];
    },
  });

  const getRiskLabel = (risk: string | null) => {
    switch (risk) {
      case "critical": return "KRITISK";
      case "high": return "HØY";
      case "medium": return "MODERAT";
      case "low": return "LAV";
      default: return "MODERAT";
    }
  };

  const getRiskColor = (risk: string | null) => {
    switch (risk) {
      case "critical": return "bg-red-100 text-red-700 border-red-200";
      case "high": return "bg-orange-100 text-orange-700 border-orange-200";
      case "medium": return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "low": return "bg-green-100 text-green-700 border-green-200";
      default: return "bg-yellow-100 text-yellow-700 border-yellow-200";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Systemer</h3>
          <p className="text-sm text-muted-foreground">
            Oversikt over systemer knyttet til denne prosessen
          </p>
        </div>
        <Button variant="default" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          Administrer systemer
        </Button>
      </div>

      {/* System Cards */}
      {systems && systems.length > 0 ? (
        <div className="space-y-3">
          {systems.map((system) => {
            const SystemIcon = getSystemIcon(system.name, system.vendor);
            
            return (
              <Card key={system.id} className="border">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <SystemIcon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h4 className="font-medium">{system.name}</h4>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {system.description || "Ingen beskrivelse tilgjengelig."}
                          </p>
                        </div>
                        <Badge 
                          variant="outline" 
                          className={getRiskColor(system.risk_level)}
                        >
                          {getRiskLabel(system.risk_level)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center text-muted-foreground">
            <Settings className="h-8 w-8 mx-auto mb-3 opacity-50" />
            <p>Ingen systemer er knyttet til denne prosessen</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
