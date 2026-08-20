import { useTranslation } from "react-i18next";
import { Shield, ChevronDown, HelpCircle, Sparkles } from "lucide-react";
import { useTrustControlEvaluation } from "@/hooks/useTrustControlEvaluation";
import { cn } from "@/lib/utils";
import { CONTROL_AREAS, type ControlAreaKey } from "@/lib/controlAreas";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

interface Props {
  assetId: string;
  variant?: "default" | "vendor";
}

const AREA_THRESHOLDS: Record<ControlAreaKey, { green: number; orange: number }> = {
  governance:     { green: 75, orange: 40 },
  operations:     { green: 75, orange: 30 },
  identityAccess: { green: 60, orange: 40 },
  privacy:        { green: 75, orange: 40 },
  vendor:         { green: 75, orange: 50 },
};

function colorFor(score: number, areaKey: ControlAreaKey | "overall") {
  const t = AREA_THRESHOLDS[areaKey as ControlAreaKey] ?? { green: 75, orange: 50 };
  if (score >= t.green)  return { text: "text-success", bar: "bg-success" };
  if (score >= t.orange) return { text: "text-warning", bar: "bg-warning" };
  return { text: "text-destructive", bar: "bg-destructive" };
}

/**
 * Standard Trust Profile-blokk: kompakt 2x2-grid med modenhet per kontrollområde.
 * Brukes på alle Trust Profil-maler (leverandører + systemer).
 * I "vendor"-varianten presenteres blokken som en fase 2-forhåndsvisning av
 * leverandørens modenhet, som brukeren ikke kan påvirke utover å be om dokumentasjon.
 */
export function AssetMaturityByDomainCard({ assetId, variant = "default" }: Props) {
  const { t, i18n } = useTranslation();
  const isNb = i18n.language === "nb" || i18n.language === "no";
  const isVendor = variant === "vendor";
  const evaluation = useTrustControlEvaluation(assetId);

  if (!evaluation) {
    return (
      <div className={cn("rounded-2xl border border-border bg-card p-5", isVendor && "bg-muted/20 border-dashed")}>
        <p className="text-sm text-muted-foreground italic">{isNb ? "Laster modenhet…" : "Loading maturity…"}</p>
      </div>
    );
  }

  const overall = evaluation.trustScore;
  const overallColor = colorFor(overall, "overall");

  return (
    <div className={cn("rounded-2xl border border-border bg-card p-5 space-y-4", isVendor && "bg-muted/20 border-dashed")}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1.5 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Shield className="h-4 w-4 text-primary shrink-0" />
            <h3 className="text-sm font-semibold text-foreground">
              {isVendor
                ? t("assetMaturityByDomain.titleVendor")
                : (isNb ? "Modenhet per kontrollområde" : "Maturity by control area")}
            </h3>
            {isVendor && (
              <Badge variant="outline" className="text-[10px] uppercase tracking-wide gap-1 px-2 py-0.5 h-5">
                <Sparkles className="h-3 w-3" />
                {t("assetMaturityByDomain.phase2Badge")}
              </Badge>
            )}
          </div>
          {isVendor && (
            <p className="text-[12px] text-muted-foreground leading-relaxed max-w-2xl">
              {t("assetMaturityByDomain.vendorExplainer")}
            </p>
          )}
        </div>
        <TooltipProvider delayDuration={150}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1 text-sm text-muted-foreground shrink-0 cursor-help border-b border-dotted border-muted-foreground/40 pb-0.5 hover:text-foreground transition-colors">
                <span>{isNb ? "Trust Score" : "Trust Score"}</span>
                <span className={cn("text-base font-bold tabular-nums", overallColor.text)}>{overall}</span>
                <span className="text-muted-foreground">/100</span>
                <HelpCircle className="h-3.5 w-3.5 text-muted-foreground/60" />
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" align="end" className="w-80 p-3.5 space-y-2.5 text-xs bg-popover text-popover-foreground border border-border shadow-xl leading-relaxed">
              <p className="font-semibold text-foreground">
                {isNb ? "Hvordan beregnes Trust Score?" : "How is the Trust Score calculated?"}
              </p>
              <p>
                {isNb
                  ? "Hvert område scores 0–100 ut fra hvor godt kontrollpunktene er på plass. Områdene teller ulikt i den samlede scoren:"
                  : "Each area is scored 0–100 based on how well the control points are in place. The areas weigh differently in the overall score:"}
              </p>
              <ul className="space-y-1 list-disc pl-4 text-muted-foreground">
                <li>
                  <strong>{isNb ? "Personvern" : "Privacy"}:</strong> 30%
                </li>
                <li>
                  <strong>{isNb ? "Styring" : "Governance"}:</strong> 25%
                </li>
                <li>
                  <strong>{isNb ? "Drift" : "Operations"}:</strong> 25%
                </li>
                <li>
                  <strong>{isNb ? "Identitet og tilgang" : "Identity & Access"}:</strong> 10%
                </li>
                <li>
                  <strong>{isNb ? "Leverandører" : "Vendors"}:</strong> 10%
                </li>
              </ul>
              <p className="text-[11px] text-muted-foreground/80 border-t border-border/60 pt-1.5 mt-1.5">
                {isNb
                  ? "Vektene er de samme selv om du legger til flere regelverk."
                  : "The weights remain the same even if you add multiple frameworks."}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Grid of all 5 areas */}
      <div className={cn("grid grid-cols-1 sm:grid-cols-2 gap-2.5", isVendor && "opacity-85")}>
        {CONTROL_AREAS.map(({ key, icon: Icon, labelNb, labelEn }) => {
          const score = evaluation.areaScore(key as any);
          const c = colorFor(score, key);
          return (
            <button
              key={key}
              type="button"
              className="group rounded-xl border border-border bg-background hover:bg-muted/30 hover:border-primary/40 transition-all px-3.5 py-3 text-left"
            >
              <div className="flex items-center gap-2.5">
                <span className="h-7 w-7 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                </span>
                <span className="text-sm font-medium text-foreground flex-1 min-w-0 truncate">
                  {isNb ? labelNb : labelEn}
                </span>
                <span className={cn("text-sm font-semibold tabular-nums shrink-0", c.text)}>
                  {score}%
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0 group-hover:text-muted-foreground transition-colors" />
              </div>
              <div className="mt-2 h-1 rounded-full bg-muted overflow-hidden">
                <div className={cn("h-full rounded-full transition-all", c.bar)} style={{ width: `${score}%` }} />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
