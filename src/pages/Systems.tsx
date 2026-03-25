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
  Database,
  Trash2,
  Loader2,
  Server,
  Info,
  X,
  HelpCircle,
} from "lucide-react";
import { AddSystemDialog } from "@/components/dialogs/AddSystemDialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { AssetRowActionMenu } from "@/components/shared/AssetRowActionMenu";
import { seedDemoSystems, deleteDemoSystems } from "@/lib/demoSeedSystems";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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

const getSystemIcon = (name: string, vendor: string | null): { icon: LucideIcon; color: string } => {
  const lowerName = name.toLowerCase();
  const lowerVendor = (vendor || "").toLowerCase();

  if (lowerName.includes("microsoft") || lowerName.includes("365") || lowerVendor.includes("microsoft"))
    return { icon: Mail, color: "bg-orange-500/20 text-orange-500" };
  if (lowerName.includes("salesforce") || lowerVendor.includes("salesforce"))
    return { icon: Users, color: "bg-blue-500/20 text-blue-500" };
  if (lowerName.includes("sap") || lowerVendor.includes("sap"))
    return { icon: DollarSign, color: "bg-yellow-500/20 text-yellow-500" };
  if (lowerName.includes("slack") || lowerVendor.includes("slack"))
    return { icon: MessageSquare, color: "bg-purple-500/20 text-purple-500" };
  if (lowerName.includes("zoom") || lowerVendor.includes("zoom"))
    return { icon: Video, color: "bg-blue-400/20 text-blue-400" };
  if (lowerName.includes("visma") || lowerVendor.includes("visma"))
    return { icon: Briefcase, color: "bg-green-600/20 text-green-600" };
  if (lowerName.includes("tripletex") || lowerVendor.includes("tripletex"))
    return { icon: Calculator, color: "bg-indigo-500/20 text-indigo-500" };
  if (lowerName.includes("jira") || lowerVendor.includes("atlassian"))
    return { icon: KanbanSquare, color: "bg-blue-600/20 text-blue-600" };
  if (lowerName.includes("github") || lowerVendor.includes("github"))
    return { icon: Github, color: "bg-gray-500/20 text-gray-400" };
  if (lowerName.includes("aws") || lowerVendor.includes("amazon"))
    return { icon: Cloud, color: "bg-orange-400/20 text-orange-400" };
  if (lowerName.includes("hubspot") || lowerVendor.includes("hubspot"))
    return { icon: Megaphone, color: "bg-orange-600/20 text-orange-600" };
  if (lowerName.includes("zendesk") || lowerVendor.includes("zendesk"))
    return { icon: Headphones, color: "bg-teal-500/20 text-teal-500" };
  if (lowerName.includes("linkedin") || lowerVendor.includes("linkedin"))
    return { icon: Users, color: "bg-blue-700/20 text-blue-700" };

  return { icon: Cloud, color: "bg-primary/20 text-primary" };
};

const SYSTEM_STATUSES = [
  { value: "in_use", label: "I bruk", badgeClass: "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400" },
  { value: "evaluation", label: "Under evaluering", badgeClass: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400" },
  { value: "quarantined", label: "Karantene", badgeClass: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400" },
  { value: "phasing_out", label: "Fases ut", badgeClass: "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400" },
  { value: "archived", label: "Arkivert", badgeClass: "bg-muted text-muted-foreground" },
  { value: "rejected", label: "Avvist", badgeClass: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400" },
];

const getStatusBadge = (status: string | null) => {
  return SYSTEM_STATUSES.find((s) => s.value === status) || SYSTEM_STATUSES[0];
};

const getMaturityBadge = (score: number) => {
  if (score >= 80) return { label: `${score}% - God dekning`, className: "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400" };
  if (score >= 50) return { label: `${score}% - Under arbeid`, className: "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400" };
  return { label: `${score}% - Lav dekning`, className: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400" };
};

const getRiskLabel = (risk: string | null) => {
  switch (risk) {
    case "high": return { label: "Høy risiko", dotClass: "bg-red-500" };
    case "medium": return { label: "Moderat risiko", dotClass: "bg-blue-500" };
    case "low": return { label: "Lav risiko", dotClass: "bg-green-500" };
    default: return { label: "Ikke satt", dotClass: "bg-muted-foreground/30" };
  }
};

export default function Systems() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [nameFilter, setNameFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [ownerFilter, setOwnerFilter] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
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
      const { error } = await supabase
        .from("systems")
        .update({
          work_area_id: workAreaId,
          system_manager: workArea?.responsible_person || null,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["systems"] });
      toast.success("Eier satt");
    },
  });

  const removeOwner = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("systems")
        .update({ work_area_id: null, system_manager: null })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["systems"] });
      toast.success("Eier fjernet");
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

  // "I bruk" = has work_area_id (assigned owner). "Ikke i bruk" = no owner assigned.
  const inUseSystems = useMemo(() => systems.filter((s) => s.status !== "archived" && s.work_area_id), [systems]);
  const notInUseSystems = useMemo(() => systems.filter((s) => s.status !== "archived" && !s.work_area_id), [systems]);
  const archivedSystems = useMemo(() => systems.filter((s) => s.status === "archived"), [systems]);

  const filterSystems = (list: System[]) => {
    return list.filter((system) => {
      const matchesName = system.name.toLowerCase().includes(nameFilter.toLowerCase());
      const matchesType = !typeFilter || typeFilter === "all" || system.category?.toLowerCase().includes(typeFilter.toLowerCase());
      const matchesOwner = !ownerFilter || ownerFilter === "all" || system.work_area_id === ownerFilter;
      return matchesName && matchesType && matchesOwner;
    });
  };

  const categories = useMemo(() => {
    const cats = new Set(systems.map((s) => s.category).filter(Boolean));
    return Array.from(cats);
  }, [systems]);

  const getOwnerWorkArea = (system: System): WorkArea | undefined => {
    if (!system.work_area_id) return undefined;
    return workAreas.find((a: WorkArea) => a.id === system.work_area_id);
  };

  const renderSystemCard = (system: System) => {
    const { icon: IconComponent, color } = getSystemIcon(system.name, system.vendor);
    const maturity = getMaturityBadge(system.compliance_score || 0);
    const risk = getRiskLabel(system.risk_level);
    const ownerWa = getOwnerWorkArea(system);
    const isArchived = system.status === "archived";

    return (
      <div
        key={system.id}
        className="rounded-xl border border-border bg-card p-5 hover:shadow-md transition-shadow cursor-pointer"
        onClick={() => navigate(`/systems/${system.id}`)}
      >
        {/* Top row: icon + name + actions */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${color}`}>
              <IconComponent className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-foreground text-base">{system.name}</h3>
          </div>
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <AssetRowActionMenu
              itemId={system.id}
              currentWorkAreaId={system.work_area_id}
              isArchived={isArchived}
              workAreas={workAreas}
              onSetOwner={(itemId, waId) => assignOwner.mutate({ id: itemId, workAreaId: waId })}
              onArchive={(itemId) => archiveSystem.mutate(itemId)}
              onRestore={(itemId) => restoreSystem.mutate(itemId)}
              onDelete={(itemId) => deleteSystem.mutate(itemId)}
            />
          </div>
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Systemtype */}
          <div>
            <p className="text-xs text-muted-foreground mb-1">Systemtype</p>
            <p className="text-sm font-medium text-foreground">{system.category || "-"}</p>
          </div>

          {/* Modenhet */}
          <div>
            <p className="text-xs text-muted-foreground mb-1">Modenhet</p>
            <div className="flex items-center gap-1.5">
              <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${maturity.className}`}>
                {maturity.label}
              </span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3.5 w-3.5 text-muted-foreground/50 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Basert på dokumentasjon og kontrolldekning</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          {/* Risiko */}
          <div>
            <p className="text-xs text-muted-foreground mb-1">Risiko</p>
            <div className="flex items-center gap-2">
              <span className={`h-3 w-3 rounded-full ${risk.dotClass}`} />
              <span className="text-sm text-foreground">{risk.label}</span>
            </div>
          </div>

          {/* Eier (Arbeidsområde) */}
          <div>
            <div className="flex items-center gap-1 mb-1">
              <p className="text-xs text-muted-foreground">Eier (Arbeidsområde)</p>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3.5 w-3.5 text-blue-500 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Arbeidsområdet som eier og er ansvarlig for dette systemet</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div onClick={(e) => e.stopPropagation()}>
              {ownerWa ? (
                <div className="flex items-center gap-1 border border-border rounded-md px-2.5 py-1 bg-background max-w-[180px]">
                  <span className="text-sm text-foreground truncate">{ownerWa.name}</span>
                  <button
                    onClick={() => removeOwner.mutate(system.id)}
                    className="ml-auto shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <Select
                  value=""
                  onValueChange={(waId) => assignOwner.mutate({ id: system.id, workAreaId: waId })}
                >
                  <SelectTrigger className="h-8 text-sm max-w-[180px] bg-background">
                    <SelectValue placeholder="Ikke satt" />
                  </SelectTrigger>
                  <SelectContent>
                    {workAreas.map((area: WorkArea) => (
                      <SelectItem key={area.id} value={area.id}>
                        {area.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderCardList = (systemsList: System[]) => {
    const filtered = filterSystems(systemsList);

    if (isLoading) {
      return (
        <div className="p-8 text-center text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
          Laster systemer...
        </div>
      );
    }

    if (filtered.length === 0) {
      return (
        <div className="p-12 text-center">
          <Server className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">Ingen systemer funnet</h3>
          <p className="text-muted-foreground mb-4">Legg til systemer organisasjonen bruker for å holde oversikt.</p>
          <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Legg til system
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {filtered.map((system) => renderSystemCard(system))}
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
            <h1 className="text-xl md:text-2xl font-bold text-foreground">
              {t("systems.title", "Systemer")}
            </h1>
            <div className="flex items-center gap-2">
              <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Legg til system
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" disabled={isSeeding || isDeleting}>
                    {isSeeding || isDeleting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Database className="h-4 w-4" />
                    )}
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
              placeholder="Filtrer etter systemnavn"
              value={nameFilter}
              onChange={(e) => setNameFilter(e.target.value)}
              className="bg-background border-border"
            />
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="bg-background border-border">
                <SelectValue placeholder="Filtrer etter systemtype" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle systemtyper</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat || ""}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={ownerFilter} onValueChange={setOwnerFilter}>
              <SelectTrigger className="bg-background border-border">
                <SelectValue placeholder="Filtrer etter Eier (Arbeidsområde)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle eiere</SelectItem>
                {workAreas.map((area: WorkArea) => (
                  <SelectItem key={area.id} value={area.id}>
                    {area.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tabs: I bruk / Ikke i bruk / Arkiverte */}
          <Tabs defaultValue="in-use" className="space-y-4">
            <TabsList className="w-full sm:w-auto">
              <TabsTrigger value="in-use" className="gap-1.5">
                I bruk
                {inUseSystems.length > 0 && (
                  <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-muted-foreground/15 px-1 text-[10px] font-bold">
                    {inUseSystems.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="not-in-use" className="gap-1.5">
                Ikke i bruk
                {notInUseSystems.length > 0 && (
                  <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-muted-foreground/15 px-1 text-[10px] font-bold">
                    {notInUseSystems.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="archived" className="gap-1.5">
                Arkiverte
                {archivedSystems.length > 0 && (
                  <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-muted-foreground/15 px-1 text-[10px] font-bold">
                    {archivedSystems.length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="in-use">{renderCardList(inUseSystems)}</TabsContent>
            <TabsContent value="not-in-use">{renderCardList(notInUseSystems)}</TabsContent>
            <TabsContent value="archived">{renderCardList(archivedSystems)}</TabsContent>
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
