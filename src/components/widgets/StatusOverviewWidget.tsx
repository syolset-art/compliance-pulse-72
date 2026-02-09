import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Lock, Bot, TrendingUp, TrendingDown, ChevronRight, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useComplianceRequirements } from "@/hooks/useComplianceRequirements";
import { DOMAIN_STANDARDS, getMaturityLevel, MATURITY_LEVELS } from "@/lib/certificationPhases";
import type { RequirementDomain } from "@/lib/complianceRequirementsData";

interface DomainConfig {
  id: string;
  domain: RequirementDomain;
  icon: React.ReactNode;
}

const DOMAINS: DomainConfig[] = [
  { id: "privacy", domain: "privacy", icon: <Shield className="h-4 w-4" /> },
  { id: "infosec", domain: "security", icon: <Lock className="h-4 w-4" /> },
  { id: "ai-governance", domain: "ai", icon: <Bot className="h-4 w-4" /> },
];

const getStatusFromScore = (score: number) => {
  if (score >= 70) return "bra";
  if (score >= 40) return "ok";
  return "lav";
};

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
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isNorwegian = i18n.language === "nb";
  const [expandedDomain, setExpandedDomain] = useState<string | null>(null);
  const { requirements } = useComplianceRequirements({});

  const domainData = useMemo(() => {
    return DOMAINS.map(d => {
      const reqs = requirements.filter(r => r.domain === d.domain);
      const total = reqs.length;
      const completed = reqs.filter(r => r.status === 'completed').length;
      const score = total > 0 ? Math.round((completed / total) * 100) : 0;
      const status = getStatusFromScore(score);
      const maturity = getMaturityLevel(score);
      const maturityInfo = MATURITY_LEVELS.find(m => m.level === maturity);
      const standards = DOMAIN_STANDARDS[d.domain];
      const domainName = d.id === "privacy" ? "Personvern" : d.id === "infosec" ? "Informasjonssikkerhet" : "AI Governance";

      return {
        ...d,
        name: domainName,
        status,
        score,
        slaTotal: total,
        slaCurrent: completed,
        slaPercentage: score,
        maturityLabel: maturityInfo ? (isNorwegian ? maturityInfo.name_no : maturityInfo.name_en) : '',
        standardLabel: standards ? `${standards.primary}` : '',
      };
    });
  }, [requirements, isNorwegian]);

  const totalScore = Math.round(
    domainData.reduce((acc, d) => acc + d.score, 0) / domainData.length
  );

  return (
    <Card variant="luxury">
      <CardHeader className="pb-4 pt-6 px-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <CardTitle className="text-lg font-semibold tracking-tight text-foreground">
            Hvordan ligger vi an?
          </CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Snitt:</span>
            <span className={`text-sm font-semibold ${totalScore >= 70 ? "text-success" : totalScore >= 40 ? "text-warning" : "text-destructive"}`}>
              {totalScore}%
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 px-6 pb-6">
        {domainData.map((domain) => (
          <div 
            key={domain.id}
            className={`rounded-xl border transition-silk ${getStatusBg(domain.status)} hover:shadow-md`}
          >
            <button
              onClick={() => setExpandedDomain(expandedDomain === domain.id ? null : domain.id)}
              className="w-full p-3 sm:p-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                <div className={`p-2 sm:p-2.5 rounded-xl flex-shrink-0 transition-silk ${domain.status === "bra" ? "bg-success/20 text-success" : domain.status === "ok" ? "bg-warning/20 text-warning" : "bg-destructive/20 text-destructive"}`}>
                  {domain.icon}
                </div>
                <div className="text-left min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm font-medium text-foreground">{domain.name}</span>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 hidden sm:inline-flex">
                      {domain.maturityLabel}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Progress 
                      value={domain.score} 
                      className={`h-1.5 w-16 sm:w-24 ${getProgressColor(domain.status)}`}
                    />
                    <span className="text-xs text-muted-foreground">{domain.score}%</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                <span className={`text-xs sm:text-sm font-medium px-1.5 sm:px-2 py-0.5 rounded ${getStatusColor(domain.status)} ${getStatusBg(domain.status)}`}>
                  {getStatusLabel(domain.status)}
                </span>
                <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${expandedDomain === domain.id ? "rotate-90" : ""}`} />
              </div>
            </button>
            
            {expandedDomain === domain.id && (
              <div className="px-3 pb-3 pt-0 border-t border-border/50">
                <div className="bg-background/50 rounded-lg p-3 mt-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-muted-foreground font-medium">{domain.standardLabel}</span>
                    <Badge variant="secondary" className="text-[10px]">
                      {domain.maturityLabel}
                    </Badge>
                  </div>
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-xl font-bold text-foreground">{domain.slaPercentage}%</span>
                    <span className="text-xs text-muted-foreground">
                      {domain.slaCurrent} av {domain.slaTotal} krav oppfylt
                    </span>
                  </div>
                  <Progress 
                    value={domain.slaPercentage} 
                    className={`h-1 ${getProgressColor(domain.status)}`}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full mt-3 gap-2 text-primary hover:text-primary hover:bg-primary/10"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/tasks?view=readiness&domain=${domain.id}`);
                    }}
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Se ISO Readiness for {domain.name}
                  </Button>
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
            Basert på {domainData.reduce((acc, d) => acc + d.slaTotal, 0)} krav
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
