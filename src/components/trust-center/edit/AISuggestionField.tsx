import { useState } from "react";
import { Sparkles, Check, Pencil, X, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface AISuggestionFieldProps {
  label: string;
  value: string;
  suggested?: boolean;
  confirmed?: boolean;
  multiline?: boolean;
  placeholder?: string;
  emptyHint?: string;
  onConfirm: () => void;
  onChange: (value: string) => void;
  onReject: () => void;
}

/**
 * Wrapper that renders a value as either:
 * - "Foreslått av Lara" (sparkles + Bekreft / Endre / Avvis)
 * - "Bekreftet" (normal field, edit-in-place)
 * - "Tom" (Lara fant ingenting → fyll ut manuelt)
 */
export function AISuggestionField({
  label,
  value,
  suggested,
  confirmed,
  multiline,
  placeholder,
  emptyHint,
  onConfirm,
  onChange,
  onReject,
}: AISuggestionFieldProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  const InputEl: any = multiline ? Textarea : Input;
  const hasValue = !!value?.trim();

  const handleSaveEdit = () => {
    onChange(draft);
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-foreground">{label}</label>
        <InputEl
          value={draft}
          onChange={(e: any) => setDraft(e.target.value)}
          className="text-sm"
          placeholder={placeholder}
          autoFocus
        />
        <div className="flex gap-2">
          <Button size="sm" className="text-xs h-7" onClick={handleSaveEdit}>
            Lagre
          </Button>
          <Button size="sm" variant="ghost" className="text-xs h-7" onClick={() => { setDraft(value); setEditing(false); }}>
            Avbryt
          </Button>
        </div>
      </div>
    );
  }

  if (suggested && !confirmed && hasValue) {
    return (
      <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-2">
        <div className="flex items-center gap-1.5">
          <Sparkles className="h-3 w-3 text-primary" />
          <span className="text-[11px] font-medium text-primary uppercase tracking-wide">Foreslått av Lara</span>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-sm font-medium text-foreground mt-0.5 whitespace-pre-wrap">{value}</p>
        </div>
        <div className="flex gap-2 pt-1">
          <Button size="sm" variant="default" className="text-xs h-7 gap-1" onClick={onConfirm}>
            <Check className="h-3 w-3" /> Bekreft
          </Button>
          <Button size="sm" variant="outline" className="text-xs h-7 gap-1" onClick={() => { setDraft(value); setEditing(true); }}>
            <Pencil className="h-3 w-3" /> Endre
          </Button>
          <Button size="sm" variant="ghost" className="text-xs h-7 gap-1 text-muted-foreground" onClick={onReject}>
            <X className="h-3 w-3" /> Avvis
          </Button>
        </div>
      </div>
    );
  }

  if (!hasValue) {
    return (
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-foreground">{label}</label>
          <span className="text-[11px] text-muted-foreground italic">
            {emptyHint || "Lara fant ingenting — fyll ut manuelt"}
          </span>
        </div>
        <InputEl
          value={draft}
          onChange={(e: any) => setDraft(e.target.value)}
          onBlur={() => draft !== value && onChange(draft)}
          className="text-sm"
          placeholder={placeholder}
        />
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-foreground">{label}</label>
        <Badge variant="outline" className="text-[10px] gap-1 text-success border-success/30">
          <CheckCircle2 className="h-2.5 w-2.5" /> Bekreftet
        </Badge>
      </div>
      <div className="flex items-center gap-2">
        <p className="text-sm text-foreground flex-1 truncate">{value}</p>
        <Button size="sm" variant="ghost" className="text-xs h-7 gap-1" onClick={() => { setDraft(value); setEditing(true); }}>
          <Pencil className="h-3 w-3" /> Endre
        </Button>
      </div>
    </div>
  );
}
