import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Shield, 
  Info,
  Filter,
  Loader2,
  Sparkles,
  Brain,
} from "lucide-react";
import { RiskMatrixVisual, getRiskLevelLabel, getRiskLevelColor } from "../RiskMatrixVisual";
import { EditRiskScenarioDialog } from "@/components/dialogs/EditRiskScenarioDialog";
import { RiskReductionSuccessDialog } from "@/components/dialogs/RiskReductionSuccessDialog";
import { toast } from "sonner";

interface ProcessRiskTabProps {
  processId: string;
}

interface RiskScenario {
  id: string;
  process_id: string;
  title: string;
  description: string | null;
  frameworks: string[];
  likelihood: string;
  consequence: string;
  risk_level: string;
  mitigation: string | null;
  mitigation_owner: string | null;
  mitigation_status: string;
  previous_risk_level: string | null;
  risk_reduced_at: string | null;
  created_at: string;
  updated_at: string;
}

// Fallback mock data for initial display
const MOCK_SCENARIO: RiskScenario = {
  id: "mock-1",
  process_id: "",
  title: "Personopplysninger og sensitiv informasjon i applikasjonslogger bryter GDPR",
  description: "Logger fra produktet inneholder personopplysninger (bruker-ID, e-post, IP, fritekst) uten dataminimering, sletting og tilgangskontroll, som medfører brudd på personvernregler ved deling eller lang lagring.",
  frameworks: ["GDPR", "ISO27001", "ISO27005", "NIS2"],
  likelihood: "medium",
  consequence: "critical",
  risk_level: "critical",
  mitigation: "Logghygiene: dataminimering, pseudonymisering og slettepolicy",
  mitigation_owner: "compliance-ansvarlig",
  mitigation_status: "not_started",
  previous_risk_level: null,
  risk_reduced_at: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const ProcessRiskTab = ({ processId }: ProcessRiskTabProps) => {
  const [viewMode, setViewMode] = useState("simple");
  const [frameworkFilter, setFrameworkFilter] = useState<string>("all");
  const [editingScenario, setEditingScenario] = useState<RiskScenario | null>(null);
  const [isGeneratingJustification, setIsGeneratingJustification] = useState(false);
  const [successDialog, setSuccessDialog] = useState<{
    open: boolean;
    previousLevel: string;
    newLevel: string;
    mitigation: string | null;
    frameworks: string[];
  }>({
    open: false,
    previousLevel: "",
    newLevel: "",
    mitigation: null,
    frameworks: [],
  });

  const queryClient = useQueryClient();

  // Fetch AI usage data for risk classification
  const { data: aiUsage } = useQuery({
    queryKey: ["process-ai-usage-risk", processId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("process_ai_usage")
        .select("risk_category, risk_justification, ai_features, has_ai")
        .eq("process_id", processId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  // Fetch process info for Lara prompt
  const { data: processInfo } = useQuery({
    queryKey: ["process-info-risk", processId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("system_processes")
        .select("name, description")
        .eq("id", processId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const RISK_LABELS: Record<string, string> = {
    unacceptable: "Uakseptabel risiko",
    high: "Høy risiko",
    limited: "Begrenset risiko",
    minimal: "Minimal risiko",
  };

  const generateRiskJustification = async () => {
    if (!aiUsage?.risk_category) {
      toast.error("Ingen AI-risikoklassifisering funnet");
      return;
    }
    setIsGeneratingJustification(true);
    try {
      const features = Array.isArray(aiUsage.ai_features) ? aiUsage.ai_features : [];
      const riskLabel = RISK_LABELS[aiUsage.risk_category] || aiUsage.risk_category;

      const { data, error } = await supabase.functions.invoke('chat', {
        body: {
          messages: [{
            role: "user",
            content: `Du er en compliance-rådgiver som hjelper med EU AI Act dokumentasjon. Skriv en kort og presis begrunnelse (2-4 setninger) for hvorfor AI-bruken i prosessen "${processInfo?.name || 'denne prosessen'}" er klassifisert som "${riskLabel}" risikonivå under EU AI Act.

Kontekst:
- Prosess: ${processInfo?.name || 'Ukjent'}${processInfo?.description ? ` - ${processInfo.description}` : ''}
- AI-funksjoner i bruk: ${features.length > 0 ? features.join(', ') : 'Ikke spesifisert'}
- Valgt risikonivå: ${riskLabel}

Skriv begrunnelsen på norsk. Vær konkret og referer til relevante artikler i AI Act der det er naturlig.`
          }]
        }
      });

      if (error) throw error;

      let justification = '';
      if (typeof data === 'string') {
        const lines = data.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ') && line.slice(6).trim() !== '[DONE]') {
            try {
              const parsed = JSON.parse(line.slice(6));
              const content = parsed.choices?.[0]?.delta?.content || parsed.choices?.[0]?.message?.content;
              if (content) justification += content;
            } catch { /* skip */ }
          }
        }
        justification = justification || data;
      } else if (data?.choices?.[0]?.message?.content) {
        justification = data.choices[0].message.content;
      }

      // Save to database
      await supabase
        .from("process_ai_usage")
        .update({ risk_justification: justification })
        .eq("process_id", processId);

      queryClient.invalidateQueries({ queryKey: ["process-ai-usage-risk", processId] });
      toast.success("Lara har foreslått en begrunnelse");
    } catch (e) {
      console.error("Failed to generate justification:", e);
      toast.error("Kunne ikke generere forslag. Prøv igjen.");
    } finally {
      setIsGeneratingJustification(false);
    }
  };

  // Fetch scenarios from database
  const { data: scenarios = [], isLoading } = useQuery({
    queryKey: ["process-risk-scenarios", processId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("process_risk_scenarios")
        .select("*")
        .eq("process_id", processId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching risk scenarios:", error);
        return [];
      }
      return data as RiskScenario[];
    },
  });

  // Use mock data if no scenarios exist
  const displayScenarios = scenarios.length > 0 
    ? scenarios 
    : [{ ...MOCK_SCENARIO, process_id: processId }];

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (scenario: Partial<RiskScenario> & { id: string }) => {
      // If it's a mock scenario, create it instead
      if (scenario.id.startsWith("mock-")) {
        const { id, ...data } = scenario;
        const insertData = {
          process_id: processId,
          title: data.title || "Nytt scenario",
          description: data.description,
          frameworks: data.frameworks,
          likelihood: data.likelihood,
          consequence: data.consequence,
          risk_level: data.risk_level,
          mitigation: data.mitigation,
          mitigation_owner: data.mitigation_owner,
          mitigation_status: data.mitigation_status,
          previous_risk_level: data.previous_risk_level,
        };
        const { error } = await supabase
          .from("process_risk_scenarios")
          .insert(insertData);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("process_risk_scenarios")
          .update(scenario)
          .eq("id", scenario.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["process-risk-scenarios", processId] });
      toast.success("Risikoscenario oppdatert");
    },
    onError: (error) => {
      console.error("Error updating scenario:", error);
      toast.error("Kunne ikke oppdatere risikoscenario");
    },
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("process_risk_scenarios")
        .insert({
          process_id: processId,
          title: "Nytt risikoscenario",
          likelihood: "medium",
          consequence: "medium",
          risk_level: "medium",
          frameworks: [],
          mitigation_status: "not_started",
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["process-risk-scenarios", processId] });
      toast.success("Risikoscenario opprettet");
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (id.startsWith("mock-")) return; // Can't delete mock
      const { error } = await supabase
        .from("process_risk_scenarios")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["process-risk-scenarios", processId] });
      toast.success("Risikoscenario slettet");
    },
  });

  const handleRiskReduced = (previousLevel: string, newLevel: string, scenario: RiskScenario) => {
    setSuccessDialog({
      open: true,
      previousLevel,
      newLevel,
      mitigation: scenario.mitigation,
      frameworks: scenario.frameworks,
    });
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
      case "completed": return "text-status-closed";
      case "in_progress": return "text-warning";
      default: return "text-muted-foreground";
    }
  };

  // Calculate risk summary
  const riskSummary = displayScenarios.reduce(
    (acc, s) => {
      acc[s.risk_level] = (acc[s.risk_level] || 0) + 1;
      return acc;
    },
    { critical: 0, high: 0, medium: 0, acceptable: 0, low: 0 } as Record<string, number>
  );

  // Filter scenarios
  const filteredScenarios = frameworkFilter === "all"
    ? displayScenarios
    : displayScenarios.filter((s) => 
        s.frameworks.some((f) => f.toLowerCase() === frameworkFilter.toLowerCase())
      );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

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
          <Button onClick={() => createMutation.mutate()}>
            <Plus className="h-4 w-4 mr-2" />
            Legg til scenario
          </Button>
        </div>
      </div>

      {/* AI Risk Classification */}
      {(aiUsage?.has_ai || aiUsage?.risk_category) && (
        <Card className="border border-border">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-primary" />
                <Label className="text-sm font-medium">AI-risikoklassifisering</Label>
                {aiUsage.risk_category && (
                  <Badge variant="outline" className="text-xs">
                    {RISK_LABELS[aiUsage.risk_category] || aiUsage.risk_category}
                  </Badge>
                )}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={generateRiskJustification}
                disabled={isGeneratingJustification || !aiUsage.risk_category}
                className="gap-1.5 text-xs h-7"
              >
                <Sparkles className={`h-3.5 w-3.5 ${isGeneratingJustification ? 'animate-spin' : ''}`} />
                {isGeneratingJustification ? 'Genererer...' : 'Foreslå med Lara'}
              </Button>
            </div>
            {aiUsage.risk_justification ? (
              <p className="text-sm text-muted-foreground leading-relaxed">
                {aiUsage.risk_justification}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                Ingen begrunnelse lagt til ennå. Klikk «Foreslå med Lara» for å generere en.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Risk Summary */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Kritisk</span>
              <Badge className="bg-destructive/10 text-destructive hover:bg-destructive/10">
                {riskSummary.critical}
              </Badge>
            </div>
            <div className="mt-1 h-1 bg-destructive/20 rounded" />
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Høy</span>
              <Badge className="bg-warning/10 text-warning hover:bg-warning/10">
                {riskSummary.high}
              </Badge>
            </div>
            <div className="mt-1 h-1 bg-warning/20 rounded" />
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-yellow-500">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Moderat</span>
              <Badge className="bg-warning/10 text-warning hover:bg-warning/10">
                {riskSummary.medium}
              </Badge>
            </div>
            <div className="mt-1 h-1 bg-warning/20 rounded" />
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Akseptabel</span>
              <Badge className="bg-status-closed/10 text-status-closed hover:bg-status-closed/10">
                {(riskSummary.acceptable || 0) + (riskSummary.low || 0)}
              </Badge>
            </div>
            <div className="mt-1 h-1 bg-status-closed/20 rounded" />
          </CardContent>
        </Card>
      </div>

      {/* Warning Alert */}
      <Alert className="bg-warning/10 border-warning/20">
        <Info className="h-4 w-4 text-warning" />
        <AlertDescription className="text-warning">
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
        {filteredScenarios.map((scenario) => (
          <Card key={scenario.id} className="border">
            <CardContent className="p-4 space-y-4">
              {/* Scenario Header */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    <Shield className={`h-5 w-5 ${
                      scenario.risk_level === "critical" ? "text-destructive" :
                      scenario.risk_level === "high" ? "text-warning" :
                      scenario.risk_level === "medium" ? "text-warning" :
                      "text-status-closed"
                    }`} />
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
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={() => setEditingScenario(scenario)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => deleteMutation.mutate(scenario.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Analysis Section with Visual Matrix */}
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
                    <Badge className={getRiskLevelColor(scenario.risk_level)}>
                      {getRiskLevelLabel(scenario.risk_level)}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-4">
                    Plasserer risiko i et rutenett etter sannsynlighet og konsekvens. Rask måte å prioritere hva som må håndteres først.
                  </p>

                  {/* Visual Risk Matrix */}
                  <div className="flex justify-center py-2">
                    <RiskMatrixVisual
                      likelihood={scenario.likelihood}
                      consequence={scenario.consequence}
                      size="sm"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Mitigation Section */}
              <div className="grid grid-cols-3 gap-4 pt-2 border-t">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Tiltak:</p>
                  <p className="text-sm">{scenario.mitigation || "Ikke definert"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Tiltaksansvarlig:</p>
                  <p className="text-sm">{scenario.mitigation_owner || "Ikke tildelt"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Status på tiltak:</p>
                  <p className={`text-sm flex items-center gap-1.5 ${getStatusColor(scenario.mitigation_status)}`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                    {getStatusLabel(scenario.mitigation_status)}
                  </p>
                </div>
              </div>

              {/* Edit button at bottom */}
              <div className="pt-2 border-t">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => setEditingScenario(scenario)}
                >
                  <Edit2 className="h-4 w-4 mr-2" />
                  Endre risikoscenario
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Dialog */}
      <EditRiskScenarioDialog
        open={!!editingScenario}
        onOpenChange={(open) => !open && setEditingScenario(null)}
        scenario={editingScenario}
        onSave={(updated) => updateMutation.mutate(updated)}
        onRiskReduced={handleRiskReduced}
      />

      {/* Success Dialog */}
      <RiskReductionSuccessDialog
        open={successDialog.open}
        onOpenChange={(open) => setSuccessDialog((prev) => ({ ...prev, open }))}
        previousLevel={successDialog.previousLevel}
        newLevel={successDialog.newLevel}
        mitigation={successDialog.mitigation}
        frameworks={successDialog.frameworks}
      />
    </div>
  );
};
