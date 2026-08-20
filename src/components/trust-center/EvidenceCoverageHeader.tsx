import { useTranslation } from "react-i18next";
import { FileText, Check } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { SaraIcon } from "@/components/agents/SaraIcon";
import { cn } from "@/lib/utils";
import type { EvidenceIntelligence } from "@/lib/evidenceIntelligence";

interface Props {
  intel: EvidenceIntelligence;
  frameworks: { framework_id: string; framework_name: string }[];
  selected: string[];
  onToggleFramework: (id: string) => void;
  onClearFrameworks: () => void;
  sourceFilter: "all" | "upload" | "agent";
  onSourceFilter: (v: "all" | "upload" | "agent") => void;
}

/** Zone 1 — dekningsbildet: hva har vi, hva mangler, og hvor kommer det fra. */
export const EvidenceCoverageHeader = ({
  intel,
  frameworks,
  selected,
  onToggleFramework,
  onClearFrameworks,
  sourceFilter,
  onSourceFilter,
}: Props) => {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";
  const { coverage } = intel;
  const pct = coverage.total > 0 ? Math.round((coverage.covered / coverage.total) * 100) : 0;

  return (
    <div className="mb-6 rounded-xl border bg-card p-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">
            {isNb ? "Kartlagt dokumentasjon" : "Mapped documentation"}
          </p>
          <p className="mt-1 text-2xl font-semibold tracking-tight">
            {coverage.covered}
            <span className="text-muted-foreground"> / {coverage.total}</span>
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              {isNb ? "påkrevde dokumenter på plass" : "required documents in place"}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-muted-foreground">
            <span className="font-semibold text-warning">{coverage.renew}</span>{" "}
            {isNb ? "må fornyes" : "need renewal"}
          </span>
          <span className="text-muted-foreground">
            <span className="font-semibold text-destructive">{coverage.missing}</span>{" "}
            {isNb ? "mangler" : "missing"}
          </span>
        </div>
      </div>

      <Progress value={pct} className="mt-3 h-1.5" />

      {/* Kilder */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {([
          { id: "all" as const, label: isNb ? "Alle kilder" : "All sources", count: intel.rows.length, icon: null },
          {
            id: "upload" as const,
            label: isNb ? "Delt dokument" : "Shared document",
            count: intel.uploadCount,
            icon: <FileText className="h-3.5 w-3.5" />,
          },
          {
            id: "agent" as const,
            label: isNb ? "Din agent" : "Your agent",
            count: intel.agentCount,
            icon: <SaraIcon size={14} />,
          },
        ]).map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => onSourceFilter(s.id)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors",
              sourceFilter === s.id
                ? "border-primary/40 bg-primary/10 text-foreground"
                : "text-muted-foreground hover:bg-muted/60",
            )}
          >
            {s.icon}
            <span>{s.label}</span>
            <span className="font-semibold">{s.count}</span>
          </button>
        ))}
        <span className="text-xs text-muted-foreground">
          ·{" "}
          {isNb
            ? `${intel.mappedCount} kartlagt mot krav, ${intel.unmappedCount} ikke kartlagt`
            : `${intel.mappedCount} mapped to requirements, ${intel.unmappedCount} unmapped`}
        </span>
      </div>

      {/* Regelverksfilter */}
      {frameworks.length > 0 && (
        <div className="mt-4 border-t pt-3">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {isNb ? "Regelverk i scope" : "Frameworks in scope"}
          </p>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={onClearFrameworks}
              className={cn(
                "rounded-full border px-3 py-1 text-xs transition-colors",
                selected.length === 0
                  ? "border-primary/40 bg-primary/10 text-foreground"
                  : "text-muted-foreground hover:bg-muted/60",
              )}
            >
              {isNb ? "Alle regelverk" : "All frameworks"}
            </button>
            {frameworks.map((f) => {
              const active = selected.includes(f.framework_id);
              return (
                <button
                  key={f.framework_id}
                  type="button"
                  onClick={() => onToggleFramework(f.framework_id)}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs transition-colors",
                    active
                      ? "border-primary/40 bg-primary/10 text-foreground"
                      : "text-muted-foreground hover:bg-muted/60",
                  )}
                >
                  {active && <Check className="h-3 w-3" />}
                  {f.framework_name}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
