import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MaturityHistoryChart } from "@/components/trust-controls/MaturityHistoryChart";
import { CreateUserTaskDialog } from "@/components/tasks/CreateUserTaskDialog";
import { RegisterActivityDialog } from "@/components/asset-profile/RegisterActivityDialog";
import { ActivityDetailPanel } from "@/components/asset-profile/ActivityDetailPanel";
import { InlineStatusEditor } from "@/components/asset-profile/InlineStatusEditor";
import { useUserTasks } from "@/hooks/useUserTasks";
import {
  generateDemoActivities, formatRelativeDate, PHASE_CONFIG, ACTIVITY_COLORS, ACTIVITY_STATUS_CONFIG,
  type Phase, type VendorActivity, type ActivityStatus,
} from "@/utils/vendorActivityData";
import { cn } from "@/lib/utils";
import {
  FileText, AlertTriangle, UserCheck, ClipboardCheck,
  Package, TrendingUp, Settings, Upload, Eye, Clock,
  ListTodo, Filter, Mail, Phone, Users, PenLine, ChevronDown, Sparkles,
} from "lucide-react";

interface VendorActivityTabProps {
  assetId: string;
  assetName: string;
  baselinePercent?: number;
  enrichmentPercent?: number;
  externalActivities?: VendorActivity[];
  onActivityAdded?: (activity: VendorActivity) => void;
}

const ACTIVITY_ICONS = {
  document: FileText, risk: AlertTriangle, incident: AlertTriangle,
  assignment: UserCheck, review: ClipboardCheck, delivery: Package,
  maturity: TrendingUp, setting: Settings, upload: Upload, view: Eye,
  email: Mail, phone: Phone, meeting: Users, manual: PenLine,
} as const;

type StatusFilter = "all" | ActivityStatus;

export function VendorActivityTab({ assetId, assetName, baselinePercent = 19, enrichmentPercent = 19, externalActivities = [], onActivityAdded }: VendorActivityTabProps) {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";
  const [phaseFilter, setPhaseFilter] = useState<Phase | "all">("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [manualActivities, setManualActivities] = useState<VendorActivity[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [statusEditorId, setStatusEditorId] = useState<string | null>(null);
  const [activityOverrides, setActivityOverrides] = useState<Record<string, Partial<VendorActivity>>>({});

  const demoActivities = useMemo(() => generateDemoActivities(assetId), [assetId]);
  const activities = useMemo(
    () => [...demoActivities, ...manualActivities, ...externalActivities]
      .map(a => activityOverrides[a.id] ? { ...a, ...activityOverrides[a.id] } : a)
      .sort((a, b) => b.date.getTime() - a.date.getTime()),
    [demoActivities, manualActivities, externalActivities, activityOverrides]
  );

  const updateActivity = (id: string, patch: Partial<VendorActivity>) => {
    setActivityOverrides(prev => ({ ...prev, [id]: { ...(prev[id] ?? {}), ...patch } }));
  };

  const handleStatusChange = (act: VendorActivity, next: ActivityStatus, comment?: string) => {
    if (next === act.outcomeStatus && !comment) {
      setStatusEditorId(null);
      return;
    }
    const conf = ACTIVITY_STATUS_CONFIG[next];
    const historyEntry = {
      from: act.outcomeStatus,
      to: next,
      comment,
      changedAt: new Date(),
      changedBy: isNb ? "Deg" : "You",
    };
    updateActivity(act.id, {
      outcomeStatus: next,
      outcomeNb: conf.nb,
      outcomeEn: conf.en,
      statusHistory: [...(act.statusHistory ?? []), historyEntry],
    });
    setStatusEditorId(null);
  };

  const { tasks, createTask } = useUserTasks();
  const vendorTasks = useMemo(() => tasks.filter(t => t.asset_id === assetId && t.status !== "done"), [tasks, assetId]);

  const statusCounts = useMemo(() => {
    const c = { open: 0, in_progress: 0, closed: 0, not_relevant: 0 } as Record<ActivityStatus, number>;
    for (const a of activities) c[a.outcomeStatus]++;
    return c;
  }, [activities]);

  const closedLast30 = useMemo(() => {
    const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
    return activities.filter(a => a.outcomeStatus === "closed" && a.date.getTime() >= cutoff).length;
  }, [activities]);

  const filtered = useMemo(() => {
    return activities.filter(a => {
      if (phaseFilter !== "all" && a.phase !== phaseFilter) return false;
      if (statusFilter !== "all" && a.outcomeStatus !== statusFilter) return false;
      return true;
    });
  }, [activities, phaseFilter, statusFilter]);

  const grouped = useMemo(() => {
    const groups: { label: string; items: VendorActivity[] }[] = [];
    let currentLabel = "";
    for (const act of filtered) {
      const label = act.date.toLocaleDateString(isNb ? "nb-NO" : "en-GB", { month: "long", year: "numeric" });
      const cap = label.charAt(0).toUpperCase() + label.slice(1);
      if (cap !== currentLabel) { currentLabel = cap; groups.push({ label: cap, items: [] }); }
      groups[groups.length - 1].items.push(act);
    }
    return groups;
  }, [filtered, isNb]);

  const lastActivity = activities[0];
  const lastPhase = lastActivity ? PHASE_CONFIG[lastActivity.phase] : null;

  const filterButtons: { key: Phase | "all"; nb: string; en: string }[] = [
    { key: "all", nb: "Alle", en: "All" },
    { key: "pre_assessment", nb: "Vurdering", en: "Pre-contract" },
    { key: "onboarding", nb: "Onboarding", en: "Onboarding" },
    { key: "ongoing", nb: "Løpende", en: "Ongoing" },
    { key: "audit", nb: "Revisjon", en: "Audit" },
    { key: "incident", nb: "Hendelser", en: "Incidents" },
    { key: "termination", nb: "Avslutning", en: "Termination" },
  ];

  const statusFilters: { key: StatusFilter; nb: string; en: string; count: number; dot?: string }[] = [
    { key: "all", nb: "Alle", en: "All", count: activities.length },
    { key: "open", nb: "Åpne", en: "Open", count: statusCounts.open, dot: ACTIVITY_STATUS_CONFIG.open.filterDot },
    { key: "in_progress", nb: "Under oppfølging", en: "In progress", count: statusCounts.in_progress, dot: ACTIVITY_STATUS_CONFIG.in_progress.filterDot },
    { key: "closed", nb: "Lukket", en: "Closed", count: statusCounts.closed, dot: ACTIVITY_STATUS_CONFIG.closed.filterDot },
    ...(statusCounts.not_relevant > 0 ? [{ key: "not_relevant" as StatusFilter, nb: "Ikke relevant", en: "Not relevant", count: statusCounts.not_relevant, dot: ACTIVITY_STATUS_CONFIG.not_relevant.filterDot }] : []),
  ];

  const toggleExpand = (id: string) => {
    setExpandedId(prev => prev === id ? null : id);
    if (statusEditorId === id) setStatusEditorId(null);
  };

  const toggleStatusEditor = (id: string) => {
    setStatusEditorId(prev => prev === id ? null : id);
    if (expandedId === id) setExpandedId(null);
  };

  return (
    <div className="space-y-6">
      {/* Maturity History Chart */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            {isNb ? "Modenhetsutvikling" : "Maturity Development"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <MaturityHistoryChart assetId={assetId} baselinePercent={baselinePercent} enrichmentPercent={enrichmentPercent} />
        </CardContent>
      </Card>

      {/* Status Summary */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {isNb ? "Nåværende fase" : "Current phase"}
              </p>
              {lastPhase && (
                <Badge className={`${lastPhase.color} border-0`}>
                  {isNb ? lastPhase.nb : lastPhase.en}
                </Badge>
              )}
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {isNb ? "Siste aktivitet" : "Last activity"}
              </p>
              {lastActivity && (
                <div>
                  <p className="text-sm font-medium">{isNb ? lastActivity.titleNb : lastActivity.titleEn}</p>
                  <p className="text-xs text-muted-foreground">
                    {lastActivity.actor}, {lastActivity.actorRole} — {formatRelativeDate(lastActivity.date, isNb)}
                  </p>
                </div>
              )}
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {isNb ? "Neste planlagt" : "Next planned"}
              </p>
              <p className="text-sm font-medium">{isNb ? "Årlig gjennomgang" : "Annual review"}</p>
              <p className="text-xs text-muted-foreground">Q2 2026</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Open Tasks */}
      {vendorTasks.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <ListTodo className="h-4 w-4 text-primary" />
              {isNb ? `Åpne oppgaver (${vendorTasks.length})` : `Open tasks (${vendorTasks.length})`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {vendorTasks.map(task => (
                <div key={task.id} className="flex items-center justify-between rounded-md border p-2.5 text-sm">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{task.title}</p>
                    {task.assignee && <p className="text-xs text-muted-foreground">{task.assignee}</p>}
                  </div>
                  {task.due_date && (
                    <Badge variant="outline" className="text-xs shrink-0 ml-2">
                      {new Date(task.due_date).toLocaleDateString(isNb ? "nb-NO" : "en-GB")}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Activity Timeline */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              {isNb ? "Aktivitetslogg" : "Activity Log"}
            </CardTitle>
            <div className="flex items-center gap-2">
              <RegisterActivityDialog onSubmit={(act) => { setManualActivities(prev => [act, ...prev]); onActivityAdded?.(act); }} />
              <CreateUserTaskDialog
                onSubmit={(task) => createTask.mutate({ ...task, asset_id: assetId })}
                isLoading={createTask.isPending}
              />
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            {isNb
              ? "Sporbar oversikt over alle endringer, hendelser og oppdateringer knyttet til denne leverandøren."
              : "Traceable overview of all changes, events, and updates related to this vendor."}
          </p>
          {/* Mynder summary line */}
          <div className="mt-3 flex items-center gap-2 flex-wrap text-xs">
            <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
            <span className="text-muted-foreground font-medium">{isNb ? "Mynder ser:" : "Mynder sees:"}</span>
            <span className="text-destructive font-semibold">
              {statusCounts.open} {isNb ? (statusCounts.open === 1 ? "åpent gap" : "åpne gap") : (statusCounts.open === 1 ? "open gap" : "open gaps")}
            </span>
            <span className="text-muted-foreground">·</span>
            <span className="text-warning font-semibold">
              {statusCounts.in_progress} {isNb ? "under oppfølging" : "in progress"}
            </span>
            <span className="text-muted-foreground">·</span>
            <span className="text-success font-semibold">
              {closedLast30} {isNb ? `lukket siste 30 dg` : `closed last 30 days`}
            </span>
            <span className="ml-auto text-muted-foreground">{isNb ? "Oppdatert nå" : "Updated now"}</span>
          </div>

          {/* Status filters */}
          <div className="flex items-center gap-1.5 pt-3 flex-wrap">
            {statusFilters.map(sf => {
              const isActive = statusFilter === sf.key;
              return (
                <button
                  key={sf.key}
                  type="button"
                  onClick={() => setStatusFilter(sf.key)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-all",
                    isActive
                      ? "border-foreground/40 bg-foreground/5 text-foreground"
                      : "border-border bg-background text-muted-foreground hover:text-foreground hover:border-primary/40"
                  )}
                >
                  {sf.dot && <span className={cn("h-1.5 w-1.5 rounded-full", sf.dot)} />}
                  <span>{isNb ? sf.nb : sf.en}</span>
                  <span className="text-muted-foreground">· {sf.count}</span>
                </button>
              );
            })}
          </div>

          {/* Phase filters */}
          <div className="flex items-center gap-1.5 pt-2 flex-wrap">
            <Filter className="h-3.5 w-3.5 text-muted-foreground" />
            {filterButtons.map(fb => (
              <Button
                key={fb.key}
                variant={phaseFilter === fb.key ? "default" : "outline"}
                size="sm"
                className="h-7 text-xs"
                onClick={() => setPhaseFilter(fb.key)}
              >
                {isNb ? fb.nb : fb.en}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {grouped.map((group) => (
              <div key={group.label}>
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 sticky top-0 bg-card z-10 py-1">
                  {group.label}
                </h4>
                <div className="space-y-0">
                  {group.items.map((act, idx) => {
                    const Icon = ACTIVITY_ICONS[act.type];
                    const colorClass = ACTIVITY_COLORS[act.type];
                    const isLast = idx === group.items.length - 1;
                    const statusConf = ACTIVITY_STATUS_CONFIG[act.outcomeStatus];
                    const phaseConf = PHASE_CONFIG[act.phase];
                    const isExpanded = expandedId === act.id;
                    const isStatusEditing = statusEditorId === act.id;

                    return (
                      <div key={act.id}>
                        <div
                          className={`flex gap-3 group cursor-pointer rounded-md hover:bg-muted/40 transition-colors -mx-2 px-2 py-0.5 ${act.linkedGapId ? "border-l-2 border-success bg-success/5" : ""}`}
                          onClick={() => toggleExpand(act.id)}
                        >
                          <div className="flex flex-col items-center">
                            <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${colorClass}`}>
                              <Icon className="h-4 w-4" />
                            </div>
                            {!isLast && <div className="w-px flex-1 bg-border min-h-[16px]" />}
                          </div>
                          <div className="flex-1 pb-4">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="text-sm font-medium text-foreground">
                                    {isNb ? act.titleNb : act.titleEn}
                                  </p>
                                  <Badge variant="outline" className={`text-[13px] px-1.5 py-0 border-0 ${phaseConf.color}`}>
                                    {isNb ? phaseConf.nb : phaseConf.en}
                                  </Badge>
                                  {act.linkedGapId && (
                                    <Badge className="text-[13px] px-1.5 py-0 bg-success/15 text-success border border-success/20 hover:bg-success/20">
                                      {isNb ? "Lukker gap" : "Closes gap"}
                                    </Badge>
                                  )}
                                  {act.isManual && !act.linkedGapId && (
                                    <Badge variant="outline" className="text-[13px] px-1.5 py-0 border-dashed text-muted-foreground">
                                      {isNb ? "Manuell" : "Manual"}
                                    </Badge>
                                  )}
                                </div>
                                {act.actor && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    <span className="font-medium text-foreground/80">{act.actor}</span>
                                    {act.actorRole && <span className="text-muted-foreground">, {act.actorRole}</span>}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); toggleStatusEditor(act.id); }}
                                  className={cn(
                                    "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider transition-all hover:opacity-80",
                                    statusConf.pill
                                  )}
                                  aria-label={isNb ? "Endre status" : "Change status"}
                                >
                                  <span className={cn("h-1.5 w-1.5 rounded-full", statusConf.dot)} />
                                  {isNb ? statusConf.nb : statusConf.en}
                                  <ChevronDown className={cn("h-3 w-3 transition-transform", isStatusEditing && "rotate-180")} />
                                </button>
                                <Badge variant="outline" className="text-xs whitespace-nowrap">
                                  {formatRelativeDate(act.date, isNb)}
                                </Badge>
                                <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
                              </div>
                            </div>
                          </div>
                        </div>
                        {isStatusEditing && (
                          <InlineStatusEditor
                            currentStatus={act.outcomeStatus}
                            onSave={(next, comment) => handleStatusChange(act, next, comment)}
                            onCancel={() => setStatusEditorId(null)}
                          />
                        )}
                        {isExpanded && <ActivityDetailPanel activity={act} onUpdate={(patch) => updateActivity(act.id, patch)} />}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
