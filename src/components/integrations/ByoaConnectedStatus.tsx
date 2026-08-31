import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Bot, CheckCircle2, History, Plus } from "lucide-react";
import { TrustBoundaryStrip } from "@/components/integrations/TrustBoundaryStrip";
import { revokeAgentToken, type AgentTokenRow } from "@/lib/agentTokens";

/** «Dine agenter»: kompakt liste. Detaljer og tilgang ligger bak et panel. */
export function ByoaConnectedStatus({
  tokens,
  onConnectAnother,
  onChanged,
}: {
  tokens: AgentTokenRow[];
  onConnectAnother: () => void;
  onChanged: () => void;
}) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<AgentTokenRow | null>(null);
  const [confirmRevoke, setConfirmRevoke] = useState(false);

  const fmt = (v: string | null) =>
    v ? new Date(v).toLocaleDateString("nb-NO", { dateStyle: "medium" }) : null;

  const facts = (row: AgentTokenRow) => [
    { label: t("byoa.connected.client"), value: row.name ?? "—" },
    {
      label: t("byoa.connected.lastUsed"),
      value: fmt(row.last_used_at ?? null) ?? t("byoa.connected.notUsedYet"),
    },
    {
      label: t("byoa.connected.expires"),
      value: fmt(row.expires_at ?? null) ?? t("byoa.wizard.step2.noExpiry"),
    },
  ];

  const revokeSelected = async () => {
    if (!selected) return;
    await revokeAgentToken(selected.id);
    setConfirmRevoke(false);
    setSelected(null);
    onChanged();
    toast.info(t("byoa.connected.revokedToast"));
  };

  return (
    <>
      <section className="mt-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              {t("byoa.agents.title", "Dine agenter")}
            </h2>
            <p className="mt-0.5 text-[13px] text-muted-foreground">
              {t("byoa.agents.count", { count: tokens.length, defaultValue: "{{count}} aktiv tilkobling" })}
            </p>
          </div>
          <Button variant="outline" className="h-9 gap-2" onClick={onConnectAnother}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            {t("byoa.connected.connectAnother")}
          </Button>
        </div>

        <Card className="mt-3 divide-y divide-border p-0">
          {tokens.map((row) => (
            <div key={row.id} className="flex items-center gap-3 p-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Bot className="h-4 w-4" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-medium text-foreground">{row.name ?? "—"}</p>
                  <Badge
                    variant="outline"
                    className="border-success/30 bg-success/15 text-[11px] text-success"
                  >
                    <CheckCircle2 className="mr-1 h-3 w-3" aria-hidden="true" />
                    {t("byoa.connected.active")}
                  </Badge>
                </div>
                <p className="truncate text-[12px] text-muted-foreground">
                  {t("byoa.connected.lastUsed")}:{" "}
                  {fmt(row.last_used_at ?? null) ?? t("byoa.connected.notUsedYet")}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 shrink-0 text-[13px]"
                onClick={() => setSelected(row)}
              >
                {t("byoa.agents.details", "Detaljer")}
              </Button>
            </div>
          ))}
        </Card>
      </section>

      <Sheet open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>{selected?.name ?? t("byoa.agents.title", "Dine agenter")}</SheetTitle>
            <SheetDescription>{t("byoa.connected.subtitle")}</SheetDescription>
          </SheetHeader>

          {selected && (
            <div className="mt-6 space-y-6">
              <dl className="grid gap-3 sm:grid-cols-2">
                {facts(selected).map((f) => (
                  <div key={f.label} className="rounded-lg bg-muted p-3">
                    <dt className="text-[12px] text-muted-foreground">{f.label}</dt>
                    <dd className="mt-0.5 truncate text-[13px] font-medium text-foreground">
                      {f.value}
                    </dd>
                  </div>
                ))}
              </dl>

              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  {t("byoa.hero.seeAccess")}
                </h3>
                <div className="mt-3">
                  <TrustBoundaryStrip activeCount={1} discoveredTotal={0} />
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-foreground">{t("byoa.activity.title")}</h3>
                <Card className="mt-3 flex items-center gap-2 p-4">
                  <History className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                  <p className="text-[13px] text-muted-foreground">{t("byoa.activity.empty")}</p>
                </Card>
              </div>

              <Button
                variant="ghost"
                className="h-9 text-destructive hover:text-destructive"
                onClick={() => setConfirmRevoke(true)}
              >
                {t("byoa.connected.revoke")}
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <AlertDialog open={confirmRevoke} onOpenChange={setConfirmRevoke}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("byoa.connected.revokeTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("byoa.connected.revokeBody")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel", "Avbryt")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={revokeSelected}
            >
              {t("byoa.connected.revoke")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
