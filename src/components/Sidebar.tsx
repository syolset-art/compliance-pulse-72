import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  FileText, 
  Package, 
  Users, 
  AlertTriangle, 
  ClipboardList,
  Settings,
  Shield,
  ChevronDown,
  Bot,
  Menu,
  Leaf,
  Building2,
  Scale,
  CreditCard,
  FileCheck,
  FileBarChart
} from "lucide-react";
import mynderLogo from "@/assets/mynder-logo.png";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";

const navigation = [
  { name: "nav.dashboard", href: "/", icon: LayoutDashboard },
  { name: "nav.protocols", href: "/protocols", icon: FileText },
  { name: "nav.assets", href: "/assets", icon: Package },
  { name: "nav.myWorkAreas", href: "/work-areas", icon: Users },
  { name: "nav.deviations", href: "/deviations", icon: AlertTriangle },
  { name: "nav.tasks", href: "/tasks", icon: ClipboardList },
  { name: "nav.reports", href: "/reports", icon: FileBarChart },
  { name: "nav.sustainability", href: "/sustainability", icon: Leaf, highlight: true },
  { name: "nav.transparency", href: "/transparency", icon: FileText, highlight: true },
];

const adminSubMenu = [
  { name: "nav.aiSetup", href: "/ai-setup", icon: Bot, highlight: true },
  { name: "nav.aiRegistry", href: "/ai-registry", icon: Bot, highlight: true },
];

const SidebarContent = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [adminOpen, setAdminOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [companyOpen, setCompanyOpen] = useState(false);
  const [companyName, setCompanyName] = useState<string | null>(null);

  useEffect(() => {
    const fetchCompany = async () => {
      const { data } = await supabase
        .from("company_profile")
        .select("name")
        .limit(1)
        .maybeSingle();
      
      if (data?.name) {
        setCompanyName(data.name);
      }
    };
    fetchCompany();
  }, []);

  // Check if any admin submenu item is active
  const isAdminActive = adminSubMenu.some(item => location.pathname === item.href);
  
  return (
    <>
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-6 border-b border-border">
        <Link to="/" className="cursor-pointer">
          <img src={mynderLogo} alt="Mynder" className="h-8" />
        </Link>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
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

      {/* Company section at bottom */}
      <div className="border-t border-border">
        {companyName ? (
          <div className="p-3">
            <button 
              onClick={() => setCompanyOpen(!companyOpen)}
              className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 hover:bg-accent transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-medium text-primary">
                    {companyName.substring(0, 2).toUpperCase()}
                  </span>
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-foreground truncate max-w-[120px]">
                    {companyName}
                  </p>
                  <p className="text-xs text-muted-foreground">Selskap</p>
                </div>
              </div>
              <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", companyOpen && "rotate-180")} />
            </button>

            {/* Company submenu */}
            {companyOpen && (
              <div className="mt-2 ml-2 space-y-1 animate-fade-in">
                <button
                  onClick={() => navigate('/company-settings')}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                >
                  <Building2 className="h-4 w-4" />
                  Selskapsinnstillinger
                </button>
                <button
                  onClick={() => navigate('/subscriptions')}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                >
                  <CreditCard className="h-4 w-4" />
                  Abonnementer
                </button>
                <button
                  onClick={() => navigate('/terms-and-consent')}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                >
                  <FileCheck className="h-4 w-4" />
                  Betingelser og samtykke
                </button>
                <button
                  onClick={() => navigate('/regulations')}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                >
                  <Scale className="h-4 w-4" />
                  Regelverk og krav
                </button>
                <div className="border-t border-border my-2" />
                <button
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                >
                  <span className="text-xs">{t("nav.switchOrganization")}</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                <Building2 className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-muted-foreground">Ikke registrert</p>
                <p className="text-xs text-muted-foreground">Klikk på Lara for å starte</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export function Sidebar() {
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
                <SidebarContent />
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
    <div className="flex h-screen w-64 flex-shrink-0 flex-col bg-card shadow-[2px_0_8px_-2px_rgba(0,0,0,0.1)] dark:shadow-[2px_0_8px_-2px_rgba(0,0,0,0.3)]">
      <SidebarContent />
    </div>
  );
}
