import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Shield, Edit2 } from "lucide-react";

interface ProcessCriticalityTabProps {
  processId: string;
}

// Criticality dimensions based on CIA triad
const CRITICALITY_DIMENSIONS = [
  {
    id: "confidentiality",
    title: "Hvis opplysninger kommer på avveie",
    subtitle: "Konfidensialitet",
    level: "medium" as const,
    progress: 60,
  },
  {
    id: "integrity",
    title: "Hvis innhold blir feil/ødelagt",
    subtitle: "Integritet",
    level: "high" as const,
    progress: 85,
  },
  {
    id: "availability",
    title: "Hvis systemet er nede",
    subtitle: "Tilgjengelighet",
    level: "high" as const,
    progress: 90,
  },
];

export const ProcessCriticalityTab = ({ processId }: ProcessCriticalityTabProps) => {
  const [isEditing, setIsEditing] = useState(false);

  const getLevelLabel = (level: string) => {
    switch (level) {
      case "high": return "Høy";
      case "medium": return "Moderat";
      case "low": return "Lav";
      default: return "Ikke vurdert";
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case "high": return "bg-red-100 text-red-700 border-red-200";
      case "medium": return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "low": return "bg-green-100 text-green-700 border-green-200";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getProgressColors = (level: string) => {
    // Create a gradient from green to yellow to orange to red
    switch (level) {
      case "high": return "bg-gradient-to-r from-green-500 via-yellow-500 via-orange-500 to-red-500";
      case "medium": return "bg-gradient-to-r from-green-500 via-yellow-500 to-orange-400";
      case "low": return "bg-gradient-to-r from-green-500 to-yellow-400";
      default: return "bg-muted";
    }
  };

  // Calculate overall criticality
  const overallLevel = CRITICALITY_DIMENSIONS.some(d => d.level === "high") 
    ? "high" 
    : CRITICALITY_DIMENSIONS.some(d => d.level === "medium") 
      ? "medium" 
      : "low";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Hvor kritisk er det hvis ...</h3>
          <p className="text-sm text-muted-foreground">
            Lara foreslår kritikalitet.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
          <Edit2 className="h-4 w-4 mr-1" />
          Rediger
        </Button>
      </div>

      {/* Criticality Cards */}
      <div className="space-y-4">
        {CRITICALITY_DIMENSIONS.map((dimension) => (
          <Card key={dimension.id} className="border">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <h4 className="font-medium">{dimension.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      {dimension.subtitle}
                    </p>
                  </div>
                </div>
                <Badge 
                  variant="outline" 
                  className={getLevelColor(dimension.level)}
                >
                  {getLevelLabel(dimension.level)}
                </Badge>
              </div>
              
              {/* Gradient Progress Bar */}
              <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full ${getProgressColors(dimension.level)}`}
                  style={{ width: `${dimension.progress}%` }}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Overall Assessment */}
      <Card className="bg-muted/50">
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">
              Beregnet total kritikalitet for prosessen
            </span>
          </div>
          <div className="mt-2">
            <Badge 
              variant="outline" 
              className={getLevelColor(overallLevel)}
            >
              <Shield className="h-3 w-3 mr-1" />
              {getLevelLabel(overallLevel)}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
