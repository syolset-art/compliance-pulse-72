import { ExternalLink, Mail, ShieldCheck, Briefcase, Scale, Building2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sidebar } from "@/components/Sidebar";

const audiences = [
  {
    icon: Scale,
    title: "Revisjons- og rådgivningsselskaper",
    desc: "Som leverer ISO 27001-, NIS2-, GDPR- eller DORA-prosjekter til kundene sine.",
  },
  {
    icon: Briefcase,
    title: "Compliance- og kvalitetsledere",
    desc: "Som ønsker en strukturert metodikk og sporbar dokumentasjon på tvers av kunder.",
  },
  {
    icon: Building2,
    title: "MSP-er og IT-leverandører",
    desc: "Som vil tilby compliance og sikkerhetsstyring som en tjeneste.",
  },
  {
    icon: Users,
    title: "Bransjeforeninger og nettverk",
    desc: "Som vil tilby medlemmene sine en felles plattform for etterlevelse.",
  },
];

export default function BliPartner() {
  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto pt-11">
        <div className="max-w-7xl mx-auto py-20 md:py-28 px-4 md:px-8 space-y-20 md:space-y-28">
          {/* Hero */}
          <section className="relative">
            <div className="absolute -top-8 -left-8 h-40 w-40 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -top-4 right-0 h-32 w-32 bg-accent/30 rounded-full blur-3xl pointer-events-none" />
            <div className="relative max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-6">
                <ShieldCheck className="h-3.5 w-3.5" />
                Mynder Partnerprogram
              </div>
              <h1 className="text-5xl md:text-6xl font-semibold tracking-tight text-foreground mb-6 leading-[1.05]">
                En plattform for{" "}
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  revisjon, rådgivning og compliance
                </span>
                .
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
                Lever ISO 27001, NIS2, GDPR og DORA til kundene dine — med en metodikk som er
                dokumentert, sporbar og klar for tilsyn. Mynder strukturerer arbeidet; rådgiveren
                beholder ansvaret.
              </p>
            </div>
          </section>

          {/* Hvem passer det for */}
          <section className="space-y-6">
            <div className="max-w-2xl">
              <h2 className="text-xl md:text-2xl font-semibold tracking-tight text-foreground mb-1.5">
                Hvem passer det for?
              </h2>
              <p className="text-sm text-muted-foreground">
                Fagmiljøer som leverer etterlevelse som tjeneste — eller vil løfte kvaliteten i eget arbeid.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {audiences.map(({ icon: Icon, title, desc }) => (
                <div
                  key={title}
                  className="rounded-xl border border-border bg-card p-4"
                >
                  <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-3">
                    <Icon className="h-4 w-4" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground mb-1">{title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* CTA */}
          <section className="rounded-3xl border border-border bg-card p-8 md:p-12">
            <div className="grid gap-8 md:grid-cols-2 md:items-center">
              <div>
                <h2 className="text-2xl md:text-3xl font-semibold text-foreground mb-2">
                  Vil du vite mer?
                </h2>
                <p className="text-muted-foreground">
                  Les om partnerprogrammet på mynder.no eller ta kontakt direkte.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 md:justify-end">
                <Button asChild size="lg">
                  <a href="https://mynder.no/bli-partner" target="_blank" rel="noopener noreferrer">
                    Les mer på mynder.no
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </a>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <a href="mailto:partner@mynder.no">
                    <Mail className="h-4 w-4 mr-2" />
                    partner@mynder.no
                  </a>
                </Button>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
