import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
import { CheckCircle2, History, Plus, ShieldCheck } from "lucide-react";
import { TrustBoundaryStrip } from "@/components/integrations/TrustBoundaryStrip";
import { revokeAgentToken, type AgentTokenRow } from "@/lib/agentTokens";

/** Statuskort når minst én kode er aktiv, med ærlig tom aktivitetsliste. */
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
  const [showBoundary, setShowBoundary] = useState(false);
  const [confirmRevoke, setConfirmRevoke] = useState(false);

  const newest = tokens[0];
  const fmt = (v: string | null) =>
    v ? new Date(v).toLocaleDateString("nb-NO", { dateStyle: "medium" }) : null;

  const facts = [
    { label: t("byoa.connected.client"), value: newest?.name ?? "—" },
    {
      label: t("byoa.connected.lastUsed"),
      value: fmt(newest?.last_used_at ?? null) ?? t("byoa.connected.notUsedYet"),
    },
    {
      label: t("byoa.connected.expires"),
      value: fmt(newest?.expires_at ?? null) ?? t("byoa.wizard.step2.noExpiry"),
    },
  ];

  const revokeAll = async () => {
    await Promise.all(tokens.map((row) => revokeAgentToken(row.id)));
    setConfirmRevoke(false);
    onChanged();
    toast.info(t("byoa.connected.revokedToast"));
  };

  return (
    <>
      <Card className="mt-6 p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-foreground">
                {t("byoa.connected.title")}
              </h2>
              <Badge
                variant="outline"
                className="border-success/30 bg-success/15 text-[13px] text-success"
              >
                <CheckCircle2 className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
                {t("byoa.connected.active")}
              </Badge>
            </div>
            <p className="mt-1 max-w-xl text-[13px] text-muted-foreground">
              {t("byoa.connected.subtitle")}
            </p>
          </div>
        </div>

        <dl className="mt-5 grid gap-3 sm:grid-cols-3">
          {facts.map((f) => (
            <div key={f.label} className="rounded-lg bg-muted p-3">
              <dt className="text-[13px] text-muted-foreground">{f.label}</dt>
              <dd className="mt-0.5 truncate text-[13px] font-medium text-foreground">{f.value}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-5 flex flex-wrap gap-3">
          <Button className="h-9 gap-2" onClick={onConnectAnother}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            {t("byoa.connected.connectAnother")}
          </Button>
          <Button variant="outline" className="h-9 gap-2" onClick={() => setShowBoundary(true)}>
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            {t("byoa.hero.seeAccess")}
          </Button>
          <Button
            variant="ghost"
            className="h-9 text-destructive hover:text-destructive"
            onClick={() => setConfirmRevoke(true)}
          >
            {t("byoa.connected.revoke")}
          </Button>
        </div>
      </Card>

      <section className="mt-6">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-foreground">
            {t("byoa.activity.title")}
          </h3>
          <Button variant="ghost" size="sm" className="h-8 text-[13px]" disabled>
            {t("byoa.activity.seeAll")}
          </Button>
        </div>
        <Card className="mt-3 flex items-center gap-2 p-6">
          <History className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <p className="text-[13px] text-muted-foreground">{t("byoa.activity.empty")}</p>
        </Card>
      </section>

      <Dialog open={showBoundary} onOpenChange={setShowBoundary}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("byoa.hero.seeAccess")}</DialogTitle>
          </DialogHeader>
          <TrustBoundaryStrip activeCount={tokens.length} discoveredTotal={0} />
        </DialogContent>
      </Dialog>

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
              onClick={revokeAll}
            >
              {t("byoa.connected.revoke")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
