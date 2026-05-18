import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PartnerService } from "@/lib/serviceCatalog";

export function ServiceForm({
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
      ...initial,
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
    } as PartnerService);
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
