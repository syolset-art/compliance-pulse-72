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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  FileText,
  Plus,
  Search,
  Shield,
  Calendar,
  Server,
  CheckCircle2,
  Download,
  LayoutGrid,
  List,
  AlertTriangle,
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
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");

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

  // Simulated risk for demo purposes
  const getRiskInfo = (record: ProcessRecord) => {
    const hash = record.id.charCodeAt(0) % 3;
    if (hash === 0) return { label: "Lav risiko", dotClass: "bg-emerald-500", textClass: "text-emerald-600" };
    if (hash === 1) return { label: "Moderat risiko", dotClass: "bg-blue-500", textClass: "text-blue-600" };
    return { label: "Høy risiko", dotClass: "bg-red-500", textClass: "text-red-600" };
  };

  const getReviewInfo = (record: ProcessRecord) => {
    if (record.updated_at) {
      const updated = new Date(record.updated_at);
      const daysSince = Math.floor((Date.now() - updated.getTime()) / (1000 * 60 * 60 * 24));
      if (daysSince < 90) {
        return {
          label: `REVIDERT - ${format(updated, "dd.MM.yyyy", { locale: nb })}`,
          className: "text-emerald-600",
        };
      }
    }
    return { label: "IKKE REVIDERT", className: "text-destructive" };
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
          {/* View toggle */}
          <div className="flex border border-border rounded-md">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-8 px-2 rounded-r-none",
                viewMode === "cards" && "bg-muted"
              )}
              onClick={() => setViewMode("cards")}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-8 px-2 rounded-l-none",
                viewMode === "table" && "bg-muted"
              )}
              onClick={() => setViewMode("table")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={selectedRecords.length === 0}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Skriv ut valgte
          </Button>
          <Button
            size="sm"
            className="gap-2"
            onClick={() => setIsAddDialogOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Legg til
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
        <Select value={riskFilter} onValueChange={setRiskFilter}>
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

      {/* Content */}
      {isLoading ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">Laster behandlingsaktiviteter...</p>
        </Card>
      ) : filteredProcesses.length === 0 ? (
        <Card className="p-8 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">
            {searchTerm ? "Ingen treff" : "Ingen behandlingsaktiviteter"}
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
      ) : viewMode === "cards" ? (
        /* Card View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProcesses.map((record) => {
            const risk = getRiskInfo(record);
            const review = getReviewInfo(record);
            return (
              <Card
                key={record.id}
                className="p-4 hover:shadow-md transition-shadow cursor-pointer flex flex-col"
                onClick={() => navigate(`/processes/${record.id}`)}
              >
                {/* Header with checkbox and title */}
                <div className="flex items-start gap-3 mb-3">
                  <Checkbox
                    checked={selectedRecords.includes(record.id)}
                    onCheckedChange={() => toggleSelect(record.id)}
                    onClick={(e) => e.stopPropagation()}
                    className="mt-1"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-foreground line-clamp-2 leading-snug">
                      {record.name}
                    </h4>
                    <p className="text-sm text-muted-foreground line-clamp-3 mt-1">
                      {record.description || "Ingen beskrivelse"}
                    </p>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-3 text-sm flex-1">
                  {/* Risk level */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Shield className="h-4 w-4" />
                      <span>Risikonivå</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={cn("h-2.5 w-2.5 rounded-full", risk.dotClass)} />
                      <span className={cn("font-medium", risk.textClass)}>{risk.label}</span>
                    </div>
                  </div>

                  {/* Work area */}
                  <div>
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <FileText className="h-4 w-4" />
                      <span>Ansvarlig arbeidsområde</span>
                    </div>
                    <div className="flex items-center gap-2 ml-6">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      <span className="text-foreground">{workAreaName}</span>
                    </div>
                  </div>

                  {/* Review status */}
                  <div>
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Calendar className="h-4 w-4" />
                      <span>Revisjonsstatus</span>
                    </div>
                    <div className="ml-6">
                      <span className={cn("text-xs font-semibold uppercase", review.className)}>
                        {review.label}
                      </span>
                    </div>
                  </div>

                  {/* Linked systems */}
                  <div>
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Server className="h-4 w-4" />
                      <span>Tilknyttede systemer</span>
                      <Badge variant="secondary" className="text-xs h-5 px-1.5">1</Badge>
                    </div>
                    <div className="flex items-center gap-2 ml-6">
                      <span className="h-2 w-2 rounded-full bg-primary" />
                      <span className="text-foreground">{record.systemName}</span>
                    </div>
                  </div>

                  {/* DPIA section */}
                  <div className="p-2.5 rounded-md border border-border bg-muted/30">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <AlertTriangle className="h-3.5 w-3.5 text-warning" />
                        <span className="font-medium text-foreground text-xs">DPIA påkrevd</span>
                      </div>
                      <Badge variant="outline" className="text-[10px] h-5 bg-emerald-500/10 text-emerald-600 border-emerald-200">
                        GODKJENT
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">DPIA er godkjent og klar</span>
                      <Button variant="outline" size="sm" className="h-6 text-xs px-2" onClick={(e) => e.stopPropagation()}>
                        Se DPIA
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="pt-3 mt-3 border-t border-border flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    Sist oppdatert:{" "}
                    {record.updated_at
                      ? format(new Date(record.updated_at), "dd.MM.yyyy", { locale: nb })
                      : "-"}
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox
                    checked={selectedRecords.length === filteredProcesses.length && filteredProcesses.length > 0}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead>Tittel</TableHead>
                <TableHead className="w-[130px]">Risikonivå</TableHead>
                <TableHead className="w-[180px]">Arbeidsområde</TableHead>
                <TableHead className="w-[160px]">Revisjonsstatus</TableHead>
                <TableHead className="w-[140px]">System</TableHead>
                <TableHead className="w-[120px]">Oppdatert</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProcesses.map((record) => {
                const risk = getRiskInfo(record);
                const review = getReviewInfo(record);
                return (
                  <TableRow
                    key={record.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/processes/${record.id}`)}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedRecords.includes(record.id)}
                        onCheckedChange={() => toggleSelect(record.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium line-clamp-1">{record.name}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {record.description || "-"}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <span className={cn("h-2.5 w-2.5 rounded-full", risk.dotClass)} />
                        <span className={cn("text-sm", risk.textClass)}>{risk.label}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                        <span className="text-sm">{workAreaName}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={cn("text-xs font-semibold uppercase", review.className)}>
                        {review.label}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{record.systemName}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground">
                        {record.updated_at
                          ? format(new Date(record.updated_at), "dd.MM.yyyy", { locale: nb })
                          : "-"}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      <AddProcessDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        workAreaId={workAreaId}
        workAreaName={workAreaName}
        onProcessAdded={() => {}}
      />
    </div>
  );
}
