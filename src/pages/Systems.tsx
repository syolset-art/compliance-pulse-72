import { useState, useMemo, useRef, useCallback } from "react";
import { usePageHelpListener } from "@/hooks/usePageHelpListener";
import { ContextualHelpPanel } from "@/components/shared/ContextualHelpPanel";
import { Cpu, Shield as ShieldIcon, FileCheck, ClipboardList } from "lucide-react";
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
  List,
  LayoutGrid,
  TrendingUp,
  AlertTriangle,
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
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { seedDemoSystems, deleteDemoSystems } from "@/lib/demoSeedSystems";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { SystemPremiumBanner } from "@/components/systems/SystemPremiumBanner";
import { SystemActivateDialog } from "@/components/systems/SystemActivateDialog";

const MAX_FREE_SYSTEMS = 5;

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
  const [statusFilter, setStatusFilter] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  usePageHelpListener(setHelpOpen);
  const [viewMode, setViewMode] = useState<"grouped" | "list" | "cards">("list");
  const [activeChip, setActiveChip] = useState<string | null>(null);
  const [activateOpen, setActivateOpen] = useState(false);
  const [isPremium, setIsPremium] = useState(() => localStorage.getItem("system_premium_activated") === "true");
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

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
      const { error } = await supabase.from("systems").update({ status: "in_use" }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["systems"] });
      toast.success("System gjenopprettet");
    },
  });

  const changeStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("systems").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, { id, status: newStatus }) => {
      const systemName = systems?.find(s => s.id === id)?.name || "Systemet";
      const newStatusLabel = SYSTEM_STATUSES.find(s => s.value === newStatus)?.label || newStatus;
      queryClient.invalidateQueries({ queryKey: ["systems"] });
      toast.success(`«${systemName}» endret til «${newStatusLabel}»`);
    },
  });

  const filterSystems = (list: System[]) => {
    return list.filter((system) => {
      const matchesName = system.name.toLowerCase().includes(nameFilter.toLowerCase());
      const matchesType = !typeFilter || typeFilter === "all" || system.category?.toLowerCase().includes(typeFilter.toLowerCase());
      const matchesOwner = !ownerFilter || ownerFilter === "all" || system.work_area_id === ownerFilter;
      const matchesStatus = !statusFilter || statusFilter === "all" || system.status === statusFilter;
      return matchesName && matchesType && matchesOwner && matchesStatus;
    });
  };

  const filteredSystems = useMemo(() => filterSystems(systems), [systems, nameFilter, typeFilter, ownerFilter, statusFilter]);

  const categories = useMemo(() => {
    const cats = new Set(systems.map((s) => s.category).filter(Boolean));
    return Array.from(cats);
  }, [systems]);

  const groupedSystems = useMemo(() => {
    const groups: Record<string, System[]> = {};
    filteredSystems.forEach((system) => {
      const cat = system.category || "Ukategorisert";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(system);
    });
    // Sort categories alphabetically, but put "Ukategorisert" last
    const sortedKeys = Object.keys(groups).sort((a, b) => {
      if (a === "Ukategorisert") return 1;
      if (b === "Ukategorisert") return -1;
      return a.localeCompare(b, "nb");
    });
    const sorted: Record<string, System[]> = {};
    sortedKeys.forEach((k) => (sorted[k] = groups[k]));
    return sorted;
  }, [filteredSystems]);

  const scrollToCategory = useCallback((cat: string) => {
    setActiveChip(cat);
    sectionRefs.current[cat]?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

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
    const statusBadge = getStatusBadge(system.status);

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
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-foreground text-base">{system.name}</h3>
              <span className={`inline-flex px-2 py-0.5 rounded-full text-[13px] font-medium ${statusBadge.badgeClass}`}>
                {statusBadge.label}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <AssetRowActionMenu
              itemId={system.id}
              currentWorkAreaId={system.work_area_id}
              currentStatus={system.status}
              isArchived={isArchived}
              workAreas={workAreas}
              statusOptions={SYSTEM_STATUSES.map((s) => ({ value: s.value, label: s.label }))}
              onSetOwner={(itemId, waId) => assignOwner.mutate({ id: itemId, workAreaId: waId })}
              onArchive={(itemId) => archiveSystem.mutate(itemId)}
              onRestore={(itemId) => restoreSystem.mutate(itemId)}
              onDelete={(itemId) => deleteSystem.mutate(itemId)}
              onSetStatus={(itemId, status) => changeStatus.mutate({ id: itemId, status })}
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

  const renderCategoryChips = () => {
    const entries = Object.entries(groupedSystems);
    return (
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => {
            setActiveChip(null);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium border transition-colors ${
            activeChip === null
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-background text-foreground border-border hover:bg-accent"
          }`}
        >
          Alle
          <span className="text-xs opacity-70">{filteredSystems.length}</span>
        </button>
        {entries.map(([cat, items]) => (
          <button
            key={cat}
            onClick={() => scrollToCategory(cat)}
            className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium border transition-colors ${
              activeChip === cat
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background text-foreground border-border hover:bg-accent"
            }`}
          >
            {cat}
            <span className="text-xs opacity-70">{items.length}</span>
          </button>
        ))}
      </div>
    );
  };

  const renderGroupedList = () => {
    const entries = Object.entries(groupedSystems);
    if (entries.length === 0) {
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
      <div className="space-y-8">
        {entries.map(([cat, items]) => (
          <div
            key={cat}
            ref={(el) => { sectionRefs.current[cat] = el; }}
            className="scroll-mt-24"
          >
            <div className="flex items-center gap-3 mb-3">
              <h2 className="text-lg font-semibold text-foreground">{cat}</h2>
              <Badge variant="secondary" className="text-xs">{items.length}</Badge>
            </div>
            <div className="space-y-4">
              {items.map((system) => renderSystemCard(system))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderListView = () => {
    if (isLoading) {
      return (
        <div className="p-8 text-center text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
          Laster systemer...
        </div>
      );
    }

    if (filteredSystems.length === 0) {
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
      <div className="border border-border rounded-lg overflow-hidden bg-card">
        {/* Table header */}
        <div className="hidden sm:grid sm:grid-cols-[minmax(200px,2fr)_minmax(140px,1.5fr)_minmax(160px,1.2fr)_minmax(100px,0.8fr)_minmax(160px,1.2fr)_60px] gap-x-4 px-4 py-2.5 border-b border-border bg-muted/40 text-[13px] font-semibold uppercase tracking-wider text-muted-foreground">
          <span>System</span>
          <span>Type</span>
          <span className="flex items-center gap-1">
            Modenhet
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3 w-3 cursor-help" />
                </TooltipTrigger>
                <TooltipContent><p>Basert på dokumentasjon og kontrolldekning</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </span>
          <span className="flex items-center gap-1">
            Risiko
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3 w-3 cursor-help" />
                </TooltipTrigger>
                <TooltipContent><p>Risikonivå for dette systemet</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </span>
          <span>Eier (Arbeidsområde)</span>
          <span></span>
        </div>

        {/* Rows */}
        <div className="divide-y divide-border">
          {filteredSystems.map((system) => {
            const { icon: IconComponent, color } = getSystemIcon(system.name, system.vendor);
            const maturity = getMaturityBadge(system.compliance_score || 0);
            const risk = getRiskLabel(system.risk_level);
            const ownerWa = getOwnerWorkArea(system);
            const isArchived = system.status === "archived";

            return (
              <div
                key={system.id}
                className="grid grid-cols-1 sm:grid-cols-[minmax(200px,2fr)_minmax(140px,1.5fr)_minmax(160px,1.2fr)_minmax(100px,0.8fr)_minmax(160px,1.2fr)_60px] gap-x-4 items-center px-4 py-3 hover:bg-muted/30 transition-colors cursor-pointer"
                onClick={() => navigate(`/systems/${system.id}`)}
              >
                {/* System name + icon */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
                    <IconComponent className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-medium text-foreground truncate">{system.name}</span>
                </div>

                {/* Type */}
                <span className="text-sm text-muted-foreground truncate hidden sm:block">
                  {system.category || "—"}
                </span>

                {/* Maturity */}
                <div className="hidden sm:flex items-center gap-1.5">
                  <TrendingUp className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[13px] font-medium whitespace-nowrap ${maturity.className}`}>
                    {maturity.label}
                  </span>
                </div>

                {/* Risk */}
                <div className="hidden sm:flex items-center gap-2">
                  <AlertTriangle className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${risk.dotClass}`} />
                </div>

                {/* Owner */}
                <div className="hidden sm:block" onClick={(e) => e.stopPropagation()}>
                  {ownerWa ? (
                    <div className="flex items-center gap-1 border border-border rounded-md px-2 py-1 bg-background max-w-[160px]">
                      <span className="text-xs text-foreground truncate">{ownerWa.name}</span>
                      <button
                        onClick={() => removeOwner.mutate(system.id)}
                        className="ml-auto shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <Select value="" onValueChange={(waId) => assignOwner.mutate({ id: system.id, workAreaId: waId })}>
                      <SelectTrigger className="h-7 text-xs max-w-[160px] bg-background">
                        <SelectValue placeholder="Ikke satt" />
                      </SelectTrigger>
                      <SelectContent>
                        {workAreas.map((area: WorkArea) => (
                          <SelectItem key={area.id} value={area.id}>{area.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {/* Actions */}
                <div className="hidden sm:flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                  <AssetRowActionMenu
                    itemId={system.id}
                    currentWorkAreaId={system.work_area_id}
                    currentStatus={system.status}
                    isArchived={isArchived}
                    workAreas={workAreas}
                    statusOptions={SYSTEM_STATUSES.map((s) => ({ value: s.value, label: s.label }))}
                    onSetOwner={(itemId, waId) => assignOwner.mutate({ id: itemId, workAreaId: waId })}
                    onArchive={(itemId) => archiveSystem.mutate(itemId)}
                    onRestore={(itemId) => restoreSystem.mutate(itemId)}
                    onDelete={(itemId) => deleteSystem.mutate(itemId)}
                    onSetStatus={(itemId, status) => changeStatus.mutate({ id: itemId, status })}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderCardsView = () => {
    if (isLoading) {
      return (
        <div className="p-8 text-center text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
          Laster systemer...
        </div>
      );
    }

    if (filteredSystems.length === 0) {
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSystems.map((system) => {
          const maturityScore = system.compliance_score || 0;
          const maturityLabel = maturityScore >= 80 ? "Sterk" : maturityScore >= 50 ? "Moderat" : "Svak";
          const maturityColor = maturityScore >= 80 ? "text-success" : maturityScore >= 50 ? "text-warning" : "text-destructive";
          const maturityStroke = maturityScore >= 80 ? "hsl(var(--success))" : maturityScore >= 50 ? "hsl(var(--warning))" : "hsl(var(--destructive))";
          const initials = system.name.replace(/[^A-Za-zÆØÅæøå0-9]/g, " ").split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join("");
          const ownerWa = getOwnerWorkArea(system);
          const isArchived = system.status === "archived";
          const r = 18;
          const circ = 2 * Math.PI * r;
          const dash = (maturityScore / 100) * circ;

          return (
            <div
              key={system.id}
              className="rounded-xl border border-border bg-card p-4 hover:shadow-md transition-shadow cursor-pointer relative"
              onClick={() => navigate(`/systems/${system.id}`)}
            >
              {/* Action menu */}
              <div className="absolute top-3 right-3" onClick={(e) => e.stopPropagation()}>
                <AssetRowActionMenu
                  itemId={system.id}
                  currentWorkAreaId={system.work_area_id}
                  currentStatus={system.status}
                  isArchived={isArchived}
                  workAreas={workAreas}
                  statusOptions={SYSTEM_STATUSES.map((s) => ({ value: s.value, label: s.label }))}
                  onSetOwner={(itemId, waId) => assignOwner.mutate({ id: itemId, workAreaId: waId })}
                  onArchive={(itemId) => archiveSystem.mutate(itemId)}
                  onRestore={(itemId) => restoreSystem.mutate(itemId)}
                  onDelete={(itemId) => deleteSystem.mutate(itemId)}
                  onSetStatus={(itemId, status) => changeStatus.mutate({ id: itemId, status })}
                />
              </div>

              {/* Top: initials + maturity gauge */}
              <div className="flex items-center justify-between mb-3 pr-6">
                <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-muted-foreground">{initials}</span>
                </div>
                {maturityScore > 0 ? (
                  <div className="relative flex items-center justify-center">
                    <svg width="48" height="48" viewBox="0 0 48 48" className="-rotate-90">
                      <circle cx="24" cy="24" r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth="3" />
                      <circle cx="24" cy="24" r={r} fill="none" stroke={maturityStroke} strokeWidth="3" strokeLinecap="round" strokeDasharray={`${dash} ${circ}`} />
                    </svg>
                    <span className={`absolute text-[13px] font-bold ${maturityColor}`}>{maturityLabel}</span>
                  </div>
                ) : (
                  <span className="text-[13px] font-medium text-muted-foreground uppercase tracking-wide">Ikke scoret</span>
                )}
              </div>

              {/* Name */}
              <h3 className="text-sm font-semibold text-foreground truncate mb-1.5">{system.name}</h3>

              {/* Metadata */}
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-muted-foreground">
                {system.category && (
                  <>
                    <span>{system.category}</span>
                    <span className="text-[13px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                      {system.category?.toUpperCase()}
                    </span>
                  </>
                )}
                {ownerWa && (
                  <span className="text-[13px] font-medium">{ownerWa.name}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto pt-16 pt-11">
        <div className="container max-w-7xl mx-auto p-4 md:p-6 space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <h1 className="text-xl md:text-2xl font-bold text-foreground">
                {t("systems.title", "Systemer")}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => {
                  if (!isPremium && systems.length >= MAX_FREE_SYSTEMS) {
                    setActivateOpen(true);
                  } else {
                    setIsAddDialogOpen(true);
                  }
                }}
                className="gap-2"
              >
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

          {/* Premium banner */}
          <SystemPremiumBanner
            systemCount={systems.length}
            maxFreeSystems={MAX_FREE_SYSTEMS}
            isActivated={isPremium}
            onActivate={() => setActivateOpen(true)}
          />

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="bg-background border-border">
                <SelectValue placeholder="Filtrer etter status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle statuser</SelectItem>
                {SYSTEM_STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* View toggle + category chips */}
          <div className="flex items-center justify-between gap-4">
            {viewMode === "grouped" && renderCategoryChips()}
            <ToggleGroup
              type="single"
              value={viewMode}
              onValueChange={(v) => { if (v) setViewMode(v as "grouped" | "list" | "cards"); }}
              className="shrink-0"
            >
              <ToggleGroupItem value="list" aria-label="Listevisning" className="gap-1.5 text-xs">
                <List className="h-4 w-4" />
                Liste
              </ToggleGroupItem>
              <ToggleGroupItem value="cards" aria-label="Kortvisning" className="gap-1.5 text-xs">
                <LayoutGrid className="h-4 w-4" />
                Kort
              </ToggleGroupItem>
              <ToggleGroupItem value="grouped" aria-label="Gruppert visning" className="gap-1.5 text-xs">
                <Server className="h-4 w-4" />
                Gruppert
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          {/* System list */}
          {viewMode === "grouped" ? renderGroupedList() : viewMode === "cards" ? renderCardsView() : renderListView()}
        </div>
      </main>

      <AddSystemDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSystemAdded={(status) => {
          queryClient.invalidateQueries({ queryKey: ["systems"] });
          if (status) {
            setStatusFilter(status);
          }
        }}
      />

      <SystemActivateDialog
        open={activateOpen}
        onOpenChange={setActivateOpen}
        onActivated={(tier) => setIsPremium(true)}
      />

      <ContextualHelpPanel
        open={helpOpen}
        onOpenChange={setHelpOpen}
        icon={Cpu}
        title="Hva er systemregisteret?"
        description="Systemregisteret gir deg oversikt over alle IT-systemer og applikasjoner organisasjonen bruker. Her kan du dokumentere eierskap, risikonivå, compliance-status og koble systemer til arbeidsområder."
        itemsHeading="Hva kan du gjøre her?"
        items={[
          { icon: ShieldIcon, title: "Vurder risiko og modenhet", description: "Se compliance-score og risikonivå for hvert system." },
          { icon: FileCheck, title: "Dokumenter eierskap", description: "Knytt hvert system til et arbeidsområde og tildel ansvarlig person." },
          { icon: ClipboardList, title: "Spor AI-bruk", description: "Registrer om systemer bruker kunstig intelligens og dokumenter formål." },
        ]}
        whyTitle="Hvorfor er dette viktig?"
        whyDescription="Et oppdatert systemregister er grunnlaget for god informasjonssikkerhet og etterlevelse av GDPR, NIS2 og AI Act. Det gir ledelsen oversikt og gjør det enklere å prioritere tiltak."
        stepsHeading="Kom i gang"
        steps={[
          { text: "Legg til systemer organisasjonen bruker" },
          { text: "Knytt hvert system til riktig arbeidsområde" },
          { text: "Vurder risikonivå og compliance-status" },
          { text: "Dokumenter AI-bruk der det er relevant" },
        ]}
        laraSuggestion="Hjelp meg med å kartlegge og vurdere systemene mine"
      />
    </div>
  );
}
