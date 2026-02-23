import { useState, useRef, useMemo } from "react";
import { Sidebar } from "@/components/Sidebar";
import { useTranslation } from "react-i18next";
import { useIsMobile } from "@/hooks/use-mobile";
import { SupportChat } from "@/components/support/SupportChat";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useComplianceRequirements } from "@/hooks/useComplianceRequirements";
import {
  CERTIFICATION_PHASES,
  getPhaseStatus,
  type CertificationPhase,
  type PhaseDefinition,
} from "@/lib/certificationPhases";
import {
  Shield, Scale, FileText, Bot, ArrowRight, ChevronDown,
  CheckCircle2, Circle, Loader2, BookOpen, ExternalLink, Sparkles,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const knowledgeCards = [
  { id: "gdpr", icon: Shield, title: "GDPR", desc: "Personvern og databehandling", articles: 6, color: "text-blue-500", bg: "bg-blue-500/10" },
  { id: "nis2", icon: Scale, title: "NIS2", desc: "Cybersikkerhet og beredskap", articles: 0, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  { id: "iso27001", icon: FileText, title: "ISO 27001", desc: "Informasjonssikkerhet", articles: 0, color: "text-amber-500", bg: "bg-amber-500/10" },
  { id: "aiact", icon: Bot, title: "AI Act", desc: "AI-regulering og etikk", articles: 0, color: "text-purple-500", bg: "bg-purple-500/10" },
];

const Resources = () => {
  const { t, i18n } = useTranslation();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const chatRef = useRef<HTMLDivElement>(null);
  const lang = i18n.language?.startsWith("en") ? "en" : "no";

  const { stats } = useComplianceRequirements();
  const progressPercent = stats.progressPercent;

  const corePhases = CERTIFICATION_PHASES.filter(p => !p.optional);
  const optionalPhases = CERTIFICATION_PHASES.filter(p => p.optional);

  // Default to the active phase
  const defaultPhase = useMemo(() => {
    for (const p of CERTIFICATION_PHASES) {
      const status = getPhaseStatus(p.id, progressPercent);
      if (status === 'in_progress') return p.id;
    }
    return 'foundation';
  }, [progressPercent]);

  const [selectedPhase, setSelectedPhase] = useState<CertificationPhase>(defaultPhase);
  const [learningOpen, setLearningOpen] = useState(false);

  const activePhase = CERTIFICATION_PHASES.find(p => p.id === selectedPhase)!;
  const phaseStatus = getPhaseStatus(selectedPhase, progressPercent);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">Fullført</Badge>;
      case 'in_progress':
        return <Badge className="bg-primary/15 text-primary border-primary/20">Aktiv fase</Badge>;
      default:
        return <Badge variant="secondary" className="text-muted-foreground">Neste</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
      case 'in_progress':
        return <Loader2 className="h-5 w-5 text-primary animate-spin" />;
      default:
        return <Circle className="h-5 w-5 text-muted-foreground/40" />;
    }
  };

  const PhaseStepper = () => (
    <div className="space-y-4">
      {/* Core phases */}
      <div className={`flex ${isMobile ? 'flex-col' : ''} gap-2`}>
        {corePhases.map((phase, i) => {
          const status = getPhaseStatus(phase.id, progressPercent);
          const isSelected = selectedPhase === phase.id;
          return (
            <div key={phase.id} className={`flex ${isMobile ? '' : 'flex-1'} items-center gap-2`}>
              <button
                onClick={() => { setSelectedPhase(phase.id); setLearningOpen(false); }}
                className={`flex-1 flex items-center gap-3 rounded-xl border p-3 transition-all duration-200 ${
                  isSelected
                    ? "border-primary/30 bg-primary/5 shadow-sm ring-1 ring-primary/20"
                    : "border-border/50 bg-card hover:border-primary/20 hover:bg-accent/50"
                }`}
              >
                {getStatusIcon(status)}
                <div className="text-left min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {lang === "en" ? phase.name_en : phase.name_no}
                  </p>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {status === 'completed' ? 'Fullført' : status === 'in_progress' ? 'Pågår' : 'Ikke startet'}
                  </p>
                </div>
              </button>
              {!isMobile && i < corePhases.length - 1 && (
                <ArrowRight className="h-4 w-4 text-muted-foreground/30 flex-shrink-0" />
              )}
            </div>
          );
        })}
      </div>

      {/* Optional phases separator */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-border/50" />
        <Badge variant="outline" className="text-[10px] text-muted-foreground border-dashed">Valgfritt</Badge>
        <div className="flex-1 h-px bg-border/50" />
      </div>

      {/* Optional phases */}
      <div className={`flex ${isMobile ? 'flex-col' : ''} gap-2`}>
        {optionalPhases.map((phase) => {
          const status = getPhaseStatus(phase.id, progressPercent);
          const isSelected = selectedPhase === phase.id;
          return (
            <button
              key={phase.id}
              onClick={() => { setSelectedPhase(phase.id); setLearningOpen(false); }}
              className={`flex-1 flex items-center gap-3 rounded-xl border border-dashed p-3 transition-all duration-200 ${
                isSelected
                  ? "border-primary/30 bg-primary/5 shadow-sm ring-1 ring-primary/20"
                  : "border-border/40 bg-card/50 hover:border-primary/20 hover:bg-accent/50 opacity-70 hover:opacity-100"
              }`}
            >
              {getStatusIcon(status)}
              <div className="text-left min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">
                  {lang === "en" ? phase.name_en : phase.name_no}
                </p>
                <p className="text-[11px] text-muted-foreground">Valgfritt</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );

  const PhaseDetail = ({ phase }: { phase: PhaseDefinition }) => {
    const status = getPhaseStatus(phase.id, progressPercent);
    const activities = lang === "en" ? phase.activities_en : phase.activities_no;
    const whatToExpect = lang === "en" ? phase.whatToExpect_en : phase.whatToExpect_no;
    const learningContent = lang === "en" ? phase.learningContent_en : phase.learningContent_no;
    const features = phase.mynderFeatures || [];

    return (
      <Card variant="flat" className="border-primary/10">
        <CardContent className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-foreground">
                  {lang === "en" ? phase.name_en : phase.name_no}
                </h2>
                {getStatusBadge(status)}
                {phase.optional && (
                  <Badge variant="outline" className="text-[10px] border-dashed text-muted-foreground">Valgfritt</Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {lang === "en" ? phase.description_en : phase.description_no}
              </p>
            </div>
          </div>

          {/* What to expect */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              Hva skjer i denne fasen?
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{whatToExpect}</p>
          </div>

          {/* Activities */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Aktiviteter</h3>
            <div className="grid gap-2">
              {activities.map((activity, i) => {
                const isCompleted = status === 'completed' || (status === 'in_progress' && i < Math.ceil(activities.length * (progressPercent / 100)));
                return (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    <Checkbox checked={isCompleted} disabled className="pointer-events-none" />
                    <span className={isCompleted ? "text-foreground" : "text-muted-foreground"}>{activity}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Mynder features */}
          {features.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Slik hjelper Mynder deg
              </h3>
              <div className="grid gap-2">
                {features.map((feature, i) => (
                  <button
                    key={i}
                    onClick={() => navigate(feature.route)}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border/50 bg-muted/30 px-4 py-3 text-left hover:bg-accent hover:border-primary/20 transition-all group"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">{lang === "en" ? feature.title_en : feature.title_no}</p>
                      <p className="text-xs text-muted-foreground truncate">{lang === "en" ? feature.description_en : feature.description_no}</p>
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground/50 group-hover:text-primary flex-shrink-0 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Learning content */}
          <Collapsible open={learningOpen} onOpenChange={setLearningOpen}>
            <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors">
              <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${learningOpen ? 'rotate-180' : ''}`} />
              Les mer om denne fasen
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-3">
              <div className="rounded-lg bg-muted/30 border border-border/30 p-4">
                <p className="text-sm text-foreground/80 leading-relaxed">{learningContent}</p>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>
    );
  };

  // --- Mobile layout ---
  if (isMobile) {
    return (
      <div className="flex min-h-screen w-full bg-background">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <div className="px-4 pb-6 space-y-5">
            <div className="pt-3 space-y-1">
              <h1 className="text-lg font-bold text-foreground">Ressurssenter</h1>
              <p className="text-sm text-muted-foreground">Forstå din compliance-prosess og hva du skal gjøre videre</p>
            </div>

            <PhaseStepper />
            <PhaseDetail phase={activePhase} />

            {/* Knowledge base */}
            <div className="space-y-2">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Kunnskapsbase</h2>
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {knowledgeCards.map((k) => {
                  const Icon = k.icon;
                  return (
                    <div key={k.id} className="flex-shrink-0 w-40 rounded-xl border border-border/50 bg-card p-3">
                      <div className={`h-8 w-8 rounded-lg ${k.bg} flex items-center justify-center mb-2`}>
                        <Icon className={`h-4 w-4 ${k.color}`} />
                      </div>
                      <p className="font-semibold text-xs text-foreground">{k.title}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{k.desc}</p>
                      {k.articles > 0 ? (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 mt-1.5 font-normal">{k.articles} artikler</Badge>
                      ) : (
                        <span className="text-[10px] text-muted-foreground/50 mt-1.5 block">Kommer snart</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Chat */}
            <div className="rounded-2xl border border-border/50 bg-card shadow-sm overflow-hidden" style={{ height: "400px" }}>
              <SupportChat activeContext={selectedPhase} onSelectContext={(id) => setSelectedPhase(id as CertificationPhase)} showContextChips={false} />
            </div>
          </div>
        </main>
      </div>
    );
  }

  // --- Desktop layout ---
  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto px-6 py-10 space-y-8">

          {/* Header */}
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground tracking-tight">Ressurssenter</h1>
                <p className="text-sm text-muted-foreground">
                  Forstå din compliance-prosess og hva du skal gjøre videre
                </p>
              </div>
            </div>
          </div>

          {/* Phase stepper */}
          <PhaseStepper />

          {/* Active phase detail */}
          <PhaseDetail phase={activePhase} />

          {/* Other phases as compact cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            {CERTIFICATION_PHASES.filter(p => p.id !== selectedPhase).map((phase) => {
              const status = getPhaseStatus(phase.id, progressPercent);
              return (
                <button
                  key={phase.id}
                  onClick={() => { setSelectedPhase(phase.id); setLearningOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className={`text-left rounded-xl border p-3 transition-all hover:border-primary/20 hover:shadow-sm ${
                    phase.optional ? "border-dashed border-border/40 opacity-70 hover:opacity-100" : "border-border/50"
                  } bg-card`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {getStatusIcon(status)}
                    <p className="text-xs font-semibold text-foreground truncate">
                      {lang === "en" ? phase.name_en : phase.name_no}
                    </p>
                  </div>
                  <p className="text-[11px] text-muted-foreground line-clamp-2">
                    {lang === "en" ? phase.description_en : phase.description_no}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Knowledge base */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest px-1">Kunnskapsbase</h2>
            <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
              {knowledgeCards.map((k) => {
                const Icon = k.icon;
                return (
                  <div key={k.id} className="flex-shrink-0 w-52 rounded-2xl border border-border/50 bg-card p-4 hover:border-primary/20 hover:shadow-sm transition-all cursor-pointer">
                    <div className={`h-9 w-9 rounded-lg ${k.bg} flex items-center justify-center mb-3`}>
                      <Icon className={`h-4.5 w-4.5 ${k.color}`} />
                    </div>
                    <p className="font-semibold text-sm text-foreground">{k.title}</p>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{k.desc}</p>
                    {k.articles > 0 ? (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 mt-2 font-normal">{k.articles} artikler</Badge>
                    ) : (
                      <span className="text-[10px] text-muted-foreground/50 mt-2 block">Kommer snart</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Chat */}
          <div ref={chatRef} className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest px-1">Chat med Lara</h2>
            <div className="rounded-2xl border border-border/50 bg-card shadow-md overflow-hidden ring-1 ring-primary/5" style={{ height: "500px" }}>
              <SupportChat activeContext={selectedPhase} onSelectContext={(id) => setSelectedPhase(id as CertificationPhase)} showContextChips={false} />
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default Resources;
