import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, Clock, Send, Zap } from "lucide-react";
import { toast } from "sonner";
import type { AcronisModule, SecurityServiceCategory } from "@/lib/securityServiceCatalog";

interface ActivateAcronisServiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  module: AcronisModule | null;
  service: SecurityServiceCategory | null;
  onActivate: (moduleId: string) => void;
}

export function ActivateAcronisServiceDialog({
  open, onOpenChange, module, service, onActivate,
}: ActivateAcronisServiceDialogProps) {
  if (!module || !service) return null;

  const handleActivateSelf = () => {
    onActivate(module.id);
    onOpenChange(false);
    toast.success(`${module.name} er nå aktivert!`, {
      description: `Tjenesten dekker ${service.linkedControls.join(", ")} i ISO 27001.`,
    });
  };

  const handleRequestMSP = () => {
    onOpenChange(false);
    toast.success("Forespørsel sendt til MSP-partner", {
      description: `Din MSP-partner vil kontakte deg for å sette opp ${module.name}.`,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Aktiver {module.name}
          </DialogTitle>
          <DialogDescription>
            {module.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Module info */}
          <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">Acronis-pakke</span>
              <Badge variant="outline" className="text-xs">{module.acronisPackage}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">Prismodell</span>
              <Badge variant={module.priceIndicator === "included" ? "default" : "secondary"} className="text-xs">
                {module.priceIndicator === "included" ? "Inkludert i pakke" : "Tilleggstjeneste"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">Kategori</span>
              <span className="text-sm text-muted-foreground">{service.name}</span>
            </div>
          </div>

          {/* ISO controls */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">ISO 27001-kontroller som dekkes</p>
            <div className="flex gap-1.5 flex-wrap">
              {service.linkedControls.map((ctrl) => (
                <Badge key={ctrl} variant="outline" className="text-[10px] px-1.5 py-0">{ctrl}</Badge>
              ))}
            </div>
          </div>

          {/* Estimated setup */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            <span>Estimert oppsett: 1–3 virkedager</span>
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button onClick={handleActivateSelf} className="w-full gap-2">
            <Zap className="h-4 w-4" />
            Aktiver nå (demo)
          </Button>
          <Button onClick={handleRequestMSP} variant="outline" className="w-full gap-2">
            <Send className="h-4 w-4" />
            Be MSP-partner om hjelp
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
