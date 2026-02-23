import { useState, useRef, useMemo } from "react";
import { Sidebar } from "@/components/Sidebar";
import { useTranslation } from "react-i18next";
import { useIsMobile } from "@/hooks/use-mobile";
import { SupportChat } from "@/components/support/SupportChat";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { useComplianceRequirements } from "@/hooks/useComplianceRequirements";
import {
  CERTIFICATION_PHASES,
  getPhaseStatus,
  type CertificationPhase,
  type PhaseDefinition,
} from "@/lib/certificationPhases";
import { REGULATORY_TOPICS, type RegulatoryTopic } from "@/lib/regulatoryArticles";
import { GLOSSARY_TERMS, GLOSSARY_CATEGORIES, type GlossaryCategory } from "@/lib/glossaryData";
import {
  ArrowRight, ChevronDown, CheckCircle2, Circle, Loader2,
  BookOpen, ExternalLink, Sparkles, Search, GraduationCap, BookOpenText,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const Resources = () => {
  const { t, i18n } = useTranslation();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const lang = i18n.language?.startsWith("en") ? "en" : "no";

  const { stats } = useComplianceRequirements();
  const progressPercent = stats.progressPercent;

  const corePhases = CERTIFICATION_PHASES.filter(p => !p.optional);
  const optionalPhases = CERTIFICATION_PHASES.filter(p => p.optional);

  const defaultPhase = useMemo(() => {
    for (const p of CERTIFICATION_PHASES) {
      const status = getPhaseStatus(p.id, progressPercent);
      if (status === 'in_progress') return p.id;
    }
    return 'foundation';
  }, [progressPercent]);

  // State
  const [activeTab, setActiveTab] = useState("compliance");
  const [selectedPhase, setSelectedPhase] = useState<CertificationPhase>(defaultPhase);
  const [learningOpen, setLearningOpen] = useState(false);
  const [selectedRegulation, setSelectedRegulation] = useState<string | null>(null);
  const [glossarySearch, setGlossarySearch] = useState("");

  // Chat context based on active tab
  const chatContext = useMemo(() => {
    if (activeTab === "compliance") return selectedPhase;
    if (activeTab === "regulations" && selectedRegulation) return selectedRegulation;
    return "faq";
  }, [activeTab, selectedPhase, selectedRegulation]);

  const activePhase = CERTIFICATION_PHASES.find(p => p.id === selectedPhase)!;

  // Glossary filtering
  const filteredTerms = useMemo(() => {
    const q = glossarySearch.toLowerCase();
    if (!q) return GLOSSARY_TERMS;
    return GLOSSARY_TERMS.filter(t => t.term.toLowerCase().includes(q) || t.definition_no.toLowerCase().includes(q));
  }, [glossarySearch]);

  const groupedTerms = useMemo(() => {
    const groups: Record<GlossaryCategory, typeof GLOSSARY_TERMS> = { mynder: [], gdpr: [], security: [] };
    for (const term of filteredTerms) {
      groups[term.category].push(term);
    }
    return groups;
  }, [filteredTerms]);

  // --- Helpers ---
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

  // --- Sub-components ---
  const PhaseStepper = () => (
    <div className="space-y-4">
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
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-border/50" />
        <Badge variant="outline" className="text-[10px] text-muted-foreground border-dashed">Valgfritt</Badge>
        <div className="flex-1 h-px bg-border/50" />
      </div>
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
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
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
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              Hva skjer i denne fasen?
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{whatToExpect}</p>
          </div>
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

  const RegulatoryCard = ({ topic }: { topic: RegulatoryTopic }) => {
    const isExpanded = selectedRegulation === topic.id;
    const Icon = topic.icon;
    return (
      <Card
        variant="flat"
        className={`transition-all duration-200 cursor-pointer ${isExpanded ? 'border-primary/20 ring-1 ring-primary/10' : 'hover:border-primary/20'}`}
        onClick={() => setSelectedRegulation(isExpanded ? null : topic.id)}
      >
        <CardContent className="p-5 space-y-4">
          <div className="flex items-start gap-4">
            <div className={`h-10 w-10 rounded-xl ${topic.bg} flex items-center justify-center flex-shrink-0`}>
              <Icon className={`h-5 w-5 ${topic.color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-foreground">{topic.title}</h3>
                <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
              </div>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{topic.summary_no}</p>
            </div>
          </div>

          {isExpanded && (
            <div className="space-y-5 pt-2" onClick={e => e.stopPropagation()}>
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-foreground">Nøkkelpunkter</h4>
                <div className="grid gap-3">
                  {topic.keyPoints_no.map((kp, i) => (
                    <div key={i} className="rounded-lg border border-border/40 bg-muted/20 p-3">
                      <p className="text-sm font-medium text-foreground">{kp.title}</p>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{kp.description}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Slik hjelper Mynder deg
                </h4>
                <div className="grid gap-2">
                  {topic.mynderHelp_no.map((mh, i) => (
                    <button
                      key={i}
                      onClick={() => navigate(mh.route)}
                      className="flex items-center justify-between gap-3 rounded-lg border border-border/50 bg-muted/30 px-4 py-3 text-left hover:bg-accent hover:border-primary/20 transition-all group"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground">{mh.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{mh.description}</p>
                      </div>
                      <ExternalLink className="h-4 w-4 text-muted-foreground/50 group-hover:text-primary flex-shrink-0 transition-colors" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const GlossaryTab = () => (
    <div className="space-y-5">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={glossarySearch}
          onChange={e => setGlossarySearch(e.target.value)}
          placeholder="Søk etter begrep..."
          className="pl-10 bg-muted/30"
        />
      </div>
      {(Object.keys(groupedTerms) as GlossaryCategory[]).map(cat => {
        const terms = groupedTerms[cat];
        if (terms.length === 0) return null;
        return (
          <div key={cat} className="space-y-2">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest px-1">
              {GLOSSARY_CATEGORIES[cat].label_no}
            </h3>
            <Accordion type="multiple" className="space-y-1">
              {terms.map(term => (
                <AccordionItem key={term.term} value={term.term} className="border border-border/50 rounded-xl px-4 bg-card">
                  <AccordionTrigger className="text-sm font-semibold text-foreground py-3 hover:no-underline">
                    {term.term}
                  </AccordionTrigger>
                  <AccordionContent className="pb-3">
                    <p className="text-sm text-muted-foreground leading-relaxed">{term.definition_no}</p>
                    {term.route && (
                      <button
                        onClick={() => navigate(term.route!)}
                        className="mt-2 text-xs font-medium text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
                      >
                        Åpne i Mynder <ExternalLink className="h-3 w-3" />
                      </button>
                    )}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        );
      })}
      {filteredTerms.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">Ingen treff for «{glossarySearch}»</p>
      )}
    </div>
  );

  // --- Main layout ---
  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className={`${isMobile ? 'px-4 pb-6' : 'max-w-4xl mx-auto px-6 py-10'} space-y-6`}>

          {/* Header */}
          <div className={`${isMobile ? 'pt-3' : ''} space-y-2`}>
            <div className="flex items-center gap-3">
              {!isMobile && (
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <BookOpen className="h-5 w-5 text-primary" />
                </div>
              )}
              <div>
                <h1 className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold text-foreground tracking-tight`}>Ressurssenter</h1>
                <p className="text-sm text-muted-foreground">
                  Forstå din compliance-prosess, regelverk og begreper
                </p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className={`${isMobile ? 'w-full' : ''} bg-muted/50`}>
              <TabsTrigger value="compliance" className="gap-1.5 text-xs sm:text-sm">
                <GraduationCap className="h-4 w-4" />
                Compliance-prosessen
              </TabsTrigger>
              <TabsTrigger value="regulations" className="gap-1.5 text-xs sm:text-sm">
                <BookOpenText className="h-4 w-4" />
                Regelverk
              </TabsTrigger>
              <TabsTrigger value="glossary" className="gap-1.5 text-xs sm:text-sm">
                <Search className="h-4 w-4" />
                Ordliste
              </TabsTrigger>
            </TabsList>

            {/* Tab 1: Compliance journey */}
            <TabsContent value="compliance" className="space-y-6 mt-6">
              <PhaseStepper />
              <PhaseDetail phase={activePhase} />
              {/* Other phases as compact cards */}
              {!isMobile && (
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
              )}
            </TabsContent>

            {/* Tab 2: Regulations */}
            <TabsContent value="regulations" className="space-y-4 mt-6">
              {REGULATORY_TOPICS.map(topic => (
                <RegulatoryCard key={topic.id} topic={topic} />
              ))}
            </TabsContent>

            {/* Tab 3: Glossary */}
            <TabsContent value="glossary" className="mt-6">
              <GlossaryTab />
            </TabsContent>
          </Tabs>

          {/* Chat */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest px-1">Chat med Lara</h2>
            <div className="rounded-2xl border border-border/50 bg-card shadow-md overflow-hidden ring-1 ring-primary/5" style={{ height: isMobile ? "400px" : "500px" }}>
              <SupportChat
                activeContext={chatContext}
                onSelectContext={(id) => {
                  if (['foundation', 'implementation', 'operation', 'audit', 'certification'].includes(id)) {
                    setActiveTab("compliance");
                    setSelectedPhase(id as CertificationPhase);
                  }
                }}
                showContextChips={false}
              />
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default Resources;
