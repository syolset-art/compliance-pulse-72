import { ExternalLink, Mail, ShieldCheck, FileCheck2, Layers, Workflow } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sidebar } from "@/components/Sidebar";

export default function BliPartner() {
  const valueProps = [
    {
      icon: FileCheck2,
      title: "Full sporbarhet",
      desc: "Hver vurdering, anbefaling og handling logges med begrunnelse — klar for intern kvalitetskontroll og ekstern tilsyn.",
    },
    {
      icon: Workflow,
      title: "Strukturert metodikk",
      desc: "Felles rammeverk for ISO 27001, NIS2, GDPR og DORA. Konsistent leveranse på tvers av kunder og rådgivere.",
    },
    {
      icon: Layers,
      title: "Skaler uten å miste kvalitet",
      desc: "Lever flere kundeoppdrag med samme team. KI-assistanse forbereder grunnlaget — rådgiveren godkjenner og signerer.",
    },
  ];

  const partnerTypes = [
    "Revisjons- og rådgivningsselskap",
    "Advokatfirma med compliance-praksis",
    "Konsulenter innen GDPR, ISO 27001 og NIS2",
    "MSP og IT-leverandører",
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
                <ShieldCheck className="h-3.5 w-3.5" />
                Mynder Partnerprogram
              </div>
              <h1 className="text-5xl md:text-6xl font-semibold tracking-tight text-foreground mb-4 leading-[1.05]">
                En plattform for{" "}
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  revisjon, rådgivning og compliance
                </span>
                .
              </h1>
              <p className="text-lg text-muted-foreground max-w-xl">
                Lever ISO 27001, NIS2, GDPR og DORA til kundene dine — med en metodikk som er dokumentert,
                sporbar og klar for tilsyn. Mynder strukturerer arbeidet; rådgiveren beholder ansvaret.
              </p>
            </div>
          </div>

          {/* Value props */}
          <div className="grid sm:grid-cols-3 gap-6 mb-14">
            {valueProps.map((b) => (
              <div key={b.title} className="group">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-silk">
                  <b.icon className="h-4 w-4 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-1">{b.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>

          {/* Trust / methodology callout */}
          <div className="mb-14 p-6 rounded-xl border border-border/60 bg-card">
            <h2 className="text-base font-semibold text-foreground mb-2">Bygget for kvalitetssikring</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              All aktivitet — både fra rådgivere og fra KI-assistenter — lagres i samme revisjonsspor med tidsstempel,
              kilde og begrunnelse. Det gir kvalitetsleder full oversikt over hva som er gjort, av hvem, og hvorfor.
              Dokumentasjonen kan eksporteres direkte til tilsyn, sertifiseringsorgan eller intern kontroll.
            </p>
          </div>

          {/* Partner types */}
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
                Ta en uforpliktende prat
              </h2>
              <p className="text-white/80 mb-6 max-w-md">
                Vi viser hvordan plattformen passer inn i din metodikk og kvalitetssystem.
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
