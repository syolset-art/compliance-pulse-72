import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { addAgent, AgentKind, MacfLevel } from "@/lib/agentMacf";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onCreated?: () => void;
}

export function RegisterAgentDialog({ open, onOpenChange, onCreated }: Props) {
  const [name, setName] = useState("");
  const [provider, setProvider] = useState("");
  const [team, setTeam] = useState("");
  const [purpose, setPurpose] = useState("");
  const [kind, setKind] = useState<AgentKind>("byoa");
  const [macfTarget, setMacfTarget] = useState<MacfLevel>("L1");

  const reset = () => {
    setName(""); setProvider(""); setTeam(""); setPurpose("");
    setKind("byoa"); setMacfTarget("L1");
  };

  const submit = () => {
    if (!name.trim()) {
      toast.error("Navn er påkrevd");
      return;
    }
    addAgent({
      name: name.trim(),
      subtitle: `${provider || "Ukjent leverandør"} · ${team || "Ukjent team"}`,
      kind,
      provider: provider.trim() || "Ukjent",
      owner_team: team.trim() || "Ukjent",
      status: kind === "byoa" ? "active" : "pending",
      macf_level: "not_assessed",
      trust_score: 0,
      purpose: purpose.trim() || undefined,
      data_scope: [],
      tools: [],
      audit_logging: kind === "mynder",
      rbac_roles: [],
    });
    toast.success("Agent registrert");
    reset();
    onOpenChange(false);
    onCreated?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Registrer agent</DialogTitle>
          <DialogDescription>
            Legg til en AI-agent i Trust Profile-registeret. Lara hjelper med MACF-vurdering senere.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="kind">Type</Label>
              <Select value={kind} onValueChange={(v) => setKind(v as AgentKind)}>
                <SelectTrigger id="kind"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="mynder">Mynder (Lara-flyt)</SelectItem>
                  <SelectItem value="byoa">BYOA (Bring your own agent)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="macf">MACF-mål</Label>
              <Select value={macfTarget} onValueChange={(v) => setMacfTarget(v as MacfLevel)}>
                <SelectTrigger id="macf"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="L1">L1 — Grunnleggende</SelectItem>
                  <SelectItem value="L2">L2 — Forsterket</SelectItem>
                  <SelectItem value="L3">L3 — Høy autonomi</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="name">Navn</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="f.eks. Copilot for M365" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="provider">Leverandør</Label>
              <Input id="provider" value={provider} onChange={(e) => setProvider(e.target.value)} placeholder="Microsoft" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="team">Eier-team</Label>
              <Input id="team" value={team} onChange={(e) => setTeam(e.target.value)} placeholder="IT-avdelingen" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="purpose">Formål</Label>
            <Textarea id="purpose" value={purpose} onChange={(e) => setPurpose(e.target.value)} rows={3} placeholder="Kort beskrivelse av hva agenten gjør" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Avbryt</Button>
          <Button onClick={submit}>Registrer agent</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
