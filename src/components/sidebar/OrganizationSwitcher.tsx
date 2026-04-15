import { useState } from "react";
import { useActiveOrganization } from "@/contexts/ActiveOrganizationContext";
import { AddOrganizationDialog } from "./AddOrganizationDialog";
import { Building2, ChevronDown, Plus, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

export function OrganizationSwitcher() {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";
  const { activeOrg, setActiveOrg, organizations, loading, refetch } = useActiveOrganization();
  const [listOpen, setListOpen] = useState(false);
  const [addOrgOpen, setAddOrgOpen] = useState(false);

  const ownOrgs = organizations.filter((o) => o.type === "own");
  const partnerOrgs = organizations.filter((o) => o.type === "partner");

  if (loading || !activeOrg) {
    return (
      <div className="px-3 py-2">
        <div className="flex items-center gap-3 px-3 py-2.5">
          <div className="h-7 w-7 rounded-lg bg-sidebar-accent flex items-center justify-center">
            <Building2 className="h-3.5 w-3.5 text-sidebar-foreground/60" />
          </div>
          <div className="h-4 w-24 bg-sidebar-accent rounded animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="px-3 py-2">
        <button
          onClick={() => setListOpen(!listOpen)}
          className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 hover:bg-sidebar-accent transition-colors"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Building2 className="h-3.5 w-3.5 text-primary" />
            </div>
            <span className="text-sm font-medium text-sidebar-foreground truncate">
              {activeOrg.name}
            </span>
          </div>
          <ChevronDown className={cn("h-4 w-4 text-sidebar-foreground/50 transition-transform flex-shrink-0", listOpen && "rotate-180")} />
        </button>

        {listOpen && (
          <div className="mt-1 ml-2 space-y-0.5 animate-fade-in">
            {ownOrgs.length > 0 && (
              <>
                <p className="px-3 pt-2 pb-1 text-[11px] font-semibold text-sidebar-foreground/40 uppercase tracking-wider">
                  {isNb ? "Mine virksomheter" : "My organizations"}
                </p>
                {ownOrgs.map((org) => {
                  const isActive = activeOrg.id === org.id;
                  return (
                    <button
                      key={org.id}
                      onClick={() => { setActiveOrg(org); setListOpen(false); }}
                      className={cn(
                        "flex w-full items-center gap-2.5 rounded-lg px-3 py-1.5 text-sm transition-colors",
                        isActive
                          ? "bg-sidebar-accent text-sidebar-primary font-medium"
                          : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
                      )}
                    >
                      {isActive ? <Check className="h-3 w-3 text-primary flex-shrink-0" /> : <span className="h-3 w-3 flex-shrink-0" />}
                      <span className="truncate">{org.name}</span>
                    </button>
                  );
                })}
              </>
            )}

            {partnerOrgs.length > 0 && (
              <>
                <p className="px-3 pt-3 pb-1 text-[11px] font-semibold text-sidebar-foreground/40 uppercase tracking-wider">
                  {isNb ? "Partnerkunder" : "Partner customers"}
                </p>
                {partnerOrgs.map((org) => {
                  const isActive = activeOrg.id === org.id;
                  return (
                    <button
                      key={org.id}
                      onClick={() => { setActiveOrg(org); setListOpen(false); }}
                      className={cn(
                        "flex w-full items-center gap-2.5 rounded-lg px-3 py-1.5 text-sm transition-colors",
                        isActive
                          ? "bg-sidebar-accent text-sidebar-primary font-medium"
                          : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
                      )}
                    >
                      {isActive ? <Check className="h-3 w-3 text-primary flex-shrink-0" /> : <span className="h-3 w-3 flex-shrink-0" />}
                      <span className="truncate">{org.name}</span>
                    </button>
                  );
                })}
              </>
            )}

            <div className="border-t border-sidebar-border my-1.5" />
            <button
              onClick={() => { setAddOrgOpen(true); setListOpen(false); }}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-1.5 text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              {isNb ? "Legg til virksomhet" : "Add organization"}
            </button>
          </div>
        )}
      </div>

      <AddOrganizationDialog open={addOrgOpen} onOpenChange={(open) => {
        setAddOrgOpen(open);
        if (!open) {
          setTimeout(() => refetch(), 500);
        }
      }} />
    </>
  );
}
