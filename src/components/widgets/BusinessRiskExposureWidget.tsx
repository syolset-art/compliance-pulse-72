import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { TrendingDown, TrendingUp, ArrowRight, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

type RiskCategory = "datatap" | "nedetid" | "regelverksbrudd" | "leverandorsvikt";

interface RiskItem {
  process: string;
  process_en: string;
  system: string;
  exposure: number;
  category: RiskCategory;
  probability: number; // 0-100
  consequence: number; // 0-100
  trend: "up" | "down" | "flat";
}

const RISK_DATA: RiskItem[] = [
  { process: "Ansettelsesprosess", process_en: "Hiring process", system: "HireVue", exposure: 1800000, category: "datatap", probability: 35, consequence: 90, trend: "up" },
  { process: "Kundedatasystem", process_en: "Customer data", system: "Salesforce", exposure: 1200000, category: "nedetid", probability: 20, consequence: 85, trend: "flat" },
  { process: "Økonomi", process_en: "Finance", system: "Visma", exposure: 650000, category: "regelverksbrudd", probability: 40, consequence: 55, trend: "down" },
  { process: "E-post", process_en: "Email", system: "Microsoft 365", exposure: 400000, category: "datatap", probability: 15, consequence: 60, trend: "flat" },
  { process: "Nettside", process_en: "Website", system: "Cloudflare", exposure: 200000, category: "nedetid", probability: 10, consequence: 40, trend: "down" },
];

const CATEGORY_STYLES: Record<RiskCategory, { label_no: string; label_en: string; className: string }> = {
  datatap: { label_no: "Datatap", label_en: "Data loss", className: "bg-destructive/15 text-destructive" },
  nedetid: { label_no: "Nedetid", label_en: "Downtime", className: "bg-orange-500/15 text-orange-600 dark:text-orange-400" },
  regelverksbrudd: { label_no: "Regelverksbrudd", label_en: "Regulatory breach", className: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400" },
  leverandorsvikt: { label_no: "Leverandørsvikt", label_en: "Vendor failure", className: "bg-purple-500/15 text-purple-600 dark:text-purple-400" },
};

function formatNOK(n: number) {
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
            {isNb ? "Estimert årlig risikoeksponering" : "Estimated annualized loss exposure"}
          </p>
        </div>
        <span className="text-lg font-bold text-destructive whitespace-nowrap">{formatNOK(total)}</span>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto space-y-2.5 pt-0">
        {RISK_DATA.map((r) => {
          const cat = CATEGORY_STYLES[r.category];
          const barWidth = Math.round((r.exposure / maxExposure) * 100);
          return (
            <div key={r.system} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="font-medium truncate">{isNb ? r.process : r.process_en}</span>
                  <span className="text-muted-foreground">/ {r.system}</span>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-medium", cat.className)}>
                    {isNb ? cat.label_no : cat.label_en}
                  </span>
                  {r.trend === "up" && <TrendingUp className="h-3 w-3 text-destructive" />}
                  {r.trend === "down" && <TrendingDown className="h-3 w-3 text-emerald-500" />}
                </div>
              </div>
              {/* Bar */}
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-destructive/70 transition-all"
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
                <span className="text-[11px] font-semibold tabular-nums w-24 text-right">
                  {formatNOK(r.exposure)}
                </span>
              </div>
            </div>
          );
        })}
      </CardContent>

      <div className="px-6 pb-4 pt-1">
        <Button variant="ghost" size="sm" className="w-full text-xs gap-1" onClick={() => navigate("/regulations")}>
          {isNb ? "Se full risikoanalyse" : "View full risk analysis"}
          <ArrowRight className="h-3 w-3" />
        </Button>
      </div>
    </Card>
  );
}
