import { useState } from "react";
import { Shield, Lock, Bot, TrendingUp, TrendingDown, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface DomainStatus {
  id: string;
  name: string;
  icon: React.ReactNode;
  status: "bra" | "ok" | "lav";
  score: number;
  slaPercentage: number;
  slaCurrent: number;
  slaTotal: number;
  trend: number;
}

const domainData: DomainStatus[] = [
  { 
    id: "privacy",
    name: "Personvern", 
    icon: <Shield className="h-4 w-4" />,
    status: "bra", 
    score: 82,
    slaPercentage: 85,
    slaCurrent: 17,
    slaTotal: 20,
    trend: 12
  },
  { 
    id: "infosec",
    name: "Informasjonssikkerhet", 
    icon: <Lock className="h-4 w-4" />,
    status: "ok", 
    score: 68,
    slaPercentage: 72,
    slaCurrent: 36,
    slaTotal: 50,
    trend: -5
  },
  { 
    id: "ai-governance",
    name: "AI Governance", 
    icon: <Bot className="h-4 w-4" />,
    status: "bra", 
    score: 78,
    slaPercentage: 90,
    slaCurrent: 9,
    slaTotal: 10,
    trend: 8
  },
];

const getStatusColor = (status: string) => {
  switch (status) {
    case "bra": return "text-success";
    case "ok": return "text-warning";
    case "lav": return "text-destructive";
    default: return "text-muted-foreground";
  }
};

const getStatusBg = (status: string) => {
  switch (status) {
    case "bra": return "bg-success/10 border-success/20";
    case "ok": return "bg-warning/10 border-warning/20";
    case "lav": return "bg-destructive/10 border-destructive/20";
    default: return "bg-muted border-border";
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case "bra": return "Bra";
    case "ok": return "OK";
    case "lav": return "Lav";
    default: return "";
  }
};

const getProgressColor = (status: string) => {
  switch (status) {
    case "bra": return "[&>div]:bg-success";
    case "ok": return "[&>div]:bg-warning";
    case "lav": return "[&>div]:bg-destructive";
    default: return "";
  }
};

export function StatusOverviewWidget() {
  const [expandedDomain, setExpandedDomain] = useState<string | null>(null);
  
  const totalScore = Math.round(
    domainData.reduce((acc, d) => acc + d.score, 0) / domainData.length
  );
  
  const overallSlaPercentage = Math.round(
    domainData.reduce((acc, d) => acc + d.slaPercentage, 0) / domainData.length
  );
  
  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-foreground">
            Hvordan ligger vi an?
          </CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">SLA-snitt:</span>
            <span className={`text-sm font-semibold ${overallSlaPercentage >= 80 ? "text-success" : overallSlaPercentage >= 60 ? "text-warning" : "text-destructive"}`}>
              {overallSlaPercentage}%
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {domainData.map((domain) => (
          <div 
            key={domain.id}
            className={`rounded-lg border transition-all ${getStatusBg(domain.status)}`}
          >
            <button
              onClick={() => setExpandedDomain(expandedDomain === domain.id ? null : domain.id)}
              className="w-full p-3 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${domain.status === "bra" ? "bg-success/20 text-success" : domain.status === "ok" ? "bg-warning/20 text-warning" : "bg-destructive/20 text-destructive"}`}>
                  {domain.icon}
                </div>
                <div className="text-left">
                  <span className="text-sm font-medium text-foreground">{domain.name}</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Progress 
                      value={domain.score} 
                      className={`h-1.5 w-24 ${getProgressColor(domain.status)}`}
                    />
                    <span className="text-xs text-muted-foreground">{domain.score}%</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-sm font-medium px-2 py-0.5 rounded ${getStatusColor(domain.status)} ${getStatusBg(domain.status)}`}>
                  {getStatusLabel(domain.status)}
                </span>
                <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${expandedDomain === domain.id ? "rotate-90" : ""}`} />
              </div>
            </button>
            
            {expandedDomain === domain.id && (
              <div className="px-3 pb-3 pt-0 border-t border-border/50">
                <div className="bg-background/50 rounded-lg p-3 mt-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-muted-foreground font-medium">SLA-oppnåelse</span>
                    <div className={`flex items-center gap-1 text-xs ${domain.trend > 0 ? "text-success" : "text-destructive"}`}>
                      {domain.trend > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      <span>{domain.trend > 0 ? "+" : ""}{domain.trend}%</span>
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-xl font-bold text-foreground">{domain.slaPercentage}%</span>
                    <span className="text-xs text-muted-foreground">
                      {domain.slaCurrent} av {domain.slaTotal} oppgaver i tide
                    </span>
                  </div>
                  <Progress 
                    value={domain.slaPercentage} 
                    className={`h-1 ${getProgressColor(domain.status)}`}
                  />
                </div>
              </div>
            )}
          </div>
        ))}
        
        <div className="pt-3 border-t border-border flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Totalt: <span className="text-foreground font-semibold">{totalScore}% på plass</span>
          </p>
          <p className="text-xs text-muted-foreground">
            Basert på {domainData.reduce((acc, d) => acc + d.slaTotal, 0)} oppgaver
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
