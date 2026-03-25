import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTranslation } from "react-i18next";
import { 
  Plus, 
  Mail, 
  Users, 
  DollarSign, 
  MessageSquare, 
  Video, 
  Briefcase, 
  Calculator, 
  KanbanSquare, 
  Github, 
  Cloud, 
  Megaphone, 
  Headphones,
  LucideIcon,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  MoreVertical,
  Database,
  Archive,
  UserCircle,
  MoreHorizontal,
  Trash2,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Server
} from "lucide-react";
import { AddSystemDialog } from "@/components/dialogs/AddSystemDialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { AssetRowActionMenu } from "@/components/shared/AssetRowActionMenu";
import { seedDemoSystems, deleteDemoSystems } from "@/lib/demoSeedSystems";

interface System {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  vendor: string | null;
  status: string | null;
  risk_level: string | null;
  compliance_score?: number;
  work_area_id?: string | null;
  system_manager?: string | null;
}

interface WorkArea {
  id: string;
  name: string;
  responsible_person?: string | null;
}

// Map vendor/system names to icons
const getSystemIcon = (name: string, vendor: string | null): { icon: LucideIcon; color: string } => {
  const lowerName = name.toLowerCase();
  const lowerVendor = (vendor || "").toLowerCase();
  
  if (lowerName.includes("microsoft") || lowerName.includes("365") || lowerVendor.includes("microsoft")) {
    return { icon: Mail, color: "bg-orange-500/20 text-orange-500" };
  }
  if (lowerName.includes("salesforce") || lowerVendor.includes("salesforce")) {
    return { icon: Users, color: "bg-blue-500/20 text-blue-500" };
  }
  if (lowerName.includes("sap") || lowerVendor.includes("sap")) {
    return { icon: DollarSign, color: "bg-yellow-500/20 text-yellow-500" };
  }
  if (lowerName.includes("slack") || lowerVendor.includes("slack")) {
    return { icon: MessageSquare, color: "bg-purple-500/20 text-purple-500" };
  }
  if (lowerName.includes("zoom") || lowerVendor.includes("zoom")) {
    return { icon: Video, color: "bg-blue-400/20 text-blue-400" };
  }
  if (lowerName.includes("visma") || lowerVendor.includes("visma")) {
    return { icon: Briefcase, color: "bg-green-600/20 text-green-600" };
  }
  if (lowerName.includes("tripletex") || lowerVendor.includes("tripletex")) {
    return { icon: Calculator, color: "bg-indigo-500/20 text-indigo-500" };
  }
  if (lowerName.includes("jira") || lowerVendor.includes("atlassian")) {
    return { icon: KanbanSquare, color: "bg-blue-600/20 text-blue-600" };
  }
  if (lowerName.includes("github") || lowerVendor.includes("github")) {
    return { icon: Github, color: "bg-gray-500/20 text-gray-400" };
  }
  if (lowerName.includes("aws") || lowerVendor.includes("amazon")) {
    return { icon: Cloud, color: "bg-orange-400/20 text-orange-400" };
  }
  if (lowerName.includes("hubspot") || lowerVendor.includes("hubspot")) {
    return { icon: Megaphone, color: "bg-orange-600/20 text-orange-600" };
  }
  if (lowerName.includes("zendesk") || lowerVendor.includes("zendesk")) {
    return { icon: Headphones, color: "bg-teal-500/20 text-teal-500" };
  }
  
  return { icon: Cloud, color: "bg-primary/20 text-primary" };
};

export default function Systems() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [nameFilter, setNameFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [ownerFilter, setOwnerFilter] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [isSeeding, setIsSeeding] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSeedSystems = async () => {
    setIsSeeding(true);
    try {
      const count = await seedDemoSystems();
      queryClient.invalidateQueries({ queryKey: ["systems"] });
      toast.success(`${count} demo-systemer ble lastet inn`);
    } catch (e: any) {
      toast.error(e.message || "Kunne ikke laste inn demo-systemer");
    } finally {
      setIsSeeding(false);
    }
  };

  const handleDeleteSystems = async () => {
    setIsDeleting(true);
    try {
      const count = await deleteDemoSystems();
      queryClient.invalidateQueries({ queryKey: ["systems"] });
      toast.success(`${count} demo-systemer ble fjernet`);
    } catch (e: any) {
      toast.error(e.message || "Kunne ikke fjerne demo-systemer");
    } finally {
      setIsDeleting(false);
    }
  };

  const { data: systems = [], isLoading } = useQuery({
    queryKey: ["systems"],
    queryFn: async () => {
      const { data, error } = await supabase.from("systems").select("*");
      if (error) throw error;
      return (data || []).map((system) => ({
        ...system,
        compliance_score: system.compliance_score || Math.abs(system.id.charCodeAt(0) * 7 + system.id.charCodeAt(1) * 3) % 100,
      }));
    },
  });

  const { data: workAreas = [] } = useQuery({
    queryKey: ["work_areas"],
    queryFn: async () => {
      const { data, error } = await supabase.from("work_areas").select("*");
      if (error) throw error;
      return data || [];
    },
  });

  const deleteSystem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("systems").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["systems"] });
      toast.success(t("systems.deleteSuccess"));
    },
    onError: () => {
      toast.error(t("systems.deleteError"));
    },
  });

  const assignOwner = useMutation({
    mutationFn: async ({ id, workAreaId }: { id: string; workAreaId: string }) => {
      const workArea = workAreas.find((wa: WorkArea) => wa.id === workAreaId);
      const { error } = await supabase.from("systems").update({ 
        work_area_id: workAreaId,
        system_manager: workArea?.responsible_person || null 
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["systems"] });
      toast.success("Eier satt");
    },
  });

  const archiveSystem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("systems").update({ status: "archived" }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["systems"] });
      toast.success("System arkivert");
    },
  });

  const restoreSystem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("systems").update({ status: "active" }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["systems"] });
      toast.success("System gjenopprettet");
    },
  });

  const activeSystems = useMemo(() => systems.filter(s => s.status !== "archived"), [systems]);
  const archivedSystems = useMemo(() => systems.filter(s => s.status === "archived"), [systems]);

  const filterSystems = (list: System[]) => {
    let result = list.filter((system) => {
      const matchesName = system.name.toLowerCase().includes(nameFilter.toLowerCase());
      const matchesType = !typeFilter || typeFilter === "all" || system.category?.toLowerCase().includes(typeFilter.toLowerCase());
      const matchesOwner = !ownerFilter || ownerFilter === "all" || system.work_area_id === ownerFilter;
      return matchesName && matchesType && matchesOwner;
    });

    if (sortColumn) {
      result = [...result].sort((a, b) => {
        let aValue: string | number = "";
        let bValue: string | number = "";
        switch (sortColumn) {
          case "name": aValue = a.name.toLowerCase(); bValue = b.name.toLowerCase(); break;
          case "type": aValue = (a.category || "").toLowerCase(); bValue = (b.category || "").toLowerCase(); break;
          case "vendor": aValue = (a.vendor || "").toLowerCase(); bValue = (b.vendor || "").toLowerCase(); break;
          case "compliance": aValue = a.compliance_score || 0; bValue = b.compliance_score || 0; break;
        }
        if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
        if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
        return 0;
      });
    }

    return result;
  };

  const categories = useMemo(() => {
    const cats = new Set(systems.map((s) => s.category).filter(Boolean));
    return Array.from(cats);
  }, [systems]);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const SortIcon = ({ column }: { column: string }) => {
    if (sortColumn !== column) return <ArrowUpDown className="h-3.5 w-3.5 ml-1 opacity-50" />;
    return sortDirection === "asc" ? <ArrowUp className="h-3.5 w-3.5 ml-1" /> : <ArrowDown className="h-3.5 w-3.5 ml-1" />;
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "active": return { label: "Aktiv", className: "bg-green-500/20 text-green-600 border-green-500/30" };
      case "under_review": return { label: "Under vurdering", className: "bg-yellow-500/20 text-yellow-600 border-yellow-500/30" };
      case "archived": return { label: "Arkivert", className: "bg-muted text-muted-foreground border-border" };
      default: return { label: status || "Aktiv", className: "bg-green-500/20 text-green-600 border-green-500/30" };
    }
  };

  const getOwnerName = (system: System) => {
    if (system.system_manager) return system.system_manager;
    if (system.work_area_id) {
      const wa = workAreas.find((a: WorkArea) => a.id === system.work_area_id);
      return wa?.name || null;
    }
    return null;
  };

  const renderSystemRow = (system: System, showRestore = false) => {
    const { icon: IconComponent, color } = getSystemIcon(system.name, system.vendor);
    const statusBadge = getStatusBadge(system.status);
    const ownerName = getOwnerName(system);

    return (
      <div
        key={system.id}
        onClick={() => navigate(`/systems/${system.id}`)}
        className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_60px] gap-4 px-4 py-3 border-t border-border items-center hover:bg-muted/30 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${color}`}>
            <IconComponent className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <span className="text-foreground font-medium block truncate">{system.name}</span>
            {system.description && (
              <span className="text-xs text-muted-foreground truncate block">{system.description}</span>
            )}
          </div>
        </div>

        <div className="text-muted-foreground text-sm">{system.category || "-"}</div>

        <div className="text-muted-foreground text-sm">{system.vendor || "-"}</div>

        <div className="text-sm">
          {ownerName ? (
            <span className="text-foreground">{ownerName}</span>
          ) : (
            <span className="text-muted-foreground/50 italic text-xs">Ikke satt</span>
          )}
        </div>

        <div>
          <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium border ${statusBadge.className}`}>
            {statusBadge.label}
          </span>
        </div>

        <div className="flex items-center justify-end">
          <AssetRowActionMenu
            itemId={system.id}
            currentWorkAreaId={system.work_area_id}
            isArchived={showRestore}
            workAreas={workAreas}
            onSetOwner={(itemId, waId) => assignOwner.mutate({ id: itemId, workAreaId: waId })}
            onArchive={(itemId) => archiveSystem.mutate(itemId)}
            onRestore={(itemId) => restoreSystem.mutate(itemId)}
            onDelete={(itemId) => deleteSystem.mutate(itemId)}
          />
        </div>
      </div>
    );
  };

  const renderTable = (systemsList: System[], showRestore = false) => {
    const filtered = filterSystems(systemsList);
    
    return (
      <div className="rounded-lg border border-border overflow-hidden">
        <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_60px] gap-4 px-4 py-3 bg-muted/30 text-sm font-medium text-muted-foreground">
          <button onClick={() => handleSort("name")} className="flex items-center hover:text-foreground transition-colors text-left">
            {t("systems.system", "System")}
            <SortIcon column="name" />
          </button>
          <button onClick={() => handleSort("type")} className="flex items-center hover:text-foreground transition-colors text-left">
            {t("systems.type", "Kategori")}
            <SortIcon column="type" />
          </button>
          <button onClick={() => handleSort("vendor")} className="flex items-center hover:text-foreground transition-colors text-left">
            {t("systems.vendor", "Leverandør")}
            <SortIcon column="vendor" />
          </button>
          <div>{t("systems.owner", "Eier")}</div>
          <div>{t("systems.status", "Status")}</div>
          <div></div>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
            Laster systemer...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Server className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              {showRestore ? "Ingen arkiverte systemer" : t("systems.noSystems", "Ingen systemer funnet")}
            </h3>
            {!showRestore && (
              <p className="text-muted-foreground mb-4">Legg til systemer organisasjonen bruker for å holde oversikt.</p>
            )}
            {!showRestore && (
              <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                {t("systems.addSystem", "Legg til system")}
              </Button>
            )}
          </div>
        ) : (
          filtered.map((system) => renderSystemRow(system, showRestore))
        )}
      </div>
    );
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto pt-16 md:pt-0">
        <div className="container max-w-7xl mx-auto p-4 md:p-6 space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h1 className="text-xl md:text-2xl font-bold text-primary">
              {t("systems.title", "Systemer")}
            </h1>
            <div className="flex items-center gap-2">
              <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                {t("systems.addSystem", "Legg til system")}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" disabled={isSeeding || isDeleting}>
                    {(isSeeding || isDeleting) ? <Loader2 className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />}
                    Demo-data
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleSeedSystems} disabled={isSeeding}>
                    <Database className="h-4 w-4 mr-2" />
                    Last inn demo-systemer
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDeleteSystems} disabled={isDeleting} className="text-destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Fjern demo-systemer
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              placeholder={t("systems.filterByName", "Filtrer etter systemnavn")}
              value={nameFilter}
              onChange={(e) => setNameFilter(e.target.value)}
              className="bg-muted/50 border-border"
            />
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="bg-muted/50 border-border">
                <SelectValue placeholder={t("systems.filterByType", "Filtrer etter kategori")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("systems.allTypes", "Alle kategorier")}</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat || ""}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={ownerFilter} onValueChange={setOwnerFilter}>
              <SelectTrigger className="bg-muted/50 border-border">
                <SelectValue placeholder={t("systems.filterByOwner", "Filtrer etter eier")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("systems.allOwners", "Alle eiere")}</SelectItem>
                {workAreas.map((area: WorkArea) => (
                  <SelectItem key={area.id} value={area.id}>{area.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="active" className="space-y-4">
            <TabsList className="w-full sm:w-auto">
              <TabsTrigger value="active" className="gap-1.5">
                <CheckCircle2 className="h-4 w-4" />
                Aktive
                {activeSystems.length > 0 && (
                  <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-muted-foreground/15 px-1 text-[10px] font-bold">
                    {activeSystems.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="archived" className="gap-1.5">
                <Archive className="h-4 w-4" />
                Arkiverte
                {archivedSystems.length > 0 && (
                  <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-muted-foreground/15 px-1 text-[10px] font-bold">
                    {archivedSystems.length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="active">
              {renderTable(activeSystems)}
            </TabsContent>

            <TabsContent value="archived">
              {renderTable(archivedSystems, true)}
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <AddSystemDialog 
        open={isAddDialogOpen} 
        onOpenChange={setIsAddDialogOpen} 
        onSystemAdded={() => queryClient.invalidateQueries({ queryKey: ["systems"] })}
      />
    </div>
  );
}
