import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AgentGovernanceSettings,
  WhoCanCreate,
  loadGovernance,
  saveGovernance,
  whoCanCreateLabel,
} from "@/lib/agentGovernance";

export function AgentGovernanceControls() {
  const [settings, setSettings] = useState<AgentGovernanceSettings>(() => loadGovernance());

  useEffect(() => {
    const sync = () => setSettings(loadGovernance());
    window.addEventListener("mynder:agents:governance", sync);
    return () => window.removeEventListener("mynder:agents:governance", sync);
  }, []);

  const update = (patch: Partial<AgentGovernanceSettings>) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    saveGovernance(next);
  };

  return (
    <Card className="divide-y divide-border">
      <div className="flex items-center justify-between gap-4 p-4">
        <div>
          <Label htmlFor="pause-all" className="text-sm font-medium">
            Sett alle agenter på pause
          </Label>
          <p className="text-xs text-muted-foreground mt-0.5">
            Stopper alt agentarbeid i virksomheten. I prototypen registreres valget, men det
            håndheves ikke automatisk.
          </p>
        </div>
        <Switch
          id="pause-all"
          checked={settings.pausedAll}
          onCheckedChange={(v) => update({ pausedAll: v })}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 p-4">
        <div>
          <Label className="text-sm font-medium">Hvem kan opprette agenter</Label>
          <p className="text-xs text-muted-foreground mt-0.5">
            Bestemmer hvem som kan bygge nye agenter.
          </p>
        </div>
        <Select
          value={settings.whoCanCreate}
          onValueChange={(v) => update({ whoCanCreate: v as WhoCanCreate })}
        >
          <SelectTrigger className="w-[260px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(["everyone", "admins", "admins_and_groups"] as WhoCanCreate[]).map((v) => (
              <SelectItem key={v} value={v}>
                {whoCanCreateLabel(v)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </Card>
  );
}
