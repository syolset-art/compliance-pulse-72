import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  FileText,
  Sparkles,
  Upload,
  Circle,
  CheckCircle2,
  Info,
  ShieldCheck,
} from "lucide-react";
import { DOCUMENT_SLOTS } from "@/lib/trustMaturityQuestions";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Props {
  customerId: string;
  customerName: string;
}

const accessKey = (id: string) => `msp.customer.laraDocAccess.${id}`;

export function CustomerDocumentationTab({ customerId, customerName }: Props) {
  const [access, setAccess] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(accessKey(customerId));
      setAccess(raw === "true");
    } catch {
      setAccess(false);
    }
  }, [customerId]);

  const toggleAccess = (next: boolean) => {
    setAccess(next);
    try {
      localStorage.setItem(accessKey(customerId), String(next));
    } catch {}
    toast.success(
      next
        ? "Lara har nå lese-tilgang til opplastede dokumenter"
        : "Lara har ikke lenger tilgang til dokumentene",
    );
  };

  return (
    <div className="space-y-5">
      {/* Forklaring */}
      <Card className="p-4 sm:p-5 border-border">
        <div className="flex items-start gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <FileText className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-semibold text-foreground">Dokumentasjon</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Gi Lara tilgang til {customerName} sin dokumentasjon — DPA-er, policyer,
              hendelsesplaner og andre filer. Lara leser dokumentene og bruker dem som
              grunnlag for baseline-svar, gap-analyse og forslag til tiltak.
            </p>
          </div>
        </div>
      </Card>

      {/* Samtykke / tilgang */}
      <Card className="p-4 sm:p-5 border-primary/20 bg-primary/5">
        <div className="flex items-start gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
            <ShieldCheck className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">
                  Lara kan få lese-tilgang til opplastede dokumenter
                </p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Når tilgang er på, kan Lara sitere dokumenter og oppdatere baseline-svar
                  automatisk når innholdet endres.
                </p>
              </div>
              <Switch checked={access} onCheckedChange={toggleAccess} />
            </div>
          </div>
        </div>
      </Card>

      {/* Dokumentliste */}
      <Card className="p-4 sm:p-5 border-border">
        <div className="flex items-center justify-between gap-2 mb-3">
          <h3 className="text-sm font-semibold text-foreground">Dokumenter</h3>
          <span className="text-xs text-muted-foreground">
            {DOCUMENT_SLOTS.length} forventede dokumenter
          </span>
        </div>
        <div className="divide-y divide-border/60">
          {DOCUMENT_SLOTS.map((slot) => {
            const uploaded = false; // prototype: ingen reell opplasting enda
            const StatusIcon = uploaded ? CheckCircle2 : Circle;
            return (
              <div key={slot.id} className="flex items-start gap-3 py-3">
                <StatusIcon
                  className={`h-4 w-4 shrink-0 mt-0.5 ${
                    uploaded ? "text-success" : "text-muted-foreground/50"
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{slot.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{slot.description}</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 shrink-0"
                  onClick={() =>
                    toast.info("Opplasting kommer snart", {
                      description: "I prototypen er dokumentopplasting ikke aktivert.",
                    })
                  }
                >
                  <Upload className="h-3.5 w-3.5" />
                  Last opp
                </Button>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Info nederst */}
      <div className="flex items-start gap-2 text-xs text-muted-foreground px-1">
        <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
        <p>
          Når dokumentasjon mangler, baserer Lara svarene på antakelser om typiske norske
          SMB-er i kundens bransje. Last opp dokumenter for høyere presisjon — Laras
          begrunnelse vises da som et direkte sitat fra dokumentet.
        </p>
      </div>
    </div>
  );
}
