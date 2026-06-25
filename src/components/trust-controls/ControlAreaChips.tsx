import { useTranslation } from "react-i18next";
import { CONTROL_AREAS, type ControlAreaKey } from "@/lib/controlAreas";
import { cn } from "@/lib/utils";

interface ControlAreaChipsProps {
  selected: ControlAreaKey[];
  onChange: (next: ControlAreaKey[]) => void;
  disabled?: boolean;
  /** Render as read-only badges (no interaction). */
  readOnly?: boolean;
}

export function ControlAreaChips({ selected, onChange, disabled, readOnly }: ControlAreaChipsProps) {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";

  const toggle = (key: ControlAreaKey) => {
    if (disabled || readOnly) return;
    onChange(
      selected.includes(key)
        ? selected.filter((k) => k !== key)
        : [...selected, key],
    );
  };

  return (
    <div className="flex flex-wrap gap-2">
      {CONTROL_AREAS.map((area) => {
        const Icon = area.icon;
        const active = selected.includes(area.key);
        return (
          <button
            key={area.key}
            type="button"
            onClick={() => toggle(area.key)}
            disabled={disabled || readOnly}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
              active
                ? "bg-primary/10 border-primary/40 text-foreground"
                : "bg-background border-border text-muted-foreground hover:border-primary/30 hover:text-foreground",
              (disabled || readOnly) && "cursor-default opacity-90",
            )}
            title={isNb ? area.descriptionNb : area.descriptionEn}
          >
            <Icon className={cn("h-3.5 w-3.5", active ? area.accentClass : "text-muted-foreground")} />
            {isNb ? area.labelNb : area.labelEn}
          </button>
        );
      })}
    </div>
  );
}
