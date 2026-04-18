import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  CircleAlert,
  CheckCircle2,
  Circle,
  Users,
  Bot,
  Sparkles,
} from "lucide-react";
import { getFrameworkById, getCategoryById } from "@/lib/frameworkDefinitions";
import { getRequirementsByFramework } from "@/lib/complianceRequirementsData";
import { ALL_ADDITIONAL_REQUIREMENTS } from "@/lib/additionalFrameworkRequirements";
import type { ComplianceRequirement, AgentCapability } from "@/lib/complianceRequirementsData";
import { ManualDocumentationDialog } from "@/components/dialogs/ManualDocumentationDialog";

type DemoStatus = "not_met" | "partial" | "met";

interface RequirementState {
  status: DemoStatus;
  progress: number;
  comment?: string;
}

// Generate stable demo statuses per framework
function generateDemoStates(requirements: ComplianceRequirement[]): Record<string, RequirementState> {
  const states: Record<string, RequirementState> = {};
  requirements.forEach((req, i) => {
    // Deterministic distribution: ~60% not met, ~10% partial, ~30% met
    const hash = (req.requirement_id.charCodeAt(req.requirement_id.length - 1) + i) % 10;
    if (hash < 3) {
      states[req.requirement_id] = { status: "met", progress: 100 };
    } else if (hash === 3) {
      states[req.requirement_id] = { status: "partial", progress: 50 };
    } else {
      states[req.requirement_id] = { status: "not_met", progress: 0 };
    }
  });
  return states;
}

const capabilityLabel: Record<AgentCapability, { label: string; instruction: string; icon: typeof Bot }> = {
  full: {
    label: "Auto",
    instruction: "Plattformen henter dette automatisk — ingen handling kreves.",
    icon: Bot,
  },
  assisted: {
    label: "Assistert",
    instruction: "Lara forbereder et utkast. Gjennomgå og godkjenn.",
    icon: Sparkles,
  },
  manual: {
    label: "Manuell",
    instruction: "Last opp et dokument eller skriv en kort beskrivelse av hvordan kravet er oppfylt.",
    icon: Users,
  },
};

const FrameworkDetailPage = () => {
  const { frameworkId } = useParams<{ frameworkId: string }>();
  const navigate = useNavigate();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "not_met" | "partial" | "met">("all");
  const [docDialog, setDocDialog] = useState<{ id: string; name: string } | null>(null);

  const framework = frameworkId ? getFrameworkById(frameworkId) : null;
  const category = framework ? getCategoryById(framework.category) : null;
  const CategoryIcon = category?.icon;

  // Merge requirements from both sources
  const requirements = useMemo(() => {
    if (!frameworkId) return [];
    const main = getRequirementsByFramework(frameworkId);
    if (main.length > 0) return main;
    return ALL_ADDITIONAL_REQUIREMENTS.filter((r) => r.framework_id === frameworkId);
  }, [frameworkId]);

  const [reqStates, setReqStates] = useState<Record<string, RequirementState>>(() =>
    generateDemoStates(requirements)
  );

  const counts = useMemo(() => {
    const met = Object.values(reqStates).filter((s) => s.status === "met").length;
    const partial = Object.values(reqStates).filter((s) => s.status === "partial").length;
    const notMet = Object.values(reqStates).filter((s) => s.status === "not_met").length;
    const auto = requirements.filter((r) => r.agent_capability === "full").length;
    const manual = requirements.filter((r) => r.agent_capability !== "full").length;
    return { met, partial, notMet, auto, manual, total: requirements.length };
  }, [reqStates, requirements]);

  const filtered = useMemo(() => {
    if (filter === "all") return requirements;
    return requirements.filter((r) => reqStates[r.requirement_id]?.status === filter);
  }, [filter, requirements, reqStates]);

  const handleDocSave = (requirementId: string, status: string) => {
    setReqStates((prev) => ({
      ...prev,
      [requirementId]: {
        status: status === "fulfilled" ? "met" : status === "partial" ? "partial" : "not_met",
        progress: status === "fulfilled" ? 100 : status === "partial" ? 50 : 0,
      },
    }));
  };

  if (!framework) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="flex-1 p-6 flex items-center justify-center">
          <p className="text-muted-foreground">Rammeverket ble ikke funnet.</p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto pt-11">
        <div className="p-6 max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" size="icon" onClick={() => navigate("/trust-center/regulations")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3 flex-1">
              {CategoryIcon && (
                <div className={`p-2.5 rounded-xl ${category?.bgColor}`}>
                  <CategoryIcon className={`h-6 w-6 ${category?.color}`} />
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold text-foreground">{framework.name}</h1>
                <p className="text-sm text-muted-foreground">{framework.description}</p>
              </div>
            </div>
          </div>

          {/* Summary bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
            <h2 className="text-lg font-bold text-foreground">Krav og evaluatorer</h2>
            <div className="flex items-center gap-3 text-sm">
              <span className="text-muted-foreground">{counts.total} krav totalt</span>
              <Badge variant="outline" className="gap-1 text-emerald-600 border-emerald-200 dark:border-emerald-800">
                <Bot className="h-3 w-3" />
                {counts.auto} Auto
              </Badge>
              <Badge variant="outline" className="gap-1 text-muted-foreground">
                <Users className="h-3 w-3" />
                {counts.manual} Manuell
              </Badge>
            </div>
          </div>

          {/* Filter tabs */}
          <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)} className="mb-6">
            <TabsList className="w-full grid grid-cols-4">
              <TabsTrigger value="all">Alle</TabsTrigger>
              <TabsTrigger value="not_met">
                Ikke oppfylt ({counts.notMet})
              </TabsTrigger>
              <TabsTrigger value="partial">
                Delvis ({counts.partial})
              </TabsTrigger>
              <TabsTrigger value="met">
                Oppfylt ({counts.met})
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Requirements list */}
          <div className="space-y-3">
            {filtered.map((req) => {
              const state = reqStates[req.requirement_id] || { status: "not_met", progress: 0 };
              const isExpanded = expandedId === req.requirement_id;
              const cap = capabilityLabel[req.agent_capability];

              return (
                <div
                  key={req.requirement_id}
                  className="rounded-lg border bg-card transition-colors"
                >
                  {/* Row */}
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : req.requirement_id)}
                    className="w-full p-4 flex items-start gap-3 text-left hover:bg-muted/30 transition-colors"
                  >
                    {/* Status icon */}
                    <div className="mt-0.5 shrink-0">
                      {state.status === "met" ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                      ) : state.status === "partial" ? (
                        <CircleAlert className="h-5 w-5 text-amber-500" />
                      ) : (
                        <Circle className="h-5 w-5 text-destructive/60" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold text-foreground mb-1">
                        {req.name_no}
                      </h3>
                      <p className={`text-sm text-muted-foreground ${isExpanded ? "" : "line-clamp-2"}`}>
                        {req.description_no}
                      </p>
                    </div>

                    {/* Right side: capability + progress */}
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="outline" className="gap-1 text-xs font-medium">
                        <cap.icon className="h-3 w-3" />
                        {cap.label}
                      </Badge>
                      <span
                        className={`text-sm font-semibold w-10 text-right ${
                          state.progress === 100
                            ? "text-emerald-600"
                            : state.progress > 0
                            ? "text-amber-600"
                            : "text-muted-foreground"
                        }`}
                      >
                        {state.progress}%
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </button>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div className="px-4 pb-4">
                      <Separator className="mb-4" />
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">Status:</span>
                          <span
                            className={`text-base font-medium ${
                              state.status === "met"
                                ? "text-emerald-600"
                                : state.status === "partial"
                                ? "text-amber-600"
                                : "text-destructive"
                            }`}
                          >
                            {state.status === "met"
                              ? "Oppfylt"
                              : state.status === "partial"
                              ? "Delvis oppfylt"
                              : "Ikke oppfylt"}
                          </span>
                        </div>

                        {state.status !== "met" && (
                          <div className="rounded-lg bg-muted/50 border border-border p-3">
                            <div className="flex items-start gap-2">
                              <Sparkles className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                              <div>
                                <p className="text-sm font-semibold text-foreground mb-1">
                                  Hva må gjøres?
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {cap.instruction}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {state.status !== "met" && (
                          <Button
                            className="w-full gap-2"
                            variant="outline"
                            onClick={() =>
                              setDocDialog({
                                id: req.requirement_id,
                                name: req.name_no,
                              })
                            }
                          >
                            <Users className="h-4 w-4" />
                            Dokumenter dette kravet
                          </Button>
                        )}

                        {state.status === "met" && (
                          <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800">
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                            <span className="text-sm text-emerald-700 dark:text-emerald-400">
                              Dette kravet er dokumentert og verifisert.
                            </span>
                          </div>
                        )}

                        <p className="text-xs text-muted-foreground font-mono pt-2 border-t border-border">
                          Referanse: {req.requirement_id}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <p>Ingen krav i denne kategorien.</p>
            </div>
          )}
        </div>
      </main>

      {/* Manual documentation dialog */}
      {docDialog && (
        <ManualDocumentationDialog
          open={!!docDialog}
          onOpenChange={(open) => {
            if (!open) setDocDialog(null);
          }}
          requirementId={docDialog.id}
          requirementName={docDialog.name}
          onSave={(status, comment) => handleDocSave(docDialog.id, status)}
        />
      )}
    </div>
  );
};

export default FrameworkDetailPage;
