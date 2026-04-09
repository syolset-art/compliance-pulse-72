import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield, Lock, Brain, Scale, CheckCircle2, AlertTriangle, ArrowRight } from "lucide-react";
import { frameworks, categories, getCategoryById } from "@/lib/frameworkDefinitions";
import { ReportActionButtons } from "@/components/reports/ReportActionButtons";
import type { ReportData } from "@/components/reports/DownloadReportDialog";
import { getRequirementsByFramework } from "@/lib/complianceRequirementsData";
import { ALL_ADDITIONAL_REQUIREMENTS } from "@/lib/additionalFrameworkRequirements";

// Demo: which frameworks are "active" in scope
const ACTIVE_FRAMEWORK_IDS = [
  'gdpr', 'personopplysningsloven', 'iso27001', 'nis2', 'nsm',
  'ai-act', 'iso42001', 'apenhetsloven', 'arbeidsmiljoloven',
];

// Pillar definitions
const PILLARS = [
  { id: 'governance', name: 'Styring', score: 94, color: 'bg-emerald-500', badgeColor: 'text-emerald-700 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-900/40', level: 'HØY', measures: 4 },
  { id: 'operations', name: 'Drift og sikkerhet', score: 77, color: 'bg-amber-500', badgeColor: 'text-amber-700 bg-amber-100 dark:text-amber-400 dark:bg-amber-900/40', level: 'MIDDELS', measures: 5 },
  { id: 'identity_access', name: 'Identitet og tilgang', score: 92, color: 'bg-emerald-500', badgeColor: 'text-emerald-700 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-900/40', level: 'HØY', measures: 5 },
  { id: 'privacy_data', name: 'Personvern og datahåndtering', score: 68, color: 'bg-amber-500', badgeColor: 'text-amber-700 bg-amber-100 dark:text-amber-400 dark:bg-amber-900/40', level: 'MIDDELS', measures: 4 },
  { id: 'supplier', name: 'Leverandører og økosystem', score: 61, color: 'bg-amber-500', badgeColor: 'text-amber-700 bg-amber-100 dark:text-amber-400 dark:bg-amber-900/40', level: 'MIDDELS', measures: 3 },
];

interface FrameworkScore {
  id: string;
  name: string;
  icon: typeof Shield;
  iconColor: string;
  score: number;
  level: string;
  levelColor: string;
  fulfilled: number;
  total: number;
  progressColor: string;
}

function getRequirementsCount(frameworkId: string): number {
  const main = getRequirementsByFramework(frameworkId);
  if (main.length > 0) return main.length;
  return ALL_ADDITIONAL_REQUIREMENTS.filter(r => r.framework_id === frameworkId).length;
}

function getLevelInfo(score: number): { level: string; color: string } {
  if (score >= 80) return { level: 'HØY', color: 'text-emerald-700 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-900/40' };
  if (score >= 40) return { level: 'MIDDELS', color: 'text-amber-700 bg-amber-100 dark:text-amber-400 dark:bg-amber-900/40' };
  return { level: 'LAV', color: 'text-red-700 bg-red-100 dark:text-red-400 dark:bg-red-900/40' };
}

// Improvement point demo data
const IMPROVEMENTS = [
  { title: 'Leverandørkjede-vurdering mangler', pillar: 'Leverandører', severity: 'high', framework: 'NIS2' },
  { title: 'Backup-rutiner ikke verifisert', pillar: 'Drift og sikkerhet', severity: 'high', framework: 'ISO 27001' },
  { title: 'AI-konsekvensanalyse ikke gjennomført', pillar: 'Styring', severity: 'medium', framework: 'AI Act' },
  { title: 'Aktsomhetsvurdering ikke oppdatert', pillar: 'Leverandører', severity: 'medium', framework: 'Åpenhetsloven' },
  { title: 'MFA ikke aktivert for alle adminer', pillar: 'Identitet og tilgang', severity: 'high', framework: 'NSM' },
  { title: 'HMS-mål mangler dokumentasjon', pillar: 'Styring', severity: 'low', framework: 'Arbeidsmiljøloven' },
];

// Measure point demo data
const MEASURES = [
  { title: 'Informasjonssikkerhetspolicy godkjent', pillar: 'Styring', status: 'ok' },
  { title: 'ROPA oppdatert siste 12 mnd', pillar: 'Styring', status: 'ok' },
  { title: 'Tilgangskontroll implementert', pillar: 'Identitet og tilgang', status: 'ok' },
  { title: 'Hendelseshåndteringsprosess definert', pillar: 'Drift og sikkerhet', status: 'ok' },
  { title: 'DPA med alle databehandlere', pillar: 'Leverandører', status: 'partial' },
  { title: 'Risikovurdering gjennomført', pillar: 'Drift og sikkerhet', status: 'ok' },
  { title: 'Sikkerhetskopier testet', pillar: 'Drift og sikkerhet', status: 'missing' },
  { title: 'AI-systemregister opprettet', pillar: 'Styring', status: 'ok' },
  { title: 'Verneombud utnevnt', pillar: 'Styring', status: 'ok' },
  { title: 'Leverandørvurdering gjennomført', pillar: 'Leverandører', status: 'missing' },
];

const ComplianceOverview = () => {
  const navigate = useNavigate();

  const overallScore = useMemo(() => {
    return Math.round(PILLARS.reduce((sum, p) => sum + p.score, 0) / PILLARS.length);
  }, []);

  const frameworkScores: FrameworkScore[] = useMemo(() => {
    return ACTIVE_FRAMEWORK_IDS.map(fwId => {
      const fw = frameworks.find(f => f.id === fwId);
      if (!fw) return null;
      const cat = getCategoryById(fw.category);
      const total = getRequirementsCount(fwId);
      // Deterministic demo score
      const hash = fwId.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
      const score = Math.max(25, Math.min(95, (hash % 70) + 25));
      const fulfilled = Math.round((score / 100) * total);
      const { level, color } = getLevelInfo(score);
      const progressColors: Record<string, string> = {
        privacy: 'bg-blue-500',
        security: 'bg-blue-500',
        ai: 'bg-purple-500',
        other: 'bg-amber-500',
      };

      return {
        id: fwId,
        name: fw.name,
        icon: cat?.icon || Shield,
        iconColor: cat?.color || 'text-muted-foreground',
        score,
        level,
        levelColor: color,
        fulfilled,
        total,
        progressColor: progressColors[fw.category] || 'bg-primary',
      };
    }).filter(Boolean) as FrameworkScore[];
  }, []);

  const reportData: ReportData = useMemo(() => ({
    overallScore,
    pillars: PILLARS.map(p => ({ name: p.name, score: p.score, level: p.level, measures: p.measures })),
    improvements: IMPROVEMENTS,
    measures: MEASURES,
    frameworks: frameworkScores.map(fw => ({
      id: fw.id, name: fw.name, score: fw.score, level: fw.level, fulfilled: fw.fulfilled, total: fw.total,
    })),
  }), [overallScore, frameworkScores]);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto md:pt-11">
        <div className="p-6 max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/reports")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-foreground">Samsvar</h1>
              <p className="text-muted-foreground text-sm">
                Organisasjonsnivå på tvers av fem kategorier og valgte regelverk
              </p>
            </div>
            <ReportActionButtons
              reportName="Samsvarsrapport"
              reportId="compliance-overview"
              reportData={reportData}
            />
          </div>

          {/* Maturity hero */}
          <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
            <CardContent className="p-6 space-y-5">
              {/* Overall score row */}
              <div className="flex items-center gap-4">
                <div className="flex items-baseline gap-3">
                  <p className="text-5xl font-bold text-foreground">{overallScore}%</p>
                  <p className="text-sm font-medium text-primary">Samlet modenhet</p>
                </div>
                <p className="text-xs text-muted-foreground ml-auto max-w-xs text-right leading-relaxed hidden lg:block">
                  Scoren bygger på eksplisitte org-målepunkter på tvers av fem domener.
                </p>
              </div>

              {/* Pillars grid - 5 columns */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {PILLARS.map((pillar) => (
                  <Card key={pillar.id} className="border">
                    <CardContent className="p-3 space-y-1.5">
                      <div className="flex items-center justify-between gap-1">
                        <p className="text-xs font-semibold text-foreground leading-tight">{pillar.name}</p>
                        <Badge className={`text-[10px] px-1.5 py-0 ${pillar.badgeColor} border-0 shrink-0`}>
                          {pillar.level}
                        </Badge>
                      </div>
                      <p className="text-2xl font-bold text-foreground">{pillar.score}%</p>
                      <Progress value={pillar.score} className="h-1" />
                      <p className="text-[10px] text-muted-foreground">
                        {pillar.measures} målepunkter
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs defaultValue="regelverk" className="space-y-4">
            <TabsList>
              <TabsTrigger value="forbedring">Forbedringspunkter</TabsTrigger>
              <TabsTrigger value="malepunkter">Målepunkter</TabsTrigger>
              <TabsTrigger value="regelverk">Regelverk</TabsTrigger>
            </TabsList>

            {/* Forbedringspunkter */}
            <TabsContent value="forbedring" className="space-y-3">
              {IMPROVEMENTS.map((item, i) => (
                <Card key={i} className="hover:border-primary/30 transition-colors cursor-pointer">
                  <CardContent className="p-4 flex items-center gap-4">
                    <AlertTriangle className={`h-5 w-5 shrink-0 ${
                      item.severity === 'high' ? 'text-destructive' : item.severity === 'medium' ? 'text-amber-500' : 'text-muted-foreground'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.pillar}</p>
                    </div>
                    <Badge variant="outline" className="text-xs shrink-0">{item.framework}</Badge>
                    <Badge variant={item.severity === 'high' ? 'destructive' : 'secondary'} className="text-[10px] shrink-0">
                      {item.severity === 'high' ? 'Høy' : item.severity === 'medium' ? 'Middels' : 'Lav'}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            {/* Målepunkter */}
            <TabsContent value="malepunkter" className="space-y-3">
              {MEASURES.map((item, i) => (
                <Card key={i}>
                  <CardContent className="p-4 flex items-center gap-4">
                    {item.status === 'ok' ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                    ) : item.status === 'partial' ? (
                      <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.pillar}</p>
                    </div>
                    <Badge variant={item.status === 'ok' ? 'secondary' : item.status === 'partial' ? 'outline' : 'destructive'} className="text-[10px] shrink-0">
                      {item.status === 'ok' ? 'Oppfylt' : item.status === 'partial' ? 'Delvis' : 'Mangler'}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            {/* Regelverk */}
            <TabsContent value="regelverk">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {frameworkScores.map((fw) => {
                  const Icon = fw.icon;
                  return (
                    <Card
                      key={fw.id}
                      className="hover:border-primary/30 transition-colors cursor-pointer group"
                      onClick={() => navigate(`/regulations/${fw.id}`)}
                    >
                      <CardContent className="p-5">
                        <div className="flex items-center gap-4">
                          {/* Circular progress */}
                          <div className="relative h-16 w-16 shrink-0">
                            <svg className="h-16 w-16 -rotate-90" viewBox="0 0 64 64">
                              <circle
                                cx="32" cy="32" r="28"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="4"
                                className="text-muted/30"
                              />
                              <circle
                                cx="32" cy="32" r="28"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="4"
                                strokeDasharray={`${(fw.score / 100) * 175.93} 175.93`}
                                strokeLinecap="round"
                                className={fw.iconColor}
                              />
                            </svg>
                            <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-foreground">
                              {fw.score}%
                            </span>
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0 space-y-1.5">
                            <div className="flex items-center gap-2">
                              <Icon className={`h-4 w-4 ${fw.iconColor} shrink-0`} />
                              <span className="font-semibold text-sm text-foreground truncate">
                                {fw.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className={`text-[10px] px-1.5 py-0 border-0 ${fw.levelColor}`}>
                                {fw.level}
                              </Badge>
                              <span className="text-[11px] text-muted-foreground">
                                {fw.fulfilled}/{fw.total} OPPFYLT
                              </span>
                            </div>
                            <Progress value={fw.score} className="h-1.5" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default ComplianceOverview;
