import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";

interface Props {
  customerId: string;
  activeCount: number;
  onGoToRegulations: () => void;
  onStartGapAnalysis: () => void;
}

/**
 * Steg 1 i veiledningsflyten: bekrefter at kunden har en baseline
 * (minst ett aktivert regelverk) før partneren kan kjøre gap-analyse.
 */
export function BaselineReadinessCard({
  activeCount,
  onGoToRegulations,
  onStartGapAnalysis,
}: Props) {
  const isReady = activeCount > 0;

  return (
    <Card className="p-4 border-border">
      <div className="flex items-center gap-3">
        <div
          className={
            "h-9 w-9 rounded-lg flex items-center justify-center shrink-0 " +
            (isReady ? "bg-success/10" : "bg-warning/10")
          }
        >
          {isReady ? (
            <CheckCircle2 className="h-4 w-4 text-success" />
          ) : (
            <AlertCircle className="h-4 w-4 text-warning" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">
            {isReady ? "Baseline er klar" : "Baseline mangler"}
          </p>
          <p className="text-sm text-muted-foreground">
            {isReady
              ? `${activeCount} aktiverte regelverk — klar for gap-analyse.`
              : "Aktiver minst ett regelverk i Regelverk-fanen før gap-analyse."}
          </p>
        </div>
        {isReady ? (
          <Button size="sm" className="gap-1.5 shrink-0" onClick={onStartGapAnalysis}>
            Kjør gap-analyse
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        ) : (
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 shrink-0"
            onClick={onGoToRegulations}
          >
            Gå til Regelverk
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </Card>
  );
}
