import { User, Building2, Calculator, Wrench, Info } from "lucide-react";
import { cn } from "@/lib/utils";

export type PerformerRole = "owner" | "it_provider" | "accountant" | "internal_it";

interface PerformerOption {
  id: PerformerRole;
  label: string;
  description: string;
  icon: typeof User;
  recommended?: boolean;
}

const PERFORMER_OPTIONS: PerformerOption[] = [
  {
    id: "owner",
    label: "I'll do it myself",
    description: "I have admin access and can enter the API key",
    icon: User,
  },
  {
    id: "it_provider",
    label: "IT provider / MSP",
    description: "Send invitation to your IT partner",
    icon: Building2,
    recommended: true,
  },
  {
    id: "accountant",
    label: "Accountant",
    description: "For accounting systems (UniMicro, Tripletex, etc.)",
    icon: Calculator,
  },
  {
    id: "internal_it",
    label: "Internal IT manager",
    description: "Colleague with technical access",
    icon: Wrench,
  },
];

interface PerformerSelectStepProps {
  integrationName: string;
  onSelect: (role: PerformerRole) => void;
}

export function PerformerSelectStep({ integrationName, onSelect }: PerformerSelectStepProps) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        To connect to {integrationName}, we need to know who will set up the integration.
      </p>

      <div className="grid gap-3">
        {PERFORMER_OPTIONS.map((option) => {
          const Icon = option.icon;
          return (
            <button
              key={option.id}
              onClick={() => onSelect(option.id)}
              className={cn(
                "flex items-start gap-4 p-4 rounded-xl border-2 transition-all text-left",
                option.recommended
                  ? "border-primary/50 bg-primary/5 hover:bg-primary/10"
                  : "border-border hover:border-primary/30 hover:bg-muted/30"
              )}
            >
              <div className={cn(
                "p-2 rounded-lg shrink-0",
                option.recommended ? "bg-primary/20" : "bg-muted"
              )}>
                <Icon className={cn(
                  "h-5 w-5",
                  option.recommended ? "text-primary" : "text-muted-foreground"
                )} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{option.label}</p>
                  {option.recommended && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary">
                      Most common
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {option.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex items-start gap-3 p-4 rounded-xl border border-primary/30 bg-primary/5">
        <div className="p-2 rounded-full bg-primary/20 shrink-0">
          <Info className="h-4 w-4 text-primary" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">Why do we ask?</p>
          <p className="text-sm text-muted-foreground mt-1">
            For audit and documentation purposes, it's important to log who has set up integrations and handles API keys.
          </p>
        </div>
      </div>
    </div>
  );
}
