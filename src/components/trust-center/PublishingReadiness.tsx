import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2, Circle, ChevronDown, ChevronUp,
  Building2, Users, Shield, Scale, FileText, AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ReadinessCheck {
  id: string;
  labelNb: string;
  labelEn: string;
  anchor: string;
  passed: boolean;
}

interface PublishingReadinessProps {
  trustScore: number;
  companyProfile: any;
  frameworks: any[];
  linkedProducts: any[];
  evaluation: any;
}

export function PublishingReadiness({
  trustScore,
  companyProfile,
  frameworks,
  linkedProducts,
  evaluation,
}: PublishingReadinessProps) {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";
  const [expanded, setExpanded] = useState(false);

  const checks = useMemo<ReadinessCheck[]>(() => {
    const hasCompanyInfo = !!(companyProfile?.name && companyProfile?.org_number);
    const hasContact = !!(companyProfile?.compliance_officer || companyProfile?.dpo_name);
    const hasControls = trustScore >= 70;
    const hasFramework = frameworks.length > 0;
    

    return [
      {
        id: "company",
        labelNb: "Virksomhetsinformasjon utfylt",
        labelEn: "Company information completed",
        anchor: "#company",
        passed: hasCompanyInfo,
      },
      {
        id: "contact",
        labelNb: "Kontaktperson registrert",
        labelEn: "Contact person registered",
        anchor: "#company",
        passed: hasContact,
      },
      {
        id: "controls",
        labelNb: "Minst 70 % kontroller besvart",
        labelEn: "At least 70% controls answered",
        anchor: "#security",
        passed: hasControls,
      },
      {
        id: "framework",
        labelNb: "Minst ett regelverk valgt",
        labelEn: "At least one regulation selected",
        anchor: "#regulations",
        passed: hasFramework,
      },
    ];
  }, [trustScore, companyProfile, frameworks]);

  const passedCount = checks.filter((c) => c.passed).length;
  const readinessPercent = Math.round((passedCount / checks.length) * 100);

  const level =
    readinessPercent >= 80
      ? "ready"
      : readinessPercent >= 50
        ? "almost"
        : "notReady";

  const config = {
    ready: {
      barColor: "bg-success",
      textColor: "text-success",
      borderColor: "border-success/30",
      bgColor: "bg-success/5",
      msgNb: "Klar for publisering",
      msgEn: "Ready to publish",
      icon: CheckCircle2,
    },
    almost: {
      barColor: "bg-warning",
      textColor: "text-warning",
      borderColor: "border-warning/30",
      bgColor: "bg-warning/5",
      msgNb: "Nesten klar — noen områder gjenstår",
      msgEn: "Almost ready — some areas remain",
      icon: AlertTriangle,
    },
    notReady: {
      barColor: "bg-destructive",
      textColor: "text-destructive",
      borderColor: "border-destructive/30",
      bgColor: "bg-destructive/5",
      msgNb: "Ikke klar for publisering — flere områder må fylles ut",
      msgEn: "Not ready to publish — more areas need to be completed",
      icon: AlertTriangle,
    },
  }[level];

  const StatusIcon = config.icon;

  return (
    <Card
      className={cn(
        "sticky top-0 z-20 p-4 transition-all",
        config.borderColor,
        config.bgColor
      )}
    >
      {/* Compact bar */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <StatusIcon className={cn("h-4 w-4", config.textColor)} />
            <span className={cn("text-sm font-medium", config.textColor)}>
              {isNb ? config.msgNb : config.msgEn}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-foreground tabular-nums">
              {passedCount}/{checks.length}
            </span>
            {expanded ? (
              <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </div>
        </div>
        {/* Progress bar */}
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              config.barColor
            )}
            style={{ width: `${readinessPercent}%` }}
          />
        </div>
      </button>

      {/* Expandable checklist */}
      {expanded && (
        <div className="mt-3 pt-3 border-t border-border space-y-1.5">
          {checks.map((check) => (
            <button
              key={check.id}
              onClick={(e) => {
                e.stopPropagation();
                document
                  .querySelector(check.anchor)
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
              className="w-full flex items-center gap-2.5 py-1.5 px-1 rounded hover:bg-muted/50 transition-colors text-left"
            >
              {check.passed ? (
                <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
              ) : (
                <Circle className="h-4 w-4 text-muted-foreground/40 shrink-0" />
              )}
              <span
                className={cn(
                  "text-xs",
                  check.passed
                    ? "text-foreground"
                    : "text-muted-foreground"
                )}
              >
                {isNb ? check.labelNb : check.labelEn}
              </span>
            </button>
          ))}
        </div>
      )}
    </Card>
  );
}
