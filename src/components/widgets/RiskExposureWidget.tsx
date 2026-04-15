import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const RISK_DATA = [
  { level: "High", count: 2, color: "bg-destructive", textColor: "text-destructive" },
  { level: "Medium", count: 5, color: "bg-orange-500", textColor: "text-orange-500" },
  { level: "Low", count: 9, color: "bg-emerald-500", textColor: "text-emerald-500" },
];

const TOP_RISK = "Recruitment process – unauthorized access to candidate data";

export function RiskExposureWidget() {
  const navigate = useNavigate();
  const total = RISK_DATA.reduce((s, r) => s + r.count, 0);

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          <h3 className="text-sm font-semibold text-foreground">Risk Exposure</h3>
        </div>

        <div className="space-y-2.5 mb-4">
          {RISK_DATA.map((r) => (
            <div key={r.level} className="flex items-center gap-3">
              <div className={`w-2.5 h-2.5 rounded-full ${r.color} flex-shrink-0`} />
              <span className="text-sm text-foreground flex-1">
                <span className="font-semibold">{r.count}</span> {r.level} risks
              </span>
              <div className="w-20 h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full ${r.color}`}
                  style={{ width: `${(r.count / total) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-lg border border-border bg-muted/50 p-3 mb-3">
          <p className="text-[13px] font-medium text-muted-foreground uppercase tracking-wider mb-1">
            Top risk
          </p>
          <p className="text-xs text-foreground leading-relaxed">{TOP_RISK}</p>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="w-full gap-1.5 text-xs"
          onClick={() => navigate("/controls")}
        >
          Manage risks
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </CardContent>
    </Card>
  );
}
