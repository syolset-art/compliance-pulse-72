import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTranslation } from "react-i18next";
import { HelpCircle, Trash2, X, Plus } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { AddSystemDialog } from "@/components/dialogs/AddSystemDialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

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
}

interface WorkArea {
  id: string;
  name: string;
}

export default function Systems() {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();
  
  const [nameFilter, setNameFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [ownerFilter, setOwnerFilter] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  // Fetch systems
  const { data: systems = [], isLoading } = useQuery({
    queryKey: ["systems"],
    queryFn: async () => {
      const { data, error } = await supabase.from("systems").select("*");
      if (error) throw error;
      // Add mock compliance scores for demo
      return (data || []).map((system) => ({
        ...system,
        compliance_score: Math.floor(Math.random() * 100),
        work_area_id: null,
      }));
    },
  });

  // Fetch work areas for the owner dropdown
  const { data: workAreas = [] } = useQuery({
    queryKey: ["work_areas"],
    queryFn: async () => {
      const { data, error } = await supabase.from("work_areas").select("*");
      if (error) throw error;
      return data || [];
    },
  });

  // Delete system mutation
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

  // Filter systems
  const filteredSystems = useMemo(() => {
    return systems.filter((system) => {
      const matchesName = system.name.toLowerCase().includes(nameFilter.toLowerCase());
      const matchesType = !typeFilter || system.category?.toLowerCase().includes(typeFilter.toLowerCase());
      const matchesOwner = !ownerFilter || ownerFilter === "all";
      return matchesName && matchesType && matchesOwner;
    });
  }, [systems, nameFilter, typeFilter, ownerFilter]);

  // Get unique categories for filter
  const categories = useMemo(() => {
    const cats = new Set(systems.map((s) => s.category).filter(Boolean));
    return Array.from(cats);
  }, [systems]);

  const getComplianceLabel = (score: number) => {
    if (score >= 85) return { label: `${score}% - Samsvar`, color: "bg-green-500/20 text-green-400 border-green-500/30" };
    if (score >= 50) return { label: `${score}% - Delvis`, color: "bg-blue-500/20 text-blue-400 border-blue-500/30" };
    return { label: `${score}% - Lav`, color: "bg-red-500/20 text-red-400 border-red-500/30" };
  };

  const getRiskIndicator = (score: number) => {
    if (score >= 85) return "bg-green-500";
    if (score >= 50) return "bg-blue-500";
    if (score >= 25) return "bg-orange-500";
    return "bg-red-500";
  };

  return (
    <div className="flex min-h-screen bg-background">
      {!isMobile && <Sidebar />}
      {isMobile && <Sidebar />}
      
      <main className="flex-1 p-6 overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-primary">{t("systems.title")}</h1>
          <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            {t("systems.addSystem")}
          </Button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Input
            placeholder={t("systems.filterByName")}
            value={nameFilter}
            onChange={(e) => setNameFilter(e.target.value)}
            className="bg-muted/50 border-border"
          />
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="bg-muted/50 border-border">
              <SelectValue placeholder={t("systems.filterByType")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("systems.allTypes")}</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat || ""}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={ownerFilter} onValueChange={setOwnerFilter}>
            <SelectTrigger className="bg-muted/50 border-border">
              <SelectValue placeholder={t("systems.filterByOwner")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("systems.allOwners")}</SelectItem>
              {workAreas.map((area: WorkArea) => (
                <SelectItem key={area.id} value={area.id}>
                  {area.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="rounded-lg border border-border overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-[2fr_2fr_1fr_80px_2fr_100px] gap-4 px-4 py-3 bg-muted/30 text-sm font-medium text-muted-foreground">
            <div>{t("systems.system")}</div>
            <div>{t("systems.type")}</div>
            <div className="flex items-center gap-1">
              {t("systems.compliance")}
              <HelpCircle className="h-3.5 w-3.5" />
            </div>
            <div>{t("systems.risk")}</div>
            <div>{t("systems.owner")}</div>
            <div></div>
          </div>

          {/* Table Body */}
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">
              {t("common.loading")}
            </div>
          ) : filteredSystems.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              {t("systems.noSystems")}
            </div>
          ) : (
            filteredSystems.map((system) => {
              const compliance = getComplianceLabel(system.compliance_score || 0);
              const riskColor = getRiskIndicator(system.compliance_score || 0);

              return (
                <div
                  key={system.id}
                  className="grid grid-cols-[2fr_2fr_1fr_80px_2fr_100px] gap-4 px-4 py-3 border-t border-border items-center hover:bg-muted/20 transition-colors"
                >
                  {/* System Name with Icon */}
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary font-semibold text-xs">
                      {system.name.substring(0, 2).toUpperCase()}
                    </div>
                    <span className="text-foreground font-medium">{system.name}</span>
                  </div>

                  {/* Type */}
                  <div className="text-muted-foreground">{system.category || "-"}</div>

                  {/* Compliance Badge */}
                  <div>
                    <span className={`inline-flex px-2 py-1 rounded text-xs font-medium border ${compliance.color}`}>
                      {compliance.label}
                    </span>
                  </div>

                  {/* Risk Indicator */}
                  <div className="flex justify-center">
                    <div className={`h-3 w-3 rounded-full ${riskColor}`} />
                  </div>

                  {/* Owner Dropdown */}
                  <div>
                    <Select defaultValue="none">
                      <SelectTrigger className="bg-muted/30 border-border h-8 text-sm">
                        <SelectValue placeholder={t("systems.notSet")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">{t("systems.notSet")}</SelectItem>
                        {workAreas.map((area: WorkArea) => (
                          <SelectItem key={area.id} value={area.id}>
                            {area.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 justify-end">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                      <HelpCircle className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => deleteSystem.mutate(system.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })
          )}
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
