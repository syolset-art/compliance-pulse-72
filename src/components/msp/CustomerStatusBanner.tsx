import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Building2, Sparkles, ShieldCheck, Send, Archive, Mail, User, UserPlus, ExternalLink, Shield } from "lucide-react";
import { LaraAvatar } from "@/components/asset-profile/LaraAvatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useNavigate } from "react-router-dom";
import { PARTNER_TEAM, getAccountManagerOverride, setAccountManagerOverride } from "@/lib/partnerTeam";
import { toast } from "sonner";

interface CustomerLike {
  id: string;
  customer_name: string;
  industry?: string | null;
  employees?: string | null;
  logo_url?: string | null;
  compliance_score?: number | null;
  active_frameworks?: string[] | null;
  status?: string | null;
  subscription_plan?: string | null;
  org_number?: string | null;
  url?: string | null;
  contact_person?: string | null;
  contact_email?: string | null;
  account_manager?: string | null;
  onboarding_completed?: boolean | null;
  last_activity_at?: string | null;
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
  draft:    { key: "draft",    stripeLabel: "KUNDE · UTKAST",     stripeBg: "bg-vendor-draft",    stripeText: "text-vendor-draft-foreground",    tone: "primary" },
  invited:  { key: "invited",  stripeLabel: "KUNDE · ONBOARDING", stripeBg: "bg-vendor-invited",  stripeText: "text-vendor-invited-foreground",  tone: "warning" },
  claimed:  { key: "claimed",  stripeLabel: "KUNDE · AKTIV",      stripeBg: "bg-vendor-claimed",  stripeText: "text-vendor-claimed-foreground",  tone: "success" },
  archived: { key: "archived", stripeLabel: "KUNDE · INAKTIV",    stripeBg: "bg-vendor-archived", stripeText: "text-vendor-archived-foreground", tone: "muted" },
};

function deriveStatus(c: CustomerLike): StatusMeta {
  if (c.status === "inactive") return STATUS_MAP.archived;
  // Onboarding completed → kunden er claimet (aktiv), uavhengig av status-felt
  if (c.onboarding_completed) return STATUS_MAP.claimed;
  if (c.status === "active") return STATUS_MAP.claimed;
  if (c.status === "onboarding") return STATUS_MAP.invited;
  return STATUS_MAP.draft;
}

function formatLongDate(d?: string | null): string | null {
  if (!d) return null;
  try {
    return new Date(d).toLocaleDateString("nb-NO", { day: "numeric", month: "long", year: "numeric" });
  } catch { return null; }
}

function Donut({ score, tone }: { score: number; tone: StatusMeta["tone"] }) {
  const has = score > 0;
  const radius = 28;
  const circ = 2 * Math.PI * radius;
  const dash = has ? (score / 100) * circ : 0;
  const strokeColor =
    tone === "success" ? "hsl(var(--success))" :
    tone === "warning" ? "hsl(var(--warning))" :
    tone === "primary" ? "hsl(var(--primary))" :
    "hsl(var(--muted-foreground) / 0.3)";
  return (
    <div className="relative flex items-center justify-center" style={{ width: 72, height: 72 }}>
      <svg width="72" height="72" viewBox="0 0 72 72" className="-rotate-90">
        <circle cx="36" cy="36" r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth="5" />
        {has && (
          <circle cx="36" cy="36" r={radius} fill="none" stroke={strokeColor} strokeWidth="5" strokeLinecap="round"
            strokeDasharray={`${dash} ${circ}`} />
        )}
      </svg>
      <span className={cn(
        "absolute text-[15px] font-bold tabular-nums leading-none",
        tone === "success" && "text-success",
        tone === "warning" && "text-warning",
        tone === "primary" && "text-primary",
        !has && "text-muted-foreground",
      )}>
        {has ? `${score}%` : "—"}
      </span>
    </div>
  );
}

function InitialAvatar({ name, color = "bg-primary/15 text-primary" }: { name: string; color?: string }) {
  const initials = name.split(" ").map(p => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
  return (
    <span className={cn("inline-flex items-center justify-center h-6 w-6 rounded-full text-xs font-semibold", color)}>
      {initials || "?"}
    </span>
  );
}

export function CustomerStatusBanner({ customer, actionSlot }: { customer: CustomerLike; actionSlot?: React.ReactNode }) {
  const navigate = useNavigate();
  const status = deriveStatus(customer);
  const score = customer.compliance_score || 0;

  const [assignOpen, setAssignOpen] = useState(false);
  const [accountManager, setAccountManager] = useState<string | null>(
    customer.account_manager ?? getAccountManagerOverride(customer.id),
  );
  useEffect(() => {
    setAccountManager(customer.account_manager ?? getAccountManagerOverride(customer.id));
  }, [customer.id, customer.account_manager]);

  const handleAssign = (name: string) => {
    setAccountManagerOverride(customer.id, name);
    setAccountManager(name);
    setAssignOpen(false);
    toast.success(`${name} er satt som ansvarlig`);
  };

  const maturityLabel =
    status.key === "claimed" ? "godkjent av kunden" :
    status.key === "invited" ? "under onboarding" :
    status.key === "draft"   ? "estimert av Lara" :
    "data fryst";

  const maturityLevel =
    score >= 75 ? { label: "Høy", cls: "bg-success/10 text-success border-success/20" } :
    score >= 50 ? { label: "Moderat", cls: "bg-warning/10 text-warning border-warning/20" } :
                  { label: "Lav", cls: "bg-destructive/10 text-destructive border-destructive/20" };

  const hostname = (() => {
    if (!customer.url) return null;
    try { return new URL(customer.url).hostname; } catch { return customer.url; }
  })();

  const renderContext = () => {
    if (status.key === "draft") {
      return (
        <div className="rounded-lg bg-muted/40 border border-border px-4 py-2.5 flex items-center justify-between gap-3 flex-wrap">
          <p className="text-sm text-foreground/85 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary animate-pulse" aria-hidden="true" />
            Lara kartlegger kundeprofilen…
          </p>
          <Button size="sm" className="gap-1.5 h-9 text-sm" onClick={() => navigate(`/msp-dashboard/${customer.id}/trust-profile`)}>
            <Send className="h-4 w-4" aria-hidden="true" /> Start onboarding
          </Button>
        </div>
      );
    }
    if (status.key === "invited") {
      return (
        <div className="rounded-lg bg-muted/40 border border-border px-4 py-2.5 flex items-center justify-between gap-3 flex-wrap">
          <p className="text-sm text-foreground/85 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-warning" aria-hidden="true" />
            Onboarding pågår — Lara fyller ut kundeprofilen.
          </p>
        </div>
      );
    }
    if (status.key === "claimed") {
      const last = formatLongDate(customer.last_activity_at);
      return (
        <div className="rounded-lg bg-muted/40 border border-border px-4 py-2.5 flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-success shrink-0" aria-hidden="true" />
          <p className="text-sm text-foreground/85">Aktiv kunde{last ? ` · siste aktivitet ${last}` : ""}</p>
        </div>
      );
    }
    return (
      <div className="rounded-lg bg-muted/40 border border-border px-4 py-2.5 flex items-center gap-2">
        <Archive className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden="true" />
        <p className="text-sm text-muted-foreground">Inaktiv kunde — data fryst.</p>
      </div>
    );
  };

  return (
    <Card variant="flat" className="relative overflow-hidden p-0">
      <div className="flex items-stretch">
        {/* Vertical stripe */}
        <div className={cn("relative w-9 shrink-0", status.stripeBg)}>
          <span
            className={cn("absolute inset-0 flex items-center justify-center text-xs font-bold uppercase tracking-[0.18em] whitespace-nowrap", status.stripeText)}
            style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
          >
            {status.stripeLabel}
          </span>
        </div>

        {/* Body */}
        <div className="flex-1 px-5 py-4 space-y-3 min-w-0">
          {/* Top row */}
          <div className="flex items-start gap-4">
            <div className="shrink-0">
              {customer.logo_url ? (
                <div className="h-11 w-11 rounded-lg overflow-hidden border border-border bg-background">
                  <img src={customer.logo_url} alt={`${customer.customer_name} logo`} className="h-full w-full object-contain" />
                </div>
              ) : (
                <div className="h-11 w-11 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl md:text-2xl font-bold text-foreground truncate">{customer.customer_name}</h1>
                <Badge variant="outline" className="text-sm px-2 py-0.5 border-primary/40 text-primary font-medium">
                  {customer.subscription_plan || "Gratis"}
                </Badge>
                {customer.active_frameworks && customer.active_frameworks.length > 0 && (
                  <Badge variant="outline" className="text-sm px-2 py-0.5 gap-1">
                    <Shield className="h-3.5 w-3.5" aria-hidden="true" />
                    {customer.active_frameworks.length} regelverk
                  </Badge>
                )}
              </div>

              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-foreground/75">
                {customer.industry && <span>{customer.industry}</span>}
                {customer.employees && (
                  <>
                    <span className="text-muted-foreground/50" aria-hidden="true">·</span>
                    <span>{customer.employees} ansatte</span>
                  </>
                )}
                {customer.org_number && (
                  <>
                    <span className="text-muted-foreground/50" aria-hidden="true">·</span>
                    <span><span className="text-muted-foreground">Org.nr</span>{" "}<span className="tabular-nums text-foreground font-medium">{customer.org_number}</span></span>
                  </>
                )}
                {hostname && (
                  <>
                    <span className="text-muted-foreground/50" aria-hidden="true">·</span>
                    <a href={customer.url || "#"} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                      {hostname}<ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                    </a>
                  </>
                )}
              </div>
            </div>

            {/* Maturity */}
            <div className="hidden md:flex items-center gap-3 shrink-0">
              <div className="flex flex-col items-end text-right">
                <span className="text-xs font-semibold text-foreground/80 uppercase tracking-wider">Modenhet</span>
                <TooltipProvider delayDuration={150}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className={cn("mt-1 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-sm font-semibold", maturityLevel.cls)}>
                        <LaraAvatar size={12} />
                        {maturityLevel.label}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="left"><p className="text-sm">Beregnet av Mynder fra trust score</p></TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <span className="mt-1 text-sm text-muted-foreground italic">{maturityLabel}</span>
              </div>
              <Donut score={score} tone={status.tone} />
            </div>

            {actionSlot && (
              <div className="shrink-0 self-start">
                {actionSlot}
              </div>
            )}
          </div>

          {/* Context banner */}
          {renderContext()}

          {/* Footer: Kontakt hos kunde · Ansvarlig hos oss */}
          <div className="border-t border-border pt-3 flex flex-wrap items-center gap-x-8 gap-y-2 text-sm">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs uppercase tracking-wider text-foreground/80 font-semibold">Kontakt hos kunde:</span>
              {customer.contact_person ? (
                <span className="inline-flex items-center gap-1.5 text-foreground">
                  <InitialAvatar name={customer.contact_person} color="bg-warning/15 text-warning" />
                  <span className="truncate">{customer.contact_person}</span>
                  {customer.contact_email && (
                    <a href={`mailto:${customer.contact_email}`} className="text-muted-foreground hover:text-primary" aria-label={`E-post til ${customer.contact_person}`}>
                      <Mail className="h-3.5 w-3.5" aria-hidden="true" />
                    </a>
                  )}
                </span>
              ) : (
                <button className="inline-flex items-center gap-1 text-primary hover:underline">
                  <UserPlus className="h-4 w-4" aria-hidden="true" /> Legg til kontaktperson
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs uppercase tracking-wider text-foreground/80 font-semibold">Ansvarlig hos oss:</span>
              {accountManager ? (
                <span className="inline-flex items-center gap-1.5 text-foreground">
                  <InitialAvatar name={accountManager} />
                  <span className="truncate">{accountManager}</span>
                  <Popover open={assignOpen} onOpenChange={setAssignOpen}>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="ml-1 text-sm text-primary hover:underline"
                        aria-label="Endre ansvarlig"
                      >
                        Endre
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 p-1" align="start">
                      <p className="px-3 py-2 text-xs uppercase tracking-wider text-muted-foreground">
                        Velg partner-medlem
                      </p>
                      <div className="max-h-64 overflow-auto">
                        {PARTNER_TEAM.map((m) => (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => handleAssign(m.name)}
                            className="w-full flex items-center gap-2 px-3 py-2 rounded-md hover:bg-muted text-left"
                          >
                            <InitialAvatar name={m.name} />
                            <span className="flex-1 min-w-0">
                              <span className="block text-sm font-medium text-foreground truncate">{m.name}</span>
                              <span className="block text-xs text-muted-foreground truncate">{m.role}</span>
                            </span>
                          </button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                </span>
              ) : (
                <Popover open={assignOpen} onOpenChange={setAssignOpen}>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 text-primary hover:underline text-sm font-medium"
                    >
                      <UserPlus className="h-4 w-4" aria-hidden="true" /> Tildel ansvarlig
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-1" align="start">
                    <p className="px-3 py-2 text-xs uppercase tracking-wider text-muted-foreground">
                      Velg partner-medlem
                    </p>
                    <div className="max-h-64 overflow-auto">
                      {PARTNER_TEAM.map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => handleAssign(m.name)}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-md hover:bg-muted text-left"
                        >
                          <InitialAvatar name={m.name} />
                          <span className="flex-1 min-w-0">
                            <span className="block text-sm font-medium text-foreground truncate">{m.name}</span>
                            <span className="block text-xs text-muted-foreground truncate">{m.role}</span>
                          </span>
                        </button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
