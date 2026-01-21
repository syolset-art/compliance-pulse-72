import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Bot } from "lucide-react";
import { useCreateAISystem, AI_PROVIDERS } from "@/hooks/useAISystemRegistry";
import { toast } from "sonner";

interface AddAISystemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddAISystemDialog({ open, onOpenChange }: AddAISystemDialogProps) {
  const [name, setName] = useState("");
  const [provider, setProvider] = useState("");
  const [version, setVersion] = useState("");
  const [riskCategory, setRiskCategory] = useState("not_assessed");
  const [automationLevel, setAutomationLevel] = useState("advisory");
  const [usageFrequency, setUsageFrequency] = useState("");
  const [estimatedDecisions, setEstimatedDecisions] = useState("");
  const [estimatedAffected, setEstimatedAffected] = useState("");

  const createSystem = useCreateAISystem();

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error("Navn er påkrevd");
      return;
    }

    try {
      await createSystem.mutateAsync({
        name: name.trim(),
        provider: provider || undefined,
        version: version || undefined,
        risk_category: riskCategory,
        automation_level: automationLevel,
        usage_frequency: usageFrequency || undefined,
        decisions_per_month: estimatedDecisions ? parseInt(estimatedDecisions) : undefined,
        estimated_affected_persons: estimatedAffected ? parseInt(estimatedAffected) : undefined,
      });

      toast.success("AI-system lagt til");
      onOpenChange(false);
      resetForm();
    } catch (error) {
      toast.error("Kunne ikke legge til AI-system");
    }
  };

  const resetForm = () => {
    setName("");
    setProvider("");
    setVersion("");
    setRiskCategory("not_assessed");
    setAutomationLevel("advisory");
    setUsageFrequency("");
    setEstimatedDecisions("");
    setEstimatedAffected("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Legg til AI-system
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="name">Navn på AI-system *</Label>
              <Input
                id="name"
                placeholder="f.eks. ChatGPT, Microsoft Copilot"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="provider">Leverandør</Label>
              <Select value={provider} onValueChange={setProvider}>
                <SelectTrigger>
                  <SelectValue placeholder="Velg leverandør" />
                </SelectTrigger>
                <SelectContent>
                  {AI_PROVIDERS.map((p) => (
                    <SelectItem key={p.name} value={p.name}>
                      {p.name}
                    </SelectItem>
                  ))}
                  <SelectItem value="other">Annen</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="version">Versjon</Label>
              <Input
                id="version"
                placeholder="f.eks. GPT-4, Enterprise"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="risk">Risikoklassifisering</Label>
              <Select value={riskCategory} onValueChange={setRiskCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="not_assessed">Ikke vurdert</SelectItem>
                  <SelectItem value="minimal">Minimal risiko</SelectItem>
                  <SelectItem value="limited">Begrenset risiko</SelectItem>
                  <SelectItem value="high">Høyrisiko</SelectItem>
                  <SelectItem value="unacceptable">Uakseptabel</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="automation">Automatiseringsnivå</Label>
              <Select value={automationLevel} onValueChange={setAutomationLevel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="advisory">Rådgivende</SelectItem>
                  <SelectItem value="human_in_loop">Menneske i løkken</SelectItem>
                  <SelectItem value="fully_automated">Helautomatisert</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="frequency">Bruksfrekvens</Label>
              <Select value={usageFrequency} onValueChange={setUsageFrequency}>
                <SelectTrigger>
                  <SelectValue placeholder="Velg frekvens" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daglig</SelectItem>
                  <SelectItem value="weekly">Ukentlig</SelectItem>
                  <SelectItem value="monthly">Månedlig</SelectItem>
                  <SelectItem value="rarely">Sjelden</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="decisions">Est. beslutninger/mnd</Label>
              <Input
                id="decisions"
                type="number"
                placeholder="0"
                value={estimatedDecisions}
                onChange={(e) => setEstimatedDecisions(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="affected">Est. berørte personer/mnd</Label>
              <Input
                id="affected"
                type="number"
                placeholder="0"
                value={estimatedAffected}
                onChange={(e) => setEstimatedAffected(e.target.value)}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Avbryt
          </Button>
          <Button onClick={handleSubmit} disabled={createSystem.isPending}>
            {createSystem.isPending ? "Lagrer..." : "Legg til"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
