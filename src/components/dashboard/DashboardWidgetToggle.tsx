import { Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useTranslation } from "react-i18next";

interface WidgetToggleItem {
  id: string;
  label: string;
  visible: boolean;
}

interface DashboardWidgetToggleProps {
  widgets: WidgetToggleItem[];
  onToggle: (id: string, visible: boolean) => void;
  onReset: () => void;
}

export function DashboardWidgetToggle({ widgets, onToggle, onReset }: DashboardWidgetToggleProps) {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Settings2 className="h-4 w-4 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-3">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-foreground">
            {isNb ? "Vis/skjul widgets" : "Show/hide widgets"}
          </p>
          <Button variant="ghost" size="sm" className="text-xs h-7" onClick={onReset}>
            {isNb ? "Tilbakestill" : "Reset"}
          </Button>
        </div>
        <div className="space-y-2">
          {widgets.map((w) => (
            <div key={w.id} className="flex items-center justify-between py-1">
              <span className="text-sm text-foreground">{w.label}</span>
              <Switch
                checked={w.visible}
                onCheckedChange={(checked) => onToggle(w.id, checked)}
              />
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
