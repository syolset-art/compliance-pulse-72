import { Sidebar } from "@/components/Sidebar";
import { AlertBanner } from "@/components/widgets/AlertBanner";
import { MetricCard } from "@/components/widgets/MetricCard";
import { ROPAStatusWidget } from "@/components/widgets/ROPAStatusWidget";
import { ComplianceCard } from "@/components/widgets/ComplianceCard";
import { ROPAGapWidget } from "@/components/widgets/ROPAGapWidget";
import { ThirdPartyWidget } from "@/components/widgets/ThirdPartyWidget";
import { CriticalProcessesWidget } from "@/components/widgets/CriticalProcessesWidget";
import { DataTransferWidget } from "@/components/widgets/DataTransferWidget";
import { SystemsInUseWidget } from "@/components/widgets/SystemsInUseWidget";
import { CheckCircle2, TrendingUp, Rocket } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Index = () => {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      
      <main className="flex-1 overflow-y-auto">
        <div className="container max-w-7xl mx-auto p-4 md:p-8 pt-6 md:pt-8">
          {/* Header */}
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Dashboard</h1>
              <p className="text-sm md:text-base text-muted-foreground">Oversikt over din bedrift</p>
            </div>
            <Link to="/onboarding" className="w-full sm:w-auto">
              <Button size="lg" className="gap-2 w-full sm:w-auto">
                <Rocket className="h-5 w-5" />
                Kom i gang
              </Button>
            </Link>
          </div>

          {/* Alert Banner */}
          <div className="mb-6">
            <AlertBanner />
          </div>

          {/* Top Metrics Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <ROPAStatusWidget />
            <MetricCard
              title="Fullførte oppgaver"
              value="245"
              subtitle="49% av oppgaver fullført"
              icon={CheckCircle2}
            />
            <SystemsInUseWidget />
            <MetricCard
              title="Totalt risikonivå"
              value="Høy"
              subtitle="22 av 50 systemer har en vurdering"
              icon={TrendingUp}
            />
          </div>

          {/* Compliance Analysis Section */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-xl font-semibold text-foreground">Detaljert samsvarsanalyse</h2>
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted">
                <span className="text-xs text-muted-foreground">i</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              Oversikt over hvor godt organisasjonen oppfyller kravene i viktige sikkerhetsstandarder
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <ComplianceCard
                standard="gdpr"
                title="GDPR"
                percentage={77}
                subtitle="Personvern og databeskyttelse"
              />
              <ComplianceCard
                standard="iso"
                title="ISO 27001"
                percentage={77}
                subtitle="Informasjonssikkerhet"
              />
              <ComplianceCard
                standard="nis2"
                title="NIS2"
                percentage={82}
                subtitle="Nettverk- og informasjonssikkerhet"
              />
              <ComplianceCard
                standard="cra"
                title="CRA"
                percentage={82}
                subtitle="Cyber Resilience Act"
              />
            </div>
          </div>

          {/* Information Banner */}
          <div className="mb-6 p-4 rounded-lg bg-primary/5 border border-primary/20">
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 mt-0.5">
                <span className="text-xs font-semibold text-primary">i</span>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground mb-1">
                  Sammenligning med sikkerhetsstandarder
                </h3>
                <p className="text-sm text-muted-foreground">
                  Vi justerer vektingen basert på hva hver standard legger vekt på, slik at sammenligningen blir mer realistisk.
                </p>
              </div>
              <button className="text-sm font-medium text-primary hover:underline whitespace-nowrap">
                Se detaljer
              </button>
            </div>
          </div>

          {/* Bottom Grid - ROPA & Risk Widgets */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              <ROPAGapWidget />
              <CriticalProcessesWidget />
              <DataTransferWidget />
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              <ThirdPartyWidget />
              
              {/* Placeholder for future widgets */}
              <div className="grid grid-cols-2 gap-6">
                <div className="p-6 rounded-lg border border-dashed border-border bg-muted/20">
                  <p className="text-sm text-muted-foreground text-center">
                    System risiko oversikt
                  </p>
                </div>
                <div className="p-6 rounded-lg border border-dashed border-border bg-muted/20">
                  <p className="text-sm text-muted-foreground text-center">
                    AI analyse
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
