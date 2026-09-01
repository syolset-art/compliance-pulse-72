import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { Sidebar } from "@/components/Sidebar";
import { ArrowLeft, Bot } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ByoaAgentHero } from "@/components/integrations/ByoaAgentHero";
import {
  ByoaConnectWizard,
  type WizardClient,
} from "@/components/integrations/ByoaConnectWizard";
import { ByoaConnectedStatus } from "@/components/integrations/ByoaConnectedStatus";
import { ClientPickerCards } from "@/components/integrations/ClientPickerCards";
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
  const { t } = useTranslation();
  const [tokens, setTokens] = useState<AgentTokenRow[]>([]);
  const [showWizard, setShowWizard] = useState(false);
  const [wizardClient, setWizardClient] = useState<WizardClient>("claude");
  const activeTokens = tokens.filter(isActiveToken);
  const refreshTokens = async () => setTokens(await listAgentTokens());

  useEffect(() => {
    refreshTokens();
    const sync = () => refreshTokens();
    window.addEventListener(AGENT_TOKENS_EVENT, sync);
    return () => window.removeEventListener(AGENT_TOKENS_EVENT, sync);
  }, []);

  const openWizard = (client: WizardClient = "claude") => {
    setWizardClient(client);
    setShowWizard(true);
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="container mx-auto max-w-5xl px-6 pb-16 pt-16">
          <div className="flex items-start gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              aria-label={t("common.back", "Tilbake")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Bot className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-semibold tracking-tight">{t("byoa.page.title")}</h1>
              <p className="mt-1 max-w-prose text-sm text-muted-foreground">
                {t("byoa.page.intro")}
              </p>
            </div>
          </div>

          <ByoaAgentHero onConnect={() => openWizard()} activeCount={activeTokens.length} />

          <ByoaConnectedStatus
            tokens={activeTokens}
            onConnectAnother={() => openWizard()}
            onChanged={refreshTokens}
          />

          <ClientPickerCards onSelect={openWizard} />

          <ByoaConnectWizard
            open={showWizard}
            onOpenChange={setShowWizard}
            initialClient={wizardClient}
            onConnected={refreshTokens}
          />

          <ContinuousComplianceCard />

          <AgentDeveloperDetails />
        </div>
      </main>
    </div>
  );
}
