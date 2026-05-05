import { ExternalLink, Mail, Sparkles, TrendingUp, Zap, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sidebar } from "@/components/Sidebar";

export default function BliPartner() {
  const benefits = [
    { icon: TrendingUp, title: "Tilbakevendende inntekt", desc: "Revenue share på abonnement og kreditt." },
    { icon: Zap, title: "Skaler med Lara AI", desc: "Lever til mange kunder uten å øke bemanningen." },
    { icon: GraduationCap, title: "Opplæring inkludert", desc: "Sertifisering, salgsstøtte og materiell." },
  ];

  const partnerTypes = [
    "Konsulenter innen GDPR, ISO 27001, NIS2",
    "MSP og IT-leverandører",
    "Revisorer og advokater",
    "Bransjeforeninger",
  ];

  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto pt-11">
        <div className="container max-w-3xl mx-auto py-16 px-4 md:px-8">
          {/* Hero */}
          <div className="relative mb-14">
            <div className="absolute -top-8 -left-8 h-40 w-40 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -top-4 right-0 h-32 w-32 bg-accent/30 rounded-full blur-3xl pointer-events-none" />
            <div className="relative">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-5">
                <Sparkles className="h-3.5 w-3.5" />
                Mynder Partnerprogram
              </div>
              <h1 className="text-5xl md:text-6xl font-semibold tracking-tight text-foreground mb-4 leading-[1.05]">
                Bygg en lønnsom <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">compliance-praksis</span>.
              </h1>
              <p className="text-lg text-muted-foreground max-w-xl">
                Lever AI-drevet compliance og leverandørstyring til kundene dine — med tilbakevendende inntekt.
              </p>
            </div>
          </div>

          {/* Benefits — minimal row */}
          <div className="grid sm:grid-cols-3 gap-6 mb-14">
            {benefits.map((b) => (
              <div key={b.title} className="group">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-silk">
                  <b.icon className="h-4 w-4 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-1">{b.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>

          {/* Partner types — chips */}
          <div className="mb-14">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
              Passer for
            </h2>
            <div className="flex flex-wrap gap-2">
              {partnerTypes.map((p) => (
                <span
                  key={p}
                  className="px-4 py-2 rounded-full border border-border/60 bg-card text-sm text-foreground hover:border-primary/40 hover:bg-primary/5 transition-silk"
                >
                  {p}
                </span>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-accent p-8 md:p-10">
            <div className="absolute -bottom-12 -right-12 h-48 w-48 bg-white/10 rounded-full blur-2xl" />
            <div className="relative">
              <h2 className="text-2xl md:text-3xl font-semibold text-white mb-2">
                Klar for å komme i gang?
              </h2>
              <p className="text-white/80 mb-6 max-w-md">
                Les mer eller ta kontakt direkte.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button asChild size="lg" variant="glass">
                  <a href="https://mynder.no/bli-partner" target="_blank" rel="noopener noreferrer">
                    Les mer på mynder.no
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </a>
                </Button>
                <Button asChild size="lg" variant="ghost" className="text-white hover:bg-white/10 hover:text-white">
                  <a href="mailto:partner@mynder.no">
                    <Mail className="h-4 w-4 mr-2" />
                    partner@mynder.no
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
