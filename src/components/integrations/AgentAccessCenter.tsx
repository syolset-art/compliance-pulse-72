import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Bot, MessageSquare, Plus, ScrollText, Sparkles } from "lucide-react";
import { AgentMandateEditor } from "@/components/integrations/AgentMandateEditor";
import {
  AGENT_CLIENT_LABEL,
  mandateSummary,
  readConnectedAgents,
  writeConnectedAgents,
  type ConnectedAgent,
  type Mandate,
} from "@/lib/agentMandate";

export function useConnectedAgents() {
  const [agents, setAgents] = useState<ConnectedAgent[]>(() => readConnectedAgents());
  useEffect(() => {
    const sync = () => setAgents(readConnectedAgents());
    window.addEventListener("mynder:agents-change", sync);
    return () => window.removeEventListener("mynder:agents-change", sync);
  }, []);
  return agents;
}

const CLIENT_ICON = {
  claude: Sparkles,
  chatgpt: MessageSquare,
  other: Bot,
} as const;

/** Agent Access Center – oversikt og styring av tilkoblede agenter. */
export function AgentAccessCenter({ onConnectNew }: { onConnectNew: () => void }) {
  const agents = useConnectedAgents();
  const [manageId, setManageId] = useState<string | null>(null);
  const [revokeId, setRevokeId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Mandate | null>(null);

  const managed = agents.find((a) => a.id === manageId) ?? null;
  const revoking = agents.find((a) => a.id === revokeId) ?? null;

  const openManage = (agent: ConnectedAgent) => {
    setManageId(agent.id);
    setDraft(agent.mandate);
  };

  const saveMandate = () => {
    if (!managed || !draft) return;
    writeConnectedAgents(
      agents.map((a) => (a.id === managed.id ? { ...a, mandate: draft } : a)),
    );
    toast.success("Mandatet er oppdatert", { description: managed.name });
    setManageId(null);
  };

  const confirmRevoke = () => {
    if (!revoking) return;
    writeConnectedAgents(
      agents.map((a) =>
        a.id === revoking.id ? { ...a, status: "revoked" as const } : a,
      ),
    );
    toast.info("Tilgangen er trukket tilbake", {
      description: `${revoking.name} mister tilgangen. Historikken beholdes.`,
    });
    setRevokeId(null);
  };

  return (
    <section className="mt-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">
          Tilkoblede agenter
        </h2>
        <Button variant="outline" size="sm" className="h-8 gap-1.5" onClick={onConnectNew}>
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          Koble til en ny agent
        </Button>
      </div>

      <Card className="mt-3 divide-y">
        {agents.length === 0 && (
          <div className="p-6 text-center">
            <p className="text-[13px] text-muted-foreground">
              Ingen agenter er koblet til ennå.
            </p>
            <Button size="sm" className="mt-3 gap-1.5" onClick={onConnectNew}>
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              Koble til en ny agent
            </Button>
          </div>
        )}

        {agents.map((agent) => {
          const Icon = CLIENT_ICON[agent.client];
          const revoked = agent.status === "revoked";
          return (
            <div
              key={agent.id}
              className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:gap-4"
            >
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                  revoked ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"
                }`}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`text-[13px] font-medium ${revoked ? "text-muted-foreground line-through" : "text-foreground"}`}
                  >
                    {agent.name}
                  </span>
                  <Badge
                    variant="outline"
                    className={`text-[10px] ${revoked ? "text-muted-foreground" : "border-primary/40 text-primary"}`}
                  >
                    {revoked ? "Trukket tilbake" : "Aktiv"}
                  </Badge>
                  {agent.demo && (
                    <Badge variant="outline" className="text-[10px] text-muted-foreground">
                      Demo
                    </Badge>
                  )}
                  {agent.manual && (
                    <Badge variant="outline" className="text-[10px] text-muted-foreground">
                      Manuelt oppsett
                    </Badge>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {revoked ? "Ikke lenger tilgang" : agent.lastUsedLabel} ·{" "}
                  {mandateSummary(agent.mandate)}
                </p>
              </div>

              {!revoked && (
                <div className="flex shrink-0 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8"
                    onClick={() => openManage(agent)}
                  >
                    Administrer
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-destructive hover:text-destructive"
                    onClick={() => setRevokeId(agent.id)}
                  >
                    Trekk tilbake
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </Card>

      <p className="mt-2 flex items-start gap-2 text-xs text-muted-foreground">
        <ScrollText className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        Tilgangen er isolert per organisasjon, alle agenthandlinger logges, og hver kobling kan
        trekkes tilbake separat.
      </p>

      {/* Administrer mandat */}
      <Dialog open={!!managed} onOpenChange={(v) => !v && setManageId(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Mandat for {managed?.name}</DialogTitle>
            <DialogDescription>
              Endre hva {managed ? AGENT_CLIENT_LABEL[managed.client] : "agenten"} får lese, gjøre
              selv og hva du må godkjenne.
            </DialogDescription>
          </DialogHeader>
          {draft && <AgentMandateEditor mandate={draft} onChange={setDraft} idPrefix="manage" />}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setManageId(null)}>
              Avbryt
            </Button>
            <Button onClick={saveMandate}>Lagre mandat</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bekreft tilbaketrekking */}
      <AlertDialog open={!!revoking} onOpenChange={(v) => !v && setRevokeId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Trekke tilbake tilgangen for {revoking?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Agenten mister tilgangen umiddelbart. Loggen over tidligere handlinger beholdes. Du
              kan koble til på nytt senere.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={confirmRevoke}
            >
              Trekk tilbake
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
