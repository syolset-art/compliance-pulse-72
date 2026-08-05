import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowRight, Building2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useActiveOrganization } from "@/contexts/ActiveOrganizationContext";
import { useWorkspaceMode } from "@/contexts/WorkspaceModeContext";
import { entryRouteFor, type CustomerEntryTarget } from "@/lib/customerEntryRoutes";
import { usePostActivationPrompt } from "@/hooks/usePostActivationPrompt";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId: string;
  customerName: string;
  customerOrgNumber?: string | null;
  items: CustomerEntryTarget[];
}

export function EnterCustomerContextDialog({
  open,
  onOpenChange,
  customerId,
  customerName,
  customerOrgNumber,
  items,
}: Props) {
  const navigate = useNavigate();
  const { enterCustomerOrg } = useActiveOrganization();
  const { setMode } = useWorkspaceMode();
  const { setPreference } = usePostActivationPrompt();
  const [selectedId, setSelectedId] = useState<string | null>(items[0]?.id ?? null);
  const [dontAskAgain, setDontAskAgain] = useState(false);

  const selected = items.find((i) => i.id === selectedId) ?? items[0];

  const persistPreference = () => {
    if (dontAskAgain) setPreference(false);
  };

  const handleLater = () => {
    persistPreference();
    onOpenChange(false);
  };

  const handleEnter = () => {
    persistPreference();
    enterCustomerOrg({ id: customerId, name: customerName, orgNumber: customerOrgNumber });
    setMode("compliance");
    onOpenChange(false);
    navigate(selected ? entryRouteFor(selected) : "/");
  };


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">Jobbe videre hos {customerName}?</DialogTitle>
        </DialogHeader>

        <DialogDescription className="text-sm text-muted-foreground leading-relaxed">
          {items.length === 1 && selected
            ? `${selected.label} er aktivert. Vil du bytte til ${customerName} sin organisasjon og starte der?`
            : `Aktiveringen er fullført. Velg hva du vil starte med hos ${customerName}.`}
        </DialogDescription>

        {items.length > 1 && (
          <div className="space-y-2">
            {items.map((item) => {
              const isSelected = item.id === selectedId;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedId(item.id)}
                  className={cn(
                    "w-full text-left rounded-lg border p-3 transition-all flex items-center gap-3",
                    isSelected
                      ? "border-primary ring-1 ring-primary/30 bg-primary/5"
                      : "border-border hover:border-primary/40",
                  )}
                >
                  <span
                    className={cn(
                      "h-4 w-4 rounded-full border-2 shrink-0 flex items-center justify-center",
                      isSelected ? "border-primary" : "border-muted-foreground/40",
                    )}
                  >
                    {isSelected && <span className="h-2 w-2 rounded-full bg-primary" />}
                  </span>
                  <span className="text-sm font-medium text-foreground">{item.label}</span>
                </button>
              );
            })}
          </div>
        )}

        <div className="flex items-start gap-2 rounded-lg border border-dashed p-3">
          <Building2 className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            Du jobber da i {customerName} sin organisasjon på vegne av kunden. Du kan når som helst
            gå tilbake til partneroversikten fra toppfeltet.
          </p>
        </div>

        <DialogFooter className="pt-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Ikke nå
          </Button>
          <Button onClick={handleEnter} className="gap-2">
            Gå til {customerName}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
