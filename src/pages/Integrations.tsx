import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { Sidebar } from "@/components/Sidebar";
import { ArrowLeft, Bot, Info } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ByoaAgentHero } from "@/components/integrations/ByoaAgentHero";
import {
  ByoaConnectWizard,
  type WizardClient,
} from "@/components/integrations/ByoaConnectWizard";
import { ByoaConnectedStatus } from "@/components/integrations/ByoaConnectedStatus";
import {
  AGENT_TOKENS_EVENT,
  isActiveToken,
  listAgentTokens,
  type AgentTokenRow,
} from "@/lib/agentTokens";
import { McpDocumentDiscoveryPanel } from "@/components/documents/McpDocumentDiscoveryPanel";

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

          <div className="mt-4 flex items-start gap-3 rounded-lg border border-border bg-muted/40 px-4 py-3">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <div className="min-w-0 text-sm">
              <p className="font-medium text-foreground">{t("byoa.dpa.title")}</p>
              <p className="mt-0.5 text-muted-foreground">
                {t("byoa.dpa.body")}{" "}
                <Link to="/dokumenter/databehandleravtale" className="font-medium text-primary underline-offset-4 hover:underline">
                  {t("byoa.dpa.link")}
                </Link>
              </p>
            </div>
          </div>

          <ByoaConnectedStatus
            tokens={tokens}
            onConnectAnother={() => openWizard()}
            onChanged={refreshTokens}
          />

          <ByoaConnectWizard
            open={showWizard}
            onOpenChange={setShowWizard}
            initialClient={wizardClient}
            onConnected={refreshTokens}
          />

          <div className="mt-6">
            <McpDocumentDiscoveryPanel />
          </div>
        </div>
      </main>
    </div>
  );
}
