import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { ChatInterface } from "@/components/ChatInterface";
import { ContentViewer } from "@/components/ContentViewer";
import { AlertBanner } from "@/components/widgets/AlertBanner";
import { MetricCard } from "@/components/widgets/MetricCard";
import { ROPAStatusWidget } from "@/components/widgets/ROPAStatusWidget";
import { ComplianceCard } from "@/components/widgets/ComplianceCard";
import { ROPAGapWidget } from "@/components/widgets/ROPAGapWidget";
import { ThirdPartyWidget } from "@/components/widgets/ThirdPartyWidget";
import { CriticalProcessesWidget } from "@/components/widgets/CriticalProcessesWidget";
import { DataTransferWidget } from "@/components/widgets/DataTransferWidget";
import { SystemsInUseWidget } from "@/components/widgets/SystemsInUseWidget";
import { ROIWidget } from "@/components/widgets/ROIWidget";
import { LaraAgent } from "@/components/LaraAgent";
import { AddModuleDialog } from "@/components/AddModuleDialog";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { CheckCircle2, TrendingUp, Plus, Server, Building, Users, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useNavigationMode } from "@/hooks/useNavigationMode";
import { Button } from "@/components/ui/button";
import mynderLogo from "@/assets/mynder-logo-inverted.png";

const Index = () => {
  const { mode, toggleMode } = useNavigationMode();
  const [isAddModuleOpen, setIsAddModuleOpen] = useState(false);
  const [contentView, setContentView] = useState<{ 
    type: string; 
    filter?: string;
    options?: {
      viewMode?: "cards" | "table" | "list" | "names-only";
      sortBy?: string;
      filterCriteria?: any;
    };
    explanation?: string;
  } | null>(null);

  const handleShowContent = (contentType: string, filter?: string, options?: any, explanation?: string) => {
    setContentView({ type: contentType, filter, options, explanation });
  };

  const handleBackToDashboard = () => {
    setContentView(null);
  };

  const handleModuleCreated = (moduleData: any) => {
    // Display the created module in the ContentViewer
    const explanation = `# Modul opprettet: ${moduleData.name}

**Type:** ${moduleData.type?.replace("-", " ")}
**Beskrivelse:** ${moduleData.description || "Ingen beskrivelse oppgitt"}
${moduleData.file ? `**Fil:** ${moduleData.file.name}` : ""}
${moduleData.config ? `\n## Konfigurasjon\n\`\`\`\n${moduleData.config}\n\`\`\`` : ""}

Modulen er nå tilgjengelig og kan brukes i AI-agenten. Du kan begynne å samhandle med den via chatten.`;

    handleShowContent("module", undefined, undefined, explanation);
  };

  return (
    <div className="flex min-h-screen max-h-screen bg-gradient-mynder overflow-hidden">
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel 
          defaultSize={20} 
          minSize={15} 
          maxSize={40}
          className="min-w-[240px]"
        >
          {mode === "menu" ? (
            <Sidebar onToggleChat={toggleMode} />
          ) : (
            <ChatInterface 
              onToggleMode={toggleMode} 
              onShowContent={handleShowContent}
              onBackToDashboard={handleBackToDashboard}
            />
          )}
        </ResizablePanel>
        
        <ResizableHandle withHandle />
        
        <ResizablePanel defaultSize={80}>
          <main className="h-screen overflow-y-auto bg-background/95 backdrop-blur-sm">
        {contentView && mode === "chat" ? (
          <ContentViewer 
            contentType={contentView.type} 
            filter={contentView.filter}
            viewMode={contentView.options?.viewMode}
            sortBy={contentView.options?.sortBy}
            filterCriteria={contentView.options?.filterCriteria}
            explanation={contentView.explanation}
          />
        ) : (
          <div className="container max-w-7xl mx-auto p-4 md:p-8 pt-6 md:pt-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <img src={mynderLogo} alt="Mynder" className="h-8 md:h-10" />
                <span className="px-3 py-1 bg-primary text-primary-foreground text-sm font-semibold rounded-full">Dashboard</span>
              </div>
              <Button onClick={() => setIsAddModuleOpen(true)} className="gap-2 bg-primary hover:bg-primary/90">
                <Plus className="h-4 w-4" />
                Legg til modul
              </Button>
            </div>
            <p className="text-sm md:text-base text-muted-foreground">AI-drevet compliance og sikkerhetsløsning</p>
          </div>

          {/* Onboarding Progress Card */}
          <Card className="mb-6 bg-gradient-to-br from-primary/5 via-purple-500/5 to-pink-500/5 border-primary/20 shadow-lg overflow-hidden">
            <div className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-foreground mb-2">
                    3 enkle steg til suksess! 🚀
                  </h3>
                  <p className="text-muted-foreground">
                    Kom i gang på under 5 minutter
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-bold bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">33%</div>
                  <p className="text-sm text-muted-foreground">fullført</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center gap-4 p-4 rounded-lg bg-success/10 border border-success/20">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success text-success-foreground shrink-0">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-foreground">1. Bedriftsinformasjon ✓</h4>
                    <p className="text-sm text-muted-foreground">Grunnleggende info er lagt inn</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 p-4 rounded-lg bg-background border-2 border-primary hover:shadow-xl hover:scale-[1.02] transition-all cursor-pointer group">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors shrink-0">
                    <Server className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-foreground">2. Legg til systemer 💻</h4>
                    <p className="text-sm text-muted-foreground">Registrer alle IT-systemene dere bruker – ta 2 min!</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-primary group-hover:translate-x-1 transition-transform shrink-0" />
                </div>
                
                <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/30 border border-border hover:bg-muted/50 transition-all cursor-pointer group">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground shrink-0">
                    <Building className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-foreground">3. Definer arbeidsområder 🏢</h4>
                    <p className="text-sm text-muted-foreground">Strukturer virksomheten i arbeidsområder</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/30 border border-border hover:bg-muted/50 transition-all cursor-pointer group">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground shrink-0">
                    <Users className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-foreground">4. Oppgi roller og ansvar 👥</h4>
                    <p className="text-sm text-muted-foreground">Fordel ansvarsområder i teamet</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 p-4 rounded-lg bg-primary/10 border border-primary/20">
                <p className="text-sm text-foreground">
                  <span className="font-semibold">💡 Tips:</span> Når du er ferdig får du full oversikt over compliance-status og AI-agenten kan hjelpe deg med alt!
                </p>
              </div>
            </div>
          </Card>

          {/* Alert Banner */}
          <div className="mb-6">
            <AlertBanner />
          </div>

          {/* ROI Widget */}
          <div className="mb-6">
            <ROIWidget />
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
          )}
        </main>
        </ResizablePanel>
      </ResizablePanelGroup>

      {/* Lara AI Agent */}
      <LaraAgent />

      {/* Add Module Dialog */}
      <AddModuleDialog 
        open={isAddModuleOpen}
        onOpenChange={setIsAddModuleOpen}
        onModuleCreated={handleModuleCreated}
      />
    </div>
  );
};

export default Index;
