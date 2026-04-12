import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Pencil } from "lucide-react";

interface InlineEditableFieldProps {
  label: string;
  value: string;
  placeholder?: string;
  onSave: (value: string) => void;
  disabled?: boolean;
}

export const InlineEditableField = ({ label, value, placeholder, onSave, disabled }: InlineEditableFieldProps) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setDraft(value); }, [value]);
  useEffect(() => { if (editing) inputRef.current?.focus(); }, [editing]);

  const handleSave = () => {
    setEditing(false);
    if (draft !== value) onSave(draft);
  };

  if (editing && !disabled) {
    return (
      <span className="inline-flex items-center gap-1">
        <span className="font-medium text-foreground text-xs">{label}:</span>
        <Input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={handleSave}
          onKeyDown={(e) => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") { setDraft(value); setEditing(false); } }}
          className="h-5 text-xs w-28 px-1 py-0 border-b border-t-0 border-x-0 rounded-none bg-transparent shadow-none focus-visible:ring-0"
          placeholder={placeholder}
        />
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 group ${!disabled ? "cursor-pointer hover:bg-muted/50 rounded px-1 -mx-1" : ""}`}
      onClick={() => !disabled && setEditing(true)}
    >
      <span className="font-medium text-foreground text-xs">{label}:</span>{" "}
      <span className="text-xs">{value || <span className="text-muted-foreground italic">{placeholder}</span>}</span>
      {!disabled && <Pencil className="h-2.5 w-2.5 text-muted-foreground/60" />}
    </span>
  );
};
