import { Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  FileText, 
  Grid3x3, 
  Users, 
  AlertTriangle, 
  ClipboardList,
  Settings,
  Shield,
  ChevronDown,
  Bot,
  Menu,
  Leaf,
  MessageSquare,
  Sparkles
} from "lucide-react";
import mynderLogo from "@/assets/mynder-logo.png";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

const navigation = [
  { name: "nav.dashboard", href: "/", icon: LayoutDashboard },
  { name: "nav.protocols", href: "/protocols", icon: FileText },
  { name: "nav.assets", href: "/assets", icon: Grid3x3 },
  { name: "nav.myWorkAreas", href: "/services", icon: Users },
  { name: "nav.deviations", href: "/deviations", icon: AlertTriangle },
  { name: "nav.tasks", href: "/tasks", icon: ClipboardList },
  { name: "nav.sustainability", href: "/sustainability", icon: Leaf, highlight: true },
  { name: "nav.transparency", href: "/transparency", icon: FileText, highlight: true },
];

const adminSubMenu = [
  { name: "nav.aiSetup", href: "/ai-setup", icon: Bot, highlight: true },
];

interface SidebarContentProps {
  onToggleChat?: () => void;
}

const SidebarContent = ({ onToggleChat }: SidebarContentProps) => {
  const location = useLocation();
  const { t } = useTranslation();
  const [adminOpen, setAdminOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Check if any admin submenu item is active
  const isAdminActive = adminSubMenu.some(item => location.pathname === item.href);
  return (
    <>
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-6 border-b border-border">
        <img src={mynderLogo} alt="Mynder" className="h-8" />
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </div>

      {/* Mode Toggle */}
      {onToggleChat && (
        <div className="px-3 pt-4 pb-2">
          <div className="flex gap-2 p-1 bg-muted rounded-lg">
            <button
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-background text-foreground shadow-sm font-medium text-sm transition-all"
            >
              <Menu className="h-4 w-4" />
              {t("nav.menu")}
            </button>
            <button
              onClick={onToggleChat}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-muted-foreground hover:text-foreground font-medium text-sm transition-all"
            >
              <Sparkles className="h-4 w-4" />
              {t("nav.chat")}
            </button>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors relative",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              {t(item.name)}
              {item.highlight && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                </span>
              )}
            </Link>
          );
        })}

        <div className="pt-4">
          <button 
            onClick={() => setAdminOpen(!adminOpen)}
            className={cn(
              "flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              isAdminActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent hover:text-foreground"
            )}
          >
            <div className="flex items-center gap-3">
              <Settings className="h-5 w-5" />
              {t("nav.admin")}
            </div>
            <ChevronDown className={cn("h-4 w-4 transition-transform", adminOpen && "rotate-180")} />
          </button>
          
          {/* Admin Submenu */}
          {adminOpen && (
            <div className="ml-4 mt-1 space-y-1">
              {adminSubMenu.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors relative",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {t(item.name)}
                    {item.highlight && (
                      <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        <div className="pt-1">
          <button 
            onClick={() => setSettingsOpen(!settingsOpen)}
            className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <div className="flex items-center gap-3">
              <Settings className="h-5 w-5" />
              {t("nav.settings")}
            </div>
            <ChevronDown className={cn("h-4 w-4 transition-transform", settingsOpen && "rotate-180")} />
          </button>
        </div>

        <Link
          to="/trust-profile"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <Shield className="h-5 w-5" />
          {t("nav.trustProfile")}
        </Link>
      </nav>

      {/* User info at bottom */}
      <div className="border-t border-border p-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-sm font-medium text-primary">EV</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">Eviny</p>
            <button className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
              <span>{t("nav.switchOrganization")}</span>
              <ChevronDown className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

interface SidebarProps {
  onToggleChat?: () => void;
}

export function Sidebar({ onToggleChat }: SidebarProps) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);

  if (isMobile) {
    return (
      <>
        <div className="fixed top-0 left-0 right-0 z-50 flex h-16 items-center justify-between px-4 border-b border-border bg-card">
          <img src={mynderLogo} alt="Mynder" className="h-6" />
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <ThemeToggle />
            <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button className="p-2 hover:bg-accent rounded-lg">
                <Menu className="h-6 w-6 text-foreground" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64">
              <div className="flex h-full flex-col bg-card">
                <SidebarContent onToggleChat={onToggleChat} />
              </div>
            </SheetContent>
          </Sheet>
          </div>
        </div>
        <div className="h-16" /> {/* Spacer for fixed header */}
      </>
    );
  }

  return (
    <div className="flex h-screen w-64 flex-col border-r border-border bg-card">
      <SidebarContent onToggleChat={onToggleChat} />
    </div>
  );
}
