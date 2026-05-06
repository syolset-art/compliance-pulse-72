import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { nb } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { Building2, Shield, ShieldCheck, UserCheck, UserX, Users } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";

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

function scoreToLabel(score: number) {
  if (score >= 75) return "High Trust";
  if (score >= 50) return "Medium Trust";
  return "Low Trust";
}

function getStatusBadge(status: string) {
  switch (status) {
    case "active":
      return <Badge variant="outline" className="text-[13px] px-1.5 py-0 bg-success/10 text-success border-success/20">Aktiv</Badge>;
    case "onboarding":
      return <Badge variant="outline" className="text-[13px] px-1.5 py-0 bg-primary/10 text-primary border-primary/20">Onboarding</Badge>;
    case "inactive":
      return <Badge variant="outline" className="text-[13px] px-1.5 py-0">Inaktiv</Badge>;
    default:
      return <Badge variant="outline" className="text-[13px] px-1.5 py-0">{status}</Badge>;
  }
}

function isTrustProfileClaimed(customer: MSPCustomer): boolean {
  return customer.status === "active" && customer.compliance_score >= 75 && customer.onboarding_completed === true;
}

export function MSPCustomerCard({ customer }: MSPCustomerCardProps) {
  const navigate = useNavigate();
  const claimed = isTrustProfileClaimed(customer);
  const score = customer.compliance_score || 0;
  const hasScore = score > 0;

  const ringTone = !hasScore ? "muted" : score >= 75 ? "success" : score >= 50 ? "warning" : "destructive";
  const ringStroke = !hasScore ? "hsl(var(--muted-foreground) / 0.3)" : `hsl(var(--${ringTone}))`;
  const ringText = !hasScore ? "text-muted-foreground" : `text-${ringTone}`;
  const radius = 16;
  const circ = 2 * Math.PI * radius;
  const dash = hasScore ? (score / 100) * circ : 0;

  const initials = customer.customer_name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  return (
    <Card
      variant="flat"
      className="px-4 py-4 cursor-pointer hover:shadow-md transition-all hover:border-primary/30"
      onClick={() => navigate(`/msp-dashboard/${customer.id}`)}
    >
      {/* Row 1: Logo + name + score */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          {customer.logo_url ? (
            <img
              src={customer.logo_url}
              alt={customer.customer_name}
              className="h-8 w-8 rounded-md object-contain bg-muted p-0.5 shrink-0"
            />
          ) : (
            <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
              {initials ? (
                <span className="text-[11px] font-bold text-primary">{initials}</span>
              ) : (
                <Building2 className="h-3.5 w-3.5 text-primary" />
              )}
            </div>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-medium text-foreground truncate">{customer.customer_name}</p>
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="flex-shrink-0">
                      {claimed ? (
                        <UserCheck className="h-3.5 w-3.5 text-success" />
                      ) : (
                        <UserX className="h-3.5 w-3.5 text-muted-foreground/60" />
                      )}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    {claimed ? "Trust Profile overtatt av leverandøren" : "Trust Profile ikke overtatt"}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              {customer.industry && (
                <span className="text-[13px] text-muted-foreground truncate">{customer.industry}</span>
              )}
              {customer.employees && (
                <span className="text-[13px] text-muted-foreground flex items-center gap-0.5">
                  <Users className="h-2.5 w-2.5" />
                  {customer.employees}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 pr-1">
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="relative flex items-center justify-center" style={{ width: 40, height: 40 }}>
                  <svg width="40" height="40" viewBox="0 0 40 40" className="-rotate-90">
                    <circle cx="20" cy="20" r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth="3" />
                    {hasScore && (
                      <circle
                        cx="20" cy="20" r={radius} fill="none"
                        stroke={ringStroke} strokeWidth="3" strokeLinecap="round"
                        strokeDasharray={`${dash} ${circ}`}
                        style={{ transition: "stroke-dasharray 0.5s ease" }}
                      />
                    )}
                  </svg>
                  <div className={cn("absolute inset-0 flex items-center justify-center", ringText)}>
                    {hasScore ? (
                      <span className="text-[11px] font-bold tabular-nums leading-none">{score}</span>
                    ) : (
                      <span className="text-[11px] font-medium leading-none">–</span>
                    )}
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent side="left">
                <span className="text-xs">{hasScore ? `${score}% — ${scoreToLabel(score)}` : "Ikke vurdert"}</span>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Row 2: Badges */}
      <div className="flex flex-wrap items-center gap-1.5 mt-2.5 pl-[42px]">
        {getStatusBadge(customer.status)}
        <Badge variant="outline" className="text-[13px] px-1.5 py-0 border-primary/40 text-primary">
          {customer.subscription_plan || "Gratis"}
        </Badge>
        {customer.active_frameworks?.length > 0 && (
          <Badge variant="outline" className="text-[13px] px-1.5 py-0 gap-1">
            <Shield className="h-2.5 w-2.5" />
            {customer.active_frameworks.length} regelverk
          </Badge>
        )}
        {customer.last_activity_at && (
          <span className="text-[11px] text-muted-foreground ml-auto">
            {formatDistanceToNow(new Date(customer.last_activity_at), { addSuffix: true, locale: nb })}
          </span>
        )}
      </div>

      {/* Quick actions */}
      <div className="flex gap-2 mt-3 pt-3 border-t border-border/60">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 gap-1.5 text-xs h-7"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/msp-dashboard/${customer.id}/trust-profile`);
          }}
        >
          <ShieldCheck className="h-3 w-3" />
          Trust Profile
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1 gap-1.5 text-xs h-7"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/msp-dashboard/${customer.id}/nis2`);
          }}
        >
          <Shield className="h-3 w-3" />
          NIS2
        </Button>
      </div>
    </Card>
  );
}
