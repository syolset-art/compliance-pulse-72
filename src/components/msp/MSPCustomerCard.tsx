import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LayoutGrid, ShieldCheck, Sparkles, Send, Archive } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { LaraAvatar } from "@/components/asset-profile/LaraAvatar";

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
  org_number?: string | null;
  contact_email?: string | null;
}

interface MSPCustomerCardProps {
  customer: MSPCustomer;
}

type StatusKey = "draft" | "invited" | "claimed" | "archived";
interface StatusMeta {
  key: StatusKey;
  stripeLabel: string;
  stripeBg: string;
  stripeText: string;
  tone: "warning" | "primary" | "success" | "muted";
}
const STATUS_MAP: Record<StatusKey, StatusMeta> = {
  draft:    { key: "draft",    stripeLabel: "KUNDE · UTKAST",    stripeBg: "bg-vendor-draft",    stripeText: "text-vendor-draft-foreground",    tone: "primary" },
  invited:  { key: "invited",  stripeLabel: "KUNDE · ONBOARDING", stripeBg: "bg-vendor-invited",  stripeText: "text-vendor-invited-foreground",  tone: "warning" },
  claimed:  { key: "claimed",  stripeLabel: "KUNDE · AKTIV",      stripeBg: "bg-vendor-claimed",  stripeText: "text-vendor-claimed-foreground",  tone: "success" },
  archived: { key: "archived", stripeLabel: "KUNDE · INAKTIV",    stripeBg: "bg-vendor-archived", stripeText: "text-vendor-archived-foreground", tone: "muted" },
};

function deriveStatus(c: MSPCustomer): StatusMeta {
  if (c.status === "inactive") return STATUS_MAP.archived;
  if (c.status === "onboarding") return STATUS_MAP.invited;
  if (c.status === "active" && c.onboarding_completed) return STATUS_MAP.claimed;
  return STATUS_MAP.draft;
}

function formatLongDate(d?: string | null): string | null {
  if (!d) return null;
  try {
    return new Date(d).toLocaleDateString("nb-NO", { day: "numeric", month: "long", year: "numeric" });
  } catch { return null; }
}

function CustomerDonut({ score, tone, frozen }: { score: number; tone: StatusMeta["tone"]; frozen?: boolean }) {
  const has = score > 0;
  const radius = 26;
  const circ = 2 * Math.PI * radius;
  const dash = has ? (score / 100) * circ : 0;
  const stroke =
    frozen ? "hsl(var(--muted-foreground) / 0.4)" :
    tone === "success" ? "hsl(var(--success))" :
    tone === "warning" ? "hsl(var(--warning))" :
    tone === "primary" ? "hsl(var(--primary))" :
    "hsl(var(--muted-foreground) / 0.5)";
  return (
    <div className="relative flex items-center justify-center" style={{ width: 64, height: 64 }}>
      <svg width="64" height="64" viewBox="0 0 64 64" className="-rotate-90">
        <circle cx="32" cy="32" r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth="3.5" />
        {has && (
          <circle cx="32" cy="32" r={radius} fill="none" stroke={stroke} strokeWidth="3.5" strokeLinecap="round"
            strokeDasharray={`${dash} ${circ}`} />
        )}
      </svg>
      <span className={cn(
        "absolute text-[13px] font-semibold tabular-nums leading-none",
        frozen ? "text-muted-foreground line-through" :
        tone === "success" ? "text-success" :
        tone === "warning" ? "text-warning" :
        tone === "primary" ? "text-primary" :
        "text-muted-foreground"
      )}>
        {has ? `${score}%` : "—"}
      </span>
    </div>
  );
}

export function MSPCustomerCard({ customer }: MSPCustomerCardProps) {
  const navigate = useNavigate();
  const status = deriveStatus(customer);
  const isArchived = status.key === "archived";
  const score = customer.compliance_score || 0;

  const initials = customer.customer_name
    .split(" ").map(w => w[0]).join("").substring(0, 2).toUpperCase();

  const maturityLabel =
    status.key === "draft"   ? "estimert av Lara" :
    status.key === "invited" ? "under onboarding" :
    status.key === "claimed" ? "selvrapportert av kunde" :
    "fryst";

  const riskTone = score >= 75 ? "success" : score >= 50 ? "warning" : "destructive";
  const riskLabel = score >= 75 ? "Lav risiko" : score >= 50 ? "Moderat risiko" : "Høy risiko";

  const renderBanner = () => {
    if (status.key === "draft") {
      return (
        <div className="mt-3 rounded-lg bg-muted/40 border border-border px-3 py-2.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
            <span className="text-[13px] text-foreground truncate">Lara kartlegger kundeprofilen…</span>
          </div>
          <Button size="sm" onClick={(e) => { e.stopPropagation(); navigate(`/msp-dashboard/${customer.id}`); }} className="gap-1.5 shrink-0">
            <Send className="h-3.5 w-3.5" /> Start onboarding
          </Button>
        </div>
      );
    }
    if (status.key === "invited") {
      return (
        <div className="mt-3 rounded-lg bg-muted/40 border border-border px-3 py-2.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <Sparkles className="h-3.5 w-3.5 text-warning shrink-0" />
            <span className="text-[13px] text-foreground truncate">Onboarding pågår — Lara fyller ut profilen</span>
          </div>
          <Button size="sm" variant="outline" className="gap-1.5 shrink-0"
            onClick={(e) => { e.stopPropagation(); navigate(`/msp-dashboard/${customer.id}`); }}>
            Se fremdrift
          </Button>
        </div>
      );
    }
    if (status.key === "claimed") {
      const activatedOn = formatLongDate(customer.last_activity_at);
      return (
        <div className="mt-3 rounded-lg bg-muted/40 border border-border px-3 py-2 flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-success shrink-0" />
          <span className="text-[13px] text-foreground/80">Aktiv kunde{activatedOn ? ` · siste aktivitet ${activatedOn}` : ""}</span>
        </div>
      );
    }
    return (
      <div className="mt-3 rounded-lg bg-muted/60 border border-border px-3 py-2.5 flex items-center gap-2">
        <Archive className="h-4 w-4 text-muted-foreground shrink-0" />
        <span className="text-[13px] text-foreground">Samarbeidet er avsluttet — kunden er inaktiv</span>
      </div>
    );
  };

  return (
    <Card
      variant="flat"
      onClick={() => navigate(`/msp-dashboard/${customer.id}`)}
      className={cn(
        "relative cursor-pointer hover:shadow-md transition-all hover:border-primary/30 overflow-hidden p-0",
        isArchived && "opacity-90"
      )}
    >
      <div className="flex">
        {/* Vertical status stripe */}
        <div className={cn("relative w-7 shrink-0 flex items-center justify-center", status.stripeBg)}>
          <span
            className={cn("absolute text-[10px] font-bold tracking-[0.18em] whitespace-nowrap", status.stripeText)}
            style={{ transform: "rotate(-90deg)" }}
          >
            {status.stripeLabel}
          </span>
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0 p-4">
          <div className="flex items-start gap-4">
            <div className="flex items-start gap-3 min-w-0 flex-1">
              {customer.logo_url ? (
                <img src={customer.logo_url} alt={customer.customer_name}
                  className="h-10 w-10 rounded-md object-contain bg-muted/60 border border-border p-0.5 shrink-0" />
              ) : (
                <div className="h-10 w-10 rounded-md bg-muted/60 border border-border flex items-center justify-center shrink-0">
                  {initials ? (
                    <span className="text-[12px] font-bold text-muted-foreground">{initials}</span>
                  ) : (
                    <LayoutGrid className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className={cn(
                    "text-[16px] font-semibold text-foreground truncate",
                    isArchived && "line-through text-muted-foreground"
                  )}>
                    {customer.customer_name}
                  </h3>
                  <Badge variant="outline" className="text-[12px] px-2 py-0.5 border-primary/40 text-primary font-medium">
                    {customer.subscription_plan || "Gratis"}
                  </Badge>
                  {customer.active_frameworks?.length > 0 && (
                    <Badge variant="outline" className="text-[12px] px-2 py-0.5 gap-1">
                      <Shield className="h-3 w-3" />
                      {customer.active_frameworks.length} regelverk
                    </Badge>
                  )}
                </div>
                <p className="text-[13px] text-muted-foreground mt-1 truncate">
                  {[
                    customer.industry,
                    customer.employees ? `${customer.employees} ansatte` : null,
                  ].filter(Boolean).join("  ·  ")}
                </p>
              </div>
            </div>

            {/* Donut + maturity + risk */}
            <div className="hidden md:flex items-center gap-3 shrink-0 pl-3 border-l border-border/60">
              <CustomerDonut score={score} tone={status.tone} frozen={isArchived} />
              <div className="text-right space-y-1">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                  {isArchived ? "Siste modenhet" : "Modenhet"}
                </p>
                <p className={cn("text-[12px]", isArchived ? "italic text-muted-foreground" : "text-muted-foreground")}>
                  {maturityLabel}
                </p>
                {!isArchived && score > 0 && (
                  <TooltipProvider delayDuration={150}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button type="button" onClick={(e) => e.stopPropagation()}
                          className={cn(
                            "inline-flex items-center gap-1 rounded-pill px-2 py-0.5 border text-[11px] font-medium",
                            `bg-${riskTone}/10 text-${riskTone} border-${riskTone}/20`
                          )}>
                          <LaraAvatar size={12} />
                          {riskLabel}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="left">
                        <p className="text-[11px]">Beregnet av Mynder fra trust score</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            </div>
          </div>

          {renderBanner()}
        </div>
      </div>
    </Card>
  );
}
