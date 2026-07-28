import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Lock, Shield, Sparkles, Info, KeyRound, ExternalLink, Upload } from "lucide-react";
import {
  DISCOVERY_LABEL,
  type IntegrationDefinition,
} from "@/lib/integrationCatalog";

interface Props {
  integration: IntegrationDefinition | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: (integration: IntegrationDefinition) => void;
}

export function ConnectIntegrationDialog({ integration, onOpenChange, onConfirm }: Props) {
  const [apiKey, setApiKey] = useState("");
  const [acknowledged, setAcknowledged] = useState(false);

  if (!integration) return null;

  const canConfirm =
    acknowledged &&
    (integration.authType === "oauth" ||
      integration.authType === "upload" ||
      (integration.authType === "api_key" && apiKey.trim().length > 5));

  const submit = () => {
    if (!canConfirm) return;
    setApiKey("");
    setAcknowledged(false);
    onConfirm(integration);
  };

  return (
    <Dialog open={!!integration} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <integration.icon className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle>Koble til {integration.name}</DialogTitle>
              <DialogDescription className="text-xs">
                Sikker tilkobling via Mynder Connect
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">
              Hva Lara henter
            </div>
            <div className="flex flex-wrap gap-1.5">
              {integration.discovers.map((d) => (
                <Badge key={d} variant="secondary" className="text-xs">
                  {DISCOVERY_LABEL[d]}
                </Badge>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
              {integration.description}
            </p>
          </div>

          {integration.scopes.length > 0 && (
            <div>
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5 flex items-center gap-1">
                <Shield className="h-3 w-3" />
                Tillatelser vi ber om
              </div>
              <div className="rounded-md border bg-muted/30 p-2.5 space-y-1">
                {integration.scopes.map((s) => (
                  <div key={s} className="text-xs font-mono text-foreground/80 flex items-center gap-2">
                    <span className="h-1 w-1 rounded-full bg-success" />
                    {s}
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-muted-foreground mt-1.5">
                Kun lesetilgang. Ingen data endres i {integration.vendor}.
              </p>
            </div>
          )}

          {integration.authType === "api_key" && (
            <div>
              <Label htmlFor="api-key" className="flex items-center gap-1.5 text-xs">
                <KeyRound className="h-3 w-3" />
                API-nøkkel
              </Label>
              <Input
                id="api-key"
                type="password"
                autoComplete="off"
                placeholder="Lim inn API-nøkkel fra leverandøren"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="mt-1.5 font-mono text-xs"
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                Lagres kryptert. Vises aldri i klartekst etter lagring.
              </p>
            </div>
          )}

          <Alert className="border-primary/20 bg-primary/5">
            <Lock className="h-4 w-4 text-primary" />
            <AlertDescription className="text-xs leading-relaxed">
              <strong>Personvern og sikkerhet:</strong> Tokens lagres kryptert i EU. Data behandles kun for
              kartleggingsformål. Du kan når som helst revokere tilgangen.{" "}
              <a href="#" className="text-primary hover:underline inline-flex items-center gap-0.5">
                Databehandleravtale <ExternalLink className="h-3 w-3" />
              </a>
            </AlertDescription>
          </Alert>

          <Alert>
            <Sparkles className="h-4 w-4 text-primary" />
            <AlertDescription className="text-xs leading-relaxed">
              Lara viser oppdagede elementer i innboksen. <strong>Ingenting</strong> legges automatisk til
              registeret uten din godkjenning.
            </AlertDescription>
          </Alert>

          <label className="flex items-start gap-2 cursor-pointer text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={acknowledged}
              onChange={(e) => setAcknowledged(e.target.checked)}
              className="mt-0.5 accent-primary"
            />
            <span>
              Jeg bekrefter at jeg har fullmakt til å koble {integration.name} til Mynder på vegne av min
              organisasjon.
            </span>
          </label>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Avbryt
          </Button>
          <Button onClick={submit} disabled={!canConfirm}>
            {integration.authType === "oauth" && (
              <>
                <Shield className="h-3.5 w-3.5 mr-1.5" />
                Start sikker OAuth
              </>
            )}
            {integration.authType === "api_key" && (
              <>
                <KeyRound className="h-3.5 w-3.5 mr-1.5" />
                Lagre og koble til
              </>
            )}
            {integration.authType === "upload" && (
              <>
                <Upload className="h-3.5 w-3.5 mr-1.5" />
                Last opp fil
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
