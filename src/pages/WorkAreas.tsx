import { useState, useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AddWorkAreaDialog } from "@/components/dialogs/AddWorkAreaDialog";
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
  Grid3x3
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

  useEffect(() => {
    fetchWorkAreas();
  }, []);

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

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-6 py-8 max-w-7xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {t("myWorkAreas.title")} ({workAreas.length})
              </h1>
              <p className="text-muted-foreground mt-1">
                {t("myWorkAreas.subtitle")}
              </p>
            </div>
          </div>

          {/* Filter Button */}
          <div className="mb-4">
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="h-4 w-4" />
              {t("myWorkAreas.filter")}
            </Button>
          </div>

          {/* Work Area Chips */}
          <div className="flex flex-wrap gap-2 mb-4">
            {displayedAreas.map((area, index) => (
              <button
                key={area.id}
                onClick={() => setSelectedWorkArea(area)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                  selectedWorkArea?.id === area.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-card border border-border hover:border-primary/50 text-foreground"
                )}
              >
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  workAreaColors[index % workAreaColors.length]
                )} />
                <span className="truncate max-w-[120px]">{area.name}</span>
                <span className="text-xs opacity-70">
                  <Server className="h-3 w-3 inline mr-1" />
                  10 {t("myWorkAreas.systemsShort")}
                </span>
              </button>
            ))}
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setIsAddDialogOpen(true)}
              className="gap-1"
            >
              <Plus className="h-4 w-4" />
              {t("myWorkAreas.addNew")}
            </Button>
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
            <Card className="p-6 mb-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Shield className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-foreground">{selectedWorkArea.name}</h2>
                    <p className="text-sm text-muted-foreground">
                      {t("myWorkAreas.manager")}: {selectedWorkArea.responsible_person || t("myWorkAreas.notAssigned")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <FileText className="h-4 w-4" />
                    <span>2 {t("myWorkAreas.processes").toLowerCase()}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <UsersIcon className="h-4 w-4" />
                    <span>0 {t("myWorkAreas.users").toLowerCase()}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Server className="h-4 w-4" />
                    <span>10 {t("myWorkAreas.systems").toLowerCase()}</span>
                  </div>
                </div>
              </div>

              {selectedWorkArea.description && (
                <p className="text-sm text-muted-foreground mb-4">{selectedWorkArea.description}</p>
              )}

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">{t("myWorkAreas.risk")}</span>
                  <Info className="h-4 w-4 text-muted-foreground" />
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
                  <span className="text-sm font-medium text-warning">{t("myWorkAreas.riskMedium")}</span>
                </div>
                <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
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
              <TabsList className="w-full justify-start border-b border-border rounded-none h-auto p-0 bg-transparent">
                <TabsTrigger 
                  value="systems" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3 gap-2"
                >
                  <Grid3x3 className="h-4 w-4" />
                  {t("myWorkAreas.tabs.systems")}
                  <Badge variant="secondary" className="ml-1">10</Badge>
                </TabsTrigger>
                <TabsTrigger 
                  value="protocols" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3 gap-2"
                >
                  <FileText className="h-4 w-4" />
                  {t("myWorkAreas.tabs.protocols")}
                  <Badge variant="secondary" className="ml-1">28</Badge>
                </TabsTrigger>
                <TabsTrigger 
                  value="processes" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3 gap-2"
                >
                  <FileText className="h-4 w-4" />
                  {t("myWorkAreas.tabs.processes")}
                  <Badge variant="secondary" className="ml-1">110</Badge>
                </TabsTrigger>
                <TabsTrigger 
                  value="users" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3 gap-2"
                >
                  <UsersIcon className="h-4 w-4" />
                  {t("myWorkAreas.tabs.users")}
                  <Badge variant="secondary" className="ml-1">0</Badge>
                </TabsTrigger>
                <TabsTrigger 
                  value="documents" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3 gap-2"
                >
                  <FileText className="h-4 w-4" />
                  {t("myWorkAreas.tabs.documents")}
                  <Badge variant="secondary" className="ml-1">5</Badge>
                </TabsTrigger>
                <TabsTrigger 
                  value="settings" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3 gap-2"
                >
                  <Settings className="h-4 w-4" />
                  {t("myWorkAreas.tabs.settings")}
                </TabsTrigger>
              </TabsList>

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
                <Card className="p-8 text-center text-muted-foreground">
                  {t("myWorkAreas.comingSoon")}
                </Card>
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

          {/* Empty State */}
          {!isLoading && workAreas.length === 0 && (
            <Card className="p-12 text-center">
              <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">{t("workAreas.noWorkAreas")}</h3>
              <p className="text-muted-foreground mb-4">
                {t("workAreas.noWorkAreasDesc")}
              </p>
              <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                {t("workAreas.addNew")}
              </Button>
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
