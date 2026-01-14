import { useState, useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AddWorkAreaDialog } from "@/components/dialogs/AddWorkAreaDialog";
import { EditCompanyProfileDialog } from "@/components/dialogs/EditCompanyProfileDialog";
import { CompanyOnboarding } from "@/components/onboarding/CompanyOnboarding";
import { ProcessList } from "@/components/process/ProcessList";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
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
  Workflow
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

interface WorkArea {
  id: string;
  name: string;
  description: string | null;
  responsible_person: string | null;
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
}

// Mock data for systems in work area
const mockSystems = [
  {
    id: "1",
    name: "ChatGPT",
    purpose: "Støtte produktutvikling ved å generere og evaluere tekstforslag, dokumentasjon og ideer basert på teamets input.",
    dataType: "Ordinære personopplysninger",
    risk: "medium",
    hasProtocol: true,
    icon: "chatgpt",
  },
  {
    id: "2",
    name: "Huma",
    purpose: "Administrere HR-prosesser i produktutvikling (ansattdata, lønn, rekruttering, fravær) for å sikre effektiv drift og lovpålagt dokumentasjon.",
    dataType: "Sensitive personopplysninger",
    risk: "critical",
    hasProtocol: true,
    icon: "huma",
  },
  {
    id: "3",
    name: "Microsoft Azure",
    purpose: "Hoste og administrere utviklings-, test- og byggemiljøer for produktutvikling (CI/CD, lagring, analyse) i Azure.",
    dataType: "Ordinære personopplysninger",
    risk: "medium",
    hasProtocol: true,
    icon: "azure",
  },
  {
    id: "4",
    name: "GitHub",
    purpose: "Støtte produktutvikling ved å versjonskontrollere kildekode, håndtere issues og pull requests, samt automatisere bygg og tester for teamets prosjekter.",
    dataType: "Ordinære personopplysninger",
    risk: "low",
    hasProtocol: false,
    icon: "github",
  },
  {
    id: "5",
    name: "Google Ads",
    purpose: "Måle og optimalisere annonseeffekt for produktutvikling via målretting, A/B-testing og kampanjeanalyse.",
    dataType: "Ordinære personopplysninger",
    risk: "low",
    hasProtocol: false,
    icon: "google",
  },
];

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
  const { toast } = useToast();
  const { mode } = useNavigationMode();
  const { t } = useTranslation();

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
        // No company profile exists - show onboarding
        setShowOnboarding(true);
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

  const displayedAreas = showAllAreas ? workAreas : workAreas.slice(0, 6);

  if (mode === "chat") {
    return null;
  }

  // Show onboarding if no company profile exists
  if (showOnboarding) {
    return <CompanyOnboarding onComplete={handleOnboardingComplete} />;
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
      
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-3 py-4 sm:px-6 sm:py-8 max-w-7xl">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 sm:mb-6">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">
                {t("myWorkAreas.title")} ({workAreas.length})
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground mt-1">
                {t("myWorkAreas.subtitle")}
                {companyProfile && (
                  <span className="block sm:inline sm:ml-2 text-foreground font-medium">• {companyProfile.name}</span>
                )}
              </p>
            </div>
            {companyProfile && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setIsCompanyProfileDialogOpen(true)}
                className="gap-2 w-full sm:w-auto"
              >
                <Settings className="h-4 w-4" />
                <span className="sm:inline">Selskapsinnstillinger</span>
              </Button>
            )}
          </div>

          {/* Filter Button */}
          <div className="mb-3 sm:mb-4">
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="h-4 w-4" />
              {t("myWorkAreas.filter")}
            </Button>
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

          {workAreas.length > 6 && (
            <button
              onClick={() => setShowAllAreas(!showAllAreas)}
              className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-6"
            >
              {showAllAreas ? t("myWorkAreas.showLess") : t("myWorkAreas.showMore")}
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
                  <div>
                    <h2 className="text-lg sm:text-xl font-semibold text-foreground">{selectedWorkArea.name}</h2>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      {t("myWorkAreas.manager")}: {selectedWorkArea.responsible_person || t("myWorkAreas.notAssigned")}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span>2 {t("myWorkAreas.processes").toLowerCase()}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <UsersIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span>0 {t("myWorkAreas.users").toLowerCase()}</span>
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
            <Tabs defaultValue="systems" className="w-full">
              <div className="overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0">
                <TabsList className="w-max sm:w-full justify-start border-b border-border rounded-none h-auto p-0 bg-transparent">
                  <TabsTrigger 
                    value="systems" 
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-3 sm:px-4 py-2 sm:py-3 gap-1 sm:gap-2 text-xs sm:text-sm whitespace-nowrap"
                  >
                    <Grid3x3 className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">{t("myWorkAreas.tabs.systems")}</span>
                    <span className="sm:hidden">Sys</span>
                    <Badge variant="secondary" className="ml-1 text-xs">10</Badge>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="protocols" 
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-3 sm:px-4 py-2 sm:py-3 gap-1 sm:gap-2 text-xs sm:text-sm whitespace-nowrap"
                  >
                    <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">{t("myWorkAreas.tabs.protocols")}</span>
                    <span className="sm:hidden">Prot</span>
                    <Badge variant="secondary" className="ml-1 text-xs">28</Badge>
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
                    value="users" 
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-3 sm:px-4 py-2 sm:py-3 gap-1 sm:gap-2 text-xs sm:text-sm whitespace-nowrap"
                  >
                    <UsersIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">{t("myWorkAreas.tabs.users")}</span>
                    <span className="sm:hidden">Bruk</span>
                    <Badge variant="secondary" className="ml-1 text-xs">0</Badge>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="documents" 
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-3 sm:px-4 py-2 sm:py-3 gap-1 sm:gap-2 text-xs sm:text-sm whitespace-nowrap"
                  >
                    <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">{t("myWorkAreas.tabs.documents")}</span>
                    <span className="sm:hidden">Dok</span>
                    <Badge variant="secondary" className="ml-1 text-xs">5</Badge>
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

              <TabsContent value="systems" className="mt-4">
                <Card>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[200px]">{t("myWorkAreas.table.systemName")}</TableHead>
                        <TableHead>{t("myWorkAreas.table.purpose")}</TableHead>
                        <TableHead className="w-[180px]">{t("myWorkAreas.table.dataType")}</TableHead>
                        <TableHead className="w-[140px]">{t("myWorkAreas.table.risk")}</TableHead>
                        <TableHead className="w-[180px]">{t("myWorkAreas.table.protocol")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mockSystems.map((system) => (
                        <TableRow key={system.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="text-muted-foreground">
                                {getSystemIconComponent(system.icon)}
                              </div>
                              <span className="font-medium">{system.name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {system.purpose}
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">{system.dataType}</span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className={cn(
                                "w-2 h-2 rounded-full",
                                system.risk === "low" && "bg-success",
                                system.risk === "medium" && "bg-warning",
                                system.risk === "high" && "bg-orange-500",
                                system.risk === "critical" && "bg-destructive"
                              )} />
                              <span className={getRiskColor(system.risk)}>
                                {getRiskLabel(system.risk)}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              {system.hasProtocol && (
                                <Badge variant="outline" className="text-xs w-fit bg-success/10 text-success border-success/20">
                                  {t("myWorkAreas.hasProtocol")}
                                </Badge>
                              )}
                              <Button variant="secondary" size="sm" className="text-xs">
                                <Plus className="h-3 w-3 mr-1" />
                                {t("myWorkAreas.newProtocol")}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Card>
              </TabsContent>

              <TabsContent value="protocols" className="mt-4">
                <Card className="p-8 text-center text-muted-foreground">
                  {t("myWorkAreas.comingSoon")}
                </Card>
              </TabsContent>

              <TabsContent value="processes" className="mt-4">
                <ProcessList workAreaId={selectedWorkArea.id} />
              </TabsContent>

              <TabsContent value="users" className="mt-4">
                <Card className="p-8 text-center text-muted-foreground">
                  {t("myWorkAreas.comingSoon")}
                </Card>
              </TabsContent>

              <TabsContent value="documents" className="mt-4">
                <Card className="p-8 text-center text-muted-foreground">
                  {t("myWorkAreas.comingSoon")}
                </Card>
              </TabsContent>

              <TabsContent value="settings" className="mt-4">
                <Card className="p-6">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => handleEdit(selectedWorkArea)}
                      className="gap-2"
                    >
                      <Pencil className="h-4 w-4" />
                      {t("common.edit")}
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => setDeletingWorkArea(selectedWorkArea)}
                      className="gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      {t("common.delete")}
                    </Button>
                  </div>
                </Card>
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
    </div>
  );
}
