import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { MetricCard } from "@/components/widgets/MetricCard";
import { RISK_DATA, CATEGORY_STYLES, formatNOK } from "@/components/widgets/BusinessRiskExposureWidget";
import { ArrowLeft, ChevronDown, TrendingUp, TrendingDown, ListChecks, ShieldAlert, Wallet, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { Sidebar } from "@/components/Sidebar";
import { useState } from "react";

export default function BusinessRiskDetail() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const isNb = i18n.language === "nb" || i18n.language === "no";

  const totalExposure = RISK_DATA.reduce((s, r) => s + r.exposure, 0);
  const totalMitigation = RISK_DATA.reduce((s, r) => s + r.mitigation_cost, 0);
  const totalResidual = RISK_DATA.reduce((s, r) => s + r.residual_exposure, 0);
  const totalSavings = totalExposure - totalResidual - totalMitigation;

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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <MetricCard
            title={isNb ? "Total risikoeksponering" : "Total risk exposure"}
            value={formatNOK(totalExposure)}
            subtitle={isNb ? "Estimert årlig tap (ALE)" : "Estimated annualized loss"}
            icon={ShieldAlert}
            className="border-destructive/20"
          />
          <MetricCard
            title={isNb ? "Total tiltakskostnad" : "Total mitigation cost"}
            value={formatNOK(totalMitigation)}
            subtitle={isNb ? "Engangsinvestering" : "One-time investment"}
            icon={Wallet}
          />
          <MetricCard
            title={isNb ? "Total besparelse" : "Total savings"}
            value={formatNOK(totalSavings)}
            subtitle={isNb ? "Årlig redusert risikokostnad" : "Annual reduced risk cost"}
            icon={Sparkles}
            className="border-emerald-500/20"
          />
        </div>

        {/* Risk list */}
        <div className="space-y-4">
          {RISK_DATA.map((r, idx) => (
            <RiskCard key={r.system} risk={r} rank={idx + 1} isNb={isNb} />
          ))}
        </div>
      </main>
    </div>
  );
}

function RiskCard({ risk, rank, isNb }: { risk: typeof RISK_DATA[0]; rank: number; isNb: boolean }) {
  const [open, setOpen] = useState(false);
  const cat = CATEGORY_STYLES[risk.category];
  const savings = risk.exposure - risk.residual_exposure - risk.mitigation_cost;
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
                    <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-medium", cat.className)}>
                      {isNb ? cat.label_no : cat.label_en}
                    </span>
                    {risk.trend === "up" && (
                      <span className="flex items-center gap-0.5 text-[10px] text-destructive">
                        <TrendingUp className="h-3 w-3" /> {isNb ? "Økende" : "Rising"}
                      </span>
                    )}
                    {risk.trend === "down" && (
                      <span className="flex items-center gap-0.5 text-[10px] text-emerald-600 dark:text-emerald-400">
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
                    <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
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
            {/* Stacked bar */}
            <div className="pt-4 space-y-2">
              <div className="flex h-4 rounded-full overflow-hidden bg-muted">
                <div
                  className="bg-destructive/70 transition-all"
                  style={{ width: `${(risk.residual_exposure / maxVal) * 100}%` }}
                  title={isNb ? "Restrisiko" : "Residual risk"}
                />
                <div
                  className="bg-amber-500/70 transition-all"
                  style={{ width: `${(risk.mitigation_cost / maxVal) * 100}%` }}
                  title={isNb ? "Tiltakskostnad" : "Mitigation cost"}
                />
                <div
                  className="bg-emerald-500/70 transition-all"
                  style={{ width: `${Math.max(0, savings) / maxVal * 100}%` }}
                  title={isNb ? "Besparelse" : "Savings"}
                />
              </div>
              <div className="flex flex-wrap gap-3 text-[11px]">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-destructive/70" />
                  {isNb ? "Restrisiko" : "Residual"}: {formatNOK(risk.residual_exposure)}
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500/70" />
                  {isNb ? "Tiltak" : "Mitigation"}: {formatNOK(risk.mitigation_cost)}
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/70" />
                  {isNb ? "Besparelse" : "Savings"}: {formatNOK(Math.max(0, savings))}
                </span>
              </div>
            </div>

            {/* Three columns */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
              <div className="rounded-lg border border-border p-3">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                  {isNb ? "Årlig risikokostnad" : "Annual risk cost"}
                </p>
                <p className="text-base font-bold text-destructive">{formatNOK(risk.exposure)}</p>
              </div>
              <div className="rounded-lg border border-border p-3">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                  {isNb ? "Tiltakskostnad" : "Mitigation cost"}
                </p>
                <p className="text-base font-bold text-foreground">{formatNOK(risk.mitigation_cost)}</p>
              </div>
              <div className="rounded-lg border border-border p-3">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                  {isNb ? "Besparelse" : "Savings"}
                </p>
                <p className="text-base font-bold text-emerald-600 dark:text-emerald-400">{formatNOK(Math.max(0, savings))}</p>
              </div>
            </div>

            {/* Action */}
            <div className="rounded-lg border border-border bg-muted/50 p-3">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
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
