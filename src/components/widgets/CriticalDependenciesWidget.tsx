import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Brain, AlertTriangle, ChevronRight, Cpu, Workflow } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

const AI_SYSTEMS = [
  { name: "ChatGPT Enterprise", risk: "high", processes: 3, provider: "OpenAI" },
  { name: "Copilot for M365", risk: "limited", processes: 5, provider: "Microsoft" },
  { name: "Salesforce Einstein", risk: "limited", processes: 2, provider: "Salesforce" },
  { name: "CV Screening Tool", risk: "high", processes: 1, provider: "HireVue" },
];

const CRITICAL_PROCESSES = [
  { name: "Ansettelsesprosess", systems: 2, riskLevel: "high" },
  { name: "Kundekredittvurdering", systems: 1, riskLevel: "high" },
  { name: "Innholdsproduksjon", systems: 3, riskLevel: "limited" },
];

const riskColors: Record<string, string> = {
  high: "bg-destructive/10 text-destructive border-destructive/20",
  limited: "bg-warning/10 text-warning border-warning/20",
  minimal: "bg-muted text-muted-foreground border-border",
};

const riskLabels: Record<string, string> = {
  high: "Høy risiko",
  limited: "Begrenset",
  minimal: "Minimal",
};

export function CriticalDependenciesWidget() {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Brain className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                {isNb ? "AI Act – Systemavhengigheter" : "AI Act – System Dependencies"}
              </h3>
              <p className="text-xs text-muted-foreground">
                {AI_SYSTEMS.filter(s => s.risk === "high").length} {isNb ? "høyrisikosystemer" : "high-risk systems"}
              </p>
            </div>
          </div>
        </div>

        {/* AI Systems with risk */}
        <div className="space-y-2 mb-4">
          {AI_SYSTEMS.map((sys) => (
            <div
              key={sys.name}
              className="flex items-center justify-between p-2.5 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer"
              onClick={() => navigate("/ai-registry")}
            >
              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                <Cpu className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{sys.name}</p>
                  <p className="text-[13px] text-muted-foreground">{sys.provider} · {sys.processes} {isNb ? "prosesser" : "processes"}</p>
                </div>
              </div>
              <Badge variant="outline" className={`text-[13px] shrink-0 ${riskColors[sys.risk]}`}>
                {riskLabels[sys.risk]}
              </Badge>
            </div>
          ))}
        </div>

        {/* Critical processes */}
        <div className="border-t border-border pt-3">
          <p className="text-[13px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
            {isNb ? "Kritiske prosesser" : "Critical processes"}
          </p>
          <div className="space-y-1.5">
            {CRITICAL_PROCESSES.map((proc) => (
              <div key={proc.name} className="flex items-center justify-between py-1.5">
                <div className="flex items-center gap-2">
                  <Workflow className="h-3 w-3 text-muted-foreground" />
                  <span className="text-sm text-foreground">{proc.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  {proc.riskLevel === "high" && (
                    <AlertTriangle className="h-3 w-3 text-destructive" />
                  )}
                  <span className="text-xs text-muted-foreground">{proc.systems} sys</span>
                  <ChevronRight className="h-3 w-3 text-muted-foreground" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="w-full mt-3 gap-1.5 text-xs"
          onClick={() => navigate("/ai-registry")}
        >
          {isNb ? "Se AI-registeret" : "View AI Registry"}
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </CardContent>
    </Card>
  );
}
