import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

/** «Dine agenter»: stram tabell. Detaljer og tilgang ligger bak et panel. */
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
      <section className="mt-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              {t("byoa.agents.title", "Dine agenter")}
            </h2>
            <p className="mt-0.5 text-[13px] text-muted-foreground">
              {tokens.length > 0
                ? t("byoa.agents.count", {
                    count: tokens.length,
                    defaultValue: "{{count}} aktiv tilkobling",
                  })
                : t("byoa.agents.emptyBody")}
            </p>
          </div>
          <Button
            variant={tokens.length > 0 ? "outline" : "default"}
            className="h-9 gap-2"
            onClick={onConnectAnother}
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            {tokens.length > 0 ? t("byoa.connected.connectAnother") : t("byoa.hero.connect")}
          </Button>
        </div>

        {tokens.length === 0 ? (
          <Card className="mt-3 flex items-center gap-3 p-6">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <Bot className="h-4 w-4" aria-hidden="true" />
            </div>
            <p className="text-[13px] text-muted-foreground">{t("byoa.agents.emptyTitle")}</p>
          </Card>
        ) : (
          <Card className="mt-3 overflow-hidden p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-[12px]">{t("byoa.agents.colAgent")}</TableHead>
                  <TableHead className="text-[12px]">{t("byoa.agents.colStatus")}</TableHead>
                  <TableHead className="hidden text-[12px] sm:table-cell">
                    {t("byoa.connected.lastUsed")}
                  </TableHead>
                  <TableHead className="hidden text-[12px] md:table-cell">
                    {t("byoa.connected.expires")}
                  </TableHead>
                  <TableHead className="w-[1%]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {tokens.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="text-[13px] font-medium text-foreground">
                      <div className="flex items-center gap-2">
                        <Bot className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                        <span className="truncate">{row.name ?? "—"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="border-success/30 bg-success/15 text-[11px] text-success"
                      >
                        <CheckCircle2 className="mr-1 h-3 w-3" aria-hidden="true" />
                        {t("byoa.connected.active")}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden text-[13px] text-muted-foreground sm:table-cell">
                      {fmt(row.last_used_at ?? null) ?? t("byoa.connected.notUsedYet")}
                    </TableCell>
                    <TableCell className="hidden text-[13px] text-muted-foreground md:table-cell">
                      {fmt(row.expires_at ?? null) ?? t("byoa.wizard.step2.noExpiry")}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-[13px]"
                        onClick={() => setSelected(row)}
                      >
                        {t("byoa.agents.details", "Detaljer")}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
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
