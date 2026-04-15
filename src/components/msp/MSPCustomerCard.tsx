import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { AlertTriangle } from "lucide-react";
import { nb } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { Shield, ShieldCheck, UserCheck, UserX } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface MSPCustomer {
  id: string;
  customer_name: string;
  industry: string | null;
  employees: string | null;
  logo_url: string | null;
  compliance_score: number;
  active_frameworks: string[];
  status: string;
  subscription_plan: string;
  last_activity_at: string | null;
  onboarding_completed?: boolean;
}

interface MSPCustomerCardProps {
  customer: MSPCustomer;
}

function getTrustLevel(score: number | null | undefined) {
  if (!score || score === 0) return { label: "Ikke vurdert", color: "text-muted-foreground", bg: "bg-muted", badgeCls: "border-muted-foreground/30 text-muted-foreground bg-muted/50", isNull: true };
  if (score >= 75) return { label: "High Trust", color: "text-success", bg: "bg-success", badgeCls: "border-success/30 text-success bg-success/10", isNull: false };
  if (score >= 50) return { label: "Medium Trust", color: "text-warning", bg: "bg-warning", badgeCls: "border-warning/30 text-warning bg-warning/10", isNull: false };
  return { label: "Low Trust", color: "text-destructive", bg: "bg-destructive", badgeCls: "border-destructive/30 text-destructive bg-destructive/10", isNull: false };
}

function getStatusBadge(status: string) {
  switch (status) {
    case "active":
      return <Badge variant="default" className="bg-success text-success-foreground text-[13px]">Aktiv</Badge>;
    case "onboarding":
      return <Badge variant="secondary" className="text-[13px]">Under onboarding</Badge>;
    case "inactive":
      return <Badge variant="outline" className="text-[13px]">Inaktiv</Badge>;
    default:
      return <Badge variant="outline" className="text-[13px]">{status}</Badge>;
  }
}

function isTrustProfileClaimed(customer: MSPCustomer): boolean {
  return customer.status === "active" && customer.compliance_score >= 75 && customer.onboarding_completed === true;
}

export function MSPCustomerCard({ customer }: MSPCustomerCardProps) {
  const navigate = useNavigate();
  const claimed = isTrustProfileClaimed(customer);
  const trust = getTrustLevel(customer.compliance_score);

  const initials = customer.customer_name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  // Mini SVG gauge
  const score = customer.compliance_score || 0;
  const radius = 28;
  const circ = 2 * Math.PI * radius;
  const dash = trust.isNull ? 0 : (score / 100) * circ;
  const strokeColor = trust.isNull
    ? "hsl(var(--muted-foreground) / 0.3)"
    : score >= 75
      ? "hsl(var(--success))"
      : score >= 50
        ? "hsl(var(--warning))"
        : "hsl(var(--destructive))";

  return (
    <Card
      className="p-5 cursor-pointer hover:shadow-lg transition-all hover:border-primary/30"
      onClick={() => navigate(`/msp-dashboard/${customer.id}`)}
    >
      <div className="flex items-start gap-4">
        {/* Logo / Avatar */}
        {customer.logo_url ? (
          <img
            src={customer.logo_url}
            alt={customer.customer_name}
            className="h-12 w-12 rounded-lg object-contain bg-muted p-1"
          />
        ) : (
          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
            <span className="text-sm font-bold text-primary">{initials}</span>
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <h3 className="font-semibold text-foreground truncate">{customer.customer_name}</h3>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="flex-shrink-0">
                    {claimed ? (
                      <UserCheck className="h-4 w-4 text-success" />
                    ) : (
                      <UserX className="h-4 w-4 text-muted-foreground/60" />
                    )}
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  {claimed ? "Trust Profile claimet av leverandøren" : "Trust Profile ikke claimet"}
                </TooltipContent>
              </Tooltip>
              {getStatusBadge(customer.status)}
            </div>
          </div>

          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            {customer.industry && (
              <Badge variant="outline" className="text-[13px]">{customer.industry}</Badge>
            )}
            {customer.employees && (
              <Badge variant="outline" className="text-[13px]">{customer.employees} ansatte</Badge>
            )}
            <Badge variant="outline" className="text-[13px] border-primary/40 text-primary">
              {customer.subscription_plan || "Gratis"}
            </Badge>
          </div>

          {/* Frameworks + NIS2 signal */}
          {customer.active_frameworks?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {customer.active_frameworks.map((fw) => {
                const isNis2 = fw.toUpperCase().includes("NIS2");
                if (isNis2) {
                  const nis2Urgent = customer.compliance_score < 75;
                  return (
                    <Badge
                      key={fw}
                      variant="outline"
                      className={cn(
                        "text-[13px] gap-1 font-semibold",
                        nis2Urgent
                          ? "border-warning/50 text-warning bg-warning/10 animate-pulse"
                          : "border-success/40 text-success bg-success/10"
                      )}
                    >
                      <AlertTriangle className="h-2.5 w-2.5" />
                      {fw} {nis2Urgent ? "– Krever tiltak" : "– OK"}
                    </Badge>
                  );
                }
                return (
                  <Badge key={fw} variant="secondary" className="text-[13px]">
                    {fw}
                  </Badge>
                );
              })}
            </div>
          )}
        </div>

        {/* Trust Score Gauge */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex flex-col items-center gap-1 shrink-0">
              <div className="relative flex items-center justify-center">
                <svg width="64" height="64" viewBox="0 0 64 64" className="-rotate-90">
                  <circle cx="32" cy="32" r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth="4" />
                  <circle
                    cx="32" cy="32" r={radius} fill="none"
                    stroke={strokeColor} strokeWidth="4" strokeLinecap="round"
                    strokeDasharray={`${dash} ${circ}`}
                    style={{ transition: "stroke-dasharray 0.6s ease" }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  {trust.isNull ? (
                    <span className="text-sm font-bold text-muted-foreground">–</span>
                  ) : (
                    <>
                      <span className={cn("text-lg font-bold tabular-nums leading-none", trust.color)}>
                        {score}
                      </span>
                      <span className="text-[7px] font-semibold text-muted-foreground">/100</span>
                    </>
                  )}
                </div>
              </div>
              <span className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wider">Trust Score</span>
              <Badge variant="outline" className={cn("text-[13px] px-1.5 py-0", trust.badgeCls)}>
                {trust.label}
              </Badge>
            </div>
          </TooltipTrigger>
          {trust.isNull && (
            <TooltipContent className="max-w-[200px] text-center">
              <p className="text-xs">Ingen data er hentet for denne kunden ennå. Kjør en manuell vurdering for å beregne Trust Score.</p>
            </TooltipContent>
          )}
        </Tooltip>
      </div>

      {/* Quick actions */}
      <div className="flex gap-2 mt-3 pt-3 border-t">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 gap-1.5 text-xs"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/msp-dashboard/${customer.id}/trust-profile`);
          }}
        >
          <ShieldCheck className="h-3.5 w-3.5" />
          Se Trust Profile
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1 gap-1.5 text-xs"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/msp-dashboard/${customer.id}/nis2`);
          }}
        >
          <Shield className="h-3.5 w-3.5" />
          NIS2-vurdering
        </Button>
      </div>

      {/* Footer */}
      {customer.last_activity_at && (
        <p className="text-xs text-muted-foreground mt-2 pt-2 border-t">
          Siste aktivitet: {formatDistanceToNow(new Date(customer.last_activity_at), { addSuffix: true, locale: nb })}
        </p>
      )}
    </Card>
  );
}
