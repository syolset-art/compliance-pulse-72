import { useState, useRef, useMemo } from "react";
import { Sidebar } from "@/components/Sidebar";
import { useTranslation } from "react-i18next";
import { useIsMobile } from "@/hooks/use-mobile";
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
  Leaf, Shield, Bot, GitCompare, TrendingUp,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const PLATFORM_UPDATES = [
  { id: "sustainability", title: "Bærekraftsrapport", type: "ny" as const, route: "/sustainability", icon: Leaf },
  { id: "risk-update", title: "Forbedret risikovurdering", type: "oppdatert" as const, route: "/tasks?view=readiness", icon: Shield },
  { id: "ai-act", title: "AI Act-modul", type: "beta" as const, route: "/ai-registry", icon: Bot },
  { id: "vendor-compare", title: "Leverandør-sammenligning", type: "ny" as const, route: "/assets", icon: GitCompare },
];

const UPDATE_TYPE_STYLES = {
  ny: { label: "Ny", className: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" },
  oppdatert: { label: "Oppdatert", className: "bg-primary/15 text-primary border-primary/20" },
  beta: { label: "Beta", className: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20" },
};

const Resources = () => {
  const { t, i18n } = useTranslation();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const lang = i18n.language?.startsWith("en") ? "en" : "no";

  const { stats } = useComplianceRequirements();
  const progressPercent = stats.progressPercent;

  const corePhases = CERTIFICATION_PHASES.filter(p => !p.optional);
  const optionalPhases = CERTIFICATION_PHASES.filter(p => p.optional);

  const tabsRef = useRef<HTMLDivElement>(null);
  const defaultPhase = useMemo(() => {
    for (const p of CERTIFICATION_PHASES) {
      const status = getPhaseStatus(p.id, progressPercent);
      if (status === 'in_progress') return p.id;
    }
    return 'foundation';
  }, [progressPercent]);


  // State
  const [activeTab, setActiveTab] = useState("regulations");
  const [selectedPhase, setSelectedPhase] = useState<CertificationPhase>(defaultPhase);
  const [learningOpen, setLearningOpen] = useState(false);
  const [maturityOpen, setMaturityOpen] = useState(false);
  const [selectedRegulation, setSelectedRegulation] = useState<string | null>(null);
  const [glossarySearch, setGlossarySearch] = useState("");



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
        return <Circle className="h-5 w-5 text-primary fill-primary/20" />;
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

  // Activity explanations and linked Mynder features per phase
  const ACTIVITY_DETAILS: Record<string, { explanation_no: string; explanation_en: string; featureIndex?: number }[]> = {
    foundation: [
      { explanation_no: 'Kartlegg hvem dere er, hva dere gjør, og hvilke lover og standarder som gjelder for virksomheten. Mynder gjør dette automatisk basert på informasjonen du gir under oppsett.', explanation_en: 'Map who you are, what you do, and which laws and standards apply. Mynder does this automatically based on information you provide during setup.', featureIndex: 0 },
      { explanation_no: 'Definer omfanget av styringssystemet — hvilke avdelinger, systemer og prosesser som skal dekkes. Du setter dette opp i onboarding-veiviseren.', explanation_en: 'Define the scope of your management system — which departments, systems and processes are covered. You set this up in the onboarding wizard.', featureIndex: 0 },
      { explanation_no: 'Sammenlign nåværende praksis mot kravene for å finne hva som mangler. Mynder kjører denne analysen automatisk og viser deg en prioritert liste over gap.', explanation_en: 'Compare current practices against requirements to find what\'s missing. Mynder runs this analysis automatically and shows a prioritized gap list.', featureIndex: 1 },
      { explanation_no: 'Tildel ansvar for compliance-arbeidet til riktige personer i organisasjonen. Definer arbeidsområder og koble dem til ansvarlige i Mynder.', explanation_en: 'Assign compliance responsibilities to the right people. Define work areas and link them to responsible persons in Mynder.', featureIndex: 2 },
    ],
    implementation: [
      { explanation_no: 'Opprett retningslinjer og prosedyrer for personvern, sikkerhet og AI. Du kan laste opp eksisterende dokumenter for analyse, eller bruke Lara AI til å generere utkast tilpasset din virksomhet.', explanation_en: 'Create policies and procedures for privacy, security and AI. You can upload existing documents for analysis, or use Lara AI to generate drafts tailored to your organization.', featureIndex: 3 },
      { explanation_no: 'Identifiser og vurder trusler og sårbarheter for hvert system. Mynder har strukturerte risikovurderinger innebygd i hver systemprofil.', explanation_en: 'Identify and assess threats and vulnerabilities for each system. Mynder has structured risk assessments built into each system profile.', featureIndex: 1 },
      { explanation_no: 'Velg tiltak for å redusere, akseptere, overføre eller unngå identifiserte risikoer. Dette dokumenteres direkte i systemprofilene.', explanation_en: 'Choose measures to reduce, accept, transfer or avoid identified risks. This is documented directly in system profiles.', featureIndex: 1 },
      { explanation_no: 'Sett målbare mål for informasjonssikkerhet og personvern. Compliance-sjekklisten hjelper deg å spore fremdrift.', explanation_en: 'Set measurable objectives for information security and privacy. The compliance checklist helps track progress.', featureIndex: 0 },
    ],
    operation: [
      { explanation_no: 'Sett de vedtatte kontrollene ut i praksis i hverdagen. Mynder hjelper deg å holde oversikt over status.', explanation_en: 'Put the adopted controls into daily practice. Mynder helps you track status.', featureIndex: 0 },
      { explanation_no: 'Hold dokumentasjon oppdatert og tilgjengelig. Generer rapporter for ledelsen direkte fra Mynder.', explanation_en: 'Keep documentation updated and accessible. Generate management reports directly from Mynder.', featureIndex: 2 },
      { explanation_no: 'Sørg for at ansatte forstår sitt ansvar og vet hvordan de skal handle ved hendelser.', explanation_en: 'Ensure employees understand their responsibilities and know how to act in incidents.' },
      { explanation_no: 'Følg med på avvik, hendelser og endringer. Bruk avvikshåndteringen til å registrere og lukke avvik systematisk.', explanation_en: 'Monitor deviations, incidents and changes. Use deviation management to register and close deviations systematically.', featureIndex: 0 },
    ],
    audit: [
      { explanation_no: 'En systematisk gjennomgang av styringssystemet for å verifisere at kontrollene fungerer. Bruk ISO Readiness for å sjekke beredskapen.', explanation_en: 'A systematic review of the management system to verify controls work. Use ISO Readiness to check preparedness.', featureIndex: 0 },
      { explanation_no: 'Ledelsen gjennomgår resultatene og tar eierskap til forbedringer. Generer dokumentasjon fra rapportmodulen.', explanation_en: 'Management reviews results and takes ownership of improvements. Generate documentation from the reports module.', featureIndex: 1 },
      { explanation_no: 'Iverksett tiltak for å lukke avvik funnet under revisjonen.', explanation_en: 'Implement measures to close non-conformities found during the audit.' },
      { explanation_no: 'Bruk funnene til å forbedre styringssystemet kontinuerlig.', explanation_en: 'Use findings to continuously improve the management system.' },
    ],
    certification: [
      { explanation_no: 'Ekstern revisor gjennomgår dokumentasjonen og vurderer om styringssystemet er tilstrekkelig beskrevet.', explanation_en: 'External auditor reviews documentation and assesses if the management system is sufficiently described.' },
      { explanation_no: 'Ekstern revisor verifiserer at styringssystemet er implementert og fungerer i praksis.', explanation_en: 'External auditor verifies the management system is implemented and works in practice.' },
      { explanation_no: 'Sertifikatet utstedes og gjelder i tre år med årlige oppfølginger. Del status via Trust Profil.', explanation_en: 'Certificate is issued and valid for three years with annual surveillance. Share status via Trust Profile.', featureIndex: 0 },
      { explanation_no: 'Vedlikehold sertifiseringen med årlige oppfølgingsrevisjoner og kontinuerlig forbedring.', explanation_en: 'Maintain certification with annual surveillance audits and continuous improvement.' },
    ],
  };

  const PhaseDetail = ({ phase }: { phase: PhaseDefinition }) => {
    const status = getPhaseStatus(phase.id, progressPercent);
    const activities = lang === "en" ? phase.activities_en : phase.activities_no;
    const learningContent = lang === "en" ? phase.learningContent_en : phase.learningContent_no;
    const features = phase.mynderFeatures || [];
    const activityDetails = ACTIVITY_DETAILS[phase.id] || [];

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

          {/* Combined activities + explanations + Mynder features */}
          <div className="space-y-3">
            {activities.map((activity, i) => {
              const isCompleted = status === 'completed' || (status === 'in_progress' && i < Math.ceil(activities.length * (progressPercent / 100)));
              const detail = activityDetails[i];
              const linkedFeature = detail?.featureIndex !== undefined ? features[detail.featureIndex] : undefined;
              const explanation = detail ? (lang === "en" ? detail.explanation_en : detail.explanation_no) : undefined;

              return (
                <div key={i} className="rounded-xl border border-border/50 bg-card overflow-hidden">
                  <div className="px-4 py-3 flex items-start gap-3">
                    <Checkbox checked={isCompleted} disabled className="pointer-events-none mt-0.5" />
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <p className={`text-sm font-semibold ${isCompleted ? "text-foreground" : "text-foreground/80"}`}>{activity}</p>
                      {explanation && (
                        <p className="text-xs text-muted-foreground leading-relaxed">{explanation}</p>
                      )}
                    </div>
                  </div>
                  {linkedFeature && (
                    <button
                      onClick={() => navigate(linkedFeature.route)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 bg-primary/5 border-t border-primary/10 text-left hover:bg-primary/10 transition-colors group"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-primary">{lang === "en" ? linkedFeature.title_en : linkedFeature.title_no}</p>
                      </div>
                      <ExternalLink className="h-3 w-3 text-primary/50 group-hover:text-primary flex-shrink-0 transition-colors" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

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

          {/* Platform Updates */}
          <div className="space-y-2">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest px-1">Siste oppdateringer</h2>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {PLATFORM_UPDATES.map((update) => {
                const style = UPDATE_TYPE_STYLES[update.type];
                const Icon = update.icon;
                return (
                  <button
                    key={update.id}
                    onClick={() => navigate(update.route)}
                    className="flex items-center gap-2.5 rounded-xl border border-border/50 bg-card px-4 py-2.5 whitespace-nowrap hover:border-primary/20 hover:shadow-sm transition-all group flex-shrink-0"
                  >
                    <Icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    <span className="text-sm font-medium text-foreground">{update.title}</span>
                    <Badge className={`text-[10px] px-1.5 py-0 ${style.className}`}>{style.label}</Badge>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Navigation Cards */}
          <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2'} gap-3`}>
            {/* Maturity info card */}
            <button
              onClick={() => { setMaturityOpen(!maturityOpen); if (!maturityOpen) tabsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}
              className={`group text-left rounded-2xl border p-5 transition-all ${
                maturityOpen ? "border-primary/20 bg-primary/5 shadow-md" : "border-border/50 bg-card hover:border-primary/20 hover:shadow-md"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <ChevronDown className={`h-4 w-4 text-muted-foreground/40 transition-transform duration-200 ${maturityOpen ? 'rotate-180 text-primary' : ''}`} />
              </div>
              <h3 className="text-base font-bold text-foreground">Slik beregner vi modenhet</h3>
              <p className="text-sm text-muted-foreground mt-1">Forstå fasene i compliance-reisen</p>
            </button>

            {/* Regulations card */}
            <button
              onClick={() => { setActiveTab("regulations"); tabsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}
              className="group text-left rounded-2xl border border-border/50 bg-card p-5 hover:border-primary/20 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center mb-3">
                  <BookOpenText className="h-5 w-5 text-blue-500" />
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
              </div>
              <h3 className="text-base font-bold text-foreground">Regelverk</h3>
              <p className="text-sm text-muted-foreground mt-1">GDPR, NIS2, ISO 27001 og AI Act</p>
            </button>

            {/* Glossary card */}
            <button
              onClick={() => { setActiveTab("glossary"); tabsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}
              className="group text-left rounded-2xl border border-border/50 bg-card p-5 hover:border-primary/20 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center mb-3">
                  <BookOpen className="h-5 w-5 text-amber-500" />
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
              </div>
              <h3 className="text-base font-bold text-foreground">Ordliste</h3>
              <p className="text-sm text-muted-foreground mt-1">{GLOSSARY_TERMS.length} begreper forklart</p>
            </button>
          </div>

          {/* Maturity collapsible section */}
          {maturityOpen && (
            <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
              <PhaseStepper />
              <PhaseDetail phase={activePhase} />
            </div>
          )}

          {/* Tabs */}
          <div ref={tabsRef}>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className={`${isMobile ? 'w-full' : ''} bg-muted/50`}>
              <TabsTrigger value="regulations" className="gap-1.5 text-xs sm:text-sm">
                <BookOpenText className="h-4 w-4" />
                Regelverk
              </TabsTrigger>
              <TabsTrigger value="glossary" className="gap-1.5 text-xs sm:text-sm">
                <Search className="h-4 w-4" />
                Ordliste
              </TabsTrigger>
            </TabsList>


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
          </div>


        </div>
      </main>
    </div>
  );
};

export default Resources;
