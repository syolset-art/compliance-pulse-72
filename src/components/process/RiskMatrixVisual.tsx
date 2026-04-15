import { cn } from "@/lib/utils";

interface RiskMatrixVisualProps {
  likelihood: string;
  consequence: string;
  onSelect?: (likelihood: string, consequence: string) => void;
  interactive?: boolean;
  size?: "sm" | "md" | "lg";
}

const LIKELIHOOD_LEVELS = ["low", "medium", "high", "critical"] as const;
const CONSEQUENCE_LEVELS = ["low", "medium", "high", "critical"] as const;

const LIKELIHOOD_LABELS: Record<string, string> = {
  low: "Lav",
  medium: "Moderat",
  high: "Høy",
  critical: "Kritisk",
};

const CONSEQUENCE_LABELS: Record<string, string> = {
  low: "Lav",
  medium: "Moderat",
  high: "Høy",
  critical: "Kritisk",
};

// Risk matrix: likelihood (rows) x consequence (columns)
const RISK_MATRIX: Record<string, Record<string, string>> = {
  low: { low: "acceptable", medium: "low", high: "medium", critical: "high" },
  medium: { low: "low", medium: "medium", high: "high", critical: "critical" },
  high: { low: "medium", medium: "high", high: "critical", critical: "critical" },
  critical: { low: "high", medium: "critical", high: "critical", critical: "critical" },
};

export const calculateRiskLevel = (likelihood: string, consequence: string): string => {
  return RISK_MATRIX[likelihood]?.[consequence] || "medium";
};

const getCellColor = (riskLevel: string) => {
  switch (riskLevel) {
    case "acceptable":
      return "bg-green-100 hover:bg-green-200 border-green-300";
    case "low":
      return "bg-green-200 hover:bg-green-300 border-green-400";
    case "medium":
      return "bg-yellow-100 hover:bg-yellow-200 border-yellow-300";
    case "high":
      return "bg-orange-100 hover:bg-orange-200 border-orange-300";
    case "critical":
      return "bg-red-100 hover:bg-red-200 border-red-300";
    default:
      return "bg-muted hover:bg-muted/80 border-border";
  }
};

const getSelectedCellColor = (riskLevel: string) => {
  switch (riskLevel) {
    case "acceptable":
      return "bg-green-500 text-white border-green-600";
    case "low":
      return "bg-green-600 text-white border-green-700";
    case "medium":
      return "bg-yellow-500 text-white border-yellow-600";
    case "high":
      return "bg-orange-500 text-white border-orange-600";
    case "critical":
      return "bg-red-500 text-white border-red-600";
    default:
      return "bg-primary text-primary-foreground border-primary";
  }
};

export const RiskMatrixVisual = ({
  likelihood,
  consequence,
  onSelect,
  interactive = false,
  size = "md",
}: RiskMatrixVisualProps) => {
  const cellSize = size === "sm" ? "w-8 h-8 text-[13px]" : size === "lg" ? "w-14 h-14 text-sm" : "w-10 h-10 text-xs";
  const labelSize = size === "sm" ? "text-[13px]" : size === "lg" ? "text-sm" : "text-xs";

  // Reverse likelihood for display (critical at top)
  const displayLikelihood = [...LIKELIHOOD_LEVELS].reverse();

  return (
    <div className="flex flex-col gap-1">
      {/* Column header - Consequence */}
      <div className="flex items-end gap-1 ml-16">
        <span className={cn("text-muted-foreground font-medium mb-1", labelSize)}>
          Konsekvens →
        </span>
      </div>
      
      <div className="flex gap-1">
        {/* Row header - Likelihood */}
        <div className="flex flex-col justify-center items-center w-14 -rotate-0">
          <span className={cn("text-muted-foreground font-medium whitespace-nowrap", labelSize)}>
            ↑ Sannsynlighet
          </span>
        </div>

        <div className="flex flex-col gap-0.5">
          {/* Column labels */}
          <div className="flex gap-0.5 ml-12">
            {CONSEQUENCE_LEVELS.map((cons) => (
              <div
                key={cons}
                className={cn("flex items-center justify-center font-medium text-muted-foreground", cellSize, labelSize)}
              >
                {CONSEQUENCE_LABELS[cons].slice(0, 3)}
              </div>
            ))}
          </div>

          {/* Matrix grid */}
          {displayLikelihood.map((lik) => (
            <div key={lik} className="flex gap-0.5 items-center">
              {/* Row label */}
              <div className={cn("w-12 text-right pr-1 font-medium text-muted-foreground", labelSize)}>
                {LIKELIHOOD_LABELS[lik]}
              </div>

              {/* Cells */}
              {CONSEQUENCE_LEVELS.map((cons) => {
                const cellRisk = calculateRiskLevel(lik, cons);
                const isSelected = lik === likelihood && cons === consequence;

                return (
                  <button
                    key={`${lik}-${cons}`}
                    type="button"
                    disabled={!interactive}
                    onClick={() => interactive && onSelect?.(lik, cons)}
                    className={cn(
                      "border-2 rounded-sm flex items-center justify-center font-bold transition-all duration-200",
                      cellSize,
                      interactive ? "cursor-pointer" : "cursor-default",
                      isSelected
                        ? cn(getSelectedCellColor(cellRisk), "ring-2 ring-offset-1 ring-primary scale-110 z-10")
                        : getCellColor(cellRisk)
                    )}
                    title={`${LIKELIHOOD_LABELS[lik]} sannsynlighet, ${CONSEQUENCE_LABELS[cons]} konsekvens`}
                  >
                    {isSelected && "●"}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2 mt-2 justify-center">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-sm bg-green-200 border border-green-400" />
          <span className={cn("text-muted-foreground", labelSize)}>Akseptabel/Lav</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-sm bg-yellow-200 border border-yellow-400" />
          <span className={cn("text-muted-foreground", labelSize)}>Moderat</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-sm bg-orange-200 border border-orange-400" />
          <span className={cn("text-muted-foreground", labelSize)}>Høy</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-sm bg-red-200 border border-red-400" />
          <span className={cn("text-muted-foreground", labelSize)}>Kritisk</span>
        </div>
      </div>
    </div>
  );
};

export const getRiskLevelLabel = (level: string) => {
  switch (level) {
    case "critical": return "KRITISK";
    case "high": return "HØY";
    case "medium": return "MODERAT";
    case "low": return "LAV";
    case "acceptable": return "AKSEPTABEL";
    default: return level.toUpperCase();
  }
};

export const getRiskLevelColor = (level: string) => {
  switch (level) {
    case "critical": return "bg-red-100 text-red-700 border-red-300";
    case "high": return "bg-orange-100 text-orange-700 border-orange-300";
    case "medium": return "bg-yellow-100 text-yellow-700 border-yellow-300";
    case "low": return "bg-green-100 text-green-700 border-green-300";
    case "acceptable": return "bg-green-50 text-green-600 border-green-200";
    default: return "bg-muted text-muted-foreground border-border";
  }
};
