import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Building2, Pencil, Plus, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { getCriticality } from "@/lib/criticality";
import { computeRisk } from "@/lib/derivedRisk";
import { cn } from "@/lib/utils";

interface Props {
  isNb: boolean;
  readOnly?: boolean;
}

const CRIT_ORDER: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };

export function CriticalVendorsSection({ isNb, readOnly = false }: Props) {
  const navigate = useNavigate();

  const { data: vendors = [], isLoading } = useQuery({
    queryKey: ["trust-profile-critical-vendors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assets")
        .select("id, name, description, criticality, risk_level, compliance_score, vendor_category, category, country")
        .eq("asset_type", "vendor");
      if (error) throw error;
      return data ?? [];
    },
  });

  const ranked = [...vendors]
    .map((v: any) => {
      const crit = getCriticality(v);
      const risk = computeRisk({
        criticality: v.criticality || v.risk_level,
        complianceScore: v.compliance_score,
        country: v.country,
      });
      return { v, crit, risk };
    })
    .sort((a, b) => {
      const ca = a.crit ? CRIT_ORDER[a.crit.key] : 9;
      const cb = b.crit ? CRIT_ORDER[b.crit.key] : 9;
      if (ca !== cb) return ca - cb;
      return b.risk.score - a.risk.score;
    });

  const topFive = ranked.slice(0, 5);
  const moreCount = Math.max(0, ranked.length - topFive.length);

  const riskTone = (grade: "low" | "medium" | "high") =>
    grade === "high"
      ? "bg-destructive/10 text-destructive border-destructive/30"
      : grade === "medium"
      ? "bg-warning/10 text-warning border-warning/40"
      : "bg-success/10 text-success border-success/30";

  const riskLabel = (grade: "low" | "medium" | "high") =>
    isNb
      ? grade === "high" ? "Høy risiko" : grade === "medium" ? "Moderat risiko" : "Lav risiko"
      : grade === "high" ? "High risk" : grade === "medium" ? "Moderate risk" : "Low risk";

  return (
    <>
      <section id="tc-section-vendors" className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-5 py-3.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Building2 className="h-4 w-4 text-primary shrink-0" />
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-foreground">
                {isNb ? "Kritiske leverandører" : "Critical vendors"}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isNb
                  ? "Tredjeparter med høyest kritikalitet for virksomheten"
                  : "Third parties with highest criticality"}
              </p>
            </div>
          </div>
          {!readOnly && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1.5 text-xs shrink-0"
              onClick={() => navigate("/vendors")}
            >
              <Pencil className="h-3 w-3" />
              {isNb ? "Administrer" : "Manage"}
            </Button>
          )}
        </div>

        <div className="divide-y divide-border border-t border-border">
          {isLoading && (
            <div className="px-5 py-6 text-xs text-muted-foreground">
              {isNb ? "Henter leverandører…" : "Loading vendors…"}
            </div>
          )}

          {!isLoading && topFive.length === 0 && (
            <div className="px-5 py-6 flex items-center justify-between gap-4">
              <p className="text-sm text-muted-foreground">
                {isNb
                  ? "Ingen leverandører er kartlagt ennå."
                  : "No vendors have been mapped yet."}
              </p>
              {!readOnly && (
                <Button size="sm" variant="outline" className="gap-1.5" onClick={() => navigate("/vendors")}>
                  <Plus className="h-3.5 w-3.5" />
                  {isNb ? "Legg til" : "Add"}
                </Button>
              )}
            </div>
          )}

          {!isLoading &&
            topFive.map(({ v, crit, risk }) => {
              const meta = [v.vendor_category || v.category, v.country].filter(Boolean).join(" · ");
              const clickable = !readOnly;
              return (
                <div
                  key={v.id}
                  className={cn(
                    "px-5 py-3 flex items-center gap-3 transition-colors",
                    clickable && "hover:bg-muted/40 cursor-pointer"
                  )}
                  onClick={clickable ? () => navigate(`/vendors/${v.id}`) : undefined}
                >
                  <div className="h-8 w-8 rounded-md bg-muted text-muted-foreground flex items-center justify-center shrink-0">
                    <Building2 className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground truncate">{v.name}</p>
                    {meta && <p className="text-xs text-muted-foreground truncate">{meta}</p>}
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    {crit && (
                      <span
                        className={cn(
                          "inline-flex items-center text-[11px] px-2 py-0.5 rounded-full",
                          crit.pillClass
                        )}
                      >
                        {isNb ? crit.labelNb : crit.labelEn}
                      </span>
                    )}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border",
                            riskTone(risk.grade)
                          )}
                        >
                          <Sparkles className="h-2.5 w-2.5" />
                          {riskLabel(risk.grade)}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="left" className="max-w-[260px] text-[12px]">
                        {isNb ? "Avledet av Mynder/Lara fra data" : "Derived by Mynder/Lara from data"}
                        {risk.reasons.length > 0 && (
                          <ul className="mt-1 list-disc pl-4 space-y-0.5">
                            {risk.reasons.slice(0, 3).map((r, i) => (
                              <li key={i}>{r}</li>
                            ))}
                          </ul>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              );
            })}

          {moreCount > 0 && !readOnly && (
            <button
              onClick={() => navigate("/vendors")}
              className="w-full px-5 py-2.5 text-xs text-primary hover:bg-muted/40 text-left"
            >
              {isNb ? `Vis alle (${ranked.length})` : `View all (${ranked.length})`}
            </button>
          )}
        </div>
      </section>
      <div className="border-t border-border" />
    </>
  );
}
