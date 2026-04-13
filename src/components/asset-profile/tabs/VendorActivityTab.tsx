import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MaturityHistoryChart } from "@/components/trust-controls/MaturityHistoryChart";
import { CreateUserTaskDialog } from "@/components/tasks/CreateUserTaskDialog";
import { useUserTasks } from "@/hooks/useUserTasks";
import {
  FileText, ShieldCheck, AlertTriangle, UserCheck, ClipboardCheck,
  Package, TrendingUp, Settings, Upload, Eye, Clock, CheckCircle2,
  AlertCircle, Timer, ListTodo, Filter,
} from "lucide-react";

interface VendorActivityTabProps {
  assetId: string;
  assetName: string;
  baselinePercent?: number;
  enrichmentPercent?: number;
}

type ActivityType = "document" | "risk" | "incident" | "assignment" | "review" | "delivery" | "maturity" | "setting" | "upload" | "view";
type Phase = "onboarding" | "ongoing" | "audit" | "incident" | "closure";
type OutcomeStatus = "success" | "warning" | "info";

interface Activity {
  id: string;
  type: ActivityType;
  titleNb: string;
  titleEn: string;
  descriptionNb?: string;
  descriptionEn?: string;
  date: Date;
  actor?: string;
  actorRole?: string;
  phase: Phase;
  outcomeNb: string;
  outcomeEn: string;
  outcomeStatus: OutcomeStatus;
}

const ACTIVITY_ICONS: Record<ActivityType, typeof FileText> = {
  document: FileText, risk: AlertTriangle, incident: AlertTriangle,
  assignment: UserCheck, review: ClipboardCheck, delivery: Package,
  maturity: TrendingUp, setting: Settings, upload: Upload, view: Eye,
};

const ACTIVITY_COLORS: Record<ActivityType, string> = {
  document: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  risk: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  incident: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  assignment: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  review: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  delivery: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300",
  maturity: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  setting: "bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-300",
  upload: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
  view: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
};

const PHASE_CONFIG: Record<Phase, { nb: string; en: string; color: string }> = {
  onboarding: { nb: "Onboarding", en: "Onboarding", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300" },
  ongoing: { nb: "Løpende oppfølging", en: "Ongoing follow-up", color: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300" },
  audit: { nb: "Revisjon", en: "Audit", color: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300" },
  incident: { nb: "Hendelseshåndtering", en: "Incident management", color: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300" },
  closure: { nb: "Avslutning", en: "Closure", color: "bg-slate-100 text-slate-800 dark:bg-slate-900/40 dark:text-slate-300" },
};

const OUTCOME_ICON: Record<OutcomeStatus, typeof CheckCircle2> = {
  success: CheckCircle2, warning: AlertCircle, info: Timer,
};
const OUTCOME_COLOR: Record<OutcomeStatus, string> = {
  success: "text-green-600 dark:text-green-400",
  warning: "text-orange-600 dark:text-orange-400",
  info: "text-blue-600 dark:text-blue-400",
};

interface Template {
  type: ActivityType; phase: Phase;
  titleNb: string; titleEn: string; descNb: string; descEn: string;
  outcomeNb: string; outcomeEn: string; outcomeStatus: OutcomeStatus;
  actorRole: string;
}

const templates: Template[] = [
  { type: "document", phase: "onboarding", titleNb: "DPA lastet opp", titleEn: "DPA uploaded", descNb: "Databehandleravtale lastet opp og knyttet til leverandøren", descEn: "Data processing agreement uploaded and linked to the vendor", outcomeNb: "Fullført", outcomeEn: "Completed", outcomeStatus: "success", actorRole: "Compliance-ansvarlig" },
  { type: "assignment", phase: "onboarding", titleNb: "Leverandøransvarlig tildelt", titleEn: "Vendor manager assigned", descNb: "Ansvarlig person ble satt for oppfølging av leverandøren", descEn: "Responsible person was assigned for vendor follow-up", outcomeNb: "Tildelt", outcomeEn: "Assigned", outcomeStatus: "success", actorRole: "IT-leder" },
  { type: "risk", phase: "audit", titleNb: "Risikovurdering gjennomført", titleEn: "Risk assessment completed", descNb: "Intern risikovurdering ble gjennomført", descEn: "Internal risk assessment was completed", outcomeNb: "Middels risiko", outcomeEn: "Medium risk", outcomeStatus: "warning", actorRole: "Sikkerhetsrådgiver" },
  { type: "review", phase: "audit", titleNb: "Årlig gjennomgang fullført", titleEn: "Annual review completed", descNb: "Leverandøren ble gjennomgått og godkjent for videre bruk", descEn: "Vendor was reviewed and approved for continued use", outcomeNb: "Godkjent", outcomeEn: "Approved", outcomeStatus: "success", actorRole: "Compliance-ansvarlig" },
  { type: "delivery", phase: "ongoing", titleNb: "Ny leveranse registrert", titleEn: "New delivery registered", descNb: "En ny leveranse ble lagt til leverandørprofilen", descEn: "A new delivery was added to the vendor profile", outcomeNb: "Registrert", outcomeEn: "Registered", outcomeStatus: "info", actorRole: "Leverandøransvarlig" },
  { type: "maturity", phase: "ongoing", titleNb: "Modenhetsscore oppdatert", titleEn: "Maturity score updated", descNb: "Trust Score økte fra 32% til 38% etter kontrollgjennomgang", descEn: "Trust Score increased from 32% to 38% after control review", outcomeNb: "+6% forbedring", outcomeEn: "+6% improvement", outcomeStatus: "success", actorRole: "Compliance-ansvarlig" },
  { type: "document", phase: "onboarding", titleNb: "ISO 27001-sertifikat lastet opp", titleEn: "ISO 27001 certificate uploaded", descNb: "Leverandørens sertifisering ble verifisert og arkivert", descEn: "Vendor's certification was verified and archived", outcomeNb: "Verifisert", outcomeEn: "Verified", outcomeStatus: "success", actorRole: "Sikkerhetsrådgiver" },
  { type: "incident", phase: "incident", titleNb: "Hendelse rapportert", titleEn: "Incident reported", descNb: "En sikkerhetshendelse hos leverandøren ble registrert og fulgt opp", descEn: "A security incident at the vendor was registered and followed up", outcomeNb: "Under oppfølging", outcomeEn: "Under investigation", outcomeStatus: "warning", actorRole: "CISO" },
  { type: "upload", phase: "ongoing", titleNb: "SLA-dokument oppdatert", titleEn: "SLA document updated", descNb: "Oppdatert tjenestenivåavtale ble lastet opp", descEn: "Updated service level agreement was uploaded", outcomeNb: "Oppdatert", outcomeEn: "Updated", outcomeStatus: "info", actorRole: "Leverandøransvarlig" },
  { type: "setting", phase: "ongoing", titleNb: "Kontaktinformasjon endret", titleEn: "Contact information changed", descNb: "E-post og telefonnummer for kontaktperson ble oppdatert", descEn: "Email and phone number for contact person were updated", outcomeNb: "Lagret", outcomeEn: "Saved", outcomeStatus: "info", actorRole: "Administrasjonsansvarlig" },
  { type: "view", phase: "ongoing", titleNb: "Profil vist av kunde", titleEn: "Profile viewed by customer", descNb: "Trust Profilen ble vist 3 ganger av eksterne brukere", descEn: "The Trust Profile was viewed 3 times by external users", outcomeNb: "3 visninger", outcomeEn: "3 views", outcomeStatus: "info", actorRole: "System" },
  { type: "maturity", phase: "audit", titleNb: "Kontrollområde forbedret", titleEn: "Control area improved", descNb: "Personvern og datahåndtering gikk fra 45% til 62%", descEn: "Privacy and data handling improved from 45% to 62%", outcomeNb: "+17% forbedring", outcomeEn: "+17% improvement", outcomeStatus: "success", actorRole: "Compliance-ansvarlig" },
  { type: "assignment", phase: "ongoing", titleNb: "Eier endret", titleEn: "Owner changed", descNb: "Virksomhetsområde ble oppdatert fra IT til Drift", descEn: "Work area was updated from IT to Operations", outcomeNb: "Overført", outcomeEn: "Transferred", outcomeStatus: "info", actorRole: "IT-leder" },
  { type: "document", phase: "ongoing", titleNb: "Underleverandørliste mottatt", titleEn: "Sub-processor list received", descNb: "Leverandøren sendte oppdatert liste over underleverandører", descEn: "Vendor sent updated list of sub-processors", outcomeNb: "Mottatt", outcomeEn: "Received", outcomeStatus: "info", actorRole: "Leverandøransvarlig" },
  { type: "review", phase: "audit", titleNb: "Revisjon planlagt", titleEn: "Audit scheduled", descNb: "Neste revisjon av leverandøren ble satt til Q2 2026", descEn: "Next audit of the vendor was scheduled for Q2 2026", outcomeNb: "Planlagt Q2 2026", outcomeEn: "Scheduled Q2 2026", outcomeStatus: "info", actorRole: "Compliance-ansvarlig" },
];

function generateDemoActivities(assetId: string): Activity[] {
  let seed = 0;
  for (let i = 0; i < assetId.length; i++) seed = ((seed << 5) - seed + assetId.charCodeAt(i)) | 0;
  const rand = () => { seed = (seed * 16807 + 0) % 2147483647; return (seed & 0x7fffffff) / 2147483647; };

  const actors = ["Jan Olsen", "Kari Nordmann", "Tore Berg", "Lise Andersen", "Erik Hansen"];
  const now = new Date();
  const count = 10 + Math.floor(rand() * 5);
  const activities: Activity[] = [];

  for (let i = 0; i < count; i++) {
    const tmpl = templates[Math.floor(rand() * templates.length)];
    const daysAgo = Math.floor(rand() * 300) + 1;
    const date = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    const actor = actors[Math.floor(rand() * actors.length)];

    activities.push({
      id: `act-${i}`, type: tmpl.type, phase: tmpl.phase,
      titleNb: tmpl.titleNb, titleEn: tmpl.titleEn,
      descriptionNb: tmpl.descNb, descriptionEn: tmpl.descEn,
      outcomeNb: tmpl.outcomeNb, outcomeEn: tmpl.outcomeEn,
      outcomeStatus: tmpl.outcomeStatus,
      date, actor, actorRole: tmpl.actorRole,
    });
  }

  return activities.sort((a, b) => b.date.getTime() - a.date.getTime());
}

function formatRelativeDate(date: Date, isNb: boolean): string {
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return isNb ? "I dag" : "Today";
  if (diffDays === 1) return isNb ? "I går" : "Yesterday";
  if (diffDays < 7) return isNb ? `${diffDays} dager siden` : `${diffDays} days ago`;
  if (diffDays < 30) { const w = Math.floor(diffDays / 7); return isNb ? `${w} ${w === 1 ? "uke" : "uker"} siden` : `${w} ${w === 1 ? "week" : "weeks"} ago`; }
  if (diffDays < 365) { const m = Math.floor(diffDays / 30); return isNb ? `${m} ${m === 1 ? "måned" : "måneder"} siden` : `${m} ${m === 1 ? "month" : "months"} ago`; }
  return date.toLocaleDateString(isNb ? "nb-NO" : "en-GB");
}

export function VendorActivityTab({ assetId, assetName, baselinePercent = 19, enrichmentPercent = 19 }: VendorActivityTabProps) {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";
  const [phaseFilter, setPhaseFilter] = useState<Phase | "all">("all");

  const activities = useMemo(() => generateDemoActivities(assetId), [assetId]);
  const { tasks, createTask } = useUserTasks();
  const vendorTasks = useMemo(() => tasks.filter(t => t.asset_id === assetId && t.status !== "done"), [tasks, assetId]);

  const filtered = useMemo(() =>
    phaseFilter === "all" ? activities : activities.filter(a => a.phase === phaseFilter),
    [activities, phaseFilter]
  );

  const grouped = useMemo(() => {
    const groups: { label: string; items: Activity[] }[] = [];
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
    { key: "onboarding", nb: "Onboarding", en: "Onboarding" },
    { key: "ongoing", nb: "Løpende", en: "Ongoing" },
    { key: "audit", nb: "Revisjon", en: "Audit" },
    { key: "incident", nb: "Hendelser", en: "Incidents" },
  ];

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
            <CreateUserTaskDialog
              onSubmit={(task) => createTask.mutate({ ...task, asset_id: assetId })}
              isLoading={createTask.isPending}
            />
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
                    const outcomeColor = OUTCOME_COLOR[act.outcomeStatus];
                    const phaseConf = PHASE_CONFIG[act.phase];

                    return (
                      <div key={act.id} className="flex gap-3 group">
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
                                <Badge variant="outline" className={`text-[10px] px-1.5 py-0 border-0 ${phaseConf.color}`}>
                                  {isNb ? phaseConf.nb : phaseConf.en}
                                </Badge>
                              </div>
                              {/* Outcome */}
                              <div className={`flex items-center gap-1 mt-0.5 ${outcomeColor}`}>
                                <OutcomeIcon className="h-3 w-3" />
                                <span className="text-xs font-medium">{isNb ? act.outcomeNb : act.outcomeEn}</span>
                              </div>
                              {(isNb ? act.descriptionNb : act.descriptionEn) && (
                                <p className="text-sm text-muted-foreground mt-0.5">
                                  {isNb ? act.descriptionNb : act.descriptionEn}
                                </p>
                              )}
                              {act.actor && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  <span className="font-medium text-foreground/80">{act.actor}</span>
                                  {act.actorRole && <span className="text-muted-foreground">, {act.actorRole}</span>}
                                </p>
                              )}
                            </div>
                            <Badge variant="outline" className="text-xs shrink-0 whitespace-nowrap">
                              {formatRelativeDate(act.date, isNb)}
                            </Badge>
                          </div>
                        </div>
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
