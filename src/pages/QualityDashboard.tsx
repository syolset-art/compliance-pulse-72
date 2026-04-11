import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Shield, 
  FileCheck, 
  AlertTriangle, 
  Wrench, 
  FlaskConical, 
  Users,
  TrendingUp,
  Calendar,
  Clock,
  ArrowRight,
  Plus,
  ShieldAlert
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { deviationCategories } from "@/lib/deviationCategories";
import { format } from "date-fns";
import { nb } from "date-fns/locale";

const qmsCategories = ["hms", "kvalitet", "miljo"];

export default function QualityDashboard() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isNorwegian = i18n.language === 'nb' || i18n.language === 'no';
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch QMS-relevant deviations from system_incidents
  const { data: deviations = [] } = useQuery({
    queryKey: ["qms-deviations"],
    queryFn: async () => {
      const { data } = await supabase
        .from("system_incidents")
        .select("*")
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  // Fetch vendor incidents from lara_inbox
  const { data: vendorIncidents = [] } = useQuery({
    queryKey: ["qms-vendor-incidents"],
    queryFn: async () => {
      const { data } = await supabase
        .from("lara_inbox")
        .select("*")
        .eq("matched_document_type", "incident")
        .eq("status", "new")
        .order("received_at", { ascending: false })
        .limit(5);
      return data || [];
    },
  });

  // Compute metrics from real data
  const qmsDeviations = deviations.filter((d: any) => qmsCategories.includes(d.category));
  const allDeviations = deviations;
  const openDeviations = allDeviations.filter((d: any) => d.status === "open" || d.status === "in_progress");
  const closedThisMonth = allDeviations.filter((d: any) => {
    if (d.status !== "resolved") return false;
    const created = new Date(d.created_at);
    const now = new Date();
    return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
  });

  const overallScore = allDeviations.length > 0
    ? Math.round((allDeviations.filter((d: any) => d.status === "resolved").length / allDeviations.length) * 100)
    : 100;

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    try { return format(new Date(dateStr), "d. MMM yyyy", { locale: nb }); } catch { return "-"; }
  };

  const categoryLabel = (cat: string) => {
    const found = deviationCategories.find(c => c.id === cat);
    return found?.label || cat;
  };

  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto pt-11">
        <div className="container max-w-7xl mx-auto py-8 px-4 md:px-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                <Shield className="h-8 w-8 text-primary" />
                {isNorwegian ? "Kvalitetssystem" : "Quality System"}
              </h1>
              <p className="text-muted-foreground mt-1">
                {isNorwegian 
                  ? "Oversikt over HMS, kvalitet og kontinuerlig forbedring" 
                  : "Overview of HSE, quality and continuous improvement"}
              </p>
            </div>
            <Button onClick={() => navigate("/deviations")}>
              <Plus className="h-4 w-4 mr-2" />
              {isNorwegian ? "Nytt avvik" : "New deviation"}
            </Button>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {isNorwegian ? "Løsningsgrad" : "Resolution Rate"}
                    </p>
                    <p className="text-2xl font-bold">{overallScore}%</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <Progress value={overallScore} className="mt-3 h-2" />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {isNorwegian ? "Åpne avvik" : "Open Deviations"}
                    </p>
                    <p className="text-2xl font-bold">{openDeviations.length}</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
                    <AlertTriangle className="h-6 w-6 text-destructive" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {closedThisMonth.length} {isNorwegian ? "lukket denne måneden" : "closed this month"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {isNorwegian ? "HMS-avvik" : "HSE Deviations"}
                    </p>
                    <p className="text-2xl font-bold">{qmsDeviations.length}</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-accent flex items-center justify-center">
                    <FileCheck className="h-6 w-6 text-accent-foreground" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {isNorwegian ? "HMS, Kvalitet, Miljø" : "HSE, Quality, Environment"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {isNorwegian ? "Leverandørhendelser" : "Vendor Incidents"}
                    </p>
                    <p className="text-2xl font-bold">{vendorIncidents.length}</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center">
                    <ShieldAlert className="h-6 w-6 text-secondary-foreground" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {isNorwegian ? "Ubehandlede" : "Unprocessed"}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid grid-cols-3 w-full max-w-md">
              <TabsTrigger value="overview">
                {isNorwegian ? "Oversikt" : "Overview"}
              </TabsTrigger>
              <TabsTrigger value="deviations">
                {isNorwegian ? "Avvik" : "Deviations"}
              </TabsTrigger>
              <TabsTrigger value="vendor-feed">
                {isNorwegian ? "Leverandørfeed" : "Vendor Feed"}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Recent Deviations */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5" />
                      {isNorwegian ? "Siste avvik" : "Recent Deviations"}
                    </CardTitle>
                    <CardDescription>
                      {isNorwegian ? "De siste registrerte avvikene" : "Recently registered deviations"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {allDeviations.slice(0, 5).map((deviation: any) => (
                      <div 
                        key={deviation.id}
                        className="flex items-start justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                      >
                        <div className="flex-1">
                          <p className="text-sm font-medium">{deviation.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-xs text-muted-foreground">{formatDate(deviation.created_at)}</p>
                            {deviation.category && (
                              <Badge variant="outline" className="text-[10px]">
                                {categoryLabel(deviation.category)}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Badge 
                          variant={deviation.status === 'resolved' ? 'secondary' : deviation.criticality === 'critical' ? 'destructive' : 'outline'}
                        >
                          {deviation.status === 'resolved' 
                            ? (isNorwegian ? 'Lukket' : 'Closed')
                            : deviation.status === 'in_progress'
                            ? (isNorwegian ? 'Pågår' : 'In Progress')
                            : (isNorwegian ? 'Åpen' : 'Open')
                          }
                        </Badge>
                      </div>
                    ))}
                    {allDeviations.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        {isNorwegian ? "Ingen avvik registrert ennå" : "No deviations registered yet"}
                      </p>
                    )}
                    <Button variant="ghost" className="w-full mt-2" onClick={() => navigate("/deviations")}>
                      {isNorwegian ? "Se alle avvik" : "View all deviations"}
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>

                {/* Vendor Incidents */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ShieldAlert className="h-5 w-5" />
                      {isNorwegian ? "Leverandørhendelser" : "Vendor Incidents"}
                    </CardTitle>
                    <CardDescription>
                      {isNorwegian ? "Ubehandlede hendelser fra leverandører" : "Unprocessed vendor incidents"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {vendorIncidents.map((incident: any) => (
                      <div 
                        key={incident.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-destructive/10 flex items-center justify-center">
                            <ShieldAlert className="h-4 w-4 text-destructive" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{incident.subject}</p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDate(incident.received_at)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                    {vendorIncidents.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        {isNorwegian ? "Ingen ubehandlede hendelser" : "No unprocessed incidents"}
                      </p>
                    )}
                    <Button variant="ghost" className="w-full mt-2" onClick={() => navigate("/lara-inbox")}>
                      {isNorwegian ? "Gå til innboks" : "Go to inbox"}
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>
                    {isNorwegian ? "Hurtighandlinger" : "Quick Actions"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => navigate("/deviations")}>
                      <AlertTriangle className="h-5 w-5" />
                      <span className="text-sm">
                        {isNorwegian ? "Registrer avvik" : "Register Deviation"}
                      </span>
                    </Button>
                    <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => navigate("/customer-requests")}>
                      <FileCheck className="h-5 w-5" />
                      <span className="text-sm">
                        {isNorwegian ? "HMS-forespørsel" : "HSE Request"}
                      </span>
                    </Button>
                    <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => navigate("/lara-inbox")}>
                      <ShieldAlert className="h-5 w-5" />
                      <span className="text-sm">
                        {isNorwegian ? "Leverandørhendelser" : "Vendor Incidents"}
                      </span>
                    </Button>
                    <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => navigate("/assets")}>
                      <Users className="h-5 w-5" />
                      <span className="text-sm">
                        {isNorwegian ? "Leverandøroversikt" : "Vendor Overview"}
                      </span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="deviations">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">
                      {isNorwegian ? "Avviksregister" : "Deviation Register"}
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      {isNorwegian 
                        ? "Full avvikshåndtering med korrigerende tiltak og QMS-kategorier" 
                        : "Full deviation handling with corrective actions and QMS categories"}
                    </p>
                    <Button onClick={() => navigate("/deviations")}>
                      {isNorwegian ? "Gå til avviksregister" : "Go to deviation register"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="vendor-feed">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <ShieldAlert className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">
                      {isNorwegian ? "Leverandør-hendelseslogg" : "Vendor Incident Feed"}
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      {isNorwegian 
                        ? "Se live hendelser fra leverandører som 7 Security i Lara Innboks" 
                        : "View live incidents from vendors like 7 Security in Lara Inbox"}
                    </p>
                    <Button onClick={() => navigate("/lara-inbox")}>
                      {isNorwegian ? "Gå til Lara Innboks" : "Go to Lara Inbox"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
