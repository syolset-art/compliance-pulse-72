import { useState, useEffect, useMemo } from "react";
import { usePageHelpListener } from "@/hooks/usePageHelpListener";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { AddWorkAreaDialog } from "@/components/dialogs/AddWorkAreaDialog";
import { EditCompanyProfileDialog } from "@/components/dialogs/EditCompanyProfileDialog";
import { AssignAssetDialog } from "@/components/dialogs/AssignAssetDialog";
import { CompanyOnboarding } from "@/components/onboarding/CompanyOnboarding";
import { ProcessList } from "@/components/process/ProcessList";
import { ResponsiblePersonEditor } from "@/components/work-areas/ResponsiblePersonEditor";
import { AssetSummaryDashboard } from "@/components/work-areas/AssetSummaryDashboard";
import { WorkAreaDocumentsTab } from "@/components/work-areas/WorkAreaDocumentsTab";
import { ProcessingActivitiesTab } from "@/components/work-areas/ProcessingActivitiesTab";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  Plus, 
  Shield, 
  Users as UsersIcon, 
  FileText, 
  Server, 
  AlertCircle, 
  Pencil, 
  Trash2,
  Filter,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Settings,
  Info,
  Grid3x3,
  Loader2,
  Workflow,
  Building2,
  Network,
  Package,
  ExternalLink,
  X,
  Layers,
  ClipboardList,
  Handshake,
  MapPin,
  Monitor,
  HelpCircle,
  Crown,
  UserCog,
  ClipboardCheck,
  User,
  Sparkles,
  AlertTriangle,
  Save,
  Check
} from "lucide-react";
import { useNavigationMode } from "@/hooks/useNavigationMode";
import { useTranslation } from "react-i18next";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { getSystemIcon } from "@/lib/systemIcons";
import { WorkAreaHelpDrawer } from "@/components/work-areas/WorkAreaHelpDrawer";

interface WorkArea {
  id: string;
  name: string;
  description: string | null;
  responsible_person: string | null;
  is_active: boolean;
}

interface WorkAreaTemplate {
  id: string;
  industry: string;
  name: string;
  description: string | null;
  icon: string | null;
  sort_order: number;
}

interface CompanyProfile {
  id: string;
  name: string;
  org_number: string | null;
  industry: string;
  employees: string | null;
  maturity: string | null;
  geographic_scope: string | null;
  sensitive_data: string | null;
}

interface Asset {
  id: string;
  name: string;
  description: string | null;
  asset_type: string;
  risk_level: string | null;
  criticality: string | null;
  work_area_id: string | null;
  vendor: string | null;
}

interface AssetWithOwnership extends Asset {
  ownership: "owner" | "user";
}

const workAreaColors = [
  "bg-primary",
  "bg-orange-500",
  "bg-pink-500",
  "bg-cyan-500",
  "bg-emerald-500",
  "bg-violet-500",
];

export default function WorkAreas() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingWorkArea, setEditingWorkArea] = useState<WorkArea | null>(null);
  const [deletingWorkArea, setDeletingWorkArea] = useState<WorkArea | null>(null);
  const [workAreas, setWorkAreas] = useState<WorkArea[]>([]);
  const [selectedWorkArea, setSelectedWorkArea] = useState<WorkArea | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAllAreas, setShowAllAreas] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [templates, setTemplates] = useState<WorkAreaTemplate[]>([]);
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(null);
  const [selectedTemplates, setSelectedTemplates] = useState<Set<string>>(new Set());
  const [isCreatingFromTemplates, setIsCreatingFromTemplates] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [isCompanyProfileDialogOpen, setIsCompanyProfileDialogOpen] = useState(false);
  const [isAssignAssetDialogOpen, setIsAssignAssetDialogOpen] = useState(false);
  const [assetTypeFilter, setAssetTypeFilter] = useState<string>("all");
  const [activeWorkAreaTab, setActiveWorkAreaTab] = useState("assets");
  const [ownershipFilter, setOwnershipFilter] = useState<"all" | "mine" | "member">("all");
  const [riskFilter, setRiskFilter] = useState<"all" | "high" | "low">("all");
  const [introDismissed, setIntroDismissed] = useState(() => localStorage.getItem("workarea-intro-dismissed") === "true");
  const [helpDrawerOpen, setHelpDrawerOpen] = useState(false);
  usePageHelpListener(setHelpDrawerOpen);
  const { toast } = useToast();
  const { mode } = useNavigationMode();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch document count for selected work area
  const { data: docCount = 0 } = useQuery({
    queryKey: ["work-area-doc-count", selectedWorkArea?.id],
    queryFn: async () => {
      if (!selectedWorkArea?.id) return 0;
      const { count, error } = await supabase
        .from("work_area_documents" as any)
        .select("*", { count: "exact", head: true })
        .eq("work_area_id", selectedWorkArea.id);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!selectedWorkArea?.id,
  });

  // Fetch processing activity count for selected work area
  const { data: processingActivityCount = 0 } = useQuery({
    queryKey: ["work-area-processing-count", selectedWorkArea?.id],
    queryFn: async () => {
      if (!selectedWorkArea?.id) return 0;
      const { data: sysList, error: sysErr } = await supabase
        .from("systems")
        .select("id")
        .eq("work_area_id", selectedWorkArea.id);
      if (sysErr || !sysList || sysList.length === 0) return 0;
      const { count, error } = await supabase
        .from("system_processes")
        .select("*", { count: "exact", head: true })
        .in("system_id", sysList.map((s) => s.id));
      if (error) throw error;
      return count || 0;
    },
    enabled: !!selectedWorkArea?.id,
  });

  // Fetch all assets with work_area_id to compute risk per work area
  const { data: allWorkAreaAssets = [] } = useQuery({
    queryKey: ["all-work-area-assets-risk"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assets")
        .select("work_area_id, risk_level");
      if (error) throw error;
      return (data || []) as { work_area_id: string | null; risk_level: string | null }[];
    },
  });

  // Compute highest risk per work area
  const workAreaRiskMap = useMemo(() => {
    const riskOrder: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };
    const map: Record<string, string> = {};
    for (const asset of allWorkAreaAssets) {
      if (!asset.work_area_id) continue;
      const current = map[asset.work_area_id];
      const currentLevel = current ? (riskOrder[current] || 0) : 0;
      const newLevel = riskOrder[asset.risk_level || ""] || 0;
      if (newLevel > currentLevel) {
        map[asset.work_area_id] = asset.risk_level!;
      }
    }
    return map;
  }, [allWorkAreaAssets]);

  const { data: ownedAssets = [] } = useQuery({
    queryKey: ["work-area-assets-owned", selectedWorkArea?.id],
    queryFn: async () => {
      if (!selectedWorkArea?.id) return [];
      const { data, error } = await supabase
        .from("assets")
        .select("*")
        .eq("work_area_id", selectedWorkArea.id);
      if (error) throw error;
      return (data || []) as Asset[];
    },
    enabled: !!selectedWorkArea?.id,
  });

  // Fetch assets used by this work area (via relations from owned assets)
  const { data: usedAssets = [] } = useQuery({
    queryKey: ["work-area-assets-used", selectedWorkArea?.id, ownedAssets],
    queryFn: async () => {
      if (!selectedWorkArea?.id || ownedAssets.length === 0) return [];
      const ownedIds = ownedAssets.map((a: Asset) => a.id);
      
      // Get all "uses" relations from owned assets
      const { data: relations, error } = await supabase
        .from("asset_relationships")
        .select("target_asset_id")
        .in("source_asset_id", ownedIds)
        .eq("relationship_type", "uses");
      
      if (error) throw error;
      if (!relations || relations.length === 0) return [];
      
      // Fetch the target assets
      const targetIds = relations.map(r => r.target_asset_id);
      const { data: targets, error: targetError } = await supabase
        .from("assets")
        .select("*")
        .in("id", targetIds);
      
      if (targetError) throw targetError;
      return (targets || []) as Asset[];
    },
    enabled: !!selectedWorkArea?.id && ownedAssets.length > 0,
  });

  // Combine and filter assets
  const allAssets = useMemo(() => {
    const owned: AssetWithOwnership[] = ownedAssets.map((a: Asset) => ({ ...a, ownership: "owner" as const }));
    const used: AssetWithOwnership[] = usedAssets.map((a: Asset) => ({ ...a, ownership: "user" as const }));
    
    let combined = [...owned, ...used];
    
    // Remove duplicates (if an asset is both owned and used, show as owner)
    const seen = new Set<string>();
    combined = combined.filter(a => {
      if (seen.has(a.id)) return false;
      seen.add(a.id);
      return true;
    });
    
    return combined;
  }, [ownedAssets, usedAssets]);

  // Filtered assets for table display
  const filteredAssets = useMemo(() => {
    if (assetTypeFilter === "all") return allAssets;
    return allAssets.filter(a => a.asset_type === assetTypeFilter);
  }, [allAssets, assetTypeFilter]);

  // Helper to get asset type icon
  const getAssetTypeIcon = (assetType: string) => {
    switch (assetType) {
      case "system":
        return <Server className="h-4 w-4 text-blue-500" />;
      case "location":
        return <Building2 className="h-4 w-4 text-green-500" />;
      case "network":
        return <Network className="h-4 w-4 text-orange-500" />;
      default:
        return <Package className="h-4 w-4 text-muted-foreground" />;
    }
  };

  // Helper to get asset type label
  const getAssetTypeLabel = (assetType: string) => {
    switch (assetType) {
      case "system":
        return t("myWorkAreas.assetTypes.system");
      case "location":
        return t("myWorkAreas.assetTypes.location");
      case "network":
        return t("myWorkAreas.assetTypes.network");
      default:
        return assetType;
    }
  };

  const fetchWorkAreas = async () => {
    try {
      const { data, error } = await supabase
        .from("work_areas")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setWorkAreas(data || []);
      if (data && data.length > 0 && !selectedWorkArea) {
        setSelectedWorkArea(data[0]);
      }
    } catch (error) {
      console.error("Error fetching work areas:", error);
      toast({
        title: t("common.error"),
        description: "Kunne ikke hente arbeidsområder",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCompanyAndTemplates = async () => {
    try {
      // Fetch company profile using raw query approach for new tables
      const { data: profileData, error: profileError } = await supabase
        .from("company_profile" as any)
        .select("*")
        .single();

      if (profileError && profileError.code === "PGRST116") {
        // No company profile exists - continue to show page anyway
        setInitialLoadComplete(true);
        return;
      }

      if (profileError) {
        console.error("Error fetching company profile:", profileError);
        setInitialLoadComplete(true);
        return;
      }

      if (profileData) {
        const profile = profileData as unknown as CompanyProfile;
        setCompanyProfile(profile);
        
        // Fetch templates for company's industry
        const { data: templateData, error: templateError } = await supabase
          .from("work_area_templates" as any)
          .select("*")
          .eq("industry", profile.industry)
          .order("sort_order", { ascending: true });

        if (templateError) {
          console.error("Error fetching templates:", templateError);
          setInitialLoadComplete(true);
          return;
        }

        if (templateData) {
          setTemplates(templateData as unknown as WorkAreaTemplate[]);
        }
      }
      setInitialLoadComplete(true);
    } catch (error) {
      console.error("Error fetching company/templates:", error);
      setInitialLoadComplete(true);
    }
  };

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    fetchCompanyAndTemplates();
    fetchWorkAreas();
  };

  useEffect(() => {
    fetchWorkAreas();
    fetchCompanyAndTemplates();
  }, []);

  const toggleTemplateSelection = (templateId: string) => {
    setSelectedTemplates(prev => {
      const newSet = new Set(prev);
      if (newSet.has(templateId)) {
        newSet.delete(templateId);
      } else {
        newSet.add(templateId);
      }
      return newSet;
    });
  };

  const selectAllTemplates = () => {
    if (selectedTemplates.size === templates.length) {
      setSelectedTemplates(new Set());
    } else {
      setSelectedTemplates(new Set(templates.map(t => t.id)));
    }
  };

  const createWorkAreasFromTemplates = async () => {
    if (selectedTemplates.size === 0) return;

    setIsCreatingFromTemplates(true);
    try {
      const selectedTemplateData = templates.filter(t => selectedTemplates.has(t.id));
      const workAreasToCreate = selectedTemplateData.map(template => ({
        name: template.name,
        description: template.description,
        responsible_person: null,
      }));

      const { error } = await supabase.from("work_areas").insert(workAreasToCreate);

      if (error) throw error;

      // Update onboarding progress
      const { data: progressData } = await supabase
        .from("onboarding_progress")
        .select("*")
        .single();

      if (progressData) {
        await supabase
          .from("onboarding_progress")
          .update({ work_areas_defined: true })
          .eq("id", progressData.id);
      }

      toast({
        title: t("common.success"),
        description: `${selectedTemplates.size} arbeidsområder opprettet`,
      });

      setSelectedTemplates(new Set());
      fetchWorkAreas();
    } catch (error) {
      console.error("Error creating work areas:", error);
      toast({
        title: t("common.error"),
        description: "Kunne ikke opprette arbeidsområder",
        variant: "destructive",
      });
    } finally {
      setIsCreatingFromTemplates(false);
    }
  };

  const handleWorkAreaAdded = () => {
    fetchWorkAreas();
    setEditingWorkArea(null);
  };

  const handleEdit = (area: WorkArea) => {
    setEditingWorkArea(area);
    setIsAddDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingWorkArea) return;

    try {
      const { error } = await supabase
        .from("work_areas")
        .delete()
        .eq("id", deletingWorkArea.id);

      if (error) throw error;

      toast({
        title: t("common.success"),
        description: "Arbeidsområdet ble slettet",
      });

      fetchWorkAreas();
      if (selectedWorkArea?.id === deletingWorkArea.id) {
        setSelectedWorkArea(workAreas.find(a => a.id !== deletingWorkArea.id) || null);
      }
    } catch (error) {
      console.error("Error deleting work area:", error);
      toast({
        title: t("common.error"),
        description: "Kunne ikke slette arbeidsområde",
        variant: "destructive",
      });
    } finally {
      setDeletingWorkArea(null);
    }
  };

  const handleDialogClose = (open: boolean) => {
    setIsAddDialogOpen(open);
    if (!open) {
      setEditingWorkArea(null);
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "low": return "text-success";
      case "medium": return "text-warning";
      case "high": return "text-orange-500";
      case "critical": return "text-destructive";
      default: return "text-muted-foreground";
    }
  };

  const getRiskLabel = (risk: string) => {
    switch (risk) {
      case "low": return t("myWorkAreas.riskLow");
      case "medium": return t("myWorkAreas.riskMedium");
      case "high": return t("myWorkAreas.riskHigh");
      case "critical": return t("myWorkAreas.riskCritical");
      default: return risk;
    }
  };

  const getSystemIconComponent = (iconName: string) => {
    const IconComponent = getSystemIcon(iconName);
    return <IconComponent className="h-8 w-8" />;
  };

  const filteredAreas = useMemo(() => {
    let areas = [...workAreas];
    
    // Ownership filter
    if (ownershipFilter === "mine") {
      areas = areas.filter(a => a.responsible_person);
    } else if (ownershipFilter === "member") {
      areas = areas.filter(a => !a.responsible_person);
    }
    
    // Risk filter
    if (riskFilter === "high") {
      areas = areas.filter(a => {
        const risk = workAreaRiskMap[a.id];
        return risk === "high" || risk === "critical";
      });
    } else if (riskFilter === "low") {
      areas = areas.filter(a => {
        const risk = workAreaRiskMap[a.id];
        return !risk || risk === "low" || risk === "medium";
      });
    }
    
    return areas;
  }, [workAreas, ownershipFilter, riskFilter, workAreaRiskMap]);

  const displayedAreas = showAllAreas ? filteredAreas : filteredAreas.slice(0, 6);

  if (mode === "chat") {
    return null;
  }


  // Show loading state while checking for company profile
  if (!initialLoadComplete) {
    return (
      <div className="flex h-screen bg-background items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      
      <main className="flex-1 overflow-y-auto pt-11">
        <div className="container mx-auto px-3 py-4 sm:px-6 sm:py-8 max-w-7xl">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 sm:mb-6">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">
                {t("myWorkAreas.title")} ({filteredAreas.length !== workAreas.length ? `${filteredAreas.length} av ${workAreas.length}` : workAreas.length})
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground mt-1">
                {t("myWorkAreas.subtitle")}
                {companyProfile && (
                  <span className="block sm:inline sm:ml-2 text-foreground font-medium">• {companyProfile.name}</span>
                )}
              </p>
            </div>
          </div>

          {/* Intro banner for new users */}
          {!introDismissed && !selectedWorkArea && (
            <Card className="mb-4 sm:mb-6 p-5 sm:p-6 border-primary/20 bg-primary/5 relative">
              <button
                onClick={() => {
                  setIntroDismissed(true);
                  localStorage.setItem("workarea-intro-dismissed", "true");
                }}
                className="absolute top-3 right-3 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                aria-label="Lukk"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="flex items-start gap-3 mb-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Layers className="h-5 w-5 text-primary" />
                </div>
                <div className="pr-6">
                  <h3 className="font-semibold text-foreground mb-1">Hva er et arbeidsområde?</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Et arbeidsområde representerer en avdeling, funksjon eller ansvarsområde i organisasjonen din — for eksempel «HR», «IT-drift» eller «Kundeservice». Hvert arbeidsområde samler systemene, prosessene og leverandørene som hører til, slik at du får oversikt over risiko og etterlevelse på ett sted.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="flex items-start gap-3 rounded-lg border bg-background p-3">
                  <Server className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Systemer</p>
                    <p className="text-xs text-muted-foreground">Legg til systemer og verktøy som brukes</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-lg border bg-background p-3">
                  <ClipboardList className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Prosesser</p>
                    <p className="text-xs text-muted-foreground">Dokumenter behandlingsaktiviteter og AI-bruk</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-lg border bg-background p-3">
                  <Handshake className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Leverandører</p>
                    <p className="text-xs text-muted-foreground">Hold oversikt over tredjeparter</p>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Filters */}
          <div className="mb-3 sm:mb-4 flex flex-wrap gap-2 items-center">
            <Filter className="h-4 w-4 text-muted-foreground" />
            
            {/* Ownership filter */}
            <div className="flex gap-1 bg-muted rounded-lg p-0.5">
              {([
                { value: "all", label: "Alle" },
                { value: "mine", label: "Mine" },
                { value: "member", label: "Medlem" },
              ] as const).map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setOwnershipFilter(opt.value)}
                  className={cn(
                    "px-3 py-1 text-xs font-medium rounded-md transition-colors",
                    ownershipFilter === opt.value
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Risk filter */}
            <div className="flex gap-1 bg-muted rounded-lg p-0.5">
              {([
                { value: "all", label: "Alle risikonivåer" },
                { value: "high", label: "Høy risiko" },
                { value: "low", label: "Lav risiko" },
              ] as const).map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setRiskFilter(opt.value)}
                  className={cn(
                    "px-3 py-1 text-xs font-medium rounded-md transition-colors",
                    riskFilter === opt.value
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {(ownershipFilter !== "all" || riskFilter !== "all") && (
              <button
                onClick={() => { setOwnershipFilter("all"); setRiskFilter("all"); }}
                className="text-xs text-muted-foreground hover:text-foreground underline"
              >
                Nullstill
              </button>
            )}
          </div>

          {/* Work Area Chips - Horizontal scroll on mobile */}
          <div className="overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0 mb-3 sm:mb-4">
            <div className="flex gap-2 pb-2 sm:pb-0 sm:flex-wrap min-w-max sm:min-w-0">
              {displayedAreas.map((area, index) => (
                <button
                  key={area.id}
                  onClick={() => setSelectedWorkArea(area)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
                    selectedWorkArea?.id === area.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-card border border-border hover:border-primary/50 text-foreground"
                  )}
                >
                  <div className={cn(
                    "w-2 h-2 rounded-full flex-shrink-0",
                    workAreaColors[index % workAreaColors.length]
                  )} />
                  <span className="truncate max-w-[100px] sm:max-w-[120px]">{area.name}</span>
                  <span className="text-xs opacity-70 hidden sm:inline">
                    <Server className="h-3 w-3 inline mr-1" />
                    10 {t("myWorkAreas.systemsShort")}
                  </span>
                </button>
              ))}
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setIsAddDialogOpen(true)}
                className="gap-1 flex-shrink-0"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">{t("myWorkAreas.addNew")}</span>
              </Button>
            </div>
          </div>

          {filteredAreas.length > 6 && (
            <button
              onClick={() => setShowAllAreas(!showAllAreas)}
              className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-6"
            >
              {showAllAreas ? t("myWorkAreas.showLess") : `${t("myWorkAreas.showMore")} (${filteredAreas.length - 6})`}
              <ChevronDown className={cn("h-4 w-4 transition-transform", showAllAreas && "rotate-180")} />
            </button>
          )}

          {/* Selected Work Area Card */}
          {selectedWorkArea && (
            <Card className="p-4 sm:p-6 mb-4 sm:mb-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
                    <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <h2 className="text-lg sm:text-xl font-semibold text-foreground">{selectedWorkArea.name}</h2>
                    <ResponsiblePersonEditor
                      workAreaId={selectedWorkArea.id}
                      currentPerson={selectedWorkArea.responsible_person}
                      onUpdate={(newPerson) => {
                        // Update local state
                        setSelectedWorkArea({ ...selectedWorkArea, responsible_person: newPerson });
                        setWorkAreas(workAreas.map(wa => 
                          wa.id === selectedWorkArea.id 
                            ? { ...wa, responsible_person: newPerson } 
                            : wa
                        ));
                      }}
                    />
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span>2 {t("myWorkAreas.processes").toLowerCase()}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Server className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span>10 {t("myWorkAreas.systems").toLowerCase()}</span>
                  </div>
                </div>
              </div>

              {selectedWorkArea.description && (
                <p className="text-xs sm:text-sm text-muted-foreground mb-4">{selectedWorkArea.description}</p>
              )}

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs sm:text-sm">
                  <span className="text-muted-foreground">{t("myWorkAreas.risk")}</span>
                  <Info className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-muted rounded-full h-2">
                    <div 
                      className="h-2 rounded-full"
                      style={{ 
                        width: '50%',
                        background: 'linear-gradient(90deg, hsl(var(--success)) 0%, hsl(var(--warning)) 50%, hsl(var(--destructive)) 100%)'
                      }} 
                    />
                  </div>
                  <span className="text-xs sm:text-sm font-medium text-warning">{t("myWorkAreas.riskMedium")}</span>
                </div>
                <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20 text-xs">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {t("myWorkAreas.highCriticality")}
                </Badge>
              </div>

              {/* Carousel Dots */}
              <div className="flex items-center justify-center gap-1 mt-4">
                {[...Array(10)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentSlide(i)}
                    className={cn(
                      "h-1.5 rounded-full transition-all",
                      i === currentSlide ? "w-6 bg-primary" : "w-1.5 bg-muted-foreground/30"
                    )}
                  />
                ))}
              </div>
            </Card>
          )}

          {/* Tabs Section */}
          {selectedWorkArea && (
            <Tabs defaultValue="assets" className="w-full" onValueChange={(v) => setActiveWorkAreaTab(v)} value={activeWorkAreaTab}>
              <div className="flex items-center justify-between gap-2">
                <div className="overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0 flex-1 min-w-0">
                <TabsList className="w-max sm:w-full justify-start border-b border-border rounded-none h-auto p-0 bg-transparent">
                  <TabsTrigger 
                    value="assets" 
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-3 sm:px-4 py-2 sm:py-3 gap-1 sm:gap-2 text-xs sm:text-sm whitespace-nowrap"
                  >
                    <Package className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Verdier</span>
                    <span className="sm:hidden">Verd</span>
                    <Badge variant="secondary" className="ml-1 text-xs">{allAssets.length}</Badge>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="protocols" 
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-3 sm:px-4 py-2 sm:py-3 gap-1 sm:gap-2 text-xs sm:text-sm whitespace-nowrap"
                  >
                    <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Behandlingsaktiviteter</span>
                    <span className="sm:hidden">Beh.</span>
                    <Badge variant="secondary" className="ml-1 text-xs">{processingActivityCount}</Badge>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="processes" 
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-3 sm:px-4 py-2 sm:py-3 gap-1 sm:gap-2 text-xs sm:text-sm whitespace-nowrap"
                  >
                    <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">{t("myWorkAreas.tabs.processes")}</span>
                    <span className="sm:hidden">Pros</span>
                    <Badge variant="secondary" className="ml-1 text-xs">110</Badge>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="documents" 
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-3 sm:px-4 py-2 sm:py-3 gap-1 sm:gap-2 text-xs sm:text-sm whitespace-nowrap"
                  >
                    <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">{t("myWorkAreas.tabs.documents")}</span>
                    <span className="sm:hidden">Dok</span>
                    <Badge variant="secondary" className="ml-1 text-xs">{docCount}</Badge>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="settings" 
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-3 sm:px-4 py-2 sm:py-3 gap-1 sm:gap-2 text-xs sm:text-sm whitespace-nowrap"
                  >
                    <Settings className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">{t("myWorkAreas.tabs.settings")}</span>
                  </TabsTrigger>
                </TabsList>
                </div>
              </div>
              {activeWorkAreaTab === "protocols" && (
                <div className="flex justify-end mt-3">
                  <Button size="sm" className="gap-1" onClick={() => navigate("/reports")}>
                    <FileText className="h-4 w-4" />
                    Start rapport
                  </Button>
                </div>
              )}

              <TabsContent value="assets" className="mt-4">

                {/* Category cards grid */}
                <div className="flex items-center justify-between mb-4">
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 flex-1">
                    {[
                      { key: "system", icon: Server, label: "Systemer", enabled: true },
                      { key: "vendor", icon: Building2, label: "Leverandører", enabled: true },
                      { key: "location", icon: MapPin, label: "Lokasjoner", enabled: true },
                      { key: "network", icon: Network, label: "Nettverk", enabled: false },
                      { key: "device", icon: Monitor, label: "Enheter", enabled: false },
                    ].map(({ key, icon: Icon, label, enabled }) => {
                      const count = allAssets.filter(a => a.asset_type === key).length;
                      const isSelected = assetTypeFilter === key;
                      return (
                        <div
                          key={key}
                          className={cn(
                            "flex flex-col items-center p-3 border rounded-lg transition-all duration-150",
                            enabled
                              ? isSelected
                                ? "border-primary bg-primary/5 shadow-sm cursor-pointer"
                                : "border-border hover:border-primary/50 cursor-pointer"
                              : "opacity-50 cursor-not-allowed border-border"
                          )}
                          onClick={() => {
                            if (!enabled) return;
                            setAssetTypeFilter(isSelected ? "all" : key);
                          }}
                        >
                          <Icon className={cn("h-5 w-5 mb-1.5", isSelected ? "text-primary" : "text-muted-foreground")} />
                          <span className="text-xs font-medium">{label}</span>
                          {enabled ? (
                            <span className="text-xs text-muted-foreground">{count}</span>
                          ) : (
                            <span className="text-[10px] text-muted-foreground">Kommer</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div className="ml-3 self-start">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="sm" className="gap-2">
                          <Plus className="h-4 w-4" />
                          Legg til
                          <ChevronDown className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setIsAssignAssetDialogOpen(true)}>
                          <Server className="h-4 w-4 mr-2" />
                          System
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate('/assets?type=vendor&addNew=true')}>
                          <Building2 className="h-4 w-4 mr-2" />
                          Leverandør
                        </DropdownMenuItem>
                        <DropdownMenuItem disabled>
                          <Network className="h-4 w-4 mr-2" />
                          Nettverk <Badge variant="outline" className="ml-2 text-[10px] py-0">Kommer</Badge>
                        </DropdownMenuItem>
                        <DropdownMenuItem disabled>
                          <Monitor className="h-4 w-4 mr-2" />
                          PC og mobiler <Badge variant="outline" className="ml-2 text-[10px] py-0">Kommer</Badge>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                <Card>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[250px]">{t("myWorkAreas.table.assetName")}</TableHead>
                        <TableHead className="w-[120px]">{t("myWorkAreas.table.type")}</TableHead>
                        <TableHead className="w-[120px]">{t("myWorkAreas.table.role")}</TableHead>
                        <TableHead className="w-[140px]">{t("myWorkAreas.table.risk")}</TableHead>
                        <TableHead>{t("myWorkAreas.table.vendor")}</TableHead>
                        <TableHead className="w-[100px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAssets.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            {t("myWorkAreas.noAssets")}
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredAssets.map((asset) => (
                          <TableRow 
                            key={asset.id}
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => navigate(`/assets/${asset.id}`)}
                          >
                            <TableCell>
                              <div className="flex items-center gap-3">
                                {getAssetTypeIcon(asset.asset_type)}
                                <span className="font-medium">{asset.name}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs">
                                {getAssetTypeLabel(asset.asset_type)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge 
                                className={cn(
                                  "text-xs",
                                  asset.ownership === "owner" 
                                    ? "bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30" 
                                    : "bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30"
                                )}
                              >
                                {asset.ownership === "owner" 
                                  ? t("myWorkAreas.roleOwner") 
                                  : t("myWorkAreas.roleUser")}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className={cn(
                                  "w-2 h-2 rounded-full",
                                  asset.risk_level === "low" && "bg-success",
                                  asset.risk_level === "medium" && "bg-warning",
                                  asset.risk_level === "high" && "bg-orange-500",
                                  asset.risk_level === "critical" && "bg-destructive"
                                )} />
                                <span className={getRiskColor(asset.risk_level || "medium")}>
                                  {getRiskLabel(asset.risk_level || "medium")}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {asset.vendor || "-"}
                            </TableCell>
                            <TableCell>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/assets/${asset.id}`);
                                }}
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </Card>
              </TabsContent>

              <TabsContent value="protocols" className="mt-4">
                <ProcessingActivitiesTab workAreaId={selectedWorkArea.id} workAreaName={selectedWorkArea.name} />
              </TabsContent>

              <TabsContent value="processes" className="mt-4">
                <ProcessList workAreaId={selectedWorkArea.id} workAreaName={selectedWorkArea.name} />
              </TabsContent>

              <TabsContent value="documents" className="mt-4">
                <WorkAreaDocumentsTab workAreaId={selectedWorkArea.id} workAreaName={selectedWorkArea.name} />
              </TabsContent>

              <TabsContent value="settings" className="mt-4">
                <div className="space-y-6">
                  {/* Medlemmer-seksjon */}
                  <Card className="p-6">
                    <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
                      <UsersIcon className="h-5 w-5 text-primary" />
                      Medlemmer
                    </h3>

                    {/* Eier */}
                    <div className="mb-6">
                      <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Eier</div>
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border">
                        <div className="flex items-center justify-center h-9 w-9 rounded-full bg-primary/10">
                          <Crown className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">
                            {selectedWorkArea.responsible_person || "Ikke tildelt"}
                          </div>
                          <div className="text-xs text-muted-foreground">Arbeidsområde-eier</div>
                        </div>
                        <Badge variant="default" className="text-xs shrink-0">Eier</Badge>
                      </div>
                    </div>

                    {/* Delegerte roller */}
                    <div>
                      <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Delegerte roller</div>
                      <div className="space-y-2">
                        {[
                          { key: "system_owner", label: "Systemansvarlig", desc: "Ansvar for systemer i arbeidsområdet", icon: Monitor },
                          { key: "action_owner", label: "Tiltaksansvarlig", desc: "Ansvar for risikoscenarier i prosesser", icon: ClipboardCheck },
                          { key: "process_owner", label: "Prosessansvarlig", desc: "Ansvar for behandlingsaktiviteter", icon: Workflow },
                        ].map((role) => (
                          <div key={role.key} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/30 transition-colors group">
                            <div className="flex items-center justify-center h-9 w-9 rounded-full bg-muted">
                              <role.icon className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm">{role.label}</div>
                              <div className="text-xs text-muted-foreground">{role.desc}</div>
                            </div>
                            <span className="text-xs text-muted-foreground italic">Ikke tildelt</span>
                            <Pencil className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </Card>

                  {/* Arbeidsområde-detaljer */}
                  <WorkAreaDetailsCard
                    workArea={selectedWorkArea}
                    onUpdate={(updates) => {
                      const updated = { ...selectedWorkArea, ...updates };
                      setSelectedWorkArea(updated);
                      setWorkAreas(prev => prev.map(a => a.id === updated.id ? updated : a));
                    }}
                    onDelete={() => setDeletingWorkArea(selectedWorkArea)}
                  />
                </div>
              </TabsContent>
            </Tabs>
          )}

          {/* Empty State with Templates */}
          {!isLoading && workAreas.length === 0 && (
            <Card className="p-8">
              <div className="text-center mb-6">
                <Shield className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">{t("workAreas.noWorkAreas")}</h3>
                <p className="text-muted-foreground">
                  {companyProfile 
                    ? `Vi har foreslått arbeidsområder basert på din bransje (${companyProfile.industry}). Velg de som passer for ${companyProfile.name}.`
                    : t("workAreas.noWorkAreasDesc")
                  }
                </p>
              </div>

              {templates.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Foreslåtte arbeidsområder</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={selectAllTemplates}
                    >
                      {selectedTemplates.size === templates.length ? "Fjern alle" : "Velg alle"}
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {templates.map((template) => (
                      <button
                        key={template.id}
                        onClick={() => toggleTemplateSelection(template.id)}
                        className={cn(
                          "flex items-start gap-3 p-4 rounded-lg border text-left transition-all",
                          selectedTemplates.has(template.id)
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        <div className={cn(
                          "w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5",
                          selectedTemplates.has(template.id)
                            ? "border-primary bg-primary"
                            : "border-muted-foreground/30"
                        )}>
                          {selectedTemplates.has(template.id) && (
                            <svg className="w-3 h-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{template.name}</p>
                          {template.description && (
                            <p className="text-sm text-muted-foreground mt-1">{template.description}</p>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t">
                    <p className="text-sm text-muted-foreground">
                      {selectedTemplates.size} av {templates.length} valgt
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setIsAddDialogOpen(true)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Opprett egendefinert
                      </Button>
                      <Button
                        onClick={createWorkAreasFromTemplates}
                        disabled={selectedTemplates.size === 0 || isCreatingFromTemplates}
                      >
                        {isCreatingFromTemplates ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Oppretter...
                          </>
                        ) : (
                          <>Opprett valgte ({selectedTemplates.size})</>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {templates.length === 0 && (
                <div className="text-center">
                  <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
                    <Plus className="h-4 w-4" />
                    {t("workAreas.addNew")}
                  </Button>
                </div>
              )}
            </Card>
          )}
        </div>
      </main>

      <AddWorkAreaDialog 
        open={isAddDialogOpen}
        onOpenChange={handleDialogClose}
        onWorkAreaAdded={handleWorkAreaAdded}
        workArea={editingWorkArea}
      />

      <EditCompanyProfileDialog
        open={isCompanyProfileDialogOpen}
        onOpenChange={setIsCompanyProfileDialogOpen}
        companyProfile={companyProfile}
        onProfileUpdated={fetchCompanyAndTemplates}
      />

      {selectedWorkArea && (
        <AssignAssetDialog
          open={isAssignAssetDialogOpen}
          onOpenChange={setIsAssignAssetDialogOpen}
          workAreaId={selectedWorkArea.id}
          workAreaName={selectedWorkArea.name}
          existingAssetIds={allAssets.map((a) => a.id)}
          onAssetsUpdated={() => {
            queryClient.invalidateQueries({ queryKey: ["work-area-assets-owned"] });
            queryClient.invalidateQueries({ queryKey: ["work-area-assets-used"] });
          }}
        />
      )}

      <AlertDialog open={!!deletingWorkArea} onOpenChange={() => setDeletingWorkArea(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("workAreas.deleteConfirm")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("workAreas.deleteDescription")} "{deletingWorkArea?.name}". {t("workAreas.cannotUndo")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("workAreas.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t("workAreas.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <WorkAreaHelpDrawer open={helpDrawerOpen} onOpenChange={setHelpDrawerOpen} />
    </div>
  );
}
