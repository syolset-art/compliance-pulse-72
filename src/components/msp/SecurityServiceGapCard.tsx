import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, CheckCircle, XCircle, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  SECURITY_SERVICE_CATALOG,
  evaluateServiceCoverage,
  ServiceCoverageStatus,
} from "@/lib/securityServiceCatalog";
import { useTranslation } from "react-i18next";

interface SecurityServiceGapCardProps {
  assessmentResponses: Record<string, string> | null;
}

const statusConfigNb: Record<ServiceCoverageStatus, { label: string; icon: typeof CheckCircle; badgeVariant: "default" | "destructive" | "secondary" | "outline" }> = {
  covered: { label: "Dekket", icon: CheckCircle, badgeVariant: "default" },
  missing: { label: "Mangler", icon: XCircle, badgeVariant: "destructive" },
  unknown: { label: "Ukjent", icon: HelpCircle, badgeVariant: "outline" },
};

const statusConfigEn: Record<ServiceCoverageStatus, { label: string; icon: typeof CheckCircle; badgeVariant: "default" | "destructive" | "secondary" | "outline" }> = {
  covered: { label: "Covered", icon: CheckCircle, badgeVariant: "default" },
  missing: { label: "Missing", icon: XCircle, badgeVariant: "destructive" },
  unknown: { label: "Unknown", icon: HelpCircle, badgeVariant: "outline" },
};

export function SecurityServiceGapCard({ assessmentResponses }: SecurityServiceGapCardProps) {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";
  const statusConfig = isNb ? statusConfigNb : statusConfigEn;
  const results = evaluateServiceCoverage(assessmentResponses);
  const covered = results.filter((r) => r.status === "covered").length;
  const total = SECURITY_SERVICE_CATALOG.length;

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Shield className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-foreground">{isNb ? "Sikkerhetstjenester – gap-analyse" : "Security services – gap analysis"}</h3>
        <Badge variant="secondary" className="ml-auto">
          {covered}/{total} {isNb ? "dekket" : "covered"}
        </Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {results.map(({ service, status, reason, reasonEn }) => {
          const Icon = service.icon;
          const cfg = statusConfig[status];
          const StatusIcon = cfg.icon;

          return (
            <div
              key={service.id}
              className={cn(
                "rounded-lg border p-3 flex flex-col gap-2 transition-shadow hover:shadow-md",
                status === "covered" && "border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-950/30",
                status === "missing" && "border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950/30",
                status === "unknown" && "border-muted bg-muted/30"
              )}
            >
              <div className="flex items-center gap-2">
                <div className={cn("h-8 w-8 rounded-md flex items-center justify-center text-white", service.color)}>
                  <Icon className="h-4 w-4" />
                </div>
                <span className="text-sm font-medium text-foreground flex-1">{isNb ? service.name : service.nameEn}</span>
                <StatusIcon className={cn(
                  "h-4 w-4",
                  status === "covered" && "text-green-600 dark:text-green-400",
                  status === "missing" && "text-red-600 dark:text-red-400",
                  status === "unknown" && "text-muted-foreground"
                )} />
              </div>
              <p className="text-xs text-muted-foreground">{(isNb ? reason : result.reasonEn) || (isNb ? service.description : service.descriptionEn)}</p>
              {service.linkedControls.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-auto">
                  {service.linkedControls.slice(0, 3).map((ctrl) => (
                    <Badge key={ctrl} variant="outline" className="text-[10px] px-1.5 py-0">
                      {ctrl}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
