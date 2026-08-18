import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Laptop,
  Lock,
  Shield,
  Sparkles,
} from "lucide-react";

interface TrustBoundaryStripProps {
  activeCount: number;
  discoveredTotal: number;
}

/**
 * Tillitsgrense øverst på «Datakilder og agenter»:
 * hva som blir hos kunden vs. hva som sendes til Mynder.
 */
export function TrustBoundaryStrip({ activeCount, discoveredTotal }: TrustBoundaryStripProps) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <Card className="mt-6 border-primary/20">
      <div className="flex flex-wrap items-center justify-between gap-4 p-4">
        <div className="flex flex-1 flex-wrap gap-3 min-w-[280px]">
          <div className="flex-1 min-w-[200px] rounded-lg border border-border bg-muted/30 p-3">
            <div className="flex items-center gap-1.5">
              <Laptop className="h-4 w-4 text-primary" aria-hidden="true" />
              <p className="text-[13px] font-medium text-foreground">Blir hos deg</p>
            </div>
            <p className="mt-1 text-[13px] text-muted-foreground">
              Dokumenter, filer, rådata
            </p>
          </div>
          <div className="flex-1 min-w-[200px] rounded-lg border border-border bg-primary/[0.03] p-3">
            <div className="flex items-center gap-1.5">
              <ArrowRight className="h-4 w-4 text-primary" aria-hidden="true" />
              <p className="text-[13px] font-medium text-foreground">Sendes til Mynder</p>
            </div>
            <p className="mt-1 text-[13px] text-muted-foreground">
              Funn, dekningsgrad, kravreferanse
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-xs text-muted-foreground">Aktive koblinger</div>
            <div className="text-base font-semibold">{activeCount}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground">Oppdaget</div>
            <div className="text-base font-semibold">{discoveredTotal}</div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDetails((s) => !s)}
            aria-expanded={showDetails}
            className="h-8 gap-1 text-xs"
          >
            {showDetails ? "Skjul" : "Mer info"}
            {showDetails ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>
      </div>

      {showDetails && (
        <div className="flex flex-wrap items-center gap-6 border-t border-border bg-gradient-to-r from-primary/5 to-transparent px-4 py-3">
          <div className="flex items-center gap-2 text-sm">
            <Lock className="h-4 w-4 text-primary" />
            <span className="font-medium">Kryptert lagring</span>
            <span className="text-muted-foreground">av alle tilgangstokens</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Shield className="h-4 w-4 text-primary" />
            <span className="font-medium">Kun lesetilgang</span>
            <span className="text-muted-foreground">som standard</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="font-medium">Din godkjenning</span>
            <span className="text-muted-foreground">før noe blir aktivt</span>
          </div>
        </div>
      )}
    </Card>
  );
}
