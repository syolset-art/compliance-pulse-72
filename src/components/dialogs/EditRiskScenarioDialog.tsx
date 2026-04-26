import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { 
  RiskMatrixVisual, 
  calculateRiskLevel, 
  getRiskLevelLabel, 
  getRiskLevelColor 
} from "@/components/process/RiskMatrixVisual";
import { Shield, ArrowRight } from "lucide-react";

interface RiskScenario {
  id: string;
  process_id: string;
  title: string;
  description: string | null;
  frameworks: string[];
  likelihood: string;
  consequence: string;
  risk_reduced_at?: string | null;
  risk_level: string;
  mitigation: string | null;
  mitigation_owner: string | null;
  mitigation_status: string;
  previous_risk_level: string | null;
}

interface EditRiskScenarioDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scenario: RiskScenario | null;
  onSave: (scenario: Partial<RiskScenario> & { id: string }) => void;
  onRiskReduced?: (previousLevel: string, newLevel: string, scenario: RiskScenario) => void;
}

const FRAMEWORK_OPTIONS = ["GDPR", "ISO27001", "ISO27005", "NIS2", "Personopplysningsloven"];

export const EditRiskScenarioDialog = ({
  open,
  onOpenChange,
  scenario,
  onSave,
  onRiskReduced,
}: EditRiskScenarioDialogProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [frameworks, setFrameworks] = useState<string[]>([]);
  const [likelihood, setLikelihood] = useState("medium");
  const [consequence, setConsequence] = useState("medium");
  const [mitigation, setMitigation] = useState("");
  const [mitigationOwner, setMitigationOwner] = useState("");
  const [mitigationStatus, setMitigationStatus] = useState("not_started");
  const [originalRiskLevel, setOriginalRiskLevel] = useState<string | null>(null);

  useEffect(() => {
    if (scenario) {
      setTitle(scenario.title);
      setDescription(scenario.description || "");
      setFrameworks(scenario.frameworks || []);
      setLikelihood(scenario.likelihood);
      setConsequence(scenario.consequence);
      setMitigation(scenario.mitigation || "");
      setMitigationOwner(scenario.mitigation_owner || "");
      setMitigationStatus(scenario.mitigation_status);
      setOriginalRiskLevel(scenario.risk_level);
    }
  }, [scenario]);

  const currentRiskLevel = calculateRiskLevel(likelihood, consequence);
  const riskReduced = originalRiskLevel && 
    getRiskScore(currentRiskLevel) < getRiskScore(originalRiskLevel);

  const handleSave = () => {
    if (!scenario) return;

    const updatedScenario = {
      id: scenario.id,
      title,
      description,
      frameworks,
      likelihood,
      consequence,
      risk_level: currentRiskLevel,
      mitigation,
      mitigation_owner: mitigationOwner,
      mitigation_status: mitigationStatus,
      previous_risk_level: riskReduced ? originalRiskLevel : scenario.previous_risk_level,
      risk_reduced_at: riskReduced ? new Date().toISOString() : scenario.risk_reduced_at,
    };

    onSave(updatedScenario);

    if (riskReduced && originalRiskLevel && onRiskReduced) {
      onRiskReduced(originalRiskLevel, currentRiskLevel, {
        ...scenario,
        ...updatedScenario,
      } as RiskScenario);
    }

    onOpenChange(false);
  };

  const toggleFramework = (fw: string) => {
    setFrameworks((prev) =>
      prev.includes(fw) ? prev.filter((f) => f !== fw) : [...prev, fw]
    );
  };

  // Auto-reduce likelihood when status changes to completed
  const handleStatusChange = (newStatus: string) => {
    setMitigationStatus(newStatus);
    
    if (newStatus === "completed" && scenario) {
      // Suggest reduced likelihood
      const likelihoodOrder = ["critical", "high", "medium", "low"];
      const currentIndex = likelihoodOrder.indexOf(likelihood);
      if (currentIndex > 0 && currentIndex < likelihoodOrder.length - 1) {
        setLikelihood(likelihoodOrder[currentIndex + 1]);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Rediger risikoscenario
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Section A: Scenario Details */}
          <div className="space-y-4">
            <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
              Scenario-detaljer
            </h3>
            
            <div className="space-y-2">
              <Label htmlFor="title">Tittel</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Beskriv risikoscenariet..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Beskrivelse</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detaljert beskrivelse av risikoscenariet..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Relevante rammeverk</Label>
              <div className="flex flex-wrap gap-2">
                {FRAMEWORK_OPTIONS.map((fw) => (
                  <Badge
                    key={fw}
                    variant={frameworks.includes(fw) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleFramework(fw)}
                  >
                    {fw}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <Separator />

          {/* Section B: Risk Analysis */}
          <div className="space-y-4">
            <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
              Risikoanalyse
            </h3>

            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="flex-1">
                <RiskMatrixVisual
                  likelihood={likelihood}
                  consequence={consequence}
                  onSelect={(lik, cons) => {
                    setLikelihood(lik);
                    setConsequence(cons);
                  }}
                  interactive
                  size="md"
                />
              </div>

              <div className="flex flex-col gap-4 min-w-[200px]">
                <div className="p-4 rounded-lg bg-muted/50 space-y-3">
                  <div className="text-sm text-muted-foreground">Beregnet risikonivå:</div>
                  <Badge className={`${getRiskLevelColor(currentRiskLevel)} text-base px-3 py-1`}>
                    {getRiskLevelLabel(currentRiskLevel)}
                  </Badge>

                  {riskReduced && originalRiskLevel && (
                    <div className="flex items-center gap-2 pt-2 border-t">
                      <Badge className={getRiskLevelColor(originalRiskLevel)}>
                        {getRiskLevelLabel(originalRiskLevel)}
                      </Badge>
                      <ArrowRight className="h-4 w-4 text-status-closed" />
                      <Badge className={getRiskLevelColor(currentRiskLevel)}>
                        {getRiskLevelLabel(currentRiskLevel)}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Section C: Mitigation */}
          <div className="space-y-4">
            <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
              Tiltak
            </h3>

            <div className="space-y-2">
              <Label htmlFor="mitigation">Tiltak-beskrivelse</Label>
              <Textarea
                id="mitigation"
                value={mitigation}
                onChange={(e) => setMitigation(e.target.value)}
                placeholder="Beskriv tiltaket som skal redusere risikoen..."
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="owner">Tiltaksansvarlig</Label>
                <Input
                  id="owner"
                  value={mitigationOwner}
                  onChange={(e) => setMitigationOwner(e.target.value)}
                  placeholder="Navn eller rolle..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status på tiltak</Label>
                <Select value={mitigationStatus} onValueChange={handleStatusChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Velg status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not_started">Ikke håndtert</SelectItem>
                    <SelectItem value="in_progress">Under arbeid</SelectItem>
                    <SelectItem value="completed">Håndtert</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Avbryt
          </Button>
          <Button onClick={handleSave}>
            Lagre endringer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Helper to compare risk levels
function getRiskScore(level: string): number {
  const scores: Record<string, number> = {
    acceptable: 1,
    low: 2,
    medium: 3,
    high: 4,
    critical: 5,
  };
  return scores[level] || 3;
}
