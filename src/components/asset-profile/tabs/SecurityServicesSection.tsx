import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, CheckCircle, XCircle, HelpCircle, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  SECURITY_SERVICE_CATALOG,
  evaluateServiceCoverage,
  ServiceCoverageStatus,
} from "@/lib/securityServiceCatalog";

interface SecurityServicesSectionProps {
  isSelfProfile?: boolean;
  assessmentResponses?: Record<string, string> | null;
}

export function SecurityServicesSection({ isSelfProfile, assessmentResponses }: SecurityServicesSectionProps) {
  const results = evaluateServiceCoverage(assessmentResponses || null);
  const covered = results.filter((r) => r.status === "covered").length;
  const total = SECURITY_SERVICE_CATALOG.length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Sikkerhetstjenester</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{covered}/{total} dekket</Badge>
            {!isSelfProfile && (
              <Badge variant="outline" className="gap-1 text-xs">
                <Lock className="h-3 w-3" />
                Premium
              </Badge>
            )}
          </div>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          {isSelfProfile
            ? "Oversikt over sikkerhetstjenester koblet til dine compliance-krav"
            : "Se hvilke sikkerhetstjenester som dekker relevante ISO 27001-kontroller"}
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {results.map(({ service, status, reason }) => {
            const Icon = service.icon;
            const StatusIcon =
              status === "covered" ? CheckCircle :
              status === "missing" ? XCircle : HelpCircle;

            return (
              <div
                key={service.id}
                className={cn(
                  "rounded-lg border p-4 flex flex-col gap-2",
                  status === "covered" && "border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-950/30",
                  status === "missing" && "border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950/30",
                  status === "unknown" && "border-muted bg-muted/30"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center text-white", service.color)}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-foreground">{service.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{service.description}</p>
                  </div>
                  <StatusIcon className={cn(
                    "h-5 w-5 shrink-0",
                    status === "covered" && "text-green-600 dark:text-green-400",
                    status === "missing" && "text-red-600 dark:text-red-400",
                    status === "unknown" && "text-muted-foreground"
                  )} />
                </div>

                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={status === "covered" ? "default" : status === "missing" ? "destructive" : "outline"} className="text-xs">
                    {status === "covered" ? "Dekket" : status === "missing" ? "Mangler" : "Ukjent"}
                  </Badge>
                  {service.linkedControls.slice(0, 2).map((ctrl) => (
                    <Badge key={ctrl} variant="outline" className="text-[10px] px-1.5 py-0">
                      {ctrl}
                    </Badge>
                  ))}
                </div>

                {status === "missing" && reason && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">{reason}</p>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
