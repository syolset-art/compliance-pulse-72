import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  BookOpen, 
  Play, 
  GraduationCap, 
  FileText, 
  MessageCircle, 
  ExternalLink,
  Sparkles,
  Shield,
  Scale,
  Bot,
  ChevronRight,
  ArrowLeft
} from "lucide-react";

interface KnowledgeArticle {
  title: string;
  summary: string;
  tag: string;
  readTime: string;
}

const gdprArticles: KnowledgeArticle[] = [
  { title: "Art. 5 – Prinsipper for behandling", summary: "Personopplysninger skal behandles lovlig, rettferdig og transparent. Formålsbegrensning, dataminimering og lagringsbegrensning er sentrale krav.", tag: "Grunnprinsipper", readTime: "4 min" },
  { title: "Art. 6 – Behandlingsgrunnlag", summary: "Behandling er kun lovlig dersom det foreligger et gyldig grunnlag, f.eks. samtykke, avtale, rettslig forpliktelse eller berettiget interesse.", tag: "Lovlighet", readTime: "6 min" },
  { title: "Art. 12-14 – Informasjonsplikt", summary: "Den registrerte skal informeres om hvem som behandler data, formålet, rettslig grunnlag og hvor lenge data lagres.", tag: "Rettigheter", readTime: "5 min" },
  { title: "Art. 15 – Rett til innsyn", summary: "Den registrerte har rett til å få bekreftet om personopplysninger behandles, og i så fall få tilgang til opplysningene.", tag: "Rettigheter", readTime: "3 min" },
  { title: "Art. 17 – Rett til sletting", summary: "Den registrerte har rett til å få sine personopplysninger slettet uten ugrunnet opphold under visse vilkår.", tag: "Rettigheter", readTime: "4 min" },
  { title: "Art. 25 – Innebygd personvern", summary: "Behandlingsansvarlig skal gjennomføre egnede tekniske og organisatoriske tiltak for å sikre personvern fra design-fasen.", tag: "Tiltak", readTime: "5 min" },
  { title: "Art. 28 – Databehandler", summary: "Behandlingsansvarlig skal kun benytte databehandlere som gir tilstrekkelige garantier. En databehandleravtale (DPA) er påkrevd.", tag: "Tredjeparter", readTime: "6 min" },
  { title: "Art. 30 – Behandlingsprotokoll (ROPA)", summary: "Virksomheter skal føre en protokoll over behandlingsaktiviteter med formål, kategorier, mottakere og slettingsfrister.", tag: "Dokumentasjon", readTime: "5 min" },
  { title: "Art. 32 – Sikkerhet ved behandling", summary: "Egnede tekniske og organisatoriske sikkerhetstiltak skal implementeres, inkl. kryptering, pseudonymisering og tilgangskontroll.", tag: "Sikkerhet", readTime: "4 min" },
  { title: "Art. 33-34 – Avvikshåndtering", summary: "Brudd på personopplysningssikkerheten skal meldes til Datatilsynet innen 72 timer. Den registrerte skal varsles ved høy risiko.", tag: "Avvik", readTime: "5 min" },
  { title: "Art. 35 – Vurdering av personvernkonsekvenser (DPIA)", summary: "Ved høy risiko for den registrertes rettigheter skal det gjennomføres en personvernkonsekvensvurdering før behandlingen starter.", tag: "Risikovurdering", readTime: "7 min" },
  { title: "Art. 44-49 – Overføring til tredjeland", summary: "Personopplysninger kan kun overføres til land utenfor EØS dersom det foreligger et gyldig overføringsgrunnlag, f.eks. SCC eller adequacy-beslutning.", tag: "Tredjeland", readTime: "6 min" },
];

const articlesByCategory: Record<string, KnowledgeArticle[]> = {
  gdpr: gdprArticles,
};

const Resources = () => {
  const { t } = useTranslation();
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const gettingStartedItems = [
    {
      icon: Sparkles,
      title: t("resources.gettingStarted.items.intro"),
      description: t("resources.gettingStarted.items.introDesc"),
      duration: "5 min"
    },
    {
      icon: GraduationCap,
      title: t("resources.gettingStarted.items.firstSteps"),
      description: t("resources.gettingStarted.items.firstStepsDesc"),
      duration: "10 min"
    },
    {
      icon: Play,
      title: t("resources.gettingStarted.items.quickStart"),
      description: t("resources.gettingStarted.items.quickStartDesc"),
      duration: "3 min"
    }
  ];

  const knowledgeBaseItems = [
    {
      id: "gdpr",
      icon: Shield,
      title: "GDPR",
      description: t("resources.knowledge.gdprDesc"),
      articles: gdprArticles.length
    },
    {
      id: "nis2",
      icon: Scale,
      title: "NIS2",
      description: t("resources.knowledge.nis2Desc"),
      articles: 8
    },
    {
      id: "iso27001",
      icon: FileText,
      title: "ISO 27001",
      description: t("resources.knowledge.isoDesc"),
      articles: 15
    },
    {
      id: "aiact",
      icon: Bot,
      title: "AI Act",
      description: t("resources.knowledge.aiActDesc"),
      articles: 6
    }
  ];

  const selectedArticles = expandedCategory ? articlesByCategory[expandedCategory] : null;
  const selectedCategory = knowledgeBaseItems.find(k => k.id === expandedCategory);

  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-semibold text-foreground tracking-tight">
              {t("resources.title")}
            </h1>
            <p className="text-muted-foreground mt-1">
              {t("resources.subtitle")}
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Getting Started Section */}
            <Card className="shadow-luxury">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <GraduationCap className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>{t("resources.gettingStarted.title")}</CardTitle>
                    <CardDescription>{t("resources.gettingStarted.subtitle")}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {gettingStartedItems.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-4 p-3 rounded-xl hover:bg-accent/50 transition-colors cursor-pointer group"
                  >
                    <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                      <item.icon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground">{item.title}</p>
                      <p className="text-sm text-muted-foreground truncate">{item.description}</p>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{item.duration}</span>
                      <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Demos Section */}
            <Card className="shadow-luxury">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Play className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>{t("resources.demos.title")}</CardTitle>
                    <CardDescription>{t("resources.demos.subtitle")}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="aspect-video bg-muted rounded-xl flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/10" />
                    <div className="relative flex flex-col items-center gap-3">
                      <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center">
                        <Play className="h-8 w-8 text-primary ml-1" />
                      </div>
                      <p className="text-sm text-muted-foreground">{t("resources.demos.watchIntro")}</p>
                    </div>
                  </div>
                  <Button className="w-full" size="lg">
                    <Sparkles className="h-4 w-4 mr-2" />
                    {t("resources.demos.startDemo")}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Knowledge Base Section */}
            <Card className="shadow-luxury lg:col-span-2">
              <CardHeader>
                <div className="flex items-center gap-3">
                  {expandedCategory && (
                    <Button variant="ghost" size="icon" onClick={() => setExpandedCategory(null)} className="mr-1">
                      <ArrowLeft className="h-5 w-5" />
                    </Button>
                  )}
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    {selectedCategory ? <selectedCategory.icon className="h-5 w-5 text-primary" /> : <BookOpen className="h-5 w-5 text-primary" />}
                  </div>
                  <div>
                    <CardTitle>{selectedCategory ? selectedCategory.title : t("resources.knowledge.title")}</CardTitle>
                    <CardDescription>{selectedCategory ? selectedCategory.description : t("resources.knowledge.subtitle")}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {selectedArticles ? (
                  <div className="space-y-3">
                    {selectedArticles.map((article, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-4 p-4 rounded-xl border border-border hover:border-primary/40 hover:bg-accent/30 transition-all cursor-pointer group"
                      >
                        <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                          <FileText className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground">{article.title}</p>
                          <p className="text-sm text-muted-foreground mt-1">{article.summary}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="secondary" className="text-xs">{article.tag}</Badge>
                            <span className="text-xs text-muted-foreground">{article.readTime} lesing</span>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform mt-1 flex-shrink-0" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {knowledgeBaseItems.map((item, index) => (
                      <div
                        key={index}
                        onClick={() => articlesByCategory[item.id] && setExpandedCategory(item.id)}
                        className="p-4 rounded-xl border border-border hover:border-primary/50 hover:bg-accent/30 transition-all cursor-pointer group"
                      >
                        <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center mb-3">
                          <item.icon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                        <h3 className="font-semibold text-foreground mb-1">{item.title}</h3>
                        <p className="text-sm text-muted-foreground mb-2">{item.description}</p>
                        <p className="text-xs text-primary">{item.articles} {t("resources.knowledge.articles")}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Support Section */}
            <Card className="shadow-luxury lg:col-span-2">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <MessageCircle className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>{t("resources.support.title")}</CardTitle>
                    <CardDescription>{t("resources.support.subtitle")}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="p-6 rounded-xl bg-muted/50 border border-border">
                    <h3 className="font-semibold text-foreground mb-2">{t("resources.support.faq")}</h3>
                    <p className="text-sm text-muted-foreground mb-4">{t("resources.support.faqDesc")}</p>
                    <Button variant="outline" className="w-full">
                      {t("resources.support.viewFaq")}
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                  <div className="p-6 rounded-xl bg-muted/50 border border-border">
                    <h3 className="font-semibold text-foreground mb-2">{t("resources.support.contact")}</h3>
                    <p className="text-sm text-muted-foreground mb-4">{t("resources.support.contactDesc")}</p>
                    <Button variant="outline" className="w-full">
                      {t("resources.support.contactUs")}
                      <ExternalLink className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Resources;