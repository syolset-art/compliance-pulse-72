import { Link, useLocation, useNavigate } from "react-router-dom";
import { TopBar } from "@/components/TopBar";
import { useUserRole } from "@/hooks/useUserRole";
import { ROLE_SIDEBAR_HIGHLIGHTS } from "@/lib/roleContentConfig";
import { Badge } from "@/components/ui/badge";
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
  FileBarChart,
  HelpCircle,
  LogOut,
  RotateCcw,
  FileQuestion,
  Play,
  Code2,
  Globe,
  Share2,
  Layers,
  CalendarDays,
  CheckCircle2,
  Cloud,
  Bell
} from "lucide-react";
import mynderLogoInverted from "@/assets/mynder-logo-inverted.png";
import mynderLogo from "@/assets/mynder-logo.png";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { RoleSwitcher } from "@/components/dashboard/RoleSwitcher";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// Top-level dashboard links
const dashboardNav = [
  { name: "nav.dashboard", href: "/", icon: LayoutDashboard },
  { name: "Dashboard 2.0", href: "/dashboard-v2", icon: Shield, highlight: true },
];

// Organisasjon section (workplace-oriented)
const organisationNav = [
  { name: "nav.myWorkAreas", href: "/work-areas", icon: Users },
  { name: "nav.deviations", href: "/deviations", icon: AlertTriangle },
  { name: "nav.tasks", href: "/tasks", icon: ClipboardList },
  { name: "nav.regulations", href: "/regulations", icon: Scale },
  { name: "nav.reports", href: "/reports", icon: FileText },
];

// Moduler section (data modules)
const modulesNav = [
  { name: "nav.vendors", href: "/vendors", icon: Building2 },
  { name: "nav.systems", href: "/systems", icon: Cloud },
  { name: "nav.assetsDevices", href: "/assets", icon: Package },
  { name: "nav.requests", href: "/customer-requests", icon: FileQuestion },
];

// Administrasjon submenu
const administrationMenu = [
  { name: "nav.adminOrganisation", href: "/admin/organisation", icon: Building2 },
  { name: "nav.accessManagement", href: "/admin/access", icon: Users },
  { name: "nav.adminDocuments", href: "/admin/documents", icon: FileText },
  { name: "nav.adminNotifications", href: "/admin/notifications", icon: Bell },
];

const TrustCenterMenu = () => {
  const { t, i18n } = useTranslation();
  const isNb = i18n.language === "nb";
  const location = useLocation();
  const navigate = useNavigate();
  const [selfAssetId, setSelfAssetId] = useState<string | null>(null);
  const [open, setOpen] = useState(() => 
    location.pathname.startsWith("/trust-center") || 
    location.pathname.startsWith("/assets/") || 
    location.pathname === "/customer-requests"
  );

  useEffect(() => {
    const fetchOrCreateSelf = async () => {
      const { data } = await supabase
        .from("assets")
        .select("id")
        .eq("asset_type", "self")
        .limit(1)
        .maybeSingle();
      if (data) {
        setSelfAssetId(data.id);
      } else {
        const { data: profile } = await supabase
          .from("company_profile")
          .select("name")
          .limit(1)
          .maybeSingle();
        if (profile?.name) {
          const { data: created } = await supabase
            .from("assets")
            .insert({
              name: profile.name,
              asset_type: "self",
              description: "Vår egen Trust Profil – selverklæring og compliance-dokumentasjon",
              lifecycle_status: "active",
              compliance_score: 0,
            })
            .select("id")
            .single();
          if (created) setSelfAssetId(created.id);
        }
      }
    };
    fetchOrCreateSelf();
  }, []);

  const trustCenterItems = [
    { name: "Trust Profile", href: "/trust-center/profile", icon: Shield },
    { name: isNb ? "Rediger profil" : "Edit Profile", href: "/trust-center/edit", icon: Settings },
    { name: "Products & Services", href: "/trust-center/products", icon: Layers },
    { name: "Krav og standarder", href: "/regulations", icon: Scale },
    { name: isNb ? "Dokumentasjon & Evidens" : "Documentation & Evidence", href: "/trust-center/evidence", icon: FileText },
    { name: "Contact & Requests", href: "/customer-requests", icon: FileQuestion },
  ];

  const isActive = trustCenterItems.some(item => item.href && location.pathname === item.href);

  return (
    <div className="pt-2">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-silk",
          isActive
            ? "bg-sidebar-accent text-sidebar-primary shadow-sm"
            : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
        )}
      >
        <div className="flex items-center gap-3">
          <Globe className="h-5 w-5" />
          Trust Center
        </div>
        <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="ml-4 mt-1 space-y-1">
          {trustCenterItems.map((item) => {
            if (!item.href) return null;
            const itemActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  itemActive
                    ? "bg-sidebar-accent text-sidebar-primary"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

const SidebarContent = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isNb = i18n.language === "nb";
  const { signOut, user } = useAuth();
  const queryClient = useQueryClient();
  const { primaryRole } = useUserRole();
  const highlights = ROLE_SIDEBAR_HIGHLIGHTS[primaryRole] || [];
  
  const [devOpen, setDevOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [comingOpen, setComingOpen] = useState(false);
  const [companyOpen, setCompanyOpen] = useState(() => location.pathname.startsWith("/msp-"));
  const [partnerOpen, setPartnerOpen] = useState(() => location.pathname.startsWith("/msp-"));
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [hasQualityModule, setHasQualityModule] = useState(false);

  useEffect(() => {
    const fetchQualityModules = async () => {
      const { data } = await supabase
        .from('quality_modules' as any)
        .select('id')
        .eq('is_active', true)
        .limit(1);
      setHasQualityModule(!!(data && data.length > 0));
    };
    fetchQualityModules();
  }, []);

  const handleResetDemo = async () => {
    setResetting(true);
    try {
      await supabase.from("vendor_documents" as any).delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabase.from("lara_inbox").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabase.from("asset_ai_usage").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabase.from("asset_relationships").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabase.from("assets").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabase.from("onboarding_progress").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabase.from("company_profile").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      
      queryClient.clear();
      toast.success("Demo tilbakestilt! Starter onboarding på nytt...");
      navigate("/");
      window.location.reload();
    } catch (error) {
      console.error("Reset error:", error);
      toast.error("Kunne ikke tilbakestille demo");
    } finally {
      setResetting(false);
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await signOut();
      toast.success(t("nav.logoutSuccess", "Du er nå logget ut"));
      navigate("/auth");
    } catch (error) {
      toast.error(t("nav.logoutError", "Kunne ikke logge ut"));
    } finally {
      setLoggingOut(false);
    }
  };

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

  const isAdminActive = administrationMenu.some(item => location.pathname === item.href);
  const [adminOpen, setAdminOpen] = useState(() => isAdminActive || location.pathname.startsWith("/admin/"));
  
  return (
    <>
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-6 border-b border-sidebar-border">
        <Link to="/" className="cursor-pointer">
          <img src={mynderLogo} alt="Mynder" className="h-8 dark:hidden" />
          <img src={mynderLogoInverted} alt="Mynder" className="h-8 hidden dark:block" />
        </Link>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
        {/* Dashboard links */}
        {dashboardNav.map((item) => {
          const isActive = location.pathname === item.href;
          const isHighlighted = highlights.includes(item.href);
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-silk relative",
                isActive
                  ? "bg-sidebar-accent text-sidebar-primary shadow-sm"
                  : isHighlighted
                    ? "text-sidebar-foreground/90 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                    : "text-sidebar-foreground/40 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground/70"
              )}
            >
              <item.icon className="h-5 w-5" />
              {t(item.name)}
              {item.highlight && (
                <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 py-0">Ny</Badge>
              )}
            </Link>
          );
        })}

        {/* Organisasjon section */}
        <div className="pt-3">
          <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/40">
            {t("nav.organisation", "Organisasjon")}
          </p>
          {organisationNav.map((item) => {
            const isActive = location.pathname === item.href;
            const isHighlighted = highlights.includes(item.href);
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-silk relative",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-primary shadow-sm"
                    : isHighlighted
                      ? "text-sidebar-foreground/90 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                      : "text-sidebar-foreground/40 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground/70"
                )}
              >
                <item.icon className="h-5 w-5" />
                {t(item.name)}
              </Link>
            );
          })}
        </div>

        {/* Moduler section */}
        <div className="pt-3">
          <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/40">
            {t("nav.modules", "Moduler")}
          </p>
          {modulesNav.map((item) => {
            const isActive = location.pathname === item.href;
            const isHighlighted = highlights.includes(item.href);
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-silk relative",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-primary shadow-sm"
                    : isHighlighted
                      ? "text-sidebar-foreground/90 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                      : "text-sidebar-foreground/40 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground/70"
                )}
              >
                <item.icon className="h-5 w-5" />
                {t(item.name)}
              </Link>
            );
          })}
        </div>

        {/* Administrasjon section - moved up */}
        <div className="pt-3">
          <button
            onClick={() => setAdminOpen(!adminOpen)}
            className={cn(
              "flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-silk",
              isAdminActive || location.pathname.startsWith("/admin/")
                ? "bg-sidebar-accent text-sidebar-primary shadow-sm"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
            )}
          >
            <div className="flex items-center gap-3">
              <Settings className="h-5 w-5" />
              {t("nav.administration", "Administrasjon")}
            </div>
            <ChevronDown className={cn("h-4 w-4 transition-transform", adminOpen && "rotate-180")} />
          </button>

          {adminOpen && (
            <div className="ml-4 mt-1 space-y-1">
              {administrationMenu.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-primary"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {t(item.name)}
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        <TrustCenterMenu />

        {/* Kommer section - upcoming features */}
        <div className="pt-3">
          <button
            onClick={() => setComingOpen(!comingOpen)}
            className={cn(
              "flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-silk",
              "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
            )}
          >
            <div className="flex items-center gap-3">
              <Play className="h-5 w-5" />
              {t("nav.coming", "Kommer")}
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Beta</Badge>
            </div>
            <ChevronDown className={cn("h-4 w-4 transition-transform", comingOpen && "rotate-180")} />
          </button>

          {comingOpen && (
            <div className="ml-4 mt-1 space-y-1">
              {[
                { name: t("quality.title", "Kvalitetssystem"), href: "/quality", icon: Shield },
                { name: t("nav.complianceSecurity", "Compliance & Security"), href: "/compliance", icon: Shield },
                { name: t("nav.reportsAdmin", "Rapporter & Admin"), href: "/reports", icon: FileBarChart },
                { name: t("nav.resources", "Ressurssenter"), href: "/resources", icon: HelpCircle },
                { name: t("nav.aiSetup", "AI-agent"), href: "/ai-setup", icon: Bot },
                { name: t("nav.aiRegistry", "AI-register"), href: "/ai-registry", icon: Bot },
                { name: "Utviklere", href: "/developer/trust-profile-architecture", icon: Code2 },
                { name: "Mynder Me", href: "/mynder-me", icon: Users },
                { name: "Leverandørdemo", href: "/vendor-response-demo", icon: Play },
              ].map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-primary"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Demo Reset Button */}
        <div className="mt-4 px-1">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10 transition-silk"
                disabled={resetting}
              >
                <RotateCcw className={cn("h-5 w-5", resetting && "animate-spin")} />
                {resetting ? "Tilbakestiller..." : "Start demo på nytt"}
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Tilbakestill demo?</AlertDialogTitle>
                <AlertDialogDescription>
                  All data blir slettet – leverandører, innboks, dokumenter og bedriftsprofil. 
                  Du starter onboarding fra begynnelsen.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Avbryt</AlertDialogCancel>
                <AlertDialogAction onClick={handleResetDemo} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Ja, tilbakestill
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </nav>

      {/* Company section at bottom */}
      <div className="border-t border-sidebar-border">
        {companyName ? (
          <div className="p-3">
            <button 
              onClick={() => setCompanyOpen(!companyOpen)}
              className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 hover:bg-sidebar-accent transition-colors"
            >
              <div className="flex items-center gap-3">
                <Building2 className="h-5 w-5 text-sidebar-foreground/70" />
                <p className="text-sm font-medium text-sidebar-foreground truncate max-w-[140px]">
                  {companyName}
                </p>
              </div>
              <ChevronDown className={cn("h-4 w-4 text-sidebar-foreground/60 transition-transform", companyOpen && "rotate-180")} />
            </button>

            {/* Company submenu */}
            {companyOpen && (
              <div className="mt-2 ml-2 space-y-1 animate-fade-in">
                <button
                  onClick={() => navigate('/company-settings')}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
                >
                  <Building2 className="h-4 w-4" />
                  {t("nav.companySettings")}
                </button>
                <button
                  onClick={() => navigate('/msp-invoices')}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
                >
                  <FileText className="h-4 w-4" />
                  {isNb ? "Faktura" : "Invoices"}
                </button>
                <button
                  onClick={() => navigate('/subscriptions')}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
                >
                  <CreditCard className="h-4 w-4" />
                  {t("nav.subscriptions")}
                </button>
                <button
                  onClick={() => navigate('/terms-and-consent')}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
                >
                  <FileCheck className="h-4 w-4" />
                  {t("nav.termsAndConsent")}
                </button>
                <button
                  onClick={() => navigate('/regulations')}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
                >
                  <Scale className="h-4 w-4" />
                  {t("nav.regulations")}
                </button>
                <div className="border-t border-sidebar-border my-2" />
                {/* Partner submenu */}
                <button
                  onClick={() => setPartnerOpen(!partnerOpen)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    location.pathname.startsWith("/msp-") ? "text-sidebar-primary" : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Building2 className="h-4 w-4" />
                    Partner
                  </div>
                  <ChevronDown className={cn("h-3 w-3 transition-transform", partnerOpen && "rotate-180")} />
                </button>
                {partnerOpen && (
                  <div className="ml-4 space-y-1">
                    {[
                      { name: "Kunder", href: "/msp-dashboard", icon: Users },
                      { name: "Lisenser", href: "/msp-licenses", icon: CreditCard },
                      { name: "Faktura", href: "/msp-invoices", icon: FileText },
                      { name: "ROI-kalkulator", href: "/msp-roi", icon: FileBarChart },
                      { name: "Salgsguide", href: "/msp-sales-guide", icon: FileText },
                    ].map((item) => {
                      const isActive = location.pathname === item.href;
                      return (
                        <button
                          key={item.href}
                          onClick={() => navigate(item.href)}
                          className={cn(
                            "flex w-full items-center gap-3 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                            isActive
                              ? "bg-sidebar-accent text-sidebar-primary"
                              : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                          )}
                        >
                          <item.icon className="h-3.5 w-3.5" />
                          {item.name}
                        </button>
                      );
                    })}
                  </div>
                )}
                <button
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
                >
                  <span className="text-xs">{t("nav.switchOrganization")}</span>
                </button>
                <button
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  {loggingOut ? t("nav.loggingOut") : t("nav.logout")}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-sidebar-accent flex items-center justify-center">
                <Building2 className="h-5 w-5 text-sidebar-foreground/60" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-sidebar-foreground/70">{t("nav.notRegistered")}</p>
                <p className="text-xs text-sidebar-foreground/50">{t("nav.clickLaraToStart")}</p>
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
            <button
              onClick={() => window.dispatchEvent(new CustomEvent("open-page-help"))}
              className="p-2 hover:bg-accent rounded-lg"
            >
              <HelpCircle className="h-5 w-5 text-muted-foreground" />
            </button>
            <LanguageSwitcher />
            <ThemeToggle />
            <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button className="p-2 hover:bg-accent rounded-lg">
                <Menu className="h-6 w-6 text-foreground" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64 bg-sidebar border-sidebar-border dark:bg-sidebar">
              <div className="flex h-full flex-col">
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
    <>
      <div className="flex h-screen w-64 flex-shrink-0 flex-col bg-sidebar shadow-luxury border-r border-sidebar-border">
        <SidebarContent />
      </div>
      <TopBar />
    </>
  );
}
