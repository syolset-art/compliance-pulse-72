import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, MapPin, Sparkles } from "lucide-react";
import { getFeatureGuide } from "@/lib/featureGuideData";

// Static illustration imports
import riskImg from "@/assets/feature-guide/risk-assessment.jpg";
import checklistImg from "@/assets/feature-guide/compliance-checklist.jpg";
import systemImg from "@/assets/feature-guide/system-profile.jpg";
import onboardingImg from "@/assets/feature-guide/onboarding.jpg";

const ILLUSTRATION_MAP: Record<string, string> = {
  "risk-system-tab": riskImg,
  "risk-distribution": riskImg,
  "risk-history": riskImg,
  "gap-checklist": checklistImg,
  "gap-priority": checklistImg,
  "gap-progress": checklistImg,
  "checklist-overview": checklistImg,
  "checklist-tracking": checklistImg,
  "system-add": systemImg,
  "system-profile": systemImg,
  "onboarding-register": onboardingImg,
  "onboarding-frameworks": onboardingImg,
  "onboarding-workareas": onboardingImg,
};

const FeatureGuidePage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const lang = i18n.language?.startsWith("en") ? "en" : "no";

  const guide = slug ? getFeatureGuide(slug) : undefined;

  if (!guide) {
    return (
      <div className="flex min-h-screen w-full bg-background">
        <Sidebar />
        <main className="flex-1 p-6">
          <Button variant="ghost" onClick={() => navigate("/resources")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Tilbake
          </Button>
          <p className="text-muted-foreground mt-4">Funksjonsguide ikke funnet.</p>
        </main>
      </div>
    );
  }

  const title = lang === "en" ? guide.title_en : guide.title_no;
  const subtitle = lang === "en" ? guide.subtitle_en : guide.subtitle_no;
  const intro = lang === "en" ? guide.intro_en : guide.intro_no;
  const whereInApp = lang === "en" ? guide.whereInApp_en : guide.whereInApp_no;

  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto pt-11">
        <div className="max-w-3xl mx-auto px-6 py-10 space-y-8">
          {/* Back */}
          <Button variant="ghost" onClick={() => navigate("/resources")} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Tilbake til Ressurssenter
          </Button>

          {/* Hero */}
          <div className="space-y-3">
            <Badge variant="outline" className="text-xs border-primary/20 text-primary">
              <Sparkles className="h-3 w-3 mr-1" />
              Mynder-funksjon
            </Badge>
            <h1 className="text-3xl font-bold text-foreground tracking-tight">{title}</h1>
            <p className="text-lg text-muted-foreground">{subtitle}</p>
          </div>

          {/* Intro */}
          <Card variant="flat" className="border-primary/10 bg-primary/5">
            <CardContent className="p-6">
              <p className="text-sm text-foreground leading-relaxed">{intro}</p>
            </CardContent>
          </Card>

          {/* Where in app */}
          <div className="flex items-start gap-3 rounded-xl border border-border/50 bg-muted/30 p-4">
            <MapPin className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-foreground mb-1">
                {lang === "en" ? "Where to find it" : "Hvor finner du dette?"}
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">{whereInApp}</p>
            </div>
          </div>

          {/* Steps with illustrations */}
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-foreground">
              {lang === "en" ? "How it works" : "Slik fungerer det"}
            </h2>
            {guide.steps.map((step, i) => {
              const stepTitle = lang === "en" ? step.title_en : step.title_no;
              const stepDesc = lang === "en" ? step.description_en : step.description_no;
              const illustration = ILLUSTRATION_MAP[step.illustrationKey];

              return (
                <Card key={i} variant="flat" className="overflow-hidden">
                  <CardContent className="p-0">
                    {illustration && (
                      <div className="bg-muted/50 border-b border-border/30">
                        <img
                          src={illustration}
                          alt={stepTitle}
                          className="w-full h-auto object-cover max-h-64"
                        />
                      </div>
                    )}
                    <div className="p-5 space-y-2">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center justify-center h-7 w-7 rounded-full bg-primary/10 text-primary text-sm font-bold flex-shrink-0">
                          {i + 1}
                        </span>
                        <h3 className="text-base font-semibold text-foreground">{stepTitle}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed pl-10">{stepDesc}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button onClick={() => navigate(guide.route)} className="gap-2">
              {lang === "en" ? "Open in Mynder" : "Åpne i Mynder"}
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={() => navigate("/resources")}>
              {lang === "en" ? "Back to Resources" : "Tilbake til Ressurssenter"}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default FeatureGuidePage;
