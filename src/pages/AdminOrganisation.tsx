import { useEffect, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, Hash, Factory, Users, Layers, Monitor, UserCheck, ChevronRight, Scale, Shield, CheckCircle2, Eye, Clock, Settings } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useIsMobile } from "@/hooks/use-mobile";
import { OrganizationContextBanner } from "@/components/OrganizationContextBanner";
import { useActivatedServices } from "@/hooks/useActivatedServices";

interface OrgData {
  name: string;
  org_number: string | null;
  industry: string;
  employees: string | null;
  brreg_industry: string | null;
  brreg_employees: number | null;
  domain?: string | null;
}

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subtitle: string;
  detail?: string;
  warning?: string;
  accentColor: string;
}

function MetricCard({ icon, label, value, subtitle, detail, warning, accentColor }: MetricCardProps) {
  return (
    <Card className="relative overflow-hidden">
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${accentColor}`} />
      <CardContent className="p-5">
        <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium uppercase tracking-wide mb-2">
          {icon}
          {label}
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-foreground">{value}</span>
          <span className="text-sm text-muted-foreground">{subtitle}</span>
        </div>
        {detail && <p className="text-xs text-muted-foreground mt-1.5">{detail}</p>}
        {warning && <p className="text-xs text-warning dark:text-warning mt-1">• {warning}</p>}
      </CardContent>
    </Card>
  );
}

export default function AdminOrganisation() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const isNb = i18n.language === "nb";
  const { isServiceActive } = useActivatedServices();

  const [org, setOrg] = useState<OrgData | null>(null);
  const [loading, setLoading] = useState(true);
  const [trustScore, setTrustScore] = useState(0);
  const [frameworkNames, setFrameworkNames] = useState<string[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string>("–");
  const [stats, setStats] = useState({
    users: 0,
    workAreas: 0,
    activeWorkAreas: 0,
    inactiveWorkAreas: 0,
    systems: 0,
    systemsWithOwner: 0,
    systemsWithoutOwner: 0,
    workAreaManagers: 0,
    totalWorkAreaSlots: 0,
    workAreasWithManager: 0,
    workAreasWithoutManager: 0,
    activeFrameworks: 0,
  });

  useEffect(() => {
    const fetchAll = async () => {
      // Fetch company profile
      const { data: profile } = await supabase
        .from("company_profile")
        .select("name, org_number, industry, employees, brreg_industry, brreg_employees, domain")
        .limit(1)
        .maybeSingle();
      if (profile) setOrg(profile);

      // Fetch self asset for trust score
      const { data: selfAsset } = await supabase
        .from("assets")
        .select("compliance_score, updated_at")
        .eq("asset_type", "self")
        .limit(1)
        .maybeSingle();
      if (selfAsset) {
        setTrustScore(selfAsset.compliance_score || 0);
        if (selfAsset.updated_at) {
          setLastUpdated(new Date(selfAsset.updated_at).toLocaleDateString(isNb ? "nb-NO" : "en-GB", { day: "numeric", month: "long", year: "numeric" }));
        }
      }

      // Fetch active framework names
      const { data: addons } = await supabase
        .from("domain_addons")
        .select("domain_id")
        .eq("status", "active");
      if (addons) {
        setFrameworkNames(addons.map((a: any) => a.domain_id));
      }

      // Fetch work areas count
      const { data: workAreas } = await supabase
        .from("work_areas" as any)
        .select("id, status, responsible_person");
      const waList = workAreas || [];
      const activeWA = waList.filter((w: any) => w.status !== "inactive");
      const inactiveWA = waList.filter((w: any) => w.status === "inactive");
      const waWithManager = waList.filter((w: any) => w.responsible_person);

      // Fetch systems count
      const { data: systems } = await supabase
        .from("assets")
        .select("id, asset_owner")
        .eq("asset_type", "system");
      const sysList = systems || [];
      const sysWithOwner = sysList.filter((s) => s.asset_owner);

      // Fetch active frameworks
      const { data: frameworks } = await supabase
        .from("domain_addons")
        .select("id")
        .eq("status", "active");

      setStats({
        users: profile?.brreg_employees || 0,
        workAreas: waList.length,
        activeWorkAreas: activeWA.length,
        inactiveWorkAreas: inactiveWA.length,
        systems: sysList.length,
        systemsWithOwner: sysWithOwner.length,
        systemsWithoutOwner: sysList.length - sysWithOwner.length,
        workAreaManagers: waWithManager.length,
        totalWorkAreaSlots: waList.length,
        workAreasWithManager: waWithManager.length,
        workAreasWithoutManager: waList.length - waWithManager.length,
        activeFrameworks: (frameworks || []).length,
      });

      setLoading(false);
    };
    fetchAll();
  }, []);

  const getIndustryLabel = (industry: string) => {
    const map: Record<string, string> = {
      technology: "Teknologi",
      saas: "Dataprogrammeringstjenester",
      helse: "Helse",
      finans: "Finans",
      energi: "Energi",
      offentlig: "Offentlig sektor",
      healthcare: "Helsevesen",
      finance: "Finans",
      retail: "Handel",
      manufacturing: "Produksjon",
      education: "Utdanning",
      consulting: "Konsulent",
      energy: "Energi",
    };
    return map[industry] || industry;
  };

  const content = (
    <div className="container max-w-7xl mx-auto px-4 pt-8 pb-4 md:p-6 space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          {t("nav.organisation")}
        </h1>
        <OrganizationContextBanner />
      </div>

      {/* Organisation header — Trust Profile style */}
      <Card className="overflow-hidden">
        {/* Powered by header bar */}
        <div className="flex items-center justify-between px-6 py-3 bg-gradient-to-r from-primary/5 to-primary/10 border-b border-primary/10">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Shield className="h-3.5 w-3.5 text-primary" />
            <span className="font-medium">Powered by Mynder Trust Center</span>
          </div>
          <Badge className="bg-status-closed/10 text-status-closed border-status-closed/20 dark:bg-status-closed/30 dark:text-status-closed text-[13px] gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Verified
          </Badge>
        </div>

        <div className="p-6 md:p-8 space-y-6">
          {loading ? (
            <div className="animate-pulse space-y-3">
              <div className="h-8 bg-muted rounded w-48" />
              <div className="h-4 bg-muted rounded w-64" />
            </div>
          ) : org ? (
            <>
              {/* Company header + Trust Score */}
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1 space-y-3">
                  <div className="flex items-start gap-4">
                    <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center shrink-0">
                      <Shield className="h-7 w-7 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-xl font-bold text-foreground">{org.name}</h2>
                      <p className="text-sm text-muted-foreground">Shareable compliance profile for due diligence</p>
                    </div>
                  </div>

                  <Badge variant="outline" className="text-[13px]">
                    {isNb ? "Egenerklæring" : "Self-declared"}
                  </Badge>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Eye className="h-4 w-4" />
                    <span>{isNb ? "Profilvisninger:" : "Profile views:"} <span className="font-semibold text-foreground">—</span></span>
                  </div>

                  {/* Framework badges */}
                  {frameworkNames.length > 0 && (
                    <div className="space-y-3">
                      {(() => {
                        const standards = frameworkNames.filter(n => ["ISO 27001", "SOC 2", "ISO 27701", "ISO 22301"].includes(n));
                        const regulations = frameworkNames.filter(n => !["ISO 27001", "SOC 2", "ISO 27701", "ISO 22301"].includes(n));
                        return (
                          <>
                            {standards.length > 0 && (
                              <div>
                                <p className="text-[13px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                                  {isNb ? "Standarder og sertifiseringer" : "Standards & Certifications"}
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                  {standards.map(fw => (
                                    <Badge key={fw} variant="outline" className="text-[13px] font-medium">{fw}</Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                            {regulations.length > 0 && (
                              <div>
                                <p className="text-[13px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                                  {isNb ? "Regulatorisk dekning" : "Regulatory Coverage"}
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                  {regulations.map(fw => (
                                    <Badge key={fw} variant="outline" className="text-[13px] font-medium border-warning/20 text-warning dark:text-warning">{fw}</Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  )}
                </div>

                {/* Trust Score donut */}
                <div className="flex flex-col items-center gap-1.5 shrink-0">
                  <div className="relative flex items-center justify-center">
                    {(() => {
                      const radius = 52;
                      const circ = 2 * Math.PI * radius;
                      const dash = (trustScore / 100) * circ;
                      const strokeColor = trustScore >= 75 ? "hsl(var(--success))" : trustScore >= 50 ? "hsl(var(--warning))" : "hsl(var(--destructive))";
                      const trustColor = trustScore >= 75 ? "text-success" : trustScore >= 50 ? "text-warning" : "text-destructive";
                      const trustLabel = trustScore >= 75 ? "HIGH TRUST" : trustScore >= 50 ? "MEDIUM TRUST" : "LOW TRUST";
                      return (
                        <>
                          <svg width="128" height="128" viewBox="0 0 128 128" className="-rotate-90">
                            <circle cx="64" cy="64" r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
                            <circle cx="64" cy="64" r={radius} fill="none" stroke={strokeColor} strokeWidth="8" strokeLinecap="round" strokeDasharray={`${dash} ${circ}`} style={{ transition: "stroke-dasharray 0.6s ease" }} />
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className={`text-4xl font-bold tabular-nums ${trustColor}`}>{trustScore}</span>
                            <span className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wider mt-0.5">{trustLabel}</span>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                  <p className="text-[13px] text-muted-foreground text-center">
                    {trustScore >= 80 ? (isNb ? "Godt egnet for de fleste bruksområder" : "Suitable for most use cases") : trustScore >= 50 ? (isNb ? "Egnet for standard bruksområder" : "Suitable for standard use cases") : (isNb ? "Begrenset egnethet" : "Limited suitability")}
                  </p>
                  <div className="flex items-center gap-1 text-[13px] text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{isNb ? "Sist oppdatert:" : "Last updated:"} {lastUpdated}</span>
                  </div>
                </div>
              </div>

              {/* Metadata stripe */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border rounded-lg overflow-hidden border border-border">
                {[
                  { label: "ORG.NR", value: org.org_number ? org.org_number.replace(/(\d{3})(\d{3})(\d{3})/, "$1 $2 $3") : "–" },
                  { label: isNb ? "BRANSJE" : "INDUSTRY", value: org.brreg_industry || getIndustryLabel(org.industry) },
                  { label: isNb ? "KATEGORI" : "CATEGORY", value: "–" },
                  { label: isNb ? "NETTSIDE" : "WEBSITE", value: org.domain || "–" },
                ].map(item => (
                  <div key={item.label} className="bg-card px-4 py-3">
                    <p className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wider">{item.label}</p>
                    <p className="text-sm font-medium text-foreground mt-0.5 truncate">{item.value}</p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-muted-foreground">{isNb ? "Ingen bedriftsprofil funnet." : "No company profile found."}</p>
          )}
        </div>
      </Card>

      {/* Metrics row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          icon={<Users className="h-4 w-4" />}
          label={isNb ? "Brukere i organisasjonen" : "Users in organization"}
          value={stats.users || "—"}
          subtitle={isNb ? "brukere" : "users"}
          detail={isNb ? "Aktive medlemmer med tilgang til systemet" : "Active members with system access"}
          accentColor="bg-primary"
        />
        <MetricCard
          icon={<Layers className="h-4 w-4" />}
          label={isNb ? "Arbeidsområder" : "Work areas"}
          value={stats.activeWorkAreas}
          subtitle={isNb ? "aktive" : "active"}
          detail={stats.inactiveWorkAreas > 0 ? `${stats.inactiveWorkAreas} ${isNb ? "inaktive arbeidsområder" : "inactive work areas"}` : undefined}
          accentColor="bg-status-closed"
        />
        <MetricCard
          icon={<Monitor className="h-4 w-4" />}
          label={isNb ? "Systemansvarlige" : "System owners"}
          value={stats.systemsWithOwner}
          subtitle={isNb ? "ansvarlige" : "owners"}
          detail={`${stats.systemsWithOwner} ${isNb ? "av" : "of"} ${stats.systems} ${isNb ? "systemer har ansvarlig" : "systems have owner"}`}
          warning={stats.systemsWithoutOwner > 0 ? `${stats.systemsWithoutOwner} ${isNb ? "mangler" : "missing"}` : undefined}
          accentColor="bg-accent"
        />
        <MetricCard
          icon={<UserCheck className="h-4 w-4" />}
          label={isNb ? "Arbeidsområdeansvarlige" : "Work area managers"}
          value={stats.workAreasWithManager}
          subtitle={isNb ? "ansvarlige" : "managers"}
          detail={`${stats.workAreasWithManager} ${isNb ? "av" : "of"} ${stats.totalWorkAreaSlots} ${isNb ? "områder har ansvarlig" : "areas have manager"}`}
          warning={stats.workAreasWithoutManager > 0 ? `${stats.workAreasWithoutManager} ${isNb ? "mangler" : "missing"}` : undefined}
          accentColor="bg-warning"
        />
      </div>

      {/* Regelverk section */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
            <div className="flex items-center gap-3">
              <Scale className="h-6 w-6 text-primary flex-shrink-0" />
              <div>
                <h2 className="text-xl font-bold text-foreground">{isNb ? "Regelverk" : "Regulations"}</h2>
                <p className="text-sm text-muted-foreground">
                  {isNb
                    ? "Styrer oppgaver og modenhetssjekker for hele organisasjonen."
                    : "Controls tasks and maturity checks for the entire organization."}
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={() => navigate("/regulations")} className="gap-1.5">
              {isNb ? "Rediger valg" : "Edit selection"}
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-3">
            {isNb ? "Aktivert:" : "Activated:"} <strong>{stats.activeFrameworks}</strong>
          </p>
        </CardContent>
      </Card>

      {/* Arbeidsområder section — only if module-systems is active */}
      {isServiceActive("module-systems") && (
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
              <div className="flex items-center gap-3">
                <Settings className="h-6 w-6 text-primary flex-shrink-0" />
                <div>
                  <h2 className="text-xl font-bold text-foreground">{isNb ? "Arbeidsområder" : "Work Areas"}</h2>
                  <p className="text-sm text-muted-foreground">
                    {isNb
                      ? "Administrer arbeidsområder, prosesser og ansvar i virksomheten."
                      : "Manage work areas, processes and responsibilities in the organization."}
                  </p>
                </div>
              </div>
              <Button variant="outline" onClick={() => navigate("/work-areas/manage")} className="gap-1.5">
                {isNb ? "Administrer" : "Manage"}
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-3">
              {isNb ? "Aktive arbeidsområder:" : "Active work areas:"} <strong>{stats.activeWorkAreas}</strong>
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <Sidebar />
        <main className="flex-1 overflow-y-auto pt-11">{content}</main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen max-h-screen bg-background overflow-hidden">
      <div className="w-64 flex-shrink-0"><Sidebar /></div>
      <main className="flex-1 h-screen overflow-y-auto pt-11">{content}</main>
    </div>
  );
}
