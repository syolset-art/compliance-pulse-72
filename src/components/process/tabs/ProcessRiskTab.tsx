import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Shield, 
  AlertTriangle,
  Info,
  Filter,
} from "lucide-react";

interface ProcessRiskTabProps {
  processId: string;
}

// Mock risk scenarios
const RISK_SCENARIOS = [
  {
    id: "1",
    title: "Personopplysninger og sensitiv informasjon i applikasjonslogger bryter GDPR",
    description: "Logger fra produktet inneholder personopplysninger (bruker-ID, e-post, IP, fritekst) uten dataminimering, sletting og tilgangskontroll, som medfører brudd på personvernregler ved deling eller lang lagring.",
    frameworks: ["GDPR", "ISO27001", "ISO27005", "NIS2"],
    likelihood: "medium",
    consequence: "critical",
    riskLevel: "critical",
    mitigation: "Logghygiene: dataminimering, pseudonymisering og slettepolicy",
    mitigationOwner: "compliance-ansvarlig",
    mitigationStatus: "not_started",
  },
];

const RISK_SUMMARY = {
  critical: 1,
  high: 1,
  medium: 1,
  acceptable: 0,
};

export const ProcessRiskTab = ({ processId }: ProcessRiskTabProps) => {
  const [viewMode, setViewMode] = useState("simple");
  const [frameworkFilter, setFrameworkFilter] = useState<string>("all");

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case "critical": return "bg-red-100 text-red-700 border-red-300";
      case "high": return "bg-orange-100 text-orange-700 border-orange-300";
      case "medium": return "bg-yellow-100 text-yellow-700 border-yellow-300";
      case "low": 
      case "acceptable": return "bg-green-100 text-green-700 border-green-300";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getRiskLevelLabel = (level: string) => {
    switch (level) {
      case "critical": return "KRITISK";
      case "high": return "HØY";
      case "medium": return "MODERAT";
      case "low": 
      case "acceptable": return "AKSEPTABEL";
      default: return level.toUpperCase();
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "completed": return "Håndtert";
      case "in_progress": return "Under arbeid";
      case "not_started": return "Ikke håndtert";
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "text-green-600";
      case "in_progress": return "text-yellow-600";
      default: return "text-muted-foreground";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold">Risikovurdering</h3>
          <p className="text-sm text-muted-foreground">
            Risikoscenarioer og tiltak for prosessen
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={viewMode} onValueChange={setViewMode}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Visning" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="simple">Enkel matrise</SelectItem>
              <SelectItem value="detailed">Detaljert</SelectItem>
            </SelectContent>
          </Select>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Legg til scenario
          </Button>
        </div>
      </div>

      {/* Risk Summary */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Kritisk</span>
              <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
                {RISK_SUMMARY.critical}
              </Badge>
            </div>
            <div className="mt-1 h-1 bg-red-200 rounded" />
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Høy</span>
              <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">
                {RISK_SUMMARY.high}
              </Badge>
            </div>
            <div className="mt-1 h-1 bg-orange-200 rounded" />
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-yellow-500">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Moderat</span>
              <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">
                {RISK_SUMMARY.medium}
              </Badge>
            </div>
            <div className="mt-1 h-1 bg-yellow-200 rounded" />
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Akseptabel</span>
              <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                {RISK_SUMMARY.acceptable}
              </Badge>
            </div>
            <div className="mt-1 h-1 bg-green-200 rounded" />
          </CardContent>
        </Card>
      </div>

      {/* Warning Alert */}
      <Alert className="bg-yellow-50 border-yellow-200">
        <Info className="h-4 w-4 text-yellow-600" />
        <AlertDescription className="text-yellow-800">
          <strong>Loggfør tiltak og ansvar.</strong> Krav fra ISO 27001 og NIS2 innebærer dokumentasjon på ansvar og implementeringstidspunkt for sikkerhetstiltak.
        </AlertDescription>
      </Alert>

      {/* Framework Filter */}
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Samsvarsfilter:</span>
        <Select value={frameworkFilter} onValueChange={setFrameworkFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Velg rammeverk" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle rammeverk</SelectItem>
            <SelectItem value="gdpr">GDPR</SelectItem>
            <SelectItem value="iso27001">ISO 27001</SelectItem>
            <SelectItem value="nis2">NIS2</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Risk Scenarios */}
      <div className="space-y-4">
        {RISK_SCENARIOS.map((scenario) => (
          <Card key={scenario.id} className="border">
            <CardContent className="p-4 space-y-4">
              {/* Scenario Header */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    <Shield className="h-5 w-5 text-red-500" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">{scenario.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      {scenario.description}
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {scenario.frameworks.map((fw) => (
                        <Badge key={fw} variant="outline" className="text-xs">
                          {fw}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" className="h-8 w-8">
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Analysis Section */}
              <Card className="bg-muted/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Analyse</span>
                      <Badge variant="outline" className="text-xs">
                        Enkel matrise
                      </Badge>
                    </div>
                    <Badge className={getRiskLevelColor(scenario.riskLevel)}>
                      {getRiskLevelLabel(scenario.riskLevel)}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-4">
                    Plasserer risiko i et rutenett etter sannsynlighet og konsekvens. Rask måte å prioritere hva som må håndteres først.
                  </p>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                        Sannsynlighet: <Info className="h-3 w-3" />
                      </p>
                      <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                        MODERAT
                      </Badge>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                        Konsekvens: <Info className="h-3 w-3" />
                      </p>
                      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                        KRITISK
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Mitigation Section */}
              <div className="grid grid-cols-3 gap-4 pt-2 border-t">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Tiltak:</p>
                  <p className="text-sm">{scenario.mitigation}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Tiltaksansvarlig:</p>
                  <p className="text-sm">{scenario.mitigationOwner}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Status på tiltak:</p>
                  <p className={`text-sm flex items-center gap-1.5 ${getStatusColor(scenario.mitigationStatus)}`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                    {getStatusLabel(scenario.mitigationStatus)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
