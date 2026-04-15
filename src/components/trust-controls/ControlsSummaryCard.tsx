import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, AlertTriangle, XCircle, ChevronRight } from "lucide-react";
import { useTrustControlEvaluation } from "@/hooks/useTrustControlEvaluation";

interface ControlsSummaryCardProps {
  assetId: string;
  onSelectMissing?: () => void;
}

export function ControlsSummaryCard({ assetId, onSelectMissing }: ControlsSummaryCardProps) {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";
  const evaluation = useTrustControlEvaluation(assetId);

  if (!evaluation) return null;

  const { implementedCount, partialCount, missingCount, allControls } = evaluation;
  const total = implementedCount + partialCount + missingCount;
  const completionPct = total > 0 ? Math.round(((implementedCount + partialCount * 0.5) / total) * 100) : 0;
  const needsActionCount = missingCount + partialCount;

  // Top missing controls to show
  const missingControls = allControls
    .filter(c => c.status === "missing")
    .slice(0, 3);

  const partialControls = allControls
    .filter(c => c.status === "partial")
    .slice(0, 2);

  return (
    <Card className="p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold text-foreground">
            {isNb ? "Kontrollstatus" : "Controls Status"}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {total} {isNb ? "kontroller totalt" : "controls total"}
          </p>
        </div>
        <div className="text-right">
          <span className="text-2xl font-bold text-foreground">{completionPct}%</span>
          <p className="text-[13px] text-muted-foreground uppercase tracking-wider">
            {isNb ? "fullført" : "complete"}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <Progress value={completionPct} className="h-2 mb-4" />

      {/* Three counters — missing is dominant */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {/* Missing — most prominent */}
        <div className="col-span-1 flex flex-col items-center gap-0.5 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
          <XCircle className="h-4 w-4 text-destructive" />
          <span className="text-2xl font-bold text-destructive leading-tight">{missingCount}</span>
          <span className="text-[13px] font-semibold text-destructive/80 uppercase tracking-wide">
            {isNb ? "Mangler" : "Missing"}
          </span>
        </div>
        <div className="flex flex-col items-center gap-0.5 p-3 rounded-lg bg-warning/10">
          <AlertTriangle className="h-3.5 w-3.5 text-warning" />
          <span className="text-xl font-bold text-warning leading-tight">{partialCount}</span>
          <span className="text-[13px] font-medium text-warning/80 uppercase tracking-wide">
            {isNb ? "Delvis" : "Partial"}
          </span>
        </div>
        <div className="flex flex-col items-center gap-0.5 p-3 rounded-lg bg-success/10">
          <CheckCircle2 className="h-3.5 w-3.5 text-success" />
          <span className="text-xl font-bold text-success leading-tight">{implementedCount}</span>
          <span className="text-[13px] font-medium text-success/80 uppercase tracking-wide">
            {isNb ? "OK" : "Done"}
          </span>
        </div>
      </div>

      {/* What's missing — action-focused list */}
      {needsActionCount > 0 && (
        <div className="border-t border-border pt-3">
          <p className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            {isNb ? "Gjenstår å gjøre" : "Needs attention"}
          </p>
          <div className="space-y-1.5">
            {missingControls.map(ctrl => (
              <div key={ctrl.key} className="flex items-center gap-2 text-sm">
                <XCircle className="h-3 w-3 text-destructive shrink-0" />
                <span className="text-xs text-foreground truncate">
                  {isNb ? ctrl.labelNb : ctrl.labelEn}
                </span>
              </div>
            ))}
            {partialControls.map(ctrl => (
              <div key={ctrl.key} className="flex items-center gap-2 text-sm">
                <AlertTriangle className="h-3 w-3 text-warning shrink-0" />
                <span className="text-xs text-muted-foreground truncate">
                  {isNb ? ctrl.labelNb : ctrl.labelEn}
                </span>
              </div>
            ))}
            {needsActionCount > missingControls.length + partialControls.length && (
              <button
                onClick={onSelectMissing}
                className="flex items-center gap-1 text-[13px] text-primary hover:underline mt-1"
              >
                <ChevronRight className="h-3 w-3" />
                {needsActionCount - missingControls.length - partialControls.length}{" "}
                {isNb ? "til gjenstår" : "more remaining"}
              </button>
            )}
          </div>
        </div>
      )}

      {needsActionCount === 0 && (
        <div className="flex items-center gap-2 pt-3 border-t border-border">
          <CheckCircle2 className="h-4 w-4 text-success" />
          <span className="text-xs text-success font-medium">
            {isNb ? "Alle kontroller er implementert" : "All controls implemented"}
          </span>
        </div>
      )}
    </Card>
  );
}
