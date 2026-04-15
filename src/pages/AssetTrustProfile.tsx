import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePageHelpListener } from "@/hooks/usePageHelpListener";
import { ContextualHelpPanel } from "@/components/shared/ContextualHelpPanel";
import { Handshake, FileText, Shield, AlertTriangle, Upload, BarChart3, Send, Share2, ClipboardList, Eye, Settings2, PenLine } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Sidebar } from "@/components/Sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MoreHorizontal, Building2, Server, Mail } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { AssetHeader } from "@/components/asset-profile/AssetHeader";
import { AssetMetrics } from "@/components/asset-profile/AssetMetrics";
import { TrustProfilePublishing } from "@/components/asset-profile/TrustProfilePublishing";

import { ValidationTab } from "@/components/asset-profile/tabs/ValidationTab";
import { DataHandlingTab } from "@/components/asset-profile/tabs/DataHandlingTab";
import { RiskManagementTab } from "@/components/asset-profile/tabs/RiskManagementTab";
import { IncidentManagementTab } from "@/components/asset-profile/tabs/IncidentManagementTab";
import { RelationsTab } from "@/components/asset-profile/tabs/RelationsTab";
import { DocumentsTab } from "@/components/asset-profile/tabs/DocumentsTab";
import { LaraInboxTab } from "@/components/asset-profile/tabs/LaraInboxTab";
import { CustomerRequestsTab } from "@/components/asset-profile/tabs/CustomerRequestsTab";
import { SecurityServicesSection } from "@/components/asset-profile/tabs/SecurityServicesSection";
import { NIS2AssessmentTab } from "@/components/devices/NIS2AssessmentTab";
import { OrganizationServicesPanel } from "@/components/asset-profile/OrganizationServicesPanel";
import { ControlsTab } from "@/components/asset-profile/tabs/ControlsTab";
import { DeviceTrustProfile } from "@/components/device-profile/DeviceTrustProfile";
import { VendorOverviewTab } from "@/components/asset-profile/tabs/VendorOverviewTab";

import { VendorUsageTab } from "@/components/asset-profile/tabs/VendorUsageTab";
import { VendorEvidenceTab } from "@/components/asset-profile/tabs/VendorEvidenceTab";
import { VendorHistoryTab } from "@/components/asset-profile/tabs/VendorHistoryTab";
import { DeliveriesTab } from "@/components/asset-profile/tabs/DeliveriesTab";
import { VendorAuditTab } from "@/components/asset-profile/tabs/VendorAuditTab";
import { VendorActivityTab } from "@/components/asset-profile/tabs/VendorActivityTab";
import { RegisterActivityDialog } from "@/components/asset-profile/RegisterActivityDialog";
import { VendorAccessTab } from "@/components/asset-profile/tabs/VendorAccessTab";
import { VendorTasksTab } from "@/components/asset-profile/tabs/VendorTasksTab";

const AssetTrustProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isNb = i18n.language === "nb";

  const { data: asset, isLoading } = useQuery({
    queryKey: ["asset", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assets")
        .select(`*, work_areas (id, name, responsible_person)`)
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: template } = useQuery({
    queryKey: ["asset_type_template", asset?.asset_type],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("asset_type_templates")
        .select("*")
        .eq("asset_type", asset?.asset_type)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!asset?.asset_type,
  });

  const { data: tasks } = useQuery({
    queryKey: ["asset-tasks", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .contains("relevant_for", [id]);
      if (error) throw error;
      return data || [];
    },
    enabled: !!id,
  });

  const { data: inboxCount = 0 } = useQuery({
    queryKey: ["lara-inbox-count", id],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("lara_inbox")
        .select("*", { count: "exact", head: true })
        .eq("matched_asset_id", id)
        .in("status", ["new", "auto_matched"]);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!id,
  });

  const isSelf = asset?.asset_type === 'self';
  const isHardware = asset?.asset_type === 'hardware';
  const isVendor = !isSelf && !isHardware;

  const [activeTab, setActiveTab] = useState(isHardware ? "compliance" : (isVendor ? "overview" : "validation"));
  const [orgSection, setOrgSection] = useState<"trust-profile" | "services">("trust-profile");
  const [trustMetrics, setTrustMetrics] = useState<{ trustScore: number; confidenceScore: number; lastUpdated: string } | null>(null);
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [activityDialogOpen, setActivityDialogOpen] = useState(false);
  const headerRef = useRef<HTMLDivElement>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  usePageHelpListener(setHelpOpen);

  const handleTrustMetrics = useCallback((metrics: { trustScore: number; confidenceScore: number; lastUpdated: string }) => {
    setTrustMetrics(prev => {
      if (prev && prev.trustScore === metrics.trustScore && prev.confidenceScore === metrics.confidenceScore) return prev;
      return metrics;
    });
  }, []);

  const handleNavigateToTab = useCallback((target: string) => {
    if (target.startsWith("_header:")) {
      headerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      setActiveTab(target);
      // Scroll tabs into view after switching
      setTimeout(() => {
        document.querySelector('[role="tablist"]')?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 100);
    }
  }, []);

  // Listen for scroll-to-tasks event to switch to overview tab first
  useEffect(() => {
    const handleScrollToTasksEvent = () => {
      setActiveTab("overview");
    };
    const handleScrollToMaturityEvent = () => {
      setActiveTab("overview");
      setTimeout(() => {
        const el = document.getElementById("maturity-controls-section");
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 200);
    };
    const handleSwitchToTab = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.tab) {
        setActiveTab(detail.tab);
        setTimeout(() => {
          document.querySelector('[role="tablist"]')?.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }, 100);
      }
    };
    window.addEventListener("scroll-to-tasks", handleScrollToTasksEvent);
    window.addEventListener("scroll-to-maturity", handleScrollToMaturityEvent);
    window.addEventListener("switch-to-tab", handleSwitchToTab);
    return () => {
      window.removeEventListener("scroll-to-tasks", handleScrollToTasksEvent);
      window.removeEventListener("scroll-to-maturity", handleScrollToMaturityEvent);
      window.removeEventListener("switch-to-tab", handleSwitchToTab);
    };
  }, []);

  const isMobile = useIsMobile();

  // ── Needs action indicator for overview tab ──
  const overviewNeedsAction = useMemo(() => {
    if (!asset) return false;
    const riskLevel = asset.risk_level;
    const tprmStatus = asset.tprm_status;
    if (tprmStatus === 'action_required' || riskLevel === 'high') return true;
    if (!tprmStatus || tprmStatus === 'not_assessed') return true;
    return false;
  }, [asset]);

  // ── Vendor tabs ──
  const DEFAULT_VISIBLE_TABS = ['overview', 'usage', 'deliveries', 'evidence'];
  const LOCKED_TAB = 'overview'; // always visible
  const MAX_VISIBLE_TABS = 7;
  const STORAGE_KEY = 'mynder_vendor_tab_prefs';

  const allVendorTabs = useMemo(() => [
    { value: 'overview', label: isNb ? 'Veiledning' : 'Guidance', labelFull: isNb ? 'Veiledning fra Mynder' : 'Guidance from Mynder' },
    { value: 'vendor-tasks', label: isNb ? 'Oppgaver' : 'Tasks', labelFull: isNb ? 'Oppgaver' : 'Tasks' },
    { value: 'usage', label: isNb ? 'Bruk' : 'Usage', labelFull: isNb ? 'Bruk & kontekst' : 'Usage & Context' },
    { value: 'history', label: isNb ? 'Relasjoner' : 'Relations', labelFull: isNb ? 'Relasjoner' : 'Relations' },
    { value: 'deliveries', label: isNb ? 'Leveranser' : 'Deliveries', labelFull: isNb ? 'Leveranser' : 'Deliveries' },
    { value: 'vendor-audit', label: isNb ? 'Revisjon' : 'Audit', labelFull: isNb ? 'Revisjon og risikovurdering' : 'Audit & Risk Assessment' },
    { value: 'evidence', label: isNb ? 'Dokumenter' : 'Docs', labelFull: isNb ? 'Dokumentasjon' : 'Documentation' },
    { value: 'requests', label: isNb ? 'Forespørsler' : 'Requests', labelFull: isNb ? 'Forespørsler' : 'Requests' },
    { value: 'vendor-incidents', label: isNb ? 'Hendelser' : 'Incidents', labelFull: isNb ? 'Hendelser' : 'Incidents' },
    { value: 'vendor-activity', label: isNb ? 'Aktivitet' : 'Activity', labelFull: isNb ? 'Aktivitetslogg' : 'Activity Log' },
    { value: 'vendor-access', label: isNb ? 'Tilgang' : 'Access', labelFull: isNb ? 'Tilgang og roller' : 'Access & Roles' },
  ], [isNb]);

  const [visibleTabIds, setVisibleTabIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as string[];
        // Ensure locked tab is always included
        if (!parsed.includes(LOCKED_TAB)) parsed.unshift(LOCKED_TAB);
        return parsed;
      }
    } catch {}
    return DEFAULT_VISIBLE_TABS;
  });

  const updateVisibleTabs = useCallback((newIds: string[]) => {
    setVisibleTabIds(newIds);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newIds));
  }, []);

  const toggleTab = useCallback((tabId: string) => {
    if (tabId === LOCKED_TAB) return;
    setVisibleTabIds(prev => {
      const next = prev.includes(tabId)
        ? prev.filter(id => id !== tabId)
        : prev.length >= MAX_VISIBLE_TABS
          ? prev // at max
          : [...prev, tabId];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const mobileVisibleCount = 4;

  // On mobile, limit visible tabs; on desktop show all user-selected
  const effectiveVisibleIds = isMobile ? visibleTabIds.slice(0, mobileVisibleCount) : visibleTabIds;

  // Maintain original order from allVendorTabs
  const vendorTabDefs = allVendorTabs.filter(t => effectiveVisibleIds.includes(t.value));
  const vendorOverflowTabDefs = allVendorTabs.filter(t => !effectiveVisibleIds.includes(t.value));

  const activeVendorOverflowTab = vendorOverflowTabDefs.find(t => t.value === activeTab);

  // ── Self tabs: full tab set ──
  const primaryTabDefs = [
    // Hardware-specific
    { value: 'compliance', label: isNb ? 'ISO 27001 Samsvar' : 'ISO 27001 Compliance', show: isHardware },
    { value: 'nis2', label: isNb ? 'NIS2 Vurdering' : 'NIS2 Assessment', show: isHardware },
    // Standard tabs (self)
    { value: 'validation', label: isNb ? 'Veiledning fra Mynder' : 'Guidance from Mynder', show: isSelf },
    { value: 'controls', label: isNb ? 'Kontroller' : 'Controls', show: isSelf },
    { value: 'dataHandling', label: isNb ? 'Datahåndtering' : 'Data Handling', show: isSelf },
    { value: 'riskManagement', label: isNb ? 'Revisjon og risiko' : 'Audit & Risk Management', show: true },
    { value: 'incidents', label: isNb ? 'Avvik og hendelser' : 'Deviations & Incidents', show: true },
    { value: 'relations', label: isNb ? 'Relasjoner' : 'Relations', show: isSelf },
    { value: 'documents', label: isNb ? 'Dokumenter' : 'Documents', show: true },
  ].filter(t => t.show);

  const overflowTabDefs = isSelf ? [
    { value: 'inbox', label: isNb ? 'Innboks' : 'Inbox', show: true, badge: inboxCount },
    { value: 'nis2', label: isNb ? 'NIS2 Vurdering' : 'NIS2 Assessment', show: true },
    { value: 'security-services', label: isNb ? 'Sikkerhetstjenester' : 'Security Services', show: true },
    { value: 'requests', label: isNb ? 'Forespørsler' : 'Requests', show: true },
  ] : [];

  // Overflow button label
  const moreLabel = isNb ? "Mer" : "More";

  const activeOverflowTab = overflowTabDefs.find(t => t.value === activeTab);

  if (isLoading) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-background">
          <Sidebar />
          <main className="flex-1 p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-8 w-48 bg-muted rounded" />
              <div className="h-32 bg-muted rounded" />
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  if (!asset) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-background">
          <Sidebar />
          <main className="flex-1 p-6">
            <Button variant="ghost" onClick={() => navigate("/assets")} className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t("common.back")}
            </Button>
            <p className="text-muted-foreground">{t("trustProfile.notFound")}</p>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  // ── Hardware devices get a completely different profile ──
  if (isHardware) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-background">
          <Sidebar />
          <main className="flex-1 overflow-auto pt-11">
            <DeviceTrustProfile asset={asset} />
          </main>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <Sidebar />
        <main className="flex-1 overflow-auto pt-11">
          <div className="container max-w-7xl mx-auto p-4 md:p-6 space-y-4 md:space-y-5">
            {/* Back button */}
            <div className="flex items-center justify-between mb-1">
              <Button variant="ghost" onClick={() => navigate("/assets")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t("common.back")}
              </Button>
              {isVendor && (
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => setActivityDialogOpen(true)}
                    className="gap-2"
                  >
                    <PenLine className="h-4 w-4" />
                    {isNb ? "Registrer aktivitet" : "Log activity"}
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setRequestDialogOpen(true)}
                    className="gap-2"
                  >
                    <Mail className="h-4 w-4" />
                    {isNb ? "Be om oppdatering" : "Request update"}
                  </Button>
                </div>
              )}
            </div>

            {/* Trust Center header + Publishing for self-profile */}
            {isSelf && (
              <div className="space-y-3">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                    {isNb ? "Din Trust Profile" : "Your Trust Profile"}
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    {asset.name} • {isNb ? "Administrer og del din compliance-profil" : "Manage and share your compliance profile"}
                  </p>
                </div>
                <TrustProfilePublishing
                  assetId={asset.id}
                  assetName={asset.name}
                  orgNumber={(asset as any).org_number || ''}
                  publishMode={(asset as any).publish_mode || 'private'}
                  publishToCustomers={(asset as any).publish_to_customers || []}
                />
              </div>
            )}

            {/* Entity Header */}
            <div ref={headerRef}>
              <AssetHeader asset={asset} template={template} trustMetrics={trustMetrics} requestDialogOpen={requestDialogOpen} onRequestDialogChange={setRequestDialogOpen} />
            </div>

            {/* Security Areas + Scope — only for non-vendor assets */}
            {!isVendor && (
              <AssetMetrics
                asset={asset}
                tasksCount={tasks?.length || 0}
                onTrustMetrics={handleTrustMetrics}
                onNavigateToTab={handleNavigateToTab}
              />
            )}


            {/* Organization-level nav for self-type */}
            {isSelf && (
              <div className="flex items-center gap-1 border-b border-border pb-0">
                <button
                  onClick={() => setOrgSection("trust-profile")}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px",
                    orgSection === "trust-profile"
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Building2 className="h-4 w-4" />
                  Trust Profile
                </button>
                <button
                  onClick={() => setOrgSection("services")}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px",
                    orgSection === "services"
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Server className="h-4 w-4" />
                  Services
                </button>
              </div>
            )}

            {isSelf && orgSection === "services" && (
              <OrganizationServicesPanel
                organizationName={asset.name}
                assetId={asset.id}
              />
            )}

            {/* ═══ VENDOR TABS ═══ */}
            {isVendor && (
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full min-w-0">
                <nav aria-label={isNb ? "Leverandør-faner" : "Vendor tabs"} className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
                  <div className="flex items-center gap-1">
                    <TabsList className="flex flex-1 bg-muted/30 border border-border rounded-xl p-1 h-auto gap-0.5 min-w-0" role="tablist">
                      {vendorTabDefs.map((tab) => (
                        <TabsTrigger
                          key={tab.value}
                          value={tab.value}
                          className="relative text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg whitespace-nowrap px-2 sm:px-3 py-1.5"
                          role="tab"
                        >
                          <span className="sm:hidden">{tab.label}</span>
                          <span className="hidden sm:inline">{tab.labelFull}</span>
                          {tab.value === 'overview' && overviewNeedsAction && (
                            <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive" />
                            </span>
                          )}
                        </TabsTrigger>
                      ))}
                    </TabsList>

                    {vendorOverflowTabDefs.length > 0 && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant={activeVendorOverflowTab ? "default" : "outline"}
                            size="sm"
                            className="h-9 gap-1.5 shrink-0 text-xs"
                            aria-label={isNb ? "Vis flere" : "Show more"}
                          >
                            {activeVendorOverflowTab ? activeVendorOverflowTab.labelFull : (
                              <>
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="hidden sm:inline">{isNb ? "Vis flere" : "Show more"}</span>
                              </>
                            )}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="min-w-[180px]">
                          {vendorOverflowTabDefs.map((tab) => (
                            <DropdownMenuItem
                              key={tab.value}
                              onClick={() => setActiveTab(tab.value)}
                              className={activeTab === tab.value ? "bg-accent font-medium" : ""}
                            >
                              {tab.labelFull}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}

                    {/* Tab customization popover */}
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 shrink-0"
                          aria-label={isNb ? "Tilpass faner" : "Customize tabs"}
                        >
                          <Settings2 className="h-4 w-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent align="end" className="w-64 p-3">
                        <p className="text-sm font-medium mb-2">
                          {isNb ? "Tilpass faner" : "Customize tabs"}
                        </p>
                        <p className="text-xs text-muted-foreground mb-3">
                          {isNb
                            ? `Velg opptil ${MAX_VISIBLE_TABS} faner som vises direkte.`
                            : `Choose up to ${MAX_VISIBLE_TABS} tabs to show directly.`}
                        </p>
                        <div className="space-y-1.5">
                          {allVendorTabs.map((tab) => {
                            const isLocked = tab.value === LOCKED_TAB;
                            const isChecked = visibleTabIds.includes(tab.value);
                            const isAtMax = visibleTabIds.length >= MAX_VISIBLE_TABS && !isChecked;
                            return (
                              <label
                                key={tab.value}
                                className={cn(
                                  "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer hover:bg-muted/50 transition-colors",
                                  isLocked && "opacity-60 cursor-not-allowed"
                                )}
                              >
                                <Checkbox
                                  checked={isChecked}
                                  disabled={isLocked || isAtMax}
                                  onCheckedChange={() => toggleTab(tab.value)}
                                />
                                <span className="flex-1">{tab.labelFull}</span>
                                {isLocked && (
                                  <span className="text-[13px] text-muted-foreground">
                                    {isNb ? "Låst" : "Locked"}
                                  </span>
                                )}
                              </label>
                            );
                          })}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </nav>

                <TabsContent value="overview" className="mt-6">
                  <VendorOverviewTab
                    asset={asset}
                    tasksCount={tasks?.length || 0}
                    onTrustMetrics={handleTrustMetrics}
                    onNavigateToTab={setActiveTab}
                  />
                </TabsContent>
                <TabsContent value="vendor-tasks" className="mt-6">
                  <VendorTasksTab asset={asset} />
                </TabsContent>
                <TabsContent value="usage" className="mt-6">
                  <VendorUsageTab assetId={asset.id} />
                </TabsContent>
                <TabsContent value="history" className="mt-6">
                  <VendorHistoryTab assetId={asset.id} />
                </TabsContent>
                <TabsContent value="deliveries" className="mt-6">
                  <DeliveriesTab assetId={asset.id} />
                </TabsContent>
                <TabsContent value="vendor-audit" className="mt-6">
                  <VendorAuditTab assetId={asset.id} />
                </TabsContent>
                <TabsContent value="vendor-incidents" className="mt-6">
                  <div className="text-sm text-muted-foreground italic p-8 text-center">
                    {isNb ? "Hendelser kommer snart" : "Incidents coming soon"}
                  </div>
                </TabsContent>
                <TabsContent value="evidence" className="mt-6">
                  <VendorEvidenceTab assetId={asset.id} assetName={asset.name} vendorName={asset.vendor || undefined} />
                </TabsContent>
                <TabsContent value="requests" className="mt-6">
                  <CustomerRequestsTab />
                </TabsContent>
                <TabsContent value="vendor-activity" className="mt-6">
                  <VendorActivityTab
                    assetId={asset.id}
                    assetName={asset.name}
                    baselinePercent={trustMetrics ? Math.round(trustMetrics.trustScore * 0.5) : 19}
                    enrichmentPercent={trustMetrics ? Math.round(trustMetrics.trustScore * 0.5) : 19}
                  />
                </TabsContent>
                <TabsContent value="vendor-access" className="mt-6">
                  <VendorAccessTab assetId={asset.id} assetName={asset.name} />
                </TabsContent>
              </Tabs>
            )}

            {/* ═══ SELF TABS (full tab set) ════════════════════════════ */}
            {isSelf && orgSection === "trust-profile" && (
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full min-w-0">
                <nav aria-label={isNb ? "Trust Profile-faner" : "Trust Profile tabs"}>
                  <div className="flex items-center gap-1">
                    <TabsList className="flex bg-muted/30 border border-border rounded-xl p-1 h-auto gap-0.5 flex-1 min-w-0 overflow-hidden" role="tablist">
                      {primaryTabDefs.map((tab) => (
                        <TabsTrigger
                          key={tab.value}
                          value={tab.value}
                          className="text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg whitespace-nowrap flex-none"
                          role="tab"
                        >
                          {tab.label}
                        </TabsTrigger>
                      ))}
                    </TabsList>

                    {overflowTabDefs.length > 0 && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant={activeOverflowTab ? "default" : "outline"}
                            size="sm"
                            className="h-9 gap-1.5 shrink-0 text-xs"
                            aria-label={isNb ? "Flere faner" : "More tabs"}
                          >
                            {activeOverflowTab ? activeOverflowTab.label : (
                              <>
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="hidden sm:inline">{isNb ? "Mer" : "More"}</span>
                              </>
                            )}
                            {!activeOverflowTab && inboxCount > 0 && (
                              <Badge className="h-4 min-w-4 px-1 text-[13px] bg-primary text-primary-foreground">{inboxCount}</Badge>
                            )}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="min-w-[180px]">
                          {overflowTabDefs.map((tab) => (
                            <DropdownMenuItem
                              key={tab.value}
                              onClick={() => setActiveTab(tab.value)}
                              className={activeTab === tab.value ? "bg-accent font-medium" : ""}
                            >
                              <span className="flex-1">{tab.label}</span>
                              {'badge' in tab && (tab as any).badge > 0 && (
                                <Badge className="ml-2 h-4 min-w-4 px-1 text-[13px] bg-primary text-primary-foreground">
                                  {(tab as any).badge}
                                </Badge>
                              )}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </nav>

                <TabsContent value="nis2" className="mt-6">
                  <NIS2AssessmentTab assetId={asset.id} metadata={(asset.metadata as Record<string, any>) || {}} />
                </TabsContent>
                <TabsContent value="validation" className="mt-6">
                  <ValidationTab assetId={asset.id} />
                </TabsContent>
                <TabsContent value="controls" className="mt-6">
                  <ControlsTab assetId={asset.id} />
                </TabsContent>
                <TabsContent value="dataHandling" className="mt-6">
                  <DataHandlingTab assetId={asset.id} />
                </TabsContent>
                <TabsContent value="riskManagement" className="mt-6">
                  <RiskManagementTab assetId={asset.id} />
                </TabsContent>
                <TabsContent value="incidents" className="mt-6">
                  <IncidentManagementTab assetId={asset.id} />
                </TabsContent>
                <TabsContent value="relations" className="mt-6">
                  <RelationsTab assetId={asset.id} />
                </TabsContent>
                <TabsContent value="documents" className="mt-6">
                  <DocumentsTab assetId={asset.id} assetName={asset.name} vendorName={asset.vendor || undefined} />
                </TabsContent>
                <TabsContent value="inbox" className="mt-6">
                  <LaraInboxTab assetId={asset.id} assetName={asset.name} />
                </TabsContent>
                <TabsContent value="security-services" className="mt-6">
                  <SecurityServicesSection isSelfProfile={true} />
                </TabsContent>
                <TabsContent value="requests" className="mt-6">
                  <CustomerRequestsTab />
                </TabsContent>
              </Tabs>
            )}
          </div>
        </main>
      </div>

      <ContextualHelpPanel
        open={helpOpen}
        onOpenChange={setHelpOpen}
        icon={isVendor ? Handshake : Shield}
        title={isVendor
          ? (isNb ? "Leverandørprofil" : "Vendor Profile")
          : (isNb ? "Systemprofil" : "System Profile")}
        description={isVendor
          ? (isNb
            ? "Her får du full oversikt over en leverandør: dokumentasjon, risikovurdering, compliance-status og oppfølgingshistorikk. Mynder analyserer leverandørens profil og gir deg veiledning om hva som bør følges opp."
            : "Here you get a complete overview of a vendor: documentation, risk assessment, compliance status and follow-up history. Mynder analyzes the vendor's profile and guides you on what needs attention.")
          : (isNb
            ? "Her ser du systemprofilen med oversikt over data, kontroller, dokumentasjon og compliance-status."
            : "Here you see the system profile with an overview of data, controls, documentation and compliance status.")}
        itemsHeading={isNb ? "Hva kan du gjøre her?" : "What can you do here?"}
        items={isVendor ? [
          { icon: Eye, title: isNb ? "Se veiledning" : "View guidance", description: isNb ? "Mynder vurderer leverandørens modenhet og gir deg konkrete anbefalinger." : "Mynder assesses the vendor's maturity and gives you concrete recommendations." },
          { icon: FileText, title: isNb ? "Dokumentasjon" : "Documentation", description: isNb ? "Last opp og administrer DPA, SLA og annen avtalebasert dokumentasjon." : "Upload and manage DPA, SLA and other agreement-based documentation." },
          { icon: Shield, title: isNb ? "Risikovurdering" : "Risk assessment", description: isNb ? "Se risikoprofilen og gjennomfør revisjoner basert på kontrollområdene." : "View the risk profile and conduct audits based on control areas." },
          { icon: ClipboardList, title: isNb ? "Oppgaver og tiltak" : "Tasks and actions", description: isNb ? "Følg opp tiltak og oppgaver knyttet til leverandøren." : "Follow up on actions and tasks related to the vendor." },
          { icon: Send, title: isNb ? "Be om oppdatering" : "Request update", description: isNb ? "Be leverandøren om manglende dokumentasjon eller oppdateringer." : "Ask the vendor for missing documentation or updates." },
          { icon: PenLine, title: isNb ? "Registrer aktivitet" : "Log activity", description: isNb ? "Logg e-post, møte eller annen kontakt med leverandøren." : "Log email, meeting or other contact with the vendor." },
        ] : [
          { icon: Shield, title: isNb ? "Kontroller" : "Controls", description: isNb ? "Se og oppdater kontrollstatus for systemet." : "View and update control status for the system." },
          { icon: FileText, title: isNb ? "Dokumentasjon" : "Documentation", description: isNb ? "Administrer dokumentasjon knyttet til systemet." : "Manage documentation related to the system." },
        ]}
        whyTitle={isNb ? "Hvorfor er dette viktig?" : "Why does this matter?"}
        whyDescription={isVendor
          ? (isNb
            ? "Leverandørstyring (TPRM) er et av de viktigste kontrollområdene for personvern og informasjonssikkerhet. Ved å ha oversikt over dokumentasjon, risiko og avtaler sikrer du at leverandørene dine behandler data i tråd med kravene."
            : "Third-Party Risk Management (TPRM) is one of the most important control areas for privacy and information security. By keeping track of documentation, risk and agreements, you ensure your vendors handle data in compliance with requirements.")
          : (isNb
            ? "Systemoversikten gir deg kontroll på hvilke data som behandles, hvilke kontroller som er på plass, og hva som mangler for å sikre etterlevelse."
            : "The system overview gives you control over which data is processed, which controls are in place, and what is missing to ensure compliance.")}
        stepsHeading={isNb ? "Kom i gang" : "Get started"}
        steps={isVendor ? [
          { text: isNb ? "Gjennomgå veiledningen fra Mynder" : "Review the guidance from Mynder" },
          { text: isNb ? "Last opp eller be om manglende dokumentasjon" : "Upload or request missing documentation" },
          { text: isNb ? "Gjennomfør risikovurdering og revisjon" : "Conduct risk assessment and audit" },
          { text: isNb ? "Følg opp oppgaver og tiltak" : "Follow up on tasks and actions" },
        ] : [
          { text: isNb ? "Se gjennom systemprofilen" : "Review the system profile" },
          { text: isNb ? "Oppdater kontrollstatus" : "Update control status" },
          { text: isNb ? "Last opp nødvendig dokumentasjon" : "Upload necessary documentation" },
        ]}
        laraSuggestion={isVendor
          ? (isNb ? "Hjelp meg med å vurdere risikoen ved denne leverandøren" : "Help me assess the risk of this vendor")
          : (isNb ? "Hjelp meg med å gjennomgå dette systemet" : "Help me review this system")}
      />

      {isVendor && (
        <RegisterActivityDialog
          open={activityDialogOpen}
          onOpenChange={setActivityDialogOpen}
          onSubmit={() => setActivityDialogOpen(false)}
        />
      )}
    </SidebarProvider>
  );
};

export default AssetTrustProfile;
