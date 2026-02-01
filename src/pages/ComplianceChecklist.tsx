import { useState, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { 
  Shield, 
  Lock, 
  Brain, 
  Filter, 
  ChevronDown, 
  ChevronRight,
  FileDown,
  Bot,
  Sparkles,
  User,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Search
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sidebar } from "@/components/Sidebar";
import { RequirementCard } from "@/components/compliance/RequirementCard";
import { AgentCapabilitySummary } from "@/components/compliance/AgentCapabilityBadge";
import { FrameworkProgressHeader } from "@/components/compliance/FrameworkProgressHeader";
import { useComplianceRequirements, type RequirementWithStatus } from "@/hooks/useComplianceRequirements";
import { 
  getRequirementsByFramework, 
  getFrameworkStats,
  type RequirementCategory 
} from "@/lib/complianceRequirementsData";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

const frameworkConfig = {
  "iso27001": {
    id: "iso27001",
    name: "ISO 27001:2022",
    fullName: "ISO/IEC 27001:2022 Information Security",
    icon: Lock,
    color: "text-green-500",
    bgColor: "bg-green-500/10",
    categories: [
      { id: "organizational", name: "Organizational Controls (A.5)", range: "A.5.1 - A.5.37" },
      { id: "people", name: "People Controls (A.6)", range: "A.6.1 - A.6.8" },
      { id: "physical", name: "Physical Controls (A.7)", range: "A.7.1 - A.7.14" },
      { id: "technological", name: "Technological Controls (A.8)", range: "A.8.1 - A.8.34" }
    ]
  },
  "gdpr": {
    id: "gdpr",
    name: "GDPR",
    fullName: "General Data Protection Regulation",
    icon: Shield,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    categories: [
      { id: "documentation", name: "Dokumentasjon", range: "" },
      { id: "rights", name: "Rettigheter", range: "" },
      { id: "security", name: "Sikkerhet", range: "" },
      { id: "governance", name: "Styring", range: "" }
    ]
  },
  "ai-act": {
    id: "ai-act",
    name: "EU AI Act",
    fullName: "EU Artificial Intelligence Act",
    icon: Brain,
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
    categories: [
      { id: "risk-classification", name: "Risikoklassifisering", range: "" },
      { id: "documentation", name: "Dokumentasjon", range: "" },
      { id: "transparency", name: "Transparens", range: "" },
      { id: "governance", name: "Styring", range: "" }
    ]
  }
};

type FrameworkId = keyof typeof frameworkConfig;

export default function ComplianceChecklist() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const frameworkParam = searchParams.get("framework") as FrameworkId || "iso27001";
  const [selectedFramework, setSelectedFramework] = useState<FrameworkId>(
    frameworkConfig[frameworkParam] ? frameworkParam : "iso27001"
  );
  
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [capabilityFilter, setCapabilityFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<string[]>(["organizational"]);

  const { requirements, stats, isLoading, updateStatus } = useComplianceRequirements({
    frameworkId: selectedFramework
  });

  const framework = frameworkConfig[selectedFramework];
  const Icon = framework.icon;

  // Group requirements by category
  const groupedRequirements = useMemo(() => {
    const groups: Record<string, RequirementWithStatus[]> = {};
    
    requirements.forEach(req => {
      if (!groups[req.category]) {
        groups[req.category] = [];
      }
      groups[req.category].push(req);
    });

    // Sort within each group by sort_order
    Object.keys(groups).forEach(key => {
      groups[key].sort((a, b) => a.sort_order - b.sort_order);
    });

    return groups;
  }, [requirements]);

  // Apply filters
  const filteredRequirements = useMemo(() => {
    return requirements.filter(req => {
      // Status filter
      if (statusFilter !== "all") {
        if (statusFilter === "completed" && req.status !== "completed") return false;
        if (statusFilter === "in_progress" && req.status !== "in_progress") return false;
        if (statusFilter === "not_started" && req.status !== "not_started") return false;
      }

      // Capability filter
      if (capabilityFilter !== "all" && req.agent_capability !== capabilityFilter) return false;

      // Priority filter
      if (priorityFilter !== "all" && req.priority !== priorityFilter) return false;

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = req.name.toLowerCase().includes(query);
        const matchesId = req.requirement_id.toLowerCase().includes(query);
        const matchesDesc = req.description?.toLowerCase().includes(query);
        if (!matchesName && !matchesId && !matchesDesc) return false;
      }

      return true;
    });
  }, [requirements, statusFilter, capabilityFilter, priorityFilter, searchQuery]);

  // Filter grouped requirements
  const filteredGroupedRequirements = useMemo(() => {
    const groups: Record<string, RequirementWithStatus[]> = {};
    
    filteredRequirements.forEach(req => {
      if (!groups[req.category]) {
        groups[req.category] = [];
      }
      groups[req.category].push(req);
    });

    Object.keys(groups).forEach(key => {
      groups[key].sort((a, b) => a.sort_order - b.sort_order);
    });

    return groups;
  }, [filteredRequirements]);

  const handleFrameworkChange = (value: string) => {
    const newFramework = value as FrameworkId;
    setSelectedFramework(newFramework);
    setSearchParams({ framework: newFramework });
    setExpandedCategories([framework.categories[0]?.id || "organizational"]);
  };

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleStartTask = (requirementId: string) => {
    navigate(`/tasks?requirement=${requirementId}`);
  };

  const getCategoryStats = (categoryId: string) => {
    const categoryReqs = groupedRequirements[categoryId] || [];
    const total = categoryReqs.length;
    const completed = categoryReqs.filter(r => r.status === "completed").length;
    return { completed, total };
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle2 className="h-4 w-4 text-success" />;
      case "in_progress": return <Clock className="h-4 w-4 text-warning" />;
      default: return <AlertTriangle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto p-6 max-w-7xl">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className={cn("p-2.5 rounded-lg", framework.bgColor)}>
                <Icon className={cn("h-6 w-6", framework.color)} />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                  Compliance Sjekkliste
                </h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {framework.fullName}
                </p>
              </div>
            </div>
          </div>

          {/* Framework selector and stats */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <Select value={selectedFramework} onValueChange={handleFrameworkChange}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Velg rammeverk" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="iso27001">
                        <div className="flex items-center gap-2">
                          <Lock className="h-4 w-4 text-green-500" />
                          ISO 27001:2022
                        </div>
                      </SelectItem>
                      <SelectItem value="gdpr">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-blue-500" />
                          GDPR
                        </div>
                      </SelectItem>
                      <SelectItem value="ai-act">
                        <div className="flex items-center gap-2">
                          <Brain className="h-4 w-4 text-purple-500" />
                          EU AI Act
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>

                  <div className="hidden sm:block">
                    <AgentCapabilitySummary 
                      counts={stats.byCapability}
                      size="sm"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex-1 lg:w-64">
                    <Progress value={stats.progressPercent} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-1">
                      {stats.completed} av {stats.total} krav fullført ({stats.progressPercent}%)
                    </p>
                  </div>

                  <Button variant="outline" size="sm" className="gap-2">
                    <FileDown className="h-4 w-4" />
                    Eksporter
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="pt-4 pb-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Søk etter kontroll-ID eller navn..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>

                <div className="flex gap-2 flex-wrap">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[130px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Alle statuser</SelectItem>
                      <SelectItem value="not_started">Ikke startet</SelectItem>
                      <SelectItem value="in_progress">Pågår</SelectItem>
                      <SelectItem value="completed">Fullført</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={capabilityFilter} onValueChange={setCapabilityFilter}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Agent" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Alle typer</SelectItem>
                      <SelectItem value="full">
                        <div className="flex items-center gap-2">
                          <Bot className="h-3.5 w-3.5 text-emerald-500" />
                          AI Ready
                        </div>
                      </SelectItem>
                      <SelectItem value="assisted">
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-3.5 w-3.5 text-blue-500" />
                          Hybrid
                        </div>
                      </SelectItem>
                      <SelectItem value="manual">
                        <div className="flex items-center gap-2">
                          <User className="h-3.5 w-3.5 text-orange-500" />
                          Manuell
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                    <SelectTrigger className="w-[130px]">
                      <SelectValue placeholder="Prioritet" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Alle prioriteter</SelectItem>
                      <SelectItem value="critical">Kritisk</SelectItem>
                      <SelectItem value="high">Høy</SelectItem>
                      <SelectItem value="medium">Middels</SelectItem>
                      <SelectItem value="low">Lav</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Active filters */}
              {(statusFilter !== "all" || capabilityFilter !== "all" || priorityFilter !== "all" || searchQuery) && (
                <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                  <span className="text-xs text-muted-foreground">Aktive filtre:</span>
                  <div className="flex gap-1 flex-wrap">
                    {statusFilter !== "all" && (
                      <Badge variant="secondary" className="text-xs">
                        {statusFilter === "completed" && "Fullført"}
                        {statusFilter === "in_progress" && "Pågår"}
                        {statusFilter === "not_started" && "Ikke startet"}
                      </Badge>
                    )}
                    {capabilityFilter !== "all" && (
                      <Badge variant="secondary" className="text-xs">
                        {capabilityFilter === "full" && "AI Ready"}
                        {capabilityFilter === "assisted" && "Hybrid"}
                        {capabilityFilter === "manual" && "Manuell"}
                      </Badge>
                    )}
                    {priorityFilter !== "all" && (
                      <Badge variant="secondary" className="text-xs capitalize">
                        {priorityFilter}
                      </Badge>
                    )}
                    {searchQuery && (
                      <Badge variant="secondary" className="text-xs">
                        Søk: "{searchQuery}"
                      </Badge>
                    )}
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 text-xs"
                    onClick={() => {
                      setStatusFilter("all");
                      setCapabilityFilter("all");
                      setPriorityFilter("all");
                      setSearchQuery("");
                    }}
                  >
                    Nullstill
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Requirements by category */}
          <div className="space-y-4">
            {framework.categories.map((category) => {
              const categoryReqs = filteredGroupedRequirements[category.id] || [];
              const { completed, total } = getCategoryStats(category.id);
              const isExpanded = expandedCategories.includes(category.id);

              if (filteredRequirements.length > 0 && categoryReqs.length === 0) {
                return null; // Hide empty categories when filtering
              }

              return (
                <Collapsible
                  key={category.id}
                  open={isExpanded}
                  onOpenChange={() => toggleCategory(category.id)}
                >
                  <Card className={cn(
                    "transition-all",
                    isExpanded && "border-primary/30"
                  )}>
                    <CollapsibleTrigger asChild>
                      <button className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors rounded-lg">
                        <div className="flex items-center gap-3">
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          )}
                          <div className="text-left">
                            <h3 className="font-medium text-foreground">
                              {category.name}
                            </h3>
                            {category.range && (
                              <span className="text-xs text-muted-foreground">
                                {category.range}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="hidden sm:flex items-center gap-2">
                            <Progress 
                              value={total > 0 ? (completed / total) * 100 : 0} 
                              className="w-24 h-1.5"
                            />
                            <span className="text-xs text-muted-foreground w-16 text-right">
                              {completed}/{total} ✓
                            </span>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {categoryReqs.length} krav
                          </Badge>
                        </div>
                      </button>
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                      <div className="px-4 pb-4 border-t">
                        <div className="space-y-2 pt-3">
                          {categoryReqs.map((req) => (
                            <RequirementCard
                              key={req.requirement_id}
                              requirementId={req.requirement_id}
                              name={req.name}
                              description={req.description}
                              status={req.status}
                              priority={req.priority}
                              agentCapability={req.agent_capability}
                              progressPercent={req.progress_percent}
                              isAiHandling={req.is_ai_handling}
                              onStartTask={() => handleStartTask(req.requirement_id)}
                            />
                          ))}
                          {categoryReqs.length === 0 && (
                            <p className="text-sm text-muted-foreground text-center py-4">
                              Ingen krav matcher de valgte filtrene
                            </p>
                          )}
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              );
            })}
          </div>

          {/* Summary footer */}
          <Card className="mt-6">
            <CardContent className="pt-4 pb-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">
                    Viser <span className="font-medium text-foreground">{filteredRequirements.length}</span> av {requirements.length} krav
                  </p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3 text-success" />
                      {stats.completed} fullført
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-warning" />
                      {stats.inProgress} pågår
                    </span>
                    <span className="flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3 text-muted-foreground" />
                      {stats.notStarted} ikke startet
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="gap-2">
                    <FileDown className="h-4 w-4" />
                    Last ned rapport
                  </Button>
                  <Button size="sm" onClick={() => navigate("/tasks")}>
                    Gå til oppgaver
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
