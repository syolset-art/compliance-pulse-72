import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  AlertTriangle,
  Bot,
  Check,
  CheckCircle2,
  Copy,
  KeyRound,
  Loader2,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import { mcpServerUrl } from "@/lib/mcpAgentConnections";
import {
  AGENT_TOKENS_EVENT,
  createAgentToken,
  isActiveToken,
  listAgentTokens,
  revokeAgentToken,
  type AgentTokenRow,
  type ExpiryChoice,
} from "@/lib/agentTokens";

export type WizardClient = "claude" | "chatgpt" | "other";

const CLIENT_ICON = {
  claude: Sparkles,
  chatgpt: MessageSquare,
  other: Bot,
} as const;

/** Kopiknapp med tilgjengelig etikett. */
function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="h-9 shrink-0 gap-1.5"
      aria-label={label}
      onClick={async () => {
        await navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
        toast.success(label);
      }}
    >
      {copied ? (
        <Check className="h-3.5 w-3.5" aria-hidden="true" />
      ) : (
        <Copy className="h-3.5 w-3.5" aria-hidden="true" />
      )}
    </Button>
  );
}

function StepCard({
  number,
  title,
  children,
}: {
  number: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-3">
        <span
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent text-[13px] font-semibold text-accent-foreground"
          aria-hidden="true"
        >
          {number}
        </span>
        <h3 className="text-[15px] font-semibold text-foreground">{title}</h3>
      </div>
      <div className="mt-4">{children}</div>
    </Card>
  );
}

/**
 * BYOA-veiviser i tre stablede steg: velg klient, lag personlig kode, lim inn.
 */
export function ByoaConnectWizard({ onConnected }: { onConnected?: () => void } = {}) {
  const { t } = useTranslation();
  const [client, setClient] = useState<WizardClient>("claude");
  const [name, setName] = useState("");
  const [expiry, setExpiry] = useState<ExpiryChoice>("90");
  const [creating, setCreating] = useState(false);
  const [freshToken, setFreshToken] = useState<string | null>(null);
  const [tokens, setTokens] = useState<AgentTokenRow[]>([]);

  const endpoint = mcpServerUrl();
  const clientLabel = t(`byoa.wizard.clients.${client}.label`);

  const refresh = async () => setTokens(await listAgentTokens());

  useEffect(() => {
    refresh();
    const sync = () => refresh();
    window.addEventListener(AGENT_TOKENS_EVENT, sync);
    return () => window.removeEventListener(AGENT_TOKENS_EVENT, sync);
  }, []);

  const instructions = useMemo(
    () => t(`byoa.wizard.step3.instructions.${client}`, { returnObjects: true }) as string[],
    [client, t],
  );

  const snippet = useMemo(
    () =>
      JSON.stringify(
        {
          mcpServers: {
            mynder: {
              url: endpoint,
              headers: { Authorization: "Bearer <din-kode>" },
            },
          },
        },
        null,
        2,
      ),
    [endpoint],
  );

  const handleCreate = async () => {
    setCreating(true);
    try {
      const label = name.trim() || t("byoa.wizard.step2.namePlaceholder");
      const { token } = await createAgentToken(label, expiry);
      setFreshToken(token);
      await refresh();
      onConnected?.();
      toast.success(t("byoa.wizard.step2.created"));
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async (row: AgentTokenRow) => {
    await revokeAgentToken(row.id);
    await refresh();
    toast.info(t("byoa.wizard.step2.revoked", { name: row.name }));
  };

  const formatDate = (v: string | null) =>
    v ? new Date(v).toLocaleDateString("nb-NO", { dateStyle: "medium" }) : null;

  return (
    <div className="mt-6 space-y-4">
      {/* Steg 1 */}
      <StepCard number={1} title={t("byoa.wizard.step1.title")}>
        <div
          role="radiogroup"
          aria-label={t("byoa.wizard.step1.title")}
          className="grid gap-3 sm:grid-cols-3"
        >
          {(["claude", "chatgpt", "other"] as WizardClient[]).map((id) => {
            const Icon = CLIENT_ICON[id];
            const active = client === id;
            return (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setClient(id)}
                className={`rounded-lg border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                  active
                    ? "border-2 border-primary bg-primary/5"
                    : "border border-border hover:bg-muted/50"
                }`}
              >
                <Icon
                  className={`h-4 w-4 ${active ? "text-primary" : "text-muted-foreground"}`}
                  aria-hidden="true"
                />
                <div className="mt-2 text-[13px] font-medium text-foreground">
                  {t(`byoa.wizard.clients.${id}.label`)}
                </div>
                <div className="text-[13px] text-muted-foreground">
                  {t(`byoa.wizard.clients.${id}.hint`)}
                </div>
              </button>
            );
          })}
        </div>
      </StepCard>

      {/* Steg 2 */}
      <StepCard number={2} title={t("byoa.wizard.step2.title")}>
        <p className="text-[13px] text-muted-foreground">{t("byoa.wizard.step2.description")}</p>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Label htmlFor="byoa-code-name" className="text-[13px] text-muted-foreground">
              {t("byoa.wizard.step2.nameLabel")}
            </Label>
            <Input
              id="byoa-code-name"
              className="mt-1 h-9 text-[13px]"
              placeholder={t("byoa.wizard.step2.namePlaceholder")}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="sm:w-56">
            <Label htmlFor="byoa-expiry" className="text-[13px] text-muted-foreground">
              {t("byoa.wizard.step2.expiryLabel")}
            </Label>
            <Select value={expiry} onValueChange={(v) => setExpiry(v as ExpiryChoice)}>
              <SelectTrigger id="byoa-expiry" className="mt-1 h-9 text-[13px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="90">{t("byoa.wizard.step2.expiry90")}</SelectItem>
                <SelectItem value="30">{t("byoa.wizard.step2.expiry30")}</SelectItem>
                <SelectItem value="never">{t("byoa.wizard.step2.expiryNever")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button className="h-9 gap-1.5" onClick={handleCreate} disabled={creating}>
            {creating ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <KeyRound className="h-4 w-4" aria-hidden="true" />
            )}
            {t("byoa.wizard.step2.create")}
          </Button>
        </div>

        {freshToken && (
          <div className="mt-4 space-y-2">
            <div className="flex gap-2 rounded-lg border border-warning/30 bg-warning/10 p-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden="true" />
              <p className="text-[13px] text-foreground">{t("byoa.wizard.step2.warning")}</p>
            </div>
            <div className="flex gap-2">
              <Input
                readOnly
                value={freshToken}
                aria-label={t("byoa.wizard.step2.tokenLabel")}
                onFocus={(e) => e.currentTarget.select()}
                className="h-9 font-mono text-[13px]"
              />
              <CopyButton value={freshToken} label={t("byoa.wizard.step2.copyToken")} />
            </div>
          </div>
        )}

        <div className="mt-5 border-t border-border pt-4">
          <h4 className="text-[13px] font-medium text-foreground">
            {t("byoa.wizard.step2.yourCodes")}
          </h4>
          {tokens.length === 0 ? (
            <p className="mt-2 text-[13px] text-muted-foreground">
              {t("byoa.wizard.step2.noCodes")}
            </p>
          ) : (
            <ul className="mt-2 divide-y divide-border">
              {tokens.map((row) => {
                const active = isActiveToken(row);
                return (
                  <li key={row.id} className="flex items-center gap-3 py-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium text-foreground">{row.name}</p>
                      <p className="text-[13px] text-muted-foreground">
                        {row.last_used_at
                          ? t("byoa.wizard.step2.lastUsed", { date: formatDate(row.last_used_at) })
                          : t("byoa.wizard.step2.neverUsed")}
                        {" · "}
                        {row.expires_at
                          ? t("byoa.wizard.step2.expiresOn", { date: formatDate(row.expires_at) })
                          : t("byoa.wizard.step2.noExpiry")}
                      </p>
                    </div>
                    {active ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-[13px] text-destructive hover:text-destructive"
                        onClick={() => handleRevoke(row)}
                      >
                        {t("byoa.wizard.step2.revoke")}
                      </Button>
                    ) : (
                      <span className="text-[13px] text-muted-foreground">
                        {t("byoa.wizard.step2.inactive")}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </StepCard>

      {/* Steg 3 */}
      <StepCard number={3} title={t("byoa.wizard.step3.title", { client: clientLabel })}>
        <Label htmlFor="byoa-endpoint" className="text-[13px] text-muted-foreground">
          {t("byoa.wizard.step3.addressLabel")}
        </Label>
        <div className="mt-1 flex gap-2">
          <Input
            id="byoa-endpoint"
            readOnly
            value={endpoint}
            onFocus={(e) => e.currentTarget.select()}
            className="h-9 font-mono text-[13px]"
          />
          <CopyButton value={endpoint} label={t("byoa.wizard.step3.copyAddress")} />
        </div>

        <ol className="mt-4 space-y-2">
          {instructions.map((line, i) => (
            <li key={i} className="flex gap-2 text-[13px] text-foreground">
              <span className="text-muted-foreground">{i + 1}.</span>
              <span>{line}</span>
            </li>
          ))}
        </ol>

        {client === "other" && (
          <div className="mt-4">
            <div className="flex items-start gap-2">
              <pre className="flex-1 overflow-x-auto rounded-lg border border-border bg-muted/40 p-3 font-mono text-[13px] text-foreground">
                {snippet}
              </pre>
              <CopyButton value={snippet} label={t("byoa.wizard.step3.copySnippet")} />
            </div>
          </div>
        )}

        <div className="mt-4 flex gap-2 rounded-lg border border-success/30 bg-success/10 p-3">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden="true" />
          <div>
            <p className="text-[13px] font-medium text-foreground">
              {t("byoa.wizard.step3.verifyTitle")}
            </p>
            <p className="mt-0.5 text-[13px] text-muted-foreground">
              {t("byoa.wizard.step3.verifyBody")}
            </p>
          </div>
        </div>
      </StepCard>
    </div>
  );
}
