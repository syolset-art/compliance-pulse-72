import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Sidebar } from "@/components/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { toast } from "sonner";

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
}

const categoryLabels: Record<string, string> = {
  datainnbrudd: "Datainnbrudd",
  tilgangskontroll: "Tilgangskontroll",
  hendelseshåndtering: "Hendelseshåndtering",
  prosess_og_rutiner: "Prosess og rutiner",
  personvern: "Personvern",
  sikkerhet: "Sikkerhet",
  annet: "Annet",
};

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
  const queryClient = useQueryClient();
  const [titleFilter, setTitleFilter] = useState("");
  const [criticalityFilter, setCriticalityFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newDeviation, setNewDeviation] = useState({
    title: "",
    description: "",
    category: "annet",
    criticality: "medium",
    responsible: "",
    relevant_frameworks: [] as string[],
  });

  // Fetch deviations
  const { data: deviations = [], isLoading } = useQuery({
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

  // Fetch systems for adding new deviations
  const { data: systems = [] } = useQuery({
    queryKey: ["systems-for-deviations"],
    queryFn: async () => {
      const { data, error } = await supabase.from("systems").select("id, name");
      if (error) throw error;
      return data || [];
    },
  });

  // Create deviation mutation
  const createDeviation = useMutation({
    mutationFn: async (deviation: typeof newDeviation & { system_id: string }) => {
      const { error } = await supabase.from("system_incidents").insert({
        system_id: deviation.system_id,
        title: deviation.title,
        description: deviation.description,
        category: deviation.category,
        criticality: deviation.criticality,
        responsible: deviation.responsible,
        relevant_frameworks: deviation.relevant_frameworks,
        status: "open",
        measures_count: 0,
        measures_completed: 0,
        systems_count: 1,
        processes_count: 0,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deviations"] });
      setIsAddDialogOpen(false);
      setNewDeviation({
        title: "",
        description: "",
        category: "annet",
        criticality: "medium",
        responsible: "",
        relevant_frameworks: [],
      });
      toast.success("Avvik opprettet");
    },
    onError: () => {
      toast.error("Kunne ikke opprette avvik");
    },
  });

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

  const handleAddDeviation = () => {
    if (!newDeviation.title.trim()) {
      toast.error("Tittel er påkrevd");
      return;
    }
    // Use first system if available, or create a placeholder
    const systemId = systems[0]?.id;
    if (!systemId) {
      toast.error("Du må opprette et system først");
      return;
    }
    createDeviation.mutate({ ...newDeviation, system_id: systemId });
  };

  const toggleFramework = (framework: string) => {
    setNewDeviation((prev) => ({
      ...prev,
      relevant_frameworks: prev.relevant_frameworks.includes(framework)
        ? prev.relevant_frameworks.filter((f) => f !== framework)
        : [...prev.relevant_frameworks, framework],
    }));
  };

  const DeviationCard = ({ deviation }: { deviation: Deviation }) => {
    const criticality = criticalityConfig[deviation.criticality] || criticalityConfig.medium;
    const status = statusConfig[deviation.status] || statusConfig.open;
    const progress =
      deviation.measures_count > 0
        ? Math.round((deviation.measures_completed / deviation.measures_count) * 100)
        : 0;

    return (
      <Card className="bg-card border-border hover:border-primary/30 transition-colors">
        <CardContent className="p-4">
          {/* Badges */}
          <div className="flex items-center gap-2 mb-3">
            <Badge className={cn("text-xs font-semibold", criticality.bgColor, criticality.color)}>
              {criticality.label}
            </Badge>
            <Badge className={cn("text-xs font-semibold", status.bgColor, status.color)}>
              {status.label}
            </Badge>
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Legg til nytt avvik</DialogTitle>
              <DialogDescription>
                Registrer et nytt avvik eller hendelse som krever oppfølging
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Tittel *</Label>
                <Input
                  id="title"
                  value={newDeviation.title}
                  onChange={(e) => setNewDeviation((p) => ({ ...p, title: e.target.value }))}
                  placeholder="Beskriv avviket kort"
                />
              </div>

              <div>
                <Label htmlFor="description">Beskrivelse</Label>
                <Textarea
                  id="description"
                  value={newDeviation.description}
                  onChange={(e) => setNewDeviation((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Gi en detaljert beskrivelse av avviket..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Kategori</Label>
                  <Select
                    value={newDeviation.category}
                    onValueChange={(v) => setNewDeviation((p) => ({ ...p, category: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(categoryLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Kritikalitet</Label>
                  <Select
                    value={newDeviation.criticality}
                    onValueChange={(v) => setNewDeviation((p) => ({ ...p, criticality: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="critical">Kritisk</SelectItem>
                      <SelectItem value="high">Høy</SelectItem>
                      <SelectItem value="medium">Middels</SelectItem>
                      <SelectItem value="low">Lav</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="responsible">Ansvarlig</Label>
                <Input
                  id="responsible"
                  value={newDeviation.responsible}
                  onChange={(e) => setNewDeviation((p) => ({ ...p, responsible: e.target.value }))}
                  placeholder="Navn på ansvarlig person"
                />
              </div>

              <div>
                <Label className="mb-2 block">Relevante regelverk</Label>
                <div className="flex flex-wrap gap-2">
                  {["GDPR", "ISO27001", "NIS2", "CRA", "AI Act"].map((fw) => (
                    <Badge
                      key={fw}
                      variant={newDeviation.relevant_frameworks.includes(fw) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleFramework(fw)}
                    >
                      {fw}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Avbryt
              </Button>
              <Button onClick={handleAddDeviation} disabled={createDeviation.isPending}>
                {createDeviation.isPending ? "Oppretter..." : "Opprett avvik"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        </div>
      </main>
    </div>
  );
}
