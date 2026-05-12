import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Sparkles,
  Plus,
  Pencil,
  CheckSquare,
  Shield,
  Tag,
  X,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PARTNER_SERVICES, type PartnerService } from "@/lib/serviceCatalog";
import { MSPLaraServiceWizard } from "./MSPLaraServiceWizard";
import { MSPLaraServiceSuggestions } from "./MSPLaraServiceSuggestions";

export function MSPServiceCatalogTab() {
  // Demo: start tom så Lara-flyten vises første gang
  const [services, setServices] = useState<PartnerService[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardDone, setWizardDone] = useState(false);
  const [suggestions, setSuggestions] = useState<PartnerService[] | null>(null);

  // Auto-åpne veiviser første gang katalogen er tom
  useEffect(() => {
    if (services.length === 0 && !wizardDone && !suggestions) {
      setWizardOpen(true);
    }
  }, [services.length, wizardDone, suggestions]);

  const addService = (s: PartnerService) => {
    setServices((prev) => [...prev, s]);
    setAdding(false);
  };

  const handleWizardComplete = (sug: PartnerService[]) => {
    setSuggestions(sug);
    setWizardDone(true);
  };

  const handleAddSuggestions = (chosen: PartnerService[]) => {
    setServices((prev) => [...prev, ...chosen]);
    setSuggestions(null);
  };

  const seedDemo = () => {
    setServices(PARTNER_SERVICES);
    setWizardDone(true);
    setSuggestions(null);
  };

  const showEmptyHero = services.length === 0 && !suggestions;

  return (
    <div className="space-y-3">
      {/* Header / hero */}
      {showEmptyHero ? (
        <Card className="p-6 border-primary/20 bg-primary/5">
          <div className="flex items-start gap-4">
            <div className="h-11 w-11 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0 space-y-3">
              <div>
                <p className="text-base font-semibold text-foreground">
                  La Lara sette opp tjenestekatalogen din
                </p>
                <p className="text-[13px] text-muted-foreground mt-1">
                  Svar på fire korte spørsmål om hva dere leverer, så foreslår Lara en
                  skreddersydd tjenestepakke. Du kan velge, tilpasse eller lage egne tjenester
                  etterpå.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={() => setWizardOpen(true)} className="gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  Kom i gang med Lara
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setAdding(true)}>
                  Lag egen tjeneste
                </Button>
                <Button size="sm" variant="ghost" onClick={seedDemo}>
                  Bruk demo-katalog
                </Button>
              </div>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="p-4 border-primary/20 bg-primary/5">
          <div className="flex items-start gap-3">
            <div className="h-9 w-9 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">Din tjenestekatalog</p>
              <p className="text-[13px] text-muted-foreground mt-0.5">
                Mynder leverer regelverkene. Du legger inn dine egne tjenester her, og Lara viser
                hvordan de treffer kontrollpunkter på tvers av ISO 27001, NIS2, AI Act m.fl.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                size="sm"
                variant="outline"
                className="h-8 gap-1.5"
                onClick={() => setWizardOpen(true)}
              >
                <Sparkles className="h-3.5 w-3.5" />
                Lara: foreslå flere
              </Button>
              <Button size="sm" className="h-8 gap-1.5" onClick={() => setAdding(true)}>
                <Plus className="h-3.5 w-3.5" />
                Ny tjeneste
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Lara-forslag */}
      {suggestions && (
        <MSPLaraServiceSuggestions
          suggestions={suggestions}
          onAdd={handleAddSuggestions}
          onDismiss={() => setSuggestions(null)}
        />
      )}

      {adding && <ServiceForm onCancel={() => setAdding(false)} onSave={addService} />}

      {services.map((s) => {
        const totalControls = s.frameworkMappings.reduce(
          (sum, m) => sum + m.controlIds.length,
          0,
        );
        const isEditing = editing === s.id;
        return (
          <Card key={s.id} className="p-4 hover:border-primary/30 transition-colors">
            {isEditing ? (
              <ServiceForm
                initial={s}
                onCancel={() => setEditing(null)}
                onSave={(updated) => {
                  setServices((prev) => prev.map((x) => (x.id === s.id ? updated : x)));
                  setEditing(null);
                }}
              />
            ) : (
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Shield className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-foreground">{s.name}</span>
                    <Badge variant="outline" className="text-[10px] gap-1">
                      <CheckSquare className="h-3 w-3" />
                      {s.defaultChecklist.length} sjekkpunkter
                    </Badge>
                  </div>
                  <p className="text-[13px] text-muted-foreground leading-snug">{s.description}</p>

                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                    {s.frameworkMappings.map((m) => (
                      <Badge
                        key={m.frameworkId}
                        variant="outline"
                        className="text-[10px] bg-primary/5 text-primary border-primary/30"
                      >
                        {m.frameworkLabel} · {m.controlIds.length} kontroller
                      </Badge>
                    ))}
                    {totalControls === 0 && (
                      <span className="text-[11px] text-muted-foreground">
                        Ingen rammeverk-kobling ennå
                      </span>
                    )}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 text-xs gap-1.5 shrink-0"
                  onClick={() => setEditing(s.id)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Rediger
                </Button>
              </div>
            )}
          </Card>
        );
      })}

      <MSPLaraServiceWizard
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        onComplete={handleWizardComplete}
        onSkip={() => setWizardDone(true)}
      />
    </div>
  );
}

function ServiceForm({
  initial,
  onCancel,
  onSave,
}: {
  initial?: PartnerService;
  onCancel: () => void;
  onSave: (s: PartnerService) => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [checklist, setChecklist] = useState((initial?.defaultChecklist ?? []).join("\n"));
  const [frameworks, setFrameworks] = useState(
    (initial?.frameworkMappings ?? [])
      .map((m) => `${m.frameworkLabel}: ${m.controlIds.join(", ")}`)
      .join("\n"),
  );

  const handleSave = () => {
    if (!name.trim()) return;
    const parsedFrameworks = frameworks
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [label, controls] = line.split(":");
        return {
          frameworkId: (label || "").trim().toLowerCase().replace(/\s+/g, "-"),
          frameworkLabel: (label || "").trim(),
          controlIds: (controls || "")
            .split(",")
            .map((c) => c.trim())
            .filter(Boolean),
        };
      });
    onSave({
      id: initial?.id ?? `svc-${Date.now()}`,
      name: name.trim(),
      description: description.trim(),
      defaultChecklist: checklist
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean),
      frameworkMappings: parsedFrameworks,
    });
  };

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground">
          {initial ? "Rediger tjeneste" : "Ny tjeneste"}
        </p>
        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={onCancel}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="space-y-2">
        <Label className="text-xs">Navn</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="F.eks. SOC-as-a-Service" />
      </div>
      <div className="space-y-2">
        <Label className="text-xs">Beskrivelse</Label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          placeholder="Kort beskrivelse av tjenesten"
        />
      </div>
      <div className="space-y-2">
        <Label className="text-xs">Sjekklistepunkter (ett per linje)</Label>
        <Textarea
          value={checklist}
          onChange={(e) => setChecklist(e.target.value)}
          rows={4}
          placeholder={"Kick-off\nLeveranse 1\nRapport"}
        />
      </div>
      <div className="space-y-2">
        <Label className="text-xs">Rammeverk-kobling (én per linje: «ISO 27001: A.6.3, A.5.10»)</Label>
        <Textarea
          value={frameworks}
          onChange={(e) => setFrameworks(e.target.value)}
          rows={3}
          placeholder={"ISO 27001: A.6.3, A.5.10\nNIS2: Art.20"}
        />
      </div>
      <div className="flex items-center gap-2 pt-1">
        <Button size="sm" className="h-8 text-xs" onClick={handleSave}>
          Lagre
        </Button>
        <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={onCancel}>
          Avbryt
        </Button>
      </div>
    </Card>
  );
}
