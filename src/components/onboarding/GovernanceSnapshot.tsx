import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  GOVERNANCE_LEVELS,
  COMPANY_CATEGORIES,
  calculateGovernanceLevel,
  type GovernanceLevel,
} from "@/lib/governanceLevelEngine";
import { CERTIFICATION_PHASES } from "@/lib/certificationPhases";

interface GovernanceSnapshotProps {
  category: string;
  industry: string;
  governanceLevel: GovernanceLevel;
  onChangeLevel: (level: GovernanceLevel) => void;
}

export function GovernanceSnapshot({
  category,
  industry,
  governanceLevel,
  onChangeLevel,
}: GovernanceSnapshotProps) {
  const recommended = calculateGovernanceLevel(category);
  const categoryDef = COMPANY_CATEGORIES.find((c) => c.id === category);

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="p-4 rounded-xl bg-muted/50 border border-border">
        <p className="text-sm font-medium mb-2">Oppsummering</p>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-muted-foreground">Bransje:</span>{" "}
            <span className="font-medium capitalize">{industry}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Type:</span>{" "}
            <span className="font-medium">{categoryDef?.name_no || category}</span>
          </div>
        </div>
      </div>

      {/* Level cards */}
      <div className="space-y-3">
        <p className="text-sm font-medium">
          Vi anbefaler <strong>{GOVERNANCE_LEVELS.find((g) => g.id === recommended)?.name_no}</strong> for dere. Du kan endre dette når som helst.
        </p>
        {GOVERNANCE_LEVELS.map((level) => {
          const isSelected = governanceLevel === level.id;
          const isRecommended = recommended === level.id;
          const phases = CERTIFICATION_PHASES.filter((p) =>
            level.visiblePhases.includes(p.id)
          );
          return (
            <button
              key={level.id}
              type="button"
              onClick={() => onChangeLevel(level.id)}
              className={cn(
                "w-full text-left p-4 rounded-xl border transition-all",
                isSelected
                  ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                  : "border-border hover:border-primary/50"
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">{level.name_no}</span>
                    {isRecommended && (
                      <span className="text-[10px] uppercase tracking-wider font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                        Anbefalt
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {level.description_no}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {phases.map((p) => (
                      <span
                        key={p.id}
                        className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground"
                      >
                        {p.name_no}
                      </span>
                    ))}
                  </div>
                </div>
                {isSelected && (
                  <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
