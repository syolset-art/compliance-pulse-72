import { useState, useRef, useMemo } from "react";
import { Sidebar } from "@/components/Sidebar";
import { useTranslation } from "react-i18next";
import { useIsMobile } from "@/hooks/use-mobile";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { REGULATORY_TOPICS, type RegulatoryTopic } from "@/lib/regulatoryArticles";
import { GLOSSARY_TERMS, GLOSSARY_CATEGORIES, type GlossaryCategory } from "@/lib/glossaryData";
import {
  ArrowRight, ChevronDown,
  BookOpen, ExternalLink, Sparkles, Search, BookOpenText,
  Leaf, Shield, Bot, GitCompare, TrendingUp, Layers,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const PLATFORM_UPDATES = [
  { id: "sustainability", title: "Bærekraftsrapport", type: "ny" as const, route: "/sustainability", icon: Leaf },
  { id: "risk-update", title: "Forbedret risikovurdering", type: "oppdatert" as const, route: "/tasks?view=readiness", icon: Shield },
  { id: "ai-act", title: "AI Act-modul", type: "beta" as const, route: "/ai-registry", icon: Bot },
  { id: "vendor-compare", title: "Leverandør-sammenligning", type: "ny" as const, route: "/assets", icon: GitCompare },
];

const UPDATE_TYPE_STYLES = {
  ny: { label: "Ny", className: "bg-status-closed/15 text-status-closed dark:text-status-closed border-status-closed/20" },
  oppdatert: { label: "Oppdatert", className: "bg-primary/15 text-primary border-primary/20" },
  beta: { label: "Beta", className: "bg-warning/15 text-warning dark:text-warning border-warning/20" },
};

const Resources = () => {
  const { t, i18n } = useTranslation();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const lang = i18n.language?.startsWith("en") ? "en" : "no";

  const tabsRef = useRef<HTMLDivElement>(null);

  // State
  const [activeTab, setActiveTab] = useState("regulations");
  const [selectedRegulation, setSelectedRegulation] = useState<string | null>(null);
  const [glossarySearch, setGlossarySearch] = useState("");

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
      <main className="flex-1 overflow-auto pt-11">
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
                    <Badge className={`text-[13px] px-1.5 py-0 ${style.className}`}>{style.label}</Badge>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Navigation Cards */}
          <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2'} gap-3`}>
            {/* Maturity info card */}
            <button
              onClick={() => navigate("/resources/maturity")}
              className="group text-left rounded-2xl border border-border/50 bg-card p-5 hover:border-primary/20 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
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
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                  <BookOpenText className="h-5 w-5 text-primary" />
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
              </div>
              <h3 className="text-base font-bold text-foreground">Regelverk</h3>
              <p className="text-sm text-muted-foreground mt-1">GDPR, NIS2, ISO 27001 og AI Act</p>
            </button>

            {/* Controls card */}
            <button
              onClick={() => navigate("/resources/controls")}
              className="group text-left rounded-2xl border border-border/50 bg-card p-5 hover:border-primary/20 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="h-10 w-10 rounded-xl bg-status-closed/10 flex items-center justify-center mb-3">
                  <Layers className="h-5 w-5 text-status-closed" />
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
              </div>
              <h3 className="text-base font-bold text-foreground">Mynder Controls</h3>
              <p className="text-sm text-muted-foreground mt-1">16 grunnkontroller i 4 domener</p>
            </button>

            {/* Glossary card */}
            <button
              onClick={() => { setActiveTab("glossary"); tabsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}
              className="group text-left rounded-2xl border border-border/50 bg-card p-5 hover:border-primary/20 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="h-10 w-10 rounded-xl bg-warning/10 flex items-center justify-center mb-3">
                  <BookOpen className="h-5 w-5 text-warning" />
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
              </div>
              <h3 className="text-base font-bold text-foreground">Ordliste</h3>
              <p className="text-sm text-muted-foreground mt-1">{GLOSSARY_TERMS.length} begreper forklart</p>
            </button>
          </div>

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
