import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield, Lock, Brain, Scale, CheckCircle2, AlertTriangle, ArrowRight, ChevronRight } from "lucide-react";
import { CONTROL_AREAS, type ControlAreaKey } from "@/lib/controlAreas";
import { frameworks, categories, getCategoryById } from "@/lib/frameworkDefinitions";
import { ReportActionButtons } from "@/components/reports/ReportActionButtons";
import type { ReportData } from "@/components/reports/DownloadReportDialog";
import { getRequirementsByFramework } from "@/lib/complianceRequirementsData";
import { ALL_ADDITIONAL_REQUIREMENTS } from "@/lib/additionalFrameworkRequirements";
import { getMaturityLevel, maturityBgClass, maturitySoftClass, maturityLabelNb, maturityTextClass } from "@/lib/maturityLevel";
import { MaturityIndicator } from "@/components/shared/MaturityIndicator";

// Demo: which frameworks are "active" in scope
const ACTIVE_FRAMEWORK_IDS = [
  'gdpr', 'personopplysningsloven', 'iso27001', 'nis2', 'nsm',
  'ai-act', 'iso42001', 'apenhetsloven', 'arbeidsmiljoloven',
];

// Pillar definitions — bruker de fem kanoniske kontrollområdene (src/lib/controlAreas.ts)
const PILLAR_SCORES: Record<ControlAreaKey, { score: number; measures: number }> = {
  governance: { score: 94, measures: 4 },
  operations: { score: 77, measures: 5 },
  identityAccess: { score: 92, measures: 5 },
  privacy: { score: 68, measures: 4 },
  vendor: { score: 61, measures: 3 },
};

const PILLARS = CONTROL_AREAS.map((area) => {
  const { score, measures } = PILLAR_SCORES[area.key];
  const level = maturityLabelNb(getMaturityLevel(score)).toUpperCase();
  const color = maturityBgClass(score);
  const badgeColor = maturitySoftClass(score);
  return { id: area.key, name: area.labelNb, icon: area.icon, score, color, badgeColor, level, measures };
});

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
  return {
    level: maturityLabelNb(getMaturityLevel(score)).toUpperCase(),
    color: maturitySoftClass(score),
  };
}

// Improvement point demo data
const IMPROVEMENTS = [
  { title: 'Leverandørkjede-vurdering mangler', pillar: 'Leverandører', severity: 'high', framework: 'NIS2' },
  { title: 'Backup-rutiner ikke verifisert', pillar: 'Drift og sikkerhet', severity: 'high', framework: 'ISO 27001' },
  { title: 'AI-konsekvensanalyse ikke gjennomført', pillar: 'Styring', severity: 'medium', framework: 'AI Act' },
  { title: 'Aktsomhetsvurdering ikke oppdatert', pillar: 'Tredjepart og verdikjede', severity: 'medium', framework: 'Åpenhetsloven' },
  { title: 'MFA ikke aktivert for alle adminer', pillar: 'Drift og sikkerhet', severity: 'high', framework: 'NSM' },
  { title: 'HMS-mål mangler dokumentasjon', pillar: 'Styring', severity: 'low', framework: 'Arbeidsmiljøloven' },
];

// Measure point demo data
const MEASURES = [
  { title: 'Informasjonssikkerhetspolicy godkjent', pillar: 'Styring', status: 'ok' },
  { title: 'ROPA oppdatert siste 12 mnd', pillar: 'Styring', status: 'ok' },
  { title: 'Tilgangskontroll implementert', pillar: 'Drift og sikkerhet', status: 'ok' },
  { title: 'Hendelseshåndteringsprosess definert', pillar: 'Drift og sikkerhet', status: 'ok' },
  { title: 'DPA med alle databehandlere', pillar: 'Tredjepart og verdikjede', status: 'partial' },
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
        privacy: 'bg-primary',
        security: 'bg-primary',
        ai: 'bg-accent',
        other: 'bg-warning',
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
      <main className="flex-1 overflow-auto pt-11">
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

          {/* Modenhet per kontrollområde */}
          <Card>
            <CardContent className="p-4 sm:p-5 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-semibold text-foreground">Modenhet per kontrollområde</h2>
                <MaturityIndicator score={overallScore} variant="badge" showInfo />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {PILLARS.map((pillar) => (
                  <button
                    key={pillar.id}
                    onClick={() => navigate(`/regulations?area=${pillar.id}`)}
                    className="group flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5 text-left transition-colors hover:border-primary/40 hover:bg-muted/40"
                  >
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <pillar.icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <p className="truncate text-sm font-medium text-foreground">{pillar.name}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold tracking-wide ${pillar.badgeColor}`}>
                          {pillar.level}
                        </span>
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                          <div className={`h-full rounded-full ${pillar.color}`} style={{ width: `${pillar.score}%` }} />
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>


          {/* Tabs */}
          <Tabs defaultValue="forbedring" className="space-y-4">
            <TabsList>
              <TabsTrigger value="forbedring">Forbedringspunkter</TabsTrigger>
              <TabsTrigger value="malepunkter">Kontrollpunkter</TabsTrigger>
            </TabsList>

            {/* Forbedringspunkter */}
            <TabsContent value="forbedring" className="space-y-3">
              {IMPROVEMENTS.map((item, i) => (
                <Card key={i} className="hover:border-primary/30 transition-colors cursor-pointer">
                  <CardContent className="p-4 flex items-center gap-4">
                    <AlertTriangle className={`h-5 w-5 shrink-0 ${
                      item.severity === 'high' ? 'text-destructive' : item.severity === 'medium' ? 'text-warning' : 'text-muted-foreground'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.pillar}</p>
                    </div>
                    <Badge variant="outline" className="text-xs shrink-0">{item.framework}</Badge>
                    <Badge variant={item.severity === 'high' ? 'destructive' : 'secondary'} className="text-[13px] shrink-0">
                      {item.severity === 'high' ? 'Høy' : item.severity === 'medium' ? 'Middels' : 'Lav'}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            {/* Kontrollpunkter */}
            <TabsContent value="malepunkter" className="space-y-3">
              {MEASURES.map((item, i) => (
                <Card key={i}>
                  <CardContent className="p-4 flex items-center gap-4">
                    {item.status === 'ok' ? (
                      <CheckCircle2 className="h-5 w-5 text-status-closed shrink-0" />
                    ) : item.status === 'partial' ? (
                      <AlertTriangle className="h-5 w-5 text-warning shrink-0" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.pillar}</p>
                    </div>
                    <Badge variant={item.status === 'ok' ? 'secondary' : item.status === 'partial' ? 'outline' : 'destructive'} className="text-[13px] shrink-0">
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
                      onClick={() => navigate(`/trust-center/regulations`)}
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
                                className={maturityTextClass(fw.score)}
                              />
                            </svg>
                            <span className={`absolute inset-0 flex items-center justify-center text-[11px] font-bold ${maturityTextClass(fw.score)}`}>
                              {maturityLabelNb(getMaturityLevel(fw.score))}
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
                              <Badge className={`text-[13px] px-1.5 py-0 border-0 ${fw.levelColor}`}>
                                {fw.level}
                              </Badge>
                              <span className="text-[13px] text-muted-foreground">
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
