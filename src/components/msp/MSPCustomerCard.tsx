import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
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

function getScoreColor(score: number) {
  if (score >= 80) return "text-green-600 dark:text-green-400";
  if (score >= 50) return "text-yellow-600 dark:text-yellow-400";
  return "text-red-600 dark:text-red-400";
}

function getScoreBg(score: number) {
  if (score >= 80) return "bg-green-100 dark:bg-green-900/30";
  if (score >= 50) return "bg-yellow-100 dark:bg-yellow-900/30";
  return "bg-red-100 dark:bg-red-900/30";
}

function getStatusBadge(status: string) {
  switch (status) {
    case "active":
      return <Badge variant="default" className="bg-green-600">Aktiv</Badge>;
    case "onboarding":
      return <Badge variant="secondary">Under onboarding</Badge>;
    case "inactive":
      return <Badge variant="outline">Inaktiv</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

/** Demo heuristic: customers with high compliance + active status are considered "claimed" */
function isTrustProfileClaimed(customer: MSPCustomer): boolean {
  return customer.status === "active" && customer.compliance_score >= 75 && customer.onboarding_completed === true;
}

export function MSPCustomerCard({ customer }: MSPCustomerCardProps) {
  const navigate = useNavigate();
  const claimed = isTrustProfileClaimed(customer);

  const initials = customer.customer_name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

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
                      <UserCheck className="h-4 w-4 text-green-600 dark:text-green-400" />
                    ) : (
                      <UserX className="h-4 w-4 text-muted-foreground/60" />
                    )}
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  {claimed ? "Trust Profile claimet av leverandøren" : "Trust Profile ikke claimet"}
                </TooltipContent>
              </Tooltip>
            </div>
            {getStatusBadge(customer.status)}
          </div>

          <div className="flex items-center gap-2 mt-1">
            {customer.industry && (
              <Badge variant="outline" className="text-xs">{customer.industry}</Badge>
            )}
            {customer.employees && (
              <Badge variant="outline" className="text-xs">{customer.employees} ansatte</Badge>
            )}
            <Badge
              variant="outline"
              className={cn(
                "text-xs",
                claimed
                  ? "border-green-500/40 text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20"
                  : "border-orange-500/40 text-orange-700 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20"
              )}
            >
              {claimed ? "Claimet" : "Ikke claimet"}
            </Badge>
          </div>

          {/* Subscription */}
          <Badge variant="outline" className="text-xs border-primary/40 text-primary mt-1">
            {customer.subscription_plan || "Gratis"}
          </Badge>

          {/* Frameworks */}
          {customer.active_frameworks?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {customer.active_frameworks.map((fw) => (
                <Badge key={fw} variant="secondary" className="text-xs">
                  {fw}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Compliance Score */}
        <div className={cn("flex flex-col items-center rounded-lg p-3 min-w-[64px]", getScoreBg(customer.compliance_score))}>
          <span className={cn("text-2xl font-bold", getScoreColor(customer.compliance_score))}>
            {customer.compliance_score}%
          </span>
          <span className="text-[10px] text-muted-foreground">Samsvar</span>
        </div>
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
