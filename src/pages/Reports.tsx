import { Sidebar } from "@/components/Sidebar";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileText, 
  Shield, 
  AlertTriangle, 
  Users, 
  Globe, 
  Server, 
  Lock,
  ClipboardCheck,
  Download,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  FileWarning,
  Building2,
  Network,
  Eye,
  Bot
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { AIActReportDialog } from "@/components/reports/AIActReportDialog";
import { useNavigate } from "react-router-dom";

interface ReportCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  status: 'ready' | 'draft' | 'pending' | 'overdue';
  lastGenerated?: string;
  nextDue?: string;
  standard: string[];
  onClick?: () => void;
}

const ReportCard = ({ title, description, icon, status, lastGenerated, nextDue, standard, onClick }: ReportCardProps) => {
  const getStatusBadge = () => {
    switch (status) {
      case 'ready':
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20"><CheckCircle className="h-3 w-3 mr-1" /> Klar</Badge>;
      case 'draft':
        return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20"><Clock className="h-3 w-3 mr-1" /> Utkast</Badge>;
      case 'pending':
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20"><Clock className="h-3 w-3 mr-1" /> Venter</Badge>;
      case 'overdue':
        return <Badge className="bg-red-500/10 text-red-600 border-red-500/20"><AlertCircle className="h-3 w-3 mr-1" /> Forfalt</Badge>;
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer group" onClick={onClick}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
              {icon}
            </div>
            <div>
              <CardTitle className="text-base">{title}</CardTitle>
              <CardDescription className="text-xs mt-1">{description}</CardDescription>
            </div>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex flex-wrap gap-1 mb-3">
          {standard.map((s) => (
            <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
          ))}
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            {lastGenerated && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Sist: {lastGenerated}
              </span>
            )}
            {nextDue && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Frist: {nextDue}
              </span>
            )}
          </div>
          <Button variant="ghost" size="sm" className="h-7 px-2">
            <Download className="h-3 w-3 mr-1" />
            Last ned
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const Reports = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const gdprReports = [
    {
      title: "Behandlingsprotokoll (ROPA)",
      description: "Komplett oversikt over all personopplysningsbehandling i virksomheten",
      icon: <FileText className="h-5 w-5" />,
      status: 'ready' as const,
      lastGenerated: "10. jan 2026",
      nextDue: "10. apr 2026",
      standard: ["GDPR Art. 30"],
      onClick: () => navigate("/protocols"),
    },
    {
      title: "DPIA - Konsekvensanalyse",
      description: "Vurdering av personvernkonsekvenser for høyrisikobehandlinger",
      icon: <AlertTriangle className="h-5 w-5" />,
      status: 'draft' as const,
      lastGenerated: "5. des 2025",
      nextDue: "15. jan 2026",
      standard: ["GDPR Art. 35"]
    },
    {
      title: "Databehandleravtaler",
      description: "Oversikt over alle databehandlere og avtalestatus",
      icon: <Users className="h-5 w-5" />,
      status: 'ready' as const,
      lastGenerated: "8. jan 2026",
      standard: ["GDPR Art. 28"]
    },
    {
      title: "Dataoverføringsrapport",
      description: "Oversikt over overføringer til tredjeland og rettsgrunnlag",
      icon: <Globe className="h-5 w-5" />,
      status: 'pending' as const,
      nextDue: "20. jan 2026",
      standard: ["GDPR Art. 44-49"]
    },
    {
      title: "Avvikslogg (Bruddregister)",
      description: "Register over sikkerhetsbrudd og tiltak",
      icon: <FileWarning className="h-5 w-5" />,
      status: 'ready' as const,
      lastGenerated: "12. jan 2026",
      standard: ["GDPR Art. 33-34"]
    },
    {
      title: "Innsynsforespørsler",
      description: "Logg over registrertes henvendelser og behandling",
      icon: <Eye className="h-5 w-5" />,
      status: 'ready' as const,
      lastGenerated: "11. jan 2026",
      standard: ["GDPR Art. 15-22"]
    }
  ];

  const nis2Reports = [
    {
      title: "Risikovurderingsrapport",
      description: "Omfattende vurdering av cybersikkerhetsrisiko",
      icon: <Shield className="h-5 w-5" />,
      status: 'ready' as const,
      lastGenerated: "3. jan 2026",
      nextDue: "3. apr 2026",
      standard: ["NIS2 Art. 21"]
    },
    {
      title: "Hendelsesrapport",
      description: "Dokumentasjon av sikkerhetshendelser og respons",
      icon: <AlertCircle className="h-5 w-5" />,
      status: 'ready' as const,
      lastGenerated: "12. jan 2026",
      standard: ["NIS2 Art. 23"]
    },
    {
      title: "Forsyningskjedesikkerhet",
      description: "Vurdering av leverandører og underleverandører",
      icon: <Network className="h-5 w-5" />,
      status: 'draft' as const,
      lastGenerated: "20. des 2025",
      nextDue: "31. jan 2026",
      standard: ["NIS2 Art. 21(2)(d)"]
    },
    {
      title: "Kontinuitetsplan",
      description: "Business continuity og krisehåndteringsplan",
      icon: <Server className="h-5 w-5" />,
      status: 'pending' as const,
      nextDue: "28. feb 2026",
      standard: ["NIS2 Art. 21(2)(c)"]
    },
    {
      title: "Sikkerhetstiltak",
      description: "Dokumentasjon av implementerte sikkerhetstiltak",
      icon: <Lock className="h-5 w-5" />,
      status: 'ready' as const,
      lastGenerated: "8. jan 2026",
      standard: ["NIS2 Art. 21(2)"]
    },
    {
      title: "Opplæringsrapport",
      description: "Oversikt over sikkerhetsopplæring og kompetanse",
      icon: <Users className="h-5 w-5" />,
      status: 'overdue' as const,
      nextDue: "1. jan 2026",
      standard: ["NIS2 Art. 21(2)(g)"]
    }
  ];

  const iso27001Reports = [
    {
      title: "Statement of Applicability (SoA)",
      description: "Oversikt over valgte kontroller og begrunnelser",
      icon: <ClipboardCheck className="h-5 w-5" />,
      status: 'ready' as const,
      lastGenerated: "1. jan 2026",
      nextDue: "1. jul 2026",
      standard: ["ISO 27001 A.5-A.18"]
    },
    {
      title: "ISMS Statusrapport",
      description: "Status for informasjonssikkerhetssystemet",
      icon: <Shield className="h-5 w-5" />,
      status: 'ready' as const,
      lastGenerated: "5. jan 2026",
      standard: ["ISO 27001 §4-10"]
    },
    {
      title: "Intern revisjonsrapport",
      description: "Funn og avvik fra interne revisjoner",
      icon: <FileText className="h-5 w-5" />,
      status: 'draft' as const,
      lastGenerated: "15. des 2025",
      nextDue: "15. mar 2026",
      standard: ["ISO 27001 §9.2"]
    },
    {
      title: "Ledelsens gjennomgang",
      description: "Dokumentasjon fra ledelsens gjennomgang",
      icon: <Building2 className="h-5 w-5" />,
      status: 'pending' as const,
      nextDue: "31. mar 2026",
      standard: ["ISO 27001 §9.3"]
    },
    {
      title: "Risikobehandlingsplan",
      description: "Plan for håndtering av identifiserte risikoer",
      icon: <AlertTriangle className="h-5 w-5" />,
      status: 'ready' as const,
      lastGenerated: "10. jan 2026",
      standard: ["ISO 27001 §6.1.3"]
    },
    {
      title: "Avviksrapport",
      description: "Oversikt over avvik og korrigerende tiltak",
      icon: <FileWarning className="h-5 w-5" />,
      status: 'ready' as const,
      lastGenerated: "12. jan 2026",
      standard: ["ISO 27001 §10.1"]
    }
  ];

  // Calculate summary stats
  const allReports = [...gdprReports, ...nis2Reports, ...iso27001Reports];
  const readyCount = allReports.filter(r => r.status === 'ready').length;
  const draftCount = allReports.filter(r => r.status === 'draft').length;
  const pendingCount = allReports.filter(r => r.status === 'pending').length;
  const overdueCount = allReports.filter(r => r.status === 'overdue').length;
  const completionRate = Math.round((readyCount / allReports.length) * 100);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto pt-11">
        <div className="container max-w-7xl mx-auto px-4 pt-8 pb-4 md:p-6 space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">{t('reports.title', 'Rapporter')}</h1>
              <p className="text-muted-foreground mt-1">{t('reports.subtitle', 'Compliance-rapporter for GDPR, NIS2 og ISO 27001')}</p>
            </div>
            <Button className="w-full sm:w-auto">
              <FileText className="h-4 w-4 mr-2" />
              Generer ny rapport
            </Button>
          </div>

          {/* Compact Summary */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm px-1">
            <span className="text-muted-foreground">Totalt <span className="font-semibold text-foreground">{allReports.length}</span></span>
            <span className="text-muted-foreground">Klare <span className="font-semibold text-green-600">{readyCount}</span></span>
            <span className="text-muted-foreground">Utkast <span className="font-semibold text-yellow-600">{draftCount}</span></span>
            <span className="text-muted-foreground">Venter <span className="font-semibold text-blue-600">{pendingCount}</span></span>
            <span className="text-muted-foreground">Forfalt <span className="font-semibold text-red-600">{overdueCount}</span></span>
            <div className="flex items-center gap-2 ml-auto">
              <Progress value={completionRate} className="h-1.5 w-24" />
              <span className="text-xs text-muted-foreground">{completionRate}%</span>
            </div>
          </div>

          {/* Report Tabs */}
          <Tabs defaultValue="organisasjon" className="space-y-4">
            <TabsList className="flex w-full overflow-x-auto justify-start lg:inline-flex lg:w-auto">
              <TabsTrigger value="organisasjon" className="flex items-center gap-1.5 text-xs sm:text-sm">
                <Building2 className="h-3.5 w-3.5" />
                Organisasjon
              </TabsTrigger>
              <TabsTrigger value="gdpr" className="flex items-center gap-1.5 text-xs sm:text-sm">
                <Shield className="h-3.5 w-3.5" />
                GDPR
                <Badge variant="secondary" className="ml-1 hidden sm:inline-flex">{gdprReports.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="nis2" className="flex items-center gap-1.5 text-xs sm:text-sm">
                <Server className="h-3.5 w-3.5" />
                NIS2
                <Badge variant="secondary" className="ml-1 hidden sm:inline-flex">{nis2Reports.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="iso27001" className="flex items-center gap-1.5 text-xs sm:text-sm">
                <ClipboardCheck className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">ISO 27001</span><span className="sm:hidden">ISO</span>
                <Badge variant="secondary" className="ml-1 hidden sm:inline-flex">{iso27001Reports.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="aiact" className="flex items-center gap-1.5 text-xs sm:text-sm">
                <Bot className="h-3.5 w-3.5" />
                AI Act
              </TabsTrigger>
            </TabsList>

            <TabsContent value="organisasjon" className="space-y-4">
              <Card className="hover:shadow-md transition-shadow cursor-pointer group" onClick={() => navigate('/reports/compliance')}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Shield className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base">Samsvar</CardTitle>
                        <CardDescription className="mt-1">
                          Organisasjonsnivå på tvers av fire kategorier og valgte regelverk
                        </CardDescription>
                      </div>
                    </div>
                    <Badge className="bg-green-500/10 text-green-600 border-green-500/20"><CheckCircle className="h-3 w-3 mr-1" /> Klar</Badge>
                  </div>
                </CardHeader>
                <CardContent className="pb-4">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Modenhetsoversikt, forbedringspunkter og regelverk</span>
                    <Button variant="ghost" size="sm" className="h-7 px-2 gap-1 text-primary">
                      Åpne
                      <Eye className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="gdpr" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {gdprReports.map((report, index) => (
                  <ReportCard key={index} {...report} onClick={report.onClick} />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="nis2" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {nis2Reports.map((report, index) => (
                  <ReportCard key={index} {...report} />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="iso27001" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {iso27001Reports.map((report, index) => (
                  <ReportCard key={index} {...report} />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="aiact" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bot className="h-5 w-5 text-primary" />
                    AI Act Compliance Rapport
                  </CardTitle>
                  <CardDescription>
                    Generer en komplett PDF-rapport som dokumenterer all AI-bruk i virksomheten, 
                    inkludert risikovurderinger, transparenskrav og compliance-status.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-medium text-sm">Rapporten inkluderer:</h4>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          Oversikt over alle AI-systemer og prosesser
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          Risikoklassifisering iht. AI Act
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          Transparens- og tilsynskrav
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          Berørte persongrupper
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          Compliance-anbefalinger
                        </li>
                      </ul>
                    </div>
                    <div className="flex flex-col justify-center items-center p-6 bg-muted/50 rounded-lg">
                      <Bot className="h-16 w-16 text-primary/50 mb-4" />
                      <AIActReportDialog 
                        trigger={
                          <Button size="lg" className="w-full">
                            <Download className="h-4 w-4 mr-2" />
                            Generer AI Act Rapport
                          </Button>
                        }
                      />
                      <p className="text-xs text-muted-foreground mt-3 text-center">
                        Rapporten genereres basert på registrerte data
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Reports;
