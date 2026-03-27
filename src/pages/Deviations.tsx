import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/Sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertTriangle,
  Clock,
  CheckCircle,
  FileText,
  Plus,
  Monitor,
  Layers,
  ListChecks,
  User,
  Calendar,
  Radio,
  Shield,
  Zap,
  Bell,
  ArrowRight,
  Info,
  ChevronDown,
  ChevronUp,
  MapPin,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { AddDeviationDialog } from "@/components/dialogs/AddDeviationDialog";
import { deviationCategories } from "@/lib/deviationCategories";

interface Deviation {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  criticality: string;
  status: string;
  responsible: string | null;
  due_date: string | null;
  systems_count: number;
  processes_count: number;
  measures_count: number;
  measures_completed: number;
  relevant_frameworks: string[];
  created_at: string;
  system_id: string;
  source?: string;
  auto_created?: boolean;
}

const categoryLabels: Record<string, string> = Object.fromEntries(
  deviationCategories.map((c) => [c.id, c.label])
);
categoryLabels["annet"] = "Annet";

const criticalityConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  critical: { label: "KRITISK", color: "text-red-400", bgColor: "bg-red-500/20" },
  high: { label: "HØY", color: "text-orange-400", bgColor: "bg-orange-500/20" },
  medium: { label: "MIDDELS", color: "text-yellow-400", bgColor: "bg-yellow-500/20" },
  low: { label: "LAV", color: "text-green-400", bgColor: "bg-green-500/20" },
};

const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  open: { label: "NY", color: "text-blue-400", bgColor: "bg-blue-500/20" },
  in_progress: { label: "UNDER BEHANDLING", color: "text-purple-400", bgColor: "bg-purple-500/20" },
  resolved: { label: "LØST", color: "text-green-400", bgColor: "bg-green-500/20" },
};

export default function Deviations() {
  const isMobile = useIsMobile();
  const [titleFilter, setTitleFilter] = useState("");
  const [criticalityFilter, setCriticalityFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [liveEnabled, setLiveEnabled] = useState(false);
  const [liveInfoExpanded, setLiveInfoExpanded] = useState(false);
  const [selectedDeviation, setSelectedDeviation] = useState<Deviation | null>(null);

  // Fetch deviations from system_incidents
  const { data: systemDeviations = [], isLoading: loadingSystem } = useQuery({
    queryKey: ["deviations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("system_incidents")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as Deviation[];
    },
  });

  // Fetch employee deviation reports
  const { data: employeeReports = [], isLoading: loadingEmployee } = useQuery({
    queryKey: ["employee-deviation-reports"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employee_deviation_reports")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []).map((r: any) => ({
        id: r.id,
        title: r.title,
        description: r.description,
        category: r.category,
        criticality: r.severity === "critical" ? "critical" : r.severity === "high" ? "high" : r.severity === "low" ? "low" : "medium",
        status: r.status === "new" ? "open" : r.status === "approved" ? "in_progress" : r.status === "rejected" ? "resolved" : "open",
        responsible: r.processed_by || null,
        due_date: null,
        systems_count: 0,
        processes_count: 0,
        measures_count: 0,
        measures_completed: 0,
        relevant_frameworks: [],
        created_at: r.created_at,
        system_id: "",
        source: "employee",
        auto_created: false,
      } as Deviation));
    },
  });

  // Fetch employee notifications (varsler)
  const { data: notificationItems = [], isLoading: loadingNotifications } = useQuery({
    queryKey: ["employee-notifications-deviations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employee_notifications")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      const severityMap: Record<string, string> = { critical: "critical", warning: "high", info: "low" };
      return (data || []).map((n: any) => ({
        id: n.id,
        title: n.title_no || n.title,
        description: n.content_no || n.content,
        category: n.type || "varsel",
        criticality: severityMap[n.severity] || "low",
        status: "resolved",
        responsible: null,
        due_date: n.expires_at,
        systems_count: 0,
        processes_count: 0,
        measures_count: 0,
        measures_completed: 0,
        relevant_frameworks: [],
        created_at: n.created_at,
        system_id: "",
        source: "notification",
        auto_created: false,
      } as Deviation));
    },
  });

  const isLoading = loadingSystem || loadingEmployee || loadingNotifications;
  const deviations = [...systemDeviations, ...employeeReports, ...notificationItems].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  // Calculate summary stats
  const stats = {
    critical: deviations.filter((d) => d.criticality === "critical").length,
    high: deviations.filter((d) => d.criticality === "high").length,
    inProgress: deviations.filter((d) => d.status === "in_progress").length,
    resolved: deviations.filter((d) => d.status === "resolved").length,
    total: deviations.length,
  };

  // Filter deviations
  const filteredDeviations = deviations.filter((d) => {
    if (titleFilter && !d.title.toLowerCase().includes(titleFilter.toLowerCase())) {
      return false;
    }
    if (criticalityFilter !== "all" && d.criticality !== criticalityFilter) {
      return false;
    }
    if (statusFilter !== "all" && d.status !== statusFilter) {
      return false;
    }
      if (sourceFilter !== "all") {
        if (sourceFilter === "external" && !d.source) return false;
        if (sourceFilter === "external" && d.source === "manual") return false;
        if (sourceFilter === "external" && d.source === "employee") return false;
        if (sourceFilter === "external" && d.source === "notification") return false;
        if (sourceFilter === "manual" && d.source && d.source !== "manual") return false;
        if (sourceFilter === "employee" && d.source !== "employee") return false;
        if (sourceFilter === "notification" && d.source !== "notification") return false;
      }
    return true;
  });

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    try {
      return format(new Date(dateStr), "d.M.yyyy", { locale: nb });
    } catch {
      return "-";
    }
  };

  const DeviationCard = ({ deviation }: { deviation: Deviation }) => {
    const criticality = criticalityConfig[deviation.criticality] || criticalityConfig.medium;
    const status = statusConfig[deviation.status] || statusConfig.open;
    const progress =
      deviation.measures_count > 0
        ? Math.round((deviation.measures_completed / deviation.measures_count) * 100)
        : 0;

    return (
      <Card className="bg-card border-border hover:border-primary/30 transition-colors cursor-pointer" onClick={() => setSelectedDeviation(deviation)}>
        <CardContent className="p-4">
          {/* Badges */}
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <Badge className={cn("text-xs font-semibold", criticality.bgColor, criticality.color)}>
              {criticality.label}
            </Badge>
            <Badge className={cn("text-xs font-semibold", status.bgColor, status.color)}>
              {status.label}
            </Badge>
            {deviation.source === "7security" && (
              <Badge className="text-[10px] bg-orange-500/15 text-orange-700 border-orange-500/30">
                7 Security
              </Badge>
            )}
            {deviation.source === "employee" && (
              <Badge className="text-[10px] bg-blue-500/15 text-blue-700 border-blue-500/30">
                Ansattmelding
              </Badge>
            )}
            {deviation.source === "notification" && (
              <Badge className="text-[10px] bg-purple-500/15 text-purple-700 border-purple-500/30">
                Varsel
              </Badge>
            )}
            {deviation.auto_created && (
              <Badge variant="outline" className="text-[10px]">Auto</Badge>
            )}
          </div>

          {/* Title */}
          <h3 className="font-semibold text-foreground mb-2">{deviation.title}</h3>

          {/* Category */}
          {deviation.category && (
            <Badge variant="secondary" className="mb-3 text-xs">
              {categoryLabels[deviation.category] || deviation.category}
            </Badge>
          )}

          {/* Description */}
          {deviation.description && (
            <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
              {deviation.description}
            </p>
          )}

          {/* Stats */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
            <div className="flex items-center gap-1">
              <Monitor className="h-3.5 w-3.5" />
              <span>{deviation.systems_count || 0} system</span>
            </div>
            <div className="flex items-center gap-1">
              <Layers className="h-3.5 w-3.5" />
              <span>{deviation.processes_count || 0} prosess</span>
            </div>
            <div className="flex items-center gap-1">
              <ListChecks className="h-3.5 w-3.5" />
              <span>{deviation.measures_count || 0} tiltak</span>
            </div>
          </div>

          {/* Progress */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-muted-foreground">Tiltaksframgang</span>
              <span className="text-foreground font-medium">{progress}%</span>
            </div>
            <Progress
              value={progress}
              className={cn(
                "h-1.5",
                progress === 100
                  ? "[&>div]:bg-success"
                  : progress > 0
                  ? "[&>div]:bg-primary"
                  : "[&>div]:bg-muted-foreground"
              )}
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t border-border">
            <div className="flex items-center gap-1">
              <User className="h-3.5 w-3.5" />
              <span>{deviation.responsible || "Ikke tildelt"}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              <span>{formatDate(deviation.due_date || deviation.created_at)}</span>
            </div>
          </div>

          {/* Frameworks */}
          {deviation.relevant_frameworks && deviation.relevant_frameworks.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-border">
              {deviation.relevant_frameworks.map((fw) => (
                <Badge
                  key={fw}
                  variant="outline"
                  className="text-[10px] px-1.5 py-0.5 bg-muted/50"
                >
                  {fw}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className={cn("flex-1 overflow-auto", isMobile ? "pb-24" : "")}>
        <div className="container max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Avviksregister</h1>
            <p className="text-sm text-muted-foreground">Administrer og følg opp alle avvik</p>
          </div>
          <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Legg til avvik
          </Button>
        </div>

        {/* Live Deviations Activation Banner */}
        <Card className={cn(
          "border transition-all overflow-hidden",
          liveEnabled
            ? "border-primary/30 bg-primary/5"
            : "border-border bg-card"
        )}>
          <CardContent className="p-0">
            <div className="p-4 md:p-5">
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className={cn(
                  "h-10 w-10 rounded-xl flex items-center justify-center shrink-0",
                  liveEnabled ? "bg-primary/15" : "bg-muted"
                )}>
                  <Radio className={cn("h-5 w-5", liveEnabled ? "text-primary" : "text-muted-foreground")} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-foreground">Live avvik</h3>
                    {liveEnabled && (
                      <Badge className="bg-primary/15 text-primary border-primary/30 text-[10px]">
                        Aktiv
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Motta sikkerhetshendelser i sanntid fra tilkoblede leverandører og overvåkingstjenester
                  </p>

                  {/* Expand/collapse details */}
                  <button
                    onClick={() => setLiveInfoExpanded(!liveInfoExpanded)}
                    className="flex items-center gap-1 text-xs text-primary mt-2 hover:underline"
                  >
                    <Info className="h-3.5 w-3.5" />
                    {liveInfoExpanded ? "Skjul detaljer" : "Hvordan fungerer det?"}
                    {liveInfoExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  </button>
                </div>

                {/* Toggle */}
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-muted-foreground hidden sm:inline">
                    {liveEnabled ? "Aktivert" : "Deaktivert"}
                  </span>
                  <Switch
                    checked={liveEnabled}
                    onCheckedChange={setLiveEnabled}
                  />
                </div>
              </div>

              {/* Expanded info */}
              {liveInfoExpanded && (
                <div className="mt-4 pt-4 border-t border-border space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-start gap-3">
                      <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                        <Zap className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">Sanntidsovervåking</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Hendelser fra sikkerhetsleverandører som 7 Security mottas automatisk og opprettes som avvik i registeret
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                        <Shield className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">Automatisk klassifisering</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Lara vurderer alvorlighetsgrad og kobler hendelsen til riktig system, prosess og rammeverk automatisk
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                        <Bell className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">Varsling og eskalering</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Kritiske hendelser utløser umiddelbar varsling til ansvarlige personer med foreslåtte tiltak
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* How it works flow */}
                  <div className="rounded-lg border border-border bg-muted/30 p-4">
                    <p className="text-xs font-medium text-foreground mb-3">Slik fungerer det:</p>
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-2 md:gap-3 text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] bg-background">1</Badge>
                        <span>Leverandør oppdager hendelse</span>
                      </div>
                      <ArrowRight className="h-3 w-3 hidden md:block text-muted-foreground/50" />
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] bg-background">2</Badge>
                        <span>Hendelsen sendes til Lara Innboks</span>
                      </div>
                      <ArrowRight className="h-3 w-3 hidden md:block text-muted-foreground/50" />
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] bg-background">3</Badge>
                        <span>Lara oppretter avvik automatisk</span>
                      </div>
                      <ArrowRight className="h-3 w-3 hidden md:block text-muted-foreground/50" />
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] bg-background">4</Badge>
                        <span>Du får varsel og kan følge opp</span>
                      </div>
                    </div>
                  </div>

                  {/* Supported providers */}
                  <div>
                    <p className="text-xs font-medium text-foreground mb-2">Støttede leverandører:</p>
                    <div className="flex flex-wrap gap-2">
                      <Badge className="bg-muted text-foreground border-border text-xs gap-1.5">
                        <Shield className="h-3 w-3" />
                        7 Security
                      </Badge>
                      <Badge variant="outline" className="text-xs text-muted-foreground gap-1.5">
                        <Shield className="h-3 w-3" />
                        Acronis (kommer snart)
                      </Badge>
                      <Badge variant="outline" className="text-xs text-muted-foreground gap-1.5">
                        <Shield className="h-3 w-3" />
                        Arctic Security (kommer snart)
                      </Badge>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Card className="bg-card border-border">
            <CardContent className="p-4 flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.critical}</p>
                <p className="text-xs text-muted-foreground">Kritiske</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4 flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.high}</p>
                <p className="text-xs text-muted-foreground">Høye</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4 flex items-center gap-3">
              <Clock className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.inProgress}</p>
                <p className="text-xs text-muted-foreground">Under behandling</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4 flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.resolved}</p>
                <p className="text-xs text-muted-foreground">Løste</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4 flex items-center gap-3">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Totalt</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Input
                placeholder="Filtrer etter tittel"
                value={titleFilter}
                onChange={(e) => setTitleFilter(e.target.value)}
                className="bg-background"
              />
              <Select value={criticalityFilter} onValueChange={setCriticalityFilter}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Filtrer etter kritikalitet" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle kritikaliteter</SelectItem>
                  <SelectItem value="critical">Kritisk</SelectItem>
                  <SelectItem value="high">Høy</SelectItem>
                  <SelectItem value="medium">Middels</SelectItem>
                  <SelectItem value="low">Lav</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Filtrer etter status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle statuser</SelectItem>
                  <SelectItem value="open">Ny</SelectItem>
                  <SelectItem value="in_progress">Under behandling</SelectItem>
                  <SelectItem value="resolved">Løst</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sourceFilter} onValueChange={setSourceFilter}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Filtrer etter kilde" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle kilder</SelectItem>
                  <SelectItem value="external">Ekstern (7 Security)</SelectItem>
                  <SelectItem value="employee">Ansattmelding (Mynder Me)</SelectItem>
                  <SelectItem value="notification">Varsel (Mynder Me)</SelectItem>
                  <SelectItem value="manual">Manuell</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Deviations Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="h-64 animate-pulse bg-muted" />
            ))}
          </div>
        ) : filteredDeviations.length === 0 ? (
          <Card className="bg-card border-border">
            <CardContent className="p-8 text-center">
              <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold text-foreground mb-2">Ingen avvik funnet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {titleFilter || criticalityFilter !== "all" || statusFilter !== "all"
                  ? "Prøv å justere filtrene dine"
                  : "Klikk på 'Legg til avvik' for å registrere et nytt avvik"}
              </p>
              {!titleFilter && criticalityFilter === "all" && statusFilter === "all" && (
                <Button onClick={() => setIsAddDialogOpen(true)} variant="outline" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Legg til avvik
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDeviations.map((deviation) => (
              <DeviationCard key={deviation.id} deviation={deviation} />
            ))}
          </div>
        )}

        {/* Add Deviation Dialog */}
        <AddDeviationDialog
          open={isAddDialogOpen}
          onOpenChange={setIsAddDialogOpen}
        />
        </div>
      </main>
    </div>
  );
}
