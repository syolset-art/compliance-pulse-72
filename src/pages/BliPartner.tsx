import { ExternalLink, Mail, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sidebar } from "@/components/Sidebar";

export default function BliPartner() {
  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto pt-11">
        <div className="container max-w-3xl mx-auto py-16 px-4 md:px-8">
          {/* Hero */}
          <div className="relative mb-12">
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

          {/* CTA */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-accent p-8 md:p-10">
            <div className="absolute -bottom-12 -right-12 h-48 w-48 bg-white/10 rounded-full blur-2xl" />
            <div className="relative">
              <h2 className="text-2xl md:text-3xl font-semibold text-white mb-2">
                Vil du vite mer?
              </h2>
              <p className="text-white/80 mb-6 max-w-md">
                Les om partnerprogrammet på mynder.no eller ta kontakt direkte.
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
