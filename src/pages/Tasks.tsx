import { useState, useEffect } from "react";
import { usePageHelpListener } from "@/hooks/usePageHelpListener";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  CheckCircle2, X, AlertTriangle, Clock, HelpCircle,
  Crown, Plus, User, Calendar, ExternalLink, Cpu, Building2,
  FileText, ShieldAlert, ClipboardCheck, Eye, Bot, Play,
  ChevronDown, ChevronUp, Sparkles, ShieldCheck, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Sidebar } from "@/components/Sidebar";
import { useTranslation } from "react-i18next";
import { ContextualHelpPanel } from "@/components/shared/ContextualHelpPanel";
import {
  ClipboardList as ClipboardListHelp,
  Zap,
  Users as UsersHelp,
  MessageCircle,
  Scale,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

// ── Types ──────────────────────────────────────────────────
type TaskCategory = "system" | "leverandør" | "behandling" | "dokument";
type TaskPriority = "høy" | "middels" | "lav";
type TaskStatus = "åpen" | "pågår" | "fullført";

interface AutoTask {
  id: string;
  title: string;
  description: string;
  category: TaskCategory;
  priority: TaskPriority;
  status: TaskStatus;
  assignee: string;
  dueDate: string;
  linkedEntity: string;
  linkedEntityType: TaskCategory;
  source: string;
  aiDraftable: boolean;
  aiAction?: string; // what Lara can do
  actionLabel?: string; // CTA label
  actionRoute?: string; // where the CTA navigates
}

// ── Demo data — 6 realistic AI-detected tasks ─────────────
const autoTasks: AutoTask[] = [
  {
    id: "auto-1",
    title: "Manglende databehandleravtale (DPA)",
    description: "Hubspot er registrert som databehandler men mangler signert databehandleravtale. Dette er påkrevd iht. GDPR Art. 28.",
    category: "leverandør",
    priority: "høy",
    status: "åpen",
    assignee: "Maria Larsen",
    dueDate: "2026-04-18",
    linkedEntity: "Hubspot",
    linkedEntityType: "leverandør",
    source: "Manglende DPA oppdaget av Lara",
    aiDraftable: true,
    aiAction: "Lara kan generere et DPA-utkast basert på Hubspot sine vilkår og sende det til gjennomgang.",
    actionLabel: "Opprett DPA-utkast",
    actionRoute: "/vendors",
  },
  {
    id: "auto-2",
    title: "Behandlingsaktivitet venter godkjenning",
    description: "Behandlingsaktiviteten «Kundeoppfølging via e-post» er opprettet men ikke godkjent av behandlingsansvarlig.",
    category: "behandling",
    priority: "høy",
    status: "åpen",
    assignee: "Erik Solberg",
    dueDate: "2026-04-15",
    linkedEntity: "Kundeoppfølging via e-post",
    linkedEntityType: "behandling",
    source: "Ugodkjent behandlingsaktivitet",
    aiDraftable: false,
    actionLabel: "Gå til godkjenning",
    actionRoute: "/work-areas",
  },
  {
    id: "auto-3",
    title: "Årlig revisjon av SharePoint forfalt",
    description: "Planlagt sikkerhetsrevisjon for SharePoint Online skulle vært gjennomført 01.04.2026. Revidér systemets tilganger og dataflyt.",
    category: "system",
    priority: "høy",
    status: "pågår",
    assignee: "Jonas Hansen",
    dueDate: "2026-04-10",
    linkedEntity: "SharePoint Online",
    linkedEntityType: "system",
    source: "Forfalt revisjonsdato",
    aiDraftable: true,
    aiAction: "Lara kan forberede en revisjonssjekkliste med tilgangsoversikt og dataflyt-kartlegging basert på systemets konfigurasjon.",
    actionLabel: "Start revisjon",
    actionRoute: "/systems",
  },
  {
    id: "auto-4",
    title: "Manglende risikovurdering for nytt system",
    description: "Systemet «Slack Enterprise» ble lagt til for 14 dager siden uten at risikovurdering er gjennomført.",
    category: "system",
    priority: "middels",
    status: "åpen",
    assignee: "Anna Kristiansen",
    dueDate: "2026-04-22",
    linkedEntity: "Slack Enterprise",
    linkedEntityType: "system",
    source: "System uten risikovurdering",
    aiDraftable: true,
    aiAction: "Lara kan gjennomføre en foreløpig risikovurdering basert på systemets egenskaper og generere et utkast.",
    actionLabel: "Start risikovurdering",
    actionRoute: "/systems",
  },
  {
    id: "auto-5",
    title: "Leverandør mangler oppdatert sikkerhetsdokumentasjon",
    description: "Amazon Web Services har utløpt SOC 2-rapport (sist oppdatert jan. 2025). Be om oppdatert dokumentasjon.",
    category: "leverandør",
    priority: "middels",
    status: "åpen",
    assignee: "Maria Larsen",
    dueDate: "2026-04-25",
    linkedEntity: "Amazon Web Services",
    linkedEntityType: "leverandør",
    source: "Utløpt sikkerhetsdokumentasjon",
    aiDraftable: true,
    aiAction: "Lara kan sende en automatisk forespørsel til leverandøren om oppdatert SOC 2-dokumentasjon.",
    actionLabel: "Send forespørsel",
    actionRoute: "/vendors",
  },
  {
    id: "auto-6",
    title: "DPIA kreves for ny behandlingsaktivitet",
    description: "Behandlingsaktiviteten «AI-basert kundeanalyse» innebærer profilering av personopplysninger og krever DPIA iht. GDPR Art. 35.",
    category: "behandling",
    priority: "lav",
    status: "åpen",
    assignee: "Erik Solberg",
    dueDate: "2026-05-01",
    linkedEntity: "AI-basert kundeanalyse",
    linkedEntityType: "behandling",
    source: "DPIA påkrevd – profilering oppdaget",
    aiDraftable: true,
    aiAction: "Lara kan generere et DPIA-utkast basert på behandlingsaktivitetens egenskaper og risikoprofil.",
    actionLabel: "Start DPIA",
    actionRoute: "/work-areas",
  },
];

// ── Helpers ────────────────────────────────────────────────
const priorityConfig: Record<TaskPriority, { label: string; className: string }> = {
  høy: { label: "Høy", className: "bg-destructive/15 text-destructive border-destructive/30" },
  middels: { label: "Middels", className: "bg-warning/15 text-warning border-warning/30" },
  lav: { label: "Lav", className: "bg-muted text-muted-foreground border-border" },
};

const statusConfig: Record<TaskStatus, { label: string; className: string }> = {
  åpen: { label: "Åpen", className: "bg-muted text-foreground" },
  pågår: { label: "Pågår", className: "bg-primary/15 text-primary" },
  fullført: { label: "Fullført", className: "bg-green-500/15 text-green-700 dark:text-green-400" },
};

const categoryConfig: Record<TaskCategory, { label: string; icon: typeof Cpu }> = {
  system: { label: "System", icon: Cpu },
  leverandør: { label: "Leverandør", icon: Building2 },
  behandling: { label: "Behandling", icon: FileText },
  dokument: { label: "Dokument", icon: ClipboardCheck },
};

type ViewFilter = "alle" | "mine";
type CategoryFilter = "alle" | TaskCategory;

const isHighRisk = (priority: TaskPriority) => priority === "høy";

// ── Component ──────────────────────────────────────────────
export default function Tasks() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [helpOpen, setHelpOpen] = useState(false);
  usePageHelpListener(setHelpOpen);
  const [viewFilter, setViewFilter] = useState<ViewFilter>("alle");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("alle");
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | "alle">("alle");
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  const [approvalTask, setApprovalTask] = useState<AutoTask | null>(null);
  const [aiProcessing, setAiProcessing] = useState<string | null>(null);

  // Simulated current user
  const currentUser = "Maria Larsen";

  // Filter logic
  const filteredTasks = autoTasks.filter((task) => {
    if (viewFilter === "mine" && task.assignee !== currentUser) return false;
    if (categoryFilter !== "alle" && task.category !== categoryFilter) return false;
    if (priorityFilter !== "alle" && task.priority !== priorityFilter) return false;
    return true;
  });

  const counts = {
    alle: autoTasks.length,
    mine: autoTasks.filter((t) => t.assignee === currentUser).length,
    system: autoTasks.filter((t) => t.category === "system").length,
    leverandør: autoTasks.filter((t) => t.category === "leverandør").length,
    behandling: autoTasks.filter((t) => t.category === "behandling").length,
  };

  const formatDate = (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString("nb-NO", { day: "numeric", month: "short" });
  };

  const isOverdue = (d: string, status: TaskStatus) =>
    status !== "fullført" && new Date(d) < new Date();

  const handleLetLaraDo = (task: AutoTask) => {
    if (isHighRisk(task.priority)) {
      setApprovalTask(task);
    } else {
      startAiDraft(task);
    }
  };

  const startAiDraft = (task: AutoTask) => {
    setAiProcessing(task.id);
    // Simulate AI processing
    setTimeout(() => {
      setAiProcessing(null);
      toast.success(`Lara har opprettet utkast for «${task.title}»`, {
        description: "Gå til utkastet for å gjennomgå og godkjenne.",
        action: {
          label: "Se utkast",
          onClick: () => navigate(task.actionRoute || "/tasks"),
        },
      });
    }, 2500);
  };

  const handleApproveAndRun = () => {
    if (approvalTask) {
      startAiDraft(approvalTask);
      setApprovalTask(null);
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="flex-1 overflow-y-auto pt-11">
        <div className="container mx-auto px-4 pt-8 pb-4 sm:p-6 max-w-5xl">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between mb-2">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">{t("nav.tasks")}</h1>
              <Badge variant="secondary" className="text-xs">
                {autoTasks.filter((t) => t.status !== "fullført").length} åpne
              </Badge>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 w-full sm:w-auto"
              onClick={() =>
                navigate("/subscriptions")
              }
            >
              <Plus className="h-4 w-4" />
              Opprett oppgave
              <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30 text-[10px] px-1.5 py-0">
                <Crown className="h-2.5 w-2.5 mr-0.5" />
                Premium
              </Badge>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mb-6">
            Automatisk genererte oppgaver basert på mangler Lara har oppdaget i dine systemer, leverandører og behandlingsaktiviteter.
          </p>

          {/* Filters */}
          <div className="flex items-center gap-2 flex-wrap mb-6">
            {(["alle", "mine"] as ViewFilter[]).map((v) => (
              <button
                key={v}
                onClick={() => setViewFilter(v)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  viewFilter === v
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {v === "alle" ? `Alle (${counts.alle})` : `Mine (${counts.mine})`}
              </button>
            ))}

            <div className="w-px h-4 bg-border mx-1" />

            {(["alle", "system", "leverandør", "behandling"] as CategoryFilter[]).map((c) => {
              const catConf = c !== "alle" ? categoryConfig[c] : null;
              const CatIcon = catConf?.icon;
              const count = c === "alle" ? null : counts[c as keyof typeof counts];
              return (
                <button
                  key={c}
                  onClick={() => setCategoryFilter(c)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors flex items-center gap-1.5 ${
                    categoryFilter === c
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {CatIcon && <CatIcon className="h-3 w-3" />}
                  {catConf?.label || "Alle typer"}
                  {count !== null && ` (${count})`}
                </button>
              );
            })}

            <div className="w-px h-4 bg-border mx-1" />

            {(["alle", "høy", "middels", "lav"] as (TaskPriority | "alle")[]).map((p) => (
              <button
                key={p}
                onClick={() => setPriorityFilter(p)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  priorityFilter === p
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {p === "alle" ? "Alle prioriteter" : priorityConfig[p].label}
              </button>
            ))}

            {(viewFilter !== "alle" || categoryFilter !== "alle" || priorityFilter !== "alle") && (
              <button
                onClick={() => {
                  setViewFilter("alle");
                  setCategoryFilter("alle");
                  setPriorityFilter("alle");
                }}
                className="rounded-full px-2 py-1 text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                Nullstill
              </button>
            )}
          </div>

          {/* Result count */}
          <p className="text-xs text-muted-foreground mb-4">
            Viser {filteredTasks.length} av {autoTasks.length} oppgaver
          </p>

          {/* Task list */}
          <div className="space-y-3">
            {filteredTasks.map((task) => {
              const prio = priorityConfig[task.priority];
              const stat = statusConfig[task.status];
              const cat = categoryConfig[task.category];
              const CatIcon = cat.icon;
              const overdue = isOverdue(task.dueDate, task.status);
              const isExpanded = expandedTask === task.id;
              const isProcessing = aiProcessing === task.id;

              return (
                <Card
                  key={task.id}
                  className={`transition-all hover:shadow-sm ${
                    task.status === "fullført" ? "opacity-60" : ""
                  }`}
                >
                  <div
                    className="p-4 cursor-pointer"
                    onClick={() => setExpandedTask(isExpanded ? null : task.id)}
                  >
                    <div className="flex items-start gap-4">
                      {/* Category icon */}
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                        <CatIcon className="h-4 w-4 text-muted-foreground" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <Badge variant="outline" className={`text-[10px] ${prio.className}`}>
                            {prio.label}
                          </Badge>
                          <Badge variant="outline" className={`text-[10px] ${stat.className}`}>
                            {stat.label}
                          </Badge>
                          {overdue && (
                            <Badge variant="destructive" className="text-[10px] gap-1">
                              <AlertTriangle className="h-2.5 w-2.5" />
                              Forfalt
                            </Badge>
                          )}
                          {task.aiDraftable && (
                            <Badge variant="outline" className="text-[10px] gap-1 bg-primary/5 text-primary border-primary/20">
                              <Sparkles className="h-2.5 w-2.5" />
                              Lara kan hjelpe
                            </Badge>
                          )}
                        </div>

                        <h3 className="text-sm font-semibold text-foreground mb-1">{task.title}</h3>
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                          {task.description}
                        </p>

                        {/* Meta row */}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {task.assignee}
                          </span>
                          <span className={`flex items-center gap-1 ${overdue ? "text-destructive" : ""}`}>
                            <Calendar className="h-3 w-3" />
                            {formatDate(task.dueDate)}
                          </span>
                          <span className="flex items-center gap-1">
                            <CatIcon className="h-3 w-3" />
                            {task.linkedEntity}
                          </span>
                          <span className="flex items-center gap-1 text-primary/70">
                            <Eye className="h-3 w-3" />
                            {task.source}
                          </span>
                        </div>
                      </div>

                      {/* Expand indicator */}
                      <div className="shrink-0 text-muted-foreground">
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </div>
                    </div>
                  </div>

                  {/* Expanded action panel */}
                  {isExpanded && task.status !== "fullført" && (
                    <div className="px-4 pb-4 pt-0 border-t border-border/50">
                      <div className="pt-4 space-y-3">
                        {/* AI action info */}
                        {task.aiDraftable && task.aiAction && (
                          <div className="flex items-start gap-3 p-3 rounded-lg bg-primary/5 border border-primary/10">
                            <Bot className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-foreground mb-1">Lara kan gjøre dette for deg</p>
                              <p className="text-xs text-muted-foreground">{task.aiAction}</p>
                              {isHighRisk(task.priority) && (
                                <div className="flex items-center gap-1.5 mt-2 text-xs text-amber-600 dark:text-amber-400">
                                  <ShieldCheck className="h-3.5 w-3.5" />
                                  Høy prioritet — krever din godkjenning før Lara utfører
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Action buttons */}
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Primary CTA */}
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(task.actionRoute || "/tasks");
                            }}
                            className="gap-2"
                          >
                            <Play className="h-3.5 w-3.5" />
                            {task.actionLabel || "Start oppgave"}
                          </Button>

                          {/* Let Lara do it */}
                          {task.aiDraftable && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleLetLaraDo(task);
                              }}
                              disabled={isProcessing}
                              className="gap-2"
                            >
                              {isProcessing ? (
                                <>
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  Lara jobber…
                                </>
                              ) : (
                                <>
                                  <Sparkles className="h-3.5 w-3.5" />
                                  La Lara lage utkast
                                </>
                              )}
                            </Button>
                          )}

                          {/* Go to entity */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (task.linkedEntityType === "system") navigate("/systems");
                              else if (task.linkedEntityType === "leverandør") navigate("/vendors");
                              else navigate("/work-areas");
                            }}
                            className="gap-1 text-muted-foreground"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            Gå til {task.linkedEntity}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}

            {filteredTasks.length === 0 && (
              <div className="text-center py-12 text-sm text-muted-foreground">
                <CheckCircle2 className="h-8 w-8 mx-auto mb-3 text-green-500" />
                <p className="font-medium text-foreground">Ingen oppgaver matcher filteret</p>
                <p className="mt-1">Prøv å endre filtrene, eller bra jobba — alt er i orden!</p>
              </div>
            )}
          </div>

          {/* Approval dialog for high-risk tasks */}
          <AlertDialog open={!!approvalTask} onOpenChange={(open) => !open && setApprovalTask(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-amber-500" />
                  Godkjenning kreves
                </AlertDialogTitle>
                <AlertDialogDescription asChild>
                  <div className="space-y-3">
                    <p>
                      Denne oppgaven har <strong>høy prioritet</strong> og krever din godkjenning før Lara kan opprette et utkast.
                    </p>
                    {approvalTask && (
                      <div className="p-3 rounded-lg bg-muted/50 border">
                        <p className="text-sm font-medium text-foreground">{approvalTask.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">{approvalTask.aiAction}</p>
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Lara vil opprette et utkast som du kan gjennomgå og redigere før det ferdigstilles. Ingenting publiseres uten din endelige godkjenning.
                    </p>
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Avbryt</AlertDialogCancel>
                <AlertDialogAction onClick={handleApproveAndRun} className="gap-2">
                  <Sparkles className="h-4 w-4" />
                  Godkjenn og start
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Help panel */}
          <ContextualHelpPanel
            open={helpOpen}
            onOpenChange={setHelpOpen}
            icon={ClipboardListHelp}
            title={t("nav.tasks")}
            description="Oppgaveoversikten viser handlinger Lara AI har oppdaget at du bør gjennomføre. Oppgavene genereres automatisk basert på mangler i systemer, leverandører og behandlingsaktiviteter."
            itemsHeading="Slik fungerer det"
            items={[
              { icon: Zap, title: "Automatisk oppdagelse", description: "Lara analyserer dine systemer og leverandører og oppretter oppgaver når noe mangler — f.eks. DPA, risikovurdering eller godkjenning." },
              { icon: UsersHelp, title: "Mine vs. alle oppgaver", description: "Filtrer mellom dine egne oppgaver og alle oppgaver i organisasjonen. Compliance-ansvarlige ser alt." },
              { icon: ClipboardListHelp, title: "Filtrer etter type", description: "Se kun oppgaver knyttet til systemer, leverandører eller behandlingsaktiviteter." },
            ]}
            whyTitle="Hvorfor er dette viktig?"
            whyDescription="Automatisk oppdagelse av mangler sikrer at ingenting glipper. Hver oppgave er koblet til en konkret eiendel slik at du vet nøyaktig hvor du skal handle."
            stepsHeading="Kom i gang"
            steps={[
              { text: "Se gjennom oppgavene — de med høy prioritet bør håndteres først" },
              { text: "Klikk på en oppgave for å se handlingsalternativer" },
              { text: "Bruk «La Lara lage utkast» for å la AI gjøre jobben for deg" },
            ]}
            actions={[
              { icon: Scale, title: "Se samsvarsrapport", description: "Få full oversikt over etterlevelse på tvers av regelverk.", onClick: () => navigate("/reports/compliance") },
            ]}
            laraSuggestions={[
              { label: "Hjelp meg prioritere oppgavene mine", message: "Hjelp meg med å prioritere og håndtere oppgavene mine" },
              { label: "Hva bør jeg gjøre først?", message: "Hvilke compliance-oppgaver bør jeg prioritere først?" },
              { label: "Forklar denne oppgaven", message: "Kan du forklare hva som kreves for å løse en manglende databehandleravtale?" },
            ]}
            laraSuggestion="Hjelp meg med å prioritere oppgavene mine"
          />
        </div>
      </main>
    </div>
  );
}