import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AgentsPageShell } from "@/components/agents/AgentsPageShell";
import { CONTRACT_TEMPLATES } from "@/pages/agents/AgentContracts";
import { AgentDomain, DOMAINS, addAgent, domainLabel } from "@/lib/agentMacf";
import { cn } from "@/lib/utils";

const STEPS = ["Jobben", "Arbeidskontrakt", "Eier og data", "Kontrollpunkter"];

export default function AgentBuilder() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const template = useMemo(
    () => CONTRACT_TEMPLATES.find((t) => t.id === params.get("template")),
    [params]
  );

  const [step, setStep] = useState(0);
  const [name, setName] = useState(template?.name ?? "");
  const [domain, setDomain] = useState<AgentDomain>(template?.domain ?? "finance");
  const [purpose, setPurpose] = useState(template?.summary ?? "");
  const [steps, setSteps] = useState((template ? [template.summary] : []).join("\n"));
  const [allowed, setAllowed] = useState((template?.allowed ?? []).join("\n"));
  const [approvals, setApprovals] = useState((template?.approvals ?? []).join("\n"));
  const [ownerName, setOwnerName] = useState("");
  const [ownerTeam, setOwnerTeam] = useState("");
  const [sensitive, setSensitive] = useState(false);
  const [logging, setLogging] = useState(true);

  const lines = (v: string) => v.split("\n").map((s) => s.trim()).filter(Boolean);

  const canNext =
    step === 0 ? name.trim().length > 1 && purpose.trim().length > 3 : true;

  const finish = () => {
    addAgent({
      name: name.trim(),
      subtitle: `${domainLabel(domain)} · ${purpose.trim().slice(0, 60)}`,
      kind: "mynder",
      provider: "Mynder",
      owner_team: ownerTeam.trim() || domainLabel(domain),
      owner_name: ownerName.trim() || undefined,
      domain,
      lifecycle: "draft",
      sensitive_data: sensitive,
      status: "pending",
      macf_level: "not_assessed",
      trust_score: 50,
      purpose: purpose.trim(),
      audit_logging: logging,
      contract: {
        steps: lines(steps),
        allowed: lines(allowed),
        approvals: lines(approvals),
        version: 1,
        confirmed: false,
      },
    });
    toast.success("Agenten er opprettet som utkast");
    navigate("/agents/all");
  };

  return (
    <AgentsPageShell
      title="Ny agent"
      description="Fire steg: jobben, arbeidskontrakten, eier og data, og kontrollpunktene."
    >
      <div className="flex flex-wrap gap-2">
        {STEPS.map((s, i) => (
          <Badge
            key={s}
            variant="outline"
            className={cn(
              "text-[11px]",
              i === step && "bg-primary/10 text-primary border-primary/30",
              i < step && "text-muted-foreground"
            )}
          >
            {i + 1}. {s}
          </Badge>
        ))}
      </div>

      <Card className="p-5 space-y-4">
        {step === 0 && (
          <>
            <div className="space-y-1.5">
              <Label htmlFor="agent-name">Hva skal agenten hete?</Label>
              <Input id="agent-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="F.eks. Fakturakontroll" />
            </div>
            <div className="space-y-1.5">
              <Label>Fagområde</Label>
              <Select value={domain} onValueChange={(v) => setDomain(v as AgentDomain)}>
                <SelectTrigger className="w-full sm:w-[260px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DOMAINS.map((d) => (
                    <SelectItem key={d} value={d}>{domainLabel(d)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="agent-purpose">Hvilken jobb skal den gjøre?</Label>
              <Textarea id="agent-purpose" value={purpose} onChange={(e) => setPurpose(e.target.value)} rows={3} />
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <p className="text-xs text-muted-foreground">
              Forslag fra Lara. Ett punkt per linje — rediger fritt før du bekrefter.
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="steps">Steg for steg</Label>
              <Textarea id="steps" value={steps} onChange={(e) => setSteps(e.target.value)} rows={4} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="allowed">Dette kan agenten gjøre selv</Label>
              <Textarea id="allowed" value={allowed} onChange={(e) => setAllowed(e.target.value)} rows={3} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="approvals">Dette krever godkjenning</Label>
              <Textarea id="approvals" value={approvals} onChange={(e) => setApprovals(e.target.value)} rows={3} />
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div className="space-y-1.5">
              <Label htmlFor="owner">Hvem eier agenten?</Label>
              <Input id="owner" value={ownerName} onChange={(e) => setOwnerName(e.target.value)} placeholder="Navn på ansvarlig person" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="team">Avdeling</Label>
              <Input id="team" value={ownerTeam} onChange={(e) => setOwnerTeam(e.target.value)} placeholder="F.eks. Økonomi" />
            </div>
            <div className="flex items-center justify-between gap-4 rounded-lg border border-border p-3">
              <div>
                <Label htmlFor="sensitive" className="text-sm">Behandler personopplysninger</Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Slås dette på, tas agenten med i personvernarbeidet (RoPA) i Core.
                </p>
              </div>
              <Switch id="sensitive" checked={sensitive} onCheckedChange={setSensitive} />
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <div className="flex items-center justify-between gap-4 rounded-lg border border-border p-3">
              <div>
                <Label htmlFor="logging" className="text-sm">Logg all aktivitet</Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Alt agenten gjør havner i aktivitetsloggen.
                </p>
              </div>
              <Switch id="logging" checked={logging} onCheckedChange={setLogging} />
            </div>
            <div className="rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground space-y-1">
              <p><strong className="text-foreground">Godkjenner:</strong> {ownerName || "ikke satt"}</p>
              <p><strong className="text-foreground">Krever godkjenning:</strong> {lines(approvals).join(", ") || "ikke satt"}</p>
              <p>
                Prototype: agenten opprettes som utkast og settes ikke i arbeid. Fullmakter og
                kontrollpunkter håndheves ikke automatisk.
              </p>
            </div>
          </>
        )}

        <div className="flex justify-between pt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => (step === 0 ? navigate("/agents") : setStep(step - 1))}
          >
            {step === 0 ? "Avbryt" : "Tilbake"}
          </Button>
          {step < STEPS.length - 1 ? (
            <Button size="sm" disabled={!canNext} onClick={() => setStep(step + 1)}>
              Neste
            </Button>
          ) : (
            <Button size="sm" onClick={finish}>Opprett agenten</Button>
          )}
        </div>
      </Card>
    </AgentsPageShell>
  );
}
