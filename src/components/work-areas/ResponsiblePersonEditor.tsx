import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Pencil, Check, X, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface ResponsiblePersonEditorProps {
  workAreaId: string;
  currentPerson: string | null;
  onUpdate: (newPerson: string | null) => void;
  className?: string;
}

export const ResponsiblePersonEditor = ({
  workAreaId,
  currentPerson,
  onUpdate,
  className
}: ResponsiblePersonEditorProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(currentPerson || "");
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("work_areas")
        .update({ responsible_person: value || null })
        .eq("id", workAreaId);

      if (error) throw error;

      onUpdate(value || null);
      setIsEditing(false);
      toast.success("Ansvarlig person oppdatert");
    } catch (error) {
      console.error("Error updating responsible person:", error);
      toast.error("Kunne ikke oppdatere ansvarlig person");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setValue(currentPerson || "");
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Skriv inn navn..."
          className="h-7 text-xs sm:text-sm w-32 sm:w-40"
          autoFocus
          disabled={isLoading}
        />
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6"
          onClick={handleSave}
          disabled={isLoading}
        >
          <Check className="h-3 w-3 text-success" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6"
          onClick={handleCancel}
          disabled={isLoading}
        >
          <X className="h-3 w-3 text-muted-foreground" />
        </Button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setIsEditing(true)}
      className={cn(
        "flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors group",
        className
      )}
    >
      <User className="h-4 w-4 flex-shrink-0" />
      <span className={cn(!currentPerson && "italic")}>
        {currentPerson || "Ikke tildelt"}
      </span>
      <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  );
};
