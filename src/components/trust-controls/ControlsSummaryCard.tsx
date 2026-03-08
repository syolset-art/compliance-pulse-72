import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { useTrustControlEvaluation } from "@/hooks/useTrustControlEvaluation";

interface ControlsSummaryCardProps {
  assetId: string;
}

export function ControlsSummaryCard({ assetId }: ControlsSummaryCardProps) {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";
  const evaluation = useTrustControlEvaluation(assetId);

  if (!evaluation) return null;

  const { implementedCount, partialCount, missingCount, areaScore } = evaluation;

  return (
    <Card className="p-5">
      <h2 className="text-sm font-semibold mb-3">{isNb ? "Kontrollsammendrag" : "Controls Summary"}</h2>
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="flex flex-col items-center gap-0.5 p-2.5 rounded-lg bg-success/10" role="group" aria-label={`${implementedCount} implemented`}>
          <CheckCircle2 className="h-3.5 w-3.5 text-success" aria-hidden="true" />
          <span className="text-xl font-bold text-success">{implementedCount}</span>
          <span className="text-[9px] font-medium text-success uppercase">{isNb ? "Implementert" : "Implemented"}</span>
        </div>
        <div className="flex flex-col items-center gap-0.5 p-2.5 rounded-lg bg-warning/10" role="group" aria-label={`${partialCount} partial`}>
          <AlertTriangle className="h-3.5 w-3.5 text-warning" aria-hidden="true" />
          <span className="text-xl font-bold text-warning">{partialCount}</span>
          <span className="text-[9px] font-medium text-warning uppercase">{isNb ? "Delvis" : "Partial"}</span>
        </div>
        <div className="flex flex-col items-center gap-0.5 p-2.5 rounded-lg bg-destructive/10" role="group" aria-label={`${missingCount} missing`}>
          <XCircle className="h-3.5 w-3.5 text-destructive" aria-hidden="true" />
          <span className="text-xl font-bold text-destructive">{missingCount}</span>
          <span className="text-[9px] font-medium text-destructive uppercase">{isNb ? "Mangler" : "Missing"}</span>
        </div>
      </div>
    </Card>
  );
}
