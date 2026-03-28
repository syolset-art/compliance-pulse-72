import { useEffect, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, Hash, Factory, Users, Layers, Monitor, UserCheck, ChevronRight, Scale } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useIsMobile } from "@/hooks/use-mobile";

interface OrgData {
  name: string;
  org_number: string | null;
  industry: string;
  employees: string | null;
  brreg_industry: string | null;
  brreg_employees: number | null;
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
        {warning && <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">• {warning}</p>}
      </CardContent>
    </Card>
  );
}

export default function AdminOrganisation() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const isNb = i18n.language === "nb";

  const [org, setOrg] = useState<OrgData | null>(null);
  const [loading, setLoading] = useState(true);
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
        .select("name, org_number, industry, employees, brreg_industry, brreg_employees")
        .limit(1)
        .maybeSingle();
      if (profile) setOrg(profile);

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
    <div className="container max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          {isNb ? "Organiser etterlevelse i organisasjonen" : "Organize compliance in your organization"}
        </h1>
        <p className="text-muted-foreground mt-1">
          {isNb
            ? "Administrer personvern, informasjonssikkerhet og risikostyring for hele organisasjonen"
            : "Manage privacy, information security and risk management for the entire organization"}
        </p>
      </div>

      {/* Organisation card */}
      <Card>
        <CardContent className="p-6 relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
          <div className="flex items-center gap-3 mb-5">
            <Building2 className="h-6 w-6 text-primary" />
            <div>
              <h2 className="text-xl font-bold text-foreground">{isNb ? "Organisasjon" : "Organization"}</h2>
              <p className="text-sm text-muted-foreground">
                {isNb ? "Informasjon om virksomheten fra Brønnøysundregistrene" : "Company information from Brønnøysund registers"}
              </p>
            </div>
          </div>

          {loading ? (
            <div className="animate-pulse space-y-3">
              <div className="h-6 bg-muted rounded w-48" />
              <div className="h-6 bg-muted rounded w-32" />
            </div>
          ) : org ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5" /> {isNb ? "FIRMANAVN" : "COMPANY NAME"}
                </p>
                <p className="text-lg font-bold text-foreground mt-1">{org.name}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Hash className="h-3.5 w-3.5" /> {isNb ? "ORGANISASJONSNUMMER" : "ORG NUMBER"}
                </p>
                <p className="text-lg font-bold text-foreground mt-1 font-mono">
                  {org.org_number ? org.org_number.replace(/(\d{3})(\d{3})(\d{3})/, "$1 $2 $3") : "—"}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Factory className="h-3.5 w-3.5" /> {isNb ? "BRANSJE" : "INDUSTRY"}
                </p>
                <Badge variant="outline" className="mt-1.5 text-sm font-medium">
                  {org.brreg_industry || getIndustryLabel(org.industry)}
                </Badge>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5" /> {isNb ? "ANTALL ANSATTE" : "EMPLOYEES"}
                </p>
                <p className="text-lg font-bold text-foreground mt-1">
                  {org.brreg_employees ? `${org.brreg_employees} ${isNb ? "ansatte" : "employees"}` : org.employees || "—"}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">{isNb ? "Ingen bedriftsprofil funnet." : "No company profile found."}</p>
          )}
        </CardContent>
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
          accentColor="bg-emerald-500"
        />
        <MetricCard
          icon={<Monitor className="h-4 w-4" />}
          label={isNb ? "Systemansvarlige" : "System owners"}
          value={stats.systemsWithOwner}
          subtitle={isNb ? "ansvarlige" : "owners"}
          detail={`${stats.systemsWithOwner} ${isNb ? "av" : "of"} ${stats.systems} ${isNb ? "systemer har ansvarlig" : "systems have owner"}`}
          warning={stats.systemsWithoutOwner > 0 ? `${stats.systemsWithoutOwner} ${isNb ? "mangler" : "missing"}` : undefined}
          accentColor="bg-violet-500"
        />
        <MetricCard
          icon={<UserCheck className="h-4 w-4" />}
          label={isNb ? "Arbeidsområdeansvarlige" : "Work area managers"}
          value={stats.workAreasWithManager}
          subtitle={isNb ? "ansvarlige" : "managers"}
          detail={`${stats.workAreasWithManager} ${isNb ? "av" : "of"} ${stats.totalWorkAreaSlots} ${isNb ? "områder har ansvarlig" : "areas have manager"}`}
          warning={stats.workAreasWithoutManager > 0 ? `${stats.workAreasWithoutManager} ${isNb ? "mangler" : "missing"}` : undefined}
          accentColor="bg-amber-500"
        />
      </div>

      {/* Regelverk section */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Scale className="h-6 w-6 text-primary" />
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
    </div>
  );

  if (isMobile) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">{content}</main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen max-h-screen bg-background overflow-hidden">
      <div className="w-64 flex-shrink-0"><Sidebar /></div>
      <main className="flex-1 h-screen overflow-y-auto">{content}</main>
    </div>
  );
}
