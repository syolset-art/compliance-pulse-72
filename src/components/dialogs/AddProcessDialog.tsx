import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  Bot, 
  Sparkles, 
  Plus, 
  Loader2, 
  Workflow,
  CheckCircle2,
  AlertCircle
} from "lucide-react";

interface ProcessSuggestion {
  name: string;
  description: string;
  likely_has_ai: boolean;
  ai_use_description?: string;
  related_systems: string[];
  data_types?: string[];
  priority: "high" | "medium" | "low";
  reason: string;
}

interface AddProcessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workAreaId: string;
  workAreaName: string;
  onProcessAdded?: () => void;
}

export function AddProcessDialog({
  open,
  onOpenChange,
  workAreaId,
  workAreaName,
  onProcessAdded,
}: AddProcessDialogProps) {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [mode, setMode] = useState<"manual" | "ai">("ai");
  const [manualName, setManualName] = useState("");
  const [manualDescription, setManualDescription] = useState("");
  const [selectedSystemId, setSelectedSystemId] = useState<string>("");
  const [suggestions, setSuggestions] = useState<ProcessSuggestion[]>([]);
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<number>>(new Set());
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  // Fetch systems in work area
  const { data: systems } = useQuery({
    queryKey: ["work-area-systems", workAreaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("systems")
        .select("id, name")
        .eq("work_area_id", workAreaId);
      if (error) throw error;
      return data || [];
    },
    enabled: open,
  });

  const fetchSuggestions = async () => {
    setIsLoadingSuggestions(true);
    setSuggestions([]);
    setSelectedSuggestions(new Set());

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/suggest-processes`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ work_area_id: workAreaId }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 429) {
          toast({
            title: "Forespørselsgrense nådd",
            description: "Vennligst vent litt og prøv igjen.",
            variant: "destructive",
          });
          return;
        }
        if (response.status === 402) {
          toast({
            title: "Kreditt oppbrukt",
            description: "Legg til kreditt for å bruke AI-funksjoner.",
            variant: "destructive",
          });
          return;
        }
        throw new Error(errorData.error || "Failed to fetch suggestions");
      }

      const data = await response.json();
      setSuggestions(data.suggestions || []);
    } catch (error) {
      console.error("Error fetching suggestions:", error);
      toast({
        title: t("common.error"),
        description: "Kunne ikke hente forslag fra AI",
        variant: "destructive",
      });
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const createProcessMutation = useMutation({
    mutationFn: async (processes: { name: string; description: string; system_id: string }[]) => {
      const { error } = await supabase.from("system_processes").insert(processes);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["work-area-processes", workAreaId] });
      toast({
        title: t("common.success"),
        description: "Prosess(er) ble opprettet",
      });
      handleClose();
      onProcessAdded?.();
    },
    onError: (error) => {
      console.error("Error creating process:", error);
      toast({
        title: t("common.error"),
        description: "Kunne ikke opprette prosess",
        variant: "destructive",
      });
    },
  });

  const handleClose = () => {
    setManualName("");
    setManualDescription("");
    setSelectedSystemId("");
    setSuggestions([]);
    setSelectedSuggestions(new Set());
    onOpenChange(false);
  };

  const toggleSuggestion = (index: number) => {
    setSelectedSuggestions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const handleCreateManual = () => {
    if (!manualName.trim() || !selectedSystemId) return;
    createProcessMutation.mutate([
      {
        name: manualName.trim(),
        description: manualDescription.trim(),
        system_id: selectedSystemId,
      },
    ]);
  };

  const handleCreateFromSuggestions = () => {
    if (selectedSuggestions.size === 0 || !selectedSystemId) return;
    
    const processesToCreate = Array.from(selectedSuggestions).map((index) => {
      const suggestion = suggestions[index];
      return {
        name: suggestion.name,
        description: suggestion.description,
        system_id: selectedSystemId,
      };
    });

    createProcessMutation.mutate(processesToCreate);
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return <Badge variant="destructive" className="text-xs">Høy</Badge>;
      case "medium":
        return <Badge variant="secondary" className="text-xs">Medium</Badge>;
      case "low":
        return <Badge variant="outline" className="text-xs">Lav</Badge>;
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Workflow className="h-5 w-5" />
            Legg til prosess - {workAreaName}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={mode} onValueChange={(v) => setMode(v as "manual" | "ai")} className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="ai" className="gap-2">
              <Sparkles className="h-4 w-4" />
              AI-forslag
            </TabsTrigger>
            <TabsTrigger value="manual" className="gap-2">
              <Plus className="h-4 w-4" />
              Manuell
            </TabsTrigger>
          </TabsList>

          {/* System selector - common for both modes */}
          <div className="mt-4 space-y-2">
            <Label>Tilhørende system *</Label>
            <Select value={selectedSystemId} onValueChange={setSelectedSystemId}>
              <SelectTrigger>
                <SelectValue placeholder="Velg system..." />
              </SelectTrigger>
              <SelectContent>
                {systems?.map((system) => (
                  <SelectItem key={system.id} value={system.id}>
                    {system.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {systems?.length === 0 && (
              <p className="text-xs text-muted-foreground">
                Ingen systemer registrert i dette arbeidsområdet. Legg til systemer først.
              </p>
            )}
          </div>

          <TabsContent value="ai" className="mt-4 space-y-4">
            {suggestions.length === 0 && !isLoadingSuggestions && (
              <div className="text-center py-8">
                <Sparkles className="h-12 w-12 text-primary/50 mx-auto mb-4" />
                <h3 className="font-medium mb-2">AI-drevne prosessforslag</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  La Lara analysere arbeidsområdet og foreslå relevante prosesser basert på bransje, systemer og beste praksis.
                </p>
                <Button
                  onClick={fetchSuggestions}
                  disabled={isLoadingSuggestions || !selectedSystemId}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generer forslag
                </Button>
                {!selectedSystemId && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Velg et system først
                  </p>
                )}
              </div>
            )}

            {isLoadingSuggestions && (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
                <p className="text-muted-foreground">Lara analyserer arbeidsområdet...</p>
              </div>
            )}

            {suggestions.length > 0 && (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Velg prosessene du vil opprette ({selectedSuggestions.size} valgt)
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (selectedSuggestions.size === suggestions.length) {
                        setSelectedSuggestions(new Set());
                      } else {
                        setSelectedSuggestions(new Set(suggestions.map((_, i) => i)));
                      }
                    }}
                  >
                    {selectedSuggestions.size === suggestions.length ? "Fjern alle" : "Velg alle"}
                  </Button>
                </div>

                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {suggestions.map((suggestion, index) => (
                    <Card
                      key={index}
                      className={`cursor-pointer transition-colors ${
                        selectedSuggestions.has(index)
                          ? "border-primary bg-primary/5"
                          : "hover:bg-muted/50"
                      }`}
                      onClick={() => toggleSuggestion(index)}
                    >
                      <CardContent className="p-3 sm:p-4">
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={selectedSuggestions.has(index)}
                            className="mt-1"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <span className="font-medium text-sm sm:text-base">{suggestion.name}</span>
                              {getPriorityBadge(suggestion.priority)}
                              {suggestion.likely_has_ai && (
                                <Badge variant="outline" className="text-xs gap-1">
                                  <Bot className="h-3 w-3" />
                                  AI
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs sm:text-sm text-muted-foreground mb-2">
                              {suggestion.description}
                            </p>
                            {suggestion.likely_has_ai && suggestion.ai_use_description && (
                              <p className="text-xs text-primary/80 mb-2">
                                <Bot className="h-3 w-3 inline mr-1" />
                                {suggestion.ai_use_description}
                              </p>
                            )}
                            {suggestion.related_systems.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {suggestion.related_systems.map((sys, i) => (
                                  <Badge key={i} variant="secondary" className="text-xs">
                                    {sys}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={fetchSuggestions}
                    disabled={isLoadingSuggestions}
                    className="flex-1"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Nye forslag
                  </Button>
                  <Button
                    onClick={handleCreateFromSuggestions}
                    disabled={selectedSuggestions.size === 0 || createProcessMutation.isPending}
                    className="flex-1"
                  >
                    {createProcessMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                    )}
                    Opprett valgte ({selectedSuggestions.size})
                  </Button>
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="manual" className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="process-name">Prosessnavn *</Label>
              <Input
                id="process-name"
                value={manualName}
                onChange={(e) => setManualName(e.target.value)}
                placeholder="F.eks. Kunderegistrering"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="process-desc">Beskrivelse</Label>
              <Textarea
                id="process-desc"
                value={manualDescription}
                onChange={(e) => setManualDescription(e.target.value)}
                placeholder="Beskriv prosessen..."
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={handleClose}>
                Avbryt
              </Button>
              <Button
                onClick={handleCreateManual}
                disabled={!manualName.trim() || !selectedSystemId || createProcessMutation.isPending}
              >
                {createProcessMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                Opprett prosess
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
