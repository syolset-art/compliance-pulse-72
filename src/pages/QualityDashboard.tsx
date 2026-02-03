import { useState } from "react";
import { useTranslation } from "react-i18next";
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
  CheckCircle2,
  Clock,
  ArrowRight,
  Plus
} from "lucide-react";
import { cn } from "@/lib/utils";

// Demo data for the quality dashboard
const qualityMetrics = {
  overallScore: 78,
  deviationsOpen: 3,
  deviationsClosed: 12,
  auditsPlanned: 2,
  auditsCompleted: 5,
  sjaCount: 24,
  equipmentDue: 4,
  competencyExpiring: 2
};

const recentDeviations = [
  { id: 1, title: "Manglende verneutstyr på byggeplass", status: "open", severity: "high", date: "2026-02-01" },
  { id: 2, title: "Utgått HMS-datablad for løsemiddel", status: "in_progress", severity: "medium", date: "2026-01-28" },
  { id: 3, title: "Manglende SJA for høydearbeid", status: "closed", severity: "high", date: "2026-01-25" },
];

const upcomingTasks = [
  { id: 1, title: "Årlig internrevisjon HMS", dueDate: "2026-02-15", type: "audit" },
  { id: 2, title: "Kalibrering måleutstyr", dueDate: "2026-02-20", type: "equipment" },
  { id: 3, title: "Førstehjelpskurs fornyelse", dueDate: "2026-03-01", type: "competency" },
  { id: 4, title: "Brannøvelse Q1", dueDate: "2026-03-10", type: "emergency" },
];

export default function QualityDashboard() {
  const { t, i18n } = useTranslation();
  const isNorwegian = i18n.language === 'nb' || i18n.language === 'no';
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto">
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
            <Button>
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
                      {isNorwegian ? "Samlet score" : "Overall Score"}
                    </p>
                    <p className="text-2xl font-bold">{qualityMetrics.overallScore}%</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-green-500" />
                  </div>
                </div>
                <Progress value={qualityMetrics.overallScore} className="mt-3 h-2" />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {isNorwegian ? "Åpne avvik" : "Open Deviations"}
                    </p>
                    <p className="text-2xl font-bold">{qualityMetrics.deviationsOpen}</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-amber-500/10 flex items-center justify-center">
                    <AlertTriangle className="h-6 w-6 text-amber-500" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {qualityMetrics.deviationsClosed} {isNorwegian ? "lukket denne måneden" : "closed this month"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {isNorwegian ? "SJA-er utført" : "SJAs Performed"}
                    </p>
                    <p className="text-2xl font-bold">{qualityMetrics.sjaCount}</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                    <FileCheck className="h-6 w-6 text-blue-500" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {isNorwegian ? "Siste 30 dager" : "Last 30 days"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {isNorwegian ? "Utstyr til service" : "Equipment Due"}
                    </p>
                    <p className="text-2xl font-bold">{qualityMetrics.equipmentDue}</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-purple-500/10 flex items-center justify-center">
                    <Wrench className="h-6 w-6 text-purple-500" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {isNorwegian ? "Neste 14 dager" : "Next 14 days"}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Tabs for different sections */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid grid-cols-5 w-full max-w-2xl">
              <TabsTrigger value="overview">
                {isNorwegian ? "Oversikt" : "Overview"}
              </TabsTrigger>
              <TabsTrigger value="deviations">
                {isNorwegian ? "Avvik" : "Deviations"}
              </TabsTrigger>
              <TabsTrigger value="sja">SJA</TabsTrigger>
              <TabsTrigger value="equipment">
                {isNorwegian ? "Utstyr" : "Equipment"}
              </TabsTrigger>
              <TabsTrigger value="competency">
                {isNorwegian ? "Kompetanse" : "Competency"}
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
                    {recentDeviations.map((deviation) => (
                      <div 
                        key={deviation.id}
                        className="flex items-start justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                      >
                        <div className="flex-1">
                          <p className="text-sm font-medium">{deviation.title}</p>
                          <p className="text-xs text-muted-foreground">{deviation.date}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={
                              deviation.status === 'closed' ? 'secondary' :
                              deviation.severity === 'high' ? 'destructive' : 'outline'
                            }
                          >
                            {deviation.status === 'closed' 
                              ? (isNorwegian ? 'Lukket' : 'Closed')
                              : deviation.status === 'in_progress'
                              ? (isNorwegian ? 'Pågår' : 'In Progress')
                              : (isNorwegian ? 'Åpen' : 'Open')
                            }
                          </Badge>
                        </div>
                      </div>
                    ))}
                    <Button variant="ghost" className="w-full mt-2">
                      {isNorwegian ? "Se alle avvik" : "View all deviations"}
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>

                {/* Upcoming Tasks */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      {isNorwegian ? "Kommende oppgaver" : "Upcoming Tasks"}
                    </CardTitle>
                    <CardDescription>
                      {isNorwegian ? "Planlagte aktiviteter" : "Scheduled activities"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {upcomingTasks.map((task) => (
                      <div 
                        key={task.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "h-8 w-8 rounded-full flex items-center justify-center",
                            task.type === 'audit' && "bg-blue-500/10",
                            task.type === 'equipment' && "bg-purple-500/10",
                            task.type === 'competency' && "bg-green-500/10",
                            task.type === 'emergency' && "bg-red-500/10"
                          )}>
                            {task.type === 'audit' && <FileCheck className="h-4 w-4 text-blue-500" />}
                            {task.type === 'equipment' && <Wrench className="h-4 w-4 text-purple-500" />}
                            {task.type === 'competency' && <Users className="h-4 w-4 text-green-500" />}
                            {task.type === 'emergency' && <AlertTriangle className="h-4 w-4 text-red-500" />}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{task.title}</p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {task.dueDate}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
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
                    <Button variant="outline" className="h-auto py-4 flex-col gap-2">
                      <AlertTriangle className="h-5 w-5" />
                      <span className="text-sm">
                        {isNorwegian ? "Registrer avvik" : "Register Deviation"}
                      </span>
                    </Button>
                    <Button variant="outline" className="h-auto py-4 flex-col gap-2">
                      <FileCheck className="h-5 w-5" />
                      <span className="text-sm">
                        {isNorwegian ? "Ny SJA" : "New SJA"}
                      </span>
                    </Button>
                    <Button variant="outline" className="h-auto py-4 flex-col gap-2">
                      <FlaskConical className="h-5 w-5" />
                      <span className="text-sm">
                        {isNorwegian ? "Stoffkartotek" : "Chemical Registry"}
                      </span>
                    </Button>
                    <Button variant="outline" className="h-auto py-4 flex-col gap-2">
                      <Wrench className="h-5 w-5" />
                      <span className="text-sm">
                        {isNorwegian ? "Utstyrsregister" : "Equipment Register"}
                      </span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="deviations">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-12">
                    <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">
                      {isNorwegian ? "Avviksregister" : "Deviation Register"}
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      {isNorwegian 
                        ? "Full avvikshåndtering med korrigerende tiltak" 
                        : "Full deviation handling with corrective actions"}
                    </p>
                    <Button>
                      {isNorwegian ? "Gå til avviksregister" : "Go to deviation register"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="sja">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-12">
                    <FileCheck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">
                      {isNorwegian ? "SJA-register" : "SJA Register"}
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      {isNorwegian 
                        ? "Sikker Jobb Analyse med maler og digital signering" 
                        : "Safe Job Analysis with templates and digital signing"}
                    </p>
                    <Button>
                      {isNorwegian ? "Opprett ny SJA" : "Create new SJA"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="equipment">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-12">
                    <Wrench className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">
                      {isNorwegian ? "Utstyrsregister" : "Equipment Register"}
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      {isNorwegian 
                        ? "Sertifikater, vedlikehold og kalibrering" 
                        : "Certificates, maintenance and calibration"}
                    </p>
                    <Button>
                      {isNorwegian ? "Legg til utstyr" : "Add equipment"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="competency">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">
                      {isNorwegian ? "Kompetanseoversikt" : "Competency Overview"}
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      {isNorwegian 
                        ? "Kurs, sertifiseringer og opplæringsplaner" 
                        : "Courses, certifications and training plans"}
                    </p>
                    <Button>
                      {isNorwegian ? "Se kompetansematrise" : "View competency matrix"}
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
