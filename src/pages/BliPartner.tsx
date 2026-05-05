import { ExternalLink, TrendingUp, Sparkles, GraduationCap, Mail, Building2, Briefcase, Users, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Sidebar } from "@/components/Sidebar";

export default function BliPartner() {
  const benefits = [
    {
      icon: TrendingUp,
      title: "Tilbakevendende inntekt",
      desc: "Generøs revenue share på alle abonnement og kreditt-kjøp fra dine kunder.",
    },
    {
      icon: Sparkles,
      title: "Skalerbar leveranse med Lara AI",
      desc: "Lever compliance, risiko og leverandørstyring til mange kunder uten å øke bemanningen.",
    },
    {
      icon: GraduationCap,
      title: "Opplæring og markedsføring",
      desc: "Vi gir deg sertifisering, salgsmateriell og markedsføringsstøtte fra dag én.",
    },
  ];

  const partnerTypes = [
    {
      icon: Briefcase,
      title: "Konsulentselskap",
      desc: "Rådgivere innen GDPR, informasjonssikkerhet, ISO 27001, NIS2 eller kvalitet som ønsker en plattform å levere på.",
    },
    {
      icon: Building2,
      title: "MSP og IT-leverandører",
      desc: "IT-driftspartnere som vil utvide tjenestetilbudet med compliance og leverandørstyring til eksisterende kunder.",
    },
    {
      icon: ShieldCheck,
      title: "Revisorer og advokater",
      desc: "Profesjonelle rådgivere som trenger et moderne verktøy for compliance-arbeid hos sine kunder.",
    },
    {
      icon: Users,
      title: "Bransjeforeninger",
      desc: "Foreninger som vil tilby medlemmene et felles compliance-rammeverk og kollektive innkjøpsfordeler.",
    },
  ];

  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto pt-11">
        <div className="container max-w-5xl mx-auto py-12 px-4 md:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-4">
              <Sparkles className="h-3.5 w-3.5" />
              Mynder Partnerprogram
            </div>
            <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-foreground mb-4">
              Bli Mynder-partner
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Hjelp kundene dine med moderne, AI-drevet compliance og leverandørstyring —
              og bygg en lønnsom, gjentakende inntektsstrøm.
            </p>
          </div>

          {/* Benefits */}
          <div className="grid md:grid-cols-3 gap-4 mb-12">
            {benefits.map((b) => (
              <Card key={b.title} className="border-border/60">
                <CardContent className="p-6">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <b.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{b.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{b.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Who fits as a partner */}
          <div className="mb-12">
            <h2 className="text-2xl font-semibold text-foreground mb-2 text-center">
              Hvem passer som partner?
            </h2>
            <p className="text-muted-foreground text-center mb-6 max-w-2xl mx-auto">
              Mynder-partnere er typisk virksomheter som allerede leverer rådgivning eller tjenester
              innen compliance, sikkerhet eller IT — og som vil bygge tilbakevendende inntekt på toppen.
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              {partnerTypes.map((p) => (
                <Card key={p.title} className="border-border/60">
                  <CardContent className="p-5 flex gap-4">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <p.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">{p.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* CTA */}
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-semibold text-foreground mb-2">
                Klar for å komme i gang?
              </h2>
              <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
                Les mer om partnerprogrammet, kommisjonsmodell og søknadsprosess på våre hjemmesider —
                eller ta kontakt direkte.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button asChild size="lg">
                  <a href="https://mynder.no/bli-partner" target="_blank" rel="noopener noreferrer">
                    Les mer på mynder.no
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </a>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <a href="mailto:partner@mynder.no">
                    <Mail className="h-4 w-4 mr-2" />
                    Send e-post til partner@mynder.no
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
