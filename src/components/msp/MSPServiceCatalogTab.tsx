import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Sparkles,
  Plus,
  Pencil,
  CheckSquare,
  Shield,
  ShieldCheck,
  Tag,
  X,
  Eye,
  EyeOff,
  ShoppingCart,
} from "lucide-react";
import { ServiceEvidenceSection, totalControlCount, primaryFrameworkId } from "./ServiceEvidenceSection";
import { getFrameworkTheme } from "@/lib/serviceFrameworkTheme";
import { cn } from "@/lib/utils";
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
                Dine egne tjenester, koblet til kontrollpunkter på tvers av ISO 27001, NIS2, AI Act m.fl.
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
        const totalControls = totalControlCount(s.frameworkMappings);
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
                    <Badge
                      variant="outline"
                      className="text-[10px] gap-1"
                      title="Antall leveransepunkter i tjenesten (det du faktisk gjør for kunden)"
                    >
                      <CheckSquare className="h-3 w-3" />
                      {s.defaultChecklist.length} leveransepunkter
                    </Badge>
                    {totalControls > 0 && (
                      <Badge
                        variant="outline"
                        className="text-[10px] gap-1 bg-primary/5 text-primary border-primary/30"
                        title="Antall kontrollpunkter i regelverk denne tjenesten dokumenterer for kunden"
                      >
                        <ShieldCheck className="h-3 w-3" />
                        {totalControls} kontrollpunkter
                      </Badge>
                    )}
                    {(s.price != null || s.priceNote) && (
                      <Badge variant="outline" className="text-[10px] gap-1 bg-success/5 text-success border-success/30">
                        <Tag className="h-3 w-3" />
                        {formatPrice(s)}
                      </Badge>
                    )}
                    <Badge
                      variant="outline"
                      className={
                        s.publishedToCustomers
                          ? "text-[10px] gap-1 bg-primary/5 text-primary border-primary/30"
                          : "text-[10px] gap-1 text-muted-foreground"
                      }
                      title={
                        s.publishedToCustomers
                          ? "Synlig og bestillbar i kundens portal"
                          : "Skjult — kun synlig for deg"
                      }
                    >
                      {s.publishedToCustomers ? (
                        <>
                          <ShoppingCart className="h-3 w-3" />
                          Bestillbar for kunder
                        </>
                      ) : (
                        <>
                          <EyeOff className="h-3 w-3" />
                          Skjult for kunder
                        </>
                      )}
                    </Badge>
                  </div>
                  <p className="text-[13px] text-muted-foreground leading-snug">{s.description}</p>

                  <ServiceEvidenceSection
                    mappings={s.frameworkMappings}
                    onConnect={() => setEditing(s.id)}
                  />
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <label
                    className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-2 py-1.5 cursor-pointer hover:bg-muted/60 transition-colors"
                    title={
                      s.publishedToCustomers
                        ? "Synlig og bestillbar i kundens portal"
                        : "Skjult — kun synlig for deg"
                    }
                  >
                    {s.publishedToCustomers ? (
                      <Eye className="h-3.5 w-3.5 text-primary" />
                    ) : (
                      <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                    <span className="text-[11px] font-medium text-foreground">
                      {s.publishedToCustomers ? "Synlig for kunder" : "Skjult"}
                    </span>
                    <Switch
                      checked={!!s.publishedToCustomers}
                      onCheckedChange={(checked) =>
                        setServices((prev) =>
                          prev.map((x) =>
                            x.id === s.id ? { ...x, publishedToCustomers: checked } : x,
                          ),
                        )
                      }
                    />
                  </label>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 text-xs gap-1.5"
                    onClick={() => setEditing(s.id)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Rediger
                  </Button>
                </div>
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

const PRICE_MODEL_LABEL: Record<NonNullable<PartnerService["priceModel"]>, string> = {
  fixed: "fastpris",
  monthly: "kr/mnd",
  hourly: "kr/time",
  "per-user": "kr/bruker/mnd",
  quote: "etter avtale",
};

function formatPrice(s: PartnerService): string {
  const model = s.priceModel ?? "fixed";
  if (model === "quote") return s.priceNote || "Etter avtale";
  if (s.price == null && !s.priceNote) return "";
  const amount =
    s.price != null ? new Intl.NumberFormat("nb-NO").format(s.price) : "";
  const label = PRICE_MODEL_LABEL[model];
  const base =
    model === "fixed"
      ? amount ? `${amount} kr` : ""
      : amount ? `${amount} ${label}` : label;
  return [base, s.priceNote].filter(Boolean).join(" · ");
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
  const [priceModel, setPriceModel] = useState<NonNullable<PartnerService["priceModel"]>>(
    initial?.priceModel ?? "fixed",
  );
  const [price, setPrice] = useState<string>(
    initial?.price != null ? String(initial.price) : "",
  );
  const [priceNote, setPriceNote] = useState(initial?.priceNote ?? "");

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
    const parsedPrice = price.trim() ? Number(price.replace(/\s/g, "").replace(",", ".")) : undefined;
    onSave({
      id: initial?.id ?? `svc-${Date.now()}`,
      name: name.trim(),
      description: description.trim(),
      defaultChecklist: checklist
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean),
      frameworkMappings: parsedFrameworks,
      priceModel,
      price: Number.isFinite(parsedPrice) ? parsedPrice : undefined,
      priceNote: priceNote.trim() || undefined,
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
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-2">
          <Label className="text-xs">Prismodell</Label>
          <Select
            value={priceModel}
            onValueChange={(v) => setPriceModel(v as NonNullable<PartnerService["priceModel"]>)}
          >
            <SelectTrigger className="h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="fixed">Fastpris (kr)</SelectItem>
              <SelectItem value="monthly">Per måned (kr/mnd)</SelectItem>
              <SelectItem value="hourly">Timepris (kr/time)</SelectItem>
              <SelectItem value="per-user">Per bruker (kr/bruker/mnd)</SelectItem>
              <SelectItem value="quote">Etter avtale</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-xs">Pris (NOK)</Label>
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder={priceModel === "quote" ? "—" : "F.eks. 25 000"}
            disabled={priceModel === "quote"}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label className="text-xs">Prisnotat (valgfritt)</Label>
        <Input
          value={priceNote}
          onChange={(e) => setPriceNote(e.target.value)}
          placeholder="F.eks. «fra 25 000 kr» eller «ekskl. mva»"
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
