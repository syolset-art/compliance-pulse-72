import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { ShieldCheck } from "lucide-react";
import { MANDATE_PERMISSIONS, type Mandate } from "@/lib/agentMandate";

/**
 * Mandatvelger – brukes både i veiviseren (steg 2) og når en eksisterende
 * kobling administreres.
 */
export function AgentMandateEditor({
  mandate,
  onChange,
  idPrefix = "mandate",
}: {
  mandate: Mandate;
  onChange: (next: Mandate) => void;
  idPrefix?: string;
}) {
  const set = (key: keyof Mandate, patch: Partial<Mandate[keyof Mandate]>) =>
    onChange({ ...mandate, [key]: { ...mandate[key], ...patch } });

  return (
    <div className="space-y-2">
      <ul className="divide-y rounded-lg border border-border">
        {MANDATE_PERMISSIONS.map((p) => {
          const value = mandate[p.key];
          const switchId = `${idPrefix}-${p.key}`;
          const approvalId = `${idPrefix}-${p.key}-approval`;
          return (
            <li key={p.key} className="flex flex-col gap-2 p-3 sm:flex-row sm:items-start">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Label htmlFor={switchId} className="text-[13px] font-medium text-foreground">
                    {p.label}
                  </Label>
                  {value?.enabled && value?.requiresApproval && (
                    <Badge variant="outline" className="border-primary/40 text-[10px] text-primary">
                      Krever godkjenning
                    </Badge>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">{p.description}</p>

                {p.approvable && value?.enabled && (
                  <div className="mt-2 flex items-center gap-2">
                    <Switch
                      id={approvalId}
                      checked={value.requiresApproval}
                      onCheckedChange={(v) => set(p.key, { requiresApproval: v })}
                    />
                    <Label htmlFor={approvalId} className="text-xs text-muted-foreground">
                      Krev min godkjenning først
                    </Label>
                  </div>
                )}
              </div>

              <Switch
                id={switchId}
                className="shrink-0"
                checked={!!value?.enabled}
                onCheckedChange={(v) => set(p.key, { enabled: v })}
                aria-label={p.label}
              />
            </li>
          );
        })}
      </ul>

      <p className="flex items-start gap-2 text-xs text-muted-foreground">
        <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />
        Mandatet gjelder bare denne koblingen og kan endres eller trekkes tilbake når som helst.
      </p>
    </div>
  );
}
