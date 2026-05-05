import { ExternalLink, TrendingUp, Sparkles, GraduationCap, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

export default function BliPartner() {
  const navigate = useNavigate();

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

  return (
    <div className="min-h-screen bg-background pt-16">
      <div className="max-w-4xl mx-auto px-6 py-12">
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

        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-semibold text-foreground mb-2">
              Klar for å komme i gang?
            </h2>
            <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
              Les mer om partnerprogrammet, kommisjonsmodell og søknadsprosess på våre hjemmesider.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild size="lg">
                <a
                  href="https://mynder.no/bli-partner"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Les mer på mynder.no
                  <ExternalLink className="h-4 w-4 ml-2" />
                </a>
              </Button>
              <Button variant="outline" size="lg" onClick={() => navigate("/msp-roi")}>
                <Calculator className="h-4 w-4 mr-2" />
                Se ROI-kalkulator
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
