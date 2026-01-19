import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Edit2, Check, X, Bot, ChevronDown, ChevronUp, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ProcessSuggestion {
  name: string;
  description: string;
  likely_has_ai: boolean;
  ai_use_description?: string;
  related_systems: string[];
  data_types?: string[];
  priority: "high" | "medium" | "low";
  reason: string;
}

interface ProcessSuggestionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  suggestions: ProcessSuggestion[];
  availableSystems: { id: string; name: string }[];
  onCreateProcesses: (selected: ProcessSuggestion[]) => void;
  onRejectAll: () => void;
  isCreating?: boolean;
}

interface EditableSuggestion extends ProcessSuggestion {
  isEditing?: boolean;
  isExpanded?: boolean;
  editedName?: string;
  editedDescription?: string;
}

export const ProcessSuggestionsDialog = ({
  open,
  onOpenChange,
  suggestions,
  availableSystems,
  onCreateProcesses,
  onRejectAll,
  isCreating = false,
}: ProcessSuggestionsDialogProps) => {
  const [editableSuggestions, setEditableSuggestions] = useState<EditableSuggestion[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());

  // Update editableSuggestions when suggestions prop changes
  useEffect(() => {
    setEditableSuggestions(
      suggestions.map((s) => ({ 
        ...s, 
        isEditing: false, 
        isExpanded: false,
        editedName: s.name, 
        editedDescription: s.description 
      }))
    );
    setSelectedIndices(new Set());
  }, [suggestions]);

  const toggleSelection = (index: number) => {
    const newSelection = new Set(selectedIndices);
    if (newSelection.has(index)) {
      newSelection.delete(index);
    } else {
      newSelection.add(index);
    }
    setSelectedIndices(newSelection);
  };

  const toggleEdit = (index: number) => {
    setEditableSuggestions((prev) =>
      prev.map((s, i) =>
        i === index
          ? { ...s, isEditing: !s.isEditing }
          : s
      )
    );
  };

  const toggleExpand = (index: number) => {
    setEditableSuggestions((prev) =>
      prev.map((s, i) =>
        i === index
          ? { ...s, isExpanded: !s.isExpanded }
          : s
      )
    );
  };

  const saveEdit = (index: number) => {
    setEditableSuggestions((prev) =>
      prev.map((s, i) =>
        i === index
          ? { ...s, name: s.editedName || s.name, description: s.editedDescription || s.description, isEditing: false }
          : s
      )
    );
  };

  const cancelEdit = (index: number) => {
    setEditableSuggestions((prev) =>
      prev.map((s, i) =>
        i === index
          ? { ...s, editedName: s.name, editedDescription: s.description, isEditing: false }
          : s
      )
    );
  };

  const updateEditField = (index: number, field: "editedName" | "editedDescription", value: string) => {
    setEditableSuggestions((prev) =>
      prev.map((s, i) =>
        i === index ? { ...s, [field]: value } : s
      )
    );
  };

  const handleCreate = () => {
    const selected = Array.from(selectedIndices).map((i) => ({
      ...editableSuggestions[i],
      name: editableSuggestions[i].editedName || editableSuggestions[i].name,
      description: editableSuggestions[i].editedDescription || editableSuggestions[i].description,
    }));
    onCreateProcesses(selected);
  };

  const handleRejectAll = () => {
    onRejectAll();
    onOpenChange(false);
  };

  const selectAll = () => {
    setSelectedIndices(new Set(editableSuggestions.map((_, i) => i)));
  };

  const deselectAll = () => {
    setSelectedIndices(new Set());
  };

  const selectedCount = selectedIndices.size;
  const aiProcessCount = editableSuggestions.filter(s => s.likely_has_ai).length;
  const selectedAICount = Array.from(selectedIndices).filter(i => editableSuggestions[i]?.likely_has_ai).length;

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return <Badge variant="destructive" className="text-xs">Høy prioritet</Badge>;
      case "medium":
        return <Badge variant="secondary" className="text-xs">Medium</Badge>;
      case "low":
        return <Badge variant="outline" className="text-xs">Lav</Badge>;
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Prosessforslag fra Lara Soft
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Velg hvilke prosesser du vil opprette. Prosesser med AI-bruk vil automatisk få registrert AI-informasjon.
          </p>
        </DialogHeader>

        {/* Quick stats */}
        <div className="flex items-center gap-4 py-2 px-1 border-b">
          <div className="text-sm">
            <span className="font-medium">{editableSuggestions.length}</span> forslag
          </div>
          {aiProcessCount > 0 && (
            <div className="flex items-center gap-1.5 text-sm text-amber-600 dark:text-amber-500">
              <Bot className="h-4 w-4" />
              <span className="font-medium">{aiProcessCount}</span> med AI-bruk
            </div>
          )}
          <div className="ml-auto flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={selectAll} className="text-xs h-7">
              Velg alle
            </Button>
            <Button variant="ghost" size="sm" onClick={deselectAll} className="text-xs h-7">
              Fjern valg
            </Button>
          </div>
        </div>

        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-3 py-2">
            {editableSuggestions.map((suggestion, index) => (
              <div
                key={index}
                className={cn(
                  "border rounded-lg p-4 transition-colors",
                  selectedIndices.has(index) ? "border-primary bg-primary/5" : "border-border",
                  suggestion.likely_has_ai && "ring-1 ring-amber-200 dark:ring-amber-800"
                )}
              >
                {suggestion.isEditing ? (
                  <div className="space-y-3">
                    <Input
                      value={suggestion.editedName}
                      onChange={(e) => updateEditField(index, "editedName", e.target.value)}
                      placeholder="Prosessnavn"
                      className="font-medium"
                    />
                    <Textarea
                      value={suggestion.editedDescription}
                      onChange={(e) => updateEditField(index, "editedDescription", e.target.value)}
                      placeholder="Beskrivelse"
                      rows={3}
                    />
                    <div className="flex items-center gap-2">
                      <Button size="sm" onClick={() => saveEdit(index)}>
                        <Check className="h-4 w-4 mr-1" />
                        Lagre
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => cancelEdit(index)}>
                        <X className="h-4 w-4 mr-1" />
                        Avbryt
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={selectedIndices.has(index)}
                        onCheckedChange={() => toggleSelection(index)}
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-sm">{suggestion.name}</h4>
                            {suggestion.likely_has_ai && (
                              <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800">
                                <Bot className="h-3 w-3 mr-1" />
                                AI
                              </Badge>
                            )}
                            {getPriorityBadge(suggestion.priority)}
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-muted-foreground h-7 px-2"
                              onClick={() => toggleExpand(index)}
                            >
                              {suggestion.isExpanded ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="link"
                              size="sm"
                              className="text-primary h-auto p-0 shrink-0"
                              onClick={() => toggleEdit(index)}
                            >
                              <Edit2 className="h-3 w-3 mr-1" />
                              Rediger
                            </Button>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {suggestion.description}
                        </p>
                        
                        {/* Expanded details */}
                        {suggestion.isExpanded && (
                          <div className="mt-3 pt-3 border-t space-y-3">
                            {suggestion.likely_has_ai && suggestion.ai_use_description && (
                              <div className="bg-amber-50 dark:bg-amber-950/50 rounded-md p-3 space-y-1">
                                <div className="flex items-center gap-1.5 text-sm font-medium text-amber-800 dark:text-amber-300">
                                  <Bot className="h-4 w-4" />
                                  AI-bruk identifisert
                                </div>
                                <p className="text-sm text-amber-700 dark:text-amber-400">
                                  {suggestion.ai_use_description}
                                </p>
                                <div className="flex items-start gap-1.5 mt-2 text-xs text-amber-600 dark:text-amber-500">
                                  <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                                  <span>
                                    AI-bruk vil bli registrert automatisk og krever videre risikovurdering.
                                  </span>
                                </div>
                              </div>
                            )}
                            
                            {suggestion.related_systems.length > 0 && (
                              <div>
                                <span className="text-xs font-medium text-muted-foreground">Relaterte systemer:</span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {suggestion.related_systems.map((sys, sysIdx) => (
                                    <Badge key={sysIdx} variant="secondary" className="text-xs">
                                      {sys}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}

                            {suggestion.data_types && suggestion.data_types.length > 0 && (
                              <div>
                                <span className="text-xs font-medium text-muted-foreground">Datatyper:</span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {suggestion.data_types.map((dt, dtIdx) => (
                                    <Badge key={dtIdx} variant="outline" className="text-xs">
                                      {dt}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}

                            <div className="text-xs text-muted-foreground italic">
                              {suggestion.reason}
                            </div>
                          </div>
                        )}

                        {!suggestion.isExpanded && suggestion.related_systems.length > 0 && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Systemer: {suggestion.related_systems.join(", ")}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>

        <DialogFooter className="flex-col sm:flex-row gap-2 pt-4 border-t">
          <div className="text-sm text-muted-foreground mr-auto space-y-1">
            <div>{selectedCount} av {editableSuggestions.length} prosesser valgt</div>
            {selectedAICount > 0 && (
              <div className="flex items-center gap-1 text-amber-600 dark:text-amber-500">
                <Bot className="h-3.5 w-3.5" />
                {selectedAICount} med AI-bruk vil bli registrert
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="text-destructive border-destructive/50 hover:bg-destructive/10" onClick={handleRejectAll}>
              Avslå alle
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Avbryt
            </Button>
            <Button onClick={handleCreate} disabled={selectedCount === 0 || isCreating}>
              {isCreating ? "Oppretter..." : `Opprett valgte (${selectedCount})`}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
