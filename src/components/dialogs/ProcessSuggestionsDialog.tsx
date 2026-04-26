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
      <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] sm:max-h-[85vh] flex flex-col p-4 sm:p-6">
        <DialogHeader className="space-y-1">
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0" />
            <span className="truncate">Prosessforslag fra Lara Soft</span>
          </DialogTitle>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Velg prosesser du vil opprette. AI-prosesser registreres automatisk.
          </p>
        </DialogHeader>

        {/* Quick stats - mobile optimized */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 py-2 border-b">
          <div className="text-xs sm:text-sm">
            <span className="font-medium">{editableSuggestions.length}</span> forslag
          </div>
          {aiProcessCount > 0 && (
            <div className="flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm text-warning dark:text-warning">
              <Bot className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="font-medium">{aiProcessCount}</span> AI
            </div>
          )}
          <div className="flex items-center gap-1 sm:gap-2 ml-auto">
            <Button variant="ghost" size="sm" onClick={selectAll} className="text-xs h-6 sm:h-7 px-2">
              Velg alle
            </Button>
            <Button variant="ghost" size="sm" onClick={deselectAll} className="text-xs h-6 sm:h-7 px-2">
              Fjern
            </Button>
          </div>
        </div>

        <ScrollArea className="flex-1 -mx-4 sm:-mx-6 px-4 sm:px-6">
          <div className="space-y-2 sm:space-y-3 py-2">
            {editableSuggestions.map((suggestion, index) => (
              <div
                key={index}
                className={cn(
                  "border rounded-lg p-3 sm:p-4 transition-colors",
                  selectedIndices.has(index) ? "border-primary bg-primary/5" : "border-border",
                  suggestion.likely_has_ai && "ring-1 ring-warning dark:ring-warning"
                )}
              >
                {suggestion.isEditing ? (
                  <div className="space-y-2 sm:space-y-3">
                    <Input
                      value={suggestion.editedName}
                      onChange={(e) => updateEditField(index, "editedName", e.target.value)}
                      placeholder="Prosessnavn"
                      className="font-medium text-sm"
                    />
                    <Textarea
                      value={suggestion.editedDescription}
                      onChange={(e) => updateEditField(index, "editedDescription", e.target.value)}
                      placeholder="Beskrivelse"
                      rows={2}
                      className="text-sm"
                    />
                    <div className="flex items-center gap-2">
                      <Button size="sm" onClick={() => saveEdit(index)} className="h-8 text-xs">
                        <Check className="h-3.5 w-3.5 mr-1" />
                        Lagre
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => cancelEdit(index)} className="h-8 text-xs">
                        <X className="h-3.5 w-3.5 mr-1" />
                        Avbryt
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-start gap-2 sm:gap-3">
                      <Checkbox
                        checked={selectedIndices.has(index)}
                        onCheckedChange={() => toggleSelection(index)}
                        className="mt-0.5"
                      />
                      <div className="flex-1 min-w-0">
                        {/* Mobile: Stack vertically, Desktop: Row */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2">
                          <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                            <h4 className="font-medium text-xs sm:text-sm break-words">{suggestion.name}</h4>
                            {suggestion.likely_has_ai && (
                              <Badge variant="outline" className="text-[13px] sm:text-xs bg-warning/10 text-warning border-warning/20 dark:bg-amber-950 dark:text-warning dark:border-warning shrink-0">
                                <Bot className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
                                AI
                              </Badge>
                            )}
                            {getPriorityBadge(suggestion.priority)}
                          </div>
                          <div className="flex items-center gap-1 -ml-0.5 sm:ml-0">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-muted-foreground h-6 sm:h-7 px-1.5 sm:px-2"
                              onClick={() => toggleExpand(index)}
                            >
                              {suggestion.isExpanded ? (
                                <ChevronUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                              ) : (
                                <ChevronDown className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                              )}
                            </Button>
                            <Button
                              variant="link"
                              size="sm"
                              className="text-primary h-auto p-0 text-xs shrink-0"
                              onClick={() => toggleEdit(index)}
                            >
                              <Edit2 className="h-3 w-3 mr-0.5 sm:mr-1" />
                              Rediger
                            </Button>
                          </div>
                        </div>
                        <p className="text-xs sm:text-sm text-muted-foreground mt-1 line-clamp-2">
                          {suggestion.description}
                        </p>
                        
                        {/* Expanded details - mobile optimized */}
                        {suggestion.isExpanded && (
                          <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t space-y-2 sm:space-y-3">
                            {suggestion.likely_has_ai && suggestion.ai_use_description && (
                              <div className="bg-warning/10 dark:bg-amber-950/50 rounded-md p-2 sm:p-3 space-y-1">
                                <div className="flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm font-medium text-warning dark:text-warning">
                                  <Bot className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                  AI-bruk identifisert
                                </div>
                                <p className="text-xs sm:text-sm text-warning dark:text-warning">
                                  {suggestion.ai_use_description}
                                </p>
                                <div className="flex items-start gap-1 sm:gap-1.5 mt-1.5 sm:mt-2 text-[13px] sm:text-xs text-warning dark:text-warning">
                                  <AlertTriangle className="h-3 w-3 sm:h-3.5 sm:w-3.5 mt-0.5 shrink-0" />
                                  <span>
                                    AI-bruk registreres automatisk og krever risikovurdering.
                                  </span>
                                </div>
                              </div>
                            )}
                            
                            {suggestion.related_systems.length > 0 && (
                              <div>
                                <span className="text-[13px] sm:text-xs font-medium text-muted-foreground">Relaterte systemer:</span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {suggestion.related_systems.map((sys, sysIdx) => (
                                    <Badge key={sysIdx} variant="secondary" className="text-[13px] sm:text-xs">
                                      {sys}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}

                            {suggestion.data_types && suggestion.data_types.length > 0 && (
                              <div>
                                <span className="text-[13px] sm:text-xs font-medium text-muted-foreground">Datatyper:</span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {suggestion.data_types.map((dt, dtIdx) => (
                                    <Badge key={dtIdx} variant="outline" className="text-[13px] sm:text-xs">
                                      {dt}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}

                            <div className="text-[13px] sm:text-xs text-muted-foreground italic">
                              {suggestion.reason}
                            </div>
                          </div>
                        )}

                        {!suggestion.isExpanded && suggestion.related_systems.length > 0 && (
                          <p className="text-[13px] sm:text-xs text-muted-foreground mt-1.5 sm:mt-2 truncate">
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

        <DialogFooter className="flex-col gap-2 sm:gap-3 pt-3 sm:pt-4 border-t">
          {/* Status info - always on top on mobile */}
          <div className="text-xs sm:text-sm text-muted-foreground w-full space-y-0.5 sm:space-y-1">
            <div>{selectedCount} av {editableSuggestions.length} prosesser valgt</div>
            {selectedAICount > 0 && (
              <div className="flex items-center gap-1 text-warning dark:text-warning">
                <Bot className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                {selectedAICount} med AI-bruk vil bli registrert
              </div>
            )}
          </div>
          {/* Action buttons - stack on mobile */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            <div className="flex items-center gap-2 order-2 sm:order-1">
              <Button variant="outline" size="sm" className="flex-1 sm:flex-initial text-destructive border-destructive/50 hover:bg-destructive/10 text-xs sm:text-sm h-8 sm:h-9" onClick={handleRejectAll}>
                Avslå alle
              </Button>
              <Button variant="outline" size="sm" className="flex-1 sm:flex-initial text-xs sm:text-sm h-8 sm:h-9" onClick={() => onOpenChange(false)}>
                Avbryt
              </Button>
            </div>
            <Button onClick={handleCreate} disabled={selectedCount === 0 || isCreating} className="w-full sm:w-auto order-1 sm:order-2 text-xs sm:text-sm h-9 sm:h-10">
              {isCreating ? "Oppretter..." : `Opprett valgte (${selectedCount})`}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
