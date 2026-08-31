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
  ScrollText,
  ShieldCheck,
  Sparkles,
  Trash2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { mcpServerUrl } from "@/lib/mcpAgentConnections";
import { AgentMandateEditor } from "@/components/integrations/AgentMandateEditor";
import {
  AGENT_CLIENT_LABEL,
  approvalSummary,
  defaultMandate,
  mandateSummary,
  readConnectedAgents,
  writeConnectedAgents,
  type AgentClientKind,
  type Mandate,
} from "@/lib/agentMandate";

interface CodeRow {
  id: string;
  name: string;
  token_prefix: string;
  created_at: string;
  last_used_at: string | null;
  revoked_at: string | null;
}

const CLIENTS: { id: AgentClientKind; label: string; hint: string; icon: typeof Bot }[] = [
  { id: "claude", label: "Claude", hint: "Anthropic – app eller nettleser", icon: Sparkles },
  { id: "chatgpt", label: "ChatGPT", hint: "OpenAI – app eller nettleser", icon: MessageSquare },
  { id: "other", label: "Annen agent", hint: "Cursor, Codex eller egen agent", icon: Bot },
];

/** Kopifelt med etikett – brukes for adresse og token i avansert oppsett. */
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

const MANUAL_INSTRUCTIONS = [
  "Åpne innstillingene for MCP-koblinger i verktøyet ditt.",
  "Legg til en ny server av typen «HTTP» eller «Remote / Streamable HTTP».",
  "Bruk adressen under som URL, og tokenet som nøkkel når det etterspørres.",
  "Lagre og start verktøyet på nytt hvis det kreves.",
];

export function ByoaConnectWizard({
  open,
  onOpenChange,
  onConnected,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** Kalles når en agent er registrert – brukes til å vise fanen «Tilkoblede agenter». */
  onConnected?: () => void;
}) {

  const [step, setStep] = useState(1);
  const [client, setClient] = useState<AgentClientKind>("claude");
  const [mandate, setMandate] = useState<Mandate>(() => defaultMandate());
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);

  // Avansert/manuelt oppsett (kun «Annen agent»)
  const [connectionName, setConnectionName] = useState("Min agent");
  const [codes, setCodes] = useState<CodeRow[]>([]);
  const [freshToken, setFreshToken] = useState<string | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  const [creating, setCreating] = useState(false);

  const endpoint = mcpServerUrl();
  const clientLabel = AGENT_CLIENT_LABEL[client];

  const loadCodes = async () => {
    const { data } = await supabase
      .from("agent_access_tokens")
      .select("id, name, token_prefix, created_at, last_used_at, revoked_at")
      .order("created_at", { ascending: false });
    setCodes((data as CodeRow[]) ?? []);
  };

  useEffect(() => {
    if (!open) return;
    setStep(1);
    setClient("claude");
    setMandate(defaultMandate());
    setConnected(false);
    setConnecting(false);
    setFreshToken(null);
    setIsDemo(false);
    setConnectionName("Min agent");
    loadCodes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const makeDemoToken = () => {
    const bytes = new Uint8Array(24);
    crypto.getRandomValues(bytes);
    const hex = Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    return `mynder_${hex}`;
  };

  const registerAgent = (name: string, manual: boolean) => {
    const existing = readConnectedAgents();
    writeConnectedAgents([
      {
        id: `agent-${Date.now()}`,
        name,
        client,
        status: "active",
        connectedAt: new Date().toISOString(),
        lastUsedLabel: "Sist brukt i dag",
        mandate,
        manual,
        demo: true,
      },
      ...existing,
    ]);
  };

  /** Simulert OAuth/OIDC-flyt for Claude og ChatGPT. */
  const connectWithOauth = async () => {
    setConnecting(true);
    await new Promise((r) => setTimeout(r, 1200));
    registerAgent(`${clientLabel} – denne enheten`, false);
    setConnecting(false);
    setConnected(true);
    toast.success(`${clientLabel} er koblet til Mynder`, {
      description: "Demoflyt – tilgangen vises nå under «Tilkoblede agenter».",
    });
  };

  const createCode = async () => {
    setCreating(true);
    const name = connectionName.trim() || "Min agent";
    try {
      const { data, error } = await supabase.functions.invoke("create-agent-code", {
        body: { name },
      });
      if (error || !data?.token) throw error ?? new Error("Ingen kode");
      setFreshToken(data.token as string);
      setIsDemo(false);
      await loadCodes();
      registerAgent(name, true);
      toast.success("Tokenet er laget. Kopier det nå – det vises bare denne ene gangen.");
    } catch {
      const token = makeDemoToken();
      setFreshToken(token);
      setIsDemo(true);
      setCodes((prev) => [
        {
          id: `demo-${token.slice(-6)}`,
          name,
          token_prefix: token.slice(0, 14),
          created_at: new Date().toISOString(),
          last_used_at: null,
          revoked_at: null,
        },
        ...prev,
      ]);
      registerAgent(name, true);
      toast.success("Eksempeltoken laget (demo). Slik ser tokenet ut når du er innlogget.");
    } finally {
      setCreating(false);
    }
  };

  const revoke = async (id: string) => {
    if (id.startsWith("demo-")) {
      setCodes((prev) =>
        prev.map((c) => (c.id === id ? { ...c, revoked_at: new Date().toISOString() } : c)),
      );
      toast.info("Tokenet er trukket tilbake. Agenten mister tilgangen.");
      return;
    }
    await supabase
      .from("agent_access_tokens")
      .update({ revoked_at: new Date().toISOString() })
      .eq("id", id);
    await loadCodes();
    toast.info("Tokenet er trukket tilbake. Agenten mister tilgangen.");
  };

  const stepTitles = ["Velg agent", "Bestem mandat", "Koble til"];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Koble agenten din til Mynder</DialogTitle>
          <DialogDescription>
            Tre steg: velg agent, bestem mandat og koble til. Du styrer tilgangen hele veien.
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
              <span
                className={`hidden text-xs sm:inline ${step === n ? "font-medium text-foreground" : "text-muted-foreground"}`}
              >
                {stepTitles[n - 1]}
              </span>
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
                    aria-pressed={active}
                    onClick={() => setClient(c.id)}
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
            <p className="text-sm font-medium text-foreground">Hva skal agenten få tilgang til?</p>
            <AgentMandateEditor mandate={mandate} onChange={setMandate} idPrefix="wizard" />
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-muted/30 p-3">
              <p className="text-[13px] font-medium text-foreground">
                {clientLabel} kobles til Mynder
              </p>
              <dl className="mt-2 space-y-1 text-[13px]">
                <div className="flex gap-2">
                  <dt className="w-28 shrink-0 text-muted-foreground">Organisasjon</dt>
                  <dd className="text-foreground">
                    Acme AS{" "}
                    <Badge variant="outline" className="text-[10px] text-muted-foreground">
                      Demo
                    </Badge>
                  </dd>
                </div>
                <div className="flex gap-2">
                  <dt className="w-28 shrink-0 text-muted-foreground">Tilgang</dt>
                  <dd className="text-foreground">{mandateSummary(mandate)}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="w-28 shrink-0 text-muted-foreground">Godkjenning</dt>
                  <dd className="text-foreground">{approvalSummary(mandate)}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="w-28 shrink-0 text-muted-foreground">Logging</dt>
                  <dd className="text-foreground">Alle agenthandlinger logges</dd>
                </div>
              </dl>
            </div>

            {client !== "other" ? (
              <div className="space-y-3">
                {connected ? (
                  <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 p-3">
                    <Check className="h-4 w-4 text-primary" aria-hidden="true" />
                    <span className="text-[13px] text-foreground">
                      {clientLabel} er koblet til og vises under «Tilkoblede agenter».
                    </span>
                  </div>
                ) : (
                  <>
                    <Button className="w-full gap-2" onClick={connectWithOauth} disabled={connecting}>
                      {connecting ? (
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                      ) : (
                        <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                      )}
                      {connecting ? "Venter på godkjenning …" : `Koble til ${clientLabel}`}
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      Du logger inn og godkjenner tilgangen i {clientLabel}. Du trenger ingen
                      hemmelig kode. Denne prototypen simulerer innloggingen.
                    </p>
                  </>
                )}
                <p className="flex items-start gap-2 text-xs text-muted-foreground">
                  <ScrollText className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  Du kan når som helst endre eller trekke tilbake tilgangen.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-[13px] text-muted-foreground">
                  Egne agenter kobles til manuelt med MCP-adressen og et hemmelig token.
                </p>

                <CopyField label="MCP-adresse" value={endpoint} />

                <div>
                  <Label htmlFor="byoa-name" className="text-xs text-muted-foreground">
                    Navn på koblingen
                  </Label>
                  <Input
                    id="byoa-name"
                    className="mt-1 h-9 text-[13px]"
                    placeholder="F.eks. Cursor – jobb-PC"
                    value={connectionName}
                    onChange={(e) => setConnectionName(e.target.value)}
                    disabled={!!freshToken}
                  />
                </div>

                {freshToken ? (
                  <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
                    <div className="mb-2 flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" aria-hidden="true" />
                      <span className="text-[13px] font-medium text-foreground">
                        «{connectionName.trim() || "Min agent"}» er opprettet
                      </span>
                      {isDemo && (
                        <Badge variant="outline" className="text-[10px]">
                          Demo
                        </Badge>
                      )}
                    </div>
                    <CopyField label="Hemmelig token" value={freshToken} secret />
                    <p className="mt-2 text-xs text-muted-foreground">
                      Behandle tokenet som et passord. Vi viser det bare nå – mister du det, lager
                      du bare et nytt.
                    </p>
                  </div>
                ) : (
                  <Button
                    onClick={createCode}
                    disabled={creating || !connectionName.trim()}
                    className="gap-2"
                  >
                    {creating ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <KeyRound className="h-4 w-4" aria-hidden="true" />
                    )}
                    Lag token
                  </Button>
                )}

                <ol className="space-y-2 rounded-lg border border-border bg-muted/30 p-3">
                  {MANUAL_INSTRUCTIONS.map((line, i) => (
                    <li key={i} className="flex gap-2 text-[13px] text-foreground">
                      <span className="text-muted-foreground">{i + 1}.</span>
                      <span>{line}</span>
                    </li>
                  ))}
                </ol>

                {codes.length > 0 && (
                  <div className="rounded-lg border border-border">
                    <div className="border-b px-3 py-2 text-xs font-medium text-muted-foreground">
                      Tokenene dine
                    </div>
                    <ul className="divide-y">
                      {codes.map((c) => (
                        <li
                          key={c.id}
                          className="flex flex-wrap items-center gap-3 px-3 py-2 text-[13px]"
                        >
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
                              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                              Trekk tilbake
                            </Button>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <p className="text-xs text-muted-foreground">
                  Du kan når som helst endre eller trekke tilbake tilgangen.
                </p>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1"
            onClick={() => (step === 1 ? onOpenChange(false) : setStep(step - 1))}
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            {step === 1 ? "Avbryt" : "Tilbake"}
          </Button>
          {step < 3 ? (
            <Button size="sm" className="gap-1" onClick={() => setStep(step + 1)}>
              Neste
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
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
