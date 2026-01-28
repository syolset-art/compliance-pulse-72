import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Mail, Copy, Check, Info, Building2, User, Send } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { PerformerRole } from "./PerformerSelectStep";

interface InvitePerformerFormProps {
  integrationName: string;
  performerRole: PerformerRole;
  onInviteSent: (data: InviteData) => void;
  onCancel: () => void;
}

export interface InviteData {
  email: string;
  name: string;
  organizationName: string;
  role: PerformerRole;
}

const roleLabels: Record<PerformerRole, string> = {
  owner: "Eier",
  it_provider: "IT-leverandør",
  accountant: "Regnskapsfører",
  internal_it: "Intern IT-ansvarlig",
};

export function InvitePerformerForm({
  integrationName,
  performerRole,
  onInviteSent,
  onCancel,
}: InvitePerformerFormProps) {
  const [formData, setFormData] = useState({
    email: "",
    name: "",
    organizationName: "",
  });
  const [copied, setCopied] = useState(false);

  const roleLabel = roleLabels[performerRole];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.name) {
      toast.error("Vennligst fyll ut e-post og navn");
      return;
    }
    onInviteSent({
      ...formData,
      role: performerRole,
    });
  };

  const generateInviteText = () => {
    return `Hei ${formData.name || "[Navn]"},

Vi bruker Mynder for compliance-oversikt og ønsker å koble til ${integrationName} for automatisk import av eiendeler.

For å sette opp koblingen trenger vi en API-nøkkel med lesetilgang.

Instruksjoner:
1. Logg inn på ${integrationName} Management Console
2. Gå til Innstillinger → API-tilgang
3. Opprett ny API-nøkkel med lesetilgang
4. Klikk på invitasjonslenken nedenfor for å legge inn nøkkelen

Takk for hjelpen!`;
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generateInviteText());
      setCopied(true);
      toast.success("Tekst kopiert til utklippstavlen");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Kunne ikke kopiere tekst");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
        <div className="p-2 rounded-lg bg-primary/20">
          {performerRole === "accountant" ? (
            <Building2 className="h-5 w-5 text-primary" />
          ) : (
            <User className="h-5 w-5 text-primary" />
          )}
        </div>
        <div>
          <p className="font-medium">Inviter {roleLabel.toLowerCase()}</p>
          <p className="text-xs text-muted-foreground">
            Send invitasjon for å sette opp {integrationName}
          </p>
        </div>
      </div>

      {performerRole !== "internal_it" && (
        <div className="space-y-2">
          <Label htmlFor="organizationName">Firmanavn</Label>
          <Input
            id="organizationName"
            value={formData.organizationName}
            onChange={(e) => setFormData((prev) => ({ ...prev, organizationName: e.target.value }))}
            placeholder={performerRole === "accountant" ? "F.eks. Regnskap AS" : "F.eks. IT-Partner AS"}
          />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="email">E-postadresse *</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
          placeholder="kontakt@firma.no"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">Kontaktperson (navn) *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
          placeholder="Ola Nordmann"
          required
        />
      </div>

      <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 space-y-3">
        <div className="flex items-start gap-2">
          <Info className="h-4 w-4 text-blue-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-blue-300">Hva skjer videre?</p>
            <ol className="text-xs text-blue-300/80 mt-2 space-y-1 list-decimal list-inside">
              <li>Vi sender en e-post med invitasjonslenke</li>
              <li>{roleLabel} logger inn og legger til API-nøkkel</li>
              <li>Du får varsel når integrasjonen er klar</li>
              <li>Alt dokumenteres for revisjon</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Preview / Copy section */}
      <div className="border border-border rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-3 py-2 bg-muted/50 border-b border-border">
          <span className="text-xs font-medium text-muted-foreground">Forhåndsvisning av e-post</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={copyToClipboard}
            className="h-7 text-xs"
          >
            {copied ? (
              <>
                <Check className="h-3 w-3 mr-1" />
                Kopiert
              </>
            ) : (
              <>
                <Copy className="h-3 w-3 mr-1" />
                Kopier
              </>
            )}
          </Button>
        </div>
        <div className="p-3 max-h-[120px] overflow-y-auto">
          <p className="text-xs text-muted-foreground whitespace-pre-wrap font-mono">
            {generateInviteText()}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Avbryt
        </Button>
        <Button type="submit" disabled={!formData.email || !formData.name}>
          <Send className="h-4 w-4 mr-2" />
          Send invitasjon
        </Button>
      </div>
    </form>
  );
}
