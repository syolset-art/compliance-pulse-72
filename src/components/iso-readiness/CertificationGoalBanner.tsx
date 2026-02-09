import { Lightbulb, Check, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { useSubscription } from "@/hooks/useSubscription";
import type { RequirementDomain } from "@/lib/complianceRequirementsData";

interface Recommendation {
  domain: RequirementDomain;
  included: boolean;
  note?: string;
}

function getRecommendations(
  industry: string | undefined,
  isDomainIncluded: (id: string) => boolean
): Recommendation[] {
  const privacyIncluded = isDomainIncluded("privacy");
  const securityIncluded = isDomainIncluded("security");
  const aiIncluded = isDomainIncluded("ai");

  const base: Recommendation[] = [
    { domain: "privacy", included: privacyIncluded },
  ];

  const industryLower = (industry || "").toLowerCase();
  const techIndustries = ["it", "saas", "tech", "software", "konsulent", "ikt", "teknologi"];
  const financeIndustries = ["finans", "bank", "forsikring", "finance", "insurance"];
  const healthIndustries = ["helse", "health", "medisin", "medical"];

  const isTech = techIndustries.some((k) => industryLower.includes(k));
  const isFinance = financeIndustries.some((k) => industryLower.includes(k));
  const isHealth = healthIndustries.some((k) => industryLower.includes(k));

  if (isTech || isFinance || isHealth) {
    base.push({ domain: "security", included: securityIncluded });
  } else {
    base.push({
      domain: "security",
      included: securityIncluded,
      note: "whenCustomersRequire",
    });
  }

  if (isTech) {
    base.push({
      domain: "ai",
      included: aiIncluded,
      note: "whenUsingAI",
    });
  } else {
    base.push({
      domain: "ai",
      included: aiIncluded,
      note: "whenUsingAI",
    });
  }

  return base;
}

interface CertificationGoalBannerProps {
  onActivateDomain?: (domainId: RequirementDomain) => void;
}

export function CertificationGoalBanner({ onActivateDomain }: CertificationGoalBannerProps) {
  const { t } = useTranslation();
  const { companyProfile, isDomainIncluded } = useSubscription();

  const recommendations = getRecommendations(
    companyProfile?.industry,
    isDomainIncluded
  );

  // Don't show if all domains are active
  const allActive = recommendations.every((r) => r.included);
  if (allActive) return null;

  const companyName = companyProfile?.name || "";

  return (
    <Card className="p-4 border-primary/20 bg-gradient-to-r from-primary/5 via-primary/3 to-transparent">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Lightbulb className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-foreground">
            {t("isoReadiness.recommendation.title", { company: companyName })}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5 mb-3">
            {t("isoReadiness.recommendation.subtitle", {
              industry: companyProfile?.industry || "",
            })}
          </p>

          <div className="space-y-1.5">
            {recommendations.map((rec, i) => (
              <div key={rec.domain} className="flex items-center gap-2 text-sm">
                <span className="text-xs text-muted-foreground w-4">{i + 1}.</span>
                <span className="font-medium text-foreground">
                  {t(`tasks.readiness.domains.${rec.domain}`)}
                </span>
                {rec.included ? (
                  <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    {t("isoReadiness.recommendation.included")}
                  </span>
                ) : rec.note ? (
                  <span className="text-xs text-muted-foreground">
                    – {t(`isoReadiness.recommendation.${rec.note}`)}
                  </span>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs gap-1"
                    onClick={() => onActivateDomain?.(rec.domain)}
                  >
                    {t("isoReadiness.locked.activate")}
                    <ArrowRight className="w-3 h-3" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}
