import { useState } from "react";
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
import { Sparkles, Edit2, Check, X } from "lucide-react";
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
  const [editableSuggestions, setEditableSuggestions] = useState<EditableSuggestion[]>(
    suggestions.map((s) => ({ ...s, isEditing: false, editedName: s.name, editedDescription: s.description }))
  );
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());

  // Update editableSuggestions when suggestions prop changes
  useState(() => {
    setEditableSuggestions(
      suggestions.map((s) => ({ ...s, isEditing: false, editedName: s.name, editedDescription: s.description }))
    );
    setSelectedIndices(new Set());
  });

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

  const selectedCount = selectedIndices.size;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Rediger prosessforslag
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-3 py-2">
            {editableSuggestions.map((suggestion, index) => (
              <div
                key={index}
                className={cn(
                  "border rounded-lg p-4 transition-colors",
                  selectedIndices.has(index) ? "border-primary bg-primary/5" : "border-border"
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
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={selectedIndices.has(index)}
                      onCheckedChange={() => toggleSelection(index)}
                      className="mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-medium text-sm">{suggestion.name}</h4>
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
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {suggestion.description}
                      </p>
                      {suggestion.related_systems.length > 0 && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Systemer: {suggestion.related_systems.join(", ")}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>

        <DialogFooter className="flex-col sm:flex-row gap-2 pt-4 border-t">
          <div className="text-sm text-muted-foreground mr-auto">
            {selectedCount} av {editableSuggestions.length} prosesser valgt
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="text-destructive border-destructive/50 hover:bg-destructive/10" onClick={handleRejectAll}>
              Avslå alle
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Avbryt
            </Button>
            <Button onClick={handleCreate} disabled={selectedCount === 0 || isCreating}>
              {isCreating ? "Oppretter..." : `Opprett valgte prosesser (${selectedCount})`}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
