import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Check, Copy, ExternalLink, Play, Plug, ShieldCheck } from "lucide-react";
import { MCP_EXPOSED_TOOLS, mcpServerUrl } from "@/lib/mcpAgentConnections";

/**
 * Demonstrerer arbeidsmåten: kundens egen agent kobles til Mynder via MCP,
 * finner dokumentasjonen i egen infrastruktur og rapporterer dekningsgrad
 * tilbake — uten at dokumentene deles med Mynder.
 */
export function McpDocumentDiscoveryPanel() {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb" || i18n.language === "no";
  const L = (nb: string, en: string) => (isNb ? nb : en);
  const { toast } = useToast();

  const [copied, setCopied] = useState(false);
  const [ran, setRan] = useState(false);

  const url = mcpServerUrl();

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: L("Kunne ikke kopiere", "Could not copy"), variant: "destructive" });
    }
  };

  return (
    <Card className="border-primary/20 bg-primary/[0.03]">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2">
            <Plug className="h-4 w-4 text-primary mt-0.5" aria-hidden="true" />
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                {L(
                  "Kartlegg dokumentasjon uten å laste den opp",
                  "Map documentation without uploading it",
                )}
              </h3>
              <p className="text-[13px] text-muted-foreground mt-1 max-w-2xl">
                {L(
                  "Koble din egen agent til Mynder via en MCP-lenke. Agenten leser hvilke regelverk og krav dere har aktivert her, finner tilsvarende dokumentasjon i deres egen infrastruktur og bekrefter at den finnes — uten at dokumentene deles med eller lastes opp til Mynder.",
                  "Connect your own agent to Mynder through an MCP link. The agent reads which regulations and requirements you have activated here, finds matching documentation in your own infrastructure and confirms that it exists — without sharing or uploading the documents to Mynder.",
                )}
              </p>
            </div>
          </div>
          <Badge variant="outline" className="shrink-0 border-primary/30 text-primary">
            {L("Beta", "Beta")}
          </Badge>
        </div>

        <p className="text-[13px] text-muted-foreground">
          {L(
            "Agenten vurderer også kvaliteten lokalt: hvor mange av artiklene i et krav dokumentet faktisk treffer. Dekningsgraden rapporteres tilbake og påvirker modenheten på samme måte som et opplastet dokument.",
            "The agent also assesses quality locally: how many of the articles in a requirement the document actually addresses. The coverage is reported back and affects maturity the same way an uploaded document does.",
          )}
        </p>

        <div className="rounded-md border border-border bg-background px-3 py-2 flex items-center gap-2">
          <code className="text-[12px] text-muted-foreground truncate flex-1">{url}</code>
          <Button variant="ghost" size="sm" className="h-7 gap-1.5" onClick={copy}>
            {copied ? <Check className="h-3.5 w-3.5 text-success" aria-hidden="true" /> : <Copy className="h-3.5 w-3.5" aria-hidden="true" />}
            {copied ? L("Kopiert", "Copied") : L("Kopier", "Copy")}
          </Button>
        </div>

        <div className="space-y-1.5">
          <p className="text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">
            {L("Verktøy agenten får tilgang til", "Tools the agent gets access to")}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {MCP_EXPOSED_TOOLS.map((t) => (
              <Badge key={t.name} variant="outline" className="font-normal text-[12px]">
                {isNb ? t.nb : t.en}
              </Badge>
            ))}
          </div>
        </div>

        {ran ? (
          <div role="status" aria-live="polite" className="rounded-md border border-success/30 bg-success/5 px-3 py-2 space-y-1">
            <div className="flex items-center gap-2 text-[13px] font-medium text-foreground">
              <ShieldCheck className="h-4 w-4 text-success" aria-hidden="true" />
              {L("Agentkjøring fullført (demo)", "Agent run completed (demo)")}
            </div>
            <p className="text-[13px] text-muted-foreground">
              {L(
                "3 dokumenter bekreftet i egen infrastruktur, 1 delvis dekning. Ingen dokumenter ble delt med Mynder.",
                "3 documents confirmed in your own infrastructure, 1 partial coverage. No documents were shared with Mynder.",
              )}
            </p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setRan(true)}>
              <Play className="h-3.5 w-3.5" aria-hidden="true" />
              {L("Kjør demo-agent", "Run demo agent")}
            </Button>
            <Button asChild size="sm" variant="ghost" className="gap-1.5">
              <Link to="/settings/mcp">
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                {L("Administrer MCP-koblinger", "Manage MCP connections")}
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
