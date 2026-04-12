import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Shield, Settings, KeyRound, Users, FileText } from "lucide-react";
import { useComplianceRequirements } from "@/hooks/useComplianceRequirements";
import { cn } from "@/lib/utils";

const PILLARS = [
  { key: "governance", icon: Shield, label_no: "Styring", label_en: "Governance" },
  { key: "operations", icon: Settings, label_no: "Drift og sikkerhet", label_en: "Operations & Security" },
  { key: "identity_access", icon: KeyRound, label_no: "Identitet og tilgang", label_en: "Identity & Access" },
  { key: "privacy_data", icon: FileText, label_no: "Personvern og datahåndtering", label_en: "Privacy & Data Handling" },
  { key: "supplier_ecosystem", icon: Users, label_no: "Tredjepartstyring og verdikjede", label_en: "Third-Party & Value Chain" },
] as const;

function maturityLabel(percent: number, isNb: boolean) {
  if (percent >= 67) return { label: isNb ? "Høy" : "High", className: "text-emerald-600 dark:text-emerald-400" };
  if (percent >= 34) return { label: isNb ? "Middels" : "Medium", className: "text-amber-600 dark:text-amber-400" };
  return { label: isNb ? "Lav" : "Low", className: "text-orange-600 dark:text-orange-400" };
}

export function SecurityFoundationsWidget() {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb" || i18n.language === "no";
  const { stats } = useComplianceRequirements({});

  const overall = stats.overallScore || { assessed: 0, total: 0, score: 0 };
  const byDomain = stats.byDomainArea || {};

  return (
    <Card>
      <CardHeader className="pb-3 pt-4 px-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            {isNb ? "Modenhet per kontrollområde" : "Maturity by control areas"}
          </CardTitle>
          <div className="flex items-center gap-2">
            <span className={cn("text-lg font-bold tabular-nums", maturityLabel(Math.round(overall.score), isNb).className)}>
              {Math.round(overall.score)}%
            </span>
            <Badge variant="outline" className={cn("text-[10px] h-5", maturityLabel(Math.round(overall.score), isNb).className)}>
              {maturityLabel(Math.round(overall.score), isNb).label}
            </Badge>
          </div>
        </div>
        <Progress value={overall.score} className="h-2 mt-2 [&>div]:bg-primary" />
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-0 space-y-4">

        {/* Mobile: compact list */}
        <div className="flex flex-col gap-2 sm:hidden">
          {PILLARS.map((pillar) => {
            const domainData = byDomain[pillar.key] || { score: 0, assessed: 0, total: 0 };
            const percent = Math.round(domainData.score || 0);
            const maturity = maturityLabel(percent, isNb);
            const Icon = pillar.icon;

            return (
              <div key={pillar.key} className="flex items-center gap-2">
                <div className="p-1 rounded-md bg-primary/10 shrink-0">
                  <Icon className="h-3.5 w-3.5 text-primary" />
                </div>
                <span className="text-xs font-medium text-foreground w-24 shrink-0 truncate">
                  {isNb ? pillar.label_no : pillar.label_en}
                </span>
                <Progress value={percent} className="h-1.5 flex-1 [&>div]:bg-primary" />
                <span className="text-xs font-semibold text-foreground w-8 text-right shrink-0">{percent}%</span>
                <span className={cn("text-[10px] font-medium w-10 text-right shrink-0", maturity.className)}>
                  {maturity.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Desktop: 2x2 pillar grid + last one full width */}
        <div className="hidden sm:grid sm:grid-cols-2 gap-3">
          {PILLARS.map((pillar, index) => {
            const domainData = byDomain[pillar.key] || { score: 0, assessed: 0, total: 0 };
            const percent = Math.round(domainData.score || 0);
            const maturity = maturityLabel(percent, isNb);
            const Icon = pillar.icon;

            return (
              <div
                key={pillar.key}
                className={cn(
                  "rounded-lg border border-border bg-card p-3 space-y-2",
                  index === PILLARS.length - 1 && PILLARS.length % 2 !== 0 && "col-span-2"
                )}
              >
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-primary/10">
                    <Icon className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <span className="text-sm font-medium text-foreground">
                    {isNb ? pillar.label_no : pillar.label_en}
                  </span>
                </div>
                <Progress value={percent} className="h-2 [&>div]:bg-primary" />
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    {domainData.assessed || 0}/{domainData.total || 0}{" "}
                    {isNb ? "målepunkter" : "controls"}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-foreground">{percent}%</span>
                    <span className={cn("font-medium", maturity.className)}>
                      {maturity.label}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
