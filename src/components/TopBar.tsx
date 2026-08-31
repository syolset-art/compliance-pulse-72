import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "react-i18next";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useDemoSyncOptional } from "@/contexts/DemoSyncContext";
import {
  Moon, Sun, Check, Globe, Settings, Shield, LogOut, ChevronRight, HelpCircle, Bell, Compass, FileText, BookOpen,
} from "lucide-react";

import avatarProfile from "../../public/avatar-profile.png";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";
import { WorkspaceSwitcherCompact } from "@/components/sidebar/WorkspaceSwitcherCompact";
import { CustomerContextBar } from "@/components/msp/CustomerContextBar";
import { useWorkspaceMode } from "@/contexts/WorkspaceModeContext";
import { PartnerActivationNotice } from "@/components/legal/PartnerActivationNotice";
import { PartnerTermsGateDialog } from "@/components/legal/PartnerTermsGateDialog";

const AVAILABLE_ROLES = [
  { key: "admin", labelNb: "Administrator", labelEn: "Administrator" },
  { key: "compliance_officer", labelNb: "Compliance-ansvarlig", labelEn: "Compliance Officer" },
  { key: "dpo", labelNb: "Personvernombud (DPO)", labelEn: "Data Protection Officer" },
  { key: "ciso", labelNb: "CISO / Sikkerhetsansvarlig", labelEn: "CISO / Security Officer" },
  { key: "it_manager", labelNb: "IT-ansvarlig", labelEn: "IT Manager" },
  { key: "risk_owner", labelNb: "Risikoeier", labelEn: "Risk Owner" },
  { key: "member", labelNb: "Medlem", labelEn: "Member" },
];

export function TopBar() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();
  const isNb = i18n.language === "nb";
  const { mode: workspaceMode } = useWorkspaceMode();
  const demoSync = useDemoSyncOptional();
  const demoActive = demoSync?.customerRequestDemo ?? false;

  // Mapping from TopBar role keys to AppRole keys used by sidebar/dashboard
  const TOPBAR_TO_APP_ROLE: Record<string, string> = {
    admin: "compliance_ansvarlig",
    compliance_officer: "compliance_ansvarlig",
    dpo: "personvernombud",
    ciso: "sikkerhetsansvarlig",
    it_manager: "it_manager",
    risk_owner: "risk_owner",
    member: "operativ_bruker",
  };

  // Active role stored in localStorage
  const activeRole = localStorage.getItem("user_active_role") || "member";
  const setActiveRole = (role: string) => {
    localStorage.setItem("user_active_role", role);
    // Also update the demo role used by sidebar highlights & dashboard
    const appRole = TOPBAR_TO_APP_ROLE[role] || "compliance_ansvarlig";
    localStorage.setItem("mynder_demo_role", appRole);
    const currentRoles = JSON.parse(localStorage.getItem("mynder_demo_roles") || '["compliance_ansvarlig"]');
    if (!currentRoles.includes(appRole)) {
      localStorage.setItem("mynder_demo_roles", JSON.stringify([...currentRoles, appRole]));
    }
    const r = AVAILABLE_ROLES.find((r) => r.key === role);
    toast.success(isNb ? `Rolle satt til ${r?.labelNb}` : `Role set to ${r?.labelEn}`);
    window.dispatchEvent(new Event("storage"));
    // Trigger react-query refetch for role-dependent components
    window.location.reload();
  };


  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    toast.success(lng === "en" ? "Language set to English" : "Språk satt til Norsk (Bokmål)");
  };

  const currentRoleLabel = AVAILABLE_ROLES.find((r) => r.key === activeRole);

  const { data: messageCount = 0 } = useQuery({
    queryKey: ["topbar-customer-request-count"],
    queryFn: async () => {
      const { count } = await supabase
        .from("customer_compliance_requests" as any)
        .select("id", { count: "exact", head: true })
        .not("status", "in", "(archived,responded)");
      return count ?? 0;
    },
  });

  return (
    <div className="fixed top-0 right-0 z-40 h-11 border-b border-border bg-background/95 backdrop-blur-sm flex items-center gap-1 px-4 left-0 md:left-64 transition-colors">

      <CustomerContextBar />
      <PartnerActivationNotice />
      <PartnerTermsGateDialog />


      {/* Push everything to the right */}
      <div className="ml-auto flex items-center gap-1">

      {/* Workspace / organization switcher */}
      <WorkspaceSwitcherCompact />
      <div className="mx-1 h-5 w-px bg-border" />


      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent("open-page-help"))}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <HelpCircle className="h-4 w-4 text-muted-foreground" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p className="text-sm">{isNb ? "Hjelp og handlinger" : "Help & actions"}</p>
        </TooltipContent>
      </Tooltip>

      {/* Notifications bell */}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={() => navigate("/customer-requests")}
            className={cn("relative p-2 rounded-lg hover:bg-muted transition-colors", demoActive && "animate-pulse")}
          >
            <Bell className={cn("h-4 w-4", (demoActive || messageCount > 0) ? "text-primary" : "text-muted-foreground")} />
            {messageCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-semibold flex items-center justify-center ring-2 ring-background">
                {messageCount > 9 ? "9+" : messageCount}
              </span>
            )}
            {messageCount === 0 && demoActive && (
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive ring-2 ring-background" />
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p className="text-sm">
            {isNb ? `Meldinger${messageCount > 0 ? ` (${messageCount})` : ""}` : `Messages${messageCount > 0 ? ` (${messageCount})` : ""}`}
          </p>
        </TooltipContent>
      </Tooltip>


      {/* Profile avatar with dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="ml-1 h-8 w-8 rounded-full overflow-hidden hover:ring-2 hover:ring-primary/30 transition-all focus:outline-none focus:ring-2 focus:ring-primary/40">
            <img src={avatarProfile} alt="Profil" className="h-full w-full object-cover" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {/* User info */}
          <DropdownMenuLabel className="font-normal">
            <p className="text-sm font-medium truncate">{user?.email}</p>
            <p className="text-sm text-muted-foreground mt-0.5">
              {isNb ? currentRoleLabel?.labelNb : currentRoleLabel?.labelEn}
            </p>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />




          {/* Language */}
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="gap-2">
              <Globe className="h-4 w-4" />
              {isNb ? "Språk" : "Language"}
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                <DropdownMenuItem onClick={() => changeLanguage("nb")} className="flex items-center justify-between">
                  Norsk (Bokmål)
                  {i18n.language === "nb" && <Check className="h-3.5 w-3.5 text-primary" />}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => changeLanguage("en")} className="flex items-center justify-between">
                  English
                  {i18n.language === "en" && <Check className="h-3.5 w-3.5 text-primary" />}
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>

          {/* Theme */}
          <DropdownMenuItem onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="gap-2">
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            {theme === "dark"
              ? (isNb ? "Lys modus" : "Light mode")
              : (isNb ? "Mørk modus" : "Dark mode")}
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* Dokumenter */}
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="gap-2">
              <FileText className="h-4 w-4" />
              {isNb ? "Dokumenter" : "Documents"}
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                <DropdownMenuItem onClick={() => navigate("/dokumenter")}>
                  {isNb ? "Alle dokumenter" : "All documents"}
                </DropdownMenuItem>
                {workspaceMode === "partner" && (
                  <DropdownMenuItem onClick={() => navigate("/dokumenter/vilkar-for-partnere")}>
                    {isNb ? "Partnervilkår" : "Partner terms"}
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={() =>
                    window.open(
                      `https://mynder.no/${isNb ? "no" : "en"}/trust-center`,
                      "_blank",
                      "noopener,noreferrer",
                    )
                  }
                >
                  {isNb ? "Trust Center" : "Trust Center"}
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>



          {/* Mynder Wiki */}
          <DropdownMenuItem onClick={() => navigate("/wiki")} className="gap-2">
            <BookOpen className="h-4 w-4" />
            Mynder Wiki
          </DropdownMenuItem>



        </DropdownMenuContent>
      </DropdownMenu>
      </div>
    </div>
  );
}
