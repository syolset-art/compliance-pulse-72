import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "react-i18next";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import {
  Inbox, Moon, Sun, Check, Globe, Settings, Shield, LogOut, ChevronRight, HelpCircle,
} from "lucide-react";
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

  const { data: inboxCount = 0 } = useQuery({
    queryKey: ["lara-inbox-total"],
    queryFn: async () => {
      const { count } = await supabase
        .from("lara_inbox")
        .select("id", { count: "exact", head: true })
        .in("status", ["new", "auto_matched"]);
      return count || 0;
    },
  });

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    toast.success(lng === "en" ? "Language set to English" : "Språk satt til Norsk (Bokmål)");
  };

  const initials = user?.email?.substring(0, 2).toUpperCase() || "??";
  const currentRoleLabel = AVAILABLE_ROLES.find((r) => r.key === activeRole);

  return (
    <div className="fixed top-0 right-0 left-64 z-40 h-11 border-b border-border bg-background/95 backdrop-blur-sm hidden md:flex items-center justify-end gap-1 px-4">
      {/* Inbox */}
      <button
        onClick={() => navigate("/lara-inbox")}
        className="relative p-2 rounded-lg hover:bg-muted transition-colors"
        title={t("vendorDashboard.laraInbox", "Innboks")}
      >
        <Inbox className="h-4 w-4 text-muted-foreground" />
        {inboxCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
            {inboxCount}
          </span>
        )}
      </button>

      {/* Profile avatar with dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="ml-1 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center hover:ring-2 hover:ring-primary/30 transition-all focus:outline-none focus:ring-2 focus:ring-primary/40">
            <span className="text-xs font-semibold text-primary">{initials}</span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {/* User info */}
          <DropdownMenuLabel className="font-normal">
            <p className="text-sm font-medium truncate">{user?.email}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isNb ? currentRoleLabel?.labelNb : currentRoleLabel?.labelEn}
            </p>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          {/* Role selector */}
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="gap-2">
              <Shield className="h-4 w-4" />
              {isNb ? "Rolle" : "Role"}
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                {AVAILABLE_ROLES.map((role) => (
                  <DropdownMenuItem
                    key={role.key}
                    onClick={() => setActiveRole(role.key)}
                    className="flex items-center justify-between"
                  >
                    {isNb ? role.labelNb : role.labelEn}
                    {activeRole === role.key && <Check className="h-3.5 w-3.5 text-primary" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>

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

          {/* Settings */}
          <DropdownMenuItem onClick={() => navigate("/company-settings")} className="gap-2">
            <Settings className="h-4 w-4" />
            {isNb ? "Innstillinger" : "Settings"}
          </DropdownMenuItem>

          {/* Sign out */}
          <DropdownMenuItem
            onClick={async () => { await supabase.auth.signOut(); navigate("/auth"); }}
            className="gap-2 text-destructive focus:text-destructive"
          >
            <LogOut className="h-4 w-4" />
            {isNb ? "Logg ut" : "Sign out"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
