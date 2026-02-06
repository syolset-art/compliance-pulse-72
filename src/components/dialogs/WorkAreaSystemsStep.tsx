import { useState, useEffect } from "react";
import { Loader2, Sparkles, Check, Server, Brain, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface AssetSuggestion {
  name: string;
  description: string | null;
  vendor: string | null;
  has_ai: boolean;
  reason: string;
  source: "template" | "ai_suggestion" | "manual";
}

interface WorkAreaSystemsStepProps {
  workAreaName: string;
  workAreaDescription: string;
  selectedSystems: AssetSuggestion[];
  onSystemsChange: (systems: AssetSuggestion[]) => void;
}

export function WorkAreaSystemsStep({
  workAreaName,
  workAreaDescription,
  selectedSystems,
  onSystemsChange,
}: WorkAreaSystemsStepProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [templateAssets, setTemplateAssets] = useState<AssetSuggestion[]>([]);
  const [aiSuggestions, setAiSuggestions] = useState<AssetSuggestion[]>([]);
  const [manualInput, setManualInput] = useState("");
  const [showManualInput, setShowManualInput] = useState(false);

  useEffect(() => {
    fetchSuggestions();
  }, [workAreaName]);

  const fetchSuggestions = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("suggest-work-area-assets", {
        body: { 
          work_area_name: workAreaName,
          work_area_description: workAreaDescription 
        },
      });

      if (error) throw error;

      setTemplateAssets(data.template_assets || []);
      setAiSuggestions(data.ai_suggestions || []);

      // Auto-select template assets
      const autoSelected = (data.template_assets || []).slice(0, 2);
      onSystemsChange(autoSelected);
    } catch (error) {
      console.error("Error fetching suggestions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSystem = (system: AssetSuggestion) => {
    const isSelected = selectedSystems.some(s => s.name === system.name);
    if (isSelected) {
      onSystemsChange(selectedSystems.filter(s => s.name !== system.name));
    } else {
      onSystemsChange([...selectedSystems, system]);
    }
  };

  const addManualSystem = () => {
    if (!manualInput.trim()) return;
    
    const newSystem: AssetSuggestion = {
      name: manualInput.trim(),
      description: null,
      vendor: null,
      has_ai: false,
      reason: "Manuelt lagt til",
      source: "manual",
    };
    
    onSystemsChange([...selectedSystems, newSystem]);
    setManualInput("");
    setShowManualInput(false);
  };

  const isSelected = (system: AssetSuggestion) => 
    selectedSystems.some(s => s.name === system.name);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-8 space-y-3">
        <div className="relative">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <Sparkles className="h-4 w-4 text-primary absolute -top-1 -right-1" />
        </div>
        <p className="text-sm text-muted-foreground">Lara foreslår systemer...</p>
      </div>
    );
  }

  const allSuggestions = [...templateAssets, ...aiSuggestions];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Sparkles className="h-4 w-4 text-primary" />
        <span>Foreslåtte systemer for {workAreaName}</span>
      </div>

      {allSuggestions.length === 0 ? (
        <div className="text-center py-6 border border-dashed rounded-lg">
          <Server className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">Ingen forslag tilgjengelig</p>
          <Button
            variant="link"
            size="sm"
            onClick={() => setShowManualInput(true)}
            className="mt-2"
          >
            Legg til manuelt
          </Button>
        </div>
      ) : (
        <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
          {/* Template assets */}
          {templateAssets.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Fra maler
              </p>
              {templateAssets.map((system, idx) => (
                <SystemCard
                  key={`template-${idx}`}
                  system={system}
                  isSelected={isSelected(system)}
                  onToggle={() => toggleSystem(system)}
                />
              ))}
            </div>
          )}

          {/* AI suggestions */}
          {aiSuggestions.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                <Brain className="h-3 w-3" />
                AI-forslag
              </p>
              {aiSuggestions.map((system, idx) => (
                <SystemCard
                  key={`ai-${idx}`}
                  system={system}
                  isSelected={isSelected(system)}
                  onToggle={() => toggleSystem(system)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Manual input */}
      {showManualInput ? (
        <div className="flex gap-2">
          <Input
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            placeholder="Navn på system..."
            onKeyDown={(e) => e.key === "Enter" && addManualSystem()}
            autoFocus
          />
          <Button size="sm" onClick={addManualSystem} disabled={!manualInput.trim()}>
            Legg til
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setShowManualInput(false)}>
            Avbryt
          </Button>
        </div>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowManualInput(true)}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Legg til annet system
        </Button>
      )}

      {/* Selected count */}
      {selectedSystems.length > 0 && (
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <span className="text-sm text-muted-foreground">
            {selectedSystems.length} system{selectedSystems.length !== 1 ? "er" : ""} valgt
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSystemsChange([])}
            className="text-muted-foreground hover:text-foreground"
          >
            Fjern alle
          </Button>
        </div>
      )}
    </div>
  );
}

function SystemCard({
  system,
  isSelected,
  onToggle,
}: {
  system: AssetSuggestion;
  isSelected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        "w-full flex items-start gap-3 p-3 rounded-lg border text-left transition-all",
        isSelected
          ? "border-primary bg-primary/10"
          : "border-border hover:border-primary/50 bg-card"
      )}
    >
      <div
        className={cn(
          "h-5 w-5 rounded border flex items-center justify-center shrink-0 mt-0.5",
          isSelected
            ? "bg-primary border-primary text-primary-foreground"
            : "border-muted-foreground/30"
        )}
      >
        {isSelected && <Check className="h-3 w-3" />}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-sm text-foreground">{system.name}</span>
          {system.has_ai && (
            <Badge variant="secondary" className="text-xs px-1.5 py-0">
              <Brain className="h-3 w-3 mr-1" />
              AI
            </Badge>
          )}
          {system.source === "template" && (
            <Badge variant="outline" className="text-xs px-1.5 py-0">
              Mal
            </Badge>
          )}
          {system.vendor && (
            <span className="text-xs text-muted-foreground">{system.vendor}</span>
          )}
        </div>
        {system.description && (
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
            {system.description}
          </p>
        )}
      </div>
    </button>
  );
}
