import { Check } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { MODULE_INFO, type ModuleKey } from "@/lib/moduleInfo";

interface ModuleInfoDialogProps {
  moduleKey: ModuleKey | null;
  onOpenChange: (open: boolean) => void;
}

export function ModuleInfoDialog({ moduleKey, onOpenChange }: ModuleInfoDialogProps) {
  const info = moduleKey ? MODULE_INFO[moduleKey] : null;

  return (
    <Dialog open={!!moduleKey} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        {info && (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl">{info.title}</DialogTitle>
              <DialogDescription>{info.tagline}</DialogDescription>
            </DialogHeader>
            <div className="space-y-5">
              <p className="text-sm text-foreground leading-relaxed">{info.description}</p>
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Nøkkelfunksjoner
                </p>
                <ul className="space-y-2">
                  {info.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <Check className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
                      <span className="text-sm text-foreground leading-snug">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
