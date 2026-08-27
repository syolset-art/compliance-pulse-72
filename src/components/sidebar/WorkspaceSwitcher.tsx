import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, ChevronDown, Check, Handshake, ShieldCheck, Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { useWorkspaceMode, WorkspaceMode } from "@/contexts/WorkspaceModeContext";
import { useActiveOrganization } from "@/contexts/ActiveOrganizationContext";
import { usePartnerInfo } from "@/hooks/usePartnerInfo";

/**
 * Workspace switcher: tydelig bryter mellom "Min virksomhet" (compliance),
 * "Partner" og "Mynder Admin" for interne superbrukere / daglig leder.
 * Erstatter den lille org-velgeren øverst i sidebar.
 */
export function WorkspaceSwitcher() {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";
  const navigate = useNavigate();
  const { mode, setMode, availableModes, canSwitch } = useWorkspaceMode();
  const { activeOrg, organizations, setActiveOrg } = useActiveOrganization();
  const { data: partner } = usePartnerInfo(activeOrg?.id);
  const [open, setOpen] = useState(false);

  const ownOrgs = organizations.filter((o) => o.type === "own");

  const isPartner = mode === "partner";
  const isAdmin = mode === "admin";

  const label = isAdmin
    ? (isNb ? "Mynder Admin" : "Mynder Admin")
    : isPartner
    ? (isNb ? "Partner-modus" : "Partner mode")
    : (isNb ? "Min virksomhet" : "My organization");

  const subtitle = isAdmin
    ? (isNb ? "Administrasjon og fakturagrunnlag" : "Administration and billing basis")
    : isPartner
    ? (partner?.partnerName || activeOrg?.name || (isNb ? "Partner" : "Partner"))
    : (activeOrg?.name || "—");

  const Icon = isAdmin ? Crown : isPartner ? Handshake : ShieldCheck;

  const handleSelectMode = (next: WorkspaceMode) => {
    if (next === mode) { setOpen(false); return; }
    setMode(next);
    setOpen(false);
    if (next === "partner") navigate("/msp-partner");
    else if (next === "admin") navigate("/mynder-admin");
    else navigate("/");
  };

  return (
    <div className="px-3 py-2.5">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "flex w-full items-center justify-between rounded-xl px-3 py-3 transition-all border",
          isAdmin
            ? "bg-warning/10 border-warning/25 hover:bg-warning/15 shadow-sm"
            : isPartner
            ? "bg-accent/10 border-accent/25 hover:bg-accent/15 shadow-sm"
            : "bg-primary/5 border-primary/15 hover:bg-primary/10 shadow-sm"
        )}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className={cn(
            "h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0",
            isAdmin ? "bg-warning/20" : isPartner ? "bg-accent/20" : "bg-primary/15"
          )}>
            <Icon className={cn("h-[18px] w-[18px]", isAdmin ? "text-warning" : isPartner ? "text-accent" : "text-primary")} />
          </div>
          <div className="min-w-0 flex-1 text-left">
            <div className={cn(
              "text-[13px] font-semibold leading-tight",
              isAdmin ? "text-warning" : isPartner ? "text-accent" : "text-primary"
            )}>
              {label}
            </div>
            <div className="text-[12px] text-sidebar-foreground/70 truncate mt-0.5">
              {subtitle}
            </div>
          </div>
        </div>
        {canSwitch && (
          <ChevronDown className={cn("h-4 w-4 text-sidebar-foreground/40 transition-transform flex-shrink-0 ml-2", open && "rotate-180")} />
        )}
      </button>

      {open && canSwitch && (
        <div className="mt-1.5 space-y-0.5 animate-fade-in">
          {availableModes.includes("compliance") && (
            <button
              onClick={() => handleSelectMode("compliance")}
              className={cn(
                "flex w-full items-center justify-between gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-colors",
                mode === "compliance"
                  ? "bg-sidebar-accent text-sidebar-primary font-medium border border-primary/20"
                  : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
              )}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="h-7 w-7 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                </div>
                <div className="text-left min-w-0">
                  <div className="text-[13px] font-medium truncate">{isNb ? "Min virksomhet" : "My organization"}</div>
                  <div className="text-[12px] text-sidebar-foreground/50 truncate">
                    {isNb ? "Compliance og styring" : "Compliance & governance"}
                  </div>
                </div>
              </div>
              {mode === "compliance" && <Check className="h-4 w-4 text-primary flex-shrink-0" />}
            </button>
          )}

          {availableModes.includes("partner") && (
            <button
              onClick={() => handleSelectMode("partner")}
              className={cn(
                "flex w-full items-center justify-between gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-colors",
                mode === "partner"
                  ? "bg-sidebar-accent text-sidebar-primary font-medium border border-accent/30"
                  : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
              )}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="h-7 w-7 rounded-md bg-accent/10 flex items-center justify-center flex-shrink-0">
                  <Handshake className="h-3.5 w-3.5 text-accent" />
                </div>
                <div className="text-left min-w-0">
                  <div className="text-[13px] font-medium truncate">{isNb ? "Partner" : "Partner"}</div>
                  <div className="text-[12px] text-sidebar-foreground/50 truncate">
                    {isNb ? "Kunder og tjenester" : "Customers & services"}
                  </div>
                </div>
              </div>
              {mode === "partner" && <Check className="h-4 w-4 text-accent flex-shrink-0" />}
            </button>
          )}

          {availableModes.includes("admin") && (
            <button
              onClick={() => handleSelectMode("admin")}
              className={cn(
                "flex w-full items-center justify-between gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-colors",
                mode === "admin"
                  ? "bg-sidebar-accent text-sidebar-primary font-medium border border-warning/30"
                  : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
              )}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="h-7 w-7 rounded-md bg-warning/10 flex items-center justify-center flex-shrink-0">
                  <Crown className="h-3.5 w-3.5 text-warning" />
                </div>
                <div className="text-left min-w-0">
                  <div className="text-[13px] font-medium truncate">{isNb ? "Mynder Admin" : "Mynder Admin"}</div>
                  <div className="text-[12px] text-sidebar-foreground/50 truncate">
                    {isNb ? "Intern administrasjon" : "Internal administration"}
                  </div>
                </div>
              </div>
              {mode === "admin" && <Check className="h-4 w-4 text-warning flex-shrink-0" />}
            </button>
          )}

          {/* Org switcher (only relevant in compliance mode) */}
          {mode === "compliance" && ownOrgs.length > 1 && (
            <>
              <div className="border-t border-sidebar-border my-1.5" />
              <div className="px-3 py-1 text-[11px] uppercase tracking-wide text-sidebar-foreground/40">
                {isNb ? "Bytt virksomhet" : "Switch organization"}
              </div>
              {ownOrgs.map((org) => {
                const isActive = activeOrg?.id === org.id;
                return (
                  <button
                    key={org.id}
                    onClick={() => { setActiveOrg(org); setOpen(false); navigate("/"); }}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-lg px-3 py-1.5 text-sm transition-colors",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-primary font-medium"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
                    )}
                  >
                    {isActive ? <Check className="h-3 w-3 text-primary flex-shrink-0" /> : <Building2 className="h-3 w-3 flex-shrink-0 opacity-50" />}
                    <span className="truncate">{org.name}</span>
                  </button>
                );
              })}
            </>
          )}
        </div>
      )}
    </div>
  );
}
