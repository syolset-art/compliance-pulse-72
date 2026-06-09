import { useTranslation } from "react-i18next";
import { Shield, Lock, Globe, Layers, ChevronDown } from "lucide-react";
import { useTrustControlEvaluation } from "@/hooks/useTrustControlEvaluation";
import { cn } from "@/lib/utils";

interface Props {
  assetId: string;
}

const AREAS = [
  { key: "governance",          icon: Shield, nb: "Styring og ansvar",            en: "Governance & Accountability" },
  { key: "operations",     icon: Lock,   nb: "Sikkerhet",                    en: "Security" },
  { key: "identityAccess",    icon: Globe,  nb: "Personvern og datahåndtering", en: "Privacy & Data Handling" },
  { key: "vendor", icon: Layers, nb: "Tredjepart og verdikjede",     en: "Third-Party & Supply Chain" },
] as const;

function colorFor(score: number, areaKey: string) {
  const thresholds: Record<string, { green: number; orange: number }> = {
    governance:          { green: 75, orange: 40 },
    risk_compliance:     { green: 75, orange: 30 },
    security_posture:    { green: 60, orange: 40 },
    supplier_governance: { green: 75, orange: 50 },
  };
  const t = thresholds[areaKey] ?? { green: 75, orange: 50 };
  if (score >= t.green)  return { text: "text-success", bar: "bg-success" };
  if (score >= t.orange) return { text: "text-warning", bar: "bg-warning" };
  return { text: "text-destructive", bar: "bg-destructive" };
}

/**
 * Standard Trust Profile-blokk: kompakt 2x2-grid med modenhet per kontrollområde.
 * Brukes på alle Trust Profil-maler (leverandører + systemer).
 */
export function AssetMaturityByDomainCard({ assetId }: Props) {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb" || i18n.language === "no";
  const evaluation = useTrustControlEvaluation(assetId);

  if (!evaluation) {
    return (
      <div className="rounded-2xl border border-border bg-card p-5">
        <p className="text-sm text-muted-foreground italic">{isNb ? "Laster modenhet…" : "Loading maturity…"}</p>
      </div>
    );
  }

  const overall = evaluation.trustScore;
  const overallColor = colorFor(overall, "overall");

  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Shield className="h-4 w-4 text-primary shrink-0" />
          <h3 className="text-sm font-semibold text-foreground">
            {isNb ? "Modenhet per kontrollområde" : "Maturity by control area"}
          </h3>
        </div>
        <p className="text-sm text-muted-foreground shrink-0">
          {isNb ? "Trust Score" : "Trust Score"}{" "}
          <span className={cn("text-base font-bold tabular-nums", overallColor.text)}>{overall}</span>
          <span className="text-muted-foreground">/100</span>
        </p>
      </div>

      {/* 2x2 grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {AREAS.map(({ key, icon: Icon, nb, en }) => {
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
                  {isNb ? nb : en}
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
