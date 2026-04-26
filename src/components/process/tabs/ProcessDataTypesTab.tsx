import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Database } from "lucide-react";

interface ProcessDataTypesTabProps {
  processId: string;
  systemId?: string;
}

// Mock data types - in production these would come from a database
const MOCK_DATA_TYPES = [
  {
    systemName: "Microsoft Azure",
    dataTypes: [
      { name: "Enhetsidentifikatorer (informasjonskapsler, enhets-IDer)", category: "ORDINÆR" },
      { name: "Fullt navn (fornavn, etternavn)", category: "ORDINÆR" },
      { name: "IP-adresse", category: "ORDINÆR" },
      { name: "Kontaktinformasjon (e-post, telefonnummer, postadresse)", category: "ORDINÆR" },
    ]
  },
  {
    systemName: "Basecamp",
    dataTypes: [
      { name: "Fullt navn (fornavn, etternavn)", category: "ORDINÆR" },
      { name: "Kontaktinformasjon (e-post, telefonnummer, postadresse)", category: "ORDINÆR" },
    ]
  }
];

export const ProcessDataTypesTab = ({ processId, systemId }: ProcessDataTypesTabProps) => {
  // Fetch system info
  const { data: system, isLoading } = useQuery({
    queryKey: ["process-system-info", systemId],
    queryFn: async () => {
      if (!systemId) return null;
      
      const { data, error } = await supabase
        .from("systems")
        .select("name")
        .eq("id", systemId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!systemId,
  });

  const getCategoryColor = (category: string) => {
    switch (category.toUpperCase()) {
      case "SENSITIV":
        return "bg-destructive/10 text-destructive border-destructive/20";
      case "SÆRLIG":
        return "bg-warning/10 text-warning border-warning/20";
      default:
        return "bg-primary/10 text-primary border-primary/20";
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
      <div>
        <h3 className="text-lg font-semibold">Datatyper</h3>
        <p className="text-sm text-muted-foreground">
          Personopplysninger som behandles i systemene knyttet til denne prosessen
        </p>
      </div>

      {/* Data Types by System */}
      <div className="space-y-4">
        {MOCK_DATA_TYPES.map((systemData, index) => (
          <Card key={index} className="border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium">{systemData.systemName}</h4>
                <Badge variant="default" className="bg-primary">
                  {systemData.dataTypes.length} DATATYPER
                </Badge>
              </div>
              
              <div className="space-y-2">
                {systemData.dataTypes.map((dataType, dtIndex) => (
                  <div key={dtIndex} className="flex items-center gap-2">
                    <Badge 
                      variant="outline" 
                      className={getCategoryColor(dataType.category)}
                    >
                      {dataType.category}
                    </Badge>
                    <span className="text-sm">{dataType.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {MOCK_DATA_TYPES.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center text-muted-foreground">
            <Database className="h-8 w-8 mx-auto mb-3 opacity-50" />
            <p>Ingen datatyper er registrert for denne prosessen</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
