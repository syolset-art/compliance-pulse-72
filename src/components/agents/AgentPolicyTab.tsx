import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export interface AgentPolicy {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
  source: "standard" | "custom";
}

const STANDARD_POLICIES: AgentPolicy[] = [
  { id: "runtime", title: "Runtime-grenser", description: "Maks antall steg, tidsavbrudd og budsjett for kontekst.", enabled: true, source: "standard" },
  { id: "rbac", title: "Roller og tilgang", description: "Agenten arver brukerens rolle. Privilegerte roller krever godkjenning.", enabled: true, source: "standard" },
  { id: "injection", title: "Beskyttelse mot skjulte instruksjoner", description: "Innhold agenten leser behandles som data, ikke som ordre.", enabled: true, source: "standard" },
  { id: "audit", title: "Logging og sporbarhet", description: "Alle handlinger logges med tidspunkt, bruker og kilde.", enabled: true, source: "standard" },
  { id: "regulation", title: "Regelverkskobling", description: "Kobles til NIS2, GDPR og EU AI Act i vurderingen.", enabled: true, source: "standard" },
];

const storageKey = (agentId: string) => `mynder.agent.policies.${agentId}`;

export function AgentPolicyTab({ agentId }: { agentId: string }) {
  const [policies, setPolicies] = useState<AgentPolicy[]>(STANDARD_POLICIES);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey(agentId));
      if (raw) setPolicies(JSON.parse(raw) as AgentPolicy[]);
      else setPolicies(STANDARD_POLICIES);
    } catch {
      setPolicies(STANDARD_POLICIES);
    }
  }, [agentId]);

  const persist = (next: AgentPolicy[]) => {
    setPolicies(next);
    try {
      localStorage.setItem(storageKey(agentId), JSON.stringify(next));
    } catch {
      /* ignore */
    }
  };

  const toggle = (id: string, enabled: boolean) =>
    persist(policies.map((p) => (p.id === id ? { ...p, enabled } : p)));

  const addPolicy = () => {
    if (!title.trim()) return;
    persist([
      ...policies,
      { id: `custom-${Date.now()}`, title: title.trim(), description: description.trim(), enabled: true, source: "custom" },
    ]);
    setTitle("");
    setDescription("");
    setOpen(false);
    toast.success("Policy lagt til");
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div>
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            Policyer for agenten
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Reglene agenten vurderes mot. Du kan slå av standardregler og legge til egne.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-1.5" /> Ny policy
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Legg til egen policy</DialogTitle>
              <DialogDescription>
                Beskriv regelen med egne ord. Den vises i vurderingen av agenten.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="policy-title">Tittel</Label>
                <Input id="policy-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="F.eks. Ingen utsending av e-post uten godkjenning" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="policy-desc">Beskrivelse</Label>
                <Textarea id="policy-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(false)}>Avbryt</Button>
              <Button onClick={addPolicy} disabled={!title.trim()}>Legg til</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="space-y-2">
        {policies.map((p) => (
          <div key={p.id} className="flex items-start justify-between gap-4 rounded-md border border-border px-3 py-2.5">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{p.title}</span>
                {p.source === "custom" && (
                  <Badge variant="outline" className="text-[10px]">Egen</Badge>
                )}
              </div>
              {p.description && (
                <p className="text-xs text-muted-foreground mt-0.5">{p.description}</p>
              )}
            </div>
            <Switch
              checked={p.enabled}
              onCheckedChange={(v) => toggle(p.id, v)}
              aria-label={`Slå ${p.enabled ? "av" : "på"} ${p.title}`}
            />
          </div>
        ))}
        <p className="text-xs text-muted-foreground pt-1">
          Prototype: policyene dokumenteres her, men håndheves ikke automatisk ennå.
        </p>
      </CardContent>
    </Card>
  );
}
