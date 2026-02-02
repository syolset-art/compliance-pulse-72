import { Bot, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";
import { useComplianceRequirements } from "@/hooks/useComplianceRequirements";
import { cn } from "@/lib/utils";

interface AIWorkingWidgetProps {
  frameworkId?: string;
  className?: string;
}

// Demo work items showing what Lara is currently doing
const AI_WORK_DESCRIPTIONS: Record<string, { no: string; en: string }> = {
  'A.5.7': {
    no: 'Henter data fra Snyk og 7Security...',
    en: 'Fetching data from Snyk and 7Security...'
  },
  'A.8.9': {
    no: 'Analyserer GitHub-repositorier...',
    en: 'Analyzing GitHub repositories...'
  },
  'A.5.23': {
    no: 'Kartlegger Azure og AWS-konfigurasjoner...',
    en: 'Mapping Azure and AWS configurations...'
  },
  'Art.9': {
    no: 'Bygger AI-risikostyringsoversikt...',
    en: 'Building AI risk management overview...'
  },
  'Art.10': {
    no: 'Analyserer datakvalitet for AI-modeller...',
    en: 'Analyzing data quality for AI models...'
  },
  'default': {
    no: 'Analyserer tilgjengelig data...',
    en: 'Analyzing available data...'
  }
};

export function AIWorkingWidget({ frameworkId, className }: AIWorkingWidgetProps) {
  const { t, i18n } = useTranslation();
  const isNorwegian = i18n.language === 'nb';
  
  const { requirements, isLoading } = useComplianceRequirements({
    frameworkId
  });

  // Get requirements that are in progress with AI handling
  const aiWorkingItems = requirements
    .filter(req => req.status === 'in_progress' && (req.is_ai_handling || req.agent_capability === 'full'))
    .slice(0, 4); // Show max 4 items

  if (isLoading || aiWorkingItems.length === 0) {
    return null;
  }

  return (
    <Card className={cn("border-primary/20 bg-gradient-to-br from-card to-primary/5", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            {isNorwegian ? "Lara jobber nå" : "Lara is working now"}
          </CardTitle>
          <Badge variant="outline" className="text-xs gap-1.5 bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Live
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {aiWorkingItems.map((item) => {
          const workDesc = AI_WORK_DESCRIPTIONS[item.requirement_id] || AI_WORK_DESCRIPTIONS['default'];
          
          return (
            <div key={item.requirement_id} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-3.5 w-3.5 text-primary animate-spin" />
                  <span className="text-sm font-medium text-foreground">
                    {item.requirement_id}
                  </span>
                  <span className="text-sm text-muted-foreground truncate max-w-[200px]">
                    {isNorwegian ? item.name_no : item.name}
                  </span>
                </div>
                <span className="text-sm font-medium text-primary tabular-nums">
                  {item.progress_percent}%
                </span>
              </div>
              <div className="space-y-1">
                <Progress value={item.progress_percent} className="h-1.5" />
                <p className="text-xs text-muted-foreground">
                  {isNorwegian ? workDesc.no : workDesc.en}
                </p>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
