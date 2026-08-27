import { useNavigate } from "react-router-dom";
import { ChevronDown, Check, Handshake, ShieldCheck, Building2, Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { useWorkspaceMode, WorkspaceMode } from "@/contexts/WorkspaceModeContext";
import { useActiveOrganization } from "@/contexts/ActiveOrganizationContext";
import { usePartnerInfo } from "@/hooks/usePartnerInfo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

/**
 * Compact workspace switcher for the top bar.
 * Same logic as the sidebar WorkspaceSwitcher but rendered as a pill + dropdown.
 */
export function WorkspaceSwitcherCompact() {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";
  const navigate = useNavigate();
  const { mode, setMode, availableModes, canSwitch } = useWorkspaceMode();
  const { activeOrg, organizations, setActiveOrg } = useActiveOrganization();
  const { data: partner } = usePartnerInfo(activeOrg?.id);

  const ownOrgs = organizations.filter((o) => o.type === "own");
  const isPartner = mode === "partner";
  const isAdmin = mode === "admin";

  const label = isAdmin
    ? (isNb ? "Mynder Admin" : "Mynder Admin")
    : isPartner
    ? (isNb ? "Partner-modus" : "Partner mode")
    : (isNb ? "Min organisasjon" : "My organization");

  const subtitle = isAdmin
    ? (isNb ? "Administrasjon" : "Administration")
    : isPartner
    ? (partner?.partnerName || activeOrg?.name || (isNb ? "Partner" : "Partner"))
    : (activeOrg?.name || "—");

  const Icon = isAdmin ? Crown : isPartner ? Handshake : ShieldCheck;

  const handleSelectMode = (next: WorkspaceMode) => {
    if (next === mode) return;
    setMode(next);
    if (next === "partner") navigate("/msp-partner");
    else if (next === "admin") navigate("/mynder-admin");
    else navigate("/");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "flex items-center gap-2 rounded-full pl-1.5 pr-2.5 py-1 border transition-colors max-w-[240px]",
            isAdmin
              ? "bg-warning/10 border-warning/25 hover:bg-warning/15"
              : isPartner
              ? "bg-accent/10 border-accent/25 hover:bg-accent/15"
              : "bg-primary/5 border-primary/15 hover:bg-primary/10"
          )}
        >
          <div className={cn(
            "h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0",
            isAdmin ? "bg-warning/20" : isPartner ? "bg-accent/20" : "bg-primary/15"
          )}>
            <Icon className={cn("h-3.5 w-3.5", isAdmin ? "text-warning" : isPartner ? "text-accent" : "text-primary")} />
          </div>
          <div className="min-w-0 text-left hidden sm:block">
            <div className={cn(
              "text-sm font-semibold leading-tight truncate",
              isAdmin ? "text-warning" : isPartner ? "text-accent" : "text-primary"
            )}>
              {label}
            </div>
            <div className="text-sm text-muted-foreground truncate leading-tight">
              {subtitle}
            </div>
          </div>
          {canSwitch && <ChevronDown className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="text-sm uppercase tracking-wide text-muted-foreground font-normal">
          {isNb ? "Arbeidsområde" : "Workspace"}
        </DropdownMenuLabel>

        {availableModes.includes("compliance") && (
          <DropdownMenuItem onClick={() => handleSelectMode("compliance")} className="gap-2.5 py-2">
            <div className="h-7 w-7 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium">{isNb ? "Min organisasjon" : "My organization"}</div>
              <div className="text-sm text-muted-foreground truncate">
                {isNb ? "Compliance og styring" : "Compliance & governance"}
              </div>
            </div>
            {mode === "compliance" && <Check className="h-4 w-4 text-primary" />}
          </DropdownMenuItem>
        )}

        {availableModes.includes("partner") && (
          <DropdownMenuItem onClick={() => handleSelectMode("partner")} className="gap-2.5 py-2">
            <div className="h-7 w-7 rounded-md bg-accent/10 flex items-center justify-center flex-shrink-0">
              <Handshake className="h-3.5 w-3.5 text-accent" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium">{isNb ? "Partner" : "Partner"}</div>
              <div className="text-sm text-muted-foreground truncate">
                {isNb ? "Kunder og tjenester" : "Customers & services"}
              </div>
            </div>
            {mode === "partner" && <Check className="h-4 w-4 text-accent" />}
          </DropdownMenuItem>
        )}

        {availableModes.includes("admin") && (
          <DropdownMenuItem onClick={() => handleSelectMode("admin")} className="gap-2.5 py-2">
            <div className="h-7 w-7 rounded-md bg-warning/10 flex items-center justify-center flex-shrink-0">
              <Crown className="h-3.5 w-3.5 text-warning" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium">{isNb ? "Mynder Admin" : "Mynder Admin"}</div>
              <div className="text-sm text-muted-foreground truncate">
                {isNb ? "Intern administrasjon" : "Internal administration"}
              </div>
            </div>
            {mode === "admin" && <Check className="h-4 w-4 text-warning" />}
          </DropdownMenuItem>
        )}

        {mode === "compliance" && ownOrgs.length > 1 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-sm uppercase tracking-wide text-muted-foreground font-normal">
              {isNb ? "Bytt virksomhet" : "Switch organization"}
            </DropdownMenuLabel>
            {ownOrgs.map((org) => {
              const isActive = activeOrg?.id === org.id;
              return (
                <DropdownMenuItem
                  key={org.id}
                  onClick={() => { setActiveOrg(org); navigate("/"); }}
                  className="gap-2 py-1.5"
                >
                  {isActive
                    ? <Check className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                    : <Building2 className="h-3.5 w-3.5 flex-shrink-0 opacity-50" />}
                  <span className="truncate text-sm">{org.name}</span>
                </DropdownMenuItem>
              );
            })}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
