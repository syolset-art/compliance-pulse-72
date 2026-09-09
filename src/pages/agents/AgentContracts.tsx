import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AgentsPageShell } from "@/components/agents/AgentsPageShell";
import { AgentDomainBadge } from "@/components/agents/AgentDomainBadge";
import { AgentDomain } from "@/lib/agentMacf";
import { CheckCircle2, ShieldQuestion } from "lucide-react";

interface Template {
  id: string;
  name: string;
  domain: AgentDomain;
  summary: string;
  allowed: string[];
  approvals: string[];
}

export const CONTRACT_TEMPLATES: Template[] = [
  {
    id: "onboarding",
    name: "Onboarding av ansatt",
    domain: "hr",
    summary: "Klargjør utstyr, tilganger og dokumenter før første arbeidsdag.",
    allowed: ["Lese ansattdata", "Opprette oppgaver", "Sende påminnelser"],
    approvals: ["Tildeling av tilganger", "Utsending til den ansatte"],
  },
  {
    id: "offer",
    name: "Tilbudsutkast",
    domain: "sales",
    summary: "Skriver førsteutkast til tilbud basert på tidligere leveranser.",
    allowed: ["Lese CRM", "Skrive utkast"],
    approvals: ["Sending til kunde", "Endring av pris"],
  },
  {
    id: "content",
    name: "Innholdsplanlegging",
    domain: "comms",
    summary: "Foreslår temaer og forbereder utkast til publisering.",
    allowed: ["Lese kampanjeplan", "Skrive utkast"],
    approvals: ["Publisering"],
  },
  {
    id: "invoice",
    name: "Fakturakontroll",
    domain: "finance",
    summary: "Kontrollerer faktura mot avtale og bestilling, flagger avvik.",
    allowed: ["Lese faktura og avtale", "Flagge avvik"],
    approvals: ["Godkjenning av betaling"],
  },
  {
    id: "vendor",
    name: "Leverandørgjennomgang",
    domain: "compliance",
    summary: "Samler dokumentasjon og peker på hull før gjennomgang.",
    allowed: ["Lese dokumenter", "Lage notat"],
    approvals: ["Konklusjon om leverandøren"],
  },
];

export default function AgentContracts() {
  const navigate = useNavigate();

  return (
    <AgentsPageShell
      title="Arbeidskontrakter"
      description="Maler for hva en agent gjør, hva den kan gjøre selv, og hva som krever godkjenning."
    >
      <div className="grid gap-3 sm:grid-cols-2">
        {CONTRACT_TEMPLATES.map((t) => (
          <Card key={t.id} className="p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-medium truncate">{t.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{t.summary}</p>
              </div>
              <AgentDomainBadge domain={t.domain} />
            </div>

            <div className="space-y-1.5 text-xs">
              <p className="flex items-start gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-success mt-px shrink-0" />
                <span className="text-muted-foreground">Kan selv: {t.allowed.join(", ")}</span>
              </p>
              <p className="flex items-start gap-1.5">
                <ShieldQuestion className="h-3.5 w-3.5 text-warning mt-px shrink-0" />
                <span className="text-muted-foreground">
                  Krever godkjenning: {t.approvals.join(", ")}
                </span>
              </p>
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate(`/agents/new?template=${t.id}`)}
            >
              Bruk denne
            </Button>
          </Card>
        ))}
      </div>
    </AgentsPageShell>
  );
}
