import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Info, ShieldCheck, UserCheck, Lock } from "lucide-react";
import { getRequiredRoles, type KeyRole } from "@/lib/keyPersonnelRules";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export interface KeyPersonnelData {
  compliance_officer: string;
  compliance_officer_email: string;
  dpo_name: string;
  dpo_email: string;
  ciso_name: string;
  ciso_email: string;
}

interface KeyPersonnelSectionProps {
  industry: string;
  employees: string;
  data: KeyPersonnelData;
  onChange: (data: KeyPersonnelData) => void;
  compact?: boolean;
}

const statusConfig = {
  required: {
    badge: "Påkrevd",
    variant: "destructive" as const,
    icon: Lock,
  },
  recommended: {
    badge: "Anbefalt",
    variant: "default" as const,
    icon: ShieldCheck,
  },
  optional: {
    badge: "Valgfritt",
    variant: "secondary" as const,
    icon: Info,
  },
};

function RoleField({
  role,
  nameValue,
  emailValue,
  onNameChange,
  onEmailChange,
  compact,
}: {
  role: KeyRole;
  nameValue: string;
  emailValue: string;
  onNameChange: (v: string) => void;
  onEmailChange: (v: string) => void;
  compact?: boolean;
}) {
  if (role.status === "hidden") return null;

  const config = statusConfig[role.status];
  const Icon = config.icon;

  return (
    <div className="space-y-2 p-3 rounded-lg border border-border bg-background">
      <div className="flex items-center gap-2 flex-wrap">
        <Label className="text-sm font-medium">{role.label}</Label>
        <Badge variant={config.variant} className="text-[10px] px-1.5 py-0 h-5">
          <Icon className="h-3 w-3 mr-1" />
          {config.badge}
        </Badge>
        {role.reason && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[260px] text-xs">
                {role.reason}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      <div className={compact ? "space-y-2" : "grid grid-cols-2 gap-2"}>
        <Input
          placeholder="Navn"
          value={nameValue}
          onChange={(e) => onNameChange(e.target.value)}
          className={compact ? "h-9 text-sm" : ""}
        />
        <Input
          type="email"
          placeholder="E-post"
          value={emailValue}
          onChange={(e) => onEmailChange(e.target.value)}
          className={compact ? "h-9 text-sm" : ""}
        />
      </div>
    </div>
  );
}

export function KeyPersonnelSection({
  industry,
  employees,
  data,
  onChange,
  compact = false,
}: KeyPersonnelSectionProps) {
  const roles = getRequiredRoles(industry, employees);
  const visibleRoles = roles.filter((r) => r.status !== "hidden");

  if (visibleRoles.length === 0) return null;

  const updateField = (field: keyof KeyPersonnelData, value: string) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <UserCheck className="h-4 w-4 text-muted-foreground" />
        <Label className="text-sm font-medium">Nøkkelpersoner</Label>
      </div>
      {compact && (
        <p className="text-xs text-muted-foreground -mt-1">
          Basert på {industry} med {employees} ansatte
        </p>
      )}
      {visibleRoles.map((role) => (
        <RoleField
          key={role.id}
          role={role}
          nameValue={data[role.nameField as keyof KeyPersonnelData]}
          emailValue={data[role.emailField as keyof KeyPersonnelData]}
          onNameChange={(v) => updateField(role.nameField as keyof KeyPersonnelData, v)}
          onEmailChange={(v) => updateField(role.emailField as keyof KeyPersonnelData, v)}
          compact={compact}
        />
      ))}
    </div>
  );
}

/** Validate that all required roles have name filled in */
export function validateKeyPersonnel(industry: string, employees: string, data: KeyPersonnelData): string | null {
  const roles = getRequiredRoles(industry, employees);
  for (const role of roles) {
    if (role.status === "required") {
      const name = data[role.nameField as keyof KeyPersonnelData];
      if (!name || !name.trim()) {
        return `${role.label} er påkrevd`;
      }
    }
  }
  return null;
}
