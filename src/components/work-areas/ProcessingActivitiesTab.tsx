import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileText,
  Plus,
  Search,
  Shield,
  Calendar,
  Server,
  CheckCircle2,
  Download,
} from "lucide-react";
import { AddProcessDialog } from "@/components/dialogs/AddProcessDialog";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface ProcessingActivitiesTabProps {
  workAreaId: string;
  workAreaName: string;
}

interface ProcessRecord {
  id: string;
  name: string;
  description: string | null;
  status: string | null;
  created_at: string | null;
  updated_at: string | null;
  system_id: string;
  systemName?: string;
  workAreaName?: string;
}

export function ProcessingActivitiesTab({ workAreaId, workAreaName }: ProcessingActivitiesTabProps) {
  const navigate = useNavigate();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [riskFilter, setRiskFilter] = useState("all");
  const [selectedRecords, setSelectedRecords] = useState<string[]>([]);

  // Fetch systems in this work area
  const { data: systems = [] } = useQuery({
    queryKey: ["wa-systems", workAreaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("systems")
        .select("id, name")
        .eq("work_area_id", workAreaId);
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch processes linked to systems in this work area
  const { data: processes = [], isLoading } = useQuery({
    queryKey: ["wa-processing-activities", workAreaId, systems],
    queryFn: async () => {
      if (systems.length === 0) return [];
      const systemIds = systems.map((s) => s.id);
      const { data, error } = await supabase
        .from("system_processes")
        .select("*")
        .in("system_id", systemIds)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []).map((p: any) => ({
        ...p,
        systemName: systems.find((s) => s.id === p.system_id)?.name || "Ukjent system",
        workAreaName,
      })) as ProcessRecord[];
    },
    enabled: systems.length > 0,
  });

  const filteredProcesses = processes.filter((p) => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      if (
        !p.name.toLowerCase().includes(term) &&
        !(p.description || "").toLowerCase().includes(term)
      )
        return false;
    }
    return true;
  });

  const toggleSelect = (id: string) => {
    setSelectedRecords((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedRecords.length === filteredProcesses.length) {
      setSelectedRecords([]);
    } else {
      setSelectedRecords(filteredProcesses.map((p) => p.id));
    }
  };

  const getRiskColor = (status: string | null) => {
    switch (status) {
      case "active":
        return "bg-success/10 text-success border-success/20";
      case "draft":
        return "bg-warning/10 text-warning border-warning/20";
      case "archived":
        return "bg-muted text-muted-foreground border-border";
      default:
        return "bg-success/10 text-success border-success/20";
    }
  };

  const getStatusLabel = (status: string | null) => {
    switch (status) {
      case "active":
        return "Aktiv";
      case "draft":
        return "Utkast";
      case "archived":
        return "Arkivert";
      default:
        return "Aktiv";
    }
  };

  return (
    <div className="space-y-4">
      {/* Actions bar */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <Checkbox
            checked={
              selectedRecords.length === filteredProcesses.length &&
              filteredProcesses.length > 0
            }
            onCheckedChange={toggleSelectAll}
          />
          <span className="text-sm text-muted-foreground">Velg alle</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={selectedRecords.length === 0}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Skriv ut valgte behandlingsaktiviteter
          </Button>
          <Button
            size="sm"
            className="gap-2"
            onClick={() => setIsAddDialogOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Legg til behandlingsaktivitet
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Søk etter tittel eller formål"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select
          value={riskFilter}
          onValueChange={setRiskFilter}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filtrer etter risikonivå" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle risikonivåer</SelectItem>
            <SelectItem value="low">Lav risiko</SelectItem>
            <SelectItem value="medium">Moderat risiko</SelectItem>
            <SelectItem value="high">Høy risiko</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Process Cards */}
      {isLoading ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">Laster behandlingsaktiviteter...</p>
        </Card>
      ) : filteredProcesses.length === 0 ? (
        <Card className="p-8 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">
            {searchTerm
              ? "Ingen treff"
              : "Ingen behandlingsaktiviteter"}
          </h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
            {searchTerm
              ? `Ingen behandlingsaktiviteter matcher søket "${searchTerm}".`
              : "Opprett en behandlingsaktivitet for å dokumentere hvordan personopplysninger håndteres i dette arbeidsområdet."}
          </p>
          {!searchTerm && (
            <Button className="gap-2" onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4" />
              Legg til behandlingsaktivitet
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProcesses.map((record) => (
            <Card
              key={record.id}
              className="p-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => navigate(`/processes/${record.id}`)}
            >
              <div className="flex items-start gap-3 mb-3">
                <Checkbox
                  checked={selectedRecords.includes(record.id)}
                  onCheckedChange={() => toggleSelect(record.id)}
                  onClick={(e) => e.stopPropagation()}
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-foreground line-clamp-2 mb-1">
                    {record.name}
                  </h4>
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {record.description || "Ingen beskrivelse"}
                  </p>
                </div>
              </div>

              <div className="space-y-2.5 text-sm">
                {/* Risk level */}
                <div className="flex items-center justify-between p-2 rounded-md bg-muted/30">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Risikonivå</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-success" />
                    <span className="text-success">Lav risiko</span>
                  </div>
                </div>

                {/* Work area */}
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Ansvarlig arbeidsområde</span>
                </div>
                <div className="flex items-center gap-2 ml-6">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  <span className="text-success">{workAreaName} som medlem</span>
                </div>

                {/* Review status */}
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Revisjonsstatus</span>
                </div>
                <div className="ml-6">
                  <Badge
                    variant="outline"
                    className="bg-success/10 text-success border-success/20 text-xs"
                  >
                    REVIDERT -{" "}
                    {record.updated_at
                      ? format(new Date(record.updated_at), "dd.MM.yyyy", { locale: nb })
                      : "Ikke revidert"}
                  </Badge>
                </div>

                {/* Linked systems */}
                <div className="flex items-center gap-2">
                  <Server className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Tilknyttede systemer</span>
                  <Badge variant="secondary" className="text-xs h-5 px-1.5">
                    1
                  </Badge>
                </div>
                <div className="flex items-center gap-2 ml-6">
                  <span className="h-2 w-2 rounded-full bg-primary" />
                  <span>{record.systemName}</span>
                </div>

                {/* Last updated */}
                <div className="pt-2 border-t border-border flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    Sist oppdatert:{" "}
                    {record.updated_at
                      ? format(new Date(record.updated_at), "dd.MM.yyyy", { locale: nb })
                      : "-"}
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <AddProcessDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        workAreaId={workAreaId}
        workAreaName={workAreaName}
        onProcessAdded={() => {
          // refetch handled by queryClient invalidation in the dialog
        }}
      />
    </div>
  );
}
