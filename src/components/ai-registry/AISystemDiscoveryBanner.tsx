import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, ChevronDown, ChevronUp, Plus } from "lucide-react";
import { useCreateAISystem } from "@/hooks/useAISystemRegistry";
import { toast } from "sonner";

interface DiscoveredSystem {
  name: string;
  provider: string | null;
  processes: Array<{
    id: string;
    name: string;
    riskCategory: string | null;
    affectedPersons: string[];
  }>;
  highestRisk: string;
  allAffectedPersons: string[];
}

interface AISystemDiscoveryBannerProps {
  discoveredCount: number;
  systems: DiscoveredSystem[];
}

export function AISystemDiscoveryBanner({ discoveredCount, systems }: AISystemDiscoveryBannerProps) {
  const [expanded, setExpanded] = useState(false);
  const createSystem = useCreateAISystem();

  const handleAddSystem = async (system: DiscoveredSystem) => {
    try {
      await createSystem.mutateAsync({
        name: system.name,
        provider: system.provider || undefined,
        risk_category: system.highestRisk,
        use_cases: system.processes.map(p => p.name),
        affected_persons: system.allAffectedPersons,
      });
      toast.success(`${system.name} lagt til i registeret`);
    } catch (error) {
      toast.error("Kunne ikke legge til system");
    }
  };

  const handleAddAll = async () => {
    for (const system of systems) {
      await handleAddSystem(system);
    }
  };

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-medium">
                {discoveredCount} AI-system{discoveredCount !== 1 ? "er" : ""} oppdaget
              </h3>
              <p className="text-sm text-muted-foreground">
                Basert på prosess-dokumentasjonen din har vi identifisert AI-systemer som ikke er i registeret.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setExpanded(!expanded)}>
              {expanded ? (
                <>
                  Skjul <ChevronUp className="h-4 w-4 ml-1" />
                </>
              ) : (
                <>
                  Vis alle <ChevronDown className="h-4 w-4 ml-1" />
                </>
              )}
            </Button>
            <Button size="sm" onClick={handleAddAll} disabled={createSystem.isPending}>
              <Plus className="h-4 w-4 mr-1" />
              Legg til alle
            </Button>
          </div>
        </div>

        {expanded && (
          <div className="mt-4 space-y-3">
            {systems.map((system, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 bg-background rounded-lg border"
              >
                <div className="flex items-center gap-3">
                  <Badge
                    variant={
                      system.highestRisk === "high" || system.highestRisk === "unacceptable"
                        ? "destructive"
                        : "secondary"
                    }
                  >
                    {system.highestRisk}
                  </Badge>
                  <div>
                    <p className="font-medium">{system.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Brukes i {system.processes.length} prosess{system.processes.length !== 1 ? "er" : ""}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddSystem(system)}
                  disabled={createSystem.isPending}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Legg til
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
