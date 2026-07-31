import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { TopBar } from "@/components/TopBar";
import { 
  LayoutDashboard, 
  FileText, 
  Package, 
  Users, 
  AlertTriangle, 
  ClipboardList,
  Shield,
  ChevronDown,
  Menu,
  Building2,
  Scale,
  CreditCard,
  HelpCircle,
  LogOut,
  
  MessageSquare,
  Inbox,
  Globe,
  Layers,
  Cloud,
  Bell,
  Pencil,
  Briefcase,
  Settings as SettingsIcon,
  Sparkles,
  Landmark,
  Bot,
  Eye,
  Lock,
  ImageIcon,
  Plug,
  Crown,
} from "lucide-react";
import mynderLogoInverted from "@/assets/mynder-logo-inverted.png";
import mynderLogo from "@/assets/mynder-logo.png";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { toast } from "sonner";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useSubscription } from "@/hooks/useSubscription";

import { CreditMenuItem } from "@/components/sidebar/CreditMenuItem";
import { WorkspaceSwitcher } from "@/components/sidebar/WorkspaceSwitcher";
import { useWorkspaceMode } from "@/contexts/WorkspaceModeContext";
import { useActiveOrganization } from "@/contexts/ActiveOrganizationContext";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";
import { getEnabledPartnerModules, type PartnerModuleKey } from "@/lib/partnerModules";
import { useActivatedServices } from "@/hooks/useActivatedServices";

const ModuleSkeletonRow = ({ label }: { label: string }) => (
  <div
    aria-busy="true"
    aria-live="polite"
    className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[0.9375rem] font-medium text-sidebar-foreground/60 bg-sidebar-accent/30 border-l-2 border-primary/40 animate-pulse"
  >
    <Loader2 className="h-4 w-4 animate-spin text-primary" />
    <Skeleton className="h-3.5 flex-1 max-w-[120px] bg-sidebar-foreground/10" />
    <span className="sr-only">Aktiverer {label}…</span>
  </div>
);

// Top-level dashboards: Trust Center always, Mynder Core only when activated.
// Rendered inline below — see "Dashboard" section in the nav.
const boardNav = [
  { name: "Styrerom", href: "/board", icon: Landmark },
];

// Global nav (between Trust Center and Mynder Core)
const globalNav = [
  { name: "nav.regulations", href: "/regulations", icon: Scale },
  { name: "nav.messages", href: "/customer-requests", icon: MessageSquare },
];


// Mynder Core (contextual management tools — Systems lives in Registre below)
const coreNav = [
  { name: "nav.myWorkAreas", href: "/work-areas", icon: Users },
  { name: "nav.tasks", href: "/tasks", icon: ClipboardList },
  { name: "nav.deviations", href: "/deviations", icon: AlertTriangle },
  { name: "nav.reports", href: "/reports", icon: FileText },
];

// Standalone module links (each activatable independently)
const vendorLink = { name: "nav.vendors", href: "/vendors", icon: Building2 };
const assetsLink = { name: "nav.assetsDevices", href: "/assets", icon: Package };
const systemsLink = { name: "nav.systems", href: "/systems", icon: Cloud };
const agentsLink = { name: "Agenter", href: "/agents", icon: Bot };

// Innstillinger submenu (merged Admin + Company settings)
const settingsMenu = [
  { name: "nav.adminOrganisation", href: "/admin/organisation", icon: Building2 },
  { name: "Produkter", href: "/subscriptions", icon: Crown },
  { name: "nav.accessManagement", href: "/admin/access", icon: Users },
  { name: "nav.adminNotifications", href: "/admin/notifications", icon: Bell },
  { name: "Integrasjoner", href: "/settings/integrations", icon: Plug },
  { name: "Aktivitetslogg", href: "/activity-log", icon: ClipboardList },
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
    {
      name: isNb ? "Aktiver Trust Profile" : "Activate Trust Profile",
      href: "/trust-center/activate",
      icon: Sparkles,
    },
    { name: isNb ? "Rediger profil" : "Edit Profile", href: "/trust-center/edit", icon: Pencil },
    { name: isNb ? "Dokumentasjon" : "Documentation", href: "/trust-center/evidence", icon: FileText },
  ];

  const isActive = trustCenterItems.some(item => item.href && location.pathname === item.href);

  return (
    <div className="mt-1">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "flex w-full items-center justify-between rounded-lg px-3 py-2 text-[0.9375rem] font-medium transition-all duration-200",
          isActive
            ? "bg-gradient-to-r from-primary/10 to-transparent text-sidebar-primary border-l-2 border-primary"
            : "text-sidebar-foreground/80 hover:bg-sidebar-accent/40 hover:text-sidebar-foreground"
        )}
      >
        <div className="flex items-center gap-2.5">
          <Globe className="h-4 w-4" />
          <span>Trust Center</span>
        </div>
        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-200", open && "rotate-180")} />
      </button>

      <div className={cn(
        "overflow-hidden transition-all duration-200",
        open ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
      )}>
        <div className="ml-3 mt-0.5 space-y-0.5 border-l border-sidebar-border/50 pl-3">
          {trustCenterItems.map((item) => {
            const itemActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-all duration-150",
                  itemActive
                    ? "bg-sidebar-accent text-sidebar-primary"
                    : "text-sidebar-foreground/60 hover:bg-sidebar-accent/40 hover:text-sidebar-foreground"
                )}
              >
                {itemActive && <span className="h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />}
                <item.icon className="h-3.5 w-3.5" />
                {item.name}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// Partner-modus: egen sidebar-meny som erstatter compliance-navigasjonen
const PartnerNav = () => {
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const isNb = i18n.language?.startsWith("nb") || i18n.language === "no";

  const items = [
    { name: isNb ? "Dashbord" : "Dashboard", href: "/msp-partner", icon: LayoutDashboard },
    { name: isNb ? "Kunder" : "Customers", href: "/msp-dashboard", icon: Users },
    { name: isNb ? "Tjenester" : "Services", href: "/msp-services", icon: Package },
    { name: isNb ? "Kundevisning" : "Customer view", href: "/msp-customer-view", icon: Eye },
    { name: isNb ? "Meldinger" : "Messages", href: "/msp-messages", icon: Inbox },
    { name: isNb ? "Fakturagrunnlag" : "Billing basis", href: "/msp-invoices", icon: FileText },
  ];

  return (
    <nav className="flex-1 space-y-0.5 px-3 py-4 overflow-y-auto">
      {items.map((item) => {
        const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            to={item.href}
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-3 py-2 text-[0.9375rem] font-medium transition-all duration-200",
              isActive
                ? "bg-gradient-to-r from-primary/10 to-transparent text-sidebar-primary border-l-2 border-primary"
                : "text-sidebar-foreground/80 hover:bg-sidebar-accent/40 hover:text-sidebar-foreground"
            )}
          >
            {isActive && <span className="h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />}
            <item.icon className="h-4 w-4" />
            {item.name}
          </Link>
        );
      })}
    </nav>
  );
};



const SidebarContent = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isNb = i18n.language === "nb";
  const { signOut, user } = useAuth();
  const queryClient = useQueryClient();
  const { hasCoreAccess, hasRegistriesAccess, selectedCoreAtOnboarding, selectedRegistriesAtOnboarding, needsUpgrade } = useSubscription();
  const { allRoles: _adminRoles } = useUserRole();
  const isMynderAdmin = _adminRoles.includes("super_admin") || _adminRoles.includes("daglig_leder");
  const { mode: workspaceMode } = useWorkspaceMode();
  const { isServiceActive } = useActivatedServices();
  const hasAgentsAccess = isServiceActive("agents");

  // Check if the current company is already an MSP partner
  const { data: companyProfile } = useQuery({
    queryKey: ["sidebar-company-profile"],
    queryFn: async () => {
      const { data } = await supabase
        .from("company_profile")
        .select("is_msp_partner")
        .limit(1)
        .maybeSingle();
      return data as { is_msp_partner: boolean } | null;
    },
  });
  const isPartner = companyProfile?.is_msp_partner === true;

  // Partner module overrides — when in compliance mode as a partner, the heavy
  // modules (Core, Registre, Vendors, "Moduler", "Bli partner") are hidden
  // by default and can be re-enabled from Innstillinger → Andre moduler.
  const [enabledPartnerModules, setEnabledPartnerModules] = useState<PartnerModuleKey[]>(() => getEnabledPartnerModules());
  useEffect(() => {
    const sync = () => setEnabledPartnerModules(getEnabledPartnerModules());
    window.addEventListener("storage", sync);
    window.addEventListener("partner-modules-changed", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("partner-modules-changed", sync);
    };
  }, []);
  const partnerHides = (key: PartnerModuleKey) =>
    isPartner && workspaceMode === "compliance" && !enabledPartnerModules.includes(key);

  // Optimistic activation skeletons — cleared as soon as the underlying
  // subscription/activated-services queries confirm access (or as a final
  // 30s safety net if something goes wrong upstream).
  const [activatingModules, setActivatingModules] = useState<Set<"vendors" | "core" | "assets">>(new Set());
  useEffect(() => {
    const onStart = (e: Event) => {
      const m = (e as CustomEvent).detail?.module;
      if (!m) return;
      setActivatingModules((prev) => {
        if (prev.has(m)) return prev;
        return new Set(prev).add(m);
      });
      // Force the queries that drive access flags to refetch immediately so
      // the skeleton clears the moment real data confirms access.
      queryClient.invalidateQueries({ queryKey: ["company-subscription"] });
      queryClient.invalidateQueries({ queryKey: ["domain-addons"] });
      queryClient.invalidateQueries({ queryKey: ["activated-services"] });
      queryClient.invalidateQueries({ queryKey: ["module-addons"] });
      // Final safety net — never leave a skeleton spinning forever.
      window.setTimeout(() => {
        setActivatingModules((prev) => {
          if (!prev.has(m)) return prev;
          const next = new Set(prev);
          next.delete(m);
          return next;
        });
      }, 30000);
    };
    const onEnd = (e: Event) => {
      const m = (e as CustomEvent).detail?.module;
      if (!m) return;
      // Refetch so access flags pick up immediately, then clear.
      queryClient.invalidateQueries({ queryKey: ["company-subscription"] });
      queryClient.invalidateQueries({ queryKey: ["domain-addons"] });
      queryClient.invalidateQueries({ queryKey: ["activated-services"] });
      queryClient.invalidateQueries({ queryKey: ["module-addons"] });
      setActivatingModules((prev) => {
        if (!prev.has(m)) return prev;
        const next = new Set(prev);
        next.delete(m);
        return next;
      });
    };
    window.addEventListener("module:activating", onStart);
    window.addEventListener("module:activated", onEnd);
    return () => {
      window.removeEventListener("module:activating", onStart);
      window.removeEventListener("module:activated", onEnd);
    };
  }, [queryClient]);

  // Auto-clear skeletons the instant the real access flags flip on — this is
  // the primary clear path; the event/timeout are just fallbacks.
  useEffect(() => {
    if (activatingModules.size === 0) return;
    setActivatingModules((prev) => {
      let changed = false;
      const next = new Set(prev);
      if (next.has("core") && (selectedCoreAtOnboarding || hasCoreAccess)) {
        next.delete("core"); changed = true;
      }
      if (next.has("vendors") && (selectedRegistriesAtOnboarding || hasRegistriesAccess)) {
        next.delete("vendors"); changed = true;
      }
      if (next.has("assets") && (selectedRegistriesAtOnboarding || hasRegistriesAccess)) {
        next.delete("assets"); changed = true;
      }
      return changed ? next : prev;
    });
  }, [hasCoreAccess, hasRegistriesAccess, selectedCoreAtOnboarding, selectedRegistriesAtOnboarding, activatingModules]);

  // Determine display mode per module (include optimistic activations)
  const showCoreNormal = selectedCoreAtOnboarding || hasCoreAccess || activatingModules.has("core");
  // Vendors and Assets are independent — check registries access for both
  const showVendorsNormal = selectedRegistriesAtOnboarding || hasRegistriesAccess || activatingModules.has("vendors");
  const showAssetsNormal = selectedRegistriesAtOnboarding || hasRegistriesAccess || activatingModules.has("assets");

  const isVendorsActivating = activatingModules.has("vendors") && !(selectedRegistriesAtOnboarding || hasRegistriesAccess);
  const isCoreActivating = activatingModules.has("core") && !(selectedCoreAtOnboarding || hasCoreAccess);
  const isAssetsActivating = activatingModules.has("assets") && !(selectedRegistriesAtOnboarding || hasRegistriesAccess);

  // "Moduler" collects anything not shown normally
  const showExploreSection = !showCoreNormal || !showVendorsNormal || !showAssetsNormal || !hasAgentsAccess;
  
  const [companyOpen, setCompanyOpen] = useState(() => location.pathname.startsWith("/msp-") || location.pathname.startsWith("/admin/") || location.pathname === "/subscriptions");
  // partnerOpen fjernet — Partner ligger nå i workspace-bryteren øverst
  const [loggingOut, setLoggingOut] = useState(false);
  const { activeOrg } = useActiveOrganization();
  // Fallback to demo company name so the sidebar never shows "Ikke registrert"
  // in demo/preview when company_profile is empty.
  const companyName = activeOrg?.name || "Mynder AS";

  // Mynder Core-seksjonen: Systemer + arbeidsområder, oppgaver, avvik, rapporter
  const coreSectionItems = [systemsLink, ...coreNav];
  const isManagementActive = location.pathname === "/dashboard-core"
    || coreSectionItems.some(item => location.pathname === item.href || location.pathname.startsWith(item.href + "/"));
  const [managementOpen, setManagementOpen] = useState(() => isManagementActive);
  const [vendorsOpen, setVendorsOpen] = useState(() => location.pathname.startsWith("/vendors"));
  useEffect(() => {
    if (location.pathname.startsWith("/vendors")) setVendorsOpen(true);
  }, [location.pathname]);

  // Keep the section open when navigating between its sub-routes (e.g. /reports → /reports/compliance)
  useEffect(() => {
    if (isManagementActive) setManagementOpen(true);
  }, [isManagementActive]);

  // Registre: øvrige registre (Aktiva = Assets, Agenter = eget tillegg)
  const registriesItems = [
    ...(showAssetsNormal ? [assetsLink] : []),
    ...(hasAgentsAccess ? [agentsLink] : []),
  ];
  const showRegistries = registriesItems.length > 0;
  const isRegistriesActive = registriesItems.some(item => location.pathname === item.href || location.pathname.startsWith(item.href + "/"));
  const [registriesOpen, setRegistriesOpen] = useState(() => isRegistriesActive);
  useEffect(() => {
    if (isRegistriesActive) setRegistriesOpen(true);
  }, [isRegistriesActive]);

  // "Moduler" combines items from sections not shown normally, split by category
  const exploreCoreItems = !showCoreNormal ? [...coreNav, systemsLink] : [];
  const exploreRegistryItems = [
    ...(!showVendorsNormal ? [vendorLink] : []),
    ...(!showAssetsNormal ? [assetsLink] : []),
    ...(!hasAgentsAccess ? [agentsLink] : []),
  ];
  const exploreItems = [...exploreCoreItems, ...exploreRegistryItems];
  const isExploreActive = exploreItems.some(item => location.pathname === item.href);
  const [exploreOpen, setExploreOpen] = useState(() => isExploreActive);

  const isDemoActive = location.pathname.startsWith("/demo/");
  const [demoOpen, setDemoOpen] = useState(() => isDemoActive);


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


  // Render a collapsible section with sub-items
  const renderCollapsibleSection = (
    label: string,
    icon: React.ElementType,
    items: typeof coreNav,
    isOpen: boolean,
    setIsOpen: (open: boolean) => void,
    isSectionActive: boolean,
    extraBadge?: React.ReactNode,
  ) => (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex w-full items-center justify-between rounded-lg px-3 py-2 text-[0.9375rem] font-medium transition-all duration-200",
          isSectionActive
            ? "text-sidebar-primary border-l-2 border-primary/30"
            : "text-sidebar-foreground/80 hover:bg-sidebar-accent/40 hover:text-sidebar-foreground"
        )}
      >
        <div className="flex items-center gap-2.5">
          {React.createElement(icon, { className: "h-[18px] w-[18px]" })}
          <span className="text-sm font-semibold">{label}</span>
        </div>
        <div className="flex items-center gap-1.5">
          {extraBadge}
          <ChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-200", isOpen && "rotate-180")} />
        </div>
      </button>
      <div className={cn(
        "overflow-hidden transition-all duration-200",
        isOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
      )}>
        <div className="ml-3 mt-0.5 space-y-0.5 border-l border-sidebar-border/50 pl-3">
          {items.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-all duration-150",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-primary"
                    : "text-sidebar-foreground/60 hover:bg-sidebar-accent/40 hover:text-sidebar-foreground"
                )}
              >
                {isActive && <span className="h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />}
                <item.icon className="h-3.5 w-3.5" />
                {t(item.name)}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );

  
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

      {/* Workspace switcher moved to TopBar (top-right) */}


      {/* Navigation */}
      {workspaceMode === "partner" ? (
        <PartnerNav />
      ) : (
      <nav className="flex-1 space-y-0.5 px-3 py-4 overflow-y-auto">

        {/* Dashboards */}
        {(() => {
          const trustActive = location.pathname === "/";
          const coreActive = location.pathname === "/dashboard-core";
          const coreUnlocked = showCoreNormal || showRegistries;
          return (
            <>
              <Link
                to="/"
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2 text-[0.9375rem] font-medium transition-all duration-200 relative",
                  trustActive
                    ? "bg-gradient-to-r from-primary/10 to-transparent text-sidebar-primary border-l-2 border-primary"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent/40 hover:text-sidebar-foreground"
                )}
              >
                {trustActive && <span className="h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />}
                <Shield className="h-4 w-4" />
                {isNb ? "Trust Center" : "Trust Center"}
              </Link>
              {coreUnlocked ? (
                <Link
                  to="/dashboard-core"
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg px-3 py-2 text-[0.9375rem] font-medium transition-all duration-200 relative",
                    coreActive
                      ? "bg-gradient-to-r from-primary/10 to-transparent text-sidebar-primary border-l-2 border-primary"
                      : "text-sidebar-foreground/80 hover:bg-sidebar-accent/40 hover:text-sidebar-foreground"
                  )}
                >
                  {coreActive && <span className="h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />}
                  <LayoutDashboard className="h-4 w-4" />
                  {isNb ? "Mynder Core" : "Mynder Core"}
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => toast.info(isNb ? "Mynder Core aktiveres fra plan & moduler." : "Mynder Core is activated from plan & modules.")}
                  title={isNb ? "Aktiveres med Mynder Core" : "Unlocks with Mynder Core"}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[0.9375rem] font-medium text-sidebar-foreground/40 hover:bg-sidebar-accent/30 hover:text-sidebar-foreground/60 transition-all"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  <span className="flex-1 text-left">{isNb ? "Mynder Core" : "Mynder Core"}</span>
                  <Lock className="h-3 w-3" />
                </button>
              )}
              {boardNav.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg px-3 py-2 text-[0.9375rem] font-medium transition-all duration-200 relative",
                      isActive
                        ? "bg-gradient-to-r from-primary/10 to-transparent text-sidebar-primary border-l-2 border-primary"
                        : "text-sidebar-foreground/80 hover:bg-sidebar-accent/40 hover:text-sidebar-foreground"
                    )}
                  >
                    {isActive && <span className="h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />}
                    <item.icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                );
              })}
            </>
          );
        })()}

        <TrustCenterMenu />

        {/* Separator */}
        <div className="my-2 border-b border-sidebar-border/40" />

        {/* Global nav: Regelverk → (Leverandører) → Meldinger */}
        {globalNav.map((item, idx) => {
          const isActive = location.pathname === item.href;
          const link = (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-[0.9375rem] font-medium transition-all duration-200 relative",
                isActive
                  ? "bg-gradient-to-r from-primary/10 to-transparent text-sidebar-primary border-l-2 border-primary"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent/40 hover:text-sidebar-foreground"
              )}
            >
              {isActive && <span className="h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />}
              <item.icon className="h-4 w-4" />
              {t(item.name)}
            </Link>
          );

          // Insert Vendors (if activated) between Regelverk (idx 0) and Meldinger (idx 1)
          if (idx === 1 && showVendorsNormal && !partnerHides("vendors")) {
            const vIsActive = location.pathname === vendorLink.href;
            const isReportsActive = location.pathname === "/vendors/reports";
            const sectionActive = location.pathname.startsWith("/vendors");
            const handleSeed = async () => {
              try {
                const { seedDemoVendorProfiles } = await import("@/lib/demoVendorProfiles");
                const count = await seedDemoVendorProfiles();
                queryClient.invalidateQueries({ queryKey: ["vendor-assets"] });
                queryClient.invalidateQueries({ queryKey: ["assets"] });
                toast.success(`${count} demo-leverandører ble lastet inn`);
              } catch (e: any) {
                toast.error(e.message || "Kunne ikke laste inn demo-data");
              }
            };
            const handleDelete = async () => {
              try {
                const { deleteDemoVendorProfiles } = await import("@/lib/demoVendorProfiles");
                const count = await deleteDemoVendorProfiles();
                queryClient.invalidateQueries({ queryKey: ["vendor-assets"] });
                queryClient.invalidateQueries({ queryKey: ["assets"] });
                toast.success(`${count} demo-leverandører ble fjernet`);
              } catch (e: any) {
                toast.error(e.message || "Kunne ikke fjerne demo-data");
              }
            };
            return (
              <React.Fragment key="vendors-and-next">
                {isVendorsActivating ? (
                  <ModuleSkeletonRow label={t(vendorLink.name)} />
                ) : (
                <div>
                  <button
                    onClick={() => setVendorsOpen(!vendorsOpen)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-lg px-3 py-2 text-[0.9375rem] font-medium transition-all duration-200",
                      sectionActive
                        ? "text-sidebar-primary border-l-2 border-primary/30"
                        : "text-sidebar-foreground/80 hover:bg-sidebar-accent/40 hover:text-sidebar-foreground"
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <vendorLink.icon className="h-[18px] w-[18px]" />
                      <span className="text-sm font-semibold">{t(vendorLink.name)}</span>
                    </div>
                    <ChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-200", vendorsOpen && "rotate-180")} />
                  </button>
                  <div className={cn(
                    "overflow-hidden transition-all duration-200",
                    vendorsOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
                  )}>
                    <div className="ml-3 mt-0.5 space-y-0.5 border-l border-sidebar-border/50 pl-3">
                      <Link
                        to={vendorLink.href}
                        className={cn(
                          "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-all duration-150",
                          vIsActive
                            ? "bg-sidebar-accent text-sidebar-primary"
                            : "text-sidebar-foreground/60 hover:bg-sidebar-accent/40 hover:text-sidebar-foreground"
                        )}
                      >
                        {vIsActive && <span className="h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />}
                        <LayoutDashboard className="h-3.5 w-3.5" />
                        {isNb ? "Oversikt" : "Overview"}
                      </Link>
                      <Link
                        to="/vendors/reports"
                        className={cn(
                          "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-all duration-150",
                          isReportsActive
                            ? "bg-sidebar-accent text-sidebar-primary"
                            : "text-sidebar-foreground/60 hover:bg-sidebar-accent/40 hover:text-sidebar-foreground"
                        )}
                      >
                        {isReportsActive && <span className="h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />}
                        <FileText className="h-3.5 w-3.5" />
                        {isNb ? "Rapporter" : "Reports"}
                      </Link>
                      {sectionActive && (
                        <>
                          <button
                            onClick={handleSeed}
                            className="w-full text-left text-sm text-sidebar-foreground/60 hover:text-sidebar-foreground px-2.5 py-1.5 rounded-md hover:bg-sidebar-accent/40 transition-colors"
                          >
                            {isNb ? "Last inn demo-data" : "Load demo data"}
                          </button>
                          <button
                            onClick={handleDelete}
                            className="w-full text-left text-sm text-sidebar-foreground/60 hover:text-destructive px-2.5 py-1.5 rounded-md hover:bg-sidebar-accent/40 transition-colors"
                          >
                            {isNb ? "Fjern demo-data" : "Remove demo data"}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                )}
                {link}
              </React.Fragment>
            );
          }
          return link;
        })}

        {/* Separator */}
        {(showCoreNormal || showRegistries) && <div className="my-2 border-b border-sidebar-border/40" />}

        {/* Mynder Core — only if selected at onboarding or paid */}
        {showCoreNormal && !partnerHides("core") && (isCoreActivating ? (
          <ModuleSkeletonRow label={t("nav.mynderCore", "Mynder Core")} />
        ) : renderCollapsibleSection(
          t("nav.mynderCore", "Mynder Core"),
          Briefcase,
          coreNav,
          managementOpen,
          setManagementOpen,
          isManagementActive,
        ))}

        {/* Registre — Systemer (Core) + Aktiva (Assets) */}
        {showRegistries && registriesItems.length > 0 && !partnerHides("registries") && ((isCoreActivating || isAssetsActivating) ? (
          <ModuleSkeletonRow label={t("nav.registries", "Registre")} />
        ) : renderCollapsibleSection(
          t("nav.registries", "Registre"),
          Layers,
          registriesItems,
          registriesOpen,
          setRegistriesOpen,
          isRegistriesActive,
        ))}

        {/* "Moduler" fjernet fra hovedmenyen — produkter administreres nå under Innstillinger → Produkter. */}

        {/* Bli partner og Demoer fjernet fra hovedmenyen.
            Bli partner: tilgjengelig via Innstillinger / MSP-workspace.
            Demoer: kun for interne admin-roller nedenfor. */}
        {isMynderAdmin && (
        <div className="mt-2">
          <button
            onClick={() => setDemoOpen(!demoOpen)}
            className={cn(
              "flex w-full items-center justify-between rounded-lg px-3 py-2 text-[0.9375rem] font-medium transition-all duration-200",
              isDemoActive
                ? "text-sidebar-primary border-l-2 border-primary/30"
                : "text-sidebar-foreground/80 hover:bg-sidebar-accent/40 hover:text-sidebar-foreground"
            )}
          >
            <div className="flex items-center gap-2.5">
              <Sparkles className="h-[18px] w-[18px]" />
              <span className="text-sm font-semibold">{isNb ? "Demoer" : "Demos"}</span>
            </div>
            <ChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-200", demoOpen && "rotate-180")} />
          </button>
          <div className={cn(
            "overflow-hidden transition-all duration-200",
            demoOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
          )}>
            <div className="ml-3 mt-0.5 space-y-1 border-l border-sidebar-border/50 pl-3">
              <button
                onClick={async () => {
                  try { localStorage.removeItem("mynder.trustprofile.activated"); } catch {}
                  const { deleteDemoTrustProfile } = await import("@/lib/demoSeedTrustProfile");
                  try { await deleteDemoTrustProfile(); } catch (e) { console.error(e); }
                  navigate("/trust-center/profile?activate=1");
                  setTimeout(() => {
                    window.dispatchEvent(new CustomEvent("open-activate-trust-wizard"));
                  }, 100);
                }}
                title={isNb ? "Demonstrasjon: aktiver Trust Profile med Lara" : "Demo: activate Trust Profile with Lara"}
                className="w-full px-2 py-1.5 flex items-center gap-1.5 text-sm text-sidebar-foreground/60 hover:text-sidebar-foreground rounded-md hover:bg-sidebar-accent/40 transition-colors text-left"
              >
                <Sparkles className="h-3 w-3" />
                {isNb ? "Aktiver Trust Profile" : "Activate Trust Profile"}
              </button>
              <button
                onClick={() => window.dispatchEvent(new CustomEvent("start-customer-request-demo"))}
                title={isNb ? "Spill av demonstrasjon: motta og besvar leverandøroppdatering" : "Play demo: receive and respond to vendor update"}
                className="w-full px-2 py-1.5 flex items-center gap-1.5 text-sm text-sidebar-foreground/60 hover:text-sidebar-foreground rounded-md hover:bg-sidebar-accent/40 transition-colors text-left"
              >
                <Sparkles className="h-3 w-3" />
                {isNb ? "Kundemelding" : "Customer message"}
              </button>
              <button
                onClick={() => navigate("/demo/vendor-activation")}
                title={isNb ? "Demonstrasjon: aktivere leverandørmodulen" : "Demo: activate vendor module"}
                className={cn(
                  "w-full px-2 py-1.5 flex items-center gap-1.5 text-sm rounded-md transition-colors text-left",
                  location.pathname === "/demo/vendor-activation"
                    ? "text-sidebar-primary bg-sidebar-accent/40"
                    : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/40"
                )}
              >
                <Sparkles className="h-3 w-3" />
                {isNb ? "Aktiver leverandør" : "Activate vendors"}
              </button>
            </div>
          </div>
        </div>
        )}
      </nav>
      )}


      {/* Company section at bottom (locked) */}
      <div className="flex-shrink-0 border-t border-sidebar-border bg-sidebar">

        {companyName ? (
          <div className="px-3 pb-3 pt-2">
            <button 
              onClick={() => setCompanyOpen(!companyOpen)}
              className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-[0.9375rem] font-medium transition-colors text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
            >
              <span>{isNb ? "Innstillinger" : "Settings"}</span>
              <ChevronDown className={cn("h-4 w-4 text-sidebar-foreground/60 transition-transform", companyOpen && "rotate-180")} />
            </button>

            {companyOpen && (
              <div className="mt-1 ml-2 space-y-1 animate-fade-in max-h-[50vh] overflow-y-auto pr-1">
                {settingsMenu.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <button
                      key={item.href}
                      onClick={() => navigate(item.href)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-lg px-3 py-1.5 text-[0.9375rem] font-medium transition-colors",
                        isActive
                          ? "bg-sidebar-accent text-sidebar-primary"
                          : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                      )}
                    >
                      <item.icon className="h-3.5 w-3.5" />
                      {t(item.name)}
                    </button>
                  );
                })}
                {workspaceMode === "partner" && (() => {
                  const partnerSettings = [
                    { tab: "generelt", labelNb: "Generelt", labelEn: "General", icon: SettingsIcon },
                    
                    { tab: "integrasjoner", labelNb: "Integrasjoner", labelEn: "Integrations", icon: Plug },
                    { tab: "__activity", labelNb: "Aktivitetslogg", labelEn: "Activity log", icon: ClipboardList },
                  ];
                  const currentTab = new URLSearchParams(location.search).get("tab") ?? "generelt";
                  return (
                    <>
                      <div className="border-t border-sidebar-border my-2" />
                      {partnerSettings.map((p) => {
                        const isActivity = p.tab === "__activity";
                        const isActive = isActivity
                          ? location.pathname === "/activity-log"
                          : location.pathname === "/msp-settings" && currentTab === p.tab;
                        return (
                          <button
                            key={p.tab}
                            onClick={() =>
                              navigate(isActivity ? "/activity-log" : `/msp-settings?tab=${p.tab}`)
                            }
                            className={cn(
                              "flex w-full items-center gap-3 rounded-lg px-3 py-1.5 text-[0.9375rem] font-medium transition-colors",
                              isActive
                                ? "bg-sidebar-accent text-sidebar-primary"
                                : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                            )}
                          >
                            <p.icon className="h-3.5 w-3.5" />
                            {isNb ? p.labelNb : p.labelEn}
                          </button>
                        );
                      })}
                    </>
                  );
                })()}
                
                {/* Partner-meny er flyttet til workspace-bryteren øverst */}


                {isMynderAdmin && (
                  <>
                    <div className="border-t border-sidebar-border my-2" />
                    {/* Mynder innstillinger (intern eier-/superbruker-visning) */}
                    <button
                      onClick={() => navigate("/mynder-admin/dashboard")}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[0.9375rem] font-medium transition-colors",
                        location.pathname.startsWith("/mynder-admin")
                          ? "bg-sidebar-accent text-sidebar-primary"
                          : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                      )}
                    >
                      <Shield className="h-4 w-4" />
                      Mynder innstillinger
                    </button>
                  </>
                )}
                <div className="border-t border-sidebar-border my-2" />
                <button
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[0.9375rem] font-medium text-destructive hover:bg-destructive/10 transition-colors"
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
                <p className="text-sm text-sidebar-foreground/50">{t("nav.clickLaraToStart")}</p>
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
                {/* Workspace switcher i toppen av mobil-menyen — gir tilgang til
                    Partner-modus og Partner-dashbordet, som ellers kun finnes i
                    desktop-TopBar. */}
                <div className="px-3 pt-3 pb-1 border-b border-sidebar-border">
                  <WorkspaceSwitcher />
                </div>
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
