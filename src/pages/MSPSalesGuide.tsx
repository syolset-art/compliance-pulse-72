import { Sidebar } from "@/components/Sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  Search, CalendarCheck, ClipboardList, Presentation, Rocket, HeartHandshake,
} from "lucide-react";

const steps = [
  {
    icon: Search,
    title: "Identifiser kunden",
    description: "Finn kunder som mangler compliance-verktøy eller bruker manuelle prosesser. Se etter bedrifter med GDPR-krav, ISO-ambisjoner eller leverandørkrav fra store kunder.",
    action: { label: "Se kundeoversikt", href: "/msp-dashboard" },
  },
  {
    icon: CalendarCheck,
    title: "Book et møte",
    description: "Bruk kunde-ROI-kalkulatoren til å vise kunden hva de sparer med Mynder. Tilpass tallene til kundens situasjon – antall systemer, timer og timepris.",
    action: { label: "Vis kunden ROI-kalkulator", href: "/msp-customer-roi" },
  },
  {
    icon: ClipboardList,
    title: "Kjør en kartlegging",
    description: "Bruk «Legg til kunde» med compliance-kartlegging for å avdekke gap. Kartleggingen dekker 6 hovedområder og gir en umiddelbar modenhetsscore.",
    action: { label: "Legg til kunde", href: "/msp-dashboard" },
  },
  {
    icon: Presentation,
    title: "Presenter handlingsplan",
    description: "Vis kartleggingsresultatet til kunden – for eksempel «4 av 6 områder mangler tiltak». Bruk dette som grunnlag for en konkret handlingsplan med prioriteringer.",
    action: null,
  },
  {
    icon: Rocket,
    title: "Aktiver Mynder",
    description: "Tildel en lisens, koble til Acronis for backup-oversikt, og sett opp kundens portal. Kunden får umiddelbart tilgang til sitt eget compliance-dashbord.",
    action: { label: "Kjøp lisenser", href: "/msp-licenses" },
  },
  {
    icon: HeartHandshake,
    title: "Løpende oppfølging",
    description: "Gå inn i kundens portal som partner for å hjelpe med compliance-arbeidet. Bruk superadmin-tilgang til å vise kunden rundt, forklare widgets og sette opp tiltak.",
    action: null,
  },
];

export default function MSPSalesGuide() {
  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto md:pt-11">
        <div className="container max-w-7xl mx-auto py-8 px-4 md:px-8 space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Salgsguide</h1>
            <p className="text-muted-foreground mt-1">Steg-for-steg guide for å selge Mynder til dine kunder</p>
          </div>

          <div className="relative space-y-0">
            {steps.map((step, idx) => (
              <div key={idx} className="flex gap-6">
                {/* Timeline */}
                <div className="flex flex-col items-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-sm shrink-0">
                    {idx + 1}
                  </div>
                  {idx < steps.length - 1 && (
                    <div className="w-0.5 flex-1 bg-border my-1" />
                  )}
                </div>

                {/* Content */}
                <Card className="flex-1 p-5 mb-4">
                  <div className="flex items-start gap-3">
                    <step.icon className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground text-base">{step.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{step.description}</p>
                      {step.action && (
                        <Link to={step.action.href}>
                          <Button size="sm" variant="outline" className="mt-3">
                            {step.action.label}
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
