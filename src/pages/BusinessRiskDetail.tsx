import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { MetricCard } from "@/components/widgets/MetricCard";
import { RISK_DATA, CATEGORY_STYLES, formatNOK } from "@/components/widgets/BusinessRiskExposureWidget";
import type { RiskItem } from "@/components/widgets/BusinessRiskExposureWidget";
import { ArrowLeft, ChevronDown, TrendingUp, TrendingDown, ListChecks, ShieldAlert, Wallet, Sparkles, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { Sidebar } from "@/components/Sidebar";
import { useState, useMemo } from "react";

const getRoi = (r: RiskItem) => {
  const savings = r.exposure - r.residual_exposure - r.mitigation_cost;
  return r.mitigation_cost > 0 ? savings / r.mitigation_cost : 0;
};

export default function BusinessRiskDetail() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const isNb = i18n.language === "nb" || i18n.language === "no";

  const sortedByRoi = useMemo(() => [...RISK_DATA].sort((a, b) => getRoi(b) - getRoi(a)), []);

  const totalExposure = RISK_DATA.reduce((s, r) => s + r.exposure, 0);
  const totalMitigation = RISK_DATA.reduce((s, r) => s + r.mitigation_cost, 0);
  const totalResidual = RISK_DATA.reduce((s, r) => s + r.residual_exposure, 0);
  const totalSavings = totalExposure - totalResidual - totalMitigation;
  const avgRoi = RISK_DATA.length > 0 ? RISK_DATA.reduce((s, r) => s + getRoi(r), 0) / RISK_DATA.length : 0;

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 p-4 md:p-8 overflow-y-auto pt-11">
        <Button variant="ghost" size="sm" className="mb-4 gap-1 text-muted-foreground" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
          {isNb ? "Tilbake" : "Back"}
        </Button>

        <div className="mb-6">
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-destructive" />
            {isNb ? "Forretningsrisiko – Prioriterte tiltak" : "Business Risk – Prioritized Actions"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isNb
              ? "Se hvor organisasjonen taper penger på risiko, og hva det koster å fikse det."
              : "See where your organization loses money on risk, and what it costs to fix it."}
          </p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <MetricCard
            title={isNb ? "Total risikoeksponering" : "Total risk exposure"}
            value={formatNOK(totalExposure)}
            subtitle={isNb ? "Estimert årlig tap" : "Estimated annual loss"}
            icon={ShieldAlert}
            className="border-destructive/20"
          />
          <MetricCard
            title={isNb ? "Tiltakskostnad" : "Mitigation cost"}
            value={formatNOK(totalMitigation)}
            subtitle={isNb ? "Engangsinvestering" : "One-time investment"}
            icon={Wallet}
          />
          <MetricCard
            title={isNb ? "Besparelse" : "Savings"}
            value={formatNOK(totalSavings)}
            subtitle={isNb ? "Årlig redusert risiko" : "Annual reduced risk"}
            icon={Sparkles}
            className="border-status-closed/20"
          />
          <MetricCard
            title={isNb ? "Snitt ROI" : "Avg ROI"}
            value={`${avgRoi.toFixed(1)}×`}
            subtitle={isNb ? "Avkastning per tiltak" : "Return per measure"}
            icon={Target}
            className="border-primary/20"
          />
        </div>

        {/* Risk matrix */}
        <RiskMatrix risks={RISK_DATA} isNb={isNb} />

        {/* ROI ranking table */}
        <RoiTable risks={sortedByRoi} isNb={isNb} />

        {/* Risk detail cards */}
        <div className="space-y-3 mt-6">
          <h2 className="text-sm font-semibold text-foreground">
            {isNb ? "Detaljert tiltaksliste (sortert etter ROI)" : "Detailed actions (sorted by ROI)"}
          </h2>
          {sortedByRoi.map((r, idx) => (
            <RiskCard key={r.system} risk={r} rank={idx + 1} isNb={isNb} />
          ))}
        </div>
      </main>
    </div>
  );
}

/* ── Risk Matrix ── */

function RiskMatrix({ risks, isNb }: { risks: RiskItem[]; isNb: boolean }) {
  const maxExposure = Math.max(...risks.map(r => r.exposure));

  return (
    <Card className="mb-6">
      <CardContent className="p-4 md:p-6">
        <h2 className="text-sm font-semibold text-foreground mb-1">
          {isNb ? "Risikomatrise – Sannsynlighet × Konsekvens" : "Risk Matrix – Probability × Consequence"}
        </h2>
        <p className="text-xs text-muted-foreground mb-4">
          {isNb ? "Størrelse = eksponering. Risikoer i øvre høyre hjørne krever umiddelbar handling." : "Size = exposure. Risks in the upper right require immediate action."}
        </p>

        <div className="relative w-full" style={{ paddingBottom: "60%" }}>
          {/* Background zones */}
          <div className="absolute inset-0 rounded-lg overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-tr from-status-closed/10 via-warning/10 to-destructive/15 rounded-lg" />
            {/* Grid lines */}
            {[25, 50, 75].map(v => (
              <div key={`h-${v}`} className="absolute left-0 right-0 border-t border-border/30" style={{ bottom: `${v}%` }} />
            ))}
            {[25, 50, 75].map(v => (
              <div key={`v-${v}`} className="absolute top-0 bottom-0 border-l border-border/30" style={{ left: `${v}%` }} />
            ))}
          </div>

          {/* Axis labels */}
          <div className="absolute -left-0 top-0 bottom-0 flex items-center">
            <span className="text-[13px] text-muted-foreground font-medium -rotate-90 whitespace-nowrap">
              {isNb ? "Konsekvens %" : "Consequence %"}
            </span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 flex justify-center">
            <span className="text-[13px] text-muted-foreground font-medium translate-y-4">
              {isNb ? "Sannsynlighet %" : "Probability %"}
            </span>
          </div>

          {/* Scale labels */}
          <span className="absolute left-1 bottom-0 text-[13px] text-muted-foreground">0</span>
          <span className="absolute right-0 bottom-0 text-[13px] text-muted-foreground">50%</span>
          <span className="absolute left-1 top-0 text-[13px] text-muted-foreground">100%</span>

          {/* Risk dots */}
          {risks.map((r) => {
            const cat = CATEGORY_STYLES[r.category];
            const size = 24 + (r.exposure / maxExposure) * 32;
            const left = (r.probability / 50) * 100;
            const bottom = (r.consequence / 100) * 100;
            return (
              <div
                key={r.system}
                className="absolute group z-10"
                style={{
                  left: `${Math.min(95, Math.max(5, left))}%`,
                  bottom: `${Math.min(95, Math.max(5, bottom))}%`,
                  transform: "translate(-50%, 50%)",
                }}
              >
                <div
                  className={cn(
                    "rounded-full border-2 border-background shadow-md flex items-center justify-center transition-transform hover:scale-125",
                    r.category === "datatap" ? "bg-destructive/80" :
                    r.category === "nedetid" ? "bg-warning/80" :
                    r.category === "regelverksbrudd" ? "bg-warning/80" :
                    "bg-accent/80"
                  )}
                  style={{ width: size, height: size }}
                />
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-20">
                  <div className="bg-popover border border-border rounded-lg shadow-lg p-2 text-xs whitespace-nowrap">
                    <p className="font-semibold text-foreground">{r.system}</p>
                    <p className="text-muted-foreground">{isNb ? r.process : r.process_en}</p>
                    <p className="text-destructive font-medium mt-1">{formatNOK(r.exposure)}</p>
                    <p className="text-muted-foreground">
                      {isNb ? "Sannsynlighet" : "Probability"}: {r.probability}% · {isNb ? "Konsekvens" : "Consequence"}: {r.consequence}%
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 mt-6 pt-3 border-t border-border">
          {(Object.entries(CATEGORY_STYLES) as [string, typeof CATEGORY_STYLES[keyof typeof CATEGORY_STYLES]][]).map(([key, cat]) => (
            <div key={key} className="flex items-center gap-1.5">
              <div className={cn("w-3 h-3 rounded-full",
                key === "datatap" ? "bg-destructive/80" :
                key === "nedetid" ? "bg-warning/80" :
                key === "regelverksbrudd" ? "bg-warning/80" :
                "bg-accent/80"
              )} />
              <span className="text-[13px] text-muted-foreground">{isNb ? cat.label_no : cat.label_en}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/* ── ROI Table ── */

function RoiTable({ risks, isNb }: { risks: RiskItem[]; isNb: boolean }) {
  return (
    <Card>
      <CardContent className="p-4 md:p-6">
        <h2 className="text-sm font-semibold text-foreground mb-1">
          {isNb ? "ROI-rangering – Beste avkastning først" : "ROI Ranking – Best return first"}
        </h2>
        <p className="text-xs text-muted-foreground mb-4">
          {isNb ? "Hvilke tiltak gir mest igjen for pengene?" : "Which measures give the best return on investment?"}
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 pr-2 font-medium text-muted-foreground">#</th>
                <th className="text-left py-2 pr-2 font-medium text-muted-foreground">{isNb ? "Tiltak" : "Action"}</th>
                <th className="text-left py-2 pr-2 font-medium text-muted-foreground">{isNb ? "System" : "System"}</th>
                <th className="text-right py-2 pr-2 font-medium text-muted-foreground">{isNb ? "Kostnad" : "Cost"}</th>
                <th className="text-right py-2 pr-2 font-medium text-muted-foreground">{isNb ? "Besparelse" : "Savings"}</th>
                <th className="text-right py-2 font-medium text-muted-foreground">ROI</th>
              </tr>
            </thead>
            <tbody>
              {risks.map((r, i) => {
                const savings = r.exposure - r.residual_exposure - r.mitigation_cost;
                const roi = getRoi(r);
                return (
                  <tr key={r.system} className="border-b border-border/50 hover:bg-accent/30 transition-colors">
                    <td className="py-2.5 pr-2 font-bold text-muted-foreground">{i + 1}</td>
                    <td className="py-2.5 pr-2 text-foreground max-w-[200px] truncate">
                      {isNb ? r.mitigation_label_no : r.mitigation_label_en}
                    </td>
                    <td className="py-2.5 pr-2 text-muted-foreground">{r.system}</td>
                    <td className="py-2.5 pr-2 text-right tabular-nums">{formatNOK(r.mitigation_cost)}</td>
                    <td className="py-2.5 pr-2 text-right tabular-nums text-status-closed dark:text-status-closed">
                      {formatNOK(Math.max(0, savings))}
                    </td>
                    <td className="py-2.5 text-right">
                      <span className={cn(
                        "px-1.5 py-0.5 rounded font-semibold tabular-nums",
                        roi >= 8 ? "bg-status-closed/15 text-status-closed dark:text-status-closed" :
                        roi >= 4 ? "bg-warning/15 text-warning dark:text-warning" :
                        "bg-warning/15 text-warning dark:text-warning"
                      )}>
                        {roi.toFixed(1)}×
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

/* ── Risk Card ── */

function RiskCard({ risk, rank, isNb }: { risk: RiskItem; rank: number; isNb: boolean }) {
  const [open, setOpen] = useState(false);
  const cat = CATEGORY_STYLES[risk.category];
  const savings = risk.exposure - risk.residual_exposure - risk.mitigation_cost;
  const roi = getRoi(risk);
  const maxVal = risk.exposure;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardContent className="p-4 cursor-pointer hover:bg-accent/30 transition-colors">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-lg font-bold text-muted-foreground w-6 text-center flex-shrink-0">
                  {rank}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {isNb ? risk.process : risk.process_en}{" "}
                    <span className="text-muted-foreground font-normal">/ {risk.system}</span>
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={cn("px-1.5 py-0.5 rounded text-[13px] font-medium", cat.className)}>
                      {isNb ? cat.label_no : cat.label_en}
                    </span>
                    <span className={cn(
                      "px-1.5 py-0.5 rounded text-[13px] font-semibold tabular-nums",
                      roi >= 8 ? "bg-status-closed/15 text-status-closed dark:text-status-closed" :
                      roi >= 4 ? "bg-warning/15 text-warning dark:text-warning" :
                      "bg-warning/15 text-warning dark:text-warning"
                    )}>
                      ROI {roi.toFixed(1)}×
                    </span>
                    {risk.trend === "up" && (
                      <span className="flex items-center gap-0.5 text-[13px] text-destructive">
                        <TrendingUp className="h-3 w-3" /> {isNb ? "Økende" : "Rising"}
                      </span>
                    )}
                    {risk.trend === "down" && (
                      <span className="flex items-center gap-0.5 text-[13px] text-status-closed dark:text-status-closed">
                        <TrendingDown className="h-3 w-3" /> {isNb ? "Synkende" : "Declining"}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="text-right">
                  <p className="text-sm font-bold text-destructive">{formatNOK(risk.exposure)}</p>
                  {savings > 0 && (
                    <p className="text-xs font-medium text-status-closed dark:text-status-closed">
                      {isNb ? "Spar" : "Save"} {formatNOK(savings)}
                    </p>
                  )}
                </div>
                <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", open && "rotate-180")} />
              </div>
            </div>
          </CardContent>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-4 pb-4 pt-0 space-y-4 border-t border-border">
            <div className="pt-4 space-y-2">
              <div className="flex h-4 rounded-full overflow-hidden bg-muted">
                <div className="bg-destructive/70 transition-all" style={{ width: `${(risk.residual_exposure / maxVal) * 100}%` }} />
                <div className="bg-warning/70 transition-all" style={{ width: `${(risk.mitigation_cost / maxVal) * 100}%` }} />
                <div className="bg-status-closed/70 transition-all" style={{ width: `${Math.max(0, savings) / maxVal * 100}%` }} />
              </div>
              <div className="flex flex-wrap gap-3 text-[13px]">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-destructive/70" />
                  {isNb ? "Restrisiko" : "Residual"}: {formatNOK(risk.residual_exposure)}
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-warning/70" />
                  {isNb ? "Tiltak" : "Mitigation"}: {formatNOK(risk.mitigation_cost)}
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-status-closed/70" />
                  {isNb ? "Besparelse" : "Savings"}: {formatNOK(Math.max(0, savings))}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
              <div className="rounded-lg border border-border p-3">
                <p className="text-[13px] uppercase tracking-wider text-muted-foreground mb-1">
                  {isNb ? "Sannsynlighet" : "Probability"}
                </p>
                <p className="text-base font-bold text-foreground">{risk.probability}%</p>
              </div>
              <div className="rounded-lg border border-border p-3">
                <p className="text-[13px] uppercase tracking-wider text-muted-foreground mb-1">
                  {isNb ? "Konsekvens" : "Consequence"}
                </p>
                <p className="text-base font-bold text-foreground">{risk.consequence}%</p>
              </div>
              <div className="rounded-lg border border-border p-3">
                <p className="text-[13px] uppercase tracking-wider text-muted-foreground mb-1">
                  {isNb ? "Tiltakskostnad" : "Mitigation cost"}
                </p>
                <p className="text-base font-bold text-foreground">{formatNOK(risk.mitigation_cost)}</p>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-muted/50 p-3">
              <p className="text-[13px] uppercase tracking-wider text-muted-foreground mb-1">
                {isNb ? "Anbefalt tiltak" : "Recommended action"}
              </p>
              <p className="text-sm text-foreground">
                {isNb ? risk.mitigation_label_no : risk.mitigation_label_en}
              </p>
            </div>

            <Button
              size="sm"
              variant="outline"
              className="w-full gap-1.5 text-xs"
              onClick={(e) => {
                e.stopPropagation();
                toast({
                  title: isNb ? "Oppgave opprettet" : "Task created",
                  description: isNb ? risk.mitigation_label_no : risk.mitigation_label_en,
                });
              }}
            >
              <ListChecks className="h-3.5 w-3.5" />
              {isNb ? "Opprett oppgave" : "Create task"}
            </Button>
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
