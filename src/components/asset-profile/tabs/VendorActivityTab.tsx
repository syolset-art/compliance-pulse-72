import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MaturityHistoryChart } from "@/components/trust-controls/MaturityHistoryChart";
import {
  FileText,
  ShieldCheck,
  AlertTriangle,
  UserCheck,
  ClipboardCheck,
  Package,
  TrendingUp,
  Settings,
  Upload,
  Eye,
  Clock,
} from "lucide-react";

interface VendorActivityTabProps {
  assetId: string;
  assetName: string;
  baselinePercent?: number;
  enrichmentPercent?: number;
}

type ActivityType = "document" | "risk" | "incident" | "assignment" | "review" | "delivery" | "maturity" | "setting" | "upload" | "view";

interface Activity {
  id: string;
  type: ActivityType;
  titleNb: string;
  titleEn: string;
  descriptionNb?: string;
  descriptionEn?: string;
  date: Date;
  actor?: string;
}

const ACTIVITY_ICONS: Record<ActivityType, typeof FileText> = {
  document: FileText,
  risk: AlertTriangle,
  incident: AlertTriangle,
  assignment: UserCheck,
  review: ClipboardCheck,
  delivery: Package,
  maturity: TrendingUp,
  setting: Settings,
  upload: Upload,
  view: Eye,
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

function generateDemoActivities(assetId: string): Activity[] {
  let seed = 0;
  for (let i = 0; i < assetId.length; i++) seed = ((seed << 5) - seed + assetId.charCodeAt(i)) | 0;
  const rand = () => { seed = (seed * 16807 + 0) % 2147483647; return (seed & 0x7fffffff) / 2147483647; };

  const actors = ["Jan Olsen", "Kari Nordmann", "Tore Berg", "Lise Andersen", "Erik Hansen"];
  const now = new Date();

  const templates: { type: ActivityType; titleNb: string; titleEn: string; descNb: string; descEn: string }[] = [
    { type: "document", titleNb: "DPA lastet opp", titleEn: "DPA uploaded", descNb: "Databehandleravtale lastet opp og knyttet til leverandøren", descEn: "Data processing agreement uploaded and linked to the vendor" },
    { type: "assignment", titleNb: "Leverandøransvarlig tildelt", titleEn: "Vendor manager assigned", descNb: "Ansvarlig person ble satt for oppfølging av leverandøren", descEn: "Responsible person was assigned for vendor follow-up" },
    { type: "risk", titleNb: "Risikovurdering gjennomført", titleEn: "Risk assessment completed", descNb: "Intern risikovurdering ble gjennomført med middels risikoscore", descEn: "Internal risk assessment was completed with medium risk score" },
    { type: "review", titleNb: "Årlig gjennomgang fullført", titleEn: "Annual review completed", descNb: "Leverandøren ble gjennomgått og godkjent for videre bruk", descEn: "Vendor was reviewed and approved for continued use" },
    { type: "delivery", titleNb: "Ny leveranse registrert", titleEn: "New delivery registered", descNb: "En ny leveranse ble lagt til leverandørprofilen", descEn: "A new delivery was added to the vendor profile" },
    { type: "maturity", titleNb: "Modenhetsscore oppdatert", titleEn: "Maturity score updated", descNb: "Trust Score økte fra 32% til 38% etter kontrollgjennomgang", descEn: "Trust Score increased from 32% to 38% after control review" },
    { type: "document", titleNb: "ISO 27001-sertifikat lastet opp", titleEn: "ISO 27001 certificate uploaded", descNb: "Leverandørens sertifisering ble verifisert og arkivert", descEn: "Vendor's certification was verified and archived" },
    { type: "incident", titleNb: "Hendelse rapportert", titleEn: "Incident reported", descNb: "En sikkerhetshendelse hos leverandøren ble registrert og fulgt opp", descEn: "A security incident at the vendor was registered and followed up" },
    { type: "upload", titleNb: "SLA-dokument oppdatert", titleEn: "SLA document updated", descNb: "Oppdatert tjenestenivåavtale ble lastet opp", descEn: "Updated service level agreement was uploaded" },
    { type: "setting", titleNb: "Kontaktinformasjon endret", titleEn: "Contact information changed", descNb: "E-post og telefonnummer for kontaktperson ble oppdatert", descEn: "Email and phone number for contact person were updated" },
    { type: "view", titleNb: "Profil vist av kunde", titleEn: "Profile viewed by customer", descNb: "Trust Profilen ble vist 3 ganger av eksterne brukere", descEn: "The Trust Profile was viewed 3 times by external users" },
    { type: "maturity", titleNb: "Kontrollområde forbedret", titleEn: "Control area improved", descNb: "Personvern og datahåndtering gikk fra 45% til 62%", descEn: "Privacy and data handling improved from 45% to 62%" },
    { type: "assignment", titleNb: "Eier endret", titleEn: "Owner changed", descNb: "Virksomhetsområde ble oppdatert fra IT til Drift", descEn: "Work area was updated from IT to Operations" },
    { type: "document", titleNb: "Underleverandørliste mottatt", titleEn: "Sub-processor list received", descNb: "Leverandøren sendte oppdatert liste over underleverandører", descEn: "Vendor sent updated list of sub-processors" },
    { type: "review", titleNb: "Revisjon planlagt", titleEn: "Audit scheduled", descNb: "Neste revisjon av leverandøren ble satt til Q2 2026", descEn: "Next audit of the vendor was scheduled for Q2 2026" },
  ];

  // Pick 10-14 activities deterministically
  const count = 10 + Math.floor(rand() * 5);
  const activities: Activity[] = [];

  for (let i = 0; i < count; i++) {
    const tmpl = templates[Math.floor(rand() * templates.length)];
    const daysAgo = Math.floor(rand() * 300) + 1;
    const date = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    const actor = actors[Math.floor(rand() * actors.length)];

    activities.push({
      id: `act-${i}`,
      type: tmpl.type,
      titleNb: tmpl.titleNb,
      titleEn: tmpl.titleEn,
      descriptionNb: tmpl.descNb,
      descriptionEn: tmpl.descEn,
      date,
      actor,
    });
  }

  return activities.sort((a, b) => b.date.getTime() - a.date.getTime());
}

function formatRelativeDate(date: Date, isNb: boolean): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return isNb ? "I dag" : "Today";
  if (diffDays === 1) return isNb ? "I går" : "Yesterday";
  if (diffDays < 7) return isNb ? `${diffDays} dager siden` : `${diffDays} days ago`;
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return isNb ? `${weeks} ${weeks === 1 ? "uke" : "uker"} siden` : `${weeks} ${weeks === 1 ? "week" : "weeks"} ago`;
  }
  if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return isNb ? `${months} ${months === 1 ? "måned" : "måneder"} siden` : `${months} ${months === 1 ? "month" : "months"} ago`;
  }
  return date.toLocaleDateString(isNb ? "nb-NO" : "en-GB");
}

export function VendorActivityTab({ assetId, assetName, baselinePercent = 19, enrichmentPercent = 19 }: VendorActivityTabProps) {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";

  const activities = useMemo(() => generateDemoActivities(assetId), [assetId]);

  // Group by month
  const grouped = useMemo(() => {
    const groups: { label: string; items: Activity[] }[] = [];
    let currentLabel = "";

    for (const act of activities) {
      const label = act.date.toLocaleDateString(isNb ? "nb-NO" : "en-GB", { month: "long", year: "numeric" });
      const capitalizedLabel = label.charAt(0).toUpperCase() + label.slice(1);
      if (capitalizedLabel !== currentLabel) {
        currentLabel = capitalizedLabel;
        groups.push({ label: capitalizedLabel, items: [] });
      }
      groups[groups.length - 1].items.push(act);
    }

    return groups;
  }, [activities, isNb]);

  return (
    <div className="space-y-6">
      {/* Maturity History Chart */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            {isNb ? "Modenhetsutvikling" : "Maturity Development"}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {isNb
              ? `Utviklingen av modenhet og trust score for ${assetName} over tid.`
              : `The development of maturity and trust score for ${assetName} over time.`}
          </p>
        </CardHeader>
        <CardContent>
          <MaturityHistoryChart
            assetId={assetId}
            baselinePercent={baselinePercent}
            enrichmentPercent={enrichmentPercent}
          />
        </CardContent>
      </Card>

      {/* Activity Timeline */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            {isNb ? "Aktivitetslogg" : "Activity Log"}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {isNb
              ? "Oversikt over alle endringer, hendelser og oppdateringer knyttet til denne leverandøren."
              : "Overview of all changes, events, and updates related to this vendor."}
          </p>
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

                    return (
                      <div key={act.id} className="flex gap-3 group">
                        {/* Timeline line + icon */}
                        <div className="flex flex-col items-center">
                          <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${colorClass}`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          {!isLast && (
                            <div className="w-px flex-1 bg-border min-h-[16px]" />
                          )}
                        </div>

                        {/* Content */}
                        <div className={`flex-1 pb-4 ${!isLast ? "" : ""}`}>
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-sm font-medium text-foreground">
                                {isNb ? act.titleNb : act.titleEn}
                              </p>
                              {(isNb ? act.descriptionNb : act.descriptionEn) && (
                                <p className="text-sm text-muted-foreground mt-0.5">
                                  {isNb ? act.descriptionNb : act.descriptionEn}
                                </p>
                              )}
                              {act.actor && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  <span className="font-medium text-foreground/80">{act.actor}</span>
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
