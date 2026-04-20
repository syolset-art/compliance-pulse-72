import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { ACTIVITY_STATUS_CONFIG, type ActivityStatus } from "@/utils/vendorActivityData";

interface Props {
  currentStatus: ActivityStatus;
  onSave: (next: ActivityStatus, comment?: string) => void;
  onCancel: () => void;
}

const STATUSES: ActivityStatus[] = ["open", "in_progress", "closed", "not_relevant"];

export function InlineStatusEditor({ currentStatus, onSave, onCancel }: Props) {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";
  const [selected, setSelected] = useState<ActivityStatus>(currentStatus);
  const [comment, setComment] = useState("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onCancel(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  const handleSave = () => onSave(selected, comment.trim() || undefined);

  return (
    <div
      className="pl-11 pb-3 animate-in slide-in-from-top-1 fade-in-0 duration-150"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {isNb ? "Endre status til:" : "Change status to:"}
        </p>
        <div className="flex flex-wrap gap-2">
          {STATUSES.map((s) => {
            const conf = ACTIVITY_STATUS_CONFIG[s];
            const isActive = selected === s;
            return (
              <button
                key={s}
                type="button"
                onClick={() => setSelected(s)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider transition-all",
                  isActive ? conf.pill + " ring-2 ring-offset-1 ring-offset-background ring-current/40" : "border-border bg-background text-muted-foreground hover:text-foreground hover:border-primary/40"
                )}
              >
                <span className={cn("h-1.5 w-1.5 rounded-full", conf.dot)} />
                {isNb ? conf.nb : conf.en}
                {isActive && <Check className="h-3 w-3" />}
              </button>
            );
          })}
        </div>

        <div className="flex flex-col sm:flex-row gap-2 pt-1">
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={isNb ? "Legg til kommentar (valgfritt)…" : "Add comment (optional)…"}
            rows={2}
            className="flex-1 min-h-[60px] text-sm resize-none"
          />
          <div className="flex sm:flex-col gap-2 sm:w-28 shrink-0">
            <Button type="button" size="sm" onClick={handleSave} className="flex-1 sm:flex-none">
              {isNb ? "Lagre" : "Save"}
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={onCancel} className="flex-1 sm:flex-none">
              <X className="h-3.5 w-3.5 mr-1" />
              {isNb ? "Avbryt" : "Cancel"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
