import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MaturityHistoryChart } from "@/components/trust-controls/MaturityHistoryChart";
import { CreateUserTaskDialog } from "@/components/tasks/CreateUserTaskDialog";
import { RegisterActivityDialog } from "@/components/asset-profile/RegisterActivityDialog";
import { ActivityDetailPanel } from "@/components/asset-profile/ActivityDetailPanel";
import { useUserTasks } from "@/hooks/useUserTasks";
import {
  generateDemoActivities, formatRelativeDate, PHASE_CONFIG, ACTIVITY_COLORS, OUTCOME_COLORS,
  type Phase, type VendorActivity,
} from "@/utils/vendorActivityData";
import {
  FileText, AlertTriangle, UserCheck, ClipboardCheck,
  Package, TrendingUp, Settings, Upload, Eye, Clock, CheckCircle2,
  AlertCircle, Timer, ListTodo, Filter, Mail, Phone, Users, PenLine, ChevronDown,
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

const OUTCOME_ICON = {
  in_progress: Timer, completed: CheckCircle2, needs_followup: AlertCircle,
} as const;

export function VendorActivityTab({ assetId, assetName, baselinePercent = 19, enrichmentPercent = 19, externalActivities = [], onActivityAdded }: VendorActivityTabProps) {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";
  const [phaseFilter, setPhaseFilter] = useState<Phase | "all">("all");
  const [manualActivities, setManualActivities] = useState<VendorActivity[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const demoActivities = useMemo(() => generateDemoActivities(assetId), [assetId]);
  const activities = useMemo(
    () => [...demoActivities, ...manualActivities, ...externalActivities].sort((a, b) => b.date.getTime() - a.date.getTime()),
    [demoActivities, manualActivities, externalActivities]
  );
  const { tasks, createTask } = useUserTasks();
  const vendorTasks = useMemo(() => tasks.filter(t => t.asset_id === assetId && t.status !== "done"), [tasks, assetId]);

  const filtered = useMemo(() =>
    phaseFilter === "all" ? activities : activities.filter(a => a.phase === phaseFilter),
    [activities, phaseFilter]
  );

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

  const toggleExpand = (id: string) => {
    setExpandedId(prev => prev === id ? null : id);
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
                    const OutcomeIcon = OUTCOME_ICON[act.outcomeStatus];
                    const outcomeColor = OUTCOME_COLORS[act.outcomeStatus];
                    const phaseConf = PHASE_CONFIG[act.phase];
                    const isExpanded = expandedId === act.id;

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
                                <div className={`flex items-center gap-1 mt-0.5 ${outcomeColor}`}>
                                  <OutcomeIcon className="h-3 w-3" />
                                  <span className="text-xs font-medium">{isNb ? act.outcomeNb : act.outcomeEn}</span>
                                </div>
                                {act.actor && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    <span className="font-medium text-foreground/80">{act.actor}</span>
                                    {act.actorRole && <span className="text-muted-foreground">, {act.actorRole}</span>}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <Badge variant="outline" className="text-xs whitespace-nowrap">
                                  {formatRelativeDate(act.date, isNb)}
                                </Badge>
                                <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
                              </div>
                            </div>
                          </div>
                        </div>
                        {isExpanded && <ActivityDetailPanel activity={act} />}
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
