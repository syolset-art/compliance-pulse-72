import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "react-i18next";
import { Inbox, Bell } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useIsMobile } from "@/hooks/use-mobile";

export function TopBar() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const isMobile = useIsMobile();

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

  if (isMobile) return null;

  const initials = user?.email?.substring(0, 2).toUpperCase() || "??";

  return (
    <div className="h-12 border-b border-border bg-background/95 backdrop-blur-sm flex items-center justify-end gap-1 px-4 shrink-0">
      <LanguageSwitcher />
      <ThemeToggle />

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

      <button
        onClick={() => navigate("/company-settings")}
        className="ml-1 flex items-center gap-2 p-1.5 rounded-lg hover:bg-muted transition-colors"
      >
        <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center">
          <span className="text-xs font-medium text-primary">{initials}</span>
        </div>
        <span className="text-sm text-muted-foreground hidden lg:inline max-w-[160px] truncate">
          {user?.email}
        </span>
      </button>
    </div>
  );
}
