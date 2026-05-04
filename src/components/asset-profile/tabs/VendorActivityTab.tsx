import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { CreateUserTaskDialog } from "@/components/tasks/CreateUserTaskDialog";
import { RegisterActivityDialog } from "@/components/asset-profile/RegisterActivityDialog";
import { ActivityDetailPanel } from "@/components/asset-profile/ActivityDetailPanel";
import { InlineStatusEditor } from "@/components/asset-profile/InlineStatusEditor";
import { useUserTasks } from "@/hooks/useUserTasks";
import { ActivityActionAffordance, shouldShowAction } from "@/components/asset-profile/ActivityActionAffordance";
import {
  generateDemoActivities, formatRelativeDate, PHASE_CONFIG, ACTIVITY_COLORS, ACTIVITY_STATUS_CONFIG,
  type Phase, type VendorActivity, type ActivityStatus,
} from "@/utils/vendorActivityData";
import { cn } from "@/lib/utils";
import {
  FileText, AlertTriangle, UserCheck, ClipboardCheck,
  Package, TrendingUp, Settings, Upload, Eye, Clock,
  ListTodo, Mail, Phone, Users, PenLine, ChevronDown,
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
    <div className="space-y-4">
      {/* Open Tasks (compact) */}
      {vendorTasks.length > 0 && (
        <div className="rounded-lg border bg-card p-3">
          <div className="flex items-center gap-2 mb-2">
            <ListTodo className="h-3.5 w-3.5 text-primary" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {isNb ? `Åpne oppgaver · ${vendorTasks.length}` : `Open tasks · ${vendorTasks.length}`}
            </h3>
          </div>
          <div className="space-y-1">
            {vendorTasks.map(task => (
              <div key={task.id} className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-muted/40">
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
        </div>
      )}

      {/* Activity Timeline */}
      <div className="rounded-lg border bg-card">
        <div className="flex items-center justify-between flex-wrap gap-2 p-4 pb-2">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            {isNb ? "Aktivitetslogg" : "Activity log"}
            <span className="text-muted-foreground font-normal">· {activities.length}</span>
          </h3>
          <div className="flex items-center gap-1.5">
            <RegisterActivityDialog onSubmit={(act) => { setManualActivities(prev => [act, ...prev]); onActivityAdded?.(act); }} />
            <CreateUserTaskDialog
              onSubmit={(task) => createTask.mutate({ ...task, asset_id: assetId })}
              isLoading={createTask.isPending}
            />
          </div>
        </div>

        {/* Status filters only — phase filters removed for clarity */}
        <div className="flex items-center gap-1.5 px-4 pb-3 flex-wrap">
          {statusFilters.map(sf => {
            const isActive = statusFilter === sf.key;
            return (
              <button
                key={sf.key}
                type="button"
                onClick={() => setStatusFilter(sf.key)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-all",
                  isActive
                    ? "border-foreground/40 bg-foreground/5 text-foreground"
                    : "border-border bg-background text-muted-foreground hover:text-foreground hover:border-primary/40"
                )}
              >
                {sf.dot && <span className={cn("h-1.5 w-1.5 rounded-full", sf.dot)} />}
                <span>{isNb ? sf.nb : sf.en}</span>
                <span className="text-muted-foreground/70">· {sf.count}</span>
              </button>
            );
          })}
        </div>
        <div className="px-4 pb-4">

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
                          <div className="flex-1 min-w-0 pb-4">
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1.5 sm:gap-2">
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-foreground break-words">
                                  {isNb ? act.titleNb : act.titleEn}
                                </p>
                                <div className="flex items-center gap-1.5 flex-wrap mt-1">
                                  <Badge variant="outline" className={`text-[11px] px-1.5 py-0 border-0 ${phaseConf.color}`}>
                                    {isNb ? phaseConf.nb : phaseConf.en}
                                  </Badge>
                                  {act.linkedGapId && (
                                    <Badge className="text-[11px] px-1.5 py-0 bg-success/15 text-success border border-success/20 hover:bg-success/20">
                                      {isNb ? "Lukker gap" : "Closes gap"}
                                    </Badge>
                                  )}
                                  {act.isManual && !act.linkedGapId && (
                                    <Badge variant="outline" className="text-[11px] px-1.5 py-0 border-dashed text-muted-foreground">
                                      {isNb ? "Manuell" : "Manual"}
                                    </Badge>
                                  )}
                                  <span className="text-[11px] text-muted-foreground whitespace-nowrap sm:hidden">
                                    · {formatRelativeDate(act.date, isNb)}
                                  </span>
                                </div>
                                {act.actor && (
                                  <p className="text-xs text-muted-foreground mt-1 break-words">
                                    <span className="font-medium text-foreground/80">{act.actor}</span>
                                    {act.actorRole && <span className="text-muted-foreground">, {act.actorRole}</span>}
                                  </p>
                                )}
                                {shouldShowAction(act.outcomeStatus) && (
                                  <ActivityActionAffordance
                                    activity={act}
                                    onLaraStart={() => updateActivity(act.id, { outcomeStatus: "in_progress", outcomeNb: ACTIVITY_STATUS_CONFIG.in_progress.nb, outcomeEn: ACTIVITY_STATUS_CONFIG.in_progress.en })}
                                  />
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0 self-start">
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); toggleStatusEditor(act.id); }}
                                  className={cn(
                                    "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider transition-all hover:opacity-80",
                                    statusConf.pill
                                  )}
                                  aria-label={isNb ? "Endre status" : "Change status"}
                                >
                                  <span className={cn("h-1.5 w-1.5 rounded-full", statusConf.dot)} />
                                  {isNb ? statusConf.nb : statusConf.en}
                                  <ChevronDown className={cn("h-3 w-3 transition-transform", isStatusEditing && "rotate-180")} />
                                </button>
                                <span className="hidden sm:inline text-xs text-muted-foreground whitespace-nowrap">
                                  {formatRelativeDate(act.date, isNb)}
                                </span>
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
        </div>
      </div>
    </div>
  );
}
