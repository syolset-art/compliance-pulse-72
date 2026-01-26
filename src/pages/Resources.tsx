import { Sidebar } from "@/components/Sidebar";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  ChevronRight
} from "lucide-react";

const Resources = () => {
  const { t } = useTranslation();

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
      icon: Shield,
      title: "GDPR",
      description: t("resources.knowledge.gdprDesc"),
      articles: 12
    },
    {
      icon: Scale,
      title: "NIS2",
      description: t("resources.knowledge.nis2Desc"),
      articles: 8
    },
    {
      icon: FileText,
      title: "ISO 27001",
      description: t("resources.knowledge.isoDesc"),
      articles: 15
    },
    {
      icon: Bot,
      title: "AI Act",
      description: t("resources.knowledge.aiActDesc"),
      articles: 6
    }
  ];

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
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <BookOpen className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>{t("resources.knowledge.title")}</CardTitle>
                    <CardDescription>{t("resources.knowledge.subtitle")}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {knowledgeBaseItems.map((item, index) => (
                    <div
                      key={index}
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
