import { Sparkles, RotateCcw } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  DASHBOARD_MODULES,
  type DashboardModuleKey,
  type DemoOverrides,
} from "@/lib/dashboardModules";

interface Props {
  isNb: boolean;
  overrides: DemoOverrides;
  active: Set<DashboardModuleKey>;
  onToggle: (key: DashboardModuleKey, value: boolean) => void;
  onReset: () => void;
}

export function DemoModuleSwitcher({ isNb, overrides, active, onToggle, onReset }: Props) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-muted/30 px-4 py-3">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5" />
          {isNb ? "Demo: aktiverte produkter" : "Demo: activated products"}
        </div>

        {DASHBOARD_MODULES.map((m) => (
          <label key={m.key} className="flex items-center gap-2 text-sm">
            <Switch
              checked={active.has(m.key)}
              onCheckedChange={(v) => onToggle(m.key, v)}
              aria-label={isNb ? m.label_no : m.label_en}
            />
            <span className="text-foreground/80">{isNb ? m.label_no : m.label_en}</span>
          </label>
        ))}

        <Button
          variant="ghost"
          size="sm"
          className="ml-auto h-7 gap-1.5 text-xs"
          onClick={onReset}
          disabled={Object.keys(overrides).length === 0}
        >
          <RotateCcw className="h-3 w-3" />
          {isNb ? "Nullstill" : "Reset"}
        </Button>
      </div>
      <p className="mt-2 text-[0.7rem] leading-snug text-muted-foreground">
        {isNb
          ? "Regelverk og Trust Center henger sammen: aktiveres den ene, blir den andre tilgjengelig."
          : "Regulations and Trust Center are linked: activating one makes the other available."}
      </p>
    </div>
  );
}
