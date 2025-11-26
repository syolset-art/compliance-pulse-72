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
import { CheckCircle2, TrendingUp, Plus } from "lucide-react";
import { useNavigationMode } from "@/hooks/useNavigationMode";
import { Button } from "@/components/ui/button";

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
    <div className="flex min-h-screen max-h-screen bg-background overflow-hidden">
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
          <main className="h-screen overflow-y-auto">
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
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">Eviny</h1>
                <span className="px-3 py-1 bg-primary/10 text-primary text-sm font-medium rounded-full">Dashboard</span>
              </div>
              <Button onClick={() => setIsAddModuleOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Legg til modul
              </Button>
            </div>
            <p className="text-sm md:text-base text-muted-foreground">Compliance og sikkerhetsløsning drevet av Mynder</p>
          </div>

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
