import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useIsMobile } from "@/hooks/use-mobile";
import { useComplianceRequirements } from "@/hooks/useComplianceRequirements";
import {
  CERTIFICATION_PHASES,
  MATURITY_LEVELS,
  getPhaseStatus,
  getMaturityLevel,
  type CertificationPhase,
  type PhaseDefinition,
} from "@/lib/certificationPhases";
import {
  ArrowLeft, ArrowRight, CheckCircle2, Circle, ChevronDown,
  Sparkles, ClipboardList, Play, SearchCheck, Award, RefreshCw,
} from "lucide-react";

// Map tool routes to feature guide slugs
const ROUTE_TO_GUIDE_SLUG: Record<string, string> = {
  "/onboarding": "onboarding",
  "/compliance-checklist": "compliance-checklist",
  "/work-areas": "roles",
  "/tasks?view=readiness": "iso-readiness",
  "/assets": "system-registration",
  "/resources": "lara-ai",
  "/deviations": "deviation-management",
  "/reports": "reports",
  "/transparency": "trust-profile",
  "/customer-requests": "customer-requests",
};

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

const PDCA_ITEMS = [
  {
    key: "plan",
    icon: ClipboardList,
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-500/10",
    title_no: "Plan (Planlegg)",
    title_en: "Plan",
    desc_no: "Forstå konteksten, sett mål og planlegg tiltak. Hvilke krav gjelder? Hvor står vi i dag? Hva er gapet?",
    desc_en: "Understand the context, set objectives and plan actions. Which requirements apply? Where do we stand today? What's the gap?",
    phases_no: "Fundament + Implementering",
    phases_en: "Foundation + Implementation",
  },
  {
    key: "do",
    icon: Play,
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-500/10",
    title_no: "Do (Utfør)",
    title_en: "Do",
    desc_no: "Sett planen ut i livet. Implementer kontroller, dokumenter prosedyrer og tren ansatte.",
    desc_en: "Put the plan into action. Implement controls, document procedures and train employees.",
    phases_no: "Drift",
    phases_en: "Operation",
  },
  {
    key: "check",
    icon: SearchCheck,
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-500/10",
    title_no: "Check (Kontroller)",
    title_en: "Check",
    desc_no: "Mål og evaluer om kontrollene fungerer. Gjennomfør internrevisjoner og ledelsesgjennomganger.",
    desc_en: "Measure and evaluate if controls work. Conduct internal audits and management reviews.",
    phases_no: "Intern Audit",
    phases_en: "Internal Audit",
  },
  {
    key: "act",
    icon: RefreshCw,
    color: "text-purple-600 dark:text-purple-400",
    bg: "bg-purple-500/10",
    title_no: "Act (Forbedre)",
    title_en: "Act",
    desc_no: "Lær av funnene, lukk avvik og forbedre prosessene. Start syklusen på nytt med oppdatert kunnskap.",
    desc_en: "Learn from findings, close non-conformities and improve processes. Restart the cycle with updated knowledge.",
    phases_no: "Sertifisering / Kontinuerlig forbedring",
    phases_en: "Certification / Continuous improvement",
  },
];

const MaturityMethodology = () => {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const isMobile = useIsMobile();
  const lang = i18n.language?.startsWith("en") ? "en" : "no";

  const { stats } = useComplianceRequirements();
  const progressPercent = stats.progressPercent;
  const currentMaturity = getMaturityLevel(progressPercent);

  const corePhases = CERTIFICATION_PHASES.filter(p => !p.optional);
  const optionalPhases = CERTIFICATION_PHASES.filter(p => p.optional);

  const defaultPhase = useMemo(() => {
    for (const p of CERTIFICATION_PHASES) {
      if (getPhaseStatus(p.id, progressPercent) === 'in_progress') return p.id;
    }
    return 'foundation';
  }, [progressPercent]);

  const [selectedPhase, setSelectedPhase] = useState<CertificationPhase>(defaultPhase);
  const [learningOpen, setLearningOpen] = useState(false);
  const activePhase = CERTIFICATION_PHASES.find(p => p.id === selectedPhase)!;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
      case 'in_progress': return <Circle className="h-5 w-5 text-primary fill-primary/20" />;
      default: return <Circle className="h-5 w-5 text-muted-foreground/40" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">{lang === 'en' ? 'Completed' : 'Fullført'}</Badge>;
      case 'in_progress': return <Badge className="bg-primary/15 text-primary border-primary/20">{lang === 'en' ? 'Active' : 'Aktiv fase'}</Badge>;
      default: return <Badge variant="secondary" className="text-muted-foreground">{lang === 'en' ? 'Next' : 'Neste'}</Badge>;
    }
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
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-xl font-bold text-foreground">
                {lang === "en" ? phase.name_en : phase.name_no}
              </h3>
              {getStatusBadge(status)}
              {phase.optional && (
                <Badge variant="outline" className="text-[10px] border-dashed text-muted-foreground">{lang === 'en' ? 'Optional' : 'Valgfritt'}</Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {lang === "en" ? phase.description_en : phase.description_no}
            </p>
          </div>

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
                      {explanation && <p className="text-xs text-muted-foreground leading-relaxed">{explanation}</p>}
                    </div>
                  </div>
                  {linkedFeature && (
                    <button
                      onClick={() => {
                        const guideSlug = ROUTE_TO_GUIDE_SLUG[linkedFeature.route];
                        navigate(guideSlug ? `/resources/features/${guideSlug}` : linkedFeature.route);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 bg-primary/5 border-t border-primary/10 text-left hover:bg-primary/10 transition-colors group"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                      <p className="text-xs font-medium text-primary flex-1">
                        {lang === "en" ? `Learn how: ${linkedFeature.title_en}` : `Lær mer: ${linkedFeature.title_no}`}
                      </p>
                      <ArrowRight className="h-3 w-3 text-primary/50 group-hover:text-primary flex-shrink-0 transition-colors" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <Collapsible open={learningOpen} onOpenChange={setLearningOpen}>
            <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors">
              <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${learningOpen ? 'rotate-180' : ''}`} />
              {lang === 'en' ? 'Read more about this phase' : 'Les mer om denne fasen'}
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

  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="max-w-3xl mx-auto px-6 py-10 space-y-10">

          {/* Back */}
          <Button variant="ghost" onClick={() => navigate("/resources")} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            {lang === 'en' ? 'Back to Resource Centre' : 'Tilbake til Ressurssenter'}
          </Button>

          {/* Section 1: Intro */}
          <div className="space-y-4">
            <h1 className="text-3xl font-bold text-foreground tracking-tight">
              {lang === 'en' ? 'How we calculate maturity' : 'Slik beregner vi modenhet'}
            </h1>
            <div className="space-y-4 text-sm text-foreground/90 leading-relaxed">
              <p>
                {lang === 'en'
                  ? 'Compliance maturity is not just a number — it\'s a picture of how well-prepared your organization is to handle information security, privacy and regulatory requirements in practice. A higher maturity level means you have established, documented and actively maintain the controls needed to protect your business and your customers.'
                  : 'Compliance-modenhet er ikke bare et tall — det er et bilde på hvor godt rustet virksomheten din er til å håndtere informasjonssikkerhet, personvern og regulatoriske krav i praksis. Et høyere modenhetsnivå betyr at dere har etablert, dokumentert og aktivt vedlikeholder de kontrollene som trengs for å beskytte virksomheten og kundene deres.'}
              </p>
              <p>
                {lang === 'en'
                  ? 'Mynder uses the PDCA framework (Plan-Do-Check-Act) as the foundation for calculating maturity. PDCA is an internationally recognized method for continuous improvement, used in ISO standards like ISO 27001, ISO 27701 and ISO 42001. The idea is simple: you plan what needs to be done, implement it, verify that it works, and improve based on what you learn.'
                  : 'Mynder bruker PDCA-rammeverket (Plan-Do-Check-Act) som grunnlag for beregning av modenhet. PDCA er en internasjonalt anerkjent metode for kontinuerlig forbedring, brukt i ISO-standarder som ISO 27001, ISO 27701 og ISO 42001. Ideen er enkel: du planlegger hva som må gjøres, gjennomfører det, verifiserer at det fungerer, og forbedrer basert på det du lærer.'}
              </p>
              <p>
                {lang === 'en'
                  ? 'This is not a linear process where you\'re "done" at the end. Compliance is a cycle — you work continuously and improve over time. Each time you go through the cycle, you strengthen your management system and build more trust with customers and partners.'
                  : 'Dette er ikke en lineær prosess der du er «ferdig» på slutten. Compliance er en syklus — du jobber kontinuerlig og forbedrer deg over tid. Hver gang du går gjennom syklusen, styrker du styringssystemet og bygger mer tillit hos kunder og partnere.'}
              </p>
            </div>
          </div>

          {/* Section 2: PDCA */}
          <div className="space-y-5">
            <h2 className="text-xl font-bold text-foreground">
              {lang === 'en' ? 'The PDCA framework explained' : 'PDCA-rammeverket forklart'}
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {lang === 'en'
                ? 'PDCA divides your compliance work into four repeating phases. Mynder\'s five maturity phases map directly onto this cycle:'
                : 'PDCA deler compliance-arbeidet ditt inn i fire gjentagende faser. Mynders fem modenhetsfaser kobles direkte til denne syklusen:'}
            </p>
            <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2'} gap-4`}>
              {PDCA_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <Card key={item.key} variant="flat" className="border-border/50">
                    <CardContent className="p-5 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-xl ${item.bg} flex items-center justify-center flex-shrink-0`}>
                          <Icon className={`h-5 w-5 ${item.color}`} />
                        </div>
                        <h3 className="text-base font-bold text-foreground">
                          {lang === 'en' ? item.title_en : item.title_no}
                        </h3>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {lang === 'en' ? item.desc_en : item.desc_no}
                      </p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] border-dashed text-muted-foreground">
                          {lang === 'en' ? `Mynder: ${item.phases_en}` : `Mynder: ${item.phases_no}`}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Section 3: Five phases */}
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-foreground">
              {lang === 'en' ? 'The five phases' : 'De fem fasene'}
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {lang === 'en'
                ? 'Click on a phase to see which activities it includes, how far you\'ve come, and which Mynder tools can help you.'
                : 'Klikk på en fase for å se hvilke aktiviteter den inneholder, hvor langt dere har kommet, og hvilke Mynder-verktøy som kan hjelpe dere.'}
            </p>

            {/* Phase stepper */}
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
                            {status === 'completed' ? (lang === 'en' ? 'Completed' : 'Fullført') : status === 'in_progress' ? (lang === 'en' ? 'In progress' : 'Pågår') : (lang === 'en' ? 'Not started' : 'Ikke startet')}
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
                <Badge variant="outline" className="text-[10px] text-muted-foreground border-dashed">{lang === 'en' ? 'Optional' : 'Valgfritt'}</Badge>
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
                        <p className="text-[11px] text-muted-foreground">{lang === 'en' ? 'Optional' : 'Valgfritt'}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <PhaseDetail phase={activePhase} />
          </div>

          {/* Section 4: Maturity levels */}
          <div className="space-y-5">
            <h2 className="text-xl font-bold text-foreground">
              {lang === 'en' ? 'Maturity levels (ISO/IEC 27001 & 33001)' : 'Modenhetsnivåer (ISO/IEC 27001 & 33001)'}
            </h2>
            <div className="space-y-4 text-sm text-foreground/90 leading-relaxed">
              <p>
                {lang === 'en'
                  ? 'The maturity levels Mynder uses are based on the Capability Maturity Model (CMM) as described in ISO/IEC 33001 and used as a best practice in ISO/IEC 27001 implementations. This is not a model we have invented — it is an internationally recognized framework used by certification bodies, auditors and consultants worldwide.'
                  : 'Modenhetsnivåene Mynder bruker er basert på Capability Maturity Model (CMM) slik det beskrives i ISO/IEC 33001 og brukes som beste praksis i ISO/IEC 27001-implementeringer. Dette er ikke en modell vi har funnet opp — det er et internasjonalt anerkjent rammeverk brukt av sertifiseringsorganer, revisorer og konsulenter over hele verden.'}
              </p>
              <p>
                {lang === 'en'
                  ? 'Each level describes how structured and repeatable your compliance practices are. Moving up means going from ad-hoc responses to a systematically managed and continuously improving management system.'
                  : 'Hvert nivå beskriver hvor strukturert og repeterbart compliance-arbeidet ditt er. Å bevege seg oppover betyr å gå fra ad-hoc-tilnærminger til et systematisk styrt og kontinuerlig forbedret ledelsessystem.'}
              </p>
            </div>

            {/* Progress bar with levels */}
            <div className="space-y-3">
              <div className="relative h-3 rounded-full bg-muted/50 overflow-hidden">
                <div
                  className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-primary/80 to-primary transition-all duration-500"
                  style={{ width: `${Math.min(progressPercent, 100)}%` }}
                />
              </div>
              <div className={`grid ${isMobile ? 'grid-cols-2 gap-2' : 'grid-cols-5 gap-2'}`}>
                {MATURITY_LEVELS.map((m) => {
                  const isCurrent = currentMaturity === m.level;
                  const levelDescriptions: Record<string, { no: string; en: string }> = {
                    initial: { no: 'Prosesser er uformelle og reaktive. Lite dokumentasjon.', en: 'Processes are informal and reactive. Little documentation.' },
                    defined: { no: 'Retningslinjer er definert og ansvar er tildelt.', en: 'Policies are defined and responsibilities assigned.' },
                    implemented: { no: 'Kontroller er innført og aktivt brukt i praksis.', en: 'Controls are in place and actively used in practice.' },
                    measured: { no: 'Dere måler effektiviteten og identifiserer forbedringer.', en: 'You measure effectiveness and identify improvements.' },
                    optimized: { no: 'Kontinuerlig forbedring er innarbeidet i kulturen.', en: 'Continuous improvement is embedded in the culture.' },
                  };
                  const desc = levelDescriptions[m.level];
                  return (
                    <div
                      key={m.level}
                      className={`rounded-xl border p-3 transition-all ${
                        isCurrent
                          ? 'border-primary/30 bg-primary/5 ring-1 ring-primary/20'
                          : 'border-border/40 bg-card/50'
                      }`}
                    >
                      <p className={`text-xs font-bold ${isCurrent ? 'text-primary' : 'text-foreground/70'}`}>
                        {lang === 'en' ? m.name_en : m.name_no}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {m.range[0]}–{m.range[1]}%
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-1 leading-snug">
                        {lang === 'en' ? desc.en : desc.no}
                      </p>
                      {isCurrent && (
                        <Badge className="mt-1.5 bg-primary/15 text-primary border-primary/20 text-[9px] px-1.5">
                          {lang === 'en' ? 'You are here' : 'Du er her'}
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Section 5: Typical profiles */}
          <div className="space-y-5">
            <h2 className="text-xl font-bold text-foreground">
              {lang === 'en' ? 'What\'s typical for your type of business?' : 'Hva er typisk for din type virksomhet?'}
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {lang === 'en'
                ? 'Different organizations have different starting points and goals. Here\'s what we typically see:'
                : 'Ulike virksomheter har ulike utgangspunkt og mål. Her er hva vi typisk ser:'}
            </p>

            <div className="grid gap-4">
              {/* Startup */}
              <Card variant="flat" className="border-border/50">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-foreground">Startup</h3>
                      <Badge variant="outline" className="text-[10px] text-muted-foreground border-dashed">
                        {lang === 'en' ? 'Typical: Initial → Defined' : 'Typisk: Initial → Definert'}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {lang === 'en'
                      ? 'Startups usually begin at the Initial level with few formal processes. The most important first step is establishing basic policies (privacy policy, security guidelines) and an overview of which systems handle personal data. Most startups reach the Defined level within weeks with Mynder — enough to answer customer due diligence questionnaires with confidence.'
                      : 'Startups begynner som oftest på Initial-nivå med få formelle prosesser. Det viktigste første steget er å etablere grunnleggende retningslinjer (personvernerklæring, sikkerhetsinstruks) og en oversikt over hvilke systemer som behandler personopplysninger. De fleste startups når Definert-nivå innen noen uker med Mynder — nok til å svare på kunders due diligence-skjemaer med trygghet.'}
                  </p>
                </CardContent>
              </Card>

              {/* Scaleup */}
              <Card variant="flat" className="border-border/50">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                      <Award className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-foreground">Scaleup</h3>
                      <Badge variant="outline" className="text-[10px] text-muted-foreground border-dashed">
                        {lang === 'en' ? 'Typical: Defined → Implemented' : 'Typisk: Definert → Implementert'}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {lang === 'en'
                      ? 'Scaleups typically have some policies in place but struggle with consistent implementation across a growing team. The challenge shifts from "what do we need?" to "how do we ensure everyone follows it?". Focus areas include systematic risk assessments, vendor management and employee training. Reaching the Implemented level demonstrates to enterprise customers that your security practices are mature and reliable.'
                      : 'Scaleups har typisk noen retningslinjer på plass, men sliter med konsekvent implementering på tvers av et voksende team. Utfordringen skifter fra «hva trenger vi?» til «hvordan sikrer vi at alle følger det?». Fokusområder er systematiske risikovurderinger, leverandørstyring og opplæring av ansatte. Å nå Implementert-nivå viser enterprise-kunder at sikkerhetspraksisen deres er moden og pålitelig.'}
                  </p>
                </CardContent>
              </Card>

              {/* Anbud / Public procurement */}
              <Card variant="flat" className="border-border/50">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                      <ClipboardList className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-foreground">
                        {lang === 'en' ? 'Public procurement' : 'Anbud og offentlige anskaffelser'}
                      </h3>
                      <Badge variant="outline" className="text-[10px] text-muted-foreground border-dashed">
                        {lang === 'en' ? 'Typical: Implemented → Measured' : 'Typisk: Implementert → Målt'}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {lang === 'en'
                      ? 'Companies participating in public tenders often need to document a high level of compliance maturity. Procurement requirements typically demand evidence of systematic risk management, documented security controls and often ISO 27001 certification or equivalent. To compete effectively, aim for the Measured level or higher. Mynder\'s Trust Profile and reports module helps you generate the documentation buyers ask for — without starting from scratch each time.'
                      : 'Virksomheter som deltar i offentlige anbud må ofte dokumentere et høyt modenhetsnivå. Anskaffelseskrav krever typisk bevis for systematisk risikostyring, dokumenterte sikkerhetskontroller og ofte ISO 27001-sertifisering eller tilsvarende. For å konkurrere effektivt bør dere sikte mot Målt-nivå eller høyere. Mynders Trust Profil og rapportmodul hjelper dere å generere dokumentasjonen innkjøpere etterspør — uten å starte fra bunnen av hver gang.'}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Footer CTA */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-border/30">
            <Button onClick={() => navigate("/compliance-checklist")} className="gap-2">
              {lang === 'en' ? 'Go to Compliance Checklist' : 'Gå til Compliance-sjekkliste'}
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={() => navigate("/resources")}>
              {lang === 'en' ? 'Back to Resource Centre' : 'Tilbake til Ressurssenter'}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default MaturityMethodology;
