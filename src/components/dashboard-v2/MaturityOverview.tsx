import { useTranslation } from "react-i18next";
import { Progress } from "@/components/ui/progress";

interface FocusArea {
  label_no: string;
  label_en: string;
  percent: number;
}

interface MaturityOverviewProps {
  focusAreas: FocusArea[];
}

export function MaturityOverview({ focusAreas }: MaturityOverviewProps) {
  const { i18n } = useTranslation();
  const isNorwegian = i18n.language === "nb" || i18n.language === "no";

  return (
    <div className="rounded-2xl border border-border bg-card p-5 h-full">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
        {isNorwegian ? "Modenhet per fokusområde" : "Maturity by focus area"}
      </h3>
      <div className="space-y-3">
        {focusAreas.map((area) => (
          <div key={area.label_en} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-foreground">{isNorwegian ? area.label_no : area.label_en}</span>
              <span className="text-muted-foreground">{area.percent}%</span>
            </div>
            <Progress value={area.percent} className="h-1.5" />
          </div>
        ))}
      </div>
    </div>
  );
}
