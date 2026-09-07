import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Bot,
  Check,
  Copy,
  KeyRound,
  Loader2,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import { mcpServerUrl } from "@/lib/mcpAgentConnections";
import { createAgentToken, type ExpiryChoice } from "@/lib/agentTokens";

export type WizardClient = "claude" | "chatgpt" | "other";

const CLIENT_ICON = {
  claude: Sparkles,
  chatgpt: MessageSquare,
  other: Bot,
} as const;

/** Kopiknapp med tilgjengelig etikett og valgfri forklaring på hover. */
function CopyButton({
  value,
  label,
  tooltip,
}: {
  value: string;
  label: string;
  tooltip?: string;
}) {
  const [copied, setCopied] = useState(false);
  const button = (
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

  if (!tooltip) return button;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent side="top">
        <p className="max-w-xs text-[13px]">{tooltip}</p>
      </TooltipContent>
    </Tooltip>
  );
}

/**
 * BYOA-veiviser som dialog: to trinn (velg klient, konfigurer kobling og kode).
 */
export function ByoaConnectWizard({
  open,
  onOpenChange,
  onConnected,
  initialClient = "claude",
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onConnected?: () => void;
  initialClient?: WizardClient;
}) {
  const { t } = useTranslation();
  const [step, setStep] = useState(1);
  const [client, setClient] = useState<WizardClient>(initialClient);
  const [creating, setCreating] = useState(false);
  const [freshToken, setFreshToken] = useState<string | null>(null);
  const [expiry, setExpiry] = useState<ExpiryChoice>("90");

  const endpoint = mcpServerUrl();
  const clientLabel = t(`byoa.wizard.clients.${client}.label`);
  const connectionName = t("byoa.wizard.setup.connectionName");

  useEffect(() => {
    if (open) {
      setStep(1);
      setFreshToken(null);
      setClient(initialClient);
      setExpiry("90");
    }
  }, [open, initialClient]);

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
      const { token } = await createAgentToken(connectionName, expiry);
      setFreshToken(token);
      onConnected?.();
      toast.success(t("byoa.wizard.step2.created"));
    } finally {
      setCreating(false);
    }
  };

  const totalSteps = 2;
  const stepTitle = step === 1 ? t("byoa.wizard.step1.title") : t("byoa.wizard.config.title");
  const stepDescription = step === 2 ? t("byoa.wizard.config.description") : undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-xl overflow-y-auto">
        <DialogHeader className="space-y-3 pb-2">
          {/* Stepper */}
          <div className="flex items-center gap-3" aria-hidden="true">
            <div className="flex items-center gap-2">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                  step > 1
                    ? "bg-primary text-primary-foreground"
                    : "bg-primary text-primary-foreground ring-2 ring-primary/20"
                }`}
              >
                {step > 1 ? <Check className="h-4 w-4" /> : 1}
              </div>
              <span
                className={`text-[13px] font-medium ${
                  step === 1 ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {t("byoa.wizard.step1.stepLabel")}
              </span>
            </div>
            <div className="h-px flex-1 bg-border" />
            <div className="flex items-center gap-2">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                  step === 2
                    ? "bg-primary text-primary-foreground ring-2 ring-primary/20"
                    : "border border-border bg-background text-muted-foreground"
                }`}
              >
                2
              </div>
              <span
                className={`text-[13px] font-medium ${
                  step === 2 ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {t("byoa.wizard.config.stepLabel")}
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-[13px] text-muted-foreground">
              {t("byoa.wizard.stepOf", { current: step, total: totalSteps })}
            </p>
            <DialogTitle className="text-[17px]">{stepTitle}</DialogTitle>
            {stepDescription && (
              <p className="text-[13px] text-muted-foreground">{stepDescription}</p>
            )}
          </div>
        </DialogHeader>

        {step === 1 && (
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
                  className={`rounded-xl border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
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
        )}

        {step === 2 && (
          <div className="space-y-6">
            {/* Connection Details */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                <span className="block h-3 w-0.5 rounded-full bg-muted-foreground/40" />
                {t("byoa.wizard.config.connectionGroup")}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="byoa-conn-name"
                    className="text-[13px] font-medium text-foreground"
                  >
                    {t("byoa.wizard.setup.nameLabel")}
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="byoa-conn-name"
                      readOnly
                      value={connectionName}
                      onFocus={(e) => e.currentTarget.select()}
                      className="h-9 text-[13px]"
                    />
                    <CopyButton
                      value={connectionName}
                      label={t("byoa.wizard.setup.copyName")}
                      tooltip={t("byoa.wizard.setup.copyNameTooltip")}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="byoa-endpoint"
                    className="text-[13px] font-medium text-foreground"
                  >
                    {t("byoa.wizard.address.label")}
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="byoa-endpoint"
                      readOnly
                      value={endpoint}
                      onFocus={(e) => e.currentTarget.select()}
                      className="h-9 font-mono text-[13px]"
                    />
                    <CopyButton
                      value={endpoint}
                      label={t("byoa.wizard.address.copy")}
                      tooltip={t("byoa.wizard.address.copyTooltip")}
                    />
                  </div>
                </div>
              </div>

              {client === "other" && (
                <div className="flex items-start gap-2">
                  <pre className="flex-1 overflow-x-auto rounded-lg border border-border bg-muted/40 p-3 font-mono text-[13px] text-foreground">
                    {snippet}
                  </pre>
                  <CopyButton
                    value={snippet}
                    label={t("byoa.wizard.step3.copySnippet")}
                    tooltip={t("byoa.wizard.step3.copySnippetTooltip")}
                  />
                </div>
              )}
            </div>

            {/* Security & Access */}
            <div className="space-y-3 rounded-xl border border-border bg-muted/30 p-4">
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                <span className="block h-3 w-0.5 rounded-full bg-primary" />
                {t("byoa.wizard.config.securityGroup")}
              </div>

              {!freshToken ? (
                <div className="space-y-3">
                  <p className="text-[13px] text-muted-foreground">
                    {t("byoa.wizard.config.securityHint")}
                  </p>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="byoa-expiry"
                        className="text-[13px] font-medium text-foreground"
                      >
                        {t("byoa.wizard.step2.expiryLabel")}
                      </Label>
                      <Select
                        value={expiry}
                        onValueChange={(v) => setExpiry(v as ExpiryChoice)}
                      >
                        <SelectTrigger id="byoa-expiry" className="h-9 text-[13px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="never">
                            {t("byoa.wizard.step2.expiryNever")}
                          </SelectItem>
                          <SelectItem value="30">
                            {t("byoa.wizard.step2.expiry30")}
                          </SelectItem>
                          <SelectItem value="90">
                            {t("byoa.wizard.step2.expiry90")}
                          </SelectItem>
                          <SelectItem value="365">
                            {t("byoa.wizard.step2.expiry365")}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-end">
                      <Button
                        className="h-9 w-full gap-1.5"
                        onClick={handleCreate}
                        disabled={creating}
                      >
                        {creating ? (
                          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                        ) : (
                          <KeyRound className="h-4 w-4" aria-hidden="true" />
                        )}
                        {t("byoa.wizard.step2.create")}
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-[13px] text-foreground">
                    {t("byoa.wizard.step2.finish")}
                  </p>
                  <div className="flex gap-2">
                    <Input
                      readOnly
                      value={freshToken}
                      aria-label={t("byoa.wizard.step2.tokenLabel")}
                      onFocus={(e) => e.currentTarget.select()}
                      className="h-9 font-mono text-[13px]"
                    />
                    <CopyButton
                      value={freshToken}
                      label={t("byoa.wizard.step2.copyToken")}
                    />
                  </div>
                  <p className="text-[13px] text-muted-foreground">
                    {t("byoa.wizard.step2.sameAccess")}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        <DialogFooter className="mt-2 sm:justify-between">
          <Button
            variant="ghost"
            className="h-9"
            onClick={() => (step === 1 ? onOpenChange(false) : setStep(step - 1))}
          >
            {step === 1
              ? t("common.cancel", "Avbryt")
              : t("byoa.wizard.back", { defaultValue: "Tilbake" })}
          </Button>
          {step < totalSteps ? (
            <Button className="h-9" onClick={() => setStep(step + 1)}>
              {t("byoa.wizard.next", { defaultValue: "Neste" })}
            </Button>
          ) : (
            <Button className="h-9" onClick={() => onOpenChange(false)}>
              {t("byoa.wizard.done", { defaultValue: "Ferdig" })}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
