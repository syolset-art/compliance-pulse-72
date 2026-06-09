import { useMemo, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Eye, ShoppingCart } from "lucide-react";
import type { Framework } from "@/lib/frameworkDefinitions";
import { FrameworkDetailCard } from "@/components/regulations/FrameworkDetailCard";
import { ComplianceHistoryChart } from "@/components/regulations/ComplianceHistoryChart";
import { FrameworkRequirementsList } from "@/components/regulations/FrameworkRequirementsList";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  framework: Framework | null;
  customerName: string;
  onActivate: (framework: Framework) => void;
}

export function FrameworkPreviewSheet({
  open,
  onOpenChange,
  framework,
  customerName,
  onActivate,
}: Props) {
  const [counts, setCounts] = useState({
    met: 0,
    partial: 0,
    notMet: 0,
    auto: 0,
    manual: 0,
    total: 0,
  });

  const pct = useMemo(
    () => (counts.total > 0 ? Math.round((counts.met / counts.total) * 100) : 0),
    [counts]
  );

  if (!framework) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto w-full sm:max-w-3xl">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-muted-foreground" />
            Forhåndsvisning — {framework.name}
          </SheetTitle>
          <SheetDescription>
            Gap-analyse for {customerName}. Ikke aktivert, ikke fakturert, ikke synlig for kunden.
          </SheetDescription>
        </SheetHeader>

        {/* Preview banner */}
        <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-dashed border-primary/40 bg-primary/5 p-3">
          <div className="flex items-start gap-2 text-sm">
            <Eye className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-foreground">Partner-forhåndsvisning</p>
              <p className="text-xs text-muted-foreground">
                Estimert gap ({pct}% oppfylt) — bruk i tilbud, ROI eller kampanje.
                Aktiver hos kunden når dere er enige.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            className="gap-2 shrink-0"
            onClick={() => onActivate(framework)}
          >
            <ShoppingCart className="h-4 w-4" />
            Aktiver hos kunden
          </Button>
        </div>

        <div className="mt-5 space-y-4">
          <FrameworkDetailCard framework={framework} counts={counts} />
          <ComplianceHistoryChart frameworkId={framework.id} />
          <FrameworkRequirementsList
            frameworkId={framework.id}
            onCountsChange={setCounts}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
