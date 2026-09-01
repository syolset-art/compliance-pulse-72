import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { Sidebar } from "@/components/Sidebar";
import { ArrowLeft, Bot } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ByoaAgentHero } from "@/components/integrations/ByoaAgentHero";
import { ByoaConnectWizard } from "@/components/integrations/ByoaConnectWizard";
import { ByoaConnectedStatus } from "@/components/integrations/ByoaConnectedStatus";
import { AgentDeveloperDetails } from "@/components/integrations/AgentCapabilitiesList";
import { ContinuousComplianceCard } from "@/components/integrations/ContinuousComplianceCard";
import {
  AGENT_TOKENS_EVENT,
  isActiveToken,
  listAgentTokens,
  type AgentTokenRow,
} from "@/lib/agentTokens";

export default function Integrations() {
  const navigate = useNavigate();
  const [tokens, setTokens] = useState<AgentTokenRow[]>([]);
  const [showWizard, setShowWizard] = useState(false);
  const activeTokens = tokens.filter(isActiveToken);
  const refreshTokens = async () => setTokens(await listAgentTokens());

  useEffect(() => {
    refreshTokens();
    const sync = () => refreshTokens();
    window.addEventListener(AGENT_TOKENS_EVENT, sync);
    return () => window.removeEventListener(AGENT_TOKENS_EVENT, sync);
  }, []);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="container mx-auto pt-16 px-6 pb-12 max-w-7xl">
          <div className="flex items-start gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} aria-label="Tilbake">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">MCP Integrasjon</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Koble din egen AI-agent til Mynder. Du bestemmer hva den får se, hva den får gjøre, og hva som krever din godkjenning.
              </p>
            </div>
          </div>

          {activeTokens.length > 0 ? (
            <ByoaConnectedStatus
              tokens={activeTokens}
              onConnectAnother={() => setShowWizard(true)}
              onChanged={refreshTokens}
            />
          ) : (
            <ByoaAgentHero onConnect={() => setShowWizard(true)} />
          )}

          <ByoaConnectWizard
            open={showWizard}
            onOpenChange={setShowWizard}
            onConnected={refreshTokens}
          />

          <ContinuousComplianceCard />

          <AgentDeveloperDetails />
        </div>
      </main>
    </div>
  );
}
