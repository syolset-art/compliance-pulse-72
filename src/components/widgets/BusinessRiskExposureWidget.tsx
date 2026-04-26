import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { TrendingDown, TrendingUp, ArrowRight, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

export type RiskCategory = "datatap" | "nedetid" | "regelverksbrudd" | "leverandorsvikt";

export interface RiskItem {
  process: string;
  process_en: string;
  system: string;
  exposure: number;
  category: RiskCategory;
  probability: number;
  consequence: number;
  trend: "up" | "down" | "flat";
  mitigation_cost: number;
  mitigation_label_no: string;
  mitigation_label_en: string;
  residual_exposure: number;
}

export const RISK_DATA: RiskItem[] = [
  { process: "Ansettelsesprosess", process_en: "Hiring process", system: "HireVue", exposure: 1800000, category: "datatap", probability: 35, consequence: 90, trend: "up", mitigation_cost: 120000, mitigation_label_no: "Signer DPA og gjennomfør leverandørrevisjon", mitigation_label_en: "Sign DPA and conduct vendor audit", residual_exposure: 250000 },
  { process: "Kundedatasystem", process_en: "Customer data", system: "Salesforce", exposure: 1200000, category: "nedetid", probability: 20, consequence: 85, trend: "flat", mitigation_cost: 85000, mitigation_label_no: "Aktiver geo-redundant backup og BCP-test", mitigation_label_en: "Enable geo-redundant backup and BCP test", residual_exposure: 180000 },
  { process: "Økonomi", process_en: "Finance", system: "Visma", exposure: 650000, category: "regelverksbrudd", probability: 40, consequence: 55, trend: "down", mitigation_cost: 45000, mitigation_label_no: "Oppdater tilgangsstyring og aktiver logging", mitigation_label_en: "Update access controls and enable logging", residual_exposure: 100000 },
  { process: "E-post", process_en: "Email", system: "Microsoft 365", exposure: 400000, category: "datatap", probability: 15, consequence: 60, trend: "flat", mitigation_cost: 30000, mitigation_label_no: "Aktiver MFA og phishing-simulering", mitigation_label_en: "Enable MFA and phishing simulation", residual_exposure: 60000 },
  { process: "Nettside", process_en: "Website", system: "Cloudflare", exposure: 200000, category: "nedetid", probability: 10, consequence: 40, trend: "down", mitigation_cost: 20000, mitigation_label_no: "Sett opp WAF-regler og DDoS-beskyttelse", mitigation_label_en: "Set up WAF rules and DDoS protection", residual_exposure: 35000 },
];

export const CATEGORY_STYLES: Record<RiskCategory, { label_no: string; label_en: string; className: string }> = {
  datatap: { label_no: "Datatap", label_en: "Data loss", className: "bg-destructive/15 text-destructive" },
  nedetid: { label_no: "Nedetid", label_en: "Downtime", className: "bg-warning/15 text-warning dark:text-warning" },
  regelverksbrudd: { label_no: "Regelverksbrudd", label_en: "Regulatory breach", className: "bg-warning/15 text-warning dark:text-warning" },
  leverandorsvikt: { label_no: "Leverandørsvikt", label_en: "Vendor failure", className: "bg-accent/15 text-accent dark:text-accent" },
};

export function formatNOK(n: number) {
  return new Intl.NumberFormat("nb-NO", { style: "currency", currency: "NOK", maximumFractionDigits: 0 }).format(n);
}

export function BusinessRiskExposureWidget() {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb" || i18n.language === "no";

  const total = RISK_DATA.reduce((s, r) => s + r.exposure, 0);
  const maxExposure = RISK_DATA[0]?.exposure || 1;

  return (
    <Card variant="flat" className="flex flex-col">
      <CardHeader className="pb-2 flex-row items-start justify-between space-y-0">
        <div className="space-y-1">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-destructive" />
            {isNb ? "Forretningsrisiko (FAIR)" : "Business Risk (FAIR)"}
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            {isNb ? "Se hvor du taper penger på risiko" : "See where you lose money on risk"}
          </p>
        </div>
        <span className="text-lg font-bold text-destructive whitespace-nowrap">{formatNOK(total)}</span>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto space-y-2.5 pt-0">
        {RISK_DATA.map((r) => {
          const cat = CATEGORY_STYLES[r.category];
          const barWidth = Math.round((r.exposure / maxExposure) * 100);
          const savings = r.exposure - r.residual_exposure - r.mitigation_cost;
          return (
            <div
              key={r.system}
              className="space-y-1 cursor-pointer rounded-lg p-1.5 -mx-1.5 hover:bg-accent/50 transition-colors"
              onClick={() => navigate("/risk")}
            >
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="font-medium truncate">{isNb ? r.process : r.process_en}</span>
                  <span className="text-muted-foreground">/ {r.system}</span>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <span className={cn("px-1.5 py-0.5 rounded text-[13px] font-medium", cat.className)}>
                    {isNb ? cat.label_no : cat.label_en}
                  </span>
                  {r.trend === "up" && <TrendingUp className="h-3 w-3 text-destructive" />}
                  {r.trend === "down" && <TrendingDown className="h-3 w-3 text-status-closed" />}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-destructive/70 transition-all"
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
                <span className="text-[13px] font-semibold tabular-nums w-20 text-right">
                  {formatNOK(r.exposure)}
                </span>
                {savings > 0 && (
                  <span className="text-[13px] font-medium text-status-closed dark:text-status-closed tabular-nums w-20 text-right">
                    +{formatNOK(savings)}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </CardContent>

      <div className="px-6 pb-4 pt-1">
        <Button variant="ghost" size="sm" className="w-full text-xs gap-1" onClick={() => navigate("/risk")}>
          {isNb ? "Se prioriterte tiltak" : "View prioritized actions"}
          <ArrowRight className="h-3 w-3" />
        </Button>
      </div>
    </Card>
  );
}
