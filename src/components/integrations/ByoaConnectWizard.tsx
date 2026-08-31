import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  Check,
  Copy,
  KeyRound,
  Loader2,
  MessageSquare,
  Sparkles,
  Trash2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { mcpServerUrl } from "@/lib/mcpAgentConnections";

type ClientKind = "claude" | "chatgpt" | "other";

interface CodeRow {
  id: string;
  name: string;
  token_prefix: string;
  created_at: string;
  last_used_at: string | null;
  revoked_at: string | null;
}

const CLIENTS: { id: ClientKind; label: string; hint: string; icon: typeof Bot }[] = [
  { id: "claude", label: "Claude", hint: "Anthropic – app eller nettleser", icon: Sparkles },
  { id: "chatgpt", label: "ChatGPT", hint: "OpenAI – app eller nettleser", icon: MessageSquare },
  { id: "other", label: "Annet", hint: "Cursor, Codex eller egen agent", icon: Bot },
];

/** Kopifelt med etikett – brukes for adresse og kode. */
function CopyField({ label, value, secret }: { label: string; value: string; secret?: boolean }) {
  const [copied, setCopied] = useState(false);
  return (
    <div>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="mt-1 flex gap-2">
        <Input
          readOnly
          value={value}
          className={`h-9 text-[13px] ${secret ? "font-mono" : ""}`}
          onFocus={(e) => e.currentTarget.select()}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9 shrink-0 gap-1.5"
          onClick={async () => {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 1800);
            toast.success(`${label} kopiert`);
          }}
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          Kopier
        </Button>
      </div>
    </div>
  );
}

const INSTRUCTIONS: Record<ClientKind, string[]> = {
  claude: [
    "Åpne Claude og gå til Innstillinger.",
    "Velg «Koblinger» (Connectors) og trykk «Legg til egendefinert kobling».",
    "Lim inn adressen under i feltet for URL, og gi koblingen navnet «Mynder».",
    "Lim inn koden din hvis Claude spør etter en nøkkel eller token.",
    "Trykk «Koble til». Logg inn i Mynder og godkjenn når du blir spurt.",
  ],
  chatgpt: [
    "Åpne ChatGPT og gå til Innstillinger.",
    "Velg «Koblinger» og trykk «Legg til» / «Egendefinert kobling».",
    "Lim inn adressen under som server-URL, og kall den «Mynder».",
    "Lim inn koden din hvis ChatGPT ber om en nøkkel eller token.",
    "Lagre. Logg inn i Mynder og godkjenn når du blir spurt.",
  ],
  other: [
    "Åpne innstillingene for MCP-koblinger i verktøyet ditt.",
    "Legg til en ny server av typen «HTTP» eller «Remote / Streamable HTTP».",
    "Bruk adressen under som URL, og koden din som token hvis den etterspørres.",
    "Lagre og start verktøyet på nytt hvis det kreves.",
  ],
};

export function ByoaConnectWizard({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [step, setStep] = useState(1);
  const [client, setClient] = useState<ClientKind>("claude");
  const [connectionName, setConnectionName] = useState("Claude");
  const [codes, setCodes] = useState<CodeRow[]>([]);
  const [freshToken, setFreshToken] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const endpoint = mcpServerUrl();

  const loadCodes = async () => {
    const { data } = await supabase
      .from("agent_access_tokens")
      .select("id, name, token_prefix, created_at, last_used_at, revoked_at")
      .order("created_at", { ascending: false });
    setCodes((data as CodeRow[]) ?? []);
  };

  useEffect(() => {
    if (open) {
      setStep(1);
      setFreshToken(null);
      setConnectionName(CLIENTS.find((c) => c.id === client)?.label ?? "Min agent");
      loadCodes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const createCode = async () => {
    setCreating(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-agent-code", {
        body: { name: connectionName.trim() || "Min agent" },
      });
      if (error || !data?.token) throw error ?? new Error("Ingen kode");
      setFreshToken(data.token as string);
      await loadCodes();
      toast.success("Koden din er laget. Kopier den nå – den vises bare denne ene gangen.");
    } catch {
      toast.error("Klarte ikke å lage koden. Prøv igjen om litt.");
    } finally {
      setCreating(false);
    }
  };

  const revoke = async (id: string) => {
    await supabase
      .from("agent_access_tokens")
      .update({ revoked_at: new Date().toISOString() })
      .eq("id", id);
    await loadCodes();
    toast.info("Koden er trukket tilbake. Agenten mister tilgangen.");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Koble agenten din til Mynder</DialogTitle>
          <DialogDescription>
            Tre steg. Du trenger ikke kunne noe teknisk – bare kopiere og lime inn.
          </DialogDescription>
        </DialogHeader>

        {/* Stegindikator */}
        <div className="flex items-center gap-2">
          {[1, 2, 3].map((n) => (
            <div key={n} className="flex flex-1 items-center gap-2">
              <div
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium ${
                  step >= n ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}
              >
                {n}
              </div>
              {n < 3 && <div className={`h-px flex-1 ${step > n ? "bg-primary" : "bg-border"}`} />}
            </div>
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Hvor bor agenten din?</p>
            <div className="grid gap-2 sm:grid-cols-3">
              {CLIENTS.map((c) => {
                const Icon = c.icon;
                const active = client === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setClient(c.id);
                      if (CLIENTS.some((x) => x.label === connectionName.trim()) || !connectionName.trim()) {
                        setConnectionName(c.label);
                      }
                    }}
                    className={`rounded-lg border p-3 text-left transition-colors ${
                      active ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
                    }`}
                  >
                    <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
                    <div className="mt-2 text-sm font-medium text-foreground">{c.label}</div>
                    <div className="text-xs text-muted-foreground">{c.hint}</div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Gi koblingen et navn du kjenner igjen, og lag koden. Koden er din personlige nøkkel til
              Mynder – behandle den som et passord.
            </p>

            <div>
              <Label htmlFor="byoa-name" className="text-xs text-muted-foreground">
                Navn på koblingen
              </Label>
              <Input
                id="byoa-name"
                className="mt-1 h-9 text-[13px]"
                placeholder={`F.eks. ${clientLabel} – jobb-PC`}
                value={connectionName}
                onChange={(e) => setConnectionName(e.target.value)}
                disabled={!!freshToken}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Vanlig praksis er å navngi koblingen etter agenten og hvor den brukes – da ser du
                lett hvilken kode du skal trekke tilbake senere.
              </p>
              {!freshToken && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {[`${clientLabel} – jobb-PC`, `${clientLabel} – privat`, `${clientLabel} – mobil`].map(
                    (s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setConnectionName(s)}
                        className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted"
                      >
                        {s}
                      </button>
                    ),
                  )}
                </div>
              )}
            </div>


            {freshToken ? (
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
                <CopyField label="Din kode" value={freshToken} secret />
                <p className="mt-2 text-xs text-muted-foreground">
                  Vi viser koden bare nå. Mister du den, lager du bare en ny.
                </p>
              </div>
            ) : (
              <Button
                onClick={createCode}
                disabled={creating || !connectionName.trim()}
                className="gap-2"
              >
                {creating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <KeyRound className="h-4 w-4" />
                )}
                Lag koden min
              </Button>
            )}


            {codes.length > 0 && (
              <div className="rounded-lg border border-border">
                <div className="border-b px-3 py-2 text-xs font-medium text-muted-foreground">
                  Kodene dine
                </div>
                <ul className="divide-y">
                  {codes.map((c) => (
                    <li key={c.id} className="flex items-center gap-3 px-3 py-2 text-[13px]">
                      <span className="font-medium text-foreground">{c.name}</span>
                      <span className="font-mono text-muted-foreground">{c.token_prefix}…</span>
                      <span className="text-muted-foreground">
                        {new Date(c.created_at).toLocaleDateString("nb-NO")}
                      </span>
                      {c.revoked_at ? (
                        <Badge variant="outline" className="ml-auto text-[10px]">
                          Trukket tilbake
                        </Badge>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="ml-auto h-7 gap-1 px-2 text-xs text-destructive hover:text-destructive"
                          onClick={() => revoke(c.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Trekk tilbake
                        </Button>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="space-y-3">
              <CopyField label="Adresse" value={endpoint} />
              {freshToken && <CopyField label="Din kode" value={freshToken} secret />}
            </div>

            <ol className="space-y-2 rounded-lg border border-border bg-muted/30 p-3">
              {INSTRUCTIONS[client].map((line, i) => (
                <li key={i} className="flex gap-2 text-[13px] text-foreground">
                  <span className="text-muted-foreground">{i + 1}.</span>
                  <span>{line}</span>
                </li>
              ))}
            </ol>

            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
              <p className="text-[13px] font-medium text-foreground">
                Slik sjekker du at det virker
              </p>
              <p className="mt-1 text-[13px] text-muted-foreground">
                Skriv til agenten din: «Hvilke leverandører har jeg i Mynder?» Agenten skal svare med
                leverandørene dine og kritikaliteten deres. Får du ikke svar, gå gjennom stegene over
                én gang til.
              </p>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1"
            onClick={() => (step === 1 ? onOpenChange(false) : setStep(step - 1))}
          >
            <ArrowLeft className="h-4 w-4" />
            {step === 1 ? "Avbryt" : "Tilbake"}
          </Button>
          {step < 3 ? (
            <Button size="sm" className="gap-1" onClick={() => setStep(step + 1)}>
              Neste
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button size="sm" onClick={() => onOpenChange(false)}>
              Ferdig
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
